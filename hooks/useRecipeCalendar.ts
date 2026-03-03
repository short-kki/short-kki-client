/**
 * 레시피 캘린더 Hook
 *
 * 월 단위로 캘린더 레시피 데이터를 조회합니다.
 * USE_MOCK을 false로 변경하면 자동으로 API 호출로 전환됩니다.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { USE_MOCK, api } from '@/services/api';
import {
  MOCK_CALENDAR_PERSONALS,
  MOCK_CALENDAR_GROUPS,
  MOCK_RECIPE_QUEUES,
  type CalendarMeal,
  type RecipeQueue,
} from '@/data/mock';

// API 응답 타입
interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

// 그룹 캘린더 응답 (API 문서 기준)
interface GroupCalendarResponse {
  groupId: number;
  groupName: string;
  calendars: CalendarMeal[];
}

// 캘린더 API 응답 (API 문서 기준)
interface CalendarApiResponse {
  personalCalendars: CalendarMeal[];
  groupCalendars: GroupCalendarResponse[];
}

// 날짜별로 그룹핑하는 헬퍼
function groupByDate(meals: CalendarMeal[]): Record<string, CalendarMeal[]> {
  const result: Record<string, CalendarMeal[]> = {};
  for (const meal of meals) {
    if (!result[meal.scheduledDate]) {
      result[meal.scheduledDate] = [];
    }
    result[meal.scheduledDate].push(meal);
  }
  // 각 날짜 내에서 sortOrder 기준 정렬
  for (const date of Object.keys(result)) {
    result[date].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return result;
}

// groupId별 → 날짜별로 그룹핑하는 헬퍼
function groupByGroupAndDate(meals: CalendarMeal[]): Record<string, Record<string, CalendarMeal[]>> {
  const result: Record<string, Record<string, CalendarMeal[]>> = {};
  for (const meal of meals) {
    const gId = String(meal.groupId);
    if (!result[gId]) {
      result[gId] = {};
    }
    if (!result[gId][meal.scheduledDate]) {
      result[gId][meal.scheduledDate] = [];
    }
    result[gId][meal.scheduledDate].push(meal);
  }
  // 각 날짜 내에서 sortOrder 기준 정렬
  for (const gId of Object.keys(result)) {
    for (const date of Object.keys(result[gId])) {
      result[gId][date].sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }
  return result;
}

/**
 * 레시피 캘린더 조회
 * @param startDate 조회 시작일 (YYYY-MM-DD)
 * @param endDate 조회 종료일 (YYYY-MM-DD)
 */
// 그룹 정보 타입
interface GroupInfo {
  groupId: number;
  groupName: string;
}

