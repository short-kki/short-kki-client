/**
 * 쇼츠/홈 관련 Hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { USE_MOCK, api } from '@/services/api';
import {
  MOCK_SHORTS,
  MOCK_CURATION_SECTIONS,
  MOCK_SEARCH_RECIPES,
  type ShortsItem,
  type CurationSection,
  type CurationRecipe,
  type SearchRecipeItem,
} from '@/data/mock';

/**
 * 쇼츠 목록 조회
 */
export function useShorts() {
  const [shorts, setShorts] = useState<ShortsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchShorts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        setShorts(MOCK_SHORTS);
        return;
      }

      const response = await api.get<ApiResponse<HomeSearchResponse>>(
        `/api/v2/recipes/search?page=0&size=20`
      );
      const searchResults = response.data?.searchResult ?? [];
      const mapped = searchResults.map(mapSearchRecipeToTopItem);
      setShorts(mapped);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShorts();
  }, [fetchShorts]);

  return {
    shorts,
    loading,
    error,
    refetch: fetchShorts,
  };
}

/**
 * 홈 화면 큐레이션 섹션 조회
 */
export function useCurationSections() {
  const [sections, setSections] = useState<CurationSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 항상 Mock 데이터 사용 (백엔드 미구현)
      setSections(MOCK_CURATION_SECTIONS);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  return {
    sections,
    loading,
    error,
    refetch: fetchSections,
  };
}

// =====================================================================
// Curation V2 (추천 큐레이션)
// =====================================================================

interface CurationV2Recipe {
  id: number;
  title: string;
  bookmarkCount: number;
  sourceUrl?: string;
  mainImgUrl?: string;
  authorName?: string;
  creatorName?: string;
}

interface CurationV2Item {
  curationId: number;
  title: string;
  description?: string;
  mealTypes?: string[];
  cuisineTypes?: string[];
  recipes: CurationV2Recipe[];
}

interface CurationV2PageInfo {
  page: number;
  size: number;
  hasNext: boolean;
  first: boolean;
  last: boolean;
}

interface CurationV2Response {
  curations: CurationV2Item[];
  pageInfo: CurationV2PageInfo;
}

interface ApiResponse<T> {
  code: string;
  message: string;
  data?: T;
}

type TopRecipeItem = ShortsItem;

const DEFAULT_PAGE_SIZE = 5;
const CURATION_PAGE_SIZE = 20;
const SEARCH_TOP_ID = 'search-top';

const getYoutubeThumbnail = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;

const extractYoutubeId = (url?: string): string | null => {
  if (!url) return null;
  const shortsMatch = url.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch?.[1]) return shortsMatch[1];
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watchMatch?.[1]) return watchMatch[1];
  const shortUrlMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortUrlMatch?.[1]) return shortUrlMatch[1];
  return null;
};

const mapRecipeToCurationRecipe = (recipe: CurationV2Recipe): CurationRecipe => {
  const videoId = extractYoutubeId(recipe.sourceUrl) ?? String(recipe.id);
  return {
    id: String(recipe.id),
    title: recipe.title,
    thumbnail: recipe.mainImgUrl || getYoutubeThumbnail(videoId),
    duration: "0:00",
    author: recipe.authorName || recipe.creatorName || "작성자",
    creatorName: recipe.creatorName,
    bookmarks: recipe.bookmarkCount,
    sourceUrl: recipe.sourceUrl,
  };
};

const mapRecipeToTopItem = (recipe: CurationV2Recipe): TopRecipeItem => {
  const videoId = extractYoutubeId(recipe.sourceUrl) ?? String(recipe.id);
  return {
    id: String(recipe.id),
    videoId,
    videoUrl: recipe.sourceUrl || `https://www.youtube.com/shorts/${videoId}`,
    title: recipe.title,
    author: recipe.authorName || recipe.creatorName || "작성자",
    authorAvatar: recipe.authorName?.[0],
    creatorName: recipe.creatorName,
    thumbnail: recipe.mainImgUrl || getYoutubeThumbnail(videoId),
    views: undefined,
    tags: [],
    bookmarks: recipe.bookmarkCount,
  };
};

