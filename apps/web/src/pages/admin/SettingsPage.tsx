// =============================================================================
// Admin Settings Page - 설정 관리
// =============================================================================

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { apiClient } from '@/shared/api';
import { ImageUpload } from '@/shared/ui';

interface OnboardingSlide {
  id: string;
  enabled: boolean;
  imageUrl: string | null;
  title: string;
  body: string;
  order: number;
}

interface Settings {
  branding: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    logoUrl: string | null;
  };
  flow: {
    entryModes: string[];
    showOnboarding: boolean;
    requireReservationForFirstOrder: boolean;
  };
  reservation: {
    startTime: string;
    endTime: string;
    intervalMinutes: number;
    durationMinutes: number;
    maxPeople: number;
  };
  payment: {
    method: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  pricing: {
    tableFee: number;
    discounts: { label: string; amount: number; condition: string }[];
  };
  onboarding: OnboardingSlide[];
}

const defaultOnboarding: OnboardingSlide[] = [
  { id: 'slide1', enabled: true, imageUrl: null, title: '환영합니다!', body: '즐거운 시간 보내세요', order: 1 },
  { id: 'slide2', enabled: true, imageUrl: null, title: '메뉴 주문', body: '원하는 메뉴를 골라 주문하세요', order: 2 },
  { id: 'slide3', enabled: true, imageUrl: null, title: '결제 안내', body: '계좌이체로 결제해주세요', order: 3 },
];

