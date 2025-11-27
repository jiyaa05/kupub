// =============================================================================
// Admin Reservation/Order Management Page
// =============================================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { apiClient } from '@/shared/api';
import { formatDateTime, formatPrice } from '@/shared/utils';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import type { Order, Session, Table, PaymentStatus, OrderStatus } from '@/shared/types/api';

type StageFilter = 'all' | 'payment' | 'assignment' | 'active' | 'reservation' | 'done';

interface SessionWithOrders extends Session {
  orders: Order[];
}

export default function AdminServiceHubPage() {
  const { user } = useAuth();
  const dept = user?.departmentSlug ?? 'cs';
  const [searchParams, setSearchParams] = useSearchParams();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StageFilter>('all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchHubData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionsRes, tablesRes, ordersRes] = await Promise.all([
        apiClient.get<Session[]>(`/api/${dept}/admin/sessions?all=true`),
        apiClient.get<Table[]>(`/api/${dept}/admin/tables`),
        apiClient.get<Order[]>(`/api/${dept}/admin/orders`),
      ]);

      if (sessionsRes.data) setSessions(sessionsRes.data);
      if (tablesRes.data) setTables(tablesRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
    } catch (error) {
      console.error('Failed to load management data:', error);
    } finally {
      setLoading(false);
    }
  }, [dept]);

  useEffect(() => {
    fetchHubData();
  }, [fetchHubData]);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') ?? '');
  }, [searchParams]);

  const handleRealtimeUpdate = useCallback(() => {
    fetchHubData();
  }, [fetchHubData]);

  const { connected } = useWebSocket({
    dept,
    enabled: !!dept,
    onNewOrder: handleRealtimeUpdate,
    onOrderStatusChanged: handleRealtimeUpdate,
    onPaymentConfirmed: handleRealtimeUpdate,
  });

  const sessionOrderMap = useMemo(() => {
    const map = new Map<number, Order[]>();
    orders.forEach((order) => {
      if (!order.sessionId) return;
      if (!map.has(order.sessionId)) {
        map.set(order.sessionId, []);
      }
      map.get(order.sessionId)!.push(order);
    });
    return map;
  }, [orders]);

  const sessionsWithOrders = useMemo<SessionWithOrders[]>(() => {
    return sessions.map((session) => ({
      ...session,
      orders: (sessionOrderMap.get(session.id) ?? []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }));
  }, [sessions, sessionOrderMap]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchesOrderSearch = useCallback(
    (order: Order) => {
      if (!normalizedQuery) return true;
      const query = normalizedQuery;
      const matchesId = String(order.id).includes(query);
      const matchesTable = order.tableCode?.toLowerCase().includes(query);
      const matchesMenu = order.items.some((item) => item.name.toLowerCase().includes(query));
      return matchesId || matchesTable || matchesMenu;
    },
    [normalizedQuery]
  );

  const matchesSessionSearch = useCallback(
    (session: SessionWithOrders) => {
      if (!normalizedQuery) return true;
      const query = normalizedQuery;
      if (session.guestName?.toLowerCase().includes(query)) return true;
      if (session.guestPhone?.toLowerCase().includes(query)) return true;
      if (session.tableCode?.toLowerCase().includes(query)) return true;
      if (session.sessionCode?.toLowerCase().includes(query)) return true;
      if (String(session.id).includes(query)) return true;
      return session.orders.some((order) => matchesOrderSearch(order));
    },
    [normalizedQuery, matchesOrderSearch]
  );

  const determineStage = (session: SessionWithOrders): StageFilter => {
    if (session.orders.length === 0) return 'reservation';
    const hasPendingPayment = session.orders.some((o) => o.paymentStatus === 'PENDING');
    const hasConfirmedPayment = session.orders.some((o) => o.paymentStatus === 'CONFIRMED');
    if (hasPendingPayment) return 'payment';
    if (!session.tableId && hasConfirmedPayment) return 'assignment';
    if (session.status === 'ACTIVE' && session.tableId) return 'active';
    return 'done';
  };

  const sessionsWithStage = useMemo(() => {
    const list = sessionsWithOrders
      .map((session) => ({
        session,
        stage: determineStage(session),
      }))
      .filter(({ session }) => matchesSessionSearch(session));

    if (filter === 'all') {
      return list;
    }
    return list.filter(({ stage }) => stage === filter);
  }, [sessionsWithOrders, matchesSessionSearch, filter]);

  const stats = useMemo(() => {
    const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
    const seatedPeople = activeSessions
      .filter((s) => s.tableId)
      .reduce((sum, s) => sum + (s.people ?? 0), 0);
    const occupiedTableIds = new Set(activeSessions.filter((s) => s.tableId).map((s) => s.tableId));
    const emptyTables = Math.max(tables.length - occupiedTableIds.size, 0);
    const waitingSessions = activeSessions.filter((s) => !s.tableId).length;
    const unpaidSessions = new Set(
      orders.filter((o) => o.paymentStatus === 'PENDING' && o.sessionId).map((o) => o.sessionId as number)
    ).size;

    return { seatedPeople, emptyTables, waitingSessions, unpaidSessions };
  }, [sessions, orders, tables]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('search', value);
    } else {
      next.delete('search');
    }
    setSearchParams(next, { replace: true });
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await apiClient.patch(`/api/${dept}/admin/orders/${orderId}`, { status });
      if (res.error) {
        throw new Error(res.error.message);
      }
      fetchHubData();
    } catch (error: any) {
      console.error('Failed to update order status:', error);
      alert(error?.message || '주문 상태 변경에 실패했습니다.');
    }
  };

  const updatePaymentStatus = async (orderId: number, paymentStatus: string) => {
    try {
      const res = await apiClient.patch(`/api/${dept}/admin/orders/${orderId}`, { paymentStatus });
      if (res.error) {
        throw new Error(res.error.message);
      }
      fetchHubData();
    } catch (error: any) {
      console.error('Failed to update payment status:', error);
      alert(error?.message || '결제 상태 변경에 실패했습니다.');
    }
  };

  const assignTable = async (sessionId: number, tableId: number | null) => {
    try {
      const res = await apiClient.patch(`/api/${dept}/admin/sessions/${sessionId}/assign-table`, {
        tableId,
      });
      if (res.error) {
        throw new Error(res.error.message);
      }
      fetchHubData();
    } catch (error: any) {
      console.error('Failed to assign table:', error);
      alert(error?.message || '테이블 배정에 실패했습니다.');
    }
  };

  const closeSession = async (sessionId: number) => {
    if (!confirm('손님을 퇴장 처리하시겠습니까?')) return;
    try {
      const res = await apiClient.patch(`/api/${dept}/admin/sessions/${sessionId}/close`);
      if (res.error) {
        throw new Error(res.error.message);
      }
      fetchHubData();
    } catch (error: any) {
      console.error('Failed to close session:', error);
      alert(error?.message || '퇴장 처리에 실패했습니다.');
    }
  };

  const reopenSession = async (sessionId: number) => {
    try {
      const res = await apiClient.patch(`/api/${dept}/admin/sessions/${sessionId}/reopen`);
      if (res.error) {
        throw new Error(res.error.message);
      }
      fetchHubData();
    } catch (error: any) {
      console.error('Failed to reopen session:', error);
      alert(error?.message || '퇴장 취소에 실패했습니다.');
    }
  };

  const deleteSession = async (sessionId: number) => {
    if (!confirm('이 세션을 영구 삭제할까요? (관련 주문도 함께 삭제)')) return;
    try {
      const res = await apiClient.delete(`/api/${dept}/admin/sessions/${sessionId}`);
      if (res.error) {
        throw new Error(res.error.message);
      }
      // 로컬 상태에서 즉시 제거
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setOrders((prev) => prev.filter((o) => o.sessionId !== sessionId));
      fetchHubData();
    } catch (error: any) {
      console.error('Failed to delete session:', error);
      alert(error?.message || '세션 삭제에 실패했습니다.');
    }
  };

  const getAvailableTables = useCallback(
    (sessionId: number, currentTableId: number | null) => {
      const occupied = sessions
        .filter((s) => s.status === 'ACTIVE' && s.tableId && s.id !== sessionId)
        .map((s) => s.tableId) as number[];
      return tables.filter(
        (table) => !occupied.includes(table.id) || table.id === currentTableId
      );
    },
    [sessions, tables]
  );

  const stageTitle: Record<StageFilter, string> = {
    all: '전체 손님',
    payment: '결제 대기 손님',
    assignment: '테이블 배정 대기',
    active: '이용 중 손님',
    reservation: '예약 전용 손님',
    done: '완료된 손님',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">예약/주문 관리</h1>
          <p className="text-neutral-500">결제 확인 → 테이블 배정 → 주문 진행 순서로 관리하세요</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-sm text-neutral-600">
              {connected ? '실시간 연결됨' : '연결 중...'}
            </span>
          </div>
          <button
            onClick={fetchHubData}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="현재 착석 인원" value={stats.seatedPeople} accent="bg-emerald-500" suffix="명" />
        <StatCard label="빈 테이블" value={stats.emptyTables} accent="bg-indigo-500" suffix="개" />
        <StatCard label="대기 세션" value={stats.waitingSessions} accent="bg-amber-500" suffix="건" />
        <StatCard label="미결제 세션" value={stats.unpaidSessions} accent="bg-red-500" suffix="건" />
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="손님 이름, 연락처, 테이블, 주문번호를 검색하세요"
          className="flex-1 w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: '전체' },
            { key: 'payment', label: '결제 대기' },
            { key: 'assignment', label: '배정 대기' },
            { key: 'active', label: '이용 중' },
            { key: 'reservation', label: '예약 전용' },
            { key: 'done', label: '완료' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as StageFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === item.key
                  ? 'bg-indigo-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">{stageTitle[filter]}</h2>
          <p className="text-sm text-neutral-500">
            카드 한 장에서 결제 확인, 테이블 배정, 주문 상태 변경, 퇴장을 모두 처리하세요.
          </p>
        </div>

        {sessionsWithStage.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-8 text-center text-neutral-500">
            표시할 손님이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {sessionsWithStage.map(({ session, stage }) => (
              <SessionCard
                key={session.id}
                session={session}
                stage={stage}
                tables={getAvailableTables(session.id, session.tableId)}
                onAssignTable={assignTable}
              onUpdatePaymentStatus={updatePaymentStatus}
              onUpdateOrderStatus={updateOrderStatus}
              onCloseSession={closeSession}
              onReopenSession={reopenSession}
              onDeleteSession={deleteSession}
              onOrderDetail={setSelectedOrder}
            />
          ))}
          </div>
        )}
      </section>

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

function StatCard({ label, value, accent, suffix }: { label: string; value: number; accent: string; suffix?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="text-2xl font-bold text-neutral-900">
          {value}
          {suffix && <span className="text-base font-medium text-neutral-400 ml-1">{suffix}</span>}
        </p>
      </div>
      <div className={`w-10 h-10 rounded-xl ${accent} opacity-80`} />
    </div>
  );
}

type BadgeInfo = { text: string; className: string };
type OrderStatusDisplay = OrderStatus | 'NONE';

function getPaymentBadge(status: PaymentStatus | 'NOT_REQUIRED'): BadgeInfo {
  return (
    {
      PENDING: { text: '결제 대기', className: 'bg-amber-100 text-amber-700' },
      CONFIRMED: { text: '결제 확인', className: 'bg-emerald-100 text-emerald-700' },
      FAILED: { text: '결제 실패', className: 'bg-red-100 text-red-700' },
      NOT_REQUIRED: { text: '결제 없음', className: 'bg-neutral-100 text-neutral-600' },
    }[status] ?? { text: status, className: 'bg-neutral-100 text-neutral-600' }
  );
}

function getOrderBadge(status: OrderStatusDisplay): BadgeInfo {
  return (
    {
      NONE: { text: '주문 없음', className: 'bg-neutral-100 text-neutral-600' },
      PENDING: { text: '접수 대기', className: 'bg-amber-100 text-amber-700' },
      PREPARING: { text: '준비중', className: 'bg-blue-100 text-blue-700' },
      DONE: { text: '완료', className: 'bg-emerald-100 text-emerald-700' },
      CANCELLED: { text: '취소', className: 'bg-neutral-200 text-neutral-600' },
    }[status] ?? { text: status, className: 'bg-neutral-100 text-neutral-600' }
  );
}

function getStageBadge(stage: StageFilter): BadgeInfo {
  return (
    {
      payment: { text: '결제 대기', className: 'bg-amber-100 text-amber-700' },
      assignment: { text: '테이블 배정 대기', className: 'bg-purple-100 text-purple-700' },
      active: { text: '이용 중', className: 'bg-emerald-100 text-emerald-700' },
      reservation: { text: '예약 전용', className: 'bg-neutral-100 text-neutral-700' },
      done: { text: '완료', className: 'bg-neutral-200 text-neutral-600' },
      all: { text: '전체', className: 'bg-neutral-100 text-neutral-600' },
    }[stage] ?? { text: stage, className: 'bg-neutral-100 text-neutral-600' }
  );
}

function getOrderSelectClass(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'PREPARING':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'DONE':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'CANCELLED':
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    default:
      return '';
  }
}

