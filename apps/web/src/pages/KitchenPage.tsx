// =============================================================================
// Kitchen Display Page - 주방 화면 (밝은 테마)
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/shared/api';
import { playNotificationSound, playSuccessSound } from '@/shared/utils';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import type { Order } from '@/shared/types/api';

export default function KitchenPage() {
  const { dept } = useParams<{ dept: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchOrders = useCallback(async () => {
    if (!dept) return;
    try {
      const response = await apiClient.get<Order[]>(`/api/${dept}/admin/orders`);
      if (response.data) {
        // 조리가 필요한 주문만 (결제 확인됨 + 대기/준비중)
        setOrders(response.data.filter(o => 
          (o.status === 'PREPARING') || 
          (o.status === 'PENDING' && o.paymentStatus === 'CONFIRMED')
        ));
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [dept]);

  // WebSocket 연결
  const { connected } = useWebSocket({
    dept: dept || '',
    onNewOrder: () => {
      playNotificationSound();
      fetchOrders();
    },
    onPaymentConfirmed: () => {
      playNotificationSound();
      fetchOrders();
    },
    onOrderStatusChanged: () => fetchOrders(),
    enabled: !!dept,
  });

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startPreparing = async (orderId: number) => {
    try {
      await apiClient.patch(`/api/${dept}/admin/orders/${orderId}`, { status: 'PREPARING' });
      fetchOrders();
    } catch (error) {
      console.error('Failed to start preparing:', error);
    }
  };

  const completeOrder = async (orderId: number) => {
    try {
      await apiClient.patch(`/api/${dept}/admin/orders/${orderId}`, { status: 'DONE' });
      playSuccessSound();
      fetchOrders();
    } catch (error) {
      console.error('Failed to complete order:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">🍳 주방 디스플레이</h1>
            <p className="text-neutral-500">조리 대기 주문 <span className="font-semibold text-indigo-600">{orders.length}</span>건</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {connected ? '실시간 연결' : '연결 중...'}
            </div>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              새로고침
            </button>
            <div className="text-3xl font-mono text-neutral-900 bg-neutral-100 px-4 py-2 rounded-lg">
              {currentTime.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 주문 그리드 */}
      {orders.length === 0 ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="text-8xl mb-6">✨</div>
            <p className="text-2xl font-medium text-neutral-500">대기 중인 주문이 없습니다</p>
            <p className="text-neutral-400 mt-2">새 주문이 들어오면 자동으로 표시됩니다</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => {
            const isPending = order.status === 'PENDING';
            const timeSinceOrder = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
            const isUrgent = timeSinceOrder > 10;
            
            return (
              <div
                key={order.id}
                className={`bg-white rounded-xl overflow-hidden shadow-sm border-2 transition-all ${
                  isPending 
                    ? 'border-amber-400 shadow-amber-100' 
                    : isUrgent
                    ? 'border-red-400 shadow-red-100'
                    : 'border-indigo-400 shadow-indigo-100'
                }`}
              >
                {/* 주문 헤더 */}
                <div className={`px-4 py-3 ${
                  isPending ? 'bg-amber-500' : isUrgent ? 'bg-red-500' : 'bg-indigo-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-white">#{order.id}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white/90">
                        {order.tableCode || '미배정'}
                      </div>
                      <div className="text-xs text-white/70">
                        {timeSinceOrder}분 전
                      </div>
                    </div>
                  </div>
                </div>

                {/* 상태 뱃지 */}
                <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-200">
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    isPending 
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isPending ? '🔔 신규 주문' : '🍳 조리중'}
                  </span>
                </div>

                {/* 주문 내역 */}
                <div className="p-4 space-y-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-lg font-bold">
                        {item.quantity}
                      </span>
                      <span className="text-lg font-medium text-neutral-900">{item.name}</span>
                    </div>
                  ))}
                </div>

                {/* 요청사항 */}
                {order.note && (
                  <div className="px-4 pb-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <p className="text-sm text-amber-800">📝 {order.note}</p>
                    </div>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="p-4 pt-0 space-y-2">
                  {isPending ? (
                    <button
                      onClick={() => startPreparing(order.id)}
                      className="w-full py-3 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition-colors text-lg"
                    >
                      🍳 조리 시작
                    </button>
                  ) : (
                    <button
                      onClick={() => completeOrder(order.id)}
                      className="w-full py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors text-lg"
                    >
                      ✓ 완료
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
