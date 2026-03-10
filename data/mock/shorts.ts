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
  authorProfileImgUrl?: string;
  creatorName?: string;
  thumbnail: string;
  views?: string;
  tags?: string[];
  bookmarks?: number;
  isBookmarked?: boolean;
}

export interface CurationRecipe {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  author: string;
  authorProfileImgUrl?: string;
  creatorName?: string;
  bookmarks?: number;
  sourceUrl?: string;
  cookingTime?: number;
  isBookmarked?: boolean;
}

export interface CurationSection {
  id: string;
  title: string;
  description?: string;
  mealTypes?: string[];
  cuisineTypes?: string[];
  recipes: CurationRecipe[];
}

// 쇼츠 데이터 (홈 & 쇼츠 탭 공용)
export const MOCK_SHORTS: ShortsItem[] = [
  {
    id: "Hwzl8IA9NH0",
    videoId: "Hwzl8IA9NH0",
    videoUrl: "https://www.youtube.com/shorts/Hwzl8IA9NH0",
    title: "말도 안 되는 맛",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/Hwzl8IA9NH0/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 7368,
  },
  {
    id: "VluMp9xsSQk",
    videoId: "VluMp9xsSQk",
    videoUrl: "https://www.youtube.com/shorts/VluMp9xsSQk",
    title: "의외로 모르는 계란 황금레시피",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/VluMp9xsSQk/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 7472,
  },
  {
    id: "Cixr68QJB5k",
    videoId: "Cixr68QJB5k",
    videoUrl: "https://www.youtube.com/shorts/Cixr68QJB5k",
    title: "김밥 공장을 돌리게 될",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/Cixr68QJB5k/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 3209,
  },
  {
    id: "7S_QuVnwdPk",
    videoId: "7S_QuVnwdPk",
    videoUrl: "https://www.youtube.com/shorts/7S_QuVnwdPk",
    title: "샐러드 파스타 제발 이렇게 드세요",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/7S_QuVnwdPk/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 2404,
  },
  {
    id: "u2HbaOioHhE",
    videoId: "u2HbaOioHhE",
    videoUrl: "https://www.youtube.com/shorts/u2HbaOioHhE",
    title: "[⭐️700만⭐️]  쉬워서 꼭 만들어 보세요 부추나물 #shorts",
    author: "1분요리왕 통키",
    authorAvatar: "1",
    creatorName: "1분요리왕 통키",
    thumbnail: "https://i.ytimg.com/vi/u2HbaOioHhE/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 2431,
  },
  {
    id: "OTHnF5oPuB0",
    videoId: "OTHnF5oPuB0",
    videoUrl: "https://www.youtube.com/shorts/OTHnF5oPuB0",
    title: "쉿 우리끼리만 아는겁니다",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/OTHnF5oPuB0/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 6984,
  },
  {
    id: "xXjFOi35QYs",
    videoId: "xXjFOi35QYs",
    videoUrl: "https://www.youtube.com/shorts/xXjFOi35QYs",
    title: "[⭐️620만⭐️]#강레오 고등어구이에 이것을 넣으세요! 생선 비린내 싹 사라집니다! 생선구이 고등어구이 비린내 제거~ #고등어구이냄새제거 #생선구이비린내제거 #고등어맛집레시피",
    author: "1분요리왕 통키",
    authorAvatar: "1",
    creatorName: "1분요리왕 통키",
    thumbnail: "https://i.ytimg.com/vi/xXjFOi35QYs/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 20464,
  },
  {
    id: "4B-a2t05owg",
    videoId: "4B-a2t05owg",
    videoUrl: "https://www.youtube.com/shorts/4B-a2t05owg",
    title: "[⭐️600만⭐️]  분당 대박 반찬가게 히트메뉴 마늘쫑무침 #shorts",
    author: "1분요리왕 통키",
    authorAvatar: "1",
    creatorName: "1분요리왕 통키",
    thumbnail: "https://i.ytimg.com/vi/4B-a2t05owg/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 5020,
  },
  {
    id: "OEassmynRro",
    videoId: "OEassmynRro",
    videoUrl: "https://www.youtube.com/shorts/OEassmynRro",
    title: "우리 가족 최애 반찬이야",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/OEassmynRro/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 20706,
  },
  {
    id: "IfaJi7vdJ5o",
    videoId: "IfaJi7vdJ5o",
    videoUrl: "https://www.youtube.com/shorts/IfaJi7vdJ5o",
    title: "[⭐️500만⭐️]  신박한 열무김치 #shorts",
    author: "1분요리왕 통키",
    authorAvatar: "1",
    creatorName: "1분요리왕 통키",
    thumbnail: "https://i.ytimg.com/vi/IfaJi7vdJ5o/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 18939,
  },
  {
    id: "9BGJ-C7BHmE",
    videoId: "9BGJ-C7BHmE",
    videoUrl: "https://www.youtube.com/shorts/9BGJ-C7BHmE",
    title: "이건 진짜 간단함 ㅇㅈ?",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/9BGJ-C7BHmE/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 16619,
  },
  {
    id: "ZxfS_lE8x14",
    videoId: "ZxfS_lE8x14",
    videoUrl: "https://www.youtube.com/shorts/ZxfS_lE8x14",
    title: "이건 진짜 꼭 드세요 꼭.",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/ZxfS_lE8x14/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 3486,
  },
  {
    id: "y-uTGBt15R8",
    videoId: "y-uTGBt15R8",
    videoUrl: "https://www.youtube.com/shorts/y-uTGBt15R8",
    title: "[⭐️460만⭐️]  삼청동 한정식집 오이물김치 #shorts",
    author: "1분요리왕 통키",
    authorAvatar: "1",
    creatorName: "1분요리왕 통키",
    thumbnail: "https://i.ytimg.com/vi/y-uTGBt15R8/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 19443,
  },
  {
    id: "90sO7IqfGvo",
    videoId: "90sO7IqfGvo",
    videoUrl: "https://www.youtube.com/shorts/90sO7IqfGvo",
    title: "주머니 무거워지는 레시피",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/90sO7IqfGvo/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 8788,
  },
  {
    id: "b3IdBN8QQgg",
    videoId: "b3IdBN8QQgg",
    videoUrl: "https://www.youtube.com/shorts/b3IdBN8QQgg",
    title: "[⭐️400만⭐️]  한식뚝딱 양파청 #shorts",
    author: "1분요리왕 통키",
    authorAvatar: "1",
    creatorName: "1분요리왕 통키",
    thumbnail: "https://i.ytimg.com/vi/b3IdBN8QQgg/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 6449,
  },
  {
    id: "cB6S39axLHg",
    videoId: "cB6S39axLHg",
    videoUrl: "https://www.youtube.com/shorts/cB6S39axLHg",
    title: "이런건 누가 처음 만들었을까",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/cB6S39axLHg/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 20015,
  },
  {
    id: "2dwl-I2G8fM",
    videoId: "2dwl-I2G8fM",
    videoUrl: "https://www.youtube.com/shorts/2dwl-I2G8fM",
    title: "이 분 쩝쩝박사시네",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/2dwl-I2G8fM/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 14814,
  },
  {
    id: "SfLT2ApMI9o",
    videoId: "SfLT2ApMI9o",
    videoUrl: "https://www.youtube.com/shorts/SfLT2ApMI9o",
    title: "추억의 ㄴㅃㄴㅃ을 아시나요",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/SfLT2ApMI9o/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 12762,
  },
  {
    id: "8yaDVacfkCM",
    videoId: "8yaDVacfkCM",
    videoUrl: "https://www.youtube.com/shorts/8yaDVacfkCM",
    title: "저는 반숙을 안 좋아해요",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/8yaDVacfkCM/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 12949,
  },
  {
    id: "3iv7WdJgk2U",
    videoId: "3iv7WdJgk2U",
    videoUrl: "https://www.youtube.com/shorts/3iv7WdJgk2U",
    title: "다이어트 엽떡",
    author: "유지만 yuziman",
    authorAvatar: "유",
    creatorName: "유지만 yuziman",
    thumbnail: "https://i.ytimg.com/vi/3iv7WdJgk2U/maxresdefault.jpg",
    views: undefined,
    tags: [],
    bookmarks: 18360,
  },
];