const defaultSettings: Settings = {
  branding: { primaryColor: '#6366F1', secondaryColor: '#F3F4F6', backgroundColor: '#FFFFFF', logoUrl: null },
  flow: {
    entryModes: ['reservation'],
    showOnboarding: true,
    requireReservationForFirstOrder: false,
  },
  reservation: {
    startTime: '18:00',
    endTime: '23:00',
    intervalMinutes: 30,
    durationMinutes: 60,
    maxPeople: 6,
  },
  payment: {
    method: 'transfer',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  },
  pricing: {
    tableFee: 0,
    discounts: [],
  },
  onboarding: defaultOnboarding,
};

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const dept = user?.departmentSlug ?? 'cs';

  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'branding' | 'payment' | 'reservation' | 'pricing' | 'flow' | 'onboarding'>('branding');

  useEffect(() => {
    fetchSettings();
  }, [dept]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<{ settings: Settings }>(`/api/${dept}/settings`);
      if (response.data?.settings) {
        // 기존 설정과 기본값 병합 (누락된 필드 대응)
        const serverSettings = response.data.settings;
        setSettings({
          ...defaultSettings,
          ...serverSettings,
          branding: { ...defaultSettings.branding, ...serverSettings?.branding },
          flow: { ...defaultSettings.flow, ...serverSettings?.flow },
          reservation: { ...defaultSettings.reservation, ...serverSettings?.reservation },
          payment: { ...defaultSettings.payment, ...serverSettings?.payment },
          pricing: { ...defaultSettings.pricing, ...serverSettings?.pricing },
          onboarding: serverSettings?.onboarding?.length > 0 
            ? serverSettings.onboarding 
            : defaultOnboarding,
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      console.log('Saving settings:', settings);
      const response = await apiClient.patch<Settings>(`/api/${dept}/admin/settings`, settings);
      console.log('Save response:', response);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // 저장된 설정 반영
      if (response.data) {
        setSettings({
          ...defaultSettings,
          ...response.data,
          branding: { ...defaultSettings.branding, ...(response.data as any)?.branding },
          flow: { ...defaultSettings.flow, ...(response.data as any)?.flow },
          reservation: { ...defaultSettings.reservation, ...(response.data as any)?.reservation },
          payment: { ...defaultSettings.payment, ...(response.data as any)?.payment },
          pricing: { ...defaultSettings.pricing, ...(response.data as any)?.pricing },
          onboarding: (response.data as any)?.onboarding?.length > 0 
            ? (response.data as any).onboarding 
            : settings.onboarding,
        });
      }
      
      alert('설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('저장에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={fetchSettings} className="text-indigo-500 hover:underline">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'branding', label: '브랜딩' },
    { key: 'onboarding', label: '온보딩' },
    { key: 'payment', label: '결제 정보' },
    { key: 'reservation', label: '예약 설정' },
    { key: 'pricing', label: '가격 설정' },
    { key: 'flow', label: '플로우 설정' },
  ];

  // 온보딩 슬라이드 업데이트 헬퍼
  const updateSlide = (slideId: string, updates: Partial<OnboardingSlide>) => {
    setSettings({
      ...settings,
      onboarding: settings.onboarding.map(slide =>
        slide.id === slideId ? { ...slide, ...updates } : slide
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">설정</h1>
          <p className="text-neutral-500">주점 설정을 관리하세요</p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 설정 내용 */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        {activeTab === 'branding' && (
          <div className="space-y-6 max-w-lg">
            <h3 className="font-semibold text-neutral-900 mb-4">브랜딩 설정</h3>
            
            {/* 로고 이미지 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">로고 이미지</label>
              <ImageUpload
                value={settings.branding.logoUrl}
                onChange={(url) => setSettings({
                  ...settings,
                  branding: { ...settings.branding, logoUrl: url }
                })}
                category="logo"
                placeholder="로고 이미지 업로드"
              />
            </div>

            {/* 메인 컬러 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">메인 컬러 (버튼, 강조색)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.branding.primaryColor}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, primaryColor: e.target.value }
                  })}
                  className="w-12 h-12 rounded-lg border border-neutral-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.branding.primaryColor}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, primaryColor: e.target.value }
                  })}
                  className="flex-1 h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="#6366F1"
                />
              </div>
            </div>

            {/* 보조 컬러 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">보조 컬러 (보조 버튼, 카드 테두리)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.branding.secondaryColor}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, secondaryColor: e.target.value }
                  })}
                  className="w-12 h-12 rounded-lg border border-neutral-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.branding.secondaryColor}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, secondaryColor: e.target.value }
                  })}
                  className="flex-1 h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="#F3F4F6"
                />
              </div>
            </div>

            {/* 배경색 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">배경색</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.branding.backgroundColor}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, backgroundColor: e.target.value }
                  })}
                  className="w-12 h-12 rounded-lg border border-neutral-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.branding.backgroundColor}
                  onChange={(e) => setSettings({
                    ...settings,
                    branding: { ...settings.branding, backgroundColor: e.target.value }
                  })}
                  className="flex-1 h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            {/* 미리보기 */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">미리보기</label>
              <div 
                className="p-6 rounded-xl text-center overflow-hidden"
                style={{ backgroundColor: settings.branding.backgroundColor }}
              >
                <div 
                  className="p-4 rounded-xl text-white mb-3"
                  style={{ backgroundColor: settings.branding.primaryColor }}
                >
                  {settings.branding.logoUrl ? (
                    <img src={settings.branding.logoUrl} alt="Logo" className="h-12 mx-auto mb-2" />
                  ) : (
                    <div className="text-xl font-bold mb-1">KUPUB</div>
                  )}
                  <p className="text-sm opacity-80">학과 주점에 오신 것을 환영합니다</p>
                </div>
                <button 
                  className="px-6 py-2 rounded-xl font-medium transition-all"
                  style={{ 
                    backgroundColor: settings.branding.secondaryColor,
                    color: '#374151'
                  }}
                >
                  보조 버튼
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-4 max-w-md">
            <h3 className="font-semibold text-neutral-900 mb-4">계좌 정보</h3>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">은행</label>
              <input
                type="text"
                value={settings.payment.bankName}
                onChange={(e) => setSettings({
                  ...settings,
                  payment: { ...settings.payment, bankName: e.target.value }
                })}
                className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">계좌번호</label>
              <input
                type="text"
                value={settings.payment.accountNumber}
                onChange={(e) => setSettings({
                  ...settings,
                  payment: { ...settings.payment, accountNumber: e.target.value }
                })}
                className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">예금주</label>
              <input
                type="text"
                value={settings.payment.accountHolder}
                onChange={(e) => setSettings({
                  ...settings,
                  payment: { ...settings.payment, accountHolder: e.target.value }
                })}
                className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {activeTab === 'reservation' && (
          <div className="space-y-4 max-w-md">
            <h3 className="font-semibold text-neutral-900 mb-4">예약 설정</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">시작 시간</label>
                <input
                  type="time"
                  value={settings.reservation.startTime}
                  onChange={(e) => setSettings({
                    ...settings,
                    reservation: { ...settings.reservation, startTime: e.target.value }
                  })}
                  className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">종료 시간</label>
                <input
                  type="time"
                  value={settings.reservation.endTime}
                  onChange={(e) => setSettings({
                    ...settings,
                    reservation: { ...settings.reservation, endTime: e.target.value }
                  })}
                  className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">예약 간격 (분)</label>
              <input
                type="number"
                value={settings.reservation.intervalMinutes}
                onChange={(e) => setSettings({
                  ...settings,
                  reservation: { ...settings.reservation, intervalMinutes: Number(e.target.value) }
                })}
                className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">최대 인원</label>
              <input
                type="number"
                value={settings.reservation.maxPeople}
                onChange={(e) => setSettings({
                  ...settings,
                  reservation: { ...settings.reservation, maxPeople: Number(e.target.value) }
                })}
                className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-4 max-w-md">
            <h3 className="font-semibold text-neutral-900 mb-4">가격 설정</h3>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">테이블 비용 (원)</label>
              <input
                type="number"
                value={settings.pricing.tableFee}
                onChange={(e) => setSettings({
                  ...settings,
                  pricing: { ...settings.pricing, tableFee: Number(e.target.value) }
                })}
                className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {activeTab === 'flow' && (
          <div className="space-y-4 max-w-md">
            <h3 className="font-semibold text-neutral-900 mb-4">플로우 설정</h3>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.flow.showOnboarding}
                onChange={(e) => setSettings({
                  ...settings,
                  flow: { ...settings.flow, showOnboarding: e.target.checked }
                })}
                className="w-5 h-5 rounded border-neutral-300 text-indigo-500 focus:ring-indigo-500"
              />
              <span className="text-neutral-700">온보딩 표시</span>
            </label>
          </div>
        )}

        {activeTab === 'onboarding' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">온보딩 슬라이드</h3>
              <p className="text-sm text-neutral-500 mb-4">
                손님이 처음 입장할 때 보여줄 안내 슬라이드를 설정하세요.
              </p>
            </div>

            {settings.onboarding.map((slide, index) => (
              <div
                key={slide.id}
                className={`p-4 rounded-xl border-2 transition-colors ${
                  slide.enabled 
                    ? 'border-indigo-200 bg-white' 
                    : 'border-neutral-200 bg-neutral-50 opacity-60'
                }`}
              >
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="font-medium text-neutral-900">슬라이드 {index + 1}</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-neutral-500">
                      {slide.enabled ? '활성' : '비활성'}
                    </span>
                    <button
                      onClick={() => updateSlide(slide.id, { enabled: !slide.enabled })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        slide.enabled ? 'bg-indigo-500' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                          slide.enabled ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>

                {slide.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 이미지 */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">이미지</label>
                      <ImageUpload
                        value={slide.imageUrl}
                        onChange={(url) => updateSlide(slide.id, { imageUrl: url })}
                        category="onboarding"
                        placeholder="슬라이드 이미지 업로드"
                      />
                    </div>

                    {/* 텍스트 */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">제목</label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                          className="w-full h-10 px-3 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500"
                          placeholder="슬라이드 제목"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">설명</label>
                        <textarea
                          value={slide.body}
                          onChange={(e) => updateSlide(slide.id, { body: e.target.value })}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
                          rows={2}
                          placeholder="슬라이드 설명"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 미리보기 안내 */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800">
                💡 변경사항을 저장한 후 <span className="font-medium">/{dept}/onboarding</span>에서 미리보기할 수 있습니다.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

