import {
  Customer,
  Supplier,
  Product,
  Category,
  Brand,
  Uom,
  PriceList,
  DiscountRule,
  PaymentTerm,
  Salesperson,
  Warehouse,
  SalesOrder,
  PurchaseOrder,
  GoodsReceipt,
  PurchaseRequest,
  PurchaseInvoice,
  SupplierPayment,
  StockMovement,
  StockTransfer,
  StockAdjustment,
  BatchSerialItem,
  Receivable,
  Payable,
  JournalEntry,
  NotificationItem
} from '../types';

export const mockPaymentTerms: PaymentTerm[] = [
  { id: 'pt-1', code: 'COD', name: 'Cash On Delivery', days: 0, description: 'Pembayaran tunai saat barang diterima' },
  { id: 'pt-2', code: 'NET14', name: '14 Hari', days: 14, description: 'Jatuh tempo 14 hari sejak faktur terbit' },
  { id: 'pt-3', code: 'NET30', name: '30 Hari (Default)', days: 30, description: 'Jatuh tempo 30 hari sejak faktur terbit', isDefault: true },
  { id: 'pt-4', code: 'NET45', name: '45 Hari', days: 45, description: 'Jatuh tempo 45 hari sejak faktur terbit' },
  { id: 'pt-5', code: 'NET7', name: '7 Hari (Fast Pay)', days: 7, description: 'Jatuh tempo 7 hari dengan potongan diskon khusus' },
  { id: 'pt-6', code: 'NET60', name: '60 Hari (Project)', days: 60, description: 'Khusus kontraktor & proyek skala besar' },
  {
    id: 'pt-7',
    code: 'INST-30-70',
    name: '30% Langsung, 70% setelah 30 Hari',
    days: 30,
    description: 'DP 30% dibayar tunai saat order, 70% sisa 30 hari',
    isCustomInstallment: true,
    installmentDetails: '30% DP Pembayaran Awal, 70% Pelunasan 30 Hari',
    schedules: [
      { installmentNumber: 1, percentage: 30, dueDays: 0, description: 'DP Pembayaran Awal' },
      { installmentNumber: 2, percentage: 70, dueDays: 30, description: 'Pelunasan Akhir' }
    ]
  }
];

export const mockCustomers: Customer[] = [
  {
    id: 'cust-101',
    code: 'CUST-001',
    name: 'Toko Bangunan Makmur Jaya',
    group: 'Toko Retail Besar',
    phone: '021-5582910',
    email: 'makmurjaya@gmail.com',
    address: 'Jl. Daan Mogot No. 142, Kalideres',
    city: 'Jakarta Barat',
    salespersonId: 'sp-1',
    salespersonName: 'Budi Santoso',
    creditLimit: 250000000,
    usedCredit: 145000000,
    paymentTermId: 'pt-3',
    paymentTermName: '30 Hari (Default)',
    taxNumber: '01.234.567.8-012.000',
    status: 'active',
    createdAt: '2025-03-15'
  },
  {
    id: 'cust-102',
    code: 'CUST-002',
    name: 'Toko Sinar Rejeki Bangunan',
    group: 'Toko Sub-Distributor',
    phone: '021-8842109',
    email: 'sinarrejeki.tb@yahoo.com',
    address: 'Jl. Raya Serpong No. 88',
    city: 'Tangerang',
    salespersonId: 'sp-2',
    salespersonName: 'Rina Wijaya',
    creditLimit: 180000000,
    usedCredit: 92000000,
    paymentTermId: 'pt-2',
    paymentTermName: '14 Hari',
    taxNumber: '02.987.654.3-015.000',
    status: 'active',
    createdAt: '2025-05-20'
  },
  {
    id: 'cust-103',
    code: 'CUST-003',
    name: 'Toko Bangunan Subur Indah',
    group: 'Toko Retail Besar',
    phone: '021-8201928',
    email: 'suburindah.bekasi@gmail.com',
    address: 'Jl. Ir. H. Juanda No. 55',
    city: 'Bekasi',
    salespersonId: 'sp-1',
    salespersonName: 'Budi Santoso',
    creditLimit: 300000000,
    usedCredit: 210000000,
    paymentTermId: 'pt-3',
    paymentTermName: '30 Hari (Default)',
    taxNumber: '03.111.222.3-018.000',
    status: 'active',
    createdAt: '2025-01-10'
  },
  {
    id: 'cust-104',
    code: 'CUST-004',
    name: 'PT Wijaya Konstruksi Utama',
    group: 'Kontraktor Project',
    phone: '021-7201122',
    email: 'procurement@wijayakonstruksi.co.id',
    address: 'Gedung Wisma 46 Lt. 12',
    city: 'Jakarta Pusat',
    salespersonId: 'sp-3',
    salespersonName: 'Hendrik Pratama',
    creditLimit: 1000000000,
    usedCredit: 540000000,
    paymentTermId: 'pt-6',
    paymentTermName: '60 Hari (Project)',
    taxNumber: '01.999.888.7-021.000',
    status: 'active',
    createdAt: '2024-11-05'
  },
  {
    id: 'cust-105',
    code: 'CUST-005',
    name: 'Toko Depo Bangunan Prima',
    group: 'Toko Sub-Distributor',
    phone: '021-7720911',
    email: 'depoprima@depokbangunan.com',
    address: 'Jl. Margonda Raya No. 310',
    city: 'Depok',
    salespersonId: 'sp-2',
    salespersonName: 'Rina Wijaya',
    creditLimit: 200000000,
    usedCredit: 48000000,
    paymentTermId: 'pt-1',
    paymentTermName: 'Cash On Delivery',
    status: 'active',
    createdAt: '2025-07-01'
  }
];

