// =============================================================================
// Admin Tables Page - 테이블 관리 (시각적 배치도 포함)
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { apiClient } from '@/shared/api';

// QR 코드 다운로드 함수
const downloadQRCode = async (tableCode: string, dept: string) => {
  const url = `${window.location.origin}/${dept}/code?table=${tableCode}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
  
  try {
    const response = await fetch(qrUrl);
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `QR_${tableCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('QR 다운로드 실패:', error);
    alert('QR 코드 다운로드에 실패했습니다.');
  }
};

// 전체 QR 일괄 다운로드
const downloadAllQRCodes = async (tables: Table[], dept: string) => {
  for (const table of tables) {
    await downloadQRCode(table.code, dept);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

interface Table {
  id: number;
  code: string;
  name: string;
  capacity: number;
  posX: number;
  posY: number;
  width: number;
  height: number;
  active: boolean;
}

export default function AdminTablesPage() {
  const { user } = useAuth();
  const dept = user?.departmentSlug ?? 'cs';

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'layout'>('grid');
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  
  // 드래그 상태
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const layoutRef = useRef<HTMLDivElement>(null);

  // 새 테이블 폼
  const [newTable, setNewTable] = useState({
    code: '',
    name: '',
    capacity: 4,
  });

  useEffect(() => {
    fetchTables();
  }, [dept]);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<Table[]>(`/api/${dept}/admin/tables`);
      if (response.data) {
        setTables(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newTable.code.trim()) {
      alert('테이블 코드를 입력해주세요.');
      return;
    }
    
    try {
      await apiClient.post(`/api/${dept}/admin/tables`, {
        code: newTable.code,
        name: newTable.name || newTable.code,
        capacity: newTable.capacity,
        posX: 50 + (tables.length % 5) * 100,
        posY: 50 + Math.floor(tables.length / 5) * 100,
        width: 80,
        height: 80,
      });
      fetchTables();
      setShowAddModal(false);
      setNewTable({ code: '', name: '', capacity: 4 });
    } catch (error: any) {
      console.error('Failed to create table:', error);
      const message = error.response?.data?.message || error.response?.data?.error;
      if (message?.includes('duplicate') || message?.includes('중복') || message?.includes('already exists')) {
        alert('이미 동일한 코드의 테이블이 존재합니다.');
      } else {
        alert(message || '테이블 생성에 실패했습니다.');
      }
    }
  };

  const toggleActive = async (tableId: number, active: boolean) => {
    try {
      await apiClient.patch(`/api/${dept}/admin/tables/${tableId}`, { active: !active });
      fetchTables();
    } catch (error) {
      console.error('Failed to toggle table:', error);
    }
  };

  const deleteTable = async (tableId: number) => {
    if (!confirm('테이블을 삭제하시겠습니까?')) return;
    
    try {
      await apiClient.delete(`/api/${dept}/admin/tables/${tableId}`);
      fetchTables();
    } catch (error) {
      console.error('Failed to delete table:', error);
    }
  };

  // 테이블 위치 업데이트
  const updateTablePosition = async (tableId: number, posX: number, posY: number) => {
    try {
      await apiClient.patch(`/api/${dept}/admin/tables/${tableId}`, { posX, posY });
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, posX, posY } : t));
    } catch (error) {
      console.error('Failed to update table position:', error);
    }
  };

  // 드래그 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent, table: Table) => {
    if (!layoutRef.current) return;
    const rect = layoutRef.current.getBoundingClientRect();
    setDragging(table.id);
    setDragOffset({
      x: e.clientX - rect.left - table.posX,
      y: e.clientY - rect.top - table.posY,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging === null || !layoutRef.current) return;
    const rect = layoutRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 80));
    const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 80));
    
    setTables(prev => prev.map(t => 
      t.id === dragging ? { ...t, posX: newX, posY: newY } : t
    ));
  }, [dragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (dragging !== null) {
      const table = tables.find(t => t.id === dragging);
      if (table) {
        updateTablePosition(table.id, table.posX, table.posY);
      }
      setDragging(null);
    }
  }, [dragging, tables]);

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
          <h1 className="text-2xl font-bold text-neutral-900">테이블 관리</h1>
          <p className="text-neutral-500">테이블을 추가하고 배치하세요</p>
        </div>
        <div className="flex gap-2">
          {/* 뷰 모드 토글 */}
          <div className="flex bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
              }`}
            >
              그리드
            </button>
            <button
              onClick={() => setViewMode('layout')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'layout' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
              }`}
            >
              배치도
            </button>
          </div>
          
          {tables.length > 0 && (
            <button
              onClick={() => downloadAllQRCodes(tables, dept)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              전체 QR
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            테이블 추가
          </button>
        </div>
      </div>

      {/* 배치도 뷰 */}
      {viewMode === 'layout' && (
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              💡 테이블을 드래그하여 위치를 조정하세요. 실제 주점 배치와 동일하게 설정할 수 있습니다.
            </p>
          </div>
          <div
            ref={layoutRef}
            className="relative w-full h-[500px] bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200 overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* 그리드 배경 */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
            
            {/* 테이블 */}
            {tables.map((table) => (
              <div
                key={table.id}
                onMouseDown={(e) => handleMouseDown(e, table)}
                className={`absolute cursor-move select-none transition-shadow ${
                  dragging === table.id ? 'z-10 shadow-xl' : 'shadow-md hover:shadow-lg'
                } ${
                  table.active 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-neutral-300 text-neutral-600'
                }`}
                style={{
                  left: table.posX,
                  top: table.posY,
                  width: table.width,
                  height: table.height,
                  borderRadius: '12px',
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <span className="font-bold text-lg">{table.code}</span>
                  <span className="text-xs opacity-80">{table.capacity}인</span>
                </div>
              </div>
            ))}

            {tables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                테이블을 추가하세요
              </div>
            )}
          </div>
        </div>
      )}

      {/* 그리드 뷰 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`bg-white rounded-xl p-4 border ${
                table.active ? 'border-neutral-200' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="font-bold text-indigo-600">{table.code}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  table.active
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {table.active ? '활성' : '비활성'}
                </span>
              </div>

              <h3 className="font-medium text-neutral-900">{table.name}</h3>
              <p className="text-sm text-neutral-500">{table.capacity}인 테이블</p>

              {/* QR 미리보기 */}
              <div className="my-3 flex justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.location.origin}/${dept}/code?table=${table.code}`)}`}
                  alt={`QR ${table.code}`}
                  className="w-20 h-20 rounded-lg border border-neutral-200"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => downloadQRCode(table.code, dept)}
                  className="flex-1 py-1.5 text-sm font-medium rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  QR
                </button>
                <button
                  onClick={() => toggleActive(table.id, table.active)}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    table.active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  }`}
                >
                  {table.active ? '비활성' : '활성'}
                </button>
                <button
                  onClick={() => deleteTable(table.id)}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tables.length === 0 && viewMode === 'grid' && (
        <div className="text-center py-12 text-neutral-500">
          테이블이 없습니다. 테이블을 추가하세요.
        </div>
      )}

      {/* 테이블 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">테이블 추가</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  테이블 코드 *
                </label>
                <input
                  type="text"
                  value={newTable.code}
                  onChange={(e) => setNewTable({ ...newTable, code: e.target.value })}
                  className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  placeholder="A1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  테이블 이름
                </label>
                <input
                  type="text"
                  value={newTable.name}
                  onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                  className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  placeholder="창가 테이블"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  수용 인원
                </label>
                <input
                  type="number"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  min={1}
                  max={20}
                />
              </div>

              <button
                onClick={createTable}
                className="w-full py-2.5 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-600 transition-colors"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
