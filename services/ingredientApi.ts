/**
 * Ingredient API Service
 * 
 * 재료 검색 및 자동완성을 위한 서비스
 * 현재는 Mock 데이터로 동작하며, 추후 백엔드 API가 준비되면 교체 예정
 */

import { api, USE_MOCK } from "./api";

export interface IngredientOption {
    id: number;
    name: string;
}

interface IngredientSearchResponse {
    contents: IngredientOption[];
    hasMore: boolean;
}

// Mock 데이터
const MOCK_INGREDIENTS: string[] = [
    "양파", "대파", "마늘", "다진마늘", "고추", "청양고추", "홍고추",
    "당근", "감자", "고구마", "무", "배추", "양배추", "오이", "호박", "애호박",
    "돼지고기", "소고기", "닭고기", "달걀", "두부", "햄", "소시지", "어묵",
    "참치", "김치", "콩나물", "숙주", "시금치", "브로콜리", "파프리카",
    "버섯", "표고버섯", "팽이버섯", "새송이버섯",
    "간장", "고추장", "된장", "소금", "설탕", "후추", "참기름", "식용유", "올리브유",
    "우유", "치즈", "버터", "생크림", "요거트",
    "파스타면", "라면", "국수", "당면", "쌀", "밥", "떡"
];

export const ingredientApi = {
    /**
     * 재료 검색 (자동완성용)
     */
    search: async (keyword: string): Promise<IngredientOption[]> => {
        // 1. 키워드가 없으면 빈 배열 반환
        if (!keyword || keyword.trim().length === 0) {
            return [];
        }

        // 2. Mock 모드 (또는 현재 API 없음)
        // 실제 API가 나오면 아래 로직을 api.get 호출로 변경하면 됨

        await new Promise(resolve => setTimeout(resolve, 200)); // 자연스러운 딜레이

        const filtered = MOCK_INGREDIENTS.filter(ing =>
            ing.includes(keyword) ||
            (keyword.length >= 1 && ing.startsWith(keyword)) // 초성 검색은 복잡하므로 단순 포함 여부만
        );

        return filtered.slice(0, 5).map((name, index) => ({
            id: index,
            name
        }));
    }
};