export const mockSuppliers: Supplier[] = [
  {
    id: 'sup-201',
    code: 'SUP-001',
    name: 'PT Indocement Tunggal Prakarsa Tbk',
    category: 'Pabrik Semen',
    phone: '021-2512121',
    email: 'sales@indocement.co.id',
    address: 'Wisma Indocement Lt. 8, Jl. Jend. Sudirman',
    city: 'Jakarta Selatan',
    contactPerson: 'Pak Hendra (Marketing Manager)',
    paymentTermId: 'pt-3',
    paymentTermName: '30 Hari (Default)',
    outstandingPayable: 180000000,
    bankAccount: 'BCA A/C 088-332-1100 (PT Indocement)',
    status: 'active',
    createdAt: '2024-01-01'
  },
  {
    id: 'sup-202',
    code: 'SUP-002',
    name: 'PT Krakatau Steel (Persero) Tbk',
    category: 'Pabrik Besi & Baja',
    phone: '0254-392111',
    email: 'marketing@krakatausteel.com',
    address: 'Kawasan Industri Krakatau Steel',
    city: 'Cilegon',
    contactPerson: 'Ibu Anita (Sales Director)',
    paymentTermId: 'pt-4',
    paymentTermName: '45 Hari',
    outstandingPayable: 140000000,
    bankAccount: 'Mandiri A/C 120-009-8877 (PT Krakatau Steel)',
    status: 'active',
    createdAt: '2024-02-15'
  },
  {
    id: 'sup-203',
    code: 'SUP-003',
    name: 'PT Avia Avian Tbk',
    category: 'Pabrik Cat & Kimia',
    phone: '031-8921820',
    email: 'order@avianbrands.com',
    address: 'Jl. Raya Sidoarjo No. 108',
    city: 'Sidoarjo',
    contactPerson: 'Pak Gunawan',
    paymentTermId: 'pt-3',
    paymentTermName: '30 Hari (Default)',
    outstandingPayable: 50000000,
    bankAccount: 'BCA A/C 011-882-9933 (PT Avia Avian)',
    status: 'active',
    createdAt: '2024-04-10'
  },
  {
    id: 'sup-204',
    code: 'SUP-004',
    name: 'PT Roman Ceramic International',
    category: 'Pabrik Keramik & Granit',
    phone: '021-5801920',
    email: 'sales@romanceramic.com',
    address: 'Kawasan Industri Balaraja No. 45',
    city: 'Tangerang',
    contactPerson: 'Pak Rudy',
    paymentTermId: 'pt-3',
    paymentTermName: '30 Hari (Default)',
    outstandingPayable: 0,
    bankAccount: 'BCA A/C 220-334-5511 (PT Roman Ceramic)',
    status: 'active',
    createdAt: '2024-06-01'
  },
  {
    id: 'sup-205',
    code: 'SUP-005',
    name: 'PT Rucika Indonesia',
    category: 'Pabrik Pipa & Fitting PVC',
    phone: '021-8902233',
    email: 'distributor@rucika.co.id',
    address: 'Kawasan Industri MM2100',
    city: 'Cikarang',
    contactPerson: 'Pak Frans',
    paymentTermId: 'pt-2',
    paymentTermName: '14 Hari',
    outstandingPayable: 0,
    bankAccount: 'BNI A/C 099-123-4567 (PT Rucika)',
    status: 'active',
    createdAt: '2024-08-12'
  }
];

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    code: 'SEM-PCC-50',
    sku: 'SKU-TRD-001',
    barcode: '8991001234567',
    name: 'Semen Tiga Roda PCC 50kg',
    category: 'Semen & Binder',
    brand: 'Tiga Roda',
    series: 'PCC Extra Power',
    uom: 'Sak',
    purchaseUom: 'Pallet',
    salesUom: 'Sak',
    conversionRatio: 50,
    buyPrice: 65000,
    sellPrice: 74000,
    stock: 2400,
    minStock: 500,
    minOrder: 10,
    serialNumberRequired: false,
    batchNumberRequired: true,
    taxPercent: 11,
    warehouseId: 'wh-1',
    warehouseName: 'Gudang Utama Cengkareng',
    status: 'active',
    defaultDiscounts: [
      { id: 'd1', sequence: 1, type: 'percentage', value: 10, label: 'Diskon Agen Tier 1' },
      { id: 'd2', sequence: 2, type: 'percentage', value: 3, label: 'Diskon Tonase Volume' },
      { id: 'd3', sequence: 3, type: 'fixed', value: 1000, label: 'Potongan Cash In' }
    ]
  },
  {
    id: 'prod-2',
    code: 'BES-POL-10',
    sku: 'SKU-KS-010',
    barcode: '8992002345678',
    name: 'Besi Beton Polos 10mm SNI (12m)',
    category: 'Besi & Steel Construction',
    brand: 'Krakatau Steel',
    series: 'SNI TP 280',
    uom: 'Batang',
    purchaseUom: 'Ikatan',
    salesUom: 'Batang',
    conversionRatio: 50,
    buyPrice: 71000,
    sellPrice: 82000,
    stock: 1800,
    minStock: 400,
    minOrder: 20,
    serialNumberRequired: false,
    batchNumberRequired: true,
    taxPercent: 11,
    warehouseId: 'wh-1',
    warehouseName: 'Gudang Utama Cengkareng',
    status: 'active',
    defaultDiscounts: [
      { id: 'd1', sequence: 1, type: 'percentage', value: 8, label: 'Diskon Pabrik KS' },
      { id: 'd2', sequence: 2, type: 'percentage', value: 2, label: 'Diskon Pembayaran 14 Hari' }
    ]
  },
  {
    id: 'prod-3',
    code: 'BES-ULI-13',
    sku: 'SKU-KS-013',
    barcode: '8992002345685',
    name: 'Besi Beton Ulir 13mm SNI (12m)',
    category: 'Besi & Steel Construction',
    brand: 'Krakatau Steel',
    series: 'SNI TS 420',
    uom: 'Batang',
    purchaseUom: 'Ikatan',
    salesUom: 'Batang',
    conversionRatio: 50,
    buyPrice: 122000,
    sellPrice: 139000,
    stock: 1250,
    minStock: 300,
    minOrder: 10,
    serialNumberRequired: false,
    batchNumberRequired: true,
    taxPercent: 11,
    warehouseId: 'wh-1',
    warehouseName: 'Gudang Utama Cengkareng',
    status: 'active'
  },
  {
    id: 'prod-4',
    code: 'CAT-AVI-25',
    sku: 'SKU-AVI-025',
    barcode: '8993003456789',
    name: 'Cat Tembok Avitex Putih 25kg (Pail)',
    category: 'Cat Tembok & Kimia Bangunan',
    brand: 'Avian',
    series: 'Avitex Exterior/Interior',
    uom: 'Pail',
    purchaseUom: 'Blek',
    salesUom: 'Pail',
    conversionRatio: 1,
    buyPrice: 560000,
    sellPrice: 640000,
    stock: 350,
    minStock: 80,
    minOrder: 2,
    serialNumberRequired: false,
    batchNumberRequired: true,
    taxPercent: 11,
    warehouseId: 'wh-2',
    warehouseName: 'Gudang Cabang Surabaya',
    status: 'active',
    defaultDiscounts: [
      { id: 'd1', sequence: 1, type: 'percentage', value: 12, label: 'Diskon Distributor' },
      { id: 'd2', sequence: 2, type: 'percentage', value: 5, label: 'Bonus Toko Prima' }
    ]
  },
  {
    id: 'prod-5',
    code: 'CAT-DUL-20',
    sku: 'SKU-DUL-020',
    barcode: '8993003456792',
    name: 'Cat Dulux Weathershield 20L',
    category: 'Cat Tembok & Kimia Bangunan',
    brand: 'Dulux',
    series: 'Weathershield Max',
    uom: 'Pail',
    buyPrice: 1580000,
    sellPrice: 1790000,
    stock: 120,
    minStock: 40,
    minOrder: 1,
    taxPercent: 11,
    warehouseId: 'wh-1',
    warehouseName: 'Gudang Utama Cengkareng',
    status: 'active'
  },
  {
    id: 'prod-6',
    code: 'KER-ROM-40',
    sku: 'SKU-ROM-040',
    barcode: '8994004567890',
    name: 'Keramik Roman 40x40 Bianco Glossy',
    category: 'Keramik & Granit Tile',
    brand: 'Roman Tile',
    series: 'dBologna Series',
    uom: 'Dus',
    purchaseUom: 'Pallet',
    salesUom: 'Dus',
    conversionRatio: 80,
    buyPrice: 75000,
    sellPrice: 88000,
    stock: 3200,
    minStock: 600,
    minOrder: 5,
    taxPercent: 11,
    warehouseId: 'wh-1',
    warehouseName: 'Gudang Utama Cengkareng',
    status: 'active'
  },
  {
    id: 'prod-7',
    code: 'PIP-RUC-3AW',
    sku: 'SKU-RUC-003',
    barcode: '8995005678901',
    name: 'Pipa PVC Rucika 3 Inch AW (4m)',
    category: 'Pipa & Plumbing System',
    brand: 'Rucika',
    series: 'Standard AW High Pressure',
    uom: 'Batang',
    buyPrice: 110000,
    sellPrice: 128000,
    stock: 850,
    minStock: 200,
    minOrder: 5,
    taxPercent: 11,
    warehouseId: 'wh-1',
    warehouseName: 'Gudang Utama Cengkareng',
    status: 'active'
  },
  {
    id: 'prod-8',
    code: 'SNG-CAP-03',
    sku: 'SKU-CAP-003',
    barcode: '8996006789012',
    name: 'Seng Gelombang Cap Gajah 0.3mm x 1.8m',
    category: 'Atap, Seng & Baja Ringan',
    brand: 'Cap Gajah',
    series: 'Galvanis Anti Karat',
    uom: 'Lembar',
    buyPrice: 48000,
    sellPrice: 56000,
    stock: 140, // Low stock alert!
    minStock: 300,
    minOrder: 10,
    taxPercent: 11,
    warehouseId: 'wh-1',
    warehouseName: 'Gudang Utama Cengkareng',
    status: 'active'
  },
  {
    id: 'prod-9',
    code: 'BAT-RIN-10',
    sku: 'SKU-HBL-010',
    barcode: '8997007890123',
    name: 'Bata Ringan Hebel 10cm Grade A',
    category: 'Bata Ringan & Mortar',
    brand: 'AAC Hebel',
    series: 'Autoclaved Aerated Concrete',
    uom: 'm3',
    purchaseUom: 'Pallet',
    salesUom: 'm3',
    conversionRatio: 1.8,
    buyPrice: 570000,
    sellPrice: 650000,
    stock: 450,
    minStock: 100,
    minOrder: 10,
    taxPercent: 11,
    warehouseId: 'wh-1',
    warehouseName: 'Gudang Utama Cengkareng',
    status: 'active'
  }
];

