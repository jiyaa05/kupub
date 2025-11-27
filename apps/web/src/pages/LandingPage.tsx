// =============================================================================
// Landing Page v2 - Clean & Inviting
// =============================================================================

import { useNavigate } from 'react-router-dom';
import { useDepartment, useDepartmentSettings, useDepartmentInfo } from '@/features/department';
import { useSession } from '@/features/session';
import { Button, PageLayout } from '@/shared/ui';
import { storage, STORAGE_KEYS } from '@/shared/utils';

export default function LandingPage() {
  const navigate = useNavigate();
  const { dept } = useDepartment();
  const departmentInfo = useDepartmentInfo();
  const settings = useDepartmentSettings();
  const { session } = useSession();

  const flow = settings?.flow;

  const hasSeenOnboarding = storage.get<boolean>(`${STORAGE_KEYS.ONBOARDING_SEEN}_${dept}`);

  const handleReservation = () => {
    if (flow?.showOnboarding && !hasSeenOnboarding) {
      navigate(`/${dept}/onboarding`);
    } else {
      navigate(`/${dept}/reserve`);
    }
  };

  const handleContinue = () => {
    navigate(`/${dept}/menu`);
  };

  return (
    <PageLayout noPadding className="flex flex-col min-h-screen" background="theme">
      {/* Background Pattern - Uses theme colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 theme-blob-1 rounded-full blur-3xl opacity-70" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 theme-blob-2 rounded-full blur-3xl opacity-70" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-8">
        {/* Logo */}
        <div className="mb-6">
          {settings?.branding?.logoUrl ? (
            <img
              src={settings.branding.logoUrl}
              alt={departmentInfo?.name}
              className="w-32 h-32 object-contain"
            />
          ) : (
            <img
              src="/logo.png"
              alt="Logo"
              className="w-32 h-32 object-contain"
            />
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-neutral-900 mb-2 text-center">
          {departmentInfo?.name ?? '주점'}
        </h1>
        <p className="text-neutral-500 text-center mb-12">
          간편하게 예약하고 주문하세요
        </p>
      </div>

      {/* Bottom Buttons */}
      <div className="relative px-6 pb-10 space-y-3">
        {session && (
          <Button variant="primary" size="lg" fullWidth onClick={handleContinue}>
            주문 계속하기
          </Button>
        )}

        <Button
          variant={session ? 'secondary' : 'primary'}
          size="lg"
          fullWidth
          onClick={handleReservation}
        >
          {session ? '새로 예약하기' : '예약하기'}
        </Button>
      </div>
    </PageLayout>
  );
}
