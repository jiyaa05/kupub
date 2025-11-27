// =============================================================================
// Admin Orders Page - 주문 관리
// =============================================================================

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { apiClient } from '@/shared/api';
import { formatPrice, formatDateTime } from '@/shared/utils';
import type { Order } from '@/shared/types/api';

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const dept = user?.departmentSlug ?? 'cs';
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'done'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    fetchOrders();
  }, [dept]);

  useEffect(() => {
    const search = searchParams.get('search');
    if (search) setSearchQuery(search);
  }, [searchParams]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Order[]>(`/api/${dept}/admin/orders`);
      if (response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await apiClient.patch(`/api/${dept}/admin/orders/${orderId}`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const updatePaymentStatus = async (orderId: number, paymentStatus: string) => {
    try {
      await apiClient.patch(`/api/${dept}/admin/orders/${orderId}`, { paymentStatus });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update payment status:', error);
      alert('결제 상태 변경에 실패했습니다.');
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchId = String(order.id).includes(query);
      const matchTable = order.tableCode?.toLowerCase().includes(query);
      const matchMenu = order.items.some(item => item.name.toLowerCase().includes(query));
      if (!matchId && !matchTable && !matchMenu) return false;
    }
    if (filter === 'all') return true;
    if (filter === 'pending') return order.paymentStatus === 'PENDING';
    return order.status === filter.toUpperCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">주문 관리</h1>
          <p className="text-neutral-500">주문 상태를 관리하세요</p>
        </div>
        <button onClick={fetchOrders} className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
          새로고침
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="주문번호, 테이블, 메뉴 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-2">
          {[
            { key: 'all', label: '전체' },
            { key: 'pending', label: '결제 대기' },
            { key: 'preparing', label: '준비중' },
            { key: 'done', label: '완료' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as any)}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === item.key ? 'bg-indigo-500 text-white' : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">주문번호</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">테이블</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">메뉴</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">금액</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">주문상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">결제상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">시간</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-neutral-500">
                  {searchQuery ? '검색 결과가 없습니다' : '주문이 없습니다'}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">#{order.id}</td>
                  <td className="px-6 py-4 text-sm text-neutral-700">{order.tableCode || '-'}</td>
                  <td className="px-6 py-4 text-sm text-neutral-700 max-w-[200px]">
                    <div className="truncate">
                      {order.items.slice(0, 2).map((item) => `${item.name}x${item.quantity}`).join(', ')}
                      {order.items.length > 2 && ` 외 ${order.items.length - 2}개`}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">{formatPrice(order.totalPrice)}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="text-sm border border-neutral-300 rounded px-2 py-1"
                    >
                      <option value="PENDING">대기</option>
                      <option value="PREPARING">준비중</option>
                      <option value="DONE">완료</option>
                      <option value="CANCELLED">취소</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                      className={`text-sm border rounded px-2 py-1 ${
                        order.paymentStatus === 'PENDING'
                          ? 'border-amber-300 bg-amber-50'
                          : order.paymentStatus === 'CONFIRMED'
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-neutral-300'
                      }`}
                    >
                      <option value="PENDING">대기</option>
                      <option value="CONFIRMED">확인됨</option>
                      <option value="FAILED">실패</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{formatDateTime(order.createdAt)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 주문 상세 모달 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">주문 #{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-neutral-100 rounded-lg">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-neutral-500">테이블:</span> <span className="font-medium">{selectedOrder.tableCode || '미배정'}</span></div>
                <div><span className="text-neutral-500">시간:</span> <span className="font-medium">{formatDateTime(selectedOrder.createdAt)}</span></div>
              </div>
              <div>
                <h3 className="font-medium text-neutral-700 mb-2">주문 내역</h3>
                <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span>{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>총액</span>
                  <span>{formatPrice(selectedOrder.totalPrice)}</span>
                </div>
              </div>
              {selectedOrder.note && (
                <div>
                  <h3 className="font-medium text-neutral-700 mb-2">요청사항</h3>
                  <p className="text-sm bg-neutral-50 rounded-lg p-3">{selectedOrder.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