export const mockCategories: Category[] = [
  { id: 'cat-1', code: 'CAT-SEM', name: 'Semen & Binder', parentCategory: 'Bahan Bangunan Utama', totalProducts: 12, totalStockValue: 180000000, status: 'active' },
  { id: 'cat-2', code: 'CAT-BES', name: 'Besi & Steel Construction', parentCategory: 'Bahan Bangunan Utama', totalProducts: 28, totalStockValue: 340000000, status: 'active' },
  { id: 'cat-3', code: 'CAT-CAT', name: 'Cat Tembok & Kimia Bangunan', parentCategory: 'Finishing & Interior', totalProducts: 45, totalStockValue: 220000000, status: 'active' },
  { id: 'cat-4', code: 'CAT-KER', name: 'Keramik & Granit Tile', parentCategory: 'Finishing & Interior', totalProducts: 60, totalStockValue: 280000000, status: 'active' },
  { id: 'cat-5', code: 'CAT-PIP', name: 'Pipa & Plumbing System', parentCategory: 'Sanitari & Pipa', totalProducts: 34, totalStockValue: 120000000, status: 'active' },
  { id: 'cat-6', code: 'CAT-ATP', name: 'Atap, Seng & Baja Ringan', parentCategory: 'Bahan Bangunan Utama', totalProducts: 18, totalStockValue: 95000000, status: 'active' },
  { id: 'cat-7', code: 'CAT-BAT', name: 'Bata Ringan & Mortar', parentCategory: 'Bahan Bangunan Utama', totalProducts: 15, totalStockValue: 160000000, status: 'active' }
];

export const mockBrands: Brand[] = [
  { id: 'br-1', code: 'BR-TRD', name: 'Tiga Roda', supplierName: 'PT Indocement Tunggal Prakarsa Tbk', totalProducts: 8, originCountry: 'Indonesia', status: 'active' },
  { id: 'br-2', code: 'BR-KKS', name: 'Krakatau Steel', supplierName: 'PT Krakatau Steel (Persero) Tbk', totalProducts: 14, originCountry: 'Indonesia', status: 'active' },
  { id: 'br-3', code: 'BR-AVI', name: 'Avian', supplierName: 'PT Avia Avian Tbk', totalProducts: 22, originCountry: 'Indonesia', status: 'active' },
  { id: 'br-4', code: 'BR-DUL', name: 'Dulux', supplierName: 'PT AkzoNobel Decorative Coatings', totalProducts: 18, originCountry: 'Netherlands / ID', status: 'active' },
  { id: 'br-5', code: 'BR-ROM', name: 'Roman Tile', supplierName: 'PT Roman Ceramic International', totalProducts: 35, originCountry: 'Indonesia', status: 'active' },
  { id: 'br-6', code: 'BR-RUC', name: 'Rucika', supplierName: 'PT Rucika Indonesia', totalProducts: 26, originCountry: 'Indonesia', status: 'active' },
  { id: 'br-7', code: 'BR-HBL', name: 'AAC Hebel', supplierName: 'PT Superior Prima Sukses', totalProducts: 6, originCountry: 'Indonesia', status: 'active' }
];

export const mockUoms: Uom[] = [
  {
    id: 'uom-1',
    code: 'SAK',
    name: 'Sak 50kg / 40kg',
    baseUnit: 'Piece',
    conversions: [
      { id: 'uc-1', fromUnit: '1 Pallet', toUnit: '50 Sak', multiplier: 50, description: '1 Pallet Kayu semen = 50 Sak' },
      { id: 'uc-2', fromUnit: '1 Ton', toUnit: '20 Sak (50kg)', multiplier: 20, description: '1 Ton semen sak 50kg = 20 Sak' }
    ],
    status: 'active'
  },
  {
    id: 'uom-2',
    code: 'BTG',
    name: 'Batang 12m / 4m',
    baseUnit: 'Piece',
    conversions: [
      { id: 'uc-3', fromUnit: '1 Ikatan Besi', toUnit: '50 Batang', multiplier: 50, description: '1 Bundel / Ikatan besi = 50 Batang' }
    ],
    status: 'active'
  },
  {
    id: 'uom-3',
    code: 'DUS',
    name: 'Dus / Karton',
    baseUnit: 'Piece',
    conversions: [
      { id: 'uc-4', fromUnit: '1 Box Keramik', toUnit: '10 Pieces Tile', multiplier: 10, description: '1 Box / Dus keramik 40x40 = 10 Lembar tile' }
    ],
    status: 'active'
  },
  {
    id: 'uom-4',
    code: 'PAIL',
    name: 'Pail / Blek 20L - 25kg',
    baseUnit: 'Piece',
    conversions: [
      { id: 'uc-5', fromUnit: '1 Blek', toUnit: '1 Pail (25kg)', multiplier: 1, description: '1 Blek cat industri = 1 Pail 25kg' }
    ],
    status: 'active'
  },
  {
    id: 'uom-5',
    code: 'PALLET',
    name: 'Pallet Kayu / Plastik',
    baseUnit: 'Pallet',
    conversions: [
      { id: 'uc-6', fromUnit: '1 Pallet', toUnit: '50 Sak', multiplier: 50, description: '1 Pallet = 50 Sak Semen' },
      { id: 'uc-7', fromUnit: '1 Pallet Hebel', toUnit: '1.8 m3', multiplier: 1.8, description: '1 Pallet bata ringan = 1.8 meter kubik' }
    ],
    status: 'active'
  },
  {
    id: 'uom-6',
    code: 'DOZEN',
    name: 'Lusin (12 Pcs)',
    baseUnit: 'Piece',
    conversions: [
      { id: 'uc-8', fromUnit: '1 Dozen', toUnit: '12 Pieces', multiplier: 12, description: '1 Lusin kran / fitting = 12 Biji' }
    ],
    status: 'active'
  }
];

export const mockPriceLists: PriceList[] = [
  {
    id: 'pl-1',
    code: 'PL-RETAIL',
    name: 'Retail',
    description: 'Daftar harga standar untuk toko retail kecil dan pembelian tunai umum',
    isDefault: true,
    status: 'active',
    items: [
      { productId: 'prod-1', productCode: 'SEM-PCC-50', productName: 'Semen Tiga Roda PCC 50kg', basePrice: 65000, priceListPrice: 74000, marginPercent: 13.8 },
      { productId: 'prod-2', productCode: 'BES-POL-10', productName: 'Besi Beton Polos 10mm SNI', basePrice: 71000, priceListPrice: 82000, marginPercent: 15.5 },
      { productId: 'prod-4', productCode: 'CAT-AVI-25', productName: 'Cat Tembok Avitex Putih 25kg', basePrice: 560000, priceListPrice: 640000, marginPercent: 14.2 }
    ]
  },
  {
    id: 'pl-2',
    code: 'PL-DEALER',
    name: 'Dealer',
    description: 'Daftar harga khusus toko mitra berlangganan dengan omset mingguan',
    status: 'active',
    items: [
      { productId: 'prod-1', productCode: 'SEM-PCC-50', productName: 'Semen Tiga Roda PCC 50kg', basePrice: 65000, priceListPrice: 71000, marginPercent: 9.2 },
      { productId: 'prod-2', productCode: 'BES-POL-10', productName: 'Besi Beton Polos 10mm SNI', basePrice: 71000, priceListPrice: 78000, marginPercent: 9.8 },
      { productId: 'prod-4', productCode: 'CAT-AVI-25', productName: 'Cat Tembok Avitex Putih 25kg', basePrice: 560000, priceListPrice: 610000, marginPercent: 8.9 }
    ]
  },
  {
    id: 'pl-3',
    code: 'PL-DISTRIB',
    name: 'Distributor',
    description: 'Daftar harga khusus grosir & sub-distributor kabupaten / kota',
    status: 'active',
    items: [
      { productId: 'prod-1', productCode: 'SEM-PCC-50', productName: 'Semen Tiga Roda PCC 50kg', basePrice: 65000, priceListPrice: 68500, marginPercent: 5.3 },
      { productId: 'prod-2', productCode: 'BES-POL-10', productName: 'Besi Beton Polos 10mm SNI', basePrice: 71000, priceListPrice: 75000, marginPercent: 5.6 },
      { productId: 'prod-4', productCode: 'CAT-AVI-25', productName: 'Cat Tembok Avitex Putih 25kg', basePrice: 560000, priceListPrice: 590000, marginPercent: 5.3 }
    ]
  },
  {
    id: 'pl-4',
    code: 'PL-SPECIAL',
    name: 'Special Customer',
    description: 'Daftar harga kontrak khusus proyek BUMN / kontraktor utama',
    status: 'active',
    items: [
      { productId: 'prod-1', productCode: 'SEM-PCC-50', productName: 'Semen Tiga Roda PCC 50kg', basePrice: 65000, priceListPrice: 67000, marginPercent: 3.0 },
      { productId: 'prod-3', productCode: 'BES-ULI-13', productName: 'Besi Beton Ulir 13mm SNI', basePrice: 122000, priceListPrice: 128000, marginPercent: 4.9 },
      { productId: 'prod-9', productCode: 'BAT-RIN-10', productName: 'Bata Ringan Hebel 10cm', basePrice: 570000, priceListPrice: 600000, marginPercent: 5.2 }
    ]
  }
];

