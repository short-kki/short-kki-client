/**
 * Push Notification Service
 *
 * 푸시 알림 관리 서비스
 * 주의: Expo Go에서는 동작하지 않음 (개발 빌드 필요)
 *
 * 개발 빌드 생성 후 실제 구현을 활성화하려면:
 * 1. eas build --platform ios --profile development
 * 2. 아래 ENABLE_PUSH를 true로 변경
 */

import { Platform } from 'react-native';
import { router } from 'expo-router';
import { api, USE_MOCK } from './api';

// 개발 빌드에서만 true로 변경
const ENABLE_PUSH = true;

type NotificationType = 'GROUP_INVITE' | 'RECIPE_SHARED' | 'CALENDAR_UPDATE' | 'COMMENT_ADDED';

interface NotificationData {
  type?: NotificationType;
  relatedUrl?: string;
  [key: string]: unknown;
}

class PushNotificationService {
  private fcmToken: string | null = null;

  async initialize(): Promise<void> {
    if (!ENABLE_PUSH) {
      console.log('[Push] 푸시 알림 비활성화 상태 (개발 빌드 필요)');
      return;
    }

    // 개발 빌드에서 실제 구현
    await this.initializeNative();
  }

  private async initializeNative(): Promise<void> {
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');

    // iOS 시뮬레이터는 푸시 불가능
    if (Platform.OS === 'ios' && !Device.isDevice) {
      console.log('[Push] iOS 시뮬레이터에서는 푸시 알림이 지원되지 않습니다.');
      return;
    }

    // Android 에뮬레이터는 Google Play Services가 있으면 푸시 가능
    if (Platform.OS === 'android' && !Device.isDevice) {
      console.log('[Push] Android 에뮬레이터에서 푸시 알림 초기화 시도...');
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] 푸시 알림 권한이 거부되었습니다.');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FA8112',
      });
    }

    // 리스너 등록
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] 포그라운드 알림:', notification);
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      this.handleNavigation(data);
    });

    console.log('[Push] 초기화 완료');
  }

  async registerToken(): Promise<string | null> {
    if (!ENABLE_PUSH) return null;

    try {
      const Notifications = await import('expo-notifications');
      const Device = await import('expo-device');

      // iOS 시뮬레이터는 APNS 미지원 → FCM 토큰 발급 불가
      if (Platform.OS === 'ios' && !Device.isDevice) {
        console.log('[Push] iOS 시뮬레이터에서는 푸시 알림이 지원되지 않습니다. (토큰 발급 스킵)');
        return null;
      }

      // Android 에뮬레이터 및 실제 기기 - 실제 FCM 토큰 발급 시도
      console.log('[Push] FCM 토큰 발급 시도...');
      const tokenData = await Notifications.getDevicePushTokenAsync();
      this.fcmToken = tokenData.data;
      console.log('[Push] FCM Token 발급 성공:', this.fcmToken?.substring(0, 30) + '...');

      if (!USE_MOCK) {
        await api.post('/api/v1/notifications/fcm-token', {
          fcmToken: this.fcmToken,
          platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        });
        console.log('[Push] FCM 토큰 서버 등록 완료');
      }

      return this.fcmToken;
    } catch (error) {
      console.error('[Push] 토큰 등록 실패:', error);
      return null;
    }
  }

  async unregisterToken(): Promise<void> {
    if (!this.fcmToken) return;

    try {
      if (!USE_MOCK) {
        await api.delete('/api/v1/notifications/fcm-token', {
          fcmToken: this.fcmToken,
        });
        console.log('[Push] FCM 토큰 서버에서 삭제 완료');
      }
    } catch (error) {
      console.error('[Push] 토큰 삭제 실패:', error);
    } finally {
      this.fcmToken = null;
    }
  }

  private handleNavigation(data: NotificationData): void {
    const { relatedUrl, type } = data;

    if (relatedUrl) {
      setTimeout(() => router.push(relatedUrl as never), 100);
      return;
    }

    if (type) {
      const routes: Record<NotificationType, string> = {
        GROUP_INVITE: '/(tabs)/group',
        RECIPE_SHARED: '/(tabs)/recipe-book',
        CALENDAR_UPDATE: '/(tabs)/meal-plan',
        COMMENT_ADDED: '/notifications',
      };
      const route = routes[type];
      if (route) {
        setTimeout(() => router.push(route as never), 100);
      }
    }
  }

  async handleInitialNotification(): Promise<void> {
    if (!ENABLE_PUSH) return;

    const Notifications = await import('expo-notifications');
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      const data = response.notification.request.content.data as NotificationData;
      this.handleNavigation(data);
    }
  }

  cleanup(): void {
    // 리스너는 개발 빌드에서만 등록됨
  }

  getToken(): string | null {
    return this.fcmToken;
  }

  isAvailable(): boolean {
    return ENABLE_PUSH;
  }
}

export const pushNotificationService = new PushNotificationService();
