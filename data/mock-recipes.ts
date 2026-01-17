export interface Recipe {
  id: string;
  title: string;
  author: {
    name: string;
    profileImage: string;
  };
  likes: number;
  tags: string[];
  backgroundColor: string;
}

export const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "3분 계란볶음밥",
    author: {
      name: "요리왕루피",
      profileImage: "https://i.pravatar.cc/100?img=1",
    },
    likes: 1243,
    tags: ["초간단", "자취요리", "한끼"],
    backgroundColor: "#4A5568",
  },
  {
    id: "2",
    title: "크림파스타 원팬 레시피",
    author: {
      name: "파스타마스터",
      profileImage: "https://i.pravatar.cc/100?img=2",
    },
    likes: 892,
    tags: ["파스타", "원팬요리", "브런치"],
    backgroundColor: "#2D3748",
  },
  {
    id: "3",
    title: "마약토스트 만들기",
    author: {
      name: "빵순이",
      profileImage: "https://i.pravatar.cc/100?img=3",
    },
    likes: 2156,
    tags: ["토스트", "간식", "달달"],
    backgroundColor: "#553C9A",
  },
  {
    id: "4",
    title: "초간단 김치찌개",
    author: {
      name: "집밥요리사",
      profileImage: "https://i.pravatar.cc/100?img=4",
    },
    likes: 3421,
    tags: ["찌개", "한식", "집밥"],
    backgroundColor: "#744210",
  },
  {
    id: "5",
    title: "10분 된장찌개",
    author: {
      name: "국물요정",
      profileImage: "https://i.pravatar.cc/100?img=5",
    },
    likes: 1567,
    tags: ["된장", "국물요리", "건강식"],
    backgroundColor: "#285E61",
  },
];