export const mockDiscountRules: DiscountRule[] = [
  {
    id: 'dr-1',
    code: 'DR-BULK-SEM',
    name: 'Diskon Volume Semen > 200 Sak',
    type: 'percentage',
    value: 5,
    minQty: 200,
    maxQty: 2000,
    customerGroup: 'Toko Sub-Distributor',
    productId: 'prod-1',
    productName: 'Semen Tiga Roda PCC 50kg',
    startDate: '2026-08-01',
    endDate: '2026-12-31',
    priority: 1,
    sequence: 1,
    status: 'active'
  },
  {
    id: 'dr-2',
    code: 'DR-PROMO-AVIAN',
    name: 'Promo Cat Avian Q3 Cashback Rp 10,000 / Pail',
    type: 'fixed',
    value: 10000,
    minQty: 10,
    maxQty: 100,
    categoryId: 'cat-3',
    categoryName: 'Cat Tembok & Kimia Bangunan',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    priority: 2,
    sequence: 2,
    status: 'active'
  },
  {
    id: 'dr-3',
    code: 'DR-VIP-PROJECT',
    name: 'Diskon Kontrak VIP Project BUMN',
    type: 'percentage',
    value: 3,
    minQty: 50,
    customerGroup: 'Kontraktor Project',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    priority: 1,
    sequence: 1,
    status: 'active'
  }
];

export const mockSalespersons: Salesperson[] = [
  { id: 'sp-1', code: 'SP-001', name: 'Budi Santoso', email: 'budi.s@distribuerp.co.id', phone: '0812-8899-1001', targetRevenue: 1500000000, currentRevenue: 1240000000, commissionRate: 1.5, customerCount: 18, status: 'active' },
  { id: 'sp-2', code: 'SP-002', name: 'Rina Wijaya', email: 'rina.w@distribuerp.co.id', phone: '0813-7722-2002', targetRevenue: 1200000000, currentRevenue: 980000000, commissionRate: 1.5, customerCount: 14, status: 'active' },
  { id: 'sp-3', code: 'SP-003', name: 'Hendrik Pratama', email: 'hendrik.p@distribuerp.co.id', phone: '0811-9933-3003', targetRevenue: 2500000000, currentRevenue: 2150000000, commissionRate: 2.0, customerCount: 8, status: 'active' },
  { id: 'sp-4', code: 'SP-004', name: 'Siti Rahma', email: 'siti.r@distribuerp.co.id', phone: '0815-4455-4004', targetRevenue: 1000000000, currentRevenue: 820000000, commissionRate: 1.25, customerCount: 12, status: 'active' }
];

export const mockWarehouses: Warehouse[] = [
  { id: 'wh-1', code: 'GDG-01', name: 'Gudang Utama Cengkareng', type: 'Gudang Utama', address: 'Kawasan Industri Daan Mogot Km 14 No. 88, Jakarta Barat', manager: 'Supriatna', phone: '021-5439120', capacitySqM: 5000, currentStockCount: 14200, status: 'active' },
  { id: 'wh-2', code: 'GDG-02', name: 'Gudang Cabang Surabaya', type: 'Gudang Cabang', address: 'Kawasan Industri Rungkut Industri III No. 12, Surabaya', manager: 'Joko Susilo', phone: '031-8921102', capacitySqM: 3200, currentStockCount: 8500, status: 'active' },
  { id: 'wh-3', code: 'GDG-03', name: 'Gudang Transit Marunda', type: 'Gudang Transit', address: 'Kawasan Pelabuhan Marunda Center, Bekasi', manager: 'Aris Munandar', phone: '021-8892100', capacitySqM: 2000, currentStockCount: 3100, status: 'active' }
];

export const mockSalesOrders: SalesOrder[] = [
  {
    id: 'so-001',
    code: 'SO/2026/08/0102',
    date: '2026-08-11',
    dueDate: '2026-09-10',
    customerId: 'cust-101',
    customerName: 'Toko Bangunan Makmur Jaya',
    salespersonName: 'Budi Santoso',
    paymentTermName: '30 Hari (Default)',
    items: [
      {
        productId: 'prod-1',
        productCode: 'SEM-PCC-50',
        productName: 'Semen Tiga Roda PCC 50kg',
        uom: 'Sak',
        qty: 500,
        unitPrice: 74000,
        discounts: [
          { id: 'd1', sequence: 1, type: 'percentage', value: 10, label: 'Diskon Toko Retail' },
          { id: 'd2', sequence: 2, type: 'percentage', value: 3, label: 'Diskon Volume >200 Sak' },
          { id: 'd3', sequence: 3, type: 'fixed', value: 1000, label: 'Cash In' }
        ],
        subtotal: 31761000 // calculated compound
      },
      {
        productId: 'prod-2',
        productCode: 'BES-POL-10',
        productName: 'Besi Beton Polos 10mm SNI (12m)',
        uom: 'Batang',
        qty: 200,
        unitPrice: 82000,
        discounts: [
          { id: 'd1', sequence: 1, type: 'percentage', value: 8, label: 'Diskon Khusus' }
        ],
        subtotal: 15088000
      }
    ],
    globalDiscounts: [
      { id: 'g1', sequence: 1, type: 'percentage', value: 2, label: 'Diskon Tambahan Promo Bulan Ini' }
    ],
    subtotal: 46849000,
    discountTotal: 8900000,
    taxAmount: 5053890,
    totalAmount: 50980000,
    status: 'Completed',
    paymentStatus: 'Partial',
    paidAmount: 20000000,
    deliveryStatus: 'Delivered',
    notes: 'Pengiriman via Truk Fuso B 9812 WQ'
  },
  {
    id: 'so-002',
    code: 'SO/2026/08/0103',
    date: '2026-08-12',
    dueDate: '2026-08-26',
    customerId: 'cust-102',
    customerName: 'Toko Sinar Rejeki Bangunan',
    salespersonName: 'Rina Wijaya',
    paymentTermName: '14 Hari',
    items: [
      {
        productId: 'prod-4',
        productCode: 'CAT-AVI-25',
        productName: 'Cat Tembok Avitex Putih 25kg (Pail)',
        uom: 'Pail',
        qty: 30,
        unitPrice: 640000,
        discounts: [
          { id: 'd1', sequence: 1, type: 'percentage', value: 12, label: 'Diskon Avian Tier 1' }
        ],
        subtotal: 16896000
      }
    ],
    subtotal: 16896000,
    discountTotal: 2304000,
    taxAmount: 1858560,
    totalAmount: 18754560,
    status: 'Approved',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    deliveryStatus: 'Pending',
    notes: 'Kirim besok pagi sebelum jam 10.00'
  },
  {
    id: 'so-003',
    code: 'SO/2026/08/0104',
    date: '2026-08-12',
    dueDate: '2026-10-11',
    customerId: 'cust-104',
    customerName: 'PT Wijaya Konstruksi Utama',
    salespersonName: 'Hendrik Pratama',
    paymentTermName: '60 Hari (Project)',
    items: [
      {
        productId: 'prod-3',
        productCode: 'BES-ULI-13',
        productName: 'Besi Beton Ulir 13mm SNI (12m)',
        uom: 'Batang',
        qty: 500,
        unitPrice: 139000,
        discounts: [
          { id: 'd1', sequence: 1, type: 'percentage', value: 5, label: 'Kontrak Project' }
        ],
        subtotal: 66025000
      },
      {
        productId: 'prod-9',
        productCode: 'BAT-RIN-10',
        productName: 'Bata Ringan Hebel 10cm Grade A',
        uom: 'm3',
        qty: 80,
        unitPrice: 650000,
        discounts: [
          { id: 'd1', sequence: 1, type: 'percentage', value: 4, label: 'Diskon Volume' }
        ],
        subtotal: 49920000
      }
    ],
    subtotal: 115945000,
    discountTotal: 5555000,
    taxAmount: 12753950,
    totalAmount: 128698950,
    status: 'Processing',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    deliveryStatus: 'Shipped',
    notes: 'Lokasi proyek: Apt BSD Tower B'
  },
  {
    id: 'so-004',
    code: 'SO/2026/08/0105',
    date: '2026-08-12',
    dueDate: '2026-08-27',
    customerId: 'cust-103',
    customerName: 'Toko Bangunan Subur Indah',
    salespersonName: 'Budi Santoso',
    paymentTermName: '14 Hari',
    items: [
      {
        productId: 'prod-1',
        productCode: 'SEM-PCC-50',
        productName: 'Semen Tiga Roda PCC 50kg',
        uom: 'Sak',
        qty: 300,
        unitPrice: 74000,
        discounts: [
          { id: 'd1', sequence: 1, type: 'percentage', value: 10, label: 'Diskon Tier 1' },
          { id: 'd2', sequence: 2, type: 'percentage', value: 5, label: 'Diskon Cash 14 Hari' }
        ],
        subtotal: 18999000
      }
    ],
    subtotal: 18999000,
    discountTotal: 3201000,
    taxAmount: 2089890,
    totalAmount: 21088890,
    status: 'Submitted',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    deliveryStatus: 'Pending',
    requiresApproval: true,
    approvalReason: 'Piutang Toko Berjalan (Rp 160.000.000) Telah Memenuhi Plafon Kredit Rp 150.000.000',
    notes: 'Mohon ACC Direksi untuk Over Limit Credit'
  }
];

