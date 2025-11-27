// =============================================================================
// Code Entry Page - 테이블 코드 입력
// =============================================================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageLayout, Header, Button } from '@/shared/ui';
import { useSession } from '@/features/session';
import { apiClient } from '@/shared/api';

export default function CodeEntryPage() {
  const { dept } = useParams<{ dept: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { startSession } = useSession();

  const [code, setCode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [people, setPeople] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL에서 테이블 코드 가져오기 (QR 스캔에서 넘어온 경우)
  useEffect(() => {
    const tableCode = searchParams.get('table');
    if (tableCode) {
      setCode(tableCode);
    }
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('테이블 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 세션 시작
      const response = await apiClient.post(`/api/${dept}/sessions/start`, {
        type: 'CODE',
        sessionCode: code.toUpperCase(),
        guestName: guestName || '손님',
        people,
      });

      if (response.data) {
        // 세션 저장
        startSession(response.data);
        // 메뉴 페이지로 이동
        navigate(`/${dept}/menu`);
      }
    } catch (err: any) {
      console.error('Session start failed:', err);
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else {
        setError('세션을 시작할 수 없습니다. 테이블 코드를 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout header={<Header title="테이블 코드 입력" showBack />}>

      <div className="flex-1 p-6">
        <div className="max-w-sm mx-auto space-y-6">
          {/* 코드 입력 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              테이블 코드 *
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="예: A1, B2"
              className="w-full h-14 px-4 text-2xl text-center font-bold tracking-widest border-2 border-neutral-300 rounded-xl focus:outline-none focus:border-indigo-500"
              maxLength={10}
            />
            <p className="text-sm text-neutral-500 mt-2">
              테이블에 있는 코드를 입력해주세요
            </p>
          </div>

          {/* 이름 입력 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              이름 (선택)
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="이름을 입력해주세요"
              className="w-full h-12 px-4 border border-neutral-300 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* 인원 수 */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              인원 수
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPeople(Math.max(1, people - 1))}
                className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-xl font-bold hover:bg-neutral-200"
              >
                -
              </button>
              <span className="text-2xl font-bold w-12 text-center">{people}</span>
              <button
                onClick={() => setPeople(Math.min(20, people + 1))}
                className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-xl font-bold hover:bg-neutral-200"
              >
                +
              </button>
              <span className="text-neutral-500">명</span>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 확인 버튼 */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            className="w-full"
          >
            {loading ? '확인 중...' : '입장하기'}
          </Button>

          {/* QR 스캔 링크 */}
          <div className="text-center">
            <button
              onClick={() => navigate(`/${dept}/qr`)}
              className="text-indigo-600 text-sm hover:underline"
            >
              QR 코드로 스캔하기
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

