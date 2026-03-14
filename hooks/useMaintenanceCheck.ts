import { useEffect, useState } from 'react';
import { remoteConfigService } from '@/services/remoteConfig';

interface MaintenanceCheckResult {
  isUnderMaintenance: boolean;
  maintenanceMessage: string;
}

export function useMaintenanceCheck(): MaintenanceCheckResult {
  const [result, setResult] = useState<MaintenanceCheckResult>({
    isUnderMaintenance: false,
    maintenanceMessage: '',
  });

  useEffect(() => {
    if (__DEV__) return;

    let cancelled = false;
    (async () => {
      await remoteConfigService.initialize();
      if (cancelled) return;
      setResult({
        isUnderMaintenance: remoteConfigService.isUnderMaintenance(),
        maintenanceMessage: remoteConfigService.getMaintenanceMessage(),
      });
    })();

    return () => { cancelled = true; };
  }, []);

  return result;
}
