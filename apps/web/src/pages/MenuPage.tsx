// =============================================================================
// Menu Page v2 - Beautiful Menu Grid
// =============================================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDepartment } from '@/features/department';
import { useMenus } from '@/features/menu';
import { useCart } from '@/features/cart';
import { Button, Header, PageLayout, Card, Badge, Spinner } from '@/shared/ui';
import { formatPrice, cn } from '@/shared/utils';
import type { MenuItem } from '@/shared/types/api';

export default function MenuPage() {
  const navigate = useNavigate();
  const { dept } = useDepartment();
  const { data, isLoading, error } = useMenus();
  const { addItem, itemCount, total } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const categories = data?.categories ?? [];
  const menus = data?.menus ?? [];

  const filteredMenus = useMemo(() => {
    if (selectedCategory === null) return menus;
    return menus.filter((m) => m.categoryId === selectedCategory);
  }, [menus, selectedCategory]);

  const handleAddMenu = (menu: MenuItem) => {
    if (menu.soldOut) return;
    addItem({ menuId: menu.id, name: menu.name, price: menu.price, imageUrl: menu.imageUrl });
  };

  if (isLoading) {
    return (
      <PageLayout className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout header={<Header showBack backTo={`/${dept}`} />} className="flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout noPadding header={<Header showBack backTo={`/${dept}`} title="메뉴" />}>
      {/* Categories */}
      <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-100">
        <div className="flex gap-2 px-5 py-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              selectedCategory === null
                ? 'bg-theme-primary text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                selectedCategory === cat.id
                  ? 'bg-theme-primary text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="p-5 space-y-4 pb-32">
        {filteredMenus.length === 0 ? (
          <div className="py-20 text-center text-neutral-400">메뉴가 없습니다</div>
        ) : (
          filteredMenus.map((menu) => (
            <MenuCard key={menu.id} menu={menu} onAdd={() => handleAddMenu(menu)} />
          ))
        )}
      </div>

      {/* Bottom Cart Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent">
          <div className="max-w-md mx-auto">
            <Button variant="primary" size="lg" fullWidth onClick={() => navigate(`/${dept}/cart`)}>
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-white/20 rounded-full text-sm font-bold">
                    {itemCount}
                  </span>
                  장바구니 보기
                </span>
                <span className="font-bold">{formatPrice(total)}</span>
              </div>
            </Button>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

function MenuCard({ menu, onAdd }: { menu: MenuItem; onAdd: () => void }) {
  return (
    <Card variant="default" padding="none" hoverable className="overflow-hidden">
      <div className="flex p-4 gap-4">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h3 className="font-bold text-neutral-900">{menu.name}</h3>
            {menu.soldOut && <Badge variant="error" size="sm">품절</Badge>}
          </div>
          {menu.description && (
            <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{menu.description}</p>
          )}
          <p className="text-lg font-bold text-theme-primary">{formatPrice(menu.price)}</p>
        </div>

        {/* Image + Add */}
        <div className="relative w-24 h-24 flex-shrink-0">
          {menu.imageUrl ? (
            <img src={menu.imageUrl} alt={menu.name} className="w-full h-full object-cover rounded-xl bg-neutral-100" />
          ) : (
            <div className="w-full h-full rounded-xl bg-theme-primary-lighter flex items-center justify-center">
              <span className="text-3xl">🍽️</span>
            </div>
          )}
          {!menu.soldOut && (
            <button
              onClick={(e) => { e.stopPropagation(); onAdd(); }}
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-theme-primary text-white flex items-center justify-center shadow-lg hover:bg-theme-primary-hover transition-colors press"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
