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
  private devModeEnabled = false;

  async initialize(): Promise<void> {
    if (__DEV__) {
      this.devModeEnabled = true;
      this.initialized = true;
      return;
    }

    if (this.initialized) return;

    try {
      const firebase = await import('@react-native-firebase/remote-config');
      const remoteConfig = firebase.default();

      await remoteConfig.setDefaults({
        dev_mode_enabled: false,
      });

      await remoteConfig.setConfigSettings({
        minimumFetchIntervalMillis: 0,
      });

      await remoteConfig.fetchAndActivate();

      this.devModeEnabled = remoteConfig.getValue('dev_mode_enabled').asBoolean();
      console.log('[RemoteConfig] dev_mode_enabled:', this.devModeEnabled);
    } catch (error) {
      console.warn('[RemoteConfig] 초기화 실패, 기본값(false) 사용:', error);
      this.devModeEnabled = false;
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
}

export const remoteConfigService = new RemoteConfigService();
