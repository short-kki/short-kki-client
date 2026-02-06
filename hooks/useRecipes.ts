/**
 * 레시피/레시피북 관련 Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { USE_MOCK, api } from '@/services/api';
import {
  MOCK_PERSONAL_RECIPE_BOOKS,
  MOCK_GROUP_RECIPE_BOOKS,
  MOCK_RECIPE_BOOK_RECIPES,
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

// 백엔드 응답을 프론트엔드 타입으로 변환
function mapRecipeBookFromApi(apiResponse: RecipeBookApiResponse): RecipeBook {
  console.log('[RecipeBook API] 응답:', JSON.stringify(apiResponse, null, 2));
  return {
    id: String(apiResponse.id),
    name: apiResponse.title,
    isDefault: apiResponse.isDefault,
    // recipeCount 직접 제공되면 사용, 아니면 recipes 배열 길이
    recipeCount: apiResponse.recipeCount ?? apiResponse.recipes?.length ?? 0,
    thumbnails: apiResponse.recipes
      ?.filter(r => r.mainImgUrl || r.thumbnailUrl)
      .map(r => r.mainImgUrl || r.thumbnailUrl!)
      .slice(0, 3) || [],
  };
}

function mapRecipeFromApi(apiResponse: RecipeSummaryApiResponse, bookId: string): Recipe {
  // mainImgUrl 또는 thumbnailUrl 중 존재하는 것 사용
  const thumbnail = apiResponse.mainImgUrl || apiResponse.thumbnailUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200';
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

      if (USE_MOCK) {
        setRecipeBooks(MOCK_PERSONAL_RECIPE_BOOKS);
      } else {
        // 1. 레시피북 목록 조회
        const response = await api.get<BaseResponse<RecipeBookApiResponse[]>>('/api/v1/recipebooks');
        const books = response.data;

        // 2. 각 레시피북의 상세 정보를 병렬로 조회하여 썸네일 가져오기
        const booksWithThumbnails = await Promise.all(
          books.map(async (book) => {
            try {
              const detailResponse = await api.get<BaseResponse<RecipeBookApiResponse>>(
                `/api/v1/recipebooks/${book.id}`
              );
              console.log(`[RecipeBook ${book.id}] 상세 응답:`, JSON.stringify(detailResponse.data, null, 2));
              // 상세 응답에서 recipes가 있으면 썸네일 추출 (mainImgUrl 우선)
              const recipes = detailResponse.data.recipes || [];
              console.log(`[RecipeBook ${book.id}] recipes 개수:`, recipes.length);
              const thumbnails = recipes
                .filter(r => r.mainImgUrl || r.thumbnailUrl)
                .map(r => r.mainImgUrl || r.thumbnailUrl!)
                .slice(0, 3);
              console.log(`[RecipeBook ${book.id}] 썸네일:`, thumbnails);
              const recipeCount = recipes.length || book.recipeCount || 0;

              return {
                id: String(book.id),
                name: book.title,
                isDefault: book.isDefault,
                recipeCount,
                thumbnails,
              };
            } catch (err) {
              console.error(`레시피북 ${book.id} 상세 조회 실패:`, err);
              // 상세 조회 실패 시 기본 정보만 반환
              return mapRecipeBookFromApi(book);
            }
          })
        );

        setRecipeBooks(booksWithThumbnails);
      }
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
      if (USE_MOCK) {
        const newBook: RecipeBook = {
          id: Date.now().toString(),
          name,
          isDefault: false,
          recipeCount: 0,
          thumbnails: [],
        };
        setRecipeBooks((prev) => [...prev, newBook]);
        return true;
      } else {
        await api.post('/api/v1/recipebooks', { title: name });
        // 생성 후 목록 새로고침
        await fetchRecipeBooks();
        return true;
      }
    } catch (err) {
      console.error('레시피북 생성 실패:', err);
      return false;
    }
  }, [fetchRecipeBooks]);

  // 로컬 상태에 레시피북 추가 (Mock용)
  const addRecipeBook = useCallback((recipeBook: RecipeBook) => {
    setRecipeBooks((prev) => [...prev, recipeBook]);
  }, []);

  // 레시피북 삭제 API 호출
  const removeRecipeBook = useCallback(async (bookId: string): Promise<boolean> => {
    try {
      if (USE_MOCK) {
        setRecipeBooks((prev) => prev.filter((b) => b.id !== bookId));
        return true;
      } else {
        await api.delete(`/api/v1/recipebooks/${bookId}`);
        setRecipeBooks((prev) => prev.filter((b) => b.id !== bookId));
        return true;
      }
    } catch (err) {
      console.error('레시피북 삭제 실패:', err);
      return false;
    }
  }, []);

  // 레시피북 이름 변경 API 호출
  const renameRecipeBook = useCallback(async (bookId: string, newName: string): Promise<boolean> => {
    try {
      if (USE_MOCK) {
        setRecipeBooks((prev) =>
          prev.map((b) => (b.id === bookId ? { ...b, name: newName } : b))
        );
        return true;
      } else {
        await api.patch(`/api/v1/recipebooks/${bookId}`, { title: newName });
        setRecipeBooks((prev) =>
          prev.map((b) => (b.id === bookId ? { ...b, name: newName } : b))
        );
        return true;
      }
    } catch (err) {
      console.error('레시피북 이름 변경 실패:', err);
      return false;
    }
  }, []);

  return {
    recipeBooks,
    loading,
    error,
    refetch: fetchRecipeBooks,
    createRecipeBook,
    addRecipeBook,
    removeRecipeBook,
    renameRecipeBook,
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

      if (USE_MOCK) {
        const filtered = MOCK_GROUP_RECIPE_BOOKS.filter(b => b.groupId === groupId);
        setRecipeBooks(filtered);
      } else {
        // 1. 그룹 레시피북 목록 조회
        const response = await api.get<BaseResponse<RecipeBookApiResponse[]>>(
          `/api/v1/recipebooks/groups/${groupId}`
        );
        const books = response.data;

        // 2. 각 레시피북의 상세 정보를 병렬로 조회하여 썸네일 가져오기
        const booksWithThumbnails = await Promise.all(
          books.map(async (book) => {
            try {
              const detailResponse = await api.get<BaseResponse<RecipeBookApiResponse>>(
                `/api/v1/recipebooks/${book.id}`
              );
              // 상세 응답에서 recipes가 있으면 썸네일 추출 (mainImgUrl 우선)
              const recipes = detailResponse.data.recipes || [];
              const thumbnails = recipes
                .filter(r => r.mainImgUrl || r.thumbnailUrl)
                .map(r => r.mainImgUrl || r.thumbnailUrl!)
                .slice(0, 3);
              const recipeCount = recipes.length || book.recipeCount || 0;

              return {
                id: String(book.id),
                name: book.title,
                isDefault: book.isDefault,
                recipeCount,
                thumbnails,
              };
            } catch (err) {
              console.error(`레시피북 ${book.id} 상세 조회 실패:`, err);
              // 상세 조회 실패 시 기본 정보만 반환
              return mapRecipeBookFromApi(book);
            }
          })
        );

        setRecipeBooks(booksWithThumbnails);
      }
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

      if (USE_MOCK) {
        setRecipeBooks(MOCK_GROUP_RECIPE_BOOKS);
      } else {
        // 1. 내 그룹 목록 조회
        const groupsResponse = await api.get<BaseResponse<{ id: number; name: string }[]>>('/api/v1/groups/my');
        const myGroups = groupsResponse.data;

        if (!myGroups || myGroups.length === 0) {
          setRecipeBooks([]);
          return;
        }

        // 2. 각 그룹의 레시피북 조회
        const allGroupBooks: RecipeBook[] = [];

        // 병렬로 요청 처리
        await Promise.all(
          myGroups.map(async (group) => {
            try {
              const booksResponse = await api.get<BaseResponse<RecipeBookApiResponse[]>>(`/api/v1/recipebooks/groups/${group.id}`);

              // 각 레시피북의 상세 정보를 조회하여 썸네일 가져오기
              const booksWithThumbnails = await Promise.all(
                booksResponse.data.map(async (book) => {
                  try {
                    const detailResponse = await api.get<BaseResponse<RecipeBookApiResponse>>(
                      `/api/v1/recipebooks/${book.id}`
                    );
                    const thumbnails = detailResponse.data.recipes
                      ?.filter(r => r.mainImgUrl || r.thumbnailUrl)
                      .map(r => r.mainImgUrl || r.thumbnailUrl!)
                      .slice(0, 3) || [];
                    const recipeCount = detailResponse.data.recipes?.length ?? book.recipeCount ?? 0;

                    return {
                      id: String(book.id),
                      name: book.title,
                      isDefault: book.isDefault,
                      recipeCount,
                      thumbnails,
                      groupId: String(group.id),
                      groupName: group.name,
                    };
                  } catch (err) {
                    console.error(`레시피북 ${book.id} 상세 조회 실패:`, err);
                    return {
                      ...mapRecipeBookFromApi(book),
                      groupId: String(group.id),
                      groupName: group.name,
                    };
                  }
                })
              );

              allGroupBooks.push(...booksWithThumbnails);
            } catch (err) {
              console.error(`Group ${group.id} recipe books fetch failed:`, err);
              // 개별 그룹 조회 실패해도 전체 실패로 처리하지 않음
            }
          })
        );

        setRecipeBooks(allGroupBooks);
      }
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
export function useRecipeBookDetail(bookId?: string) {
  const [bookName, setBookName] = useState<string>('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecipeBookDetail = useCallback(async () => {
    if (!bookId) return;

    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        // Mock 데이터에서 레시피북 이름 찾기
        const allBooks = [...MOCK_PERSONAL_RECIPE_BOOKS, ...MOCK_GROUP_RECIPE_BOOKS];
        const book = allBooks.find(b => b.id === bookId);
        setBookName(book?.name || '레시피북');
        setRecipes(MOCK_RECIPE_BOOK_RECIPES[bookId] || []);
      } else {
        const response = await api.get<BaseResponse<RecipeBookApiResponse>>(`/api/v1/recipebooks/${bookId}`);
        console.log('[RecipeBookDetail] API 응답:', JSON.stringify(response.data, null, 2));
        console.log('[RecipeBookDetail] recipes 배열:', response.data.recipes);
        setBookName(response.data.title);
        const mappedRecipes = (response.data.recipes || []).map(r => mapRecipeFromApi(r, bookId));
        console.log('[RecipeBookDetail] 변환된 레시피:', mappedRecipes);
        setRecipes(mappedRecipes);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchRecipeBookDetail();
  }, [fetchRecipeBookDetail]);


  // 레시피북에 레시피 추가
  const addRecipe = useCallback(async (recipeId: string): Promise<boolean> => {
    if (!bookId) return false;

    try {
      if (USE_MOCK) {
        console.log(`Mock: Adding recipe ${recipeId} to book ${bookId}`);
        return true;
      } else {
        const numericId = Number(recipeId);
        if (isNaN(numericId)) {
          console.error('Invalid recipe ID:', recipeId);
          return false;
        }
        await api.post(`/api/v1/recipebooks/${bookId}/recipes`, { recipeId: numericId });
        await fetchRecipeBookDetail(); // 목록 새로고침
        return true;
      }
    } catch (err) {
      console.error('레시피 추가 실패:', err);
      return false;
    }
  }, [bookId, fetchRecipeBookDetail]);

  // 레시피북에서 레시피 제거
  const removeRecipe = useCallback(async (recipeId: string): Promise<boolean> => {
    if (!bookId) return false;

    try {
      if (USE_MOCK) {
        setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
        return true;
      } else {
        await api.delete(`/api/v1/recipebooks/${bookId}/recipes/${recipeId}`);
        setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
        return true;
      }
    } catch (err) {
      console.error('레시피 제거 실패:', err);
      return false;
    }
  }, [bookId]);

  // 레시피를 다른 레시피북으로 이동
  const moveRecipe = useCallback(async (recipeId: string, toBookId: string): Promise<boolean> => {
    if (!bookId) return false;

    try {
      if (USE_MOCK) {
        setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
        console.log(`Mock: Moving recipe ${recipeId} from ${bookId} to ${toBookId}`);
        return true;
      } else {
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
      }
    } catch (err) {
      console.error('레시피 이동 실패:', err);
      return false;
    }
  }, [bookId]);

  return {
    bookName,
    recipes,
    loading,
    error,
    refetch: fetchRecipeBookDetail,
    addRecipe,
    removeRecipe,
    moveRecipe,
  };
}

