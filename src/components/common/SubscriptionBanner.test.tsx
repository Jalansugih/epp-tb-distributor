// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const auth = vi.hoisted(() => ({ profile: null as Record<string, unknown> | null }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ profile: auth.profile }) }));

import { SubscriptionBanner } from './SubscriptionBanner';

const admin = { role: 'Admin', is_super_admin: false, plan_name: 'The Manager', access_ends_at: '2026-11-01T00:00:00Z' };

afterEach(() => {
  cleanup();
  auth.profile = null;
});

describe('SubscriptionBanner', () => {
  it('reminds a company admin during the trial', () => {
    auth.profile = { ...admin, subscription_state: 'trial', days_left: 12 };
    render(<SubscriptionBanner />);
    expect(screen.getByRole('status').textContent).toContain('Masa trial berakhir 12 hari lagi');
  });

  it('warns an admin in the last days of a paid subscription', () => {
    auth.profile = { ...admin, subscription_state: 'active', days_left: 3 };
    render(<SubscriptionBanner />);
    expect(screen.getByRole('status').textContent).toContain('paket The Manager berakhir 3 hari lagi');
  });

  it('stays hidden when nothing needs attention, for staff, and for the platform owner', () => {
    auth.profile = { ...admin, subscription_state: 'active', days_left: 30 };
    render(<SubscriptionBanner />);
    expect(screen.queryByRole('status')).toBeNull();
    cleanup();

    auth.profile = { ...admin, role: 'User', subscription_state: 'trial', days_left: 2 };
    render(<SubscriptionBanner />);
    expect(screen.queryByRole('status')).toBeNull();
    cleanup();

    auth.profile = { ...admin, is_super_admin: true, subscription_state: 'trial', days_left: 2 };
    render(<SubscriptionBanner />);
    expect(screen.queryByRole('status')).toBeNull();
  });
});
