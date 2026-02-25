/**
 * 알림 관련 Hooks
 *
 * 알림 목록 조회, 읽지 않은 알림 수 조회, 읽음 처리를 담당합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';

// API 응답 타입
interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

// 알림 타입 (서버 enum)
export type NotificationType =
  | 'GROUP_INVITE'
  | 'GROUP_MEMBER_JOINED'
  | 'RECIPE_SHARED'
  | 'RECIPE_IMPORT_COMPLETED'
  | 'CALENDAR_UPDATE'
  | 'COMMENT_ADDED'
  | 'FEED_ADDED';

// API 알림 타입
interface ApiNotification {
  id: number;
  type: NotificationType;
  content: string;
  targetId: number;
  payload: string;
  isRead: boolean;
  createdAt: string;
}

// 알림 목록 응답
interface ApiNotificationListResponse {
  content: ApiNotification[];
  nextCursor: number | null;
  hasNext: boolean;
}

// 읽지 않은 알림 수 응답
interface ApiUnreadCountResponse {
  count: number;
}

// 클라이언트용 알림 타입
export interface Notification {
  id: string;
  type: NotificationType;
  content: string;
  targetId: number;
  payload: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  time: string; // 상대 시간 (방금 전, 5분 전 등)
}

// 서버 시간을 KST로 파싱 (타임존 정보 없으면 +09:00 간주)
function parseServerDate(dateString: string): Date {
  if (dateString.includes('T') && !dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', dateString.indexOf('T'))) {
    return new Date(dateString + '+09:00');
  }
  return new Date(dateString);
}

// 상대 시간 포맷
function formatRelativeTime(dateString: string): string {
  const date = parseServerDate(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

// API -> 클라이언트 타입 변환
function mapApiNotificationToNotification(apiNotification: ApiNotification): Notification {
  let payload: Record<string, any> = {};
  try {
    payload = JSON.parse(apiNotification.payload);
  } catch {
    payload = {};
  }

  return {
    id: apiNotification.id.toString(),
    type: apiNotification.type,
    content: apiNotification.content,
    targetId: apiNotification.targetId,
    payload,
    isRead: apiNotification.isRead,
    createdAt: apiNotification.createdAt,
    time: formatRelativeTime(apiNotification.createdAt),
  };
}

/**
 * 알림 목록 조회 Hook
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNotifications = useCallback(async (cursor?: number) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const params = new URLSearchParams();
      params.append('size', '20');
      if (cursor) {
        params.append('cursor', cursor.toString());
      }

      const response = await api.get<ApiResponse<ApiNotificationListResponse>>(
        `/api/v1/notifications?${params.toString()}`
      );

      const mapped = response.data.content.map(mapApiNotificationToNotification);

      if (cursor) {
        setNotifications((prev) => [...prev, ...mapped]);
      } else {
        setNotifications(mapped);
      }
      setHasNext(response.data.hasNext);
      setNextCursor(response.data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('알림을 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchNextPage = useCallback(() => {
    if (hasNext && nextCursor && !loadingMore) {
      fetchNotifications(nextCursor);
    }
  }, [fetchNotifications, hasNext, nextCursor, loadingMore]);

  const refetch = useCallback(() => {
    setNextCursor(null);
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    hasNext,
    loadingMore,
    fetchNextPage,
    refetch,
    setNotifications,
  };
}

/**
 * 읽지 않은 알림 수 조회 Hook
 */
export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<ApiResponse<ApiUnreadCountResponse>>(
        '/api/v1/notifications/unread-count'
      );

      setCount(response.data.count);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('읽지 않은 알림 수를 불러오지 못했습니다.'));
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return {
    count,
    loading,
    error,
    refetch,
    setCount,
  };
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await api.patch(`/api/v1/notifications/${notificationId}/read`);
}

/**
 * 전체 알림 읽음 처리
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch('/api/v1/notifications/read-all');
}
