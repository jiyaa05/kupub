// =============================================================================
// Admin Reservations Page - 예약/세션 관리
// =============================================================================

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { apiClient } from '@/shared/api';
import { formatDateTime } from '@/shared/utils';
import type { Session, Table } from '@/shared/types/api';

export default function AdminReservationsPage() {
  const { user } = useAuth();
  const dept = user?.departmentSlug ?? 'cs';

  const [sessions, setSessions] = useState<Session[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [confirmModal, setConfirmModal] = useState<Session | null>(null);

  useEffect(() => {
    fetchData();
  }, [dept, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, tablesRes] = await Promise.all([
        apiClient.get<Session[]>(`/api/${dept}/admin/sessions${filter === 'all' ? '?all=true' : ''}`),
        apiClient.get<Table[]>(`/api/${dept}/admin/tables`),
      ]);

      if (sessionsRes.data) setSessions(sessionsRes.data);
      if (tablesRes.data) setTables(tablesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 이미 배정된 테이블 ID 목록 (현재 세션 제외)
  const getOccupiedTableIds = (currentSessionId: number) => {
    return sessions
      .filter(s => s.status === 'ACTIVE' && s.tableId !== null && s.id !== currentSessionId)
      .map(s => s.tableId);
  };

  const assignTable = async (sessionId: number, tableId: number | null) => {
    try {
      await apiClient.patch(`/api/${dept}/admin/sessions/${sessionId}/assign-table`, { tableId });
      fetchData();
    } catch (error: any) {
      console.error('Failed to assign table:', error);
      const message = error.response?.data?.message;
      alert(message || '테이블 배정에 실패했습니다.');
    }
  };

  const closeSession = async (sessionId: number) => {
    try {
      await apiClient.patch(`/api/${dept}/admin/sessions/${sessionId}/close`);
      fetchData();
      setConfirmModal(null);
    } catch (error: any) {
      console.error('Failed to close session:', error);
      const message = error.response?.data?.message;
      alert(message || '퇴장 처리에 실패했습니다.');
    }
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
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">예약/세션 관리</h1>
          <p className="text-neutral-500">손님 세션을 관리하세요</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-indigo-500 text-white'
              : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
          }`}
        >
          활성 세션
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-indigo-500 text-white'
              : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
          }`}
        >
          전체
        </button>
      </div>

      {/* 세션 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">타입</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">손님</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">인원</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">테이블</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">시간</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-neutral-500">
                  세션이 없습니다
                </td>
              </tr>
            ) : (
              sessions.map((session) => {
                const occupiedTableIds = getOccupiedTableIds(session.id);
                const availableTables = tables.filter(t => !occupiedTableIds.includes(t.id) || t.id === session.tableId);
                
                return (
                  <tr key={session.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                      #{session.id}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        session.type === 'RESERVATION'
                          ? 'bg-blue-100 text-blue-700'
                          : session.type === 'QR'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {session.type === 'RESERVATION' ? '예약' : session.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      <div>{session.guestName || '-'}</div>
                      {session.guestPhone && (
                        <div className="text-xs text-neutral-400">{session.guestPhone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      {session.people}명
                    </td>
                    <td className="px-6 py-4">
                      {session.status === 'ACTIVE' ? (
                        <select
                          value={session.tableId ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            assignTable(session.id, value ? Number(value) : null);
                          }}
                          className="text-sm border border-neutral-300 rounded px-2 py-1"
                        >
                          <option value="">미배정</option>
                          {availableTables.map((table) => (
                            <option key={table.id} value={table.id}>
                              {table.code} ({table.capacity}인)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-neutral-500">
                          {session.tableCode ?? '-'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        session.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {session.status === 'ACTIVE' ? '이용중' : '퇴장'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {formatDateTime(session.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {session.status === 'ACTIVE' && (
                        <button
                          onClick={() => setConfirmModal(session)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          퇴장
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 퇴장 확인 모달 */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚪</span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">손님 퇴장 확인</h3>
              <p className="text-neutral-500 mb-6">
                <strong>{confirmModal.guestName || `세션 #${confirmModal.id}`}</strong>님을 퇴장 처리하시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200"
                >
                  취소
                </button>
                <button
                  onClick={() => closeSession(confirmModal.id)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                >
                  퇴장 처리
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
