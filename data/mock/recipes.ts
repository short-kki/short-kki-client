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
}

export interface Recipe {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
  bookId: string;
  likes?: number; // 백엔드 bookmarkCount 매핑
}

// 개인 레시피북
export const MOCK_PERSONAL_RECIPE_BOOKS: RecipeBook[] = [
  {
    id: "999", // default -> 999
    name: "모든 레시피",
    isDefault: true,
    recipeCount: 24,
    thumbnails: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200",
    ],
  },
  {
    id: "1",
    name: "자취 요리",
    recipeCount: 12,
    thumbnails: [
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200",
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200",
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200",
    ],
  },
  {
    id: "2",
    name: "다이어트 식단",
    recipeCount: 8,
    thumbnails: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200",
    ],
  },
  {
    id: "3",
    name: "손님 대접용",
    recipeCount: 4,
    thumbnails: [
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200",
    ],
  },
];

// 그룹 레시피북 (그룹당 1개)
export const MOCK_GROUP_RECIPE_BOOKS: RecipeBook[] = [
  // 우리 가족 식단 (groupId: "1")
  {
    id: "101", // g1 -> 101
    name: "가족 공유 레시피",
    isDefault: true,
    recipeCount: 18,
    thumbnails: [
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=200",
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=200",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200",
      "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=200",
    ],
    groupId: "1",
    groupName: "우리 가족 식단",
  },
  // 자취생 요리 모임 (groupId: "2")
  {
    id: "102", // g2 -> 102
    name: "자취생 필수 레시피",
    isDefault: true,
    recipeCount: 32,
    thumbnails: [
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200",
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200",
      "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=200",
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200",
    ],
    groupId: "2",
    groupName: "자취생 요리 모임",
  },
  // 다이어트 챌린지 (groupId: "3")
  {
    id: "103", // g3 -> 103
    name: "다이어트 레시피",
    isDefault: true,
    recipeCount: 24,
    thumbnails: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200",
      "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=200",
      "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=200",
    ],
    groupId: "3",
    groupName: "다이어트 챌린지",
  },
];

// 레시피북 상세 - 레시피 목록
export const MOCK_RECIPE_BOOK_RECIPES: Record<string, Recipe[]> = {
  "999": [
    { id: "1", title: "토마토 파스타", thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", duration: "20분", author: "요리왕", bookId: "999" },
    { id: "2", title: "김치볶음밥", thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400", duration: "15분", author: "백종원", bookId: "999" },
    { id: "3", title: "된장찌개", thumbnail: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400", duration: "25분", author: "집밥선생", bookId: "999" },
    { id: "4", title: "계란말이", thumbnail: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400", duration: "10분", author: "간편요리", bookId: "999" },
    { id: "5", title: "불고기", thumbnail: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400", duration: "30분", author: "한식마스터", bookId: "999" },
    { id: "6", title: "샐러드", thumbnail: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400", duration: "10분", author: "헬시쿡", bookId: "999" },
  ],
  "1": [
    { id: "7", title: "라면 업그레이드", thumbnail: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400", duration: "10분", author: "자취생", bookId: "1" },
    { id: "8", title: "계란후라이 덮밥", thumbnail: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400", duration: "5분", author: "간편요리", bookId: "1" },
  ],
  "101": [
    { id: "101-1", title: "엄마표 김치찌개", thumbnail: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400", duration: "30분", author: "엄마", bookId: "101" },
    { id: "101-2", title: "아빠 특제 볶음밥", thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400", duration: "15분", author: "아빠", bookId: "101" },
  ],
  "102": [
    { id: "102-1", title: "원팬 파스타", thumbnail: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400", duration: "15분", author: "자취생A", bookId: "102" },
    { id: "102-2", title: "전자레인지 계란찜", thumbnail: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400", duration: "5분", author: "자취생B", bookId: "102" },
  ],
  "103": [
    { id: "103-1", title: "닭가슴살 샐러드", thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", duration: "10분", author: "헬시쿡", bookId: "103" },
    { id: "103-2", title: "연어 포케볼", thumbnail: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400", duration: "15분", author: "다이어터", bookId: "103" },
  ],
};

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
