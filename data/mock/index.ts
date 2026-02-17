/**
 * Mock 데이터 통합 Export
 *
 * 서버 연동 시 이 파일의 import를 실제 API 호출로 대체하면 됩니다.
 */

// 그룹 관련
export {
  MOCK_GROUPS,
  MOCK_FEEDS,
  MOCK_GROUP_MEMBERS,
  type Group,
  type FeedItem,
  type FeedPost,
  type FeedRecipeSummary,
  type GroupMember,
} from './groups';

// 쇼츠/홈 관련
export {
  MOCK_SHORTS,
  MOCK_CURATION_SECTIONS,
  type ShortsItem,
  type CurationSection,
  type CurationRecipe,
} from './shorts';

// 검색 관련
export {
  MOCK_SEARCH_RECIPES,
  type SearchRecipeItem,
  type SearchPageInfo,
} from './search';

// 캘린더 관련
export {
  MOCK_CALENDAR_PERSONALS,
  MOCK_CALENDAR_GROUPS,
  MOCK_RECIPE_QUEUES,
  type CalendarMeal,
  type RecipeQueue,
} from './calendar';

// 레시피 관련
export {
  MOCK_PERSONAL_RECIPE_BOOKS,
  MOCK_GROUP_RECIPE_BOOKS,
  MOCK_RECIPE_BOOK_RECIPES,
  MOCK_SHOPPING_ITEMS,
  type RecipeBook,
  type Recipe,
  type ShoppingItem,
} from './recipes';