function getPaymentSelectClass(status: PaymentStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'CONFIRMED':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'FAILED':
      return 'bg-red-50 text-red-800 border-red-200';
    case 'NOT_REQUIRED':
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    default:
      return '';
  }
}

function getOrderOptionStyle(status: OrderStatus) {
  switch (status) {
    case 'PENDING':
      return { backgroundColor: '#FEF3C7', color: '#92400E' };
    case 'PREPARING':
      return { backgroundColor: '#EFF6FF', color: '#1D4ED8' };
    case 'DONE':
      return { backgroundColor: '#ECFDF3', color: '#065F46' };
    case 'CANCELLED':
      return { backgroundColor: '#F3F4F6', color: '#374151' };
    default:
      return {};
  }
}

function getPaymentOptionStyle(status: PaymentStatus | 'NOT_REQUIRED') {
  switch (status) {
    case 'PENDING':
      return { backgroundColor: '#FEF3C7', color: '#92400E' };
    case 'CONFIRMED':
      return { backgroundColor: '#ECFDF3', color: '#065F46' };
    case 'FAILED':
      return { backgroundColor: '#FEF2F2', color: '#B91C1C' };
    case 'NOT_REQUIRED':
      return { backgroundColor: '#F3F4F6', color: '#374151' };
    default:
      return {};
  }
}

