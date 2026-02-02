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

// API 응답 타입
interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

// 서버 API 타입
interface ApiGroup {
  id: number;
  name: string;
  description: string | null;
  thumbnailImgUrl: string | null;
  groupType: 'COUPLE' | 'FAMILY' | 'FRIENDS' | 'ETC';
  memberCount?: number;
  myRole?: 'ADMIN' | 'MEMBER';
  createdAt: string;
}

interface ApiFeed {
  id: number;
  content: string;
  feedType: 'USER_CREATED' | 'DAILY_MENU_NOTIFICATION' | 'NEW_RECIPE_ADDED';
  authorId: number;
  authorName: string;
  createdAt: string;
}

interface ApiGroupMember {
  memberId: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

// API -> 클라이언트 타입 변환
function mapApiGroupToGroup(apiGroup: ApiGroup): Group {
  return {
    id: apiGroup.id.toString(),
    name: apiGroup.name,
    memberCount: apiGroup.memberCount || 0,
    thumbnail: apiGroup.thumbnailImgUrl,
    lastActivity: formatRelativeTime(apiGroup.createdAt),
  };
}

function mapApiFeedToFeedItem(apiFeed: ApiFeed): FeedItem {
  return {
    id: apiFeed.id.toString(),
    type: 'post',
    user: apiFeed.authorName,
    userAvatar: apiFeed.authorName.substring(0, 1),
    content: apiFeed.content,
    images: [],
    likes: 0,
    comments: 0,
    time: formatRelativeTime(apiFeed.createdAt),
    isLiked: false,
  };
}

function mapApiMemberToGroupMember(apiMember: ApiGroupMember): GroupMember {
  return {
    id: apiMember.memberId.toString(),
    name: apiMember.name,
    role: apiMember.role === 'ADMIN' ? 'admin' : 'member',
    joinedAt: apiMember.joinedAt,
  };
}

// 상대 시간 포맷
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return '방금';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
}

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
        // 실제 API 호출: GET /api/v1/groups/my
        const response = await api.get<ApiResponse<ApiGroup[]>>('/api/v1/groups/my');
        const mappedGroups = response.data.map(mapApiGroupToGroup);
        setGroups(mappedGroups);
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

  // 그룹 생성 API
  const createGroup = useCallback(async (data: {
    name: string;
    description?: string;
    thumbnailImgUrl?: string;
    groupType: 'COUPLE' | 'FAMILY' | 'FRIENDS' | 'ETC';
  }): Promise<Group> => {
    if (USE_MOCK) {
      // Mock 모드: 로컬 상태만 업데이트
      const newGroup: Group = {
        id: Date.now().toString(),
        name: data.name,
        memberCount: 1,
        thumbnail: data.thumbnailImgUrl || null,
        lastActivity: '방금',
      };
      addGroup(newGroup);
      return newGroup;
    }

    // 실제 API 호출: POST /api/v1/groups
    const response = await api.post<ApiResponse<ApiGroup>>('/api/v1/groups', data);
    const newGroup = mapApiGroupToGroup(response.data);
    addGroup(newGroup);
    return newGroup;
  }, [addGroup]);

  // 그룹 삭제 API
  const deleteGroup = useCallback(async (groupId: string): Promise<void> => {
    if (USE_MOCK) {
      // Mock 모드: 로컬 상태만 업데이트
      removeGroup(groupId);
      return;
    }

    // 실제 API 호출: DELETE /api/v1/groups/{groupId}
    await api.delete<ApiResponse<null>>(`/api/v1/groups/${groupId}`);
    removeGroup(groupId);
  }, [removeGroup]);

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups,
    addGroup,
    removeGroup,
    createGroup,
    deleteGroup,
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
        // 실제 API 호출: GET /api/v1/groups/{groupId}/feeds
        const response = await api.get<ApiResponse<ApiFeed[]>>(`/api/v1/groups/${groupId}/feeds`);
        const mappedFeeds = response.data.map(mapApiFeedToFeedItem);
        setFeeds(mappedFeeds);
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

  // 피드 작성
  const createFeed = useCallback(async (content: string) => {
    if (!groupId) return;

    if (USE_MOCK) {
      // Mock 모드: 로컬 상태만 업데이트
      const newFeed: FeedItem = {
        id: Date.now().toString(),
        type: 'post',
        user: '나',
        userAvatar: '나',
        content,
        images: [],
        likes: 0,
        comments: 0,
        time: '방금',
        isLiked: false,
      };
      setFeeds((prev) => [newFeed, ...prev]);
      return;
    }

    // 실제 API 호출: POST /api/v1/groups/{groupId}/feeds
    await api.post(`/api/v1/groups/${groupId}/feeds`, {
      content,
      feedType: 'USER_CREATED',
    });
    // 피드 목록 새로고침
    fetchFeeds();
  }, [groupId, fetchFeeds]);

  return {
    feeds,
    loading,
    error,
    refetch: fetchFeeds,
    toggleLike,
    createFeed,
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
        // 실제 API 호출: GET /api/v1/groups/{groupId}/members
        const response = await api.get<ApiResponse<ApiGroupMember[]>>(`/api/v1/groups/${groupId}/members`);
        const mappedMembers = response.data.map(mapApiMemberToGroupMember);
        setMembers(mappedMembers);
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

// 장볼거리 API 타입
interface ApiShoppingItem {
  id: number;
  name: string;
  ingredientId: number;
  createdAt: string;
}

// 클라이언트 장볼거리 타입
export interface ShoppingItem {
  id: string;
  name: string;
  ingredientId?: number;
}

// Mock 장볼거리 데이터
const MOCK_SHOPPING_ITEMS: ShoppingItem[] = [
  { id: '1', name: '양파 2개' },
  { id: '2', name: '대파 1단' },
  { id: '3', name: '당근 3개' },
  { id: '4', name: '감자 5개' },
  { id: '5', name: '삼겹살 600g' },
];

function mapApiShoppingItem(item: ApiShoppingItem): ShoppingItem {
  return {
    id: item.id.toString(),
    name: item.name,
    ingredientId: item.ingredientId,
  };
}

/**
 * 그룹 장볼거리 조회
 */
export function useShoppingList(groupId?: string) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchItems = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        // Mock 데이터 사용
        setItems(MOCK_SHOPPING_ITEMS);
      } else {
        // 실제 API 호출: GET /api/v1/groups/{groupId}/shopping-list
        const response = await api.get<ApiResponse<ApiShoppingItem[]>>(
          `/api/v1/groups/${groupId}/shopping-list`
        );
        const mappedItems = response.data.map(mapApiShoppingItem);
        setItems(mappedItems);
      }
    } catch (err) {
      setError(err as Error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 장볼거리 삭제
  const deleteItem = useCallback(async (itemId: string) => {
    if (!groupId) return;

    if (USE_MOCK) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      return;
    }

    // 실제 API 호출: DELETE /api/v1/groups/{groupId}/shopping-list/{shoppingListId}
    await api.delete(`/api/v1/groups/${groupId}/shopping-list/${itemId}`);
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, [groupId]);

  // 장볼거리 일괄 추가 (레시피 재료 기반)
  const addItemsFromRecipe = useCallback(async (recipeIngredientIds: number[]) => {
    if (!groupId) return;

    if (USE_MOCK) {
      // Mock 모드에서는 아무것도 하지 않음
      return;
    }

    // 실제 API 호출: POST /api/v1/groups/{groupId}/shopping-list/bulk
    await api.post(`/api/v1/groups/${groupId}/shopping-list/bulk`, {
      items: recipeIngredientIds.map((id) => ({ recipeIngredientId: id })),
    });
    // 목록 새로고침
    fetchItems();
  }, [groupId, fetchItems]);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    deleteItem,
    addItemsFromRecipe,
  };
}
