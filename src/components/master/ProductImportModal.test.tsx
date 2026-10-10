import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../context/AppContext', () => ({
  useApp: () => ({
    products: [],
    categories: [{ id: 'c1', name: 'Semen' }],
    brands: [{ id: 'b1', name: 'Merek A' }],
    uoms: [{ id: 'u1', name: 'Sak' }],
    warehouses: [{ id: 'w1', name: 'Gudang Utama' }],
    importProducts: vi.fn(),
  }),
}));

import { ProductImportModal } from './ProductImportModal';

describe('ProductImportModal', () => {
  it('renders the initial state without crashing', () => {
    const html = renderToString(<ProductImportModal onClose={() => undefined} />);
    expect(html).toContain('Upload Massal Katalog Produk');
    expect(html).toContain('Unduh Template');
    expect(html).toContain('Pilih File CSV');
    // Import button is disabled until a valid file is loaded.
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Impor<\/button>/);
  });
});
