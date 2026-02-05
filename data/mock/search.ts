/**
 * 검색 결과 Mock 데이터
 */

export interface SearchRecipeItem {
  id: number;
  title: string;
  bookmarkCount: number;
  sourceUrl: string | null;
  mainImgUrl: string | null;
  recipeSource: 'USER' | 'IMPORT';
  authorName: string | null;
  authorProfileImgUrl: string | null;
  platform: 'YOUTUBE' | 'INSTAGRAM' | 'BLOG' | 'ETC' | null;
  creatorName: string | null;
  creatorProfileImgUrl: string | null;
}

export interface SearchPageInfo {
  page: number;
  size: number;
  hasNext: boolean;
  first: boolean;
  last: boolean;
}

export const MOCK_SEARCH_RECIPES: SearchRecipeItem[] = [
  { id: 1, title: "마약계란장", bookmarkCount: 42, sourceUrl: "https://www.youtube.com/shorts/DkyZ9t12hpo", mainImgUrl: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400", recipeSource: "IMPORT", authorName: null, authorProfileImgUrl: null, platform: "YOUTUBE", creatorName: "요리왕", creatorProfileImgUrl: null },
  { id: 2, title: "크림파스타", bookmarkCount: 87, sourceUrl: "https://www.youtube.com/shorts/oc1bnLR38fE", mainImgUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400", recipeSource: "IMPORT", authorName: null, authorProfileImgUrl: null, platform: "YOUTUBE", creatorName: "파스타킹", creatorProfileImgUrl: null },
  { id: 3, title: "김치볶음밥", bookmarkCount: 156, sourceUrl: "https://www.youtube.com/shorts/NnhIbr5lmEg", mainImgUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400", recipeSource: "IMPORT", authorName: null, authorProfileImgUrl: null, platform: "YOUTUBE", creatorName: "백종원", creatorProfileImgUrl: null },
  { id: 4, title: "된장찌개", bookmarkCount: 93, sourceUrl: null, mainImgUrl: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400", recipeSource: "USER", authorName: "집밥선생", authorProfileImgUrl: null, platform: null, creatorName: null, creatorProfileImgUrl: null },
  { id: 5, title: "연어덮밥", bookmarkCount: 67, sourceUrl: "https://www.youtube.com/shorts/gQDByCdjUXw", mainImgUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", recipeSource: "IMPORT", authorName: null, authorProfileImgUrl: null, platform: "YOUTUBE", creatorName: "요리왕", creatorProfileImgUrl: null },
  { id: 6, title: "떡볶이", bookmarkCount: 214, sourceUrl: "https://www.youtube.com/shorts/ZPFVC78A2jM", mainImgUrl: "https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=400", recipeSource: "IMPORT", authorName: null, authorProfileImgUrl: null, platform: "YOUTUBE", creatorName: "분식왕", creatorProfileImgUrl: null },
  { id: 7, title: "제육볶음", bookmarkCount: 128, sourceUrl: null, mainImgUrl: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400", recipeSource: "USER", authorName: "백종원", authorProfileImgUrl: null, platform: null, creatorName: null, creatorProfileImgUrl: null },
  { id: 8, title: "불고기", bookmarkCount: 175, sourceUrl: null, mainImgUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400", recipeSource: "USER", authorName: "한식마스터", authorProfileImgUrl: null, platform: null, creatorName: null, creatorProfileImgUrl: null },
  { id: 9, title: "카레라이스", bookmarkCount: 51, sourceUrl: null, mainImgUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400", recipeSource: "USER", authorName: "간편요리", authorProfileImgUrl: null, platform: null, creatorName: null, creatorProfileImgUrl: null },
  { id: 10, title: "브라우니", bookmarkCount: 33, sourceUrl: "https://www.instagram.com/p/example", mainImgUrl: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400", recipeSource: "IMPORT", authorName: null, authorProfileImgUrl: null, platform: "INSTAGRAM", creatorName: "베이킹러버", creatorProfileImgUrl: null },
  { id: 11, title: "오이무침", bookmarkCount: 22, sourceUrl: null, mainImgUrl: "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=400", recipeSource: "USER", authorName: "반찬여왕", authorProfileImgUrl: null, platform: null, creatorName: null, creatorProfileImgUrl: null },
  { id: 12, title: "닭갈비", bookmarkCount: 98, sourceUrl: null, mainImgUrl: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400", recipeSource: "USER", authorName: "매운맛킹", authorProfileImgUrl: null, platform: null, creatorName: null, creatorProfileImgUrl: null },
];
