// =============================================================================
// Admin Menus Page - 메뉴 관리
// =============================================================================

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { apiClient } from '@/shared/api';
import { formatPrice } from '@/shared/utils';
import { ImageUpload } from '@/shared/ui';
import type { MenuItem, MenuCategory } from '@/shared/types/api';

interface MenuFormData {
  categoryId: number | null;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  displayOrder: number;
}

const initialFormData: MenuFormData = {
  categoryId: null,
  name: '',
  price: 0,
  description: '',
  imageUrl: '',
  displayOrder: 0,
};

export default function AdminMenusPage() {
  const { user } = useAuth();
  const dept = user?.departmentSlug ?? 'cs';

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<MenuFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  // 카테고리 관리
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  useEffect(() => {
    fetchData();
  }, [dept]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ categories: MenuCategory[]; menus: MenuItem[] }>(
        `/api/${dept}/menus`
      );
      if (response.data) {
        setCategories(response.data.categories);
        setMenus(response.data.menus);
      }
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSoldOut = async (menuId: number, soldOut: boolean) => {
    try {
      await apiClient.patch(`/api/${dept}/admin/menus/${menuId}`, { soldOut: !soldOut });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle sold out:', error);
    }
  };

  const openAddModal = () => {
    setEditingMenu(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (menu: MenuItem) => {
    setEditingMenu(menu);
    setFormData({
      categoryId: menu.categoryId,
      name: menu.name,
      price: menu.price,
      description: menu.description || '',
      imageUrl: menu.imageUrl || '',
      displayOrder: menu.displayOrder,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      alert('메뉴 이름과 가격을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      if (editingMenu) {
        await apiClient.patch(`/api/${dept}/admin/menus/${editingMenu.id}`, formData);
      } else {
        await apiClient.post(`/api/${dept}/admin/menus`, formData);
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to save menu:', error);
      const message = error.response?.data?.message || error.response?.data?.error;
      if (message?.includes('duplicate') || message?.includes('중복') || message?.includes('already exists')) {
        alert('이미 동일한 이름의 메뉴가 존재합니다.');
      } else {
        alert(message || '저장에 실패했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (menuId: number) => {
    if (!confirm('이 메뉴를 삭제하시겠습니까?')) return;

    try {
      await apiClient.delete(`/api/${dept}/admin/menus/${menuId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete menu:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  // 카테고리 관리
  const openCategoryModal = (category?: MenuCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName('');
    }
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async () => {
    if (!categoryName.trim()) {
      alert('카테고리 이름을 입력해주세요.');
      return;
    }

    try {
      if (editingCategory) {
        await apiClient.patch(`/api/${dept}/admin/menus/categories/${editingCategory.id}`, {
          name: categoryName,
        });
      } else {
        await apiClient.post(`/api/${dept}/admin/menus/categories`, {
          name: categoryName,
        });
      }
      setShowCategoryModal(false);
      setCategoryName('');
      setEditingCategory(null);
      fetchData();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      const message = error.response?.data?.message || error.response?.data?.error;
      if (message?.includes('duplicate') || message?.includes('중복') || message?.includes('already exists')) {
        alert('이미 동일한 이름의 카테고리가 존재합니다.');
      } else {
        alert(message || '저장에 실패했습니다.');
      }
    }
  };

  const handleCategoryDelete = async (categoryId: number) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까? 해당 카테고리의 메뉴들은 카테고리 없음이 됩니다.')) return;

    try {
      await apiClient.delete(`/api/${dept}/admin/menus/categories/${categoryId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const filteredMenus = selectedCategory
    ? menus.filter((m) => m.categoryId === selectedCategory)
    : menus;

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
          <h1 className="text-2xl font-bold text-neutral-900">메뉴 관리</h1>
          <p className="text-neutral-500">메뉴와 품절 상태를 관리하세요</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openCategoryModal()}
            className="px-4 py-2 bg-white text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            카테고리 관리
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            메뉴 추가
          </button>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-indigo-500 text-white'
              : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
          }`}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            onDoubleClick={() => openCategoryModal(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === cat.id
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
            }`}
            title="더블클릭으로 수정"
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 메뉴 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMenus.map((menu) => (
          <div
            key={menu.id}
            className={`bg-white rounded-xl p-4 border ${
              menu.soldOut ? 'border-red-200 bg-red-50' : 'border-neutral-200'
            }`}
          >
            <div className="flex gap-4">
              {/* 이미지 */}
              <div className="w-20 h-20 bg-neutral-200 rounded-lg flex-shrink-0 overflow-hidden">
                {menu.imageUrl ? (
                  <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`font-medium ${menu.soldOut ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
                      {menu.name}
                    </h3>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      {categories.find((c) => c.id === menu.categoryId)?.name || '미분류'}
                    </p>
                  </div>
                  <span className="font-semibold text-indigo-600">{formatPrice(menu.price)}</span>
                </div>

                {menu.description && (
                  <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{menu.description}</p>
                )}

                {/* 액션 */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => toggleSoldOut(menu.id, menu.soldOut)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      menu.soldOut
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {menu.soldOut ? '품절 해제' : '품절 처리'}
                  </button>
                  <button
                    onClick={() => openEditModal(menu)}
                    className="px-3 py-1 text-sm font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(menu.id)}
                    className="px-3 py-1 text-sm font-medium rounded-lg bg-neutral-100 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredMenus.length === 0 && (
        <div className="text-center py-12 text-neutral-500">
          메뉴가 없습니다
        </div>
      )}

      {/* 메뉴 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingMenu ? '메뉴 수정' : '메뉴 추가'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">카테고리</label>
                <select
                  value={formData.categoryId ?? ''}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">카테고리 선택</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">메뉴 이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="메뉴 이름"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">가격 *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="가격"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="메뉴 설명"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">이미지</label>
                <ImageUpload
                  value={formData.imageUrl || null}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url || '' })}
                  category="menu"
                  placeholder="메뉴 이미지 업로드"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 모달 */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingCategory ? '카테고리 수정' : '카테고리 추가'}
              </h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">카테고리 이름</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="예: 안주, 주류, 음료"
                />
              </div>

              {/* 기존 카테고리 목록 */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">기존 카테고리</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
                      <span>{cat.name}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryName(cat.name);
                          }}
                          className="p-1 text-indigo-600 hover:bg-indigo-100 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleCategoryDelete(cat.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300"
                >
                  닫기
                </button>
                <button
                  onClick={handleCategorySubmit}
                  className="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                >
                  {editingCategory ? '수정' : '추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