export function useRecipeCalendar(startDate: string, endDate: string) {
  const [personalMeals, setPersonalMeals] = useState<Record<string, CalendarMeal[]>>({});
  const [groupMealsByGroup, setGroupMealsByGroup] = useState<Record<string, Record<string, CalendarMeal[]>>>({});
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cachedRange = useRef<{ startDate: string; endDate: string } | null>(null);

  const fetchCalendar = useCallback(async (options?: { silent?: boolean; force?: boolean }) => {
    const { silent = false, force = false } = options ?? {};

    // force 시 캐시 초기화
    if (force) {
      cachedRange.current = null;
    }

    // 캐시된 범위의 부분집합이면 fetch 스킵
    if (!force && cachedRange.current) {
      if (startDate >= cachedRange.current.startDate && endDate <= cachedRange.current.endDate) {
        return;
      }
    }

    try {
      // 첫 로드만 loading 표시, 이후 누적 fetch는 silent
      if (!silent && !cachedRange.current) setLoading(true);
      setError(null);

      if (USE_MOCK) {
        // Mock 데이터: 기간에 해당하는 데이터만 필터링
        const filteredPersonals = MOCK_CALENDAR_PERSONALS.filter(
          (m) => m.scheduledDate >= startDate && m.scheduledDate <= endDate
        );
        const filteredGroups = MOCK_CALENDAR_GROUPS.filter(
          (m) => m.scheduledDate >= startDate && m.scheduledDate <= endDate
        );

        const newPersonalByDate = groupByDate(filteredPersonals);
        const newGroupByGroupDate = groupByGroupAndDate(filteredGroups);

        if (force) {
          setPersonalMeals(newPersonalByDate);
          setGroupMealsByGroup(newGroupByGroupDate);
        } else {
          setPersonalMeals(prev => {
            const kept: Record<string, CalendarMeal[]> = {};
            for (const [date, meals] of Object.entries(prev)) {
              if (date < startDate || date > endDate) kept[date] = meals;
            }
            return { ...kept, ...newPersonalByDate };
          });
          setGroupMealsByGroup(prev => {
            const result: Record<string, Record<string, CalendarMeal[]>> = {};
            for (const [gId, dateMap] of Object.entries(prev)) {
              result[gId] = {};
              for (const [date, meals] of Object.entries(dateMap)) {
                if (date < startDate || date > endDate) result[gId][date] = meals;
              }
            }
            for (const [gId, dateMap] of Object.entries(newGroupByGroupDate)) {
              result[gId] = { ...(result[gId] || {}), ...dateMap };
            }
            return result;
          });
        }
      } else {
        // 실제 API 호출: GET /api/v1/calendar/recipes?startDate=...&endDate=...
        const response = await api.get<ApiResponse<CalendarApiResponse>>(
          `/api/v1/calendar/recipes?startDate=${startDate}&endDate=${endDate}`
        );

        // personalCalendars 처리
        const personalCalendars = response.data?.personalCalendars || [];
        const newPersonalByDate = groupByDate(personalCalendars);

        // groupCalendars 처리: 그룹별로 묶인 구조를 풀어서 groupId → 날짜별 맵으로 변환
        const groupCalendars = response.data?.groupCalendars || [];

        // 그룹 목록 저장 (식단 유무와 관계없이)
        const groupList: GroupInfo[] = groupCalendars.map((gc) => ({
          groupId: gc.groupId,
          groupName: gc.groupName,
        }));
        setGroups(groupList);

        const groupMealsFlattened: CalendarMeal[] = [];
        for (const groupCalendar of groupCalendars) {
          for (const calendar of (groupCalendar.calendars || [])) {
            groupMealsFlattened.push({
              ...calendar,
              groupId: groupCalendar.groupId,
              groupName: groupCalendar.groupName,
            });
          }
        }
        const newGroupByGroupDate = groupByGroupAndDate(groupMealsFlattened);

        // force면 교체, 아니면 병합 (fetch 범위 내 날짜는 새 데이터로, 범위 밖은 보존)
        if (force) {
          setPersonalMeals(newPersonalByDate);
          setGroupMealsByGroup(newGroupByGroupDate);
        } else {
          setPersonalMeals(prev => {
            const kept: Record<string, CalendarMeal[]> = {};
            for (const [date, meals] of Object.entries(prev)) {
              if (date < startDate || date > endDate) kept[date] = meals;
            }
            return { ...kept, ...newPersonalByDate };
          });
          setGroupMealsByGroup(prev => {
            const result: Record<string, Record<string, CalendarMeal[]>> = {};
            for (const [gId, dateMap] of Object.entries(prev)) {
              result[gId] = {};
              for (const [date, meals] of Object.entries(dateMap)) {
                if (date < startDate || date > endDate) result[gId][date] = meals;
              }
            }
            for (const [gId, dateMap] of Object.entries(newGroupByGroupDate)) {
              result[gId] = { ...(result[gId] || {}), ...dateMap };
            }
            return result;
          });
        }
      }

      // cachedRange를 누적 합집합으로 확장
      cachedRange.current = cachedRange.current
        ? {
            startDate: startDate < cachedRange.current.startDate ? startDate : cachedRange.current.startDate,
            endDate: endDate > cachedRange.current.endDate ? endDate : cachedRange.current.endDate,
          }
        : { startDate, endDate };
    } catch (err) {
      setError(err as Error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const deleteCalendarMeal = useCallback(async (mealId: number) => {
    if (USE_MOCK) return;

    await api.delete(`/api/v1/calendar/recipes/${mealId}`);
  }, []);

  return {
    personalMeals,
    groupMealsByGroup,
    groups,
    loading,
    error,
    refetch: fetchCalendar,
    deleteCalendarMeal,
  };
}

// ============================================================================
// 대기열 API 응답 타입
// ============================================================================

interface QueueApiResponse {
  recipeQueues: RecipeQueue[];
}

/**
 * 레시피 대기열 조회
 * GET /api/v1/calendar/queue
 */
export function useRecipeQueue() {
  const [queues, setQueues] = useState<RecipeQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const initialLoadDone = useRef(false);

  const fetchQueue = useCallback(async (options?: { silent?: boolean }) => {
    const { silent = false } = options ?? {};
    try {
      if (!silent && !initialLoadDone.current) setLoading(true);
      setError(null);

      if (USE_MOCK) {
        setQueues(MOCK_RECIPE_QUEUES);
      } else {
        const response = await api.get<ApiResponse<QueueApiResponse>>(
          '/api/v1/calendar/queue'
        );
        setQueues(response.data.recipeQueues);
      }
      initialLoadDone.current = true;
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // 대기열 추가: POST /api/v1/calendar/queue
  const addQueue = useCallback(async (recipeId: number): Promise<RecipeQueue | null> => {
    if (USE_MOCK) {
      const newItem: RecipeQueue = {
        id: Date.now(),
        recipeId,
        recipeTitle: `레시피 ${recipeId}`,
        mainImgUrl: null,
        createdAt: new Date().toISOString(),
      };
      setQueues(prev => [newItem, ...prev]);
      return newItem;
    }

    const response = await api.post<ApiResponse<RecipeQueue>>(
      '/api/v1/calendar/queue',
      { recipeId }
    );
    const created = response.data;
    setQueues(prev => [created, ...prev]);
    return created;
  }, []);

  // 대기열 삭제: DELETE /api/v1/calendar/queue/{id}
  const deleteQueue = useCallback(async (queueId: number) => {
    // 낙관적 업데이트
    setQueues(prev => prev.filter(q => q.id !== queueId));

    if (USE_MOCK) return;

    try {
      await api.delete(`/api/v1/calendar/queue/${queueId}`);
    } catch (err) {
      // 실패 시 목록 새로고침
      console.error('대기열 삭제 실패:', err);
      fetchQueue();
    }
  }, [fetchQueue]);

  // 대기열에서 캘린더로 추가: POST /api/v1/calendar/recipes
  const addToCalendar = useCallback(async (
    queueId: number,
    scheduledDate: string,
    groupId?: number | null
  ): Promise<CalendarMeal | null> => {
    // 낙관적 업데이트: 대기열에서 제거
    const queueItem = queues.find(q => q.id === queueId);
    setQueues(prev => prev.filter(q => q.id !== queueId));

    if (USE_MOCK) {
      // Mock: 캘린더 아이템 반환
      return {
        id: Date.now(),
        recipeId: queueItem?.recipeId ?? 0,
        recipeTitle: queueItem?.recipeTitle ?? '',
        cookingTime: null,
        mainImgUrl: queueItem?.mainImgUrl ?? null,
        scheduledDate,
        sortOrder: 0,
        groupId: groupId ?? null,
        groupName: null,
      };
    }

    try {
      const response = await api.post<ApiResponse<CalendarMeal>>(
        '/api/v1/calendar/recipes',
        {
          queueId,
          scheduledDate,
          ...(groupId ? { groupId } : {}),
        }
      );
      return response.data;
    } catch (err) {
      console.error('캘린더 추가 실패:', err);
      // 실패 시 대기열 복구
      fetchQueue();
      throw err;
    }
  }, [queues, fetchQueue]);

  return {
    queues,
    setQueues,
    loading,
    error,
    refetch: fetchQueue,
    addQueue,
    deleteQueue,
    addToCalendar,
  };
}
