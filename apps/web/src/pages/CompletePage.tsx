// =============================================================================
// Complete Page v2 - Success State
// =============================================================================

import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useDepartment } from '@/features/department';
import { useCart } from '@/features/cart';
import { Button, PageLayout, Card } from '@/shared/ui';
import { formatPrice, formatDateTime } from '@/shared/utils';
import type { Order } from '@/shared/types/api';

export default function CompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dept } = useDepartment();
  const { clearCart } = useCart();

  const order = location.state?.order as Order | undefined;
  if (!order) return <Navigate to={`/${dept}`} replace />;

  const discountVal = order.discount < 0 ? order.discount : 0;
  const displayTotal = Math.max(0, (order.subtotal ?? 0) + (order.tableFee ?? 0) + discountVal);

  const handleAddMore = () => {
    clearCart();
    navigate(`/${dept}/menu`);
  };

  return (
    <PageLayout background="theme" className="flex flex-col min-h-screen">
      {/* Success */}
      <div className="flex-1 flex flex-col items-center justify-center py-8">
        <div className="w-24 h-24 mb-6 rounded-full bg-green-100 flex items-center justify-center animate-bounce-soft">
          <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 mb-2">주문 완료!</h1>
        <p className="text-neutral-500 mb-8">맛있게 드세요 🎉</p>

        {/* Order Card */}
        <Card variant="elevated" padding="lg" className="w-full max-w-sm">
          <div className="text-center pb-4 mb-4 border-b border-neutral-100">
            <p className="text-sm text-neutral-500 mb-1">주문 번호</p>
            <p className="text-3xl font-bold text-theme-primary">#{order.id}</p>
          </div>

          <div className="space-y-3 text-sm">
            {order.tableCode && (
              <div className="flex justify-between">
                <span className="text-neutral-500">테이블</span>
                <span className="font-medium">{order.tableCode}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-neutral-500">주문 시간</span>
              <span className="font-medium">{formatDateTime(order.createdAt)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="text-sm text-neutral-500 mb-2">주문 내역</p>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm mb-1">
                <span>{item.name} x {item.quantity}</span>
                <span className="text-neutral-500">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
            <div className="mt-3 space-y-1 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>주문 금액</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.tableFee > 0 && (
                <div className="flex justify-between">
                  <span>테이블비</span>
                  <span>{formatPrice(order.tableFee)}</span>
                </div>
              )}
              {order.discount !== 0 && (
                <div className="flex justify-between text-red-500">
                  <span>할인</span>
                  <span>{formatPrice(order.discount)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between font-bold">
            <span>총 결제금액</span>
            <span className="text-theme-primary">{formatPrice(displayTotal)}</span>
          </div>
        </Card>
      </div>

      {/* Buttons */}
      <div className="p-6 space-y-3">
        <Button variant="primary" size="lg" fullWidth onClick={handleAddMore}>
          추가 주문하기
        </Button>
        <Button variant="outline" size="lg" fullWidth onClick={() => navigate(`/${dept}`)}>
          처음으로
        </Button>
      </div>
    </PageLayout>
  );
}
