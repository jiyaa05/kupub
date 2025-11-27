// =============================================================================
// Department Context
// =============================================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { DepartmentSettings } from '@/shared/types/api';
import { fetchDepartmentSettings } from './api';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface DepartmentContextValue {
  dept: string;
  settings: DepartmentSettings | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// -----------------------------------------------------------------------------
// Utility: Convert hex to RGB
// -----------------------------------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

interface ThemeColors {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
}

function applyThemeColors(colors: ThemeColors) {
  const root = document.documentElement;
  
  // 메인 컬러
  if (colors.primaryColor) {
    const rgb = hexToRgb(colors.primaryColor);
    if (rgb) {
      root.style.setProperty('--theme-primary', colors.primaryColor);
      root.style.setProperty('--theme-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      
      // 밝은 버전 (배경용)
      root.style.setProperty('--theme-primary-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
      root.style.setProperty('--theme-primary-lighter', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`);
      
      // 호버 (약간 어둡게)
      const darken = (val: number) => Math.max(0, Math.floor(val * 0.85));
      root.style.setProperty('--theme-primary-hover', `rgb(${darken(rgb.r)}, ${darken(rgb.g)}, ${darken(rgb.b)})`);
    }
  }
  
  // 보조 컬러
  if (colors.secondaryColor) {
    const rgb = hexToRgb(colors.secondaryColor);
    if (rgb) {
      root.style.setProperty('--theme-secondary', colors.secondaryColor);
      root.style.setProperty('--theme-secondary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      
      // 호버 (약간 어둡게)
      const darken = (val: number) => Math.max(0, Math.floor(val * 0.92));
      root.style.setProperty('--theme-secondary-hover', `rgb(${darken(rgb.r)}, ${darken(rgb.g)}, ${darken(rgb.b)})`);
    }
  }
  
  // 배경색
  if (colors.backgroundColor) {
    root.style.setProperty('--theme-background', colors.backgroundColor);
    
    // 배경색이 어두운지 밝은지 판단해서 텍스트 색상 자동 조정
    const rgb = hexToRgb(colors.backgroundColor);
    if (rgb) {
      const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
      const textColor = brightness > 128 ? '#171717' : '#FAFAFA';
      root.style.setProperty('--theme-text', textColor);
    }
  }
}

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

const DepartmentContext = createContext<DepartmentContextValue | null>(null);

// -----------------------------------------------------------------------------
// Provider
// -----------------------------------------------------------------------------

interface DepartmentProviderProps {
  dept: string;
  children: ReactNode;
}

export function DepartmentProvider({ dept, children }: DepartmentProviderProps) {
  const [settings, setSettings] = useState<DepartmentSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    const response = await fetchDepartmentSettings(dept);
    
    if (response.error) {
      setError(response.error.message);
      setSettings(null);
    } else {
      setSettings(response.data);
      
      // 테마 컬러 적용
      const branding = response.data?.settings?.branding;
      if (branding) {
        applyThemeColors({
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          backgroundColor: branding.backgroundColor,
        });
      }
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, [dept]);

  // settings 변경 시 테마 색상 재적용
  useEffect(() => {
    const branding = settings?.settings?.branding;
    if (branding) {
      applyThemeColors({
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        backgroundColor: branding.backgroundColor,
      });
    }
  }, [settings]);

  return (
    <DepartmentContext.Provider
      value={{
        dept,
        settings,
        isLoading,
        error,
        refetch: fetchSettings,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
}

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

export function useDepartment() {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error('useDepartment must be used within DepartmentProvider');
  }
  return context;
}

export function useDepartmentSettings() {
  const { settings } = useDepartment();
  return settings?.settings ?? null;
}

export function useDepartmentInfo() {
  const { settings } = useDepartment();
  return settings?.department ?? null;
}

