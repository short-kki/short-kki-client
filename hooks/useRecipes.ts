/**
 * 레시피/레시피북 관련 Hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';
import { API_BASE_URL } from '@/constants/oauth';
import {
  type RecipeBook,
  type Recipe,
} from '@/data/mock';

// 백엔드 API 응답 타입
interface RecipeBookApiResponse {
  id: number;
  title: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  recipeCount?: number; // 목록 조회 시 직접 제공될 수 있음
  recipes?: RecipeSummaryApiResponse[]; // 상세 조회 시에만 제공될 수 있음
}

interface SlicePageInfoApiResponse {
  page: number;
  size: number;
  hasNext: boolean;
  first: boolean;
  last: boolean;
}

interface RecipeBookListApiResponse {
  recipeBooks: RecipeBookApiResponse[];
  pageInfo?: SlicePageInfoApiResponse | null;
}

interface RecipeBookDetailApiResponse {
  recipeBook: RecipeBookApiResponse;
  pageInfo?: SlicePageInfoApiResponse | null;
}

export type RecipeBookRecipeSortType = 'RECENT' | 'OLDEST' | 'BOOKMARK_DESC';

interface RecipeSummaryApiResponse {
  id: number;
  title: string;
  bookmarkCount: number;
  cookingTime: number | null;
  thumbnailUrl: string | null;
  mainImgUrl: string | null;  // 실제 API 응답 필드
  authorName: string | null;
  createdAt?: string; // API might not return this yet, but good to have
}

interface BaseResponse<T> {
  data: T;
  message?: string;
  code?: string;
}

interface GroupSummaryApiResponse {
  id: number;
  name: string;
  thumbnailImgUrl?: string | null;
}

function parseRecipeBookListResponse(
  payload: RecipeBookApiResponse[] | RecipeBookListApiResponse
): { recipeBooks: RecipeBookApiResponse[]; pageInfo?: SlicePageInfoApiResponse | null } {
  if (Array.isArray(payload)) {
    return { recipeBooks: payload, pageInfo: null };
  }

  return {
    recipeBooks: payload.recipeBooks || [],
    pageInfo: payload.pageInfo,
  };
}

function parseRecipeBookDetailResponse(
  payload: RecipeBookApiResponse | RecipeBookDetailApiResponse
): { recipeBook: RecipeBookApiResponse; pageInfo?: SlicePageInfoApiResponse | null } {
  if ('recipeBook' in payload) {
    return {
      recipeBook: payload.recipeBook,
      pageInfo: payload.pageInfo,
    };
  }

  return {
    recipeBook: payload,
    pageInfo: null,
  };
}

function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

// 백엔드 응답을 프론트엔드 타입으로 변환
function mapRecipeBookFromApi(apiResponse: RecipeBookApiResponse): RecipeBook {
  // console.log('[RecipeBook API] 응답:', JSON.stringify(apiResponse, null, 2));
  return {
    id: String(apiResponse.id),
    name: apiResponse.title,
    isDefault: apiResponse.isDefault,
    // recipeCount 직접 제공되면 사용, 아니면 recipes 배열 길이
    recipeCount: apiResponse.recipeCount ?? apiResponse.recipes?.length ?? 0,
    thumbnails: apiResponse.recipes
      ?.filter(r => r.mainImgUrl || r.thumbnailUrl)
      .map(r => normalizeImageUrl(r.mainImgUrl || r.thumbnailUrl))
      .filter((url): url is string => !!url)
      .slice(0, 3) || [],
  };
}

function mapRecipeFromApi(apiResponse: RecipeSummaryApiResponse, bookId: string): Recipe {
  // mainImgUrl 또는 thumbnailUrl 중 존재하는 것 사용
  const thumbnail =
    normalizeImageUrl(apiResponse.mainImgUrl || apiResponse.thumbnailUrl) ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
  return {
    id: String(apiResponse.id),
    title: apiResponse.title,
    thumbnail,
    duration: apiResponse.cookingTime ? `${apiResponse.cookingTime}분` : '',
    author: apiResponse.authorName || '알 수 없음',
    bookId,
    likes: apiResponse.bookmarkCount || 0,
    savedAt: apiResponse.createdAt || '', // 날짜 정보 매핑
  };
}

/**
 * 개인 레시피북 목록 조회
 */
