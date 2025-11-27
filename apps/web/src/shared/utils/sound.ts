// =============================================================================
// Sound Utilities - 알림음 생성
// =============================================================================

/**
 * Web Audio API를 사용한 알림음 재생
 * 외부 파일 없이 비프음 생성
 */
export function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 첫 번째 비프
    playBeep(audioContext, 880, 0, 0.15);
    // 두 번째 비프 (높은 음)
    playBeep(audioContext, 1100, 0.2, 0.15);
    
  } catch (e) {
    console.warn('알림음 재생 실패:', e);
  }
}

function playBeep(audioContext: AudioContext, frequency: number, startTime: number, duration: number) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  // 볼륨 조절 (fade in/out)
  gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + startTime + 0.02);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + startTime + duration);
  
  oscillator.start(audioContext.currentTime + startTime);
  oscillator.stop(audioContext.currentTime + startTime + duration);
}

/**
 * 긴급 알림음 (결제 대기 등)
 */
export function playUrgentSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // 3번 반복 비프
    for (let i = 0; i < 3; i++) {
      playBeep(audioContext, 1000, i * 0.25, 0.1);
    }
    
  } catch (e) {
    console.warn('알림음 재생 실패:', e);
  }
}

/**
 * 성공 알림음
 */
export function playSuccessSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    playBeep(audioContext, 523, 0, 0.1); // C
    playBeep(audioContext, 659, 0.1, 0.1); // E
    playBeep(audioContext, 784, 0.2, 0.15); // G
    
  } catch (e) {
    console.warn('알림음 재생 실패:', e);
  }
}

