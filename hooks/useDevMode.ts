import { useEffect, useState } from 'react';
import { remoteConfigService } from '@/services/remoteConfig';

/**
 * 개발자 모드(빠른 로그인) 활성화 여부를 반환하는 훅
 *
 * - __DEV__ (로컬 개발): 즉시 { isDevMode: true, isLoading: false }
 * - release 빌드: Remote Config 초기화 완료 후 값 반환
 */
export function useDevMode(): { isDevMode: boolean; isLoading: boolean } {
  const [isDevMode, setIsDevMode] = useState(__DEV__);
  const [isLoading, setIsLoading] = useState(!__DEV__);

  useEffect(() => {
    if (__DEV__) return;

    let mounted = true;

    (async () => {
      await remoteConfigService.initialize();
      if (mounted) {
        setIsDevMode(remoteConfigService.isDevModeEnabled());
        setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { isDevMode, isLoading };
}
