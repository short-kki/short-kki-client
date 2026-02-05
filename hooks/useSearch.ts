/**
 * 레시피 검색 Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { USE_MOCK, api } from '@/services/api';
import {
  MOCK_SEARCH_RECIPES,
  type SearchRecipeItem,
  type SearchPageInfo,
} from '@/data/mock';

interface SearchParams {
  searchWord: string;
  cuisineTypes?: string[];
  mealTypes?: string[];
  difficulties?: string[];
}

interface ApiResponse<T> {
  code: string;
  message: string;
  data?: T;
}

interface SearchResponse {
  searchResult: SearchRecipeItem[];
  pageInfo: SearchPageInfo;
}

const DEFAULT_PAGE_SIZE = 20;

function buildQueryString(params: SearchParams, page: number, size: number): string {
  const parts: string[] = [];

  if (params.searchWord) {
    parts.push(`searchWord=${encodeURIComponent(params.searchWord)}`);
  }
  params.cuisineTypes?.forEach((v) => {
    parts.push(`cuisineTypes=${encodeURIComponent(v)}`);
  });
  params.mealTypes?.forEach((v) => {
    parts.push(`mealTypes=${encodeURIComponent(v)}`);
  });
  params.difficulties?.forEach((v) => {
    parts.push(`difficulties=${encodeURIComponent(v)}`);
  });
  parts.push(`page=${page}`);
  parts.push(`size=${size}`);

  return parts.join('&');
}

export function useRecipeSearch(params: SearchParams) {
  const [results, setResults] = useState<SearchRecipeItem[]>([]);
  const [pageInfo, setPageInfo] = useState<SearchPageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 현재 params를 ref로 보관해서 fetchPage에서 최신 값 참조
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchPage = useCallback(async (page: number, isLoadMore: boolean) => {
    const currentParams = paramsRef.current;

    if (USE_MOCK) {
      // 목 데이터: 간단한 키워드 필터링 시뮬레이션
      const filtered = MOCK_SEARCH_RECIPES.filter((item) => {
        if (currentParams.searchWord) {
          return item.title.includes(currentParams.searchWord);
        }
        return true;
      });

      const start = page * DEFAULT_PAGE_SIZE;
      const paged = filtered.slice(start, start + DEFAULT_PAGE_SIZE);

      if (isLoadMore) {
        setResults((prev) => [...prev, ...paged]);
      } else {
        setResults(paged);
      }
      setPageInfo({
        page,
        size: DEFAULT_PAGE_SIZE,
        hasNext: start + DEFAULT_PAGE_SIZE < filtered.length,
        first: page === 0,
        last: start + DEFAULT_PAGE_SIZE >= filtered.length,
      });
      return;
    }

    const qs = buildQueryString(currentParams, page, DEFAULT_PAGE_SIZE);
    console.log('[Search] requesting:', `/api/v2/recipes/search?${qs}`);
    const response = await api.get<ApiResponse<SearchResponse>>(
      `/api/v2/recipes/search?${qs}`
    );

    console.log('[Search] raw response:', JSON.stringify(response));
    const data = response.data;
    const recipes = data?.searchResult ?? [];
    console.log('[Search] parsed recipes count:', recipes.length);

    if (isLoadMore) {
      setResults((prev) => [...prev, ...recipes]);
    } else {
      setResults(recipes);
    }

    if (data?.pageInfo) {
      setPageInfo(data.pageInfo);
    } else {
      setPageInfo({
        page,
        size: DEFAULT_PAGE_SIZE,
        hasNext: false,
        first: page === 0,
        last: true,
      });
    }
  }, []);

  const fetchInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchPage(0, false);
    } catch (err) {
      console.error('[Search] error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const fetchNextPage = useCallback(async () => {
    if (loadingMore) return;
    if (!pageInfo?.hasNext) return;
    try {
      setLoadingMore(true);
      await fetchPage(pageInfo.page + 1, true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, loadingMore, pageInfo]);

  // params가 변경되면 다시 fetch
  const paramsKey = `${params.searchWord}|${params.cuisineTypes?.join(',')}|${params.mealTypes?.join(',')}|${params.difficulties?.join(',')}`;

  useEffect(() => {
    fetchInitial();
  }, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    results,
    loading,
    loadingMore,
    error,
    hasNext: pageInfo?.hasNext ?? false,
    fetchNextPage,
    refetch: fetchInitial,
  };
}
