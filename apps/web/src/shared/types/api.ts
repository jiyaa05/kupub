// =============================================================================
// KUPUB API 타입 정의
// =============================================================================

// -----------------------------------------------------------------------------
// 공통 응답 타입
// -----------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
}

// -----------------------------------------------------------------------------
// Department (학과)
// -----------------------------------------------------------------------------

export interface Department {
  id: number;
  slug: string;
  name: string;
  active?: boolean;
}

// -----------------------------------------------------------------------------
// Settings (학과 설정)
// -----------------------------------------------------------------------------

export interface DepartmentSettings {
  department: Department;
  settings: Settings;
}

export interface Settings {
  branding: BrandingSettings;
  flow: FlowSettings;
  reservation: ReservationSettings;
  payment: PaymentSettings;
  pricing: PricingSettings;
  sms: SmsSettings;
  onboarding: OnboardingSlide[];
  reservationClosed: string[];
}

export interface SmsSettings {
  enabled: boolean;
  provider: 'aligo' | 'none';
  aligoApiKey: string;
  aligoUserId: string;
  senderNumber: string;
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  logoUrl?: string;
}

export interface FlowSettings {
  entryModes: EntryMode[];
  showOnboarding: boolean;
  requireReservationForFirstOrder: boolean;
}

export type EntryMode = 'reservation' | 'qr' | 'code';

export interface ReservationSettings {
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  durationMinutes: number;
  maxPeople: number;
}

export interface PaymentSettings {
  method: 'transfer' | 'card';
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface PricingSettings {
  tableFee: number;
  discounts: Discount[];
}

export interface Discount {
  label: string;
  amount: number;
  condition: string;
}

export interface OnboardingSlide {
  id: string;
  imageUrl?: string;
  title: string;
  body: string;
  order: number;
}

// -----------------------------------------------------------------------------
// Menu (메뉴)
// -----------------------------------------------------------------------------

export interface MenuCategory {
  id: number;
  name: string;
  displayOrder: number;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  soldOut: boolean;
}

export interface MenuResponse {
  department: Department;
  categories: MenuCategory[];
  menus: MenuItem[];
}

// -----------------------------------------------------------------------------
// Reservation (예약)
// -----------------------------------------------------------------------------

export interface ReservationRequest {
  name: string;
  phone: string;
  reservationTime: string;
  people: number;
}

export interface Reservation {
  id: number;
  departmentId: number;
  name: string;
  phone: string;
  reservationTime: string;
  people: number;
  status: ReservationStatus;
  tableId: number | null;
  createdAt: string;
}

export type ReservationStatus = 'WAITING' | 'SEATED' | 'COMPLETED' | 'CANCELLED';

// -----------------------------------------------------------------------------
// Session (세션)
// -----------------------------------------------------------------------------

export type SessionType = 'RESERVATION' | 'QR' | 'CODE';

export interface SessionStartRequest {
  type: SessionType;
  reservationId?: number;
  tableId?: number;
  sessionCode?: string;
  guestName?: string;
  people?: number;
}

export interface Session {
  id: number;
  departmentId: number;
  type: SessionType;
  reservationId: number | null;
  tableId: number | null;
  tableCode: string | null;
  sessionCode: string | null;
  guestName: string;
  guestPhone?: string | null;
  people: number;
  status: SessionStatus;
  createdAt: string;
  closedAt?: string | null;
}

export type SessionStatus = 'ACTIVE' | 'CLOSED';

// -----------------------------------------------------------------------------
// Table (테이블)
// -----------------------------------------------------------------------------

export interface Table {
  id: number;
  departmentId?: number;
  code: string;
  name: string;
  capacity: number;
  posX: number;
  posY: number;
  width: number;
  height: number;
  active: boolean;
}

// -----------------------------------------------------------------------------
// Order (주문)
// -----------------------------------------------------------------------------

export interface OrderItemRequest {
  menuId?: number;
  name?: string;
  price?: number;
  quantity: number;
}

export interface OrderRequest {
  sessionId: number;
  includeTableFee?: boolean;
  note?: string;
  discountCode?: string;
  items: OrderItemRequest[];
}

export interface Order {
  id: number;
  departmentId: number;
  sessionId: number;
  tableId: number | null;
  tableCode: string | null;
  subtotal: number;
  tableFee: number;
  corkage: number;
  discount: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  note?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: number;
  menuId: number | null;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'DONE' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'NOT_REQUIRED';

