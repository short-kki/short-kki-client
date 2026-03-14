/**
 * Firebase Remote Config Service
 *
 * 개발자 모드(빠른 로그인) 등 앱 동작을 원격으로 제어합니다.
 *
 * - __DEV__ (npm start / 로컬 개발): Remote Config 무시, 개발자 모드 항상 ON
 * - release 빌드 (스토어 제출): Remote Config에서 dev_mode_enabled 값 확인
 */

class RemoteConfigService {
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private devModeEnabled = false;
  private minimumBuildNumber = 0;
  private minimumAppVersion = '0.0.0';
  private updateMessage = '';
  private underMaintenance = false;
  private maintenanceMessage = '';

  async initialize(): Promise<void> {
    if (__DEV__) {
      this.devModeEnabled = true;
      this.initialized = true;
      return;
    }

    if (this.initialized) return;
    if (!this.initPromise) {
      this.initPromise = this._doInitialize();
    }
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      const firebase = await import('@react-native-firebase/remote-config');
      const remoteConfig = firebase.default();

      await remoteConfig.setDefaults({
        dev_mode_enabled: false,
        minimum_build_number: 0,
        minimum_app_version: '0.0.0',
        update_message: '새로운 버전이 출시되었습니다. 업데이트 후 이용해주세요.',
        is_under_maintenance: false,
        maintenance_message: '더 나은 서비스를 위해 잠시 점검 중이에요.\n잠시 후 다시 이용해주세요.',
      });

      await remoteConfig.setConfigSettings({
        minimumFetchIntervalMillis: 0,
      });

      await remoteConfig.fetchAndActivate();

      this.devModeEnabled = remoteConfig.getValue('dev_mode_enabled').asBoolean();
      this.minimumBuildNumber = remoteConfig.getValue('minimum_build_number').asNumber();
      this.minimumAppVersion = remoteConfig.getValue('minimum_app_version').asString();
      this.updateMessage = remoteConfig.getValue('update_message').asString();
      this.underMaintenance = remoteConfig.getValue('is_under_maintenance').asBoolean();
      this.maintenanceMessage = remoteConfig.getValue('maintenance_message').asString();

    } catch (error) {
      console.warn('[RemoteConfig] 초기화 실패, 기본값 사용:', error);
      this.devModeEnabled = false;
      this.minimumBuildNumber = 0;
      this.minimumAppVersion = '0.0.0';
      this.updateMessage = '새로운 버전이 출시되었습니다. 업데이트 후 이용해주세요.';
      this.underMaintenance = false;
      this.maintenanceMessage = '';
    } finally {
      this.initialized = true;
    }
  }

  isDevModeEnabled(): boolean {
    if (__DEV__) return true;
    return this.devModeEnabled;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getMinimumBuildNumber(): number {
    return this.minimumBuildNumber;
  }

  getMinimumAppVersion(): string {
    return this.minimumAppVersion;
  }

  getUpdateMessage(): string {
    return this.updateMessage;
  }

  isUnderMaintenance(): boolean {
    return this.underMaintenance;
  }

  getMaintenanceMessage(): string {
    return this.maintenanceMessage;
  }
}

export const remoteConfigService = new RemoteConfigService();
