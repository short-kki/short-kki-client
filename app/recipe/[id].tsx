import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Alert,
  Share,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Play,
  Bookmark,
  Clock,
  Users,
  ChefHat,
  CalendarPlus,
  ShoppingCart,
  Share2,
  MoreVertical,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import RecipeBookSelectModal from "@/components/RecipeBookSelectModal";
import { api } from "@/services/api"; // To call API directly


const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 더미 레시피 상세 데이터
const DUMMY_RECIPES: Record<string, typeof DEFAULT_RECIPE> = {
  "1": {
    id: "1",
    title: "초간단 계란 볶음밥",
    description: "백종원 선생님의 간단하고 맛있는 계란 볶음밥 레시피입니다. 남은 밥으로 5분 만에 뚝딱!",
    thumbnail: "https://i.ytimg.com/vi/Zu6ApCCNhN0/oar2.jpg",
    videoUrl: "https://www.youtube.com/shorts/Zu6ApCCNhN0",
    duration: "5분",
    servings: 2,
    difficulty: "쉬움",
    author: {
      name: "백종원",
      profileImage: null,
      channel: "백종원의 요리비책",
    },
    ingredients: [
      { name: "밥", amount: "2공기", required: true },
      { name: "계란", amount: "3개", required: true },
      { name: "대파", amount: "1대", required: true },
      { name: "간장", amount: "1큰술", required: true },
      { name: "참기름", amount: "1큰술", required: false },
      { name: "소금", amount: "약간", required: false },
      { name: "후추", amount: "약간", required: false },
    ],
    steps: [
      "대파는 송송 썰어 준비합니다.",
      "팬에 기름을 두르고 계란을 스크램블합니다.",
      "밥을 넣고 센 불에서 볶아줍니다.",
      "간장과 소금으로 간을 맞춥니다.",
      "대파를 넣고 참기름을 둘러 마무리합니다.",
    ],
    tags: ["#볶음밥", "#자취요리", "#5분완성", "#백종원"],
    bookmarkCount: 1523,
    isBookmarked: false,
  },
  "m1": {
    id: "m1",
    title: "귀찮은 주말아침! 영양가득한 5분 완성 '머그컵밥'",
    description: "바쁜 아침, 전자레인지만 있으면 5분 만에 뚝딱! 영양 가득한 한 끼를 만들어보세요.",
    thumbnail: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800",
    videoUrl: null,
    duration: "5분",
    servings: 1,
    difficulty: "쉬움",
    author: {
      name: "요리하는 민지",
      profileImage: null,
      channel: "민지의 간편요리",
    },
    ingredients: [
      { name: "밥", amount: "1공기", required: true },
      { name: "계란", amount: "1개", required: true },
      { name: "치즈", amount: "1장", required: true },
      { name: "김치", amount: "2큰술", required: false },
      { name: "참기름", amount: "1작은술", required: false },
      { name: "깨", amount: "약간", required: false },
    ],
    steps: [
      "머그컵에 밥을 담고 가운데를 움푹 파줍니다.",
      "움푹 판 곳에 계란을 깨서 넣어주세요.",
      "김치와 치즈를 올려줍니다.",
      "전자레인지에 2분 30초 돌려주세요.",
      "참기름과 깨를 뿌려 완성!",
    ],
    tags: ["#머그컵밥", "#전자레인지", "#5분완성", "#자취요리"],
    bookmarkCount: 892,
    isBookmarked: false,
  },
  "m2": {
    id: "m2",
    title: "Instant Pot Chicken Pot Pie Casserole",
    description: "크리미한 치킨 팟파이를 인스턴트팟으로 간편하게! 온 가족이 좋아하는 든든한 한 끼.",
    thumbnail: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800",
    videoUrl: null,
    duration: "25분",
    servings: 4,
    difficulty: "보통",
    author: {
      name: "Chef John",
      profileImage: null,
      channel: "Food Wishes",
    },
    ingredients: [
      { name: "닭가슴살", amount: "400g", required: true },
      { name: "감자", amount: "2개", required: true },
      { name: "당근", amount: "1개", required: true },
      { name: "양파", amount: "1개", required: true },
      { name: "생크림", amount: "200ml", required: true },
      { name: "치킨스톡", amount: "1컵", required: true },
      { name: "버터", amount: "2큰술", required: false },
      { name: "밀가루", amount: "2큰술", required: false },
    ],
    steps: [
      "닭가슴살과 야채를 한입 크기로 썰어주세요.",
      "인스턴트팟에 버터를 녹이고 양파를 볶습니다.",
      "닭가슴살을 넣고 겉면이 익을 때까지 볶아주세요.",
      "밀가루를 넣고 1분간 볶은 후 치킨스톡을 붓습니다.",
      "감자, 당근을 넣고 압력 모드로 10분 조리합니다.",
      "생크림을 넣고 잘 섞어 완성!",
    ],
    tags: ["#인스턴트팟", "#치킨", "#캐서롤", "#양식"],
    bookmarkCount: 2341,
    isBookmarked: false,
  },
  "m3": {
    id: "m3",
    title: "바삭바삭 통닭구이",
    description: "에어프라이어로 만드는 겉바속촉 통닭구이! 기름 없이도 바삭하게.",
    thumbnail: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800",
    videoUrl: null,
    duration: "40분",
    servings: 3,
    difficulty: "보통",
    author: {
      name: "백종원",
      profileImage: null,
      channel: "백종원의 요리비책",
    },
    ingredients: [
      { name: "닭", amount: "1마리", required: true },
      { name: "소금", amount: "1큰술", required: true },
      { name: "후추", amount: "약간", required: true },
      { name: "올리브오일", amount: "2큰술", required: true },
      { name: "마늘", amount: "5쪽", required: false },
      { name: "로즈마리", amount: "2줄기", required: false },
    ],
    steps: [
      "닭을 깨끗이 씻고 물기를 제거합니다.",
      "소금, 후추, 올리브오일로 마리네이드합니다.",
      "마늘과 로즈마리를 닭 속에 넣어주세요.",
      "에어프라이어 180도에서 20분 조리합니다.",
      "뒤집어서 200도에서 15분 더 구워주세요.",
    ],
    tags: ["#통닭", "#에어프라이어", "#로스트치킨"],
    bookmarkCount: 3102,
    isBookmarked: true,
  },
  "m4": {
    id: "m4",
    title: "연어 아보카도 포케볼",
    description: "하와이안 스타일 건강한 포케볼! 신선한 연어와 아보카도의 조화.",
    thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    videoUrl: null,
    duration: "15분",
    servings: 1,
    difficulty: "쉬움",
    author: {
      name: "헬시쿡",
      profileImage: null,
      channel: "건강한 한끼",
    },
    ingredients: [
      { name: "연어회", amount: "100g", required: true },
      { name: "아보카도", amount: "반개", required: true },
      { name: "밥", amount: "1공기", required: true },
      { name: "간장", amount: "1큰술", required: true },
      { name: "참기름", amount: "1작은술", required: true },
      { name: "깨", amount: "약간", required: false },
      { name: "김가루", amount: "약간", required: false },
    ],
    steps: [
      "연어를 한입 크기로 썰어 간장, 참기름에 재워둡니다.",
      "아보카도는 슬라이스합니다.",
      "그릇에 밥을 담습니다.",
      "연어와 아보카도를 예쁘게 올립니다.",
      "깨와 김가루를 뿌려 완성!",
    ],
    tags: ["#포케볼", "#연어", "#다이어트", "#건강식"],
    bookmarkCount: 1876,
    isBookmarked: false,
  },
  "m5": {
    id: "m5",
    title: "크림 파스타",
    description: "진한 크림소스의 부드러운 파스타. 집에서도 레스토랑 맛을 낼 수 있어요!",
    thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
    videoUrl: null,
    duration: "20분",
    servings: 2,
    difficulty: "보통",
    author: {
      name: "파스타장인",
      profileImage: null,
      channel: "이탈리안 키친",
    },
    ingredients: [
      { name: "스파게티면", amount: "200g", required: true },
      { name: "생크림", amount: "200ml", required: true },
      { name: "베이컨", amount: "100g", required: true },
      { name: "마늘", amount: "3쪽", required: true },
      { name: "파마산치즈", amount: "3큰술", required: true },
      { name: "버터", amount: "1큰술", required: false },
      { name: "소금", amount: "약간", required: false },
    ],
    steps: [
      "파스타면을 삶아주세요.",
      "팬에 버터를 녹이고 베이컨을 볶습니다.",
      "마늘을 넣고 향이 날 때까지 볶아주세요.",
      "생크림을 넣고 약불에서 끓입니다.",
      "삶은 면을 넣고 치즈를 뿌려 완성!",
    ],
    tags: ["#크림파스타", "#양식", "#베이컨", "#파스타"],
    bookmarkCount: 2567,
    isBookmarked: false,
  },
  "m6": {
    id: "m6",
    title: "간단 김치볶음밥",
    description: "자취생 필수 레시피! 묵은지로 만드는 고소한 김치볶음밥.",
    thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
    videoUrl: null,
    duration: "10분",
    servings: 1,
    difficulty: "쉬움",
    author: {
      name: "자취요리왕",
      profileImage: null,
      channel: "혼밥 레시피",
    },
    ingredients: [
      { name: "밥", amount: "1공기", required: true },
      { name: "김치", amount: "1컵", required: true },
      { name: "계란", amount: "1개", required: true },
      { name: "참기름", amount: "1큰술", required: true },
      { name: "고춧가루", amount: "약간", required: false },
      { name: "김가루", amount: "약간", required: false },
    ],
    steps: [
      "김치를 잘게 썰어주세요.",
      "팬에 기름을 두르고 김치를 볶습니다.",
      "밥을 넣고 센 불에서 볶아주세요.",
      "계란 프라이를 올립니다.",
      "참기름과 김가루를 뿌려 완성!",
    ],
    tags: ["#김치볶음밥", "#자취요리", "#10분완성", "#한식"],
    bookmarkCount: 4521,
    isBookmarked: true,
  },
  "m7": {
    id: "m7",
    title: "된장찌개",
    description: "구수한 된장찌개 황금레시피! 깊은 맛의 비결을 알려드려요.",
    thumbnail: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800",
    videoUrl: null,
    duration: "30분",
    servings: 2,
    difficulty: "쉬움",
    author: {
      name: "한식마스터",
      profileImage: null,
      channel: "전통 한식",
    },
    ingredients: [
      { name: "된장", amount: "2큰술", required: true },
      { name: "두부", amount: "반모", required: true },
      { name: "애호박", amount: "반개", required: true },
      { name: "양파", amount: "반개", required: true },
      { name: "청양고추", amount: "1개", required: false },
      { name: "대파", amount: "약간", required: false },
      { name: "다진마늘", amount: "1작은술", required: true },
    ],
    steps: [
      "멸치다시마 육수를 우려냅니다.",
      "된장을 풀어 끓여주세요.",
      "두부와 야채를 넣습니다.",
      "다진마늘을 넣고 한소끔 끓입니다.",
      "대파를 올려 완성!",
    ],
    tags: ["#된장찌개", "#한식", "#집밥", "#찌개"],
    bookmarkCount: 3890,
    isBookmarked: false,
  },
};

