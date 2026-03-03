import { useEffect, useState } from 'react';
import * as Application from 'expo-application';
import { remoteConfigService } from '@/services/remoteConfig';

/**
 * semver 비교: a < b 이면 true
 * "1.0.0" < "1.0.1" → true
 * "1.2.0" < "1.1.0" → false
 */
function isVersionLessThan(current: string, minimum: string): boolean {
  const cur = current.split('.').map(Number);
  const min = minimum.split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const c = cur[i] || 0;
    const m = min[i] || 0;
    if (c < m) return true;
    if (c > m) return false;
  }
  return false;
}

interface UpdateCheckResult {
  needsUpdate: boolean;
  updateMessage: string;
}

export function useUpdateCheck(): UpdateCheckResult {
  const [result, setResult] = useState<UpdateCheckResult>({
    needsUpdate: false,
    updateMessage: '',
  });

  useEffect(() => {
    if (__DEV__) return;

    const check = () => {
      if (!remoteConfigService.isInitialized()) return;

      const minBuild = remoteConfigService.getMinimumBuildNumber();
      const minVersion = remoteConfigService.getMinimumAppVersion();
      const message = remoteConfigService.getUpdateMessage();

      const currentBuild = Number(Application.nativeBuildVersion) || 0;
      const currentVersion = Application.nativeApplicationVersion || '0.0.0';

      const buildTooOld = currentBuild < minBuild;
      const versionTooOld = isVersionLessThan(currentVersion, minVersion);

      if (buildTooOld || versionTooOld) {
        setResult({
          needsUpdate: true,
          updateMessage: message || '새로운 버전이 출시되었습니다. 업데이트 후 이용해주세요.',
        });
      }
    };

    // Remote Config 초기화 완료 대기 (폴링)
    const interval = setInterval(() => {
      if (remoteConfigService.isInitialized()) {
        clearInterval(interval);
        check();
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return result;
}
