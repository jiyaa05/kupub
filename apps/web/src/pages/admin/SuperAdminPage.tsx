// =============================================================================
// Super Admin Page - 총관리자: 학과/계정 관리
// =============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/shared/api';
import { useAuth } from '@/features/auth';

interface Department {
  id: number;
  slug: string;
  name: string;
  active: boolean;
}

interface User {
  id: number;
  username: string;
  departmentId: number | null;
  role: string;
  enabled: boolean;
}

export default function SuperAdminPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'departments' | 'users'>('departments');

  // 학과 추가 모달
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDept, setNewDept] = useState({ slug: '', name: '' });

  // 계정 추가 모달
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    departmentId: '',
    role: 'DEPT_ADMIN',
  });

  // 비밀번호 변경 모달
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, userRes] = await Promise.all([
        apiClient.get<Department[]>('/api/platform/departments'),
        apiClient.get<User[]>('/api/platform/users'),
      ]);
      if (deptRes.data) setDepartments(deptRes.data);
      if (userRes.data) setUsers(userRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDepartment = async () => {
    if (!newDept.slug || !newDept.name) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      await apiClient.post('/api/platform/departments', newDept);
      setShowDeptModal(false);
      setNewDept({ slug: '', name: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to create department:', error);
      alert('생성에 실패했습니다.');
    }
  };

  const createUser = async () => {
    if (!newUser.username || !newUser.password) {
      alert('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    if (newUser.role !== 'SUPER_ADMIN' && !newUser.departmentId) {
      alert('학과 관리자는 학과를 선택해야 합니다.');
      return;
    }

    try {
      const response = await apiClient.post('/api/platform/users', {
        ...newUser,
        departmentId: newUser.departmentId ? Number(newUser.departmentId) : null,
      });
      
      if (response.error) {
        console.error('Failed to create user:', response.error);
        alert(`생성에 실패했습니다: ${response.error.message}`);
        return;
      }
      
      setShowUserModal(false);
      setNewUser({ username: '', password: '', departmentId: '', role: 'DEPT_ADMIN' });
      fetchData();
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('생성에 실패했습니다. (네트워크 오류)');
    }
  };

  const toggleDepartment = async (deptId: number, active: boolean) => {
    try {
      await apiClient.patch(`/api/platform/departments/${deptId}`, { active: !active });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle department:', error);
    }
  };

  const toggleUser = async (userId: number, enabled: boolean) => {
    try {
      await apiClient.patch(`/api/platform/users/${userId}`, { enabled: !enabled });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle user:', error);
    }
  };

  const changePassword = async () => {
    if (!passwordTarget || !newPassword) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      const response = await apiClient.patch(`/api/platform/users/${passwordTarget.id}`, { 
        password: newPassword 
      });
      
      if (response.error) {
        alert(`비밀번호 변경 실패: ${response.error.message}`);
        return;
      }
      
      setShowPasswordModal(false);
      setPasswordTarget(null);
      setNewPassword('');
      alert('비밀번호가 변경되었습니다.');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('비밀번호 변경에 실패했습니다.');
    }
  };

  const deleteUser = async (user: User) => {
    if (user.role === 'SUPER_ADMIN') {
      alert('총관리자 계정은 삭제할 수 없습니다.');
      return;
    }

    if (!confirm(`정말 "${user.username}" 계정을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/api/platform/users/${user.id}`);
      
      if (response.error) {
        alert(`삭제 실패: ${response.error.message}`);
        return;
      }
      
      fetchData();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const deleteDepartment = async (dept: Department) => {
    const deptUsers = users.filter(u => u.departmentId === dept.id);
    
    const warningMessage = `⚠️ "${dept.name}" 학과를 삭제하면 다음 데이터가 모두 삭제됩니다:\n\n` +
      `• 메뉴 및 카테고리\n` +
      `• 모든 주문 내역\n` +
      `• 예약 내역\n` +
      `• 테이블 설정\n` +
      `• 세션 데이터\n` +
      `• 학과 설정\n` +
      (deptUsers.length > 0 ? `\n연결된 ${deptUsers.length}명의 계정은 학과 연결이 해제됩니다.\n` : '') +
      `\n정말 삭제하시겠습니까?`;

    if (!confirm(warningMessage)) {
      return;
    }

    try {
      const response = await apiClient.delete(`/api/platform/departments/${dept.id}`);
      
      if (response.error) {
        alert(`삭제 실패: ${response.error.message}`);
        return;
      }
      
      alert('학과가 삭제되었습니다.');
      fetchData();
    } catch (error) {
      console.error('Failed to delete department:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">총관리자 페이지</h1>
            <p className="text-neutral-500 mt-1">학과와 관리자 계정을 관리합니다</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            로그아웃
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white p-1 rounded-lg w-fit mb-6 shadow-sm">
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'departments'
                ? 'bg-indigo-500 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            학과 관리
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-indigo-500 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            계정 관리
          </button>
        </div>

        {/* Department Tab */}
        {activeTab === 'departments' && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">학과 목록</h2>
              <button
                onClick={() => setShowDeptModal(true)}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm"
              >
                + 학과 추가
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">슬러그</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">이름</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 text-sm text-neutral-900">{dept.id}</td>
                      <td className="px-6 py-4 text-sm font-mono text-indigo-600">{dept.slug}</td>
                      <td className="px-6 py-4 text-sm text-neutral-900">{dept.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            dept.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {dept.active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-4">
                        <button
                          onClick={() => toggleDepartment(dept.id, dept.active)}
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          {dept.active ? '비활성화' : '활성화'}
                        </button>
                        <a
                          href={`/${dept.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-neutral-500 hover:text-neutral-700"
                        >
                          손님 페이지
                        </a>
                        <a
                          href={`/admin/${dept.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-neutral-500 hover:text-neutral-700"
                        >
                          관리자
                        </a>
                        <button
                          onClick={() => deleteDepartment(dept)}
                          className="text-sm text-red-500 hover:text-red-700"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold">계정 목록</h2>
              <button
                onClick={() => setShowUserModal(true)}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm"
              >
                + 계정 추가
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">아이디</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">권한</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">학과</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 text-sm text-neutral-900">{user.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-neutral-900">{user.username}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.role === 'SUPER_ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'DEPT_ADMIN'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-500">
                        {user.departmentId
                          ? departments.find((d) => d.id === user.departmentId)?.name || user.departmentId
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.enabled ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 space-x-4">
                        <button
                          onClick={() => toggleUser(user.id, user.enabled)}
                          className="text-sm text-indigo-600 hover:text-indigo-800"
                        >
                          {user.enabled ? '비활성화' : '활성화'}
                        </button>
                        <button
                          onClick={() => {
                            setPasswordTarget(user);
                            setShowPasswordModal(true);
                          }}
                          className="text-sm text-amber-600 hover:text-amber-800"
                        >
                          비밀번호
                        </button>
                        {user.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => deleteUser(user)}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            삭제
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Department Modal */}
        {showDeptModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">학과 추가</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">슬러그(URL)</label>
                  <input
                    type="text"
                    value={newDept.slug}
                    onChange={(e) => setNewDept({ ...newDept, slug: e.target.value.toLowerCase() })}
                    placeholder="예: cs, ee, me"
                    className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">학과 이름</label>
                  <input
                    type="text"
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    placeholder="예: 컴퓨터공학과"
                    className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowDeptModal(false)}
                    className="flex-1 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300"
                  >
                    취소
                  </button>
                  <button
                    onClick={createDepartment}
                    className="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                  >
                    생성
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">계정 추가</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">아이디</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">비밀번호</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">권한</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SUPER_ADMIN">총관리자</option>
                    <option value="DEPT_ADMIN">학과 관리자</option>
                    <option value="STAFF">스태프</option>
                  </select>
                </div>
                {newUser.role !== 'SUPER_ADMIN' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">학과</label>
                    <select
                      value={newUser.departmentId}
                      onChange={(e) => setNewUser({ ...newUser, departmentId: e.target.value })}
                      className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">선택하세요</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300"
                  >
                    취소
                  </button>
                  <button
                    onClick={createUser}
                    className="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                  >
                    생성
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && passwordTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">비밀번호 변경</h2>
              <p className="text-neutral-500 mb-4">
                <span className="font-medium text-neutral-900">{passwordTarget.username}</span> 계정의 비밀번호를 변경합니다.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">새 비밀번호</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="최소 6자 이상"
                    className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordTarget(null);
                      setNewPassword('');
                    }}
                    className="flex-1 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300"
                  >
                    취소
                  </button>
                  <button
                    onClick={changePassword}
                    className="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                  >
                    변경
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
