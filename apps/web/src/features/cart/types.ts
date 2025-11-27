// =============================================================================
// Cart Types
// =============================================================================

export interface CartItem {
  menuId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface Cart {
  dept: string;
  items: CartItem[];
  sessionId?: number;
  discountCode?: string;
  note?: string;
}

