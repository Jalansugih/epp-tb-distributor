import { beforeEach, describe, expect, it, vi } from 'vitest';

const { auth, rpc } = vi.hoisted(() => ({
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    updateUser: vi.fn(),
  },
  rpc: vi.fn(),
}));

vi.mock('./supabaseClient', () => ({
  supabase: { auth, rpc },
  isSupabaseConfigured: true,
}));

import { changeMyPassword, profileErrorCode, updateMyFullName } from './auth';

beforeEach(() => {
  vi.clearAllMocks();
  auth.getUser.mockResolvedValue({ data: { user: { email: 'a@b.co' } }, error: null });
  auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
  auth.updateUser.mockResolvedValue({ data: {}, error: null });
  rpc.mockResolvedValue({ data: null, error: null });
});

describe('profileErrorCode', () => {
  it('finds a known code inside an error message', () => {
    expect(profileErrorCode(new Error('NAME_EMPTY'))).toBe('NAME_EMPTY');
    expect(profileErrorCode({ message: 'P0001: PROFILE_NOT_FOUND' })).toBe('PROFILE_NOT_FOUND');
  });
  it('returns null for unknown or missing errors', () => {
    expect(profileErrorCode(new Error('boom'))).toBeNull();
    expect(profileErrorCode(null)).toBeNull();
  });
});

describe('updateMyFullName', () => {
  it('trims, caps at 100 chars and calls the RPC', async () => {
    await updateMyFullName('  ' + 'x'.repeat(150) + '  ');
    expect(rpc).toHaveBeenCalledWith('update_my_full_name', { p_full_name: 'x'.repeat(100) });
  });
  it('rejects an empty name without calling the server', async () => {
    await expect(updateMyFullName('   ')).rejects.toThrow('NAME_EMPTY');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('maps server error codes', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'PROFILE_NOT_FOUND' } });
    await expect(updateMyFullName('Budi')).rejects.toThrow('PROFILE_NOT_FOUND');
  });
});

describe('changeMyPassword', () => {
  it('verifies the current password, then updates', async () => {
    await changeMyPassword('old-password', 'new-password-1');
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.co', password: 'old-password' });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-password-1' });
  });
  it('does not update when the current password is wrong', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: 'invalid_credentials', status: 400, message: 'x' } });
    await expect(changeMyPassword('bad', 'new-password-1')).rejects.toThrow('CURRENT_PASSWORD_WRONG');
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it('does not report network errors as a wrong password', async () => {
    const netErr = { code: 'unexpected_failure', status: 500, message: 'network down' };
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: netErr });
    await expect(changeMyPassword('old', 'new-password-1')).rejects.toBe(netErr);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it('rejects a new password equal to the current one', async () => {
    await expect(changeMyPassword('same-password', 'same-password')).rejects.toThrow('PASSWORD_SAME');
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it('maps the server same_password error', async () => {
    auth.updateUser.mockResolvedValue({ data: {}, error: { code: 'same_password', message: 'x' } });
    await expect(changeMyPassword('old-password', 'new-password-1')).rejects.toThrow('PASSWORD_SAME');
  });
  it('fails when there is no signed-in user', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(changeMyPassword('old', 'new-password-1')).rejects.toThrow('NOT_AUTHENTICATED');
  });
});