const mapCurationRecipeToShortsItem = (recipe: CurationRecipe): ShortsItem => {
  const videoId = extractYoutubeId(recipe.sourceUrl) ?? recipe.id;
  return {
    id: recipe.id,
    videoId,
    videoUrl: recipe.sourceUrl || `https://www.youtube.com/shorts/${videoId}`,
    title: recipe.title,
    author: recipe.author,
    authorAvatar: recipe.author?.[0],
    creatorName: recipe.creatorName,
    thumbnail: recipe.thumbnail || getYoutubeThumbnail(videoId),
    views: undefined,
    tags: [],
    bookmarks: recipe.bookmarks ?? 0,
  };
};

const appendUniqueShorts = (prev: ShortsItem[], next: ShortsItem[]) => {
  const seen = new Set(prev.map((item) => item.id));
  const merged = [...prev];
  next.forEach((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  });
  return merged;
};

const getCurationDedupKey = (item: ShortsItem) => {
  const title = (item.title ?? "").trim().toLowerCase();
  const creator = (item.creatorName || item.author || "").trim().toLowerCase();
  return `${title}|${creator}`;
};

const appendUniqueShortsByKey = (prev: ShortsItem[], next: ShortsItem[]) => {
  const seen = new Set(prev.map(getCurationDedupKey));
  const merged = [...prev];
  next.forEach((item) => {
    const key = getCurationDedupKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  });
  return merged;
};

// Search API 응답 타입 (홈 화면용)
interface HomeSearchResponse {
  searchResult: SearchRecipeItem[];
  pageInfo: CurationV2PageInfo;
}

const mapSearchRecipeToTopItem = (recipe: SearchRecipeItem): TopRecipeItem => {
  const videoId = extractYoutubeId(recipe.sourceUrl) ?? String(recipe.id);
  return {
    id: String(recipe.id),
    videoId,
    videoUrl: recipe.sourceUrl || '',
    title: recipe.title,
    author: recipe.authorName || recipe.creatorName || '작성자',
    authorAvatar: (recipe.authorName || recipe.creatorName)?.[0],
    creatorName: recipe.creatorName ?? undefined,
    thumbnail: recipe.mainImgUrl || getYoutubeThumbnail(videoId),
    views: undefined,
    tags: [],
    bookmarks: recipe.bookmarkCount,
  };
};

const mapSearchRecipeToCurationRecipe = (recipe: SearchRecipeItem): CurationRecipe => {
  const videoId = extractYoutubeId(recipe.sourceUrl) ?? String(recipe.id);
  return {
    id: String(recipe.id),
    title: recipe.title,
    thumbnail: recipe.mainImgUrl || getYoutubeThumbnail(videoId),
    duration: '0:00',
    author: recipe.authorName || recipe.creatorName || '작성자',
    creatorName: recipe.creatorName ?? undefined,
    bookmarks: recipe.bookmarkCount,
    sourceUrl: recipe.sourceUrl ?? undefined,
  };
};

