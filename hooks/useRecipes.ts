/**
 * 레시피/레시피북 관련 Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { USE_MOCK, api } from '@/services/api';
import {
  MOCK_PERSONAL_RECIPE_BOOKS,
  MOCK_GROUP_RECIPE_BOOKS,
  MOCK_RECIPE_BOOK_RECIPES,
  MOCK_SHOPPING_ITEMS,
  type RecipeBook,
  type Recipe,
  type ShoppingItem,
} from '@/data/mock';

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
        const data = await api.get<RecipeBook[]>('/recipe-books');
        setRecipeBooks(data);
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

  const addRecipeBook = useCallback((recipeBook: RecipeBook) => {
    setRecipeBooks((prev) => [...prev, recipeBook]);
  }, []);

  const removeRecipeBook = useCallback((bookId: string) => {
    setRecipeBooks((prev) => prev.filter((b) => b.id !== bookId));
  }, []);

  const renameRecipeBook = useCallback((bookId: string, newName: string) => {
    setRecipeBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, name: newName } : b))
    );
  }, []);

  return {
    recipeBooks,
    loading,
    error,
    refetch: fetchRecipeBooks,
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
        const data = await api.get<RecipeBook[]>('/groups/recipe-books');
        setRecipeBooks(data);
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
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRecipes = useCallback(async () => {
    if (!bookId) return;

    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        setRecipes(MOCK_RECIPE_BOOK_RECIPES[bookId] || []);
      } else {
        const data = await api.get<Recipe[]>(`/recipe-books/${bookId}/recipes`);
        setRecipes(data);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return {
    recipes,
    loading,
    error,
    refetch: fetchRecipes,
  };
}

/**
 * 장보기 목록 조회
 */
export function useShoppingList(groupId?: string) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (USE_MOCK) {
        setItems(MOCK_SHOPPING_ITEMS);
      } else {
        const endpoint = groupId
          ? `/groups/${groupId}/shopping-list`
          : '/shopping-list';
        const data = await api.get<ShoppingItem[]>(endpoint);
        setItems(data);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleItem = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  }, []);

  const addItem = useCallback((item: ShoppingItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    toggleItem,
    addItem,
    removeItem,
  };
}