// 큐레이션 섹션 데이터 (홈 화면)
export const MOCK_CURATION_SECTIONS: CurationSection[] = [
  {
    id: "trending",
    title: "# 지금 인기 급상승",
    description: "지금 가장 많이 저장되고 있는 레시피",
    recipes: [
      { id: "aMWtiwteDGw", title: "일본 상남자들은 이거 없으면 밥 안 먹습니다", thumbnail: "https://i.ytimg.com/vi/aMWtiwteDGw/maxresdefault.jpg", duration: "1:22", author: "1분요리 뚝딱이형", creatorName: "1분요리 뚝딱이형", bookmarks: 7535 },
      { id: "35LCr9kvVfg", title: "지금 아니면 못 먹습니다 (진짜로)", thumbnail: "https://i.ytimg.com/vi/35LCr9kvVfg/maxresdefault.jpg", duration: "1:28", author: "1분요리 뚝딱이형", creatorName: "1분요리 뚝딱이형", bookmarks: 9524 },
      { id: "VN7Pb0ZfDZA", title: "오해가 있는 것 같아 처음부터 말씀드리겠습니다.", thumbnail: "https://i.ytimg.com/vi/VN7Pb0ZfDZA/maxresdefault.jpg", duration: "1:30", author: "1분요리 뚝딱이형", creatorName: "1분요리 뚝딱이형", bookmarks: 5840 },
      { id: "nHmWdsYQCCg", title: "한국, 일본 할 거 없이 그냥 맛있는 음식입니다.", thumbnail: "https://i.ytimg.com/vi/nHmWdsYQCCg/maxresdefault.jpg", duration: "1:27", author: "1분요리 뚝딱이형", creatorName: "1분요리 뚝딱이형", bookmarks: 19719 },
      { id: "Rj6w1pdhdlc", title: "진짜 맛있는데 한 접시에 12만 원이라...", thumbnail: "https://i.ytimg.com/vi/Rj6w1pdhdlc/maxresdefault.jpg", duration: "1:27", author: "1분요리 뚝딱이형", creatorName: "1분요리 뚝딱이형", bookmarks: 4060 },
    ],
  },
  {
    id: "quick",
    title: "# 5분 안에 뚝딱",
    description: "바쁜 하루, 빠르게 완성되는 레시피",
    recipes: [
      { id: "qgXRVvpmN3E", title: "2월·3월엔 무조건 이거입니다.", thumbnail: "https://i.ytimg.com/vi/qgXRVvpmN3E/maxresdefault.jpg", duration: "1:34", author: "1분요리 뚝딱이형", creatorName: "1분요리 뚝딱이형", bookmarks: 10095 },
      { id: "11Lr7aQcEbo", title: "두부를 부쉈을 뿐인데 완전히 달라졌습니다", thumbnail: "https://i.ytimg.com/vi/11Lr7aQcEbo/maxresdefault.jpg", duration: "1:10", author: "1분요리 뚝딱이형", creatorName: "1분요리 뚝딱이형", bookmarks: 18007 },
      { id: "aBkgPQZmzow", title: "임금님이 먹던 데엔 다 이유가 있었습니다", thumbnail: "https://i.ytimg.com/vi/aBkgPQZmzow/maxresdefault.jpg", duration: "1:18", author: "1분요리 뚝딱이형", creatorName: "1분요리 뚝딱이형", bookmarks: 3045 },
      { id: "9eFDN_ZDy6c", title: "올해 만든 반찬 중에 제일 밥도둑이었습니다.", thumbnail: "https://i.ytimg.com/vi/9eFDN_ZDy6c/maxresdefault.jpg", duration: "1:23", author: "1분요리 뚝딱이형", creatorName: "1분요리 뚝딱이형", bookmarks: 1162 },
      { id: "y8GNdUb7rwo", title: "아니 요즘 제품 왜 이렇게 잘 나옴?", thumbnail: "https://i.ytimg.com/vi/y8GNdUb7rwo/maxresdefault.jpg", duration: "1:31", author: "1분요리 뚝딱이형", creatorName: "1분요리 뚝딱이형", bookmarks: 19340 },
    ],
  },
  {
    id: "single",
    title: "# 자취생 필수 레시피",
    description: "장보기 최소, 맛은 최대",
    recipes: [
      { id: "a8wiH1S2-lI", title: "[⭐️900만⭐️] 중식 셰프가 ‘라면’ 끓이는 법🍜🍜", thumbnail: "https://i.ytimg.com/vi/a8wiH1S2-lI/maxresdefault.jpg", duration: "0:45", author: "김진순 점심시간", creatorName: "김진순 점심시간", bookmarks: 17523 },
      { id: "VuS3A_wvM1c", title: "[⭐️600만⭐️]이지혜님도 극찬한, 전설의 제육볶음🔥", thumbnail: "https://i.ytimg.com/vi/VuS3A_wvM1c/maxresdefault.jpg", duration: "0:34", author: "김진순 점심시간", creatorName: "김진순 점심시간", bookmarks: 4124 },
      { id: "LZOxTNl6RTc", title: "[⭐️800만⭐️] 배달집에서 주는 서비스 계란찜, 전자렌지로 5분이면 만들어요!👏👏", thumbnail: "https://i.ytimg.com/vi/LZOxTNl6RTc/maxresdefault.jpg", duration: "0:35", author: "김진순 점심시간", creatorName: "김진순 점심시간", bookmarks: 1349 },
      { id: "bYH5SAKEnFI", title: "두부조림 레시피, 교과서가 될 영상 🥇✨", thumbnail: "https://i.ytimg.com/vi/bYH5SAKEnFI/maxresdefault.jpg", duration: "0:52", author: "김진순 점심시간", creatorName: "김진순 점심시간", bookmarks: 8566 },
      { id: "MmDfM1sxnrk", title: "한국인들은 모르는, 초간단 두부요리⁉️", thumbnail: "https://i.ytimg.com/vi/MmDfM1sxnrk/maxresdefault.jpg", duration: "0:55", author: "김진순 점심시간", creatorName: "김진순 점심시간", bookmarks: 14636 },
    ],
  },
  {
    id: "healthy",
    title: "# 건강한 한 끼",
    description: "가볍게 즐기는 균형 잡힌 한 끼",
    recipes: [
      { id: "4B-a2t05owg", title: "[⭐️600만⭐️]  분당 대박 반찬가게 히트메뉴 마늘쫑무침 #shorts", thumbnail: "https://i.ytimg.com/vi/4B-a2t05owg/maxresdefault.jpg", duration: "0:37", author: "1분요리왕 통키", creatorName: "1분요리왕 통키", bookmarks: 17469 },
      { id: "11C8XqWobjQ", title: "[⭐️400만⭐️]  초간단 4분 잔치국수 뚝딱! #shorts", thumbnail: "https://i.ytimg.com/vi/11C8XqWobjQ/maxresdefault.jpg", duration: "0:41", author: "1분요리왕 통키", creatorName: "1분요리왕 통키", bookmarks: 11230 },
      { id: "Z-jh4Fkqig4", title: "[⭐️380만⭐️]  고구마순 1년 보관하는 법", thumbnail: "https://i.ytimg.com/vi/Z-jh4Fkqig4/maxresdefault.jpg", duration: "0:31", author: "1분요리왕 통키", creatorName: "1분요리왕 통키", bookmarks: 9310 },
      { id: "Jtx_D3KWPTs", title: "[⭐️400만⭐️]  초대박 백반집 오이무침 만드는 법 #shorts 200만 유튜버 비룡님 레시피", thumbnail: "https://i.ytimg.com/vi/Jtx_D3KWPTs/maxresdefault.jpg", duration: "0:51", author: "1분요리왕 통키", creatorName: "1분요리왕 통키", bookmarks: 14983 },
      { id: "3-k5SNXcoXU", title: "[⭐️330만⭐️]  산속 밥집 고추장마늘장아찌 No 설탕!! No MSG!!", thumbnail: "https://i.ytimg.com/vi/3-k5SNXcoXU/maxresdefault.jpg", duration: "0:38", author: "1분요리왕 통키", creatorName: "1분요리왕 통키", bookmarks: 12155 },
    ],
  },
];





