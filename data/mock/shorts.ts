/**
 * 쇼츠/홈 관련 Mock 데이터
 */

// YouTube 썸네일 URL 생성 함수
const getYoutubeThumbnail = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/hq720.jpg`;

export interface ShortsItem {
  id: string;
  videoId: string;
  videoUrl: string;
  title: string;
  author: string;
  authorAvatar?: string;
  thumbnail: string;
  views?: string;
  tags?: string[];
  bookmarks?: number;
}

export interface CurationRecipe {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
}

export interface CurationSection {
  id: string;
  title: string;
  recipes: CurationRecipe[];
}

// 쇼츠 데이터 (홈 & 쇼츠 탭 공용)
export const MOCK_SHORTS: ShortsItem[] = [
  {
    id: "1",
    videoId: "DkyZ9t12hpo",
    videoUrl: "https://www.youtube.com/shorts/DkyZ9t12hpo",
    title: "초간단 계란 볶음밥 🍳",
    author: "백종원의 요리비책",
    authorAvatar: "백",
    thumbnail: getYoutubeThumbnail("DkyZ9t12hpo"),
    views: "152만",
    tags: ["#볶음밥", "#자취요리", "#5분완성"],
    bookmarks: 15234,
  },
  {
    id: "2",
    videoId: "NnhIbr5lmEg",
    videoUrl: "https://www.youtube.com/shorts/NnhIbr5lmEg",
    title: "편스토랑 류수영의 꿀팁 요리",
    author: "KBS 편스토랑",
    authorAvatar: "편",
    thumbnail: getYoutubeThumbnail("NnhIbr5lmEg"),
    views: "89만",
    tags: ["#편스토랑", "#류수영", "#1분요리"],
    bookmarks: 8921,
  },
  {
    id: "3",
    videoId: "ZPFVC78A2jM",
    videoUrl: "https://www.youtube.com/shorts/ZPFVC78A2jM",
    title: "한국인이 좋아하는 속도의 요리",
    author: "1분요리 뚝딱이형",
    authorAvatar: "뚝",
    thumbnail: getYoutubeThumbnail("ZPFVC78A2jM"),
    views: "228만",
    tags: ["#한식", "#뚝딱이형", "#빠른요리"],
    bookmarks: 22847,
  },
  {
    id: "4",
    videoId: "gQDByCdjUXw",
    videoUrl: "https://www.youtube.com/shorts/gQDByCdjUXw",
    title: "마약 옥수수 만들기",
    author: "요리왕비룡",
    authorAvatar: "비",
    thumbnail: getYoutubeThumbnail("gQDByCdjUXw"),
    views: "56만",
    tags: ["#간식", "#옥수수", "#초간단"],
    bookmarks: 5629,
  },
  {
    id: "5",
    videoId: "oc1bnLR38fE",
    videoUrl: "https://www.youtube.com/shorts/oc1bnLR38fE",
    title: "크림파스타 황금레시피",
    author: "자취생 요리",
    authorAvatar: "자",
    thumbnail: getYoutubeThumbnail("oc1bnLR38fE"),
    views: "183만",
    tags: ["#파스타", "#양식", "#혼밥"],
    bookmarks: 18392,
  },
];

// 큐레이션 섹션 데이터 (홈 화면)
export const MOCK_CURATION_SECTIONS: CurationSection[] = [
  {
    id: "trending",
    title: "🔥 지금 인기 급상승",
    recipes: [
      { id: "t1", title: "마약계란장", thumbnail: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400", duration: "10분", author: "요리왕" },
      { id: "t2", title: "크림파스타", thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400", duration: "20분", author: "파스타킹" },
      { id: "t3", title: "김치볶음밥", thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400", duration: "10분", author: "백종원" },
      { id: "t4", title: "된장찌개", thumbnail: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400", duration: "25분", author: "집밥선생" },
    ],
  },
  {
    id: "quick",
    title: "⏱️ 5분 안에 뚝딱",
    recipes: [
      { id: "q1", title: "계란후라이 덮밥", thumbnail: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400", duration: "5분", author: "간편요리" },
      { id: "q2", title: "참치마요 주먹밥", thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", duration: "5분", author: "도시락왕" },
      { id: "q3", title: "토스트 샌드위치", thumbnail: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400", duration: "5분", author: "아침식사" },
      { id: "q4", title: "컵라면 업그레이드", thumbnail: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400", duration: "5분", author: "라면마스터" },
    ],
  },
  {
    id: "single",
    title: "🏠 자취생 필수 레시피",
    recipes: [
      { id: "s1", title: "원팬 파스타", thumbnail: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400", duration: "15분", author: "자취생" },
      { id: "s2", title: "간장계란밥", thumbnail: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400", duration: "5분", author: "혼밥러" },
      { id: "s3", title: "참치김치찌개", thumbnail: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400", duration: "15분", author: "자취요리" },
      { id: "s4", title: "스팸마요덮밥", thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", duration: "10분", author: "덮밥맛집" },
    ],
  },
  {
    id: "healthy",
    title: "🥗 건강한 한 끼",
    recipes: [
      { id: "hl1", title: "닭가슴살 샐러드", thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", duration: "10분", author: "헬시쿡" },
      { id: "hl2", title: "연어 포케볼", thumbnail: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400", duration: "15분", author: "다이어터" },
      { id: "hl3", title: "두부 스테이크", thumbnail: "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=400", duration: "20분", author: "비건요리" },
      { id: "hl4", title: "오트밀 죽", thumbnail: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=400", duration: "10분", author: "아침메뉴" },
    ],
  },
];