function SessionCard({
  session,
  stage,
  tables,
  onAssignTable,
  onUpdatePaymentStatus,
  onUpdateOrderStatus,
  onCloseSession,
  onReopenSession,
  onDeleteSession,
  onOrderDetail,
}: {
  session: SessionWithOrders;
  stage: StageFilter;
  tables: Table[];
  onAssignTable: (sessionId: number, tableId: number | null) => Promise<void>;
  onUpdatePaymentStatus: (orderId: number, status: string) => Promise<void>;
  onUpdateOrderStatus: (orderId: number, status: string) => Promise<void>;
  onCloseSession: (sessionId: number) => Promise<void>;
  onReopenSession: (sessionId: number) => Promise<void>;
  onDeleteSession: (sessionId: number) => Promise<void>;
  onOrderDetail: (order: Order) => void;
}) {
  const latestOrder = session.orders[0];
  const hasOrders = session.orders.length > 0;
  const stageBadge = getStageBadge(stage);
  const disableActions = stage === 'done';
  const guestName = session.guestName?.trim() || '손님';
  const guestPhone = session.guestPhone?.trim() || '미기재';
  const tableLabel = session.tableCode || '미배정';
  const paymentBadge = getPaymentBadge(latestOrder?.paymentStatus ?? 'NOT_REQUIRED');
  const orderBadge = getOrderBadge(latestOrder?.status ?? 'NONE');
  const sessionTypeLabel =
    session.type === 'RESERVATION' ? '예약' : session.type === 'QR' ? 'QR' : '코드';

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-4 shadow-sm">
      {/* 헤더: 핵심 정보만 */}
      <div className="flex flex-wrap justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-neutral-400">세션 #{session.id}</p>
            <span className={`px-3 py-1 rounded-full text-[11px] font-medium ${stageBadge.className}`}>
              {stageBadge.text}
            </span>
            <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600">
              {sessionTypeLabel}
            </span>
            {session.people ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700">
                {session.people}명
              </span>
            ) : null}
          </div>
          <p className="text-lg font-semibold text-neutral-900">{guestName}</p>
          <p className="text-sm text-neutral-500">
            연락처 {guestPhone} · 테이블 {tableLabel}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {session.status === 'ACTIVE' && !disableActions ? (
            <button
              onClick={() => onCloseSession(session.id)}
              type="button"
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100"
            >
              퇴장 처리
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400">상태: {session.status}</span>
              <button
                onClick={() => onReopenSession(session.id)}
                type="button"
                className="px-4 py-2 rounded-lg bg-neutral-100 text-neutral-700 text-sm font-medium hover:bg-neutral-200"
              >
                퇴장 취소
              </button>
              <button
                onClick={() => onDeleteSession(session.id)}
                type="button"
                className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200"
              >
                영구 삭제
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 테이블 배정 + 요약 */}
      <div className="grid gap-4 md:grid-cols-[1.2fr,1fr] items-end">
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">테이블 배정</label>
          <select
            value={session.tableId ?? ''}
            disabled={disableActions}
            onChange={(e) => {
              const value = e.target.value;
              onAssignTable(session.id, value ? Number(value) : null);
            }}
            className="w-full mt-1 text-sm border border-neutral-300 rounded-lg px-3 py-2 disabled:bg-neutral-100 disabled:text-neutral-400"
          >
            <option value="">미배정</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.code} ({table.capacity}명)
              </option>
            ))}
          </select>
        </div>

        <div />
      </div>

      {/* 주문 리스트 */}
      {session.orders.length === 0 ? (
        <p className="text-sm text-neutral-500 bg-neutral-50 rounded-xl px-4 py-3">
          아직 주문이 없습니다. 예약만 진행된 세션입니다.
        </p>
      ) : (
        <div className="space-y-3">
          {session.orders.map((order) => {
            const orderPayment = getPaymentBadge(order.paymentStatus);
            const orderStatus = getOrderBadge(order.status);
            return (
              <div key={order.id} className="border border-neutral-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">주문 #{order.id}</p>
                    <p className="text-xs text-neutral-500">
                      {order.items
                        .slice(0, 2)
                        .map((item) => `${item.name}x${item.quantity}`)
                        .join(', ')}
                      {order.items.length > 2 && ` 외 ${order.items.length - 2}개`}
                    </p>
                  </div>
                  <button
                    onClick={() => onOrderDetail(order)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1"
                  >
                    상세
                  </button>
                </div>

                <div className="grid gap-4 md:gap-6 md:grid-cols-2 items-start">
                  <div className="space-y-2">
                    <label className="text-[11px] text-neutral-500">주문 상태</label>
                    <select
                      value={order.status}
                      disabled={disableActions}
                      onChange={(e) => onUpdateOrderStatus(order.id, e.target.value)}
                      className={`text-sm border rounded-lg px-3 py-2 min-w-[180px] w-full disabled:bg-neutral-100 disabled:text-neutral-400 ${getOrderSelectClass(order.status)}`}
                    >
                      <option value="PENDING" style={getOrderOptionStyle('PENDING')}>
                        접수 대기
                      </option>
                      <option value="PREPARING" style={getOrderOptionStyle('PREPARING')}>
                        준비중
                      </option>
                      <option value="DONE" style={getOrderOptionStyle('DONE')}>
                        완료
                      </option>
                      <option value="CANCELLED" style={getOrderOptionStyle('CANCELLED')}>
                        취소
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] text-neutral-500">결제 상태</label>
                    <select
                      value={order.paymentStatus}
                      disabled={disableActions}
                      onChange={(e) => onUpdatePaymentStatus(order.id, e.target.value)}
                      className={`text-sm border rounded-lg px-3 py-2 min-w-[180px] w-full disabled:bg-neutral-100 disabled:text-neutral-400 ${getPaymentSelectClass(order.paymentStatus)}`}
                    >
                      <option value="PENDING" style={getPaymentOptionStyle('PENDING')}>
                        결제 대기
                      </option>
                      <option value="CONFIRMED" style={getPaymentOptionStyle('CONFIRMED')}>
                        결제 확인
                      </option>
                      <option value="FAILED" style={getPaymentOptionStyle('FAILED')}>
                        결제 실패
                      </option>
                      <option value="NOT_REQUIRED" style={getPaymentOptionStyle('NOT_REQUIRED')}>
                        결제 없음
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">주문 #{order.id}</h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            ✕
          </button>
        </div>

        <div className="space-y-4 text-sm text-neutral-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-neutral-400">테이블</p>
              <p className="font-medium text-neutral-900">{order.tableCode || '-'}</p>
            </div>
            <div>
              <p className="text-neutral-400">시간</p>
              <p className="font-medium text-neutral-900">{formatDateTime(order.createdAt)}</p>
            </div>
          </div>

          <div>
            <p className="text-neutral-400 mb-2">주문 내역</p>
            <div className="bg-neutral-50 rounded-xl p-3 space-y-2">
              {order.items.map((item) => (
                <div key={`${item.id}-${item.name}`} className="flex justify-between">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between font-semibold text-lg">
            <span>총액</span>
            <span>{formatPrice(order.totalPrice)}</span>
          </div>

          {order.note && (
            <div>
              <p className="text-neutral-400 mb-1">요청 사항</p>
              <p className="bg-neutral-50 rounded-xl p-3">{order.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
