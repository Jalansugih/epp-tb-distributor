export type ViewMode = 
  | 'dashboard'
  | 'sales-quotations'
  | 'sales-orders'
  | 'sales-deliveries'
  | 'sales-invoices'
  | 'sales-receivables'
  | 'sales-payments'
  | 'purchase-requests'
  | 'purchase-orders'
  | 'purchase-receipts'
  | 'purchase-invoices'
  | 'purchase-payables'
  | 'purchase-payments'
  | 'purchase-aging'
  | 'inventory-overview'
  | 'inventory-stock'
  | 'inventory-movement'
  | 'inventory-transfer'
  | 'inventory-adjustment'
  | 'inventory-gr'
  | 'inventory-delivery'
  | 'inventory-warehouses'
  | 'inventory-batch'
  | 'inventory-reports'
  | 'finance-cashbank'
  | 'finance-receivables'
  | 'finance-payables'
  | 'finance-chart-accounts'
  | 'finance-journal'
  | 'finance-ledger'
  | 'finance-pnl'
  | 'finance-balance'
  | 'master-customers'
  | 'master-suppliers'
  | 'master-products'
  | 'master-categories'
  | 'master-brands'
  | 'master-uom'
  | 'master-pricelists'
  | 'master-paymentterms'
  | 'master-salespersons'
  | 'master-warehouses'
  | 'master-discountrules'
  | 'reports-sales'
  | 'reports-purchase'
  | 'reports-inventory'
  | 'reports-ar-aging'
  | 'reports-ap-aging'
  | 'reports-customer'
  | 'reports-product'
  | 'reports-salesperson'
  | 'reports-profit'
  | 'documents'
  | 'settings';

export type Language = 'id' | 'en';

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details?: string;
}

// Sequential Discount Item
export interface DiscountItem {
  id: string;
  sequence: number;
  type: 'percentage' | 'fixed';
  value: number; // e.g. 10 for 10%, or 1000 for Rp1.000
  label?: string; // e.g. "Distributor Tier 1", "Cash Discount"
  calculatedAmount?: number;
}

export interface PaymentTermSchedule {
  installmentNumber: number;
  percentage: number; // e.g. 30
  dueDays: number; // e.g. 0 (immediately) or 30
  description: string; // e.g. "DP Pembayaran Awal"
}

export interface PaymentTerm {
  id: string;
  code: string;
  name: string;
  days: number;
  description: string;
  isCustomInstallment?: boolean;
  installmentDetails?: string; // e.g., "30% Immediately, 70% in 30 days"
  schedules?: PaymentTermSchedule[];
  isDefault?: boolean;
  status?: 'active' | 'inactive';
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  group: string; // 'Toko Sub-Distributor', 'Toko Retail Besar', 'Kontraktor Project'
  phone: string;
  email?: string;
  address: string;
  city: string;
  salespersonId: string;
  salespersonName: string;
  creditLimit: number;
  usedCredit: number; // Outstanding
  outstanding?: number;
  outstandingAR?: number;
  paymentTermId: string;
  paymentTermName: string;
  taxNumber?: string;
  status: 'active' | 'suspended';
  createdAt?: string;
  type?: string;
  joinDate?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  category: string; // 'Pabrik Semen', 'Pabrik Besi & Baja', 'Pabrik Cat', 'Pabrik Keramik'
  phone: string;
  email?: string;
  address: string;
  city: string;
  contactPerson: string;
  paymentTermId: string;
  paymentTermName: string;
  outstandingPayable?: number;
  outstandingAP?: number;
  bankAccount?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
}

export interface Product {
  id: string;
  code: string; // Product Code
  sku: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  series?: string;
  uom: string; // Base UoM e.g., Sak, Batang, Blek, Dus, Lembar
  purchaseUom?: string; // e.g. Pallet or Ton
  salesUom?: string; // e.g. Sak
  conversionRatio?: number; // e.g. 1 Pallet = 50 Sak
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  minOrder?: number;
  weightKg?: number;
  serialNumberRequired?: boolean;
  batchNumberRequired?: boolean;
  taxPercent?: number; // e.g. 11
  warehouseId: string;
  warehouseName: string;
  warehouses?: any[];
  uomConversions?: any[];
  status?: 'active' | 'inactive' | 'discontinued';
  defaultDiscounts?: DiscountItem[];
  categoryName?: string;
  brandName?: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentCategory?: string;
  totalProducts: number;
  totalStockValue: number;
  subcategoriesCount?: number;
  productCount?: number;
  status: 'active' | 'inactive';
}

export interface Brand {
  id: string;
  code: string;
  name: string;
  supplierName: string;
  country?: string;
  totalProducts: number;
  productCount?: number;
  originCountry: string;
  status: 'active' | 'inactive';
}

export interface UomConversion {
  id: string;
  fromUnit: string; // e.g., "1 Box"
  toUnit: string; // e.g., "10 Pieces"
  multiplier: number; // 10
  description: string;
}

export interface Uom {
  id: string;
  code: string;
  name: string;
  symbol?: string;
  description?: string;
  baseUnit: string;
  conversions: UomConversion[];
  status: 'active' | 'inactive';
}