// 홈 화면 큐레이션 레시피들
const HOME_RECIPES: Record<string, typeof DEFAULT_RECIPE> = {
  // 지금 인기 급상승
  "t1": {
    id: "t1",
    title: "마약계란장",
    description: "한번 먹으면 멈출 수 없는 마약계란장! 밥도둑 반찬으로 최고예요.",
    thumbnail: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800",
    videoUrl: null,
    duration: "10분",
    servings: 4,
    difficulty: "쉬움",
    author: { name: "요리왕", profileImage: null, channel: "요리왕TV" },
    ingredients: [
      { name: "계란", amount: "6개", required: true },
      { name: "간장", amount: "1컵", required: true },
      { name: "물", amount: "1컵", required: true },
      { name: "설탕", amount: "3큰술", required: true },
      { name: "청양고추", amount: "2개", required: false },
      { name: "대파", amount: "1대", required: false },
    ],
    steps: [
      "계란을 삶아 껍질을 벗깁니다.",
      "간장, 물, 설탕을 섞어 양념장을 만듭니다.",
      "청양고추와 대파를 썰어 넣습니다.",
      "삶은 계란을 양념장에 담급니다.",
      "냉장고에서 하루 숙성시키면 완성!",
    ],
    tags: ["#마약계란장", "#밥도둑", "#반찬", "#계란요리"],
    bookmarkCount: 5234,
    isBookmarked: false,
  },
  "t2": {
    id: "t2",
    title: "크림파스타",
    description: "진한 크림소스의 부드러운 파스타. 집에서도 레스토랑 맛!",
    thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800",
    videoUrl: null,
    duration: "20분",
    servings: 2,
    difficulty: "보통",
    author: { name: "파스타킹", profileImage: null, channel: "파스타킹" },
    ingredients: [
      { name: "스파게티면", amount: "200g", required: true },
      { name: "생크림", amount: "200ml", required: true },
      { name: "베이컨", amount: "100g", required: true },
      { name: "마늘", amount: "3쪽", required: true },
      { name: "파마산치즈", amount: "3큰술", required: true },
    ],
    steps: [
      "파스타면을 삶아주세요.",
      "팬에 베이컨을 볶습니다.",
      "마늘을 넣고 향이 날 때까지 볶아주세요.",
      "생크림을 넣고 끓입니다.",
      "삶은 면과 치즈를 넣어 완성!",
    ],
    tags: ["#크림파스타", "#양식", "#파스타"],
    bookmarkCount: 3892,
    isBookmarked: false,
  },
  "t3": {
    id: "t3",
    title: "김치볶음밥",
    description: "자취생 필수 레시피! 묵은지로 만드는 고소한 김치볶음밥.",
    thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800",
    videoUrl: null,
    duration: "10분",
    servings: 1,
    difficulty: "쉬움",
    author: { name: "백종원", profileImage: null, channel: "백종원의 요리비책" },
    ingredients: [
      { name: "밥", amount: "1공기", required: true },
      { name: "김치", amount: "1컵", required: true },
      { name: "계란", amount: "1개", required: true },
      { name: "참기름", amount: "1큰술", required: true },
    ],
    steps: [
      "김치를 잘게 썰어주세요.",
      "팬에 김치를 볶습니다.",
      "밥을 넣고 볶아주세요.",
      "계란 프라이를 올려 완성!",
    ],
    tags: ["#김치볶음밥", "#자취요리", "#한식"],
    bookmarkCount: 4521,
    isBookmarked: true,
  },
  "t4": {
    id: "t4",
    title: "된장찌개",
    description: "구수한 된장찌개 황금레시피!",
    thumbnail: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800",
    videoUrl: null,
    duration: "25분",
    servings: 2,
    difficulty: "쉬움",
    author: { name: "집밥선생", profileImage: null, channel: "집밥선생" },
    ingredients: [
      { name: "된장", amount: "2큰술", required: true },
      { name: "두부", amount: "반모", required: true },
      { name: "애호박", amount: "반개", required: true },
      { name: "양파", amount: "반개", required: true },
    ],
    steps: [
      "육수를 끓입니다.",
      "된장을 풀어주세요.",
      "야채와 두부를 넣습니다.",
      "한소끔 끓여 완성!",
    ],
    tags: ["#된장찌개", "#한식", "#찌개"],
    bookmarkCount: 3102,
    isBookmarked: false,
  },
  // 5분 안에 뚝딱
  "q1": {
    id: "q1",
    title: "계란후라이 덮밥",
    description: "간단하지만 맛있는 계란후라이 덮밥!",
    thumbnail: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800",
    videoUrl: null,
    duration: "5분",
    servings: 1,
    difficulty: "쉬움",
    author: { name: "간편요리", profileImage: null, channel: "간편요리" },
    ingredients: [
      { name: "밥", amount: "1공기", required: true },
      { name: "계란", amount: "2개", required: true },
      { name: "간장", amount: "1큰술", required: true },
      { name: "참기름", amount: "약간", required: false },
    ],
    steps: [
      "계란후라이를 만듭니다.",
      "밥 위에 올립니다.",
      "간장과 참기름을 뿌려 완성!",
    ],
    tags: ["#계란덮밥", "#5분요리", "#간편식"],
    bookmarkCount: 2341,
    isBookmarked: false,
  },
  "q2": {
    id: "q2",
    title: "참치마요 주먹밥",
    description: "도시락으로 딱! 맛있는 참치마요 주먹밥.",
    thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    videoUrl: null,
    duration: "5분",
    servings: 2,
    difficulty: "쉬움",
    author: { name: "도시락왕", profileImage: null, channel: "도시락왕" },
    ingredients: [
      { name: "밥", amount: "1공기", required: true },
      { name: "참치캔", amount: "1개", required: true },
      { name: "마요네즈", amount: "2큰술", required: true },
      { name: "김", amount: "2장", required: false },
    ],
    steps: [
      "참치의 기름을 빼고 마요네즈와 섞습니다.",
      "밥과 섞어주세요.",
      "주먹밥 모양으로 만듭니다.",
      "김으로 감싸 완성!",
    ],
    tags: ["#주먹밥", "#도시락", "#참치마요"],
    bookmarkCount: 1892,
    isBookmarked: false,
  },
  "q3": {
    id: "q3",
    title: "토스트 샌드위치",
    description: "아침 식사로 딱! 간단 토스트 샌드위치.",
    thumbnail: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800",
    videoUrl: null,
    duration: "5분",
    servings: 1,
    difficulty: "쉬움",
    author: { name: "아침식사", profileImage: null, channel: "아침식사" },
    ingredients: [
      { name: "식빵", amount: "2장", required: true },
      { name: "계란", amount: "1개", required: true },
      { name: "치즈", amount: "1장", required: true },
      { name: "버터", amount: "약간", required: false },
    ],
    steps: [
      "식빵을 토스트합니다.",
      "계란 프라이를 만듭니다.",
      "치즈와 계란을 올려 완성!",
    ],
    tags: ["#토스트", "#아침식사", "#샌드위치"],
    bookmarkCount: 1543,
    isBookmarked: false,
  },
  "q4": {
    id: "q4",
    title: "컵라면 업그레이드",
    description: "컵라면을 더 맛있게! 업그레이드 레시피.",
    thumbnail: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
    videoUrl: null,
    duration: "5분",
    servings: 1,
    difficulty: "쉬움",
    author: { name: "라면마스터", profileImage: null, channel: "라면마스터" },
    ingredients: [
      { name: "컵라면", amount: "1개", required: true },
      { name: "계란", amount: "1개", required: false },
      { name: "파", amount: "약간", required: false },
      { name: "치즈", amount: "1장", required: false },
    ],
    steps: [
      "컵라면에 뜨거운 물을 붓습니다.",
      "계란을 넣어주세요.",
      "치즈를 올려 완성!",
    ],
    tags: ["#컵라면", "#라면", "#간편식"],
    bookmarkCount: 987,
    isBookmarked: false,
  },
  // 자취생 필수 레시피
  "s1": {
    id: "s1",
    title: "원팬 파스타",
    description: "팬 하나로 완성! 설거지 걱정 없는 파스타.",
    thumbnail: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800",
    videoUrl: null,
    duration: "15분",
    servings: 1,
    difficulty: "쉬움",
    author: { name: "자취생", profileImage: null, channel: "자취생요리" },
    ingredients: [
      { name: "스파게티면", amount: "100g", required: true },
      { name: "베이컨", amount: "50g", required: true },
      { name: "마늘", amount: "2쪽", required: true },
      { name: "올리브오일", amount: "2큰술", required: true },
    ],
    steps: [
      "팬에 물과 면을 넣고 끓입니다.",
      "베이컨과 마늘을 넣습니다.",
      "물이 줄어들면 올리브오일을 넣어 완성!",
    ],
    tags: ["#원팬파스타", "#자취요리", "#간편식"],
    bookmarkCount: 3456,
    isBookmarked: false,
  },
  "s2": {
    id: "s2",
    title: "간장계란밥",
    description: "간단하지만 진리! 간장계란밥.",
    thumbnail: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800",
    videoUrl: null,
    duration: "5분",
    servings: 1,
    difficulty: "쉬움",
    author: { name: "혼밥러", profileImage: null, channel: "혼밥러" },
    ingredients: [
      { name: "밥", amount: "1공기", required: true },
      { name: "계란", amount: "1개", required: true },
      { name: "간장", amount: "1큰술", required: true },
      { name: "참기름", amount: "1작은술", required: true },
    ],
    steps: [
      "밥에 계란을 올립니다.",
      "간장과 참기름을 뿌립니다.",
      "잘 비벼 완성!",
    ],
    tags: ["#간장계란밥", "#자취요리", "#혼밥"],
    bookmarkCount: 5678,
    isBookmarked: true,
  },
  "s3": {
    id: "s3",
    title: "참치김치찌개",
    description: "참치캔으로 간단하게 만드는 김치찌개.",
    thumbnail: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800",
    videoUrl: null,
    duration: "15분",
    servings: 2,
    difficulty: "쉬움",
    author: { name: "자취요리", profileImage: null, channel: "자취요리" },
    ingredients: [
      { name: "김치", amount: "1컵", required: true },
      { name: "참치캔", amount: "1개", required: true },
      { name: "두부", amount: "반모", required: true },
      { name: "대파", amount: "약간", required: false },
    ],
    steps: [
      "냄비에 김치를 볶습니다.",
      "물과 참치를 넣고 끓입니다.",
      "두부를 넣어 완성!",
    ],
    tags: ["#참치김치찌개", "#자취요리", "#찌개"],
    bookmarkCount: 2345,
    isBookmarked: false,
  },
  "s4": {
    id: "s4",
    title: "스팸마요덮밥",
    description: "스팸과 마요네즈의 환상 조합!",
    thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    videoUrl: null,
    duration: "10분",
    servings: 1,
    difficulty: "쉬움",
    author: { name: "덮밥맛집", profileImage: null, channel: "덮밥맛집" },
    ingredients: [
      { name: "밥", amount: "1공기", required: true },
      { name: "스팸", amount: "반캔", required: true },
      { name: "마요네즈", amount: "2큰술", required: true },
      { name: "계란", amount: "1개", required: false },
    ],
    steps: [
      "스팸을 구워주세요.",
      "밥 위에 스팸을 올립니다.",
      "마요네즈를 뿌려 완성!",
    ],
    tags: ["#스팸덮밥", "#덮밥", "#자취요리"],
    bookmarkCount: 1876,
    isBookmarked: false,
  },
  // 건강한 한 끼
  "hl1": {
    id: "hl1",
    title: "닭가슴살 샐러드",
    description: "다이어트에 딱! 건강한 닭가슴살 샐러드.",
    thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    videoUrl: null,
    duration: "10분",
    servings: 1,
    difficulty: "쉬움",
    author: { name: "헬시쿡", profileImage: null, channel: "헬시쿡" },
    ingredients: [
      { name: "닭가슴살", amount: "100g", required: true },
      { name: "샐러드 채소", amount: "한줌", required: true },
      { name: "방울토마토", amount: "5개", required: true },
      { name: "드레싱", amount: "적당량", required: true },
    ],
    steps: [
      "닭가슴살을 삶아 찢어줍니다.",
      "채소를 씻어 준비합니다.",
      "모든 재료를 섞어 드레싱을 뿌려 완성!",
    ],
    tags: ["#샐러드", "#다이어트", "#건강식"],
    bookmarkCount: 2987,
    isBookmarked: false,
  },
  "hl2": {
    id: "hl2",
    title: "연어 포케볼",
    description: "하와이안 스타일 건강한 포케볼!",
    thumbnail: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
    videoUrl: null,
    duration: "15분",
    servings: 1,
    difficulty: "쉬움",
    author: { name: "다이어터", profileImage: null, channel: "다이어터" },
    ingredients: [
      { name: "연어회", amount: "100g", required: true },
      { name: "밥", amount: "1공기", required: true },
      { name: "아보카도", amount: "반개", required: true },
      { name: "간장", amount: "1큰술", required: true },
    ],
    steps: [
      "연어를 한입 크기로 자릅니다.",
      "밥 위에 재료를 올립니다.",
      "간장을 뿌려 완성!",
    ],
    tags: ["#포케볼", "#연어", "#건강식"],
    bookmarkCount: 1876,
    isBookmarked: false,
  },
  "hl3": {
    id: "hl3",
    title: "두부 스테이크",
    description: "단백질 가득! 두부 스테이크.",
    thumbnail: "https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=800",
    videoUrl: null,
    duration: "20분",
    servings: 2,
    difficulty: "보통",
    author: { name: "비건요리", profileImage: null, channel: "비건요리" },
    ingredients: [
      { name: "두부", amount: "1모", required: true },
      { name: "간장", amount: "2큰술", required: true },
      { name: "올리브오일", amount: "2큰술", required: true },
      { name: "마늘", amount: "2쪽", required: false },
    ],
    steps: [
      "두부를 도톰하게 썹니다.",
      "팬에 두부를 구워주세요.",
      "간장 소스를 뿌려 완성!",
    ],
    tags: ["#두부스테이크", "#비건", "#건강식"],
    bookmarkCount: 1234,
    isBookmarked: false,
  },
  "hl4": {
    id: "hl4",
    title: "오트밀 죽",
    description: "아침 식사로 딱! 건강한 오트밀 죽.",
    thumbnail: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800",
    videoUrl: null,
    duration: "10분",
    servings: 1,
    difficulty: "쉬움",
    author: { name: "아침메뉴", profileImage: null, channel: "아침메뉴" },
    ingredients: [
      { name: "오트밀", amount: "반컵", required: true },
      { name: "우유", amount: "1컵", required: true },
      { name: "꿀", amount: "1큰술", required: false },
      { name: "과일", amount: "적당량", required: false },
    ],
    steps: [
      "오트밀과 우유를 냄비에 넣습니다.",
      "약불에서 저어가며 끓입니다.",
      "꿀과 과일을 올려 완성!",
    ],
    tags: ["#오트밀", "#아침식사", "#건강식"],
    bookmarkCount: 987,
    isBookmarked: false,
  },
  // 주말 브런치
  "w1": {
    id: "w1",
    title: "프렌치 토스트",
    description: "달콤한 주말 아침! 프렌치 토스트.",
    thumbnail: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800",
    videoUrl: null,
    duration: "15분",
    servings: 2,
    difficulty: "쉬움",
    author: { name: "브런치카페", profileImage: null, channel: "브런치카페" },
    ingredients: [
      { name: "식빵", amount: "4장", required: true },
      { name: "계란", amount: "2개", required: true },
      { name: "우유", amount: "반컵", required: true },
      { name: "버터", amount: "1큰술", required: true },
      { name: "메이플시럽", amount: "적당량", required: false },
    ],
    steps: [
      "계란과 우유를 섞어 반죽을 만듭니다.",
      "식빵을 반죽에 담급니다.",
      "팬에 버터를 두르고 노릇하게 구워 완성!",
    ],
    tags: ["#프렌치토스트", "#브런치", "#주말요리"],
    bookmarkCount: 2345,
    isBookmarked: false,
  },
  "w2": {
    id: "w2",
    title: "에그 베네딕트",
    description: "호텔 브런치의 대표 메뉴! 에그 베네딕트.",
    thumbnail: "https://images.unsplash.com/photo-1608039829572-9b8d0041a899?w=800",
    videoUrl: null,
    duration: "25분",
    servings: 2,
    difficulty: "어려움",
    author: { name: "호텔셰프", profileImage: null, channel: "호텔셰프" },
    ingredients: [
      { name: "잉글리시머핀", amount: "2개", required: true },
      { name: "계란", amount: "2개", required: true },
      { name: "베이컨", amount: "4장", required: true },
      { name: "홀란다이즈소스", amount: "적당량", required: true },
    ],
    steps: [
      "머핀을 구워주세요.",
      "수란을 만듭니다.",
      "베이컨을 구워 올리고 소스를 뿌려 완성!",
    ],
    tags: ["#에그베네딕트", "#브런치", "#호텔요리"],
    bookmarkCount: 1567,
    isBookmarked: false,
  },
  "w3": {
    id: "w3",
    title: "팬케이크",
    description: "푹신푹신 달콤한 팬케이크!",
    thumbnail: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
    videoUrl: null,
    duration: "20분",
    servings: 2,
    difficulty: "보통",
    author: { name: "디저트왕", profileImage: null, channel: "디저트왕" },
    ingredients: [
      { name: "팬케이크믹스", amount: "200g", required: true },
      { name: "우유", amount: "150ml", required: true },
      { name: "계란", amount: "1개", required: true },
      { name: "버터", amount: "약간", required: true },
    ],
    steps: [
      "팬케이크 반죽을 만듭니다.",
      "팬에 반죽을 부어 굽습니다.",
      "시럽을 뿌려 완성!",
    ],
    tags: ["#팬케이크", "#브런치", "#디저트"],
    bookmarkCount: 2876,
    isBookmarked: false,
  },
  "w4": {
    id: "w4",
    title: "아보카도 토스트",
    description: "건강하고 맛있는 아보카도 토스트!",
    thumbnail: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800",
    videoUrl: null,
    duration: "10분",
    servings: 1,
    difficulty: "쉬움",
    author: { name: "건강식단", profileImage: null, channel: "건강식단" },
    ingredients: [
      { name: "식빵", amount: "2장", required: true },
      { name: "아보카도", amount: "1개", required: true },
      { name: "레몬즙", amount: "약간", required: true },
      { name: "소금", amount: "약간", required: true },
    ],
    steps: [
      "식빵을 토스트합니다.",
      "아보카도를 으깨 레몬즙을 섞습니다.",
      "토스트 위에 올려 완성!",
    ],
    tags: ["#아보카도토스트", "#브런치", "#건강식"],
    bookmarkCount: 1987,
    isBookmarked: false,
  },
};

