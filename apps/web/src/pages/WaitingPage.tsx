// =============================================================================
// Waiting Page v2 - Status Display
// =============================================================================

import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useDepartment } from '@/features/department';
import { apiClient } from '@/shared/api';
import { PageLayout, Card, Button, Spinner } from '@/shared/ui';
import { formatPrice } from '@/shared/utils';
import type { Order } from '@/shared/types/api';

export default function WaitingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dept } = useDepartment();

  const order = location.state?.order as Order | undefined;
  const [currentOrder, setCurrentOrder] = useState<Order | null>(order ?? null);
  const [checking, setChecking] = useState(false);

  if (!order) return <Navigate to={`/${dept}`} replace />;

  const subtotalVal = currentOrder?.subtotal ?? 0;
  const tableFeeVal = currentOrder?.tableFee ?? 0;
  const discountVal = currentOrder?.discount && currentOrder.discount < 0 ? currentOrder.discount : 0;
  const displayTotal = Math.max(0, subtotalVal + tableFeeVal + discountVal);

  useEffect(() => {
    if (!currentOrder) return;
    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get<Order>(`/api/${dept}/orders/${currentOrder.id}`);
        if (res.data) {
          setCurrentOrder(res.data);
          if (res.data.paymentStatus === 'CONFIRMED') {
            navigate(`/${dept}/complete`, { state: { order: res.data } });
          }
        }
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, [currentOrder, dept, navigate]);

  const handleCheck = async () => {
    if (!currentOrder) return;
    setChecking(true);
    try {
      const res = await apiClient.get<Order>(`/api/${dept}/orders/${currentOrder.id}`);
      if (res.data) {
        setCurrentOrder(res.data);
        if (res.data.paymentStatus === 'CONFIRMED') {
          navigate(`/${dept}/complete`, { state: { order: res.data } });
        }
      }
    } catch {} finally { setChecking(false); }
  };

  const isPending = currentOrder?.paymentStatus === 'PENDING';

  return (
    <PageLayout background="theme" className="flex flex-col items-center justify-center min-h-screen">
      {/* Status Icon */}
      <div className="mb-6">
        {isPending ? (
          <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* Status Text */}
      <h1 className="text-2xl font-bold text-neutral-900 mb-2">
        {isPending ? '입금 확인 중' : '확인 완료!'}
      </h1>
      <p className="text-neutral-500 mb-8 text-center">
        {isPending ? '잠시만 기다려주세요...' : '주문이 접수되었습니다'}
      </p>

      {/* Order Info */}
      <Card variant="default" padding="lg" className="w-full max-w-sm mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-neutral-500">주문 번호</span>
          <span className="font-bold text-theme-primary">#{currentOrder?.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">결제 금액</span>
          <span className="font-semibold">{formatPrice(displayTotal)}</span>
        </div>
        <div className="mt-3 space-y-1 text-sm text-neutral-600">
          <div className="flex justify-between">
            <span>주문 금액</span>
            <span>{formatPrice(currentOrder?.subtotal ?? 0)}</span>
          </div>
          {currentOrder?.tableFee ? (
            <div className="flex justify-between">
              <span>테이블비</span>
              <span>{formatPrice(currentOrder.tableFee)}</span>
            </div>
          ) : null}
          {currentOrder?.discount ? (
            <div className="flex justify-between text-red-500">
              <span>할인</span>
              <span>{formatPrice(currentOrder.discount)}</span>
            </div>
          ) : null}
        </div>
      </Card>

      {/* Check Button */}
      {isPending && (
        <div className="w-full max-w-sm px-6">
          <Button variant="secondary" size="lg" fullWidth onClick={handleCheck} disabled={checking}>
            {checking ? '확인 중...' : '결제 확인하기'}
          </Button>
        </div>
      )}
    </PageLayout>
  );
}

