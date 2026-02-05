/**
 * 캘린더 관련 Mock 데이터
 */

export interface CalendarMeal {
  id: number;
  recipeId: number;
  recipeTitle: string;
  mainImgUrl: string | null;
  scheduledDate: string; // "YYYY-MM-DD"
  sortOrder: number;
  groupId: number | null;
  groupName: string | null;
}

// 현재 주 기준 날짜 생성 헬퍼
function getDateString(dayOffset: number): string {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const target = new Date(startOfWeek);
  target.setDate(startOfWeek.getDate() + dayOffset);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 개인 식단 mock 데이터
export const MOCK_CALENDAR_PERSONALS: CalendarMeal[] = [
  {
    id: 1,
    recipeId: 101,
    recipeTitle: '귀찮은 주말아침! 영양가득한 5분 완성 머그컵밥',
    mainImgUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400',
    scheduledDate: getDateString(0), // 일요일
    sortOrder: 0,
    groupId: null,
    groupName: null,
  },
  {
    id: 2,
    recipeId: 102,
    recipeTitle: 'Instant Pot Chicken Pot Pie Casserole',
    mainImgUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400',
    scheduledDate: getDateString(0), // 일요일
    sortOrder: 1,
    groupId: null,
    groupName: null,
  },
  {
    id: 3,
    recipeId: 103,
    recipeTitle: '바삭바삭 통닭구이',
    mainImgUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
    scheduledDate: getDateString(1), // 월요일
    sortOrder: 0,
    groupId: null,
    groupName: null,
  },
  {
    id: 4,
    recipeId: 104,
    recipeTitle: '연어 아보카도 포케볼',
    mainImgUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    scheduledDate: getDateString(2), // 화요일
    sortOrder: 0,
    groupId: null,
    groupName: null,
  },
  {
    id: 5,
    recipeId: 105,
    recipeTitle: '크림 파스타',
    mainImgUrl: null,
    scheduledDate: getDateString(4), // 목요일
    sortOrder: 0,
    groupId: null,
    groupName: null,
  },
  {
    id: 6,
    recipeId: 106,
    recipeTitle: '간단 김치볶음밥',
    mainImgUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    scheduledDate: getDateString(5), // 금요일
    sortOrder: 0,
    groupId: null,
    groupName: null,
  },
  {
    id: 7,
    recipeId: 107,
    recipeTitle: '된장찌개',
    mainImgUrl: null,
    scheduledDate: getDateString(5), // 금요일
    sortOrder: 1,
    groupId: null,
    groupName: null,
  },
];

// 대기열 타입
export interface RecipeQueue {
  id: number;
  recipeId: number;
  recipeTitle: string;
  mainImgUrl: string | null;
  createdAt: string;
}

// 대기열 mock 데이터
export const MOCK_RECIPE_QUEUES: RecipeQueue[] = [
  {
    id: 1,
    recipeId: 301,
    recipeTitle: '매콤 닭갈비',
    mainImgUrl: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=200',
    createdAt: '2026-02-04T10:00:00',
  },
  {
    id: 2,
    recipeId: 302,
    recipeTitle: '토마토 리조또',
    mainImgUrl: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=200',
    createdAt: '2026-02-04T11:30:00',
  },
  {
    id: 3,
    recipeId: 303,
    recipeTitle: '새우 볶음면',
    mainImgUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200',
    createdAt: '2026-02-04T14:00:00',
  },
];

// 그룹 식단 mock 데이터
export const MOCK_CALENDAR_GROUPS: CalendarMeal[] = [
  {
    id: 101,
    recipeId: 201,
    recipeTitle: '엄마표 김치찌개',
    mainImgUrl: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400',
    scheduledDate: getDateString(0),
    sortOrder: 0,
    groupId: 1,
    groupName: '우리집 밥상',
  },
  {
    id: 102,
    recipeId: 202,
    recipeTitle: '소불고기',
    mainImgUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
    scheduledDate: getDateString(2),
    sortOrder: 0,
    groupId: 1,
    groupName: '우리집 밥상',
  },
  {
    id: 103,
    recipeId: 203,
    recipeTitle: '잡채',
    mainImgUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400',
    scheduledDate: getDateString(4),
    sortOrder: 0,
    groupId: 1,
    groupName: '우리집 밥상',
  },
  {
    id: 104,
    recipeId: 204,
    recipeTitle: '참치마요 덮밥',
    mainImgUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
    scheduledDate: getDateString(0),
    sortOrder: 0,
    groupId: 2,
    groupName: '자취생 밥친구',
  },
  {
    id: 105,
    recipeId: 205,
    recipeTitle: '계란볶음밥',
    mainImgUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    scheduledDate: getDateString(1),
    sortOrder: 0,
    groupId: 2,
    groupName: '자취생 밥친구',
  },
  {
    id: 106,
    recipeId: 206,
    recipeTitle: '라면 + 치즈',
    mainImgUrl: null,
    scheduledDate: getDateString(3),
    sortOrder: 0,
    groupId: 2,
    groupName: '자취생 밥친구',
  },
];