export interface PriceListItem {
  productId: string;
  productCode: string;
  productName: string;
  basePrice: number;
  priceListPrice: number;
  marginPercent: number;
  price?: number;
}

export interface PriceList {
  id: string;
  code: string;
  name: 'Retail' | 'Dealer' | 'Distributor' | 'Special Customer' | string;
  description: string;
  isDefault?: boolean;
  status: 'active' | 'inactive';
  items: PriceListItem[];
  customerGroupTarget?: string;
  currency?: string;
}

export interface DiscountRule {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number; // e.g. 10 or 5000
  minQty: number;
  maxQty?: number;
  customerGroup?: string;
  productId?: string;
  productName?: string;
  categoryId?: string;
  categoryName?: string;
  startDate: string;
  endDate: string;
  priority: number;
  sequence: number;
  status: 'active' | 'inactive';
}

export interface Salesperson {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  targetRevenue: number;
  currentRevenue: number;
  commissionRate: number; // e.g. 1.5%
  customerCount: number;
  status: 'active' | 'inactive';
  area?: string;
  region?: string;
  monthlyTarget?: number;
  targetMonthly?: number;
  commissionPercent?: number;
  assignedCustomersCount?: number;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type?: 'Gudang Utama' | 'Gudang Cabang' | 'Gudang Transit' | 'Gudang Proyek' | string;
  address: string;
  city?: string;
  manager?: string;
  managerName?: string;
  phone?: string;
  capacity?: string;
  capacitySqM?: number;
  currentStockCount?: number;
  status: 'active' | 'inactive';
}

export interface SalesOrderItem {
  productId: string;
  productCode: string;
  productName: string;
  series?: string;
  uom: string;
  qty: number;
  unitPrice: number;
  discounts: DiscountItem[]; // Unlimited sequential discounts per item
  netUnitPrice?: number;
  subtotal: number; // calculated after discounts
}

export interface SalesOrder {
  id: string;
  code: string; // e.g. SO/2026/08/0102
  date: string;
  dueDate: string;
  customerId: string;
  customerCode?: string;
  customerName: string;
  address?: string;
  salespersonName: string;
  paymentTermName: string;
  warehouseName?: string;
  items: SalesOrderItem[];
  globalDiscounts?: DiscountItem[]; // Global order-level sequential discounts
  subtotal: number;
  discountTotal: number;
  taxAmount: number; // PPN 11%
  totalAmount: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Processing' | 'Completed' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  paidAmount: number;
  deliveryStatus: 'Pending' | 'Shipped' | 'Delivered';
  notes?: string;
  creditLimit?: number;
  outstandingAmount?: number;
  availableCredit?: number;
  requiresApproval?: boolean;
  approvalReason?: string;
  activities?: ActivityLogItem[];
}

export interface SalesQuotation {
  id: string;
  code: string; // e.g. SQ/2026/08/0012
  date: string;
  validUntil: string;
  customerId: string;
  customerName: string;
  salespersonName: string;
  paymentTermName: string;
  items: SalesOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Converted';
  notes?: string;
  activities?: ActivityLogItem[];
}

export interface DeliveryOrder {
  id: string;
  code: string; // e.g. SJ/2026/08/0201
  soCode: string;
  date: string;
  customerId: string;
  customerName: string;
  address: string;
  driverName: string;
  vehicleNo: string;
  warehouseName: string;
  items: {
    productId: string;
    productCode: string;
    productName: string;
    uom: string;
    qty: number;
  }[];
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Returned';
  deliveredAt?: string;
  receiverName?: string;
  notes?: string;
  activities?: ActivityLogItem[];
}

export interface SalesInvoice {
  id: string;
  code: string; // e.g. INV/2026/08/0450
  soCode: string;
  sjCode?: string;
  date: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  salespersonName: string;
  items: SalesOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  status: 'Issued' | 'Paid' | 'Cancelled';
  activities?: ActivityLogItem[];
}

export interface SalesPayment {
  id: string;
  code: string; // e.g. PAY/2026/08/0088
  date: string;
  customerId: string;
  customerName: string;
  invoiceNo: string;
  paymentMethod: 'Transfer Bank' | 'Giro' | 'Tunai' | 'Cek';
  bankName?: string;
  referenceNo?: string;
  amount: number;
  notes?: string;
  activities?: ActivityLogItem[];
}

export interface Receivable {
  id: string;
  invoiceNo: string;
  soCode?: string;
  customerId?: string;
  customerCode?: string;
  customerName: string;
  salespersonName?: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  amount: number;
  paid: number;
  paidAmount: number;
  outstanding: number;
  remainingAmount: number;
  status: 'Unpaid' | 'Partial' | 'Paid' | 'Overdue';
  agingBucket?: 'Current' | '1–30 Days' | '31–60 Days' | '61–90 Days' | '90+ Days';
  notes?: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productCode: string;
  productName: string;
  uom: string;
  qty: number;
  unitPrice: number;
  discounts: DiscountItem[]; // Unlimited sequential discounts
  netPrice?: number;
  subtotal: number;
}

