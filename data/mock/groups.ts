/**
 * 그룹 관련 Mock 데이터
 */

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  thumbnail: string | null;
  lastActivity: string;
}

export interface FeedPost {
  id: string;
  type: "post";
  user: string;
  userAvatar: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  time: string;
  isLiked: boolean;
}

export interface FeedRecipe {
  id: string;
  type: "recipe";
  user: string;
  userAvatar: string;
  action: string;
  recipe: {
    id: string;
    title: string;
    thumbnail: string;
  };
  time: string;
  isLiked: boolean;
  likes: number;
}

export type FeedItem = FeedPost | FeedRecipe;

// 그룹 목록
export const MOCK_GROUPS: Group[] = [
  {
    id: "1",
    name: "우리 가족 식단",
    memberCount: 4,
    thumbnail: null,
    lastActivity: "오늘",
  },
  {
    id: "2",
    name: "자취생 요리 모임",
    memberCount: 12,
    thumbnail: null,
    lastActivity: "어제",
  },
  {
    id: "3",
    name: "다이어트 챌린지",
    memberCount: 8,
    thumbnail: null,
    lastActivity: "3일 전",
  },
];

// 그룹 피드
export const MOCK_FEEDS: FeedItem[] = [
  {
    id: "f1",
    type: "post",
    user: "엄마",
    userAvatar: "엄",
    content: "오늘 저녁은 아이들이 좋아하는 계란 볶음밥으로! 🍳 간단하지만 맛있게 완성했어요. 다들 맛있게 먹었답니다 😋",
    images: [
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600",
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600",
    ],
    likes: 12,
    comments: 3,
    time: "30분 전",
    isLiked: false,
  },
  {
    id: "f2",
    type: "recipe",
    user: "아빠",
    userAvatar: "아",
    action: "레시피북에 새 레시피를 추가했습니다",
    recipe: {
      id: "r1",
      title: "초간단 계란 볶음밥",
      thumbnail: "https://i.ytimg.com/vi/Zu6ApCCNhN0/oar2.jpg",
    },
    time: "2시간 전",
    isLiked: false,
    likes: 0,
  },
  {
    id: "f3",
    type: "post",
    user: "동생",
    userAvatar: "동",
    content: "자취 3년차의 첫 김치찌개 도전! 생각보다 잘 됐다 ㅎㅎ 이제 라면만 먹던 시절은 안녕~ 👋",
    images: [
      "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600",
    ],
    likes: 8,
    comments: 5,
    time: "5시간 전",
    isLiked: true,
  },
  {
    id: "f4",
    type: "recipe",
    user: "엄마",
    userAvatar: "엄",
    action: "레시피북에 새 레시피를 추가했습니다",
    recipe: {
      id: "r2",
      title: "연어 스테이크",
      thumbnail: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400",
    },
    time: "어제",
    isLiked: false,
    likes: 0,
  },
  {
    id: "f5",
    type: "post",
    user: "아빠",
    userAvatar: "아",
    content: "주말 브런치로 프렌치토스트 만들어봤습니다. 메이플시럽 듬뿍! 🍞🥞",
    images: [
      "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600",
      "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600",
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=600",
    ],
    likes: 15,
    comments: 7,
    time: "2일 전",
    isLiked: false,
  },
];

// 그룹 멤버
export interface GroupMember {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

export const MOCK_GROUP_MEMBERS: GroupMember[] = [
  { id: "1", name: "김철수", role: "owner", joinedAt: "2024-01-01" },
  { id: "2", name: "이영희", role: "admin", joinedAt: "2024-01-05" },
  { id: "3", name: "박민수", role: "member", joinedAt: "2024-01-10" },
  { id: "4", name: "최지은", role: "member", joinedAt: "2024-01-15" },
];
