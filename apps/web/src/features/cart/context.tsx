// =============================================================================
// Cart Context - LocalStorage 기반 장바구니
// =============================================================================

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useLocalStorage } from '@/shared/hooks';
import { STORAGE_KEYS } from '@/shared/utils';
import { useDepartment, useDepartmentSettings } from '@/features/department';
import type { Cart, CartItem } from './types';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface CartContextValue {
  cart: Cart;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tableFee: number;
  corkage: number;
  discount: number;
  total: number;
  includeTableFee: boolean;
  includeCorkage: boolean; // always false (no corkage)
  setIncludeCorkage: (value: boolean) => void; // no-op
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (menuId: number) => void;
  updateQuantity: (menuId: number, quantity: number) => void;
  clearCart: () => void;
  setSessionId: (sessionId: number) => void;
  setDiscountCode: (code: string | undefined) => void;
  setNote: (note: string | undefined) => void;
}

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const CartContext = createContext<CartContextValue | null>(null);

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

interface CartProviderProps {
  children: ReactNode;
}

const emptyCart: Cart = {
  dept: '',
  items: [],
};

export function CartProvider({ children }: CartProviderProps) {
  const { dept } = useDepartment();
  const settings = useDepartmentSettings();
  const pricing = settings?.pricing;

  const [cart, setCart] = useLocalStorage<Cart>(
    `${STORAGE_KEYS.CART}_${dept}`,
    { ...emptyCart, dept }
  );

  // 현재 학과의 장바구니만 사용
  const currentCart = cart.dept === dept ? cart : { ...emptyCart, dept };
  const sessionKey = currentCart.sessionId ? `_${currentCart.sessionId}` : '';
  const feesKey = `kupub_fees_paid_${dept}${sessionKey}`;
  const items = currentCart.items;

  // 가격 계산
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tableFee = pricing?.tableFee ?? 0;
  const corkage = 0;
  const feesAlreadyPaid =
    currentCart.sessionId && typeof window !== 'undefined'
      ? window.localStorage.getItem(feesKey) === 'true'
      : false;
  const includeTableFee = tableFee > 0 && !feesAlreadyPaid; // 첫 주문만 포함, 이후는 서버에서 0 처리
  const includeCorkage = false;

  // 할인 계산 (현재는 discountCode 기반)
  const discount = (() => {
    if (!currentCart.discountCode || !pricing?.discounts) return 0;
    const found = pricing.discounts.find(d => d.condition === currentCart.discountCode);
    return found?.amount ?? 0;
  })();

  const total = Math.max(
    0,
    subtotal +
      (includeTableFee ? tableFee : 0) +
      0 +
      discount
  );

  // 아이템 추가
  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'>) => {
      setCart((prev) => {
        const existing = prev.items.find((i) => i.menuId === item.menuId);
        if (existing) {
          return {
            ...prev,
            dept,
            items: prev.items.map((i) =>
              i.menuId === item.menuId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          };
        }
        return {
          ...prev,
          dept,
          items: [...prev.items, { ...item, quantity: 1 }],
        };
      });
    },
    [dept, setCart]
  );

  // 아이템 삭제
  const removeItem = useCallback(
    (menuId: number) => {
      setCart((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.menuId !== menuId),
      }));
    },
    [setCart]
  );

  // 수량 변경
  const updateQuantity = useCallback(
    (menuId: number, quantity: number) => {
      if (quantity <= 0) {
        removeItem(menuId);
        return;
      }
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((i) =>
          i.menuId === menuId ? { ...i, quantity } : i
        ),
      }));
    },
    [setCart, removeItem]
  );

  // 장바구니 비우기
  const clearCart = useCallback(() => {
    setCart((prev) => ({
      ...emptyCart,
      dept,
      sessionId: prev.sessionId,
      discountCode: undefined,
      note: undefined,
    }));
  }, [dept, setCart]);

  // 콜키지 미사용
  const setIncludeCorkage = useCallback(() => {}, []);

  // 첫 주문 후 테이블비 납부 표시
  const markFeesPaid = useCallback(() => {
    if (currentCart.sessionId && typeof window !== 'undefined') {
      window.localStorage.setItem(feesKey, 'true');
    }
    setCart((prev) => ({ ...prev }));
  }, [currentCart.sessionId, feesKey]);

  // 세션 변경 시 테이블비 플래그 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(feesKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCart.sessionId]);

  // 세션 변경 시 장바구니 세션 동기화
  useEffect(() => {
    if (currentCart.sessionId && typeof window !== 'undefined') {
      // 세션이 유지되면 그대로 두고, 없으면 클리어
      return;
    }
  }, [currentCart.sessionId]);

  // 세션 ID 설정
  const setSessionId = useCallback(
    (sessionId: number) => {
      setCart((prev) => ({ ...prev, sessionId }));
    },
    [setCart]
  );

  // 할인 코드 설정
  const setDiscountCode = useCallback(
    (code: string | undefined) => {
      setCart((prev) => ({ ...prev, discountCode: code }));
    },
    [setCart]
  );

  // 요청사항 설정
  const setNote = useCallback(
    (note: string | undefined) => {
      setCart((prev) => ({ ...prev, note }));
    },
    [setCart]
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart: currentCart,
        items,
        itemCount,
        subtotal,
        tableFee,
        corkage,
        discount,
        total,
        includeCorkage,
        includeTableFee,
        setIncludeCorkage,
        markFeesPaid,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setSessionId,
        setDiscountCode,
        setNote,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

