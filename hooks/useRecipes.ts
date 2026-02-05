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
  recipes: RecipeSummaryApiResponse[];
}

interface RecipeSummaryApiResponse {
  id: number;
  title: string;
  bookmarkCount: number;
  thumbnailUrl: string | null;
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
  return {
    id: String(apiResponse.id),
    name: apiResponse.title,
    isDefault: apiResponse.isDefault,
    recipeCount: apiResponse.recipes?.length || 0,
    thumbnails: apiResponse.recipes
      ?.filter(r => r.thumbnailUrl)
      .map(r => r.thumbnailUrl!)
      .slice(0, 3) || [],
  };
}

function mapRecipeFromApi(apiResponse: RecipeSummaryApiResponse, bookId: string): Recipe {
  return {
    id: String(apiResponse.id),
    title: apiResponse.title,
    thumbnail: apiResponse.thumbnailUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200',
    duration: '', // API에서 제공하지 않음
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
        const response = await api.get<BaseResponse<RecipeBookApiResponse[]>>('/api/v1/recipebooks');
        const mappedBooks = response.data.map(mapRecipeBookFromApi);
        setRecipeBooks(mappedBooks);
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
              const books = booksResponse.data.map(apiBook => ({
                ...mapRecipeBookFromApi(apiBook),
                groupId: String(group.id), // 그룹 ID 추가 (UI 그룹핑용)
                groupName: group.name // 그룹 이름 추가
              }));
              allGroupBooks.push(...books);
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
        setBookName(response.data.title);
        const mappedRecipes = (response.data.recipes || []).map(r => mapRecipeFromApi(r, bookId));
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

