/**
 * 그룹 관련 Hooks
 *
 * Mock 데이터와 실제 API 호출을 추상화합니다.
 * USE_MOCK을 false로 변경하면 자동으로 API 호출로 전환됩니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { USE_MOCK, api } from '@/services/api';
import {
  MOCK_GROUPS,
  MOCK_FEEDS,
  MOCK_GROUP_MEMBERS,
  type Group,
  type FeedItem,
  type GroupMember,
} from '@/data/mock';

/**
 * 그룹 목록 조회
 */
export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        // Mock 데이터 사용
        setGroups(MOCK_GROUPS);
      } else {
        // 실제 API 호출
        const data = await api.get<Group[]>('/groups');
        setGroups(data);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const addGroup = useCallback((group: Group) => {
    setGroups((prev) => [group, ...prev]);
  }, []);

  const removeGroup = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups,
    addGroup,
    removeGroup,
  };
}

/**
 * 그룹 피드 조회
 */
export function useGroupFeeds(groupId?: string) {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFeeds = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        // Mock 데이터 사용
        setFeeds(MOCK_FEEDS);
      } else {
        // 실제 API 호출
        const data = await api.get<FeedItem[]>(`/groups/${groupId}/feeds`);
        setFeeds(data);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const toggleLike = useCallback((feedId: string) => {
    setFeeds((prev) =>
      prev.map((feed) => {
        if (feed.id === feedId && feed.type === 'post') {
          return {
            ...feed,
            isLiked: !feed.isLiked,
            likes: feed.isLiked ? feed.likes - 1 : feed.likes + 1,
          };
        }
        return feed;
      })
    );
  }, []);

  return {
    feeds,
    loading,
    error,
    refetch: fetchFeeds,
    toggleLike,
  };
}

/**
 * 그룹 멤버 조회
 */
export function useGroupMembers(groupId?: string) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        // Mock 데이터 사용
        setMembers(MOCK_GROUP_MEMBERS);
      } else {
        // 실제 API 호출
        const data = await api.get<GroupMember[]>(`/groups/${groupId}/members`);
        setMembers(data);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
  };
}