export const mockQuotations: any[] = [
  {
    id: 'sq-001',
    code: 'SQ/2026/08/0012',
    date: '2026-08-11',
    validUntil: '2026-08-25',
    customerId: 'cust-101',
    customerName: 'Toko Bangunan Makmur Jaya',
    salespersonName: 'Budi Santoso',
    paymentTermName: '30 Hari (Default)',
    items: [
      {
        productId: 'prod-1',
        productCode: 'SEM-PCC-50',
        productName: 'Semen Tiga Roda PCC 50kg',
        uom: 'Sak',
        qty: 500,
        unitPrice: 74000,
        discounts: [
          { id: 'd1', sequence: 1, type: 'percentage', value: 10, label: 'Tier 1' },
          { id: 'd2', sequence: 2, type: 'percentage', value: 5, label: 'Promo Agustus' }
        ],
        subtotal: 31635000
      }
    ],
    subtotal: 31635000,
    taxAmount: 3479850,
    totalAmount: 35114850,
    status: 'Sent',
    notes: 'Penawaran Khusus Proyek Ruko Daan Mogot'
  },
  {
    id: 'sq-002',
    code: 'SQ/2026/08/0013',
    date: '2026-08-10',
    validUntil: '2026-08-24',
    customerId: 'cust-105',
    customerName: 'Toko Abadi Material',
    salespersonName: 'Rina Wijaya',
    paymentTermName: 'Cash (Tunai)',
    items: [
      {
        productId: 'prod-5',
        productCode: 'PIP-RUC-04',
        productName: 'Pipa PVC Rucika AW 4 inci (4m)',
        uom: 'Batang',
        qty: 100,
        unitPrice: 195000,
        discounts: [
          { id: 'd1', sequence: 1, type: 'percentage', value: 8, label: 'Diskon Rucika' }
        ],
        subtotal: 17940000
      }
    ],
    subtotal: 17940000,
    taxAmount: 1973400,
    totalAmount: 19913400,
    status: 'Accepted',
    notes: 'Toko siap kirim setelah DP 50%'
  }
];

export const mockDeliveries: any[] = [
  {
    id: 'sj-001',
    code: 'SJ/2026/08/0201',
    soCode: 'SO/2026/08/0102',
    date: '2026-08-11',
    customerId: 'cust-101',
    customerName: 'Toko Bangunan Makmur Jaya',
    address: 'Jl. Daan Mogot No. 142, Kalideres, Jakarta Barat',
    driverName: 'Sudarsono (Truk CDD B 9812 WQ)',
    vehicleNo: 'B 9812 WQ',
    warehouseName: 'Gudang Utama Cengkareng',
    items: [
      { productId: 'prod-1', productCode: 'SEM-PCC-50', productName: 'Semen Tiga Roda PCC 50kg', uom: 'Sak', qty: 500 },
      { productId: 'prod-2', productCode: 'BES-POL-10', productName: 'Besi Beton Polos 10mm SNI', uom: 'Batang', qty: 200 }
    ],
    status: 'Delivered',
    deliveredAt: '2026-08-11 15:30',
    receiverName: 'Pak Budi (Pemilik Toko)',
    notes: 'Sudah diterima bersih dan tidak ada semen pecah'
  },
  {
    id: 'sj-002',
    code: 'SJ/2026/08/0202',
    soCode: 'SO/2026/08/0104',
    date: '2026-08-12',
    customerId: 'cust-104',
    customerName: 'PT Wijaya Konstruksi Utama',
    address: 'Apt BSD Tower B, Serpong, Tangerang Selatan',
    driverName: 'Bambang (Tronton B 9022 UY)',
    vehicleNo: 'B 9022 UY',
    warehouseName: 'Gudang Utama Cengkareng',
    items: [
      { productId: 'prod-3', productCode: 'BES-ULI-13', productName: 'Besi Beton Ulir 13mm SNI', uom: 'Batang', qty: 500 },
      { productId: 'prod-9', productCode: 'BAT-RIN-10', productName: 'Bata Ringan Hebel 10cm', uom: 'm3', qty: 80 }
    ],
    status: 'In Transit',
    notes: 'Sedang dalam perjalanan ke lokasi proyek BSD'
  }
];

export const mockInvoices: any[] = [
  {
    id: 'inv-001',
    code: 'INV/2026/08/0450',
    soCode: 'SO/2026/08/0102',
    sjCode: 'SJ/2026/08/0201',
    date: '2026-08-11',
    dueDate: '2026-09-10',
    customerId: 'cust-101',
    customerName: 'Toko Bangunan Makmur Jaya',
    salespersonName: 'Budi Santoso',
    items: [
      { productId: 'prod-1', productCode: 'SEM-PCC-50', productName: 'Semen Tiga Roda PCC 50kg', uom: 'Sak', qty: 500, unitPrice: 74000, discounts: [{ id: 'd1', sequence: 1, type: 'percentage', value: 10, label: 'Tier 1' }, { id: 'd2', sequence: 2, type: 'percentage', value: 5, label: 'Vol' }], subtotal: 31761000 },
      { productId: 'prod-2', productCode: 'BES-POL-10', productName: 'Besi Beton Polos 10mm SNI', uom: 'Batang', qty: 200, unitPrice: 82000, discounts: [{ id: 'd1', sequence: 1, type: 'percentage', value: 8, label: 'Khusus' }], subtotal: 15088000 }
    ],
    subtotal: 46849000,
    taxAmount: 5053890,
    totalAmount: 50980000,
    paidAmount: 20000000,
    remainingAmount: 30980000,
    paymentStatus: 'Partial',
    status: 'Issued'
  }
];

export const mockPayments: any[] = [
  {
    id: 'pay-001',
    code: 'PAY/2026/08/0088',
    date: '2026-08-11',
    customerId: 'cust-101',
    customerName: 'Toko Bangunan Makmur Jaya',
    invoiceNo: 'INV/2026/08/0450',
    paymentMethod: 'Transfer Bank',
    bankName: 'BCA A/C 088-291-8899',
    referenceNo: 'TRF-BCA-992102',
    amount: 20000000,
    notes: 'Pelunasan bertahap Termin 1'
  }
];

export const mockReceivables: Receivable[] = [
  {
    id: 'ar-1',
    invoiceNo: 'INV/2026/08/0450',
    soCode: 'SO/2026/08/0102',
    customerId: 'cust-101',
    customerCode: 'CUST-001',
    customerName: 'Toko Bangunan Makmur Jaya',
    invoiceDate: '2026-08-11',
    dueDate: '2026-09-10',
    total: 50980000,
    amount: 50980000,
    paid: 20000000,
    paidAmount: 20000000,
    outstanding: 30980000,
    remainingAmount: 30980000,
    status: 'Partial',
    agingBucket: 'Current',
    notes: 'Sisa Rp 30.980.000 jatuh tempo 10 September'
  },
  {
    id: 'ar-2',
    invoiceNo: 'INV/2026/07/0310',
    soCode: 'SO/2026/07/0088',
    customerId: 'cust-103',
    customerCode: 'CUST-003',
    customerName: 'Toko Bangunan Subur Indah',
    invoiceDate: '2026-07-05',
    dueDate: '2026-08-04',
    total: 160000000,
    amount: 160000000,
    paid: 0,
    paidAmount: 0,
    outstanding: 160000000,
    remainingAmount: 160000000,
    status: 'Overdue',
    agingBucket: '1–30 Days',
    notes: 'Overdue 8 hari, sudah difollowup Sales Budi'
  }
];