const DEFAULT_RECIPE = {
  id: "default",
  title: "레시피를 찾을 수 없습니다",
  description: "요청하신 레시피 정보를 찾을 수 없습니다.",
  thumbnail: "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800",
  videoUrl: null,
  duration: "0분",
  servings: 1,
  difficulty: "쉬움",
  author: {
    name: "숏끼",
    profileImage: null,
    channel: "숏끼",
  },
  ingredients: [] as { name: string; amount: string; required: boolean }[],
  steps: [] as string[],
  tags: [] as string[],
  bookmarkCount: 0,
  isBookmarked: false,
};

export default function RecipeDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // 모든 레시피 데이터 통합
  const ALL_RECIPES = { ...DUMMY_RECIPES, ...HOME_RECIPES };
  const recipeData = ALL_RECIPES[id || ""] || DEFAULT_RECIPE;
  const [recipe, setRecipe] = useState(recipeData);
  const [servings, setServings] = useState(recipeData.servings);

  // id가 변경되면 레시피 데이터 업데이트
  useEffect(() => {
    const newRecipe = ALL_RECIPES[id || ""] || DEFAULT_RECIPE;
    setRecipe(newRecipe);
    setServings(newRecipe.servings);
  }, [id]);

  const toggleBookmark = () => {
    setRecipe((prev) => ({
      ...prev,
      isBookmarked: !prev.isBookmarked,
      bookmarkCount: prev.isBookmarked
        ? prev.bookmarkCount - 1
        : prev.bookmarkCount + 1,
    }));
  };

  const adjustServings = (delta: number) => {
    const newServings = Math.max(1, servings + delta);
    setServings(newServings);
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  // 재료 양 조절 (인분 기준)
  const getAdjustedAmount = (amount: string) => {
    const ratio = servings / recipe.servings;
    const match = amount.match(/^([\d.]+)(.*)$/);
    if (match) {
      const num = parseFloat(match[1]) * ratio;
      const unit = match[2];
      return `${num % 1 === 0 ? num : num.toFixed(1)}${unit}`;
    }
    return amount;
  };

  const [showBookSelectModal, setShowBookSelectModal] = useState(false);
  // We need a hook to add to *generic* book. Actually addRecipe takes recipeId.
  // The API is POST /api/v1/recipebooks/{bookId}/recipes. 
  // It's better to implement addToBook function in the modal onSelect callback directly using api service 
  // OR export a helper from useRecipes.

  // Re-checking useRecipes.ts: addRecipe is inside useRecipeBookDetail(bookId).
  // I should probably just call the API directly here or make a new hook.
  // But wait, useRecipeBookDetail is for a specific book.

  // Let's use simple API call for now or reuse addRecipe logic.
  // Actually, RecipeBookSelectModal only returns bookId. I need to call the API.

  // Let's add the state first.

  const handleAddToRecipeBook = () => {
    setShowBookSelectModal(true);
  };

  const handleAddToMealPlan = () => {
    Alert.alert(
      "식단에 추가",
      `"${recipe.title}" 레시피를 어떤 날짜에 추가할까요?`,
      [
        { text: "오늘", onPress: () => router.push("/(tabs)/meal-plan") },
        { text: "내일", onPress: () => router.push("/(tabs)/meal-plan") },
        { text: "직접 선택", onPress: () => router.push("/(tabs)/meal-plan") },
        { text: "취소", style: "cancel" },
      ]
    );
  };

  const handleShoppingList = () => {
    Alert.alert(
      "장보기 목록에 추가",
      `${recipe.ingredients.length}개의 재료가 장보기 목록에 추가되었습니다.`,
      [{ text: "확인" }]
    );
  };

  const handleMoreOptions = async () => {
    Alert.alert(
      recipe.title,
      "어떤 작업을 하시겠어요?",
      [
        {
          text: "공유하기",
          onPress: async () => {
            try {
              await Share.share({
                message: `숏끼에서 "${recipe.title}" 레시피를 확인해보세요!`,
              });
            } catch (e) {
              console.log(e);
            }
          },
        },
        { text: "신고하기", onPress: () => Alert.alert("신고", "신고가 접수되었습니다.") },
        { text: "취소", style: "cancel" },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral[50] }}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section - Thumbnail */}
        <View style={{ position: "relative" }}>
          <Image
            source={{ uri: recipe.thumbnail }}
            style={{
              width: SCREEN_WIDTH,
              height: SCREEN_WIDTH * 0.75,
            }}
            contentFit="cover"
          />

          {/* Gradient Overlay */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 100,
              backgroundColor: "rgba(0,0,0,0.3)",
            }}
          />

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: insets.top + 8,
              left: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </Pressable>

          {/* More Button */}
          <TouchableOpacity
            onPress={handleMoreOptions}
            activeOpacity={0.8}
            style={{
              position: "absolute",
              top: insets.top + 8,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MoreVertical size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Play Button */}
          <Pressable
            onPress={() => router.push("/(tabs)/shorts")}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: [{ translateX: -32 }, { translateY: -32 }],
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
          </Pressable>

          {/* Duration Badge */}
          <View
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              backgroundColor: "rgba(0,0,0,0.7)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Clock size={14} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600", marginLeft: 4 }}>
              {recipe.duration}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={{ padding: Spacing.xl }}>
          {/* Title & Bookmark */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, marginRight: Spacing.md }}>
              <Text
                style={{
                  fontSize: Typography.fontSize["2xl"],
                  fontWeight: Typography.fontWeight.bold,
                  color: Colors.neutral[900],
                  lineHeight: 32,
                }}
              >
                {recipe.title}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: Spacing.sm }}>
                <View
                  style={{
                    backgroundColor: Colors.primary[100],
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                  }}
                >
                  <Text style={{ color: Colors.primary[600], fontSize: 12, fontWeight: "600" }}>
                    {recipe.difficulty}
                  </Text>
                </View>
              </View>
            </View>
            <Pressable onPress={toggleBookmark} style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: recipe.isBookmarked ? Colors.primary[50] : Colors.neutral[100],
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Bookmark
                  size={24}
                  color={recipe.isBookmarked ? Colors.primary[500] : Colors.neutral[400]}
                  fill={recipe.isBookmarked ? Colors.primary[500] : "transparent"}
                />
              </View>
              <Text style={{ fontSize: 11, color: Colors.neutral[500], marginTop: 4 }}>
                {formatCount(recipe.bookmarkCount)}
              </Text>
            </Pressable>
          </View>

          {/* Description */}
          <Text
            style={{
              fontSize: Typography.fontSize.base,
              color: Colors.neutral[600],
              lineHeight: 24,
              marginTop: Spacing.md,
            }}
          >
            {recipe.description}
          </Text>

          {/* Author */}
          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: Spacing.lg,
              padding: Spacing.md,
              backgroundColor: Colors.neutral[100],
              borderRadius: BorderRadius.lg,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: Colors.neutral[300],
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: Colors.neutral[600], fontWeight: "bold", fontSize: 16 }}>
                {recipe.author.name.substring(0, 1)}
              </Text>
            </View>
            <View style={{ marginLeft: Spacing.md }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[900] }}>
                {recipe.author.name}
              </Text>
              <Text style={{ fontSize: 13, color: Colors.neutral[500], marginTop: 2 }}>
                {recipe.author.channel}
              </Text>
            </View>
          </Pressable>

          {/* Tags */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: Spacing.lg }}>
            {recipe.tags.map((tag, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: Colors.neutral[100],
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: BorderRadius.full,
                }}
              >
                <Text style={{ fontSize: 13, color: Colors.neutral[600] }}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: Colors.neutral[200], marginVertical: Spacing.xl }} />

          {/* Ingredients Section */}
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.neutral[900] }}>
                재료
              </Text>
              {/* Servings Adjuster */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Pressable
                  onPress={() => adjustServings(-1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Colors.neutral[100],
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 18, color: Colors.neutral[600] }}>−</Text>
                </Pressable>
                <View style={{ flexDirection: "row", alignItems: "center", marginHorizontal: Spacing.sm }}>
                  <Users size={16} color={Colors.neutral[500]} />
                  <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.neutral[700], marginLeft: 4 }}>
                    {servings}인분
                  </Text>
                </View>
                <Pressable
                  onPress={() => adjustServings(1)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: Colors.neutral[100],
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 18, color: Colors.neutral[600] }}>+</Text>
                </Pressable>
              </View>
            </View>

            {/* Ingredients List */}
            <View style={{ marginTop: Spacing.md }}>
              {recipe.ingredients.map((ingredient, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: Spacing.sm,
                    borderBottomWidth: index < recipe.ingredients.length - 1 ? 1 : 0,
                    borderBottomColor: Colors.neutral[100],
                  }}
                >
                  <Text style={{ fontSize: 15, color: Colors.neutral[800] }}>
                    {ingredient.name}
                    {!ingredient.required && (
                      <Text style={{ color: Colors.neutral[400] }}> (선택)</Text>
                    )}
                  </Text>
                  <Text style={{ fontSize: 15, color: Colors.neutral[500], fontWeight: "500" }}>
                    {getAdjustedAmount(ingredient.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: Colors.neutral[200], marginVertical: Spacing.xl }} />

          {/* Steps Section */}
          <View>
            <Text style={{ fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.neutral[900] }}>
              조리순서
            </Text>
            <View style={{ marginTop: Spacing.md }}>
              {recipe.steps.map((step, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    marginBottom: Spacing.md,
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: Colors.primary[500],
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: Spacing.md,
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 14 }}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: Colors.neutral[700],
                      lineHeight: 24,
                    }}
                  >
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Padding */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: Colors.neutral[0],
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.md,
          paddingBottom: insets.bottom + Spacing.md,
          borderTopWidth: 1,
          borderTopColor: Colors.neutral[100],
          flexDirection: "row",
          gap: Spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={handleAddToRecipeBook}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.neutral[100],
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            gap: 6,
          }}
        >
          <ChefHat size={20} color={Colors.neutral[700]} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[700] }}>
            레시피북
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAddToMealPlan}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.neutral[100],
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            gap: 6,
          }}
        >
          <CalendarPlus size={20} color={Colors.neutral[700]} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.neutral[700] }}>
            식단추가
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShoppingList}
          activeOpacity={0.8}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.primary[500],
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            gap: 6,
          }}
        >
          <ShoppingCart size={20} color="#FFFFFF" />
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
            장보기
          </Text>
        </TouchableOpacity>
      </View>

      {/* 레시피북 선택 모달 */}
      <RecipeBookSelectModal
        visible={showBookSelectModal}
        onClose={() => setShowBookSelectModal(false)}
        onSelect={async (bookId, bookName) => {
          try {
            const numericId = Number(recipe.id);
            if (isNaN(numericId)) {
              console.warn("Invalid recipe ID for API:", recipe.id);
              // Mock 모드이거나 잘못된 데이터일 경우 그냥 진행하거나 에러 처리
              // 여기서는 API 호출 시 에러가 날 것이므로 미리 차단하든지, 
              // 혹은 Mock 모드에서는 API 호출을 건너뛰도록 처리할 필요가 있음.
              // 하지만 현재는 API 호출이 필수이므로, 에러가 발생하면 catch로 넘어감.
            }

            await api.post(`/api/v1/recipebooks/${bookId}/recipes`, { recipeId: numericId });
            Alert.alert("완료", `"${bookName}"에 저장되었습니다.`);

            // 북마크 상태 업데이트 (UI 반영용)
            // 실제 데이터는 서버에서 관리되지만 즉각적인 피드백을 위해 로컬 상태 업데이트
            setRecipe(prev => ({
              ...prev,
              isBookmarked: true,
              bookmarkCount: prev.isBookmarked ? prev.bookmarkCount : prev.bookmarkCount + 1
            }));
          } catch (error: any) {
            console.error(error);
            if (error.message && error.message.includes("이미 레시피북에 추가된")) {
              Alert.alert("알림", "이미 해당 레시피북에 저장된 레시피입니다.");
            } else {
              Alert.alert("오류", "레시피 저장에 실패했습니다.");
            }
          }
        }}
        title="저장 위치"
      />
    </View >
  );
}
