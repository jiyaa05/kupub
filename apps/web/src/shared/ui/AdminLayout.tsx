// =============================================================================
// Admin Layout - 관리자 사이드바 레이아웃
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { apiClient } from '@/shared/api';
import { cn } from '@/shared/utils';

// 사이드바 메뉴 아이템
const menuItems = [
  {
    name: '대시보드',
    path: 'dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    name: '예약/주문 관리',
    path: 'service-hub',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-8 0h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    name: '메뉴 관리',
    path: 'menus',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    name: '테이블 관리',
    path: 'tables',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    name: '통계',
    path: 'stats',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: '설정',
    path: 'settings',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    message: string;
    time: string;
  }>>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  const dept = user?.departmentSlug ?? 'cs';
  const basePath = `/admin/${dept}`;

  // 알림: pending 주문 상위 5개를 간단히 표시
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get<any[]>(`/api/${dept}/admin/orders?status=PENDING`);
        if (res.data) {
          const list = res.data.slice(0, 5).map((order: any) => ({
            id: order.id,
            message: `새 주문 #${order.id}`,
            time: new Date(order.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          }));
          setNotifications(list);
        }
      } catch {
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, [dept]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const encoded = encodeURIComponent(searchQuery.trim());
      navigate(`${basePath}/service-hub?search=${encoded}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      {/* 사이드바 */}
      <aside
        className={cn(
          'bg-white border-r border-neutral-200 flex flex-col transition-all duration-300 sticky top-0 h-screen',
          sidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* 로고 영역 */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200">
          {sidebarOpen && (
            <span className="font-bold text-xl text-indigo-600">Admin</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
            </svg>
          </button>
        </div>

        {/* 메뉴 */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-auto">
          {menuItems.map((item) => {
            const fullPath = `${basePath}/${item.path}`;
            const isActive = location.pathname === fullPath;

            return (
              <Link
                key={item.path}
                to={fullPath}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-indigo-500 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                )}
              >
                {item.icon}
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* 로그아웃 */}
        <div className="p-3 border-t border-neutral-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && <span className="font-medium">로그아웃</span>}
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col">
        {/* 상단 헤더 */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6">
          {/* 검색 */}
          <form onSubmit={handleSearch} className="flex items-center gap-3 bg-neutral-100 rounded-lg px-4 py-2 w-96">
            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="주문번호, 이름, 전화번호 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-neutral-700 placeholder:text-neutral-400 w-full"
            />
          </form>

          {/* 우측 액션 */}
          <div className="flex items-center gap-3">
            {/* 알림 */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 relative"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-neutral-200 z-50">
                  <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                    <h3 className="font-semibold text-neutral-900">알림</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => setNotifications([])}
                        className="text-xs text-neutral-500 hover:text-neutral-700"
                      >
                        모두 지우기
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-neutral-500">새 알림이 없습니다</div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => {
                            setNotificationOpen(false);
                            navigate(`${basePath}/service-hub?search=${notification.id}`);
                          }}
                          className="w-full p-4 hover:bg-neutral-50 flex items-start gap-3 text-left border-b border-neutral-50"
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm bg-indigo-500">
                            📦
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900">{notification.message}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">{notification.time}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-neutral-100">
                      <button
                        onClick={() => {
                          setNotificationOpen(false);
                          navigate(`${basePath}/service-hub`);
                        }}
                        className="w-full text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        서비스 허브로 이동
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 프로필 + 로그아웃 */}
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-medium">
              {user?.username?.charAt(0).toUpperCase() ?? 'A'}
            </div>
          </div>
        </header>

        {/* 페이지 컨텐츠 */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