export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'pr-001',
    code: 'PR/2026/08/0010',
    date: '2026-08-08',
    requesterName: 'Supriatna (Kepala Gudang)',
    department: 'Warehouse & Logistics',
    warehouseName: 'Gudang Utama Cengkareng',
    priority: 'Urgent',
    supplierId: 'sup-201',
    supplierName: 'PT Indocement Tunggal Prakarsa Tbk',
    items: [
      { productId: 'prod-1', productCode: 'SEM-PCC-50', productName: 'Semen Tiga Roda PCC 50kg', uom: 'Sak', qty: 1000, estimatedPrice: 65000 }
    ],
    status: 'Converted',
    notes: 'Restock mendesak karena permintaan proyekBSD meningkat'
  },
  {
    id: 'pr-002',
    code: 'PR/2026/08/0011',
    date: '2026-08-11',
    requesterName: 'Andi Prasetyo (Purchasing Specialist)',
    department: 'Procurement',
    warehouseName: 'Gudang Utama Cengkareng',
    priority: 'Normal',
    supplierId: 'sup-203',
    supplierName: 'PT Avia Avian Tbk',
    items: [
      { productId: 'prod-4', productCode: 'CAT-AVI-25', productName: 'Cat Tembok Avitex Putih 25kg (Pail)', uom: 'Pail', qty: 150, estimatedPrice: 560000 }
    ],
    status: 'Approved',
    notes: 'Persediaan cat untuk promo kemerdekaan'
  }
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-001',
    code: 'PO/2026/08/0055',
    date: '2026-08-10',
    dueDate: '2026-09-09',
    supplierId: 'sup-201',
    supplierNumber: 'SUP-001',
    supplierName: 'PT Indocement Tunggal Prakarsa Tbk',
    address: 'Wisma Indocement Lt. 8, Jl. Jend. Sudirman, Jakarta Selatan',
    warehouseName: 'Gudang Utama Cengkareng',
    paymentTermId: 'pt-3',
    paymentTermName: '30 Hari (Default)',
    buyerName: 'Andi Prasetyo',
    items: [
      {
        productId: 'prod-1',
        productCode: 'SEM-PCC-50',
        productName: 'Semen Tiga Roda PCC 50kg',
        uom: 'Sak',
        qty: 1000,
        unitPrice: 65000,
        discounts: [
          { id: 'pd1', sequence: 1, type: 'percentage', value: 8, label: 'Diskon Principal Pabrik' },
          { id: 'pd2', sequence: 2, type: 'fixed', value: 500, label: 'Subsidi Ongkir Pabrik' }
        ],
        netPrice: 59300,
        subtotal: 59300000
      }
    ],
    subtotal: 59300000,
    taxAmount: 6523000,
    totalAmount: 65823000,
    status: 'Received',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    receiptStatus: 'Full',
    notes: 'Kirim via Armada Kontainer Pabrik'
  },
  {
    id: 'po-002',
    code: 'PO/2026/08/0056',
    date: '2026-08-11',
    dueDate: '2026-09-25',
    supplierId: 'sup-202',
    supplierNumber: 'SUP-002',
    supplierName: 'PT Krakatau Steel (Persero) Tbk',
    address: 'Kawasan Industri Krakatau Steel, Cilegon',
    warehouseName: 'Gudang Utama Cengkareng',
    paymentTermId: 'pt-4',
    paymentTermName: '45 Hari',
    buyerName: 'Andi Prasetyo',
    items: [
      {
        productId: 'prod-2',
        productCode: 'BES-POL-10',
        productName: 'Besi Beton Polos 10mm SNI (12m)',
        uom: 'Batang',
        qty: 1000,
        unitPrice: 71000,
        discounts: [
          { id: 'pd1', sequence: 1, type: 'percentage', value: 5, label: 'Diskon Kontrak Alokasi' }
        ],
        netPrice: 67450,
        subtotal: 67450000
      }
    ],
    subtotal: 67450000,
    taxAmount: 7419500,
    totalAmount: 74869500,
    status: 'Sent',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    receiptStatus: 'Pending',
    notes: 'Jadwal Muat Pabrik Cilegon Tgl 14 Aug'
  },
  {
    id: 'po-003',
    code: 'PO/2026/08/0057',
    date: '2026-08-12',
    dueDate: '2026-09-11',
    supplierId: 'sup-203',
    supplierNumber: 'SUP-003',
    supplierName: 'PT Avia Avian Tbk',
    address: 'Jl. Raya Sidoarjo No. 108, Sidoarjo',
    warehouseName: 'Gudang Utama Cengkareng',
    paymentTermId: 'pt-7',
    paymentTermName: '30% Langsung, 70% setelah 30 Hari',
    buyerName: 'Maya Indah',
    items: [
      {
        productId: 'prod-4',
        productCode: 'CAT-AVI-25',
        productName: 'Cat Tembok Avitex Putih 25kg (Pail)',
        uom: 'Pail',
        qty: 100,
        unitPrice: 560000,
        discounts: [
          { id: 'pd1', sequence: 1, type: 'percentage', value: 10, label: 'Diskon Avian Distributor' },
          { id: 'pd2', sequence: 2, type: 'percentage', value: 2, label: 'Diskon Early Payment' }
        ],
        netPrice: 493920,
        subtotal: 49392000
      }
    ],
    subtotal: 49392000,
    taxAmount: 5433120,
    totalAmount: 54825120,
    status: 'Draft',
    paymentStatus: 'Unpaid',
    paidAmount: 0,
    receiptStatus: 'Pending',
    notes: 'Termin DP 30% dibayar saat order disetujui'
  }
];

export const mockGoodsReceipts: GoodsReceipt[] = [
  {
    id: 'gr-001',
    code: 'GR/2026/08/0101',
    poCode: 'PO/2026/08/0055',
    date: '2026-08-11 14:00',
    supplierName: 'PT Indocement Tunggal Prakarsa Tbk',
    warehouseName: 'Gudang Utama Cengkareng',
    receivedBy: 'Supriatna (Gudang Utama)',
    items: [
      { productId: 'prod-1', productCode: 'SEM-PCC-50', productName: 'Semen Tiga Roda PCC 50kg', uom: 'Sak', qtyOrdered: 1000, qtyReceived: 1000, batchNo: 'LOT-3R-202608' }
    ],
    status: 'Stored',
    notes: 'Barang datang dalam kondisi baik, 1000 sak semen utuh'
  }
];

export const mockPurchaseInvoices: PurchaseInvoice[] = [
  {
    id: 'pinv-001',
    code: 'PINV/2026/08/0200',
    poCode: 'PO/2026/08/0055',
    grCode: 'GR/2026/08/0101',
    supplierInvoiceNo: 'INV-SUP/2026/07/99',
    date: '2026-07-15',
    dueDate: '2026-08-14',
    supplierId: 'sup-201',
    supplierName: 'PT Indocement Tunggal Prakarsa Tbk',
    paymentTermName: '30 Hari (Default)',
    items: [
      { productId: 'prod-1', productCode: 'SEM-PCC-50', productName: 'Semen Tiga Roda PCC 50kg', uom: 'Sak', qty: 1000, unitPrice: 65000, discounts: [{ id: 'pd1', sequence: 1, type: 'percentage', value: 8, label: 'Pabrik' }], subtotal: 59800000 }
    ],
    subtotal: 59800000,
    taxAmount: 6578000,
    totalAmount: 180000000,
    paidAmount: 50000000,
    remainingAmount: 130000000,
    paymentStatus: 'Partially Paid',
    status: 'Issued',
    notes: 'Faktur Tagihan Semen Juli'
  },
  {
    id: 'pinv-002',
    code: 'PINV/2026/08/0201',
    poCode: 'PO/2026/08/0056',
    supplierInvoiceNo: 'INV-SUP/2026/07/110',
    date: '2026-07-02',
    dueDate: '2026-08-16',
    supplierId: 'sup-202',
    supplierName: 'PT Krakatau Steel (Persero) Tbk',
    paymentTermName: '45 Hari',
    items: [
      { productId: 'prod-2', productCode: 'BES-POL-10', productName: 'Besi Beton Polos 10mm SNI', uom: 'Batang', qty: 1000, unitPrice: 71000, discounts: [{ id: 'pd1', sequence: 1, type: 'percentage', value: 5, label: 'Diskon' }], subtotal: 67450000 }
    ],
    subtotal: 67450000,
    taxAmount: 7419500,
    totalAmount: 140000000,
    paidAmount: 0,
    remainingAmount: 140000000,
    paymentStatus: 'Unpaid',
    status: 'Issued',
    notes: 'Pasokan Besi Beton Cilegon'
  },
  {
    id: 'pinv-003',
    code: 'PINV/2026/06/0150',
    poCode: 'PO/2026/06/0010',
    supplierInvoiceNo: 'INV-SUP/2026/06/045',
    date: '2026-06-25',
    dueDate: '2026-07-25',
    supplierId: 'sup-203',
    supplierName: 'PT Avia Avian Tbk',
    paymentTermName: '30 Hari (Default)',
    items: [
      { productId: 'prod-4', productCode: 'CAT-AVI-25', productName: 'Cat Tembok Avitex Putih 25kg', uom: 'Pail', qty: 100, unitPrice: 560000, discounts: [], subtotal: 56000000 }
    ],
    subtotal: 56000000,
    taxAmount: 6160000,
    totalAmount: 50000000,
    paidAmount: 0,
    remainingAmount: 50000000,
    paymentStatus: 'Overdue',
    status: 'Issued',
    notes: 'Faktur Cat Avitex Juni (Jatuh tempo 25 Juli)'
  }
];

