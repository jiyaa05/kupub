// =============================================================================
// Cart Page v2 - Clear Summary
// =============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDepartment, useDepartmentSettings } from '@/features/department';
import { useCart } from '@/features/cart';
import { useSession } from '@/features/session';
import { createOrder } from '@/features/order';
import { Button, Header, PageLayout, Card, Divider, QuantityControl, SelectChip } from '@/shared/ui';
import { formatPrice } from '@/shared/utils';
import type { CartItem } from '@/features/cart';

export default function CartPage() {
  const navigate = useNavigate();
  const { dept } = useDepartment();
  const settings = useDepartmentSettings();
  const { session } = useSession();
  const {
    items,
    subtotal,
    tableFee,
    discount,
    total,
    updateQuantity,
    removeItem,
    clearCart,
    cart,
    setDiscountCode,
    includeTableFee,
    markFeesPaid,
    setSessionId,
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const discounts = settings?.pricing?.discounts ?? [];
  const [pendingSessionId, setPendingSessionId] = useState<number | null>(null);

  // 세션 ID를 장바구니에 동기화 (테이블비 1회만 적용을 위해)
  useEffect(() => {
    if (session?.id && session.id !== pendingSessionId) {
      setSessionId(session.id);
      setPendingSessionId(session.id);
    }
  }, [session?.id, pendingSessionId, setSessionId]);

  const handleSubmit = async () => {
    if (!session) { setError('세션 정보가 없습니다.'); return; }
    if (items.length === 0) { setError('장바구니가 비어있습니다.'); return; }

    setSessionId(session.id);

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await createOrder(dept, {
        sessionId: session.id,
        includeTableFee,
        note: cart.note,
        discountCode: cart.discountCode,
        items: items.map((item) => ({ menuId: item.menuId, quantity: item.quantity })),
      });

      if (response.error) { setError(response.error.message); return; }

      if (response.data) {
        clearCart();
        if ((response.data.tableFee ?? 0) > 0) {
          markFeesPaid();
        }
        navigate(`/${dept}/payment`, { state: { order: response.data } });
      }
    } catch {
      setError('주문 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <PageLayout header={<Header showBack backTo={`/${dept}/menu`} title="장바구니" />} className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
            <span className="text-4xl">🛒</span>
          </div>
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">텅 비었어요</h2>
          <p className="text-neutral-500 mb-6">메뉴를 담아주세요!</p>
          <Button variant="primary" onClick={() => navigate(`/${dept}/menu`)}>메뉴 보러가기</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout header={<Header showBack backTo={`/${dept}/menu`} title="장바구니" />} className="pb-32">
      {/* Items */}
      <Card variant="default" padding="lg" className="mb-4">
        <h3 className="font-bold text-neutral-900 mb-4">주문 메뉴</h3>
        <div className="space-y-4">
          {items.map((item) => (
            <CartItemRow
              key={item.menuId}
              item={item}
              onUpdate={(qty) => updateQuantity(item.menuId, qty)}
              onRemove={() => removeItem(item.menuId)}
            />
          ))}
        </div>
      </Card>

      {/* Discount */}
      {discounts.length > 0 && (
        <Card variant="default" padding="lg" className="mb-4">
          <h3 className="font-bold text-neutral-900 mb-4">할인</h3>
          <div className="flex flex-wrap gap-2">
            <SelectChip selected={!cart.discountCode} onClick={() => setDiscountCode(undefined)}>
              없음
            </SelectChip>
            {discounts.map((d) => (
              <SelectChip
                key={d.condition}
                selected={cart.discountCode === d.condition}
                onClick={() => setDiscountCode(d.condition)}
              >
                {d.label}
              </SelectChip>
            ))}
          </div>
        </Card>
      )}

      {/* Summary */}
      <Card variant="default" padding="lg">
        <h3 className="font-bold text-neutral-900 mb-4">결제 금액</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-neutral-600">
            <span>주문 금액</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {tableFee > 0 && (
            <div className="flex items-center justify-between text-neutral-600">
              <span>테이블비</span>
              <span>{includeTableFee ? formatPrice(tableFee) : formatPrice(0)}</span>
            </div>
          )}
          {/* 콜키지 미사용 */}
          {discount !== 0 && (
            <div className="flex justify-between text-red-500">
              <span>할인</span>
              <span>{formatPrice(discount)}</span>
            </div>
          )}
          <Divider className="my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>총 결제금액</span>
            <span className="text-theme-primary">{formatPrice(total)}</span>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card variant="filled" padding="md" className="mt-4 bg-red-50 border border-red-100">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {/* Submit */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent">
        <div className="max-w-md mx-auto">
          <Button variant="primary" size="lg" fullWidth onClick={handleSubmit} loading={isSubmitting}>
            {formatPrice(total)} 주문하기
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}

function CartItemRow({ item, onUpdate, onRemove }: { item: CartItem; onUpdate: (q: number) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-neutral-900">{item.name}</h4>
        <p className="text-sm text-neutral-500">{formatPrice(item.price * item.quantity)}</p>
      </div>
      <QuantityControl value={item.quantity} onChange={onUpdate} onRemove={onRemove} />
    </div>
  );
}