export function usePersonalRecipeBooks() {
  const [recipeBooks, setRecipeBooks] = useState<RecipeBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecipeBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<BaseResponse<RecipeBookApiResponse[] | RecipeBookListApiResponse>>('/api/v1/recipebooks');
      const { recipeBooks: books } = parseRecipeBookListResponse(response.data);
      setRecipeBooks(books.map(mapRecipeBookFromApi));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipeBooks();
  }, [fetchRecipeBooks]);

  // 레시피북 생성 API 호출
  const createRecipeBook = useCallback(async (name: string): Promise<boolean> => {
    try {
      await api.post('/api/v1/recipebooks', { title: name });
      // 생성 후 목록 새로고침
      await fetchRecipeBooks();
      return true;
    } catch (err) {
      console.error('레시피북 생성 실패:', err);
      return false;
    }
  }, [fetchRecipeBooks]);

  // 로컬 상태에 레시피북 추가
  const addRecipeBook = useCallback((recipeBook: RecipeBook) => {
    setRecipeBooks((prev) => [...prev, recipeBook]);
  }, []);

  // 레시피북 삭제 API 호출
  const removeRecipeBook = useCallback(async (bookId: string): Promise<boolean> => {
    try {
      await api.delete(`/api/v1/recipebooks/${bookId}`);
      setRecipeBooks((prev) => prev.filter((b) => b.id !== bookId));
      return true;
    } catch (err) {
      console.error('레시피북 삭제 실패:', err);
      return false;
    }
  }, []);

  // 레시피북 이름 변경 API 호출
  const renameRecipeBook = useCallback(async (bookId: string, newName: string): Promise<boolean> => {
    try {
      await api.patch(`/api/v1/recipebooks/${bookId}`, { title: newName });
      setRecipeBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, name: newName } : b))
      );
      return true;
    } catch (err) {
      console.error('레시피북 이름 변경 실패:', err);
      return false;
    }
  }, []);

  // 개인 레시피북 순서 변경 (기본 레시피북 제외)
  const reorderRecipeBooks = useCallback(async (orderedBookIds: string[]): Promise<boolean> => {
    const mutableBookIds = recipeBooks
      .filter((book) => !book.isDefault)
      .map((book) => book.id);

    const requestedSet = new Set(orderedBookIds);
    const expectedSet = new Set(mutableBookIds);

    if (
      orderedBookIds.length !== mutableBookIds.length ||
      requestedSet.size !== orderedBookIds.length ||
      [...requestedSet].some((id) => !expectedSet.has(id))
    ) {
      console.error('유효하지 않은 레시피북 재정렬 요청:', orderedBookIds);
      return false;
    }

    try {
      await api.patch('/api/v1/recipebooks/order', {
        recipeBookIds: orderedBookIds.map((id) => Number(id)),
      });

      setRecipeBooks((prev) => {
        const fixedBooks = prev.filter((book) => book.isDefault);
        const mutableMap = new Map(
          prev.filter((book) => !book.isDefault).map((book) => [book.id, book] as const)
        );
        const reorderedMutableBooks = orderedBookIds
          .map((id) => mutableMap.get(id))
          .filter((book): book is RecipeBook => !!book);
        return [...fixedBooks, ...reorderedMutableBooks];
      });
      return true;
    } catch (err) {
      console.error('레시피북 순서 변경 실패:', err);
      return false;
    }
  }, [recipeBooks]);

  return {
    recipeBooks,
    loading,
    error,
    refetch: fetchRecipeBooks,
    createRecipeBook,
    addRecipeBook,
    removeRecipeBook,
    renameRecipeBook,
    reorderRecipeBooks,
  };
}

/**
 * 특정 그룹의 레시피북 목록 조회
 */
export function useGroupRecipeBooksById(groupId?: string) {
  const [recipeBooks, setRecipeBooks] = useState<RecipeBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecipeBooks = useCallback(async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      setError(null);

      const groupResponse = await api.get<BaseResponse<GroupSummaryApiResponse>>(`/api/v1/groups/${groupId}`);
      const groupThumbnail = normalizeImageUrl(groupResponse.data.thumbnailImgUrl);

      const response = await api.get<BaseResponse<RecipeBookApiResponse[] | RecipeBookListApiResponse>>(
        `/api/v1/recipebooks/groups/${groupId}`
      );
      const { recipeBooks: books } = parseRecipeBookListResponse(response.data);
      setRecipeBooks(
        books.map((book) => ({
          ...mapRecipeBookFromApi(book),
          groupId: String(groupId),
          groupName: groupResponse.data.name,
          groupThumbnail,
        }))
      );
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchRecipeBooks();
  }, [fetchRecipeBooks]);

  return {
    recipeBooks,
    loading,
    error,
    refetch: fetchRecipeBooks,
  };
}

/**
 * 그룹 레시피북 목록 조회
 */
