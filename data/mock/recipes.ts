/**
 * 레시피북 관련 Mock 데이터
 */

export interface RecipeBook {
  id: string;
  name: string;
  isDefault?: boolean;
  recipeCount: number;
  thumbnails: string[];
  groupId?: string;
  groupName?: string;
  groupThumbnail?: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
  bookId: string;
  likes?: number; // 백엔드 bookmarkCount 매핑
  savedAt?: string; // 저장된 날짜
}

// 장보기 목록
export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  isChecked: boolean;
  addedBy: string;
}

export const MOCK_SHOPPING_ITEMS: ShoppingItem[] = [
  { id: "1", name: "계란 1판", category: "냉장", isChecked: false, addedBy: "엄마" },
  { id: "2", name: "우유 1L", category: "냉장", isChecked: true, addedBy: "아빠" },
  { id: "3", name: "양파 3개", category: "채소", isChecked: false, addedBy: "엄마" },
  { id: "4", name: "대파 1단", category: "채소", isChecked: false, addedBy: "동생" },
  { id: "5", name: "돼지고기 500g", category: "정육", isChecked: false, addedBy: "엄마" },
  { id: "6", name: "두부 1모", category: "냉장", isChecked: true, addedBy: "아빠" },
  { id: "7", name: "김치 1kg", category: "냉장", isChecked: false, addedBy: "엄마" },
  { id: "8", name: "라면 5개입", category: "가공식품", isChecked: false, addedBy: "동생" },
];