export const mockPayables: Payable[] = [
  {
    id: 'ap-1',
    invoiceNo: 'INV-SUP/2026/07/99',
    poCode: 'PO/2026/08/0055',
    supplierId: 'sup-201',
    supplierNumber: 'SUP-001',
    supplierName: 'PT Indocement Tunggal Prakarsa Tbk',
    invoiceDate: '2026-07-15',
    dueDate: '2026-08-14',
    total: 180000000,
    amount: 180000000,
    paid: 50000000,
    paidAmount: 50000000,
    outstanding: 130000000,
    remainingAmount: 130000000,
    status: 'Partially Paid',
    agingBucket: 'Current',
    notes: 'Faktur Semen Tiga Roda - Sisa 130jt Jatuh Tempo 14 Ags'
  },
  {
    id: 'ap-2',
    invoiceNo: 'INV-SUP/2026/07/110',
    poCode: 'PO/2026/08/0056',
    supplierId: 'sup-202',
    supplierNumber: 'SUP-002',
    supplierName: 'PT Krakatau Steel (Persero) Tbk',
    invoiceDate: '2026-07-02',
    dueDate: '2026-08-16',
    total: 140000000,
    amount: 140000000,
    paid: 0,
    paidAmount: 0,
    outstanding: 140000000,
    remainingAmount: 140000000,
    status: 'Unpaid',
    agingBucket: 'Current',
    notes: 'Besi Beton SNI Cilegon - Jatuh Tempo 16 Ags'
  },
  {
    id: 'ap-3',
    invoiceNo: 'INV-SUP/2026/06/045',
    poCode: 'PO/2026/06/0010',
    supplierId: 'sup-203',
    supplierNumber: 'SUP-003',
    supplierName: 'PT Avia Avian Tbk',
    invoiceDate: '2026-06-25',
    dueDate: '2026-07-25',
    total: 50000000,
    amount: 50000000,
    paid: 0,
    paidAmount: 0,
    outstanding: 50000000,
    remainingAmount: 50000000,
    status: 'Overdue',
    agingBucket: '1–30 Days',
    notes: 'Terlambat 18 hari, perlu dijadwalkan pelunasan'
  },
  {
    id: 'ap-4',
    invoiceNo: 'INV-SUP/2026/05/012',
    poCode: 'PO/2026/05/0002',
    supplierId: 'sup-204',
    supplierNumber: 'SUP-004',
    supplierName: 'PT Roman Ceramic International',
    invoiceDate: '2026-05-10',
    dueDate: '2026-06-10',
    total: 35000000,
    amount: 35000000,
    paid: 10000000,
    paidAmount: 10000000,
    outstanding: 25000000,
    remainingAmount: 25000000,
    status: 'Overdue',
    agingBucket: '61–90 Days',
    notes: 'Sisa klaim keramik pecah transit'
  }
];

export const mockSupplierPayments: SupplierPayment[] = [
  {
    id: 'spay-001',
    paymentNumber: 'SPAY/2026/08/0010',
    code: 'SPAY/2026/08/0010',
    date: '2026-08-01',
    supplierId: 'sup-201',
    supplierName: 'PT Indocement Tunggal Prakarsa Tbk',
    invoice: 'INV-SUP/2026/07/99',
    invoiceNo: 'INV-SUP/2026/07/99',
    paymentMethod: 'Bank Transfer',
    amount: 50000000,
    reference: 'TRF-MANDIRI-881920',
    referenceNo: 'TRF-MANDIRI-881920',
    notes: 'Pembayaran DP Termin 1 Semen Tiga Roda'
  },
  {
    id: 'spay-002',
    paymentNumber: 'SPAY/2026/08/0011',
    code: 'SPAY/2026/08/0011',
    date: '2026-08-05',
    supplierId: 'sup-204',
    supplierName: 'PT Roman Ceramic International',
    invoice: 'INV-SUP/2026/05/012',
    invoiceNo: 'INV-SUP/2026/05/012',
    paymentMethod: 'Cash',
    amount: 10000000,
    reference: 'BKK-00821',
    referenceNo: 'BKK-00821',
    notes: 'Pembayaran Kasir Kantor Keramik'
  }
];

export const mockStockMovements: StockMovement[] = [
  {
    id: 'sm-1',
    date: '2026-08-12 09:30',
    documentNo: 'SJ/2026/08/0201',
    referenceNo: 'SJ/2026/08/0201',
    productCode: 'SEM-PCC-50',
    productName: 'Semen Tiga Roda PCC 50kg',
    type: 'Sales',
    warehouseName: 'Gudang Utama Cengkareng',
    qtyIn: 0,
    qtyOut: 500,
    qty: 500,
    balance: 2400,
    uom: 'Sak',
    batchNo: 'LOT-3R-202608',
    user: 'Supriatna (Gudang)',
    operator: 'Supriatna (Gudang)',
    notes: 'Pengiriman Toko Bangunan Makmur Jaya'
  },
  {
    id: 'sm-2',
    date: '2026-08-11 14:15',
    documentNo: 'GR/2026/08/0101',
    referenceNo: 'GR/2026/08/0101',
    productCode: 'SEM-PCC-50',
    productName: 'Semen Tiga Roda PCC 50kg',
    type: 'Purchase',
    warehouseName: 'Gudang Utama Cengkareng',
    qtyIn: 1000,
    qtyOut: 0,
    qty: 1000,
    balance: 2900,
    uom: 'Sak',
    batchNo: 'LOT-3R-202608',
    user: 'Supriatna (Gudang)',
    operator: 'Supriatna (Gudang)',
    notes: 'Penerimaan Pabrik Indocement'
  },
  {
    id: 'sm-3',
    date: '2026-08-10 11:00',
    documentNo: 'TRF/2026/08/001',
    referenceNo: 'TRF/2026/08/001',
    productCode: 'BES-POL-10',
    productName: 'Besi Beton Polos 10mm SNI',
    type: 'Transfer',
    warehouseName: 'Gudang Cabang Surabaya',
    qtyIn: 200,
    qtyOut: 0,
    qty: 200,
    balance: 1800,
    uom: 'Batang',
    batchNo: 'KS-HEAT-992',
    user: 'Joko (Surabaya)',
    operator: 'Joko (Surabaya)',
    notes: 'Transfer masuk dari Gudang Cengkareng'
  },
  {
    id: 'sm-4',
    date: '2026-08-09 16:20',
    documentNo: 'ADJ/2026/08/005',
    referenceNo: 'ADJ/2026/08/005',
    productCode: 'CAT-AVI-25',
    productName: 'Cat Tembok Avitex Putih 25kg (Pail)',
    type: 'Adjustment',
    warehouseName: 'Gudang Cabang Surabaya',
    qtyIn: 0,
    qtyOut: 2,
    qty: 2,
    balance: 350,
    uom: 'Pail',
    batchNo: 'AVN-202607-B',
    user: 'Bambang (Gudang)',
    operator: 'Bambang (Gudang)',
    notes: 'Penyesuaian Opname: 2 Pail bocor saat penataan racking'
  },
  {
    id: 'sm-5',
    date: '2026-08-01 08:00',
    documentNo: 'INIT-2026',
    referenceNo: 'INIT-2026',
    productCode: 'PIP-RUC-3AW',
    productName: 'Pipa PVC Rucika 3 Inch AW (4m)',
    type: 'Opening Balance',
    warehouseName: 'Gudang Utama Cengkareng',
    qtyIn: 850,
    qtyOut: 0,
    qty: 850,
    balance: 850,
    uom: 'Batang',
    batchNo: 'LOT-RUC-2026',
    user: 'Admin System',
    operator: 'Admin System',
    notes: 'Saldo Awal Tahun Anggaran 2026'
  },
  {
    id: 'sm-6',
    date: '2026-08-05 10:30',
    documentNo: 'RET/2026/08/002',
    referenceNo: 'RET/2026/08/002',
    productCode: 'KER-ROM-40',
    productName: 'Keramik Roman 40x40 Bianco Glossy',
    type: 'Return',
    warehouseName: 'Gudang Utama Cengkareng',
    qtyIn: 15,
    qtyOut: 0,
    qty: 15,
    balance: 3200,
    uom: 'Dus',
    batchNo: 'ROM-4040-A2',
    user: 'Rudi (Gudang)',
    operator: 'Rudi (Gudang)',
    notes: 'Retur sisa proyek Toko Sinar Rejeki'
  }
];

