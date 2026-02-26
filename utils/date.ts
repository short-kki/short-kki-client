/**
 * 서버 날짜 파싱 유틸리티
 *
 * 서버(JVM)가 UTC로 동작하며 LocalDateTime으로 저장하므로
 * 타임존 정보 없이 "2026-02-25T17:07:14.892569" 형태로 전달됩니다.
 * Z를 붙여 UTC로 파싱하면 JS가 자동으로 사용자 로컬 시간으로 변환합니다.
 */

/**
 * 서버에서 받은 날짜 문자열을 UTC로 파싱합니다.
 * 마이크로초(6자리)를 밀리초(3자리)로 잘라내고 Z를 붙여 UTC 처리합니다.
 */
export function parseServerDate(dateString: string): Date {
  // 이미 Z나 +/- 타임존 오프셋이 있으면 그대로 파싱
  if (/[Z+\-]\d{0,2}:?\d{0,2}$/.test(dateString)) {
    return new Date(dateString);
  }

  // 마이크로초(6자리 이상) → 밀리초(3자리)로 잘라내기
  const trimmed = dateString.replace(/(\.\d{3})\d+$/, '$1');

  return new Date(trimmed + 'Z');
}
