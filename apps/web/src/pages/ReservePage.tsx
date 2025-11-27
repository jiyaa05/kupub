// =============================================================================
// Reserve Page v2 - Clean Form (Unified Style)
// =============================================================================

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDepartment, useDepartmentSettings } from '@/features/department';
import { createReservation } from '@/features/reservation';
import { useSession } from '@/features/session';
import { Button, Input, Header, PageLayout, SelectChip, Card } from '@/shared/ui';

export default function ReservePage() {
  const navigate = useNavigate();
  const { dept } = useDepartment();
  const settings = useDepartmentSettings();
  const { startSession } = useSession();
  
  const reservationSettings = settings?.reservation;
  const closedSlots = settings?.reservationClosed ?? [];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [people, setPeople] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peopleOptions = [
    { value: 2, label: '2명' },
    { value: 3, label: '3명' },
    { value: 4, label: '4명' },
    { value: 5, label: '5명+' },
  ];

  const timeSlots = useMemo(() => {
    if (!reservationSettings) return [];
    const { startTime, endTime, intervalMinutes } = reservationSettings;
    const slots: string[] = [];
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    let current = startHour * 60 + startMin;
    let end = endHour * 60 + endMin;
    if (end <= current) end += 24 * 60;
    while (current < end) {
      const hour = Math.floor(current / 60) % 24;
      const min = current % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      slots.push(`${dateStr}T${timeStr}:00`);
      current += intervalMinutes;
    }
    return slots;
  }, [reservationSettings]);

  const isSlotClosed = (slot: string) => closedSlots.includes(slot);

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) setPhone(cleaned);
    else if (cleaned.length <= 7) setPhone(`${cleaned.slice(0, 3)}-${cleaned.slice(3)}`);
    else setPhone(`${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) { setError('시간을 선택해주세요.'); return; }
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    if (phone.replace(/-/g, '').length < 10) { setError('전화번호를 확인해주세요.'); return; }
    if (!people) { setError('인원을 선택해주세요.'); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await createReservation(dept, {
        name: name.trim(),
        phone,
        reservationTime: selectedTime,
        people: people >= 5 ? 5 : people,
      });

      if (response.error) { setError(response.error.message); return; }

      if (response.data) {
        const session = await startSession({ type: 'RESERVATION', reservationId: response.data.id });
        if (session) navigate(`/${dept}/menu`);
        else setError('세션 시작에 실패했습니다.');
      }
    } catch {
      setError('예약 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = selectedTime && people && name.trim() && phone.replace(/-/g, '').length >= 10;

  return (
    <PageLayout header={<Header showBack backTo={`/${dept}`} />}>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">예약하기</h1>
          <p className="text-neutral-500 mt-1">정보를 입력하고 시간을 선택해주세요</p>
        </div>

        {/* Personal Info */}
        <div className="space-y-4">
          <Input
            label="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
          />
          <Input
            label="전화번호"
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="010-0000-0000"
          />
        </div>

        {/* Time Selection */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">시간 선택</h3>
          <div className="grid grid-cols-4 gap-2">
            {timeSlots.map((slot) => {
              const time = slot.split('T')[1].slice(0, 5);
              return (
                <SelectChip
                  key={slot}
                  selected={selectedTime === slot}
                  disabled={isSlotClosed(slot)}
                  onClick={() => setSelectedTime(slot)}
                >
                  {time}
                </SelectChip>
              );
            })}
          </div>
        </div>

        {/* People Selection */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 mb-3">인원</h3>
          <div className="grid grid-cols-4 gap-2">
            {peopleOptions.map((opt) => (
              <SelectChip
                key={opt.value}
                selected={people === opt.value}
                onClick={() => setPeople(opt.value)}
              >
                {opt.label}
              </SelectChip>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card variant="filled" padding="md" className="bg-red-50 border border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </Card>
        )}

        {/* Submit */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isSubmitting}
            disabled={!isValid}
          >
            메뉴 선택하러 가기
          </Button>
        </div>
      </form>
    </PageLayout>
  );
}
