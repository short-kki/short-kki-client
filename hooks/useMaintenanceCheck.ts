import { useEffect, useState } from 'react';
import { remoteConfigService } from '@/services/remoteConfig';
import { setMaintenanceHandler } from '@/services/api';

interface MaintenanceCheckResult {
  isChecking: boolean;
  isUnderMaintenance: boolean;
  maintenanceMessage: string;
}

export function useMaintenanceCheck(): MaintenanceCheckResult {
  const [result, setResult] = useState<MaintenanceCheckResult>({
    isChecking: true,
    isUnderMaintenance: false,
    maintenanceMessage: '',
  });

  useEffect(() => {
    setMaintenanceHandler(() => {
      setResult({
        isChecking: false,
        isUnderMaintenance: true,
        maintenanceMessage: remoteConfigService.getMaintenanceMessage() || '더 나은 서비스를 위해 잠시 점검 중이에요.\n잠시 후 다시 이용해주세요.',
      });
    });
    return () => setMaintenanceHandler(null);
  }, []);

  useEffect(() => {
    if (__DEV__) {
      setResult({ isChecking: false, isUnderMaintenance: false, maintenanceMessage: '' });
      return;
    }

    let cancelled = false;
    (async () => {
      await remoteConfigService.initialize();
      if (cancelled) return;
      setResult({
        isChecking: false,
        isUnderMaintenance: remoteConfigService.isUnderMaintenance(),
        maintenanceMessage: remoteConfigService.getMaintenanceMessage(),
      });
    })();

    return () => { cancelled = true; };
  }, []);

  return result;
}