export interface PurchaseRequest {
  id: string;
  code: string; // e.g. PR/2026/08/0012
  date: string;
  requesterName: string;
  department: string;
  warehouseName: string;
  priority: 'Normal' | 'Urgent';
  supplierId?: string;
  supplierName?: string;
  items: {
    productId: string;
    productCode: string;
    productName: string;
    uom: string;
    qty: number;
    estimatedPrice?: number;
  }[];
  status: 'Draft' | 'Approved' | 'Converted' | 'Rejected';
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  code: string; // PO/2026/08/0055
  date: string;
  dueDate: string;
  supplierId: string;
  supplierNumber?: string;
  supplierName: string;
  address?: string;
  warehouseName: string;
  paymentTermId?: string;
  paymentTermName: string;
  buyerName: string; // Purchaser / Buyer / Sales
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Received' | 'Invoiced' | 'Completed' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  paidAmount: number;
  receiptStatus: 'Pending' | 'Partial' | 'Full';
  notes?: string;
  activities?: ActivityLogItem[];
}

export interface GoodsReceipt {
  id: string;
  code: string; // GR/2026/08/0101
  poCode: string;
  date: string;
  supplierName: string;
  warehouseName: string;
  receivedBy: string;
  items: {
    productId: string;
    productCode: string;
    productName: string;
    uom: string;
    qtyOrdered: number;
    qtyReceived: number;
    batchNo?: string;
  }[];
  status: 'Pending' | 'Inspected' | 'Stored';
  notes?: string;
  activities?: ActivityLogItem[];
}

export interface PurchaseInvoice {
  id: string;
  code: string; // PINV/2026/08/0200
  poCode: string;
  grCode?: string;
  supplierInvoiceNo?: string;
  date: string;
  dueDate: string;
  supplierId: string;
  supplierName: string;
  paymentTermName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  status: 'Issued' | 'Paid' | 'Cancelled';
  notes?: string;
  activities?: ActivityLogItem[];
}

export interface Payable {
  id: string;
  invoiceNo: string;
  poCode?: string;
  supplierId?: string;
  supplierName: string;
  supplierNumber?: string;
  invoiceDate: string;
  dueDate: string;
  total: number; // Invoice Total Amount
  amount: number; // Invoice Total Amount
  paid: number; // Paid Amount
  paidAmount: number;
  outstanding: number; // Remaining Outstanding
  remainingAmount: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overdue';
  agingBucket?: 'Current' | '1–30 Days' | '31–60 Days' | '61–90 Days' | '90+ Days';
  notes?: string;
  activities?: ActivityLogItem[];
}

export interface SupplierPayment {
  id: string;
  paymentNumber: string; // e.g. SPAY/2026/08/0012
  code?: string;
  date: string;
  supplierId: string;
  supplierName: string;
  invoice: string; // Invoice No
  invoiceNo?: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Other' | string;
  amount: number;
  reference: string;
  referenceNo?: string;
  notes?: string;
  activities?: ActivityLogItem[];
}

export interface PayableAgingSummary {
  supplierName: string;
  current: number;
  days1To30: number;
  days31To60: number;
  days61To90: number;
  days90Plus: number;
  totalOutstanding: number;
}

export interface JournalEntry {
  id: string;
  voucherNo: string;
  date: string;
  description: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  refNo: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  read: boolean;
}

export type StockMovementType = 'Purchase' | 'Sales' | 'Return' | 'Transfer' | 'Adjustment' | 'Opening Balance' | 'In' | 'Out';

export interface StockMovement {
  id: string;
  date: string;
  documentNo?: string;
  referenceNo?: string;
  type: StockMovementType;
  productId?: string;
  productCode: string;
  productName: string;
  warehouseId?: string;
  warehouseName: string;
  qtyIn?: number;
  qtyOut?: number;
  qty?: number;
  balance?: number;
  user?: string;
  operator?: string;
  uom: string;
  batchNo?: string;
  serialNo?: string;
  notes?: string;
}

export interface StockTransferItem {
  productId: string;
  productCode: string;
  productName: string;
  uom: string;
  qty: number;
  batchNo?: string;
  serialNo?: string;
}

export interface StockTransfer {
  id: string;
  transferNo: string;
  date: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  driverName?: string;
  vehicleNo?: string;
  items: StockTransferItem[];
  status: 'Draft' | 'Submitted' | 'Approved' | 'In Transit' | 'Received' | 'Completed';
  createdUser: string;
  notes?: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNo: string;
  date: string;
  type: 'Increase' | 'Decrease';
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productCode: string;
  productName: string;
  uom: string;
  qty: number;
  reason: string;
  reference: string;
  user: string;
  notes?: string;
}

export interface BatchSerialItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  batchNumber?: string;
  serialNumber?: string;
  lotNumber?: string;
  expiryDate?: string;
  warehouseName: string;
  qty: number;
  uom: string;
  status: 'Available' | 'Allocated' | 'Expired' | 'Near Expiry';
}
