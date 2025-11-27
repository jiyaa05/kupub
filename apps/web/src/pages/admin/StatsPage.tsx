// =============================================================================
// Admin Stats Page - 통계
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { apiClient } from '@/shared/api';
import { formatPrice } from '@/shared/utils';
import type { Order } from '@/shared/types/api';

export default function AdminStatsPage() {
  const { user } = useAuth();
  const dept = user?.departmentSlug ?? 'cs';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    fetchOrders();
  }, [dept]);

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

  // 기간별 필터링
  const filterByPeriod = (orders: Order[]) => {
    const now = new Date();
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      if (period === 'today') {
        return orderDate.toDateString() === now.toDateString();
      }
      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= weekAgo;
      }
      if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= monthAgo;
      }
      return true;
    });
  };

  const filteredOrders = filterByPeriod(orders);
  const confirmedOrders = filteredOrders.filter((o) => o.paymentStatus === 'CONFIRMED');

  // 통계 계산
  const totalRevenue = confirmedOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;
  const pendingCount = filteredOrders.filter((o) => o.paymentStatus === 'PENDING').length;
  const cancelledCount = filteredOrders.filter((o) => o.status === 'CANCELLED').length;

  // 일별 매출 (최근 7일)
  const dailyStats = useMemo(() => {
    const days = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toDateString();
      const dayOrders = orders.filter(
        (o) => new Date(o.createdAt).toDateString() === dateStr && o.paymentStatus === 'CONFIRMED'
      );
      const revenue = dayOrders.reduce((sum, o) => sum + o.totalPrice, 0);
      
      days.push({
        label: date.toLocaleDateString('ko-KR', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        revenue,
        orders: dayOrders.length,
      });
    }
    
    return days;
  }, [orders]);

  const maxDailyRevenue = Math.max(...dailyStats.map((d) => d.revenue), 1);

  // 시간대별 주문 분포
  const hourlyStats = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hours[i] = 0;
    
    confirmedOrders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hours[hour]++;
    });
    
    return Object.entries(hours)
      .map(([hour, count]) => ({ hour: Number(hour), count }))
      .filter((h) => h.hour >= 11 && h.hour <= 24); // 영업시간만
  }, [confirmedOrders]);

  const maxHourlyCount = Math.max(...hourlyStats.map((h) => h.count), 1);

  // 메뉴별 판매량
  const menuStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
  confirmedOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (!menuStats[item.name]) {
        menuStats[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      }
      menuStats[item.name].quantity += item.quantity;
      menuStats[item.name].revenue += item.subtotal;
    });
  });
  const topMenus = Object.values(menuStats)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">📊 통계</h1>
          <p className="text-neutral-500">매출과 판매 현황을 확인하세요</p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200"
        >
          새로고침
        </button>
      </div>

      {/* 기간 필터 */}
      <div className="flex gap-2">
        {[
          { key: 'today', label: '오늘' },
          { key: 'week', label: '이번 주' },
          { key: 'month', label: '이번 달' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setPeriod(item.key as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === item.key
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
          <p className="text-sm text-white/80">총 매출</p>
          <p className="text-2xl font-bold mt-1">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <p className="text-sm text-neutral-500">총 주문</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{totalOrders}건</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-neutral-200">
          <p className="text-sm text-neutral-500">평균 주문금액</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{formatPrice(Math.round(avgOrderValue))}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
          <p className="text-sm text-amber-600">결제 대기</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}건</p>
        </div>
        <div className="bg-red-50 rounded-xl p-5 border border-red-200">
          <p className="text-sm text-red-600">취소</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{cancelledCount}건</p>
        </div>
      </div>

      {/* 일별 매출 차트 */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">📈 일별 매출 (최근 7일)</h2>
        <div className="flex items-end gap-2 h-48">
          {dailyStats.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center">
                <span className="text-xs text-neutral-500 mb-1">
                  {day.revenue > 0 ? formatPrice(day.revenue) : '-'}
                </span>
                <div
                  className="w-full bg-indigo-500 rounded-t-lg transition-all duration-300 hover:bg-indigo-600"
                  style={{
                    height: `${(day.revenue / maxDailyRevenue) * 120}px`,
                    minHeight: day.revenue > 0 ? '8px' : '2px',
                  }}
                />
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs text-neutral-600">{day.label}</p>
                <p className="text-xs text-neutral-400">{day.orders}건</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 시간대별 분포 */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">🕐 시간대별 주문 분포</h2>
        <div className="flex items-end gap-1 h-32">
          {hourlyStats.map((h) => (
            <div key={h.hour} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-emerald-500 rounded-t transition-all duration-300 hover:bg-emerald-600"
                style={{
                  height: `${(h.count / maxHourlyCount) * 80}px`,
                  minHeight: h.count > 0 ? '4px' : '2px',
                }}
              />
              <span className="text-xs text-neutral-500 mt-1">{h.hour}시</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-neutral-500 mt-3 text-center">
          가장 바쁜 시간: {hourlyStats.reduce((max, h) => h.count > max.count ? h : max, hourlyStats[0])?.hour || '-'}시
        </p>
      </div>

      {/* 인기 메뉴 */}
      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">🏆 인기 메뉴 TOP 10</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">순위</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">메뉴</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">판매량</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">매출</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">비율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {topMenus.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                    데이터가 없습니다
                  </td>
                </tr>
              ) : (
                topMenus.map((menu, index) => {
                  const totalQuantity = topMenus.reduce((sum, m) => sum + m.quantity, 0);
                  const percentage = totalQuantity > 0 ? (menu.quantity / totalQuantity) * 100 : 0;
                  
                  return (
                    <tr key={menu.name} className="hover:bg-neutral-50">
                      <td className="px-6 py-4">
                        <span className={`inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-amber-400 text-white' :
                          index === 1 ? 'bg-neutral-400 text-white' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-neutral-100 text-neutral-700'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                        {menu.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-700">
                        {menu.quantity}개
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-indigo-600">
                        {formatPrice(menu.revenue)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-neutral-500 w-12">{percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

