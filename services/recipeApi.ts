/**
 * Recipe API Service
 *
 * 레시피 관련 API 호출을 담당하는 서비스
 */

import { api } from "./api";

// ============================================================================
// TYPES
// ============================================================================

export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ETC";
export type CuisineType = "KOREAN" | "WESTERN" | "JAPANESE" | "CHINESE" | "ASIAN" | "FUSION" | "ETC";
export type MealType = "MAIN" | "SIDE_DISH" | "SNACK" | "DESSERT" | "SIDE_FOR_DRINK" | "ETC";
export type RecipeSource = "USER" | "IMPORT";

export interface BasicInfoRequest {
  title: string;
  description?: string;
  servingSize: number;
  cookingTime: number;
  mainImgFileId?: number;
}

export interface CategoryInfoRequest {
  cuisineType: CuisineType;
  mealType: MealType;
  difficulty: Difficulty;
}

export interface IngredientRequest {
  name: string;
  unit: string;
  amount: number;
}

export interface StepRequest {
  description: string;
}

export interface RecipeCreateRequest {
  basicInfo: BasicInfoRequest;
  categoryInfo: CategoryInfoRequest;
  ingredients: IngredientRequest[];
  steps: StepRequest[];
  recipeSource: RecipeSource;
  tags?: string[];
}

export interface RecipeUpdateRequest {
  basicInfo: BasicInfoRequest;
  categoryInfo: CategoryInfoRequest;
  ingredients: IngredientRequest[];
  steps: StepRequest[];
  tags?: string[];
}

export interface RecipeResponse {
  id: number;
  title: string;
  description?: string;
  servingSize: number;
  cookingTime: number;
  difficulty: Difficulty;
  cuisineType: CuisineType;
  mealType: MealType;
  mainImgUrl?: string;
  sourceUrl?: string;
  sourcePlatform?: string;
  sourceContentType?: string;
  authorName: string;
  authorProfileImgUrl?: string;
  creatorName?: string;
  creatorProfileImgUrl?: string;
  bookmarkCount: number;
  ingredients: {
    name: string;
    unit: string;
    amount: number;
  }[];
  steps: {
    stepOrder: number;
    description: string;
  }[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeSummaryResponse {
  id: number;
  title: string;
  mainImgUrl?: string;
  cookingTime: number;
  difficulty: Difficulty;
  authorName: string;
  bookmarkCount: number;
}

interface BaseResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const recipeApi = {
  /**
   * 레시피 생성 (수동 입력)
   */
  create: async (request: RecipeCreateRequest): Promise<void> => {
    await api.post<BaseResponse<void>>("/api/v1/recipes", request);
  },

  /**
   * 레시피 상세 조회
   */
  getById: async (id: number): Promise<RecipeResponse> => {
    const response = await api.get<BaseResponse<RecipeResponse>>(`/api/v1/recipes/${id}`);
    console.log("[recipeApi.getById] raw response:", JSON.stringify(response, null, 2));
    console.log("[recipeApi.getById] response.data:", JSON.stringify(response.data, null, 2));
    return response.data!;
  },

  /**
   * 레시피 목록 조회
   */
  getAll: async (): Promise<RecipeResponse[]> => {
    const response = await api.get<BaseResponse<RecipeResponse[]>>("/api/v1/recipes");
    return response.data || [];
  },

  /**
   * 레시피 수정
   */
  update: async (id: number, request: RecipeUpdateRequest): Promise<void> => {
    await api.put<BaseResponse<void>>(`/api/v1/recipes/${id}`, request);
  },

  /**
   * 레시피 삭제
   */
  delete: async (id: number): Promise<void> => {
    await api.delete<BaseResponse<void>>(`/api/v1/recipes/${id}`);
  },
};

export default recipeApi;
