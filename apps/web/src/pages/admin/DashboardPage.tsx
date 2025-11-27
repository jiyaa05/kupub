// =============================================================================
// Admin Dashboard Page
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { apiClient } from '@/shared/api';
import { formatPrice, playNotificationSound } from '@/shared/utils';
import type { Session, Table } from '@/shared/types/api';
import { useWebSocket } from '@/shared/hooks/useWebSocket';

interface DashboardStats {
  seatedPeople: number;
  emptyTables: number;
  waitingSessions: number;
  unpaidSessions: number;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    seatedPeople: 0,
    emptyTables: 0,
    waitingSessions: 0,
    unpaidSessions: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [sessionStatusMap, setSessionStatusMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const dept = user?.departmentSlug ?? 'cs';

  // 새 주문 알림 핸들러
  const handleNewOrder = useCallback((data: any) => {
    setNotification(`새 주문이 들어왔습니다! #${data.orderId}`);
    playNotificationSound();
    fetchDashboardData();
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // WebSocket 연결
  const { connected } = useWebSocket({
    dept,
    onNewOrder: handleNewOrder,
    enabled: !!dept,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dept]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 주문 목록 가져오기
      const [ordersRes, sessionsRes, tablesRes] = await Promise.all([
        apiClient.get<any[]>(`/api/${dept}/admin/orders`),
        apiClient.get<Session[]>(`/api/${dept}/admin/sessions?all=true`),
        apiClient.get<Table[]>(`/api/${dept}/admin/tables`),
      ]);

      const sessions = sessionsRes.data ?? [];
      const tables = tablesRes.data ?? [];
      const sessionStatus: Record<number, string> = {};
      sessions.forEach((s) => {
        if (s.id != null) sessionStatus[s.id] = s.status;
      });
      setSessionStatusMap(sessionStatus);

      if (ordersRes.data) {
        const rawOrders = ordersRes.data.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        // 세션이 삭제된 주문은 숨김
        const orders = rawOrders.filter(
          (o: any) => !o.sessionId || sessionStatus[o.sessionId as number] !== undefined
        );
        // 인원/테이블/대기/미결제 계산
        const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
        const seatedPeople = activeSessions
          .filter((s) => s.tableId)
          .reduce((sum, s) => sum + (s.people ?? 0), 0);
        const occupiedTableIds = new Set(activeSessions.filter((s) => s.tableId).map((s) => s.tableId));
        const emptyTables = Math.max((tables.length ?? 0) - occupiedTableIds.size, 0);
        const waitingSessions = activeSessions.filter((s) => !s.tableId).length;
        const unpaidSessionIds = new Set(
          orders
            .filter((o: any) => o.paymentStatus === 'PENDING' && o.sessionId)
            .map((o: any) => o.sessionId as number)
        );

        setStats({
          seatedPeople,
          emptyTables,
          waitingSessions,
          unpaidSessions: unpaidSessionIds.size,
        });

        setRecentOrders(orders.slice(0, 10));
      }

      // 활성 예약 수 가져오기
      // (위 세션 조회로 대체됨)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '현재 착석 인원',
      value: stats.seatedPeople,
      suffix: '명',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'bg-emerald-500',
    },
    {
      title: '빈 테이블',
      value: stats.emptyTables,
      suffix: '개',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      color: 'bg-indigo-500',
    },
    {
      title: '대기 세션',
      value: stats.waitingSessions,
      suffix: '건',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-amber-500',
    },
    {
      title: '미결제 세션',
      value: stats.unpaidSessions,
      suffix: '건',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-red-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 실시간 연결 상태 & 알림 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">대시보드</h1>
          <p className="text-neutral-500">오늘의 현황을 확인하세요</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className={`text-sm ${connected ? 'text-emerald-600' : 'text-amber-600'}`}>
              {connected ? '실시간 연결됨' : '연결 중...'}
            </span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 새 주문 알림 */}
      {notification && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <span className="font-medium text-emerald-800">{notification}</span>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">{card.title}</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {card.value}
                  {card.suffix}
                </p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center text-white`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 최근 주문 */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">최근 주문</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">주문번호</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">테이블</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">메뉴</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">결제</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">세션</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">시간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                    주문이 없습니다
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {order.tableCode || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700 max-w-xs">
                      <div className="truncate" title={order.items?.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}>
                        {order.items?.length > 0 
                          ? order.items.slice(0, 2).map((i: any) => `${i.name} x${i.quantity}`).join(', ')
                          + (order.items.length > 2 ? ` 외 ${order.items.length - 2}개` : '')
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {formatPrice(order.totalPrice)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PaymentBadge status={order.paymentStatus} />
                    </td>
                    <td className="px-6 py-4">
                      <SessionStatusBadge status={sessionStatusMap[order.sessionId as number]} />
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {new Date(order.createdAt).toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    PREPARING: 'bg-blue-100 text-blue-700',
    DONE: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };

  const labels: Record<string, string> = {
    PENDING: '대기',
    PREPARING: '준비중',
    DONE: '완료',
    CANCELLED: '취소',
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status] ?? 'bg-neutral-100 text-neutral-700'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    CONFIRMED: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700',
    NOT_REQUIRED: 'bg-neutral-100 text-neutral-700',
  };

  const labels: Record<string, string> = {
    PENDING: '대기',
    CONFIRMED: '확인됨',
    FAILED: '실패',
    NOT_REQUIRED: '불필요',
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status] ?? 'bg-neutral-100 text-neutral-700'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function SessionStatusBadge({ status }: { status?: string }) {
  if (!status) {
    return <span className="text-xs text-neutral-400">-</span>;
  }
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: '이용 중', className: 'bg-emerald-100 text-emerald-700' },
    CLOSED: { label: '퇴장', className: 'bg-neutral-200 text-neutral-700' },
  };
  const value = map[status] ?? { label: status, className: 'bg-neutral-100 text-neutral-700' };
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${value.className}`}>
      {value.label}
    </span>
  );
}