export function useRecommendedCurations() {
  const [sections, setSections] = useState<CurationSection[]>([]);
  const [topRecipes, setTopRecipes] = useState<TopRecipeItem[]>([]);
  const [topCuration, setTopCuration] = useState<CurationSection | null>(null);
  const [pageInfo, setPageInfo] = useState<CurationV2PageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchingPagesRef = useRef<Set<number>>(new Set());
  const fetchedPagesRef = useRef<Set<number>>(new Set());

  // TOP 레시피: search API에서 가져오기
  const fetchTopRecipes = useCallback(async () => {
    if (USE_MOCK) {
      const paged = MOCK_SEARCH_RECIPES.slice(0, DEFAULT_PAGE_SIZE);
      setTopRecipes(paged.map(mapSearchRecipeToTopItem));
      setTopCuration(
        paged.length > 0
          ? {
              id: SEARCH_TOP_ID,
              title: 'TOP 레시피',
              recipes: paged.map(mapSearchRecipeToCurationRecipe),
            }
          : null
      );
      return;
    }

    try {
      const response = await api.get<ApiResponse<HomeSearchResponse>>(
        `/api/v2/recipes/search?page=0&size=${DEFAULT_PAGE_SIZE}`
      );
      const data = response.data;
      const searchResults = data?.searchResult ?? [];
      setTopRecipes(searchResults.map(mapSearchRecipeToTopItem));
      setTopCuration(
        searchResults.length > 0
          ? {
              id: SEARCH_TOP_ID,
              title: 'TOP 레시피',
              recipes: searchResults.map(mapSearchRecipeToCurationRecipe),
            }
          : null
      );
    } catch (err) {
      console.error('[HomeSearch] top recipes fetch error:', err);
    }
  }, []);

  // 큐레이션 섹션: curations recommended API에서 가져오기
  const fetchPage = useCallback(async (page: number) => {
    if (fetchingPagesRef.current.has(page) || fetchedPagesRef.current.has(page)) return;
    fetchingPagesRef.current.add(page);
    if (USE_MOCK) {
      if (page === 0) {
        setSections(MOCK_CURATION_SECTIONS);
      }
      setPageInfo({
        page: 0,
        size: DEFAULT_PAGE_SIZE,
        hasNext: false,
        first: true,
        last: true,
      });
      fetchingPagesRef.current.delete(page);
      fetchedPagesRef.current.add(page);
      return;
    }

    try {
      const response = await api.get<ApiResponse<CurationV2Response>>(
        `/api/v2/recipes/curations/recommended?page=${page}&size=${DEFAULT_PAGE_SIZE}`
      );

      const data = response.data;
      const curations = data?.curations ?? [];

      if (page === 0) {
        setSections(curations
          .filter((curation) => curation.recipes && curation.recipes.length > 0)
          .map((curation) => ({
            id: String(curation.curationId),
            title: curation.title,
            description: curation.description,
            mealTypes: curation.mealTypes,
            cuisineTypes: curation.cuisineTypes,
            recipes: (curation.recipes ?? []).map(mapRecipeToCurationRecipe),
          })));
      } else {
        setSections((prev) => {
          const next = curations
            .filter((curation) => curation.recipes && curation.recipes.length > 0)
            .map((curation) => ({
              id: String(curation.curationId),
              title: curation.title,
              description: curation.description,
              mealTypes: curation.mealTypes,
              cuisineTypes: curation.cuisineTypes,
              recipes: (curation.recipes ?? []).map(mapRecipeToCurationRecipe),
            }));
          const seen = new Set(prev.map((section) => section.id));
          return [...prev, ...next.filter((section) => !seen.has(section.id))];
        });
      }

      if (data?.pageInfo) {
        setPageInfo({
          ...data.pageInfo,
          page,
        });
      } else {
        setPageInfo({
          page,
          size: DEFAULT_PAGE_SIZE,
          hasNext: false,
          first: page === 0,
          last: true,
        });
      }
      fetchedPagesRef.current.add(page);
    } finally {
      fetchingPagesRef.current.delete(page);
    }
  }, []);

  const fetchInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      fetchingPagesRef.current.clear();
      fetchedPagesRef.current.clear();
      await Promise.all([fetchTopRecipes(), fetchPage(0)]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchTopRecipes, fetchPage]);

  // 새로고침용
  const refetch = useCallback(async () => {
    try {
      setError(null);
      fetchingPagesRef.current.clear();
      fetchedPagesRef.current.clear();
      await Promise.all([fetchTopRecipes(), fetchPage(0)]);
    } catch (err) {
      setError(err as Error);
    }
  }, [fetchTopRecipes, fetchPage]);

  const fetchNextPage = useCallback(async () => {
    if (loadingMore) return;
    if (!pageInfo?.hasNext) return;
    try {
      setLoadingMore(true);
      await fetchPage(pageInfo.page + 1);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, loadingMore, pageInfo]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  return {
    topRecipes,
    topCuration,
    sections,
    loading,
    loadingMore,
    error,
    hasNext: pageInfo?.hasNext ?? false,
    fetchNextPage,
    refetch,
  };
}

// =====================================================================
// Curation shorts (큐레이션 상세 쇼츠)
// =====================================================================

interface CurationDetailResponse {
  curationId: number;
  title: string;
  description?: string;
  recipes: CurationV2Recipe[];
  pageInfo: CurationV2PageInfo;
}

export function useCurationShorts(curationId?: string, initialRecipes?: CurationRecipe[]) {
  const [shorts, setShorts] = useState<ShortsItem[]>([]);
  const [pageInfo, setPageInfo] = useState<CurationV2PageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchingPagesRef = useRef<Set<number>>(new Set());
  const fetchedPagesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    fetchingPagesRef.current.clear();
    fetchedPagesRef.current.clear();
  }, [curationId]);

  const fetchPage = useCallback(async (page: number, mergeWithInitial: boolean = false) => {
    if (!curationId) return;
    if (fetchingPagesRef.current.has(page) || fetchedPagesRef.current.has(page)) return;
    fetchingPagesRef.current.add(page);

    if (USE_MOCK) {
      const section = MOCK_CURATION_SECTIONS.find((item) => item.id === curationId);
      const startIndex = page * CURATION_PAGE_SIZE;
      const pageRecipes = section?.recipes?.slice(startIndex, startIndex + CURATION_PAGE_SIZE) ?? [];
      const hasNext = !!section && startIndex + CURATION_PAGE_SIZE < section.recipes.length;
      const mapped = pageRecipes.map(mapCurationRecipeToShortsItem);
      if (page === 0 && mergeWithInitial && initialRecipes && initialRecipes.length > 0) {
        const initialMapped = initialRecipes.map(mapCurationRecipeToShortsItem);
        setShorts(appendUniqueShortsByKey(initialMapped, mapped));
      } else {
        setShorts((prev) => (page === 0 ? mapped : appendUniqueShortsByKey(prev, mapped)));
      }
      setPageInfo({
        page,
        size: CURATION_PAGE_SIZE,
        hasNext,
        first: page === 0,
        last: !hasNext,
      });
      fetchingPagesRef.current.delete(page);
      fetchedPagesRef.current.add(page);
      return;
    }

    try {
      let nextItems: ShortsItem[];
      let responsePageInfo: CurationV2PageInfo | undefined;

      if (curationId === SEARCH_TOP_ID) {
        // TOP 레시피는 search API 사용
        const response = await api.get<ApiResponse<HomeSearchResponse>>(
          `/api/v2/recipes/search?page=${page}&size=${CURATION_PAGE_SIZE}`
        );
        const data = response.data;
        nextItems = (data?.searchResult ?? []).map(mapSearchRecipeToTopItem);
        responsePageInfo = data?.pageInfo;
      } else {
        const response = await api.get<ApiResponse<CurationDetailResponse>>(
          `/api/v2/recipes/curations/${curationId}/search?page=${page}&size=${CURATION_PAGE_SIZE}`
        );
        const data = response.data;
        nextItems = (data?.recipes ?? []).map(mapRecipeToTopItem);
        responsePageInfo = data?.pageInfo;
      }
      if (page === 0 && mergeWithInitial && initialRecipes && initialRecipes.length > 0) {
        const initialMapped = initialRecipes.map(mapCurationRecipeToShortsItem);
        setShorts(appendUniqueShortsByKey(initialMapped, nextItems));
      } else {
        setShorts((prev) => (page === 0 ? nextItems : appendUniqueShortsByKey(prev, nextItems)));
      }
      if (responsePageInfo) {
        setPageInfo(responsePageInfo);
      } else {
        setPageInfo({
          page,
          size: CURATION_PAGE_SIZE,
          hasNext: false,
          first: page === 0,
          last: true,
        });
      }
      fetchedPagesRef.current.add(page);
    } finally {
      fetchingPagesRef.current.delete(page);
    }
  }, [curationId, initialRecipes]);

  const fetchInitial = useCallback(async () => {
    if (!curationId) {
      setShorts([]);
      setPageInfo(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      fetchingPagesRef.current.clear();
      fetchedPagesRef.current.clear();
      setShorts([]);
      setPageInfo(null);

      if (initialRecipes && initialRecipes.length > 0) {
        setShorts(initialRecipes.map(mapCurationRecipeToShortsItem));
        setPageInfo({
          page: 0,
          size: CURATION_PAGE_SIZE,
          hasNext: false,
          first: true,
          last: false,
        });
        await fetchPage(0, true);
      } else {
        await fetchPage(0);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [curationId, fetchPage, initialRecipes]);

  const fetchNextPage = useCallback(async () => {
    if (loadingMore) return;
    if (!pageInfo?.hasNext) return;
    try {
      setLoadingMore(true);
      await fetchPage(pageInfo.page + 1);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, loadingMore, pageInfo]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  return {
    shorts,
    loading,
    loadingMore,
    error,
    hasNext: pageInfo?.hasNext ?? false,
    fetchNextPage,
    refetch: fetchInitial,
  };
}
