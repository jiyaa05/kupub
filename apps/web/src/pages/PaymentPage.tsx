// =============================================================================
// Payment Page v2 - Clear Payment Info
// =============================================================================

import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useDepartment, useDepartmentSettings } from '@/features/department';
import { Button, PageLayout, Card } from '@/shared/ui';
import { formatPrice } from '@/shared/utils';
import type { Order } from '@/shared/types/api';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dept } = useDepartment();
  const settings = useDepartmentSettings();

  const order = location.state?.order as Order | undefined;
  const payment = settings?.payment;

  if (!order) return <Navigate to={`/${dept}`} replace />;

  const discountValue = order.discount < 0 ? order.discount : 0;
  const displayTotal = Math.max(0, (order.subtotal ?? 0) + (order.tableFee ?? 0) + discountValue);

  const handleCopy = async () => {
    if (payment?.accountNumber) {
      await navigator.clipboard.writeText(payment.accountNumber);
      alert('복사되었습니다!');
    }
  };

  return (
    <PageLayout background="theme">
      {/* Status */}
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
          <span className="text-4xl">💳</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">결제 대기 중</h1>
        <p className="text-neutral-500">아래 계좌로 입금해주세요</p>
      </div>

      {/* Amount */}
      <Card variant="elevated" padding="lg" className="mb-4 text-center">
        <p className="text-sm text-neutral-500 mb-1">결제 금액</p>
        <p className="text-4xl font-bold text-theme-primary">{formatPrice(displayTotal)}</p>
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
      </Card>

      {/* Account Info */}
      <Card variant="default" padding="lg" className="mb-4">
        <h3 className="font-bold text-neutral-900 mb-4">계좌 정보</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-neutral-500">은행</span>
            <span className="font-medium">{payment?.bankName ?? '-'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-500">계좌번호</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">{payment?.accountNumber ?? '-'}</span>
              <button onClick={handleCopy} className="px-2 py-1 text-xs bg-neutral-100 rounded-lg hover:bg-neutral-200">
                복사
              </button>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">예금주</span>
            <span className="font-medium">{payment?.accountHolder ?? '-'}</span>
          </div>
        </div>
      </Card>

      {/* Order Summary */}
      <Card variant="filled" padding="md" className="mb-6">
        <p className="text-sm text-neutral-500 mb-2">주문 내역</p>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.name} x {item.quantity}</span>
            <span className="text-neutral-500">{formatPrice(item.subtotal)}</span>
          </div>
        ))}
      </Card>

      {/* Next */}
      <Button variant="primary" size="lg" fullWidth onClick={() => navigate(`/${dept}/waiting`, { state: { order } })}>
        입금했어요
      </Button>
    </PageLayout>
  );
}