export const mockStockTransfers: StockTransfer[] = [
  {
    id: 'trf-1',
    transferNo: 'TRF/2026/08/001',
    date: '2026-08-10',
    fromWarehouseId: 'wh-1',
    fromWarehouseName: 'Gudang Utama Cengkareng',
    toWarehouseId: 'wh-2',
    toWarehouseName: 'Gudang Cabang Surabaya',
    driverName: 'Eko Raharjo (Truk Box B 9210 UX)',
    vehicleNo: 'B 9210 UX',
    items: [
      { productId: 'prod-2', productCode: 'BES-POL-10', productName: 'Besi Beton Polos 10mm SNI', uom: 'Batang', qty: 200, batchNo: 'KS-HEAT-992' },
      { productId: 'prod-1', productCode: 'SEM-PCC-50', productName: 'Semen Tiga Roda PCC 50kg', uom: 'Sak', qty: 150, batchNo: 'LOT-3R-202608' }
    ],
    status: 'In Transit',
    createdUser: 'Supriatna (Head WH Cengkareng)',
    notes: 'Pengiriman mutasi stok kebutuhan pameran Surabaya'
  },
  {
    id: 'trf-2',
    transferNo: 'TRF/2026/08/002',
    date: '2026-08-11',
    fromWarehouseId: 'wh-1',
    fromWarehouseName: 'Gudang Utama Cengkareng',
    toWarehouseId: 'wh-3',
    toWarehouseName: 'Gudang Proyek BSD City',
    driverName: 'Sujono (Truk Fuso B 9811 PQ)',
    vehicleNo: 'B 9811 PQ',
    items: [
      { productId: 'prod-3', productCode: 'BES-ULI-13', productName: 'Besi Beton Ulir 13mm SNI', uom: 'Batang', qty: 300, batchNo: 'KS-HEAT-104' },
      { productId: 'prod-9', productCode: 'BAT-RIN-10', productName: 'Bata Ringan Hebel 10cm Grade A', uom: 'm3', qty: 40 }
    ],
    status: 'Approved',
    createdUser: 'Andi Prasetyo',
    notes: 'Persiapan alokasi proyek Apt BSD Tower B'
  },
  {
    id: 'trf-3',
    transferNo: 'TRF/2026/08/003',
    date: '2026-08-05',
    fromWarehouseId: 'wh-2',
    fromWarehouseName: 'Gudang Cabang Surabaya',
    toWarehouseId: 'wh-1',
    toWarehouseName: 'Gudang Utama Cengkareng',
    driverName: 'Santoso',
    vehicleNo: 'L 8092 AB',
    items: [
      { productId: 'prod-4', productCode: 'CAT-AVI-25', productName: 'Cat Tembok Avitex Putih 25kg (Pail)', uom: 'Pail', qty: 50, batchNo: 'AVN-202607-A' }
    ],
    status: 'Completed',
    createdUser: 'Joko (Surabaya)',
    notes: 'Transfer konsolidasi stok cat Avitex selesai diterima'
  }
];

export const mockStockAdjustments: StockAdjustment[] = [
  {
    id: 'adj-1',
    adjustmentNo: 'ADJ/2026/08/005',
    date: '2026-08-09',
    type: 'Decrease',
    warehouseId: 'wh-2',
    warehouseName: 'Gudang Cabang Surabaya',
    productId: 'prod-4',
    productCode: 'CAT-AVI-25',
    productName: 'Cat Tembok Avitex Putih 25kg (Pail)',
    uom: 'Pail',
    qty: 2,
    reason: 'Kerusakan / Bocor Penataan Racking',
    reference: 'BA-KERUSAKAN-082',
    user: 'Bambang (Supervisor Gudang)',
    notes: '2 Pail cat Avitex bocor tertimpa pallet di rak C-04'
  },
  {
    id: 'adj-2',
    adjustmentNo: 'ADJ/2026/08/006',
    date: '2026-08-10',
    type: 'Increase',
    warehouseId: 'wh-1',
    warehouseName: 'Gudang Utama Cengkareng',
    productId: 'prod-6',
    productCode: 'KER-ROM-40',
    productName: 'Keramik Roman 40x40 Bianco Glossy',
    uom: 'Dus',
    qty: 10,
    reason: 'Selisih Lebih Opname Fisik',
    reference: 'SO-OPNAME-AUG26',
    user: 'Supriatna (Head WH)',
    notes: 'Ditemukan 10 dus keramik terselip di lorong B4 setelah stock opname'
  }
];

export const mockBatchSerials: BatchSerialItem[] = [
  {
    id: 'bs-1',
    productId: 'prod-1',
    productCode: 'SEM-PCC-50',
    productName: 'Semen Tiga Roda PCC 50kg',
    batchNumber: 'LOT-3R-202608',
    lotNumber: 'LOT-3R-202608',
    expiryDate: '2027-08-01',
    warehouseName: 'Gudang Utama Cengkareng',
    qty: 1800,
    uom: 'Sak',
    status: 'Available'
  },
  {
    id: 'bs-2',
    productId: 'prod-1',
    productCode: 'SEM-PCC-50',
    productName: 'Semen Tiga Roda PCC 50kg',
    batchNumber: 'LOT-3R-202607',
    lotNumber: 'LOT-3R-202607',
    expiryDate: '2026-09-01',
    warehouseName: 'Gudang Utama Cengkareng',
    qty: 600,
    uom: 'Sak',
    status: 'Near Expiry'
  },
  {
    id: 'bs-3',
    productId: 'prod-4',
    productCode: 'CAT-AVI-25',
    productName: 'Cat Tembok Avitex Putih 25kg (Pail)',
    batchNumber: 'AVN-202607-A',
    lotNumber: 'BATCH-AVN-0192',
    expiryDate: '2028-07-15',
    warehouseName: 'Gudang Cabang Surabaya',
    qty: 350,
    uom: 'Pail',
    status: 'Available'
  },
  {
    id: 'bs-4',
    productId: 'prod-3',
    productCode: 'BES-ULI-13',
    productName: 'Besi Beton Ulir 13mm SNI (12m)',
    batchNumber: 'KS-HEAT-992',
    serialNumber: 'SNI-KS-8819201',
    lotNumber: 'HEAT-NO-99201',
    expiryDate: '2030-12-31',
    warehouseName: 'Gudang Utama Cengkareng',
    qty: 1250,
    uom: 'Batang',
    status: 'Available'
  }
];


export const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Stok Menipis Alert',
    message: 'Seng Gelombang Cap Gajah tinggal 140 Lembar (Batas min: 300)',
    time: '10 menit yang lalu',
    type: 'warning',
    read: false
  },
  {
    id: 'n2',
    title: 'Pembayaran Diterima',
    message: 'Toko Bangunan Makmur Jaya membayar Rp20.000.000 via B transfer',
    time: '1 jam yang lalu',
    type: 'success',
    read: false
  },
  {
    id: 'n3',
    title: 'Piutang Jatuh Tempo',
    message: 'Faktur Toko Bangunan Subur Indah Rp160.000.000 telah overdue >30 hari',
    time: '3 jam yang lalu',
    type: 'danger',
    read: false
  }
];

export const mockChartOfAccounts = [
  { code: '1101-01', name: 'Kas Kasir / Brankas Kantor', type: 'Asset', balance: 45000000 },
  { code: '1102-01', name: 'Bank BCA Operational (A/C 088-291-8899)', type: 'Asset', balance: 185000000 },
  { code: '1102-02', name: 'Bank Mandiri GIRO (A/C 120-001-2299)', type: 'Asset', balance: 200000000 },
  { code: '1103-01', name: 'Piutang Usaha Toko Retail (AR)', type: 'Asset', balance: 540000000 },
  { code: '1104-01', name: 'Persediaan Bahan Bangunan', type: 'Asset', balance: 820000000 },
  { code: '2101-01', name: 'Hutang Dagang Pabrik (AP)', type: 'Liability', balance: 320000000 },
  { code: '4101-01', name: 'Penjualan Material Bangunan', type: 'Revenue', balance: 1850000000 },
  { code: '5101-01', name: 'HPP / Harga Pokok Penjualan', type: 'Expense', balance: 1420000000 },
  { code: '6101-01', name: 'Bebas Angkut & Pengiriman Truk', type: 'Expense', balance: 65000000 }
];
