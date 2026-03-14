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

    const check = () => {
      if (!remoteConfigService.isInitialized()) return;

      if (remoteConfigService.isUnderMaintenance()) {
        setResult({
          isUnderMaintenance: true,
          maintenanceMessage: remoteConfigService.getMaintenanceMessage(),
        });
      }
    };

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
