// =============================================================================
// Onboarding Page v2 - Engaging Slides
// =============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDepartment, useDepartmentSettings } from '@/features/department';
import { Button, PageLayout } from '@/shared/ui';
import { storage, STORAGE_KEYS, cn } from '@/shared/utils';

const defaultSlides = [
  {
    id: 1,
    title: '조용한 주점',
    body: '컴퓨터학과는 예로부터 건실하고 조용한 자제들만 다닙니다. 조용히 합니다.',
    imageUrl: '/images/onboarding-1.png',
    enabled: true,
  },
  {
    id: 2,
    title: '이용 시간은 1시간',
    body: '원활한 운영을 위해 1시간 후에는 자리를 비워주세요.',
    imageUrl: '/images/onboarding-2.png',
    enabled: true,
  },
  {
    id: 3,
    title: '주류 반입 불가',
    body: '외부 음식/음료는 반입이 불가합니다. 저희 메뉴를 이용해주세요!',
    imageUrl: '/images/onboarding-3.png',
    enabled: true,
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { dept } = useDepartment();
  const settings = useDepartmentSettings();
  
  const allSlides = settings?.onboarding?.length ? settings.onboarding : defaultSlides;
  const slides = allSlides.filter(slide => slide.enabled !== false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slides.length === 0) {
      navigate(`/${dept}/reserve`, { replace: true });
    }
  }, [slides.length, navigate, dept]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex];
  const isLast = currentIndex === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      storage.set(`${STORAGE_KEYS.ONBOARDING_SEEN}_${dept}`, true);
      navigate(`/${dept}/reserve`);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    storage.set(`${STORAGE_KEYS.ONBOARDING_SEEN}_${dept}`, true);
    navigate(`/${dept}/reserve`);
  };

  return (
    <PageLayout noPadding className="flex flex-col min-h-screen" background="theme">
      {/* Skip */}
      <div className="flex justify-end p-5">
        <button
          onClick={handleSkip}
          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          건너뛰기
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Illustration */}
        <div key={currentIndex} className="w-64 h-64 mb-10 flex items-center justify-center animate-scale-up">
          <img
            src={currentSlide.imageUrl || `/images/onboarding-${currentIndex + 1}.png`}
            alt={currentSlide.title}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Text */}
        <div key={`text-${currentIndex}`} className="text-center animate-fade-in">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            {currentSlide.title}
          </h2>
          <p className="text-neutral-500 leading-relaxed max-w-xs mx-auto">
            {currentSlide.body}
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-6 pb-10">
        {/* Indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                idx === currentIndex
                  ? 'w-8 bg-theme-primary'
                  : 'w-2 bg-neutral-200 hover:bg-neutral-300'
              )}
            />
          ))}
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={handleNext}>
          {isLast ? '시작하기' : '다음'}
        </Button>
      </div>
    </PageLayout>
  );
}