export function useGroupRecipeBooks() {
  const [recipeBooks, setRecipeBooks] = useState<RecipeBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecipeBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. 내 그룹 목록 조회
      const groupsResponse = await api.get<BaseResponse<GroupSummaryApiResponse[]>>('/api/v1/groups/my');
      const myGroups = groupsResponse.data;

      if (!myGroups || myGroups.length === 0) {
        setRecipeBooks([]);
        return;
      }

      // 각 그룹의 레시피북 조회
      const allGroupBooks: RecipeBook[] = [];

      // 병렬로 요청 처리
      await Promise.all(
        myGroups.map(async (group) => {
          try {
            const booksResponse = await api.get<BaseResponse<RecipeBookApiResponse[] | RecipeBookListApiResponse>>(
              `/api/v1/recipebooks/groups/${group.id}`
            );
            const { recipeBooks } = parseRecipeBookListResponse(booksResponse.data);

            const booksMapped = recipeBooks.map((book) => ({
              ...mapRecipeBookFromApi(book),
              groupId: String(group.id),
              groupName: group.name,
              groupThumbnail: normalizeImageUrl(group.thumbnailImgUrl),
            }));
            allGroupBooks.push(...booksMapped);
          } catch (err) {
            console.error(`Group ${group.id} recipe books fetch failed:`, err);
            // 개별 그룹 조회 실패해도 전체 실패로 처리하지 않음
          }
        })
      );

      setRecipeBooks(allGroupBooks);
    } catch (err) {
      console.error('Group recipe books fetch failed:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipeBooks();
  }, [fetchRecipeBooks]);

  return {
    recipeBooks,
    loading,
    error,
    refetch: fetchRecipeBooks,
  };
}

/**
 * 레시피북 상세 (레시피 목록) 조회
 */
export function useRecipeBookDetail(
  bookId?: string,
  sort: RecipeBookRecipeSortType = 'RECENT'
) {
  const [bookName, setBookName] = useState<string>('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // 페이지네이션 상태
  const pageRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchRecipeBookDetail = useCallback(async (isLoadMore = false) => {
    if (!bookId) return;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const targetPage = isLoadMore ? pageRef.current + 1 : 0;

      // API 호출
      const response = await api.get<BaseResponse<RecipeBookApiResponse | RecipeBookDetailApiResponse>>(
        `/api/v1/recipebooks/${bookId}?page=${targetPage}&size=12&recipeSort=${sort}`
      );
      const { recipeBook, pageInfo } = parseRecipeBookDetailResponse(response.data);

      setBookName(recipeBook.title);
      setTotalCount(recipeBook.recipeCount ?? 0);
      const mappedRecipes = (recipeBook.recipes || []).map(r => mapRecipeFromApi(r, bookId));

      if (isLoadMore) {
        setRecipes(prev => [...prev, ...mappedRecipes]);
      } else {
        setRecipes(mappedRecipes);
      }

      pageRef.current = targetPage;
      // pageInfo가 있으면 사용, 없으면 데이터 개수로 추측
      if (pageInfo) {
        setHasMore(pageInfo.hasNext);
      } else {
        setHasMore(mappedRecipes.length === 12);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [bookId, sort]);

  // 초기 로딩
  useEffect(() => {
    pageRef.current = 0;
    fetchRecipeBookDetail(false);
  }, [fetchRecipeBookDetail]); // page는 의존성에서 제외 (fetch 함수 내부에서 관리)


  // 레시피북에 레시피 추가
  const addRecipe = useCallback(async (recipeId: string): Promise<boolean> => {
    if (!bookId) return false;

    try {
      const numericId = Number(recipeId);
      if (isNaN(numericId)) {
        console.error('Invalid recipe ID:', recipeId);
        return false;
      }
      await api.post(`/api/v1/recipebooks/${bookId}/recipes`, { recipeId: numericId });
      await fetchRecipeBookDetail(false); // 목록 새로고침 (첫 페이지부터 다시 로드)
      return true;
    } catch (err) {
      console.error('레시피 추가 실패:', err);
      return false;
    }
  }, [bookId, fetchRecipeBookDetail]);

  // 레시피북에서 레시피 제거
  const removeRecipe = useCallback(async (recipeId: string): Promise<boolean> => {
    if (!bookId) return false;

    try {
      await api.delete(`/api/v1/recipebooks/${bookId}/recipes/${recipeId}`);
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      return true;
    } catch (err) {
      console.error('레시피 제거 실패:', err);
      return false;
    }
  }, [bookId]);

  // 레시피를 다른 레시피북으로 이동
  const moveRecipe = useCallback(async (recipeId: string, toBookId: string): Promise<boolean> => {
    if (!bookId) return false;

    try {
      const numericToBookId = Number(toBookId);
      if (isNaN(numericToBookId)) {
        console.error('Invalid target book ID:', toBookId);
        return false;
      }

      await api.patch(`/api/v1/recipebooks/${bookId}/recipes/${recipeId}`, {
        toRecipeBookId: numericToBookId,
      });
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      return true;
    } catch (err) {
      console.error('레시피 이동 실패:', err);
      return false;
    }
  }, [bookId]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchRecipeBookDetail(true);
    }
  }, [loading, loadingMore, hasMore, fetchRecipeBookDetail]);

  return {
    bookName,
    recipes,
    loading,
    error,
    totalCount,
    refetch: () => fetchRecipeBookDetail(false),
    loadMore,
    hasMore,
    loadingMore,
    addRecipe,
    removeRecipe,
    moveRecipe,
  };
}
