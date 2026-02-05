import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Link as LinkIcon,
  Search,
  X,
  ChefHat,
  Clock,
  User,
  ArrowLeft,
  Globe,
  PenLine,
  Info,
  Sparkles,
  Plus,
  Trash2,
  ImagePlus,
  Users,
  Check,
  ChevronLeft,
  Camera,
  Minus,
} from "lucide-react-native";
import { uploadImage } from "@/services/fileUpload";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { recipeApi, type RecipeCreateRequest } from "@/services/recipeApi";

// ============================================================================
// TYPES
// ============================================================================

interface ParsedRecipe {
  title: string;
  thumbnail: string;
  author: string;
  duration: string;
  source: string;
}

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  id: string;
  description: string;
}

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type CuisineType = "KOREAN" | "WESTERN" | "JAPANESE" | "CHINESE" | "ASIAN" | "FUSION" | "ETC";
type MealType = "MAIN" | "SIDE_DISH" | "SNACK" | "DESSERT" | "SIDE_FOR_DRINK" | "ETC";

// ============================================================================
// CONSTANTS
// ============================================================================

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "BEGINNER", label: "초급" },
  { value: "INTERMEDIATE", label: "중급" },
  { value: "ADVANCED", label: "고급" },
];

const CUISINE_OPTIONS: { value: CuisineType; label: string }[] = [
  { value: "KOREAN", label: "한식" },
  { value: "WESTERN", label: "양식" },
  { value: "JAPANESE", label: "일식" },
  { value: "CHINESE", label: "중식" },
  { value: "ASIAN", label: "아시아" },
  { value: "FUSION", label: "퓨전" },
  { value: "ETC", label: "기타" },
];

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: "MAIN", label: "밥" },
  { value: "SIDE_DISH", label: "반찬" },
  { value: "SNACK", label: "간식" },
  { value: "DESSERT", label: "디저트" },
  { value: "SIDE_FOR_DRINK", label: "안주" },
  { value: "ETC", label: "기타" },
];

// URL에서 레시피 정보 파싱 (더미)
const parseRecipeFromUrl = async (url: string): Promise<ParsedRecipe | null> => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return {
      title: "초간단 계란 볶음밥",
      thumbnail: "https://i.ytimg.com/vi/Zu6ApCCNhN0/oar2.jpg",
      author: "백종원",
      duration: "5분",
      source: "YouTube",
    };
  }

  if (url.includes("http")) {
    return {
      title: "맛있는 파스타 레시피",
      thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
      author: "쉐프킴",
      duration: "15분",
      source: "웹사이트",
    };
  }

  return null;
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function AddRecipeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Mode State
  const [mode, setMode] = useState<"select" | "url" | "manual">("select");

  // URL Mode States
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Manual Mode States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [servings, setServings] = useState("2");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("BEGINNER");
  const [cuisineType, setCuisineType] = useState<CuisineType>("KOREAN");
  const [mealType, setMealType] = useState<MealType>("MAIN");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "1", name: "", amount: "", unit: "" },
  ]);
  const [steps, setSteps] = useState<Step[]>([{ id: "1", description: "" }]);
  const [tags, setTags] = useState("");

  // ============================================================================
  // URL Mode Handlers
  // ============================================================================

  const handleSearch = async () => {
    if (!url.trim()) {
      Alert.alert("알림", "URL을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setParsedRecipe(null);

    try {
      const result = await parseRecipeFromUrl(url);
      if (result) {
        setParsedRecipe(result);
      } else {
        Alert.alert("오류", "레시피 정보를 가져올 수 없습니다.");
      }
    } catch (error) {
      Alert.alert("오류", "레시피 정보를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSave = async () => {
    if (!parsedRecipe) return;

    setIsSaving(true);
    try {
      Alert.alert(
        "레시피 생성 중",
        "레시피가 생성되면 알림으로 알려드릴게요!",
        [
          {
            text: "확인",
            onPress: () => {
              resetAllStates();
              router.push("/(tabs)/recipe-book");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("오류", "레시피 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // Manual Mode Handlers
  // ============================================================================

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now().toString(), name: "", amount: "", unit: "" },
    ]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((ing) => ing.id !== id));
    }
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(
      ingredients.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const addStep = () => {
    setSteps([...steps, { id: Date.now().toString(), description: "" }]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter((step) => step.id !== id));
    }
  };

  const updateStep = (id: string, description: string) => {
    setSteps(steps.map((step) => (step.id === id ? { ...step, description } : step)));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setThumbnail(result.assets[0].uri);
    }
  };

  const handleManualSave = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert("알림", "레시피 이름을 입력해주세요.");
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim());
    if (validIngredients.length === 0) {
      Alert.alert("알림", "최소 1개의 재료를 입력해주세요.");
      return;
    }

    const validSteps = steps.filter((step) => step.description.trim());
    if (validSteps.length === 0) {
      Alert.alert("알림", "최소 1개의 조리 단계를 입력해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      let mainImgFileId: number | undefined;

      // 이미지 업로드
      if (thumbnail) {
        try {
          const uploadResult = await uploadImage(
            { uri: thumbnail },
            "RECIPE_IMG",
            "PUBLIC"
          );
          mainImgFileId = uploadResult.fileId;
        } catch (error) {
          console.error("Image upload failed:", error);
          Alert.alert("경고", "이미지 업로드에 실패했습니다. 이미지 없이 저장됩니다.");
        }
      }

      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const request: RecipeCreateRequest = {
        basicInfo: {
          title: title.trim(),
          description: description.trim() || undefined,
          servingSize: parseInt(servings) || 2,
          cookingTime: cookingTime ? parseInt(cookingTime) : 30,
          mainImgFileId,
        },
        categoryInfo: {
          cuisineType,
          mealType,
          difficulty,
        },
        ingredients: validIngredients.map((ing) => ({
          name: ing.name.trim(),
          unit: ing.unit.trim() || "개",
          amount: parseFloat(ing.amount) || 1,
        })),
        steps: validSteps.map((step) => ({
          description: step.description.trim(),
        })),
        recipeSource: "USER",
        tags: tagList.length > 0 ? tagList : undefined,
      };

      await recipeApi.create(request);

      Alert.alert("저장 완료", `"${title}" 레시피가 저장되었습니다.`, [
        {
          text: "확인",
          onPress: () => {
            resetAllStates();
            router.push("/(tabs)/recipe-book");
          },
        },
      ]);
    } catch (error) {
      console.error("Recipe create error:", error);
      Alert.alert("오류", "레시피 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // Common Handlers
  // ============================================================================

  const resetAllStates = () => {
    setMode("select");
    // URL states
    setUrl("");
    setParsedRecipe(null);
    // Manual states
    setTitle("");
    setDescription("");
    setCookingTime("");
    setServings("2");
    setThumbnail(null);
    setDifficulty("BEGINNER");
    setCuisineType("KOREAN");
    setMealType("MAIN");
    setIngredients([{ id: "1", name: "", amount: "", unit: "" }]);
    setSteps([{ id: "1", description: "" }]);
    setTags("");
  };

  const handleBack = () => {
    if (mode === "url" || mode === "manual") {
      resetAllStates();
    } else {
      router.back();
    }
  };

  const getHeaderTitle = () => {
    switch (mode) {
      case "url":
        return "URL로 만들기";
      case "manual":
        return "직접 작성하기";
      default:
        return "레시피 추가";
    }
  };

  // ============================================================================
  // Render Components
  // ============================================================================

  const renderChipSelector = <T extends string>(
    options: { value: T; label: string }[],
    selected: T,
    onSelect: (value: T) => void
  ) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm }}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => onSelect(option.value)}
          style={{
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            borderRadius: BorderRadius.full,
            backgroundColor:
              selected === option.value ? Colors.primary[500] : Colors.neutral[100],
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontWeight: "500",
              color: selected === option.value ? "#FFFFFF" : Colors.neutral[600],
            }}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.neutral[50] }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" />

      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: Colors.neutral[100],
            backgroundColor: Colors.neutral[0],
          }}
        >
          {(mode === "url" || mode === "manual") && (
            <TouchableOpacity
              onPress={handleBack}
              style={{ padding: 4, marginRight: Spacing.sm }}
            >
              <ArrowLeft size={24} color={Colors.neutral[900]} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: Typography.fontSize.xl,
                fontWeight: Typography.fontWeight.bold,
                color: Colors.neutral[900],
              }}
            >
              {getHeaderTitle()}
            </Text>
          </View>
          {mode === "manual" && (
            <TouchableOpacity
              onPress={handleManualSave}
              disabled={isSaving}
              style={{
                backgroundColor: Colors.primary[500],
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderRadius: BorderRadius.lg,
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: Typography.fontWeight.semiBold,
                    fontSize: Typography.fontSize.sm,
                  }}
                >
                  저장
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 100 }}
        >
          {/* ============================================================== */}
          {/* 모드 선택 화면 */}
          {/* ============================================================== */}
          {mode === "select" && (
            <View style={{ gap: Spacing.lg }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.base,
                  color: Colors.neutral[600],
                  marginBottom: Spacing.sm,
                }}
              >
                어떤 방식으로 레시피를 추가할까요?
              </Text>

              {/* URL로 만들기 */}
              <TouchableOpacity
                onPress={() => setMode("url")}
                activeOpacity={0.8}
                style={{
                  backgroundColor: Colors.neutral[0],
                  borderRadius: BorderRadius.xl,
                  padding: Spacing.xl,
                  borderWidth: 1,
                  borderColor: Colors.neutral[200],
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: Colors.primary[50],
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: Spacing.lg,
                  }}
                >
                  <Globe size={28} color={Colors.primary[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.lg,
                      fontWeight: Typography.fontWeight.semiBold,
                      color: Colors.neutral[900],
                    }}
                  >
                    URL로 만들기
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[500],
                      marginTop: 4,
                    }}
                  >
                    유튜브, 블로그 등의 URL을 입력하면{"\n"}자동으로 레시피를 추출해요
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 직접 작성하기 */}
              <TouchableOpacity
                onPress={() => setMode("manual")}
                activeOpacity={0.8}
                style={{
                  backgroundColor: Colors.neutral[0],
                  borderRadius: BorderRadius.xl,
                  padding: Spacing.xl,
                  borderWidth: 1,
                  borderColor: Colors.neutral[200],
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: Colors.secondary[50],
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: Spacing.lg,
                  }}
                >
                  <PenLine size={28} color={Colors.secondary[600]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.lg,
                      fontWeight: Typography.fontWeight.semiBold,
                      color: Colors.neutral[900],
                    }}
                  >
                    직접 작성하기
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[500],
                      marginTop: 4,
                    }}
                  >
                    나만의 레시피를 직접 입력하여{"\n"}저장할 수 있어요
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* ============================================================== */}
          {/* URL 입력 모드 */}
          {/* ============================================================== */}
          {mode === "url" && (
            <View>
              <View>
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    fontWeight: Typography.fontWeight.medium,
                    color: Colors.neutral[700],
                    marginBottom: Spacing.sm,
                  }}
                >
                  레시피 URL
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.neutral[0],
                    borderWidth: 1,
                    borderColor: Colors.neutral[200],
                    borderRadius: BorderRadius.lg,
                    paddingHorizontal: Spacing.md,
                  }}
                >
                  <LinkIcon size={20} color={Colors.neutral[400]} />
                  <TextInput
                    style={{
                      flex: 1,
                      height: 52,
                      marginLeft: Spacing.sm,
                      fontSize: Typography.fontSize.base,
                      color: Colors.neutral[900],
                    }}
                    placeholder="https://youtube.com/shorts/..."
                    placeholderTextColor={Colors.neutral[400]}
                    value={url}
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  {url.length > 0 && (
                    <Pressable onPress={() => setUrl("")} style={{ padding: 4 }}>
                      <X size={20} color={Colors.neutral[400]} />
                    </Pressable>
                  )}
                </View>

                <Pressable
                  onPress={handleSearch}
                  disabled={isLoading || !url.trim()}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                      isLoading || !url.trim() ? Colors.neutral[200] : Colors.primary[500],
                    paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.lg,
                    marginTop: Spacing.md,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Search size={20} color="#FFFFFF" />
                      <Text
                        style={{
                          fontSize: Typography.fontSize.base,
                          fontWeight: Typography.fontWeight.semiBold,
                          color: "#FFFFFF",
                          marginLeft: Spacing.sm,
                        }}
                      >
                        찾기
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              {parsedRecipe && (
                <View style={{ marginTop: Spacing.xl }}>
                  <View
                    style={{
                      backgroundColor: Colors.neutral[0],
                      borderRadius: BorderRadius.xl,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: Colors.neutral[200],
                    }}
                  >
                    <Image
                      source={{ uri: parsedRecipe.thumbnail }}
                      style={{ width: "100%", height: 220 }}
                      contentFit="cover"
                    />
                    <View style={{ padding: Spacing.lg }}>
                      <Text
                        style={{
                          fontSize: Typography.fontSize.lg,
                          fontWeight: Typography.fontWeight.bold,
                          color: Colors.neutral[900],
                        }}
                      >
                        {parsedRecipe.title}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: Spacing.md,
                          gap: Spacing.lg,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <User size={16} color={Colors.neutral[500]} />
                          <Text
                            style={{
                              fontSize: 14,
                              color: Colors.neutral[600],
                              marginLeft: 4,
                            }}
                          >
                            {parsedRecipe.author}
                          </Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Clock size={16} color={Colors.neutral[500]} />
                          <Text
                            style={{
                              fontSize: 14,
                              color: Colors.neutral[600],
                              marginLeft: 4,
                            }}
                          >
                            {parsedRecipe.duration}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    onPress={handleUrlSave}
                    disabled={isSaving}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSaving ? Colors.neutral[300] : Colors.primary[500],
                      paddingVertical: Spacing.lg,
                      borderRadius: BorderRadius.lg,
                      marginTop: Spacing.lg,
                    }}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Sparkles size={20} color="#FFFFFF" />
                        <Text
                          style={{
                            fontSize: Typography.fontSize.base,
                            fontWeight: Typography.fontWeight.bold,
                            color: "#FFFFFF",
                            marginLeft: Spacing.sm,
                          }}
                        >
                          레시피 생성하기
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}

              {!parsedRecipe && !isLoading && (
                <View style={{ marginTop: Spacing.xl }}>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[500],
                      textAlign: "center",
                    }}
                  >
                    지원하는 사이트
                  </Text>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[400],
                      textAlign: "center",
                      marginTop: Spacing.xs,
                    }}
                  >
                    YouTube, 만개의레시피, 해먹남녀 등
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ============================================================== */}
          {/* 직접 작성 모드 */}
          {/* ============================================================== */}
          {mode === "manual" && (
            <View style={{ gap: Spacing.xl }}>
              {/* 썸네일 이미지 */}
              <TouchableOpacity
                onPress={pickImage}
                style={{
                  height: 200,
                  borderRadius: BorderRadius.xl,
                  backgroundColor: Colors.neutral[100],
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                }}
              >
                {thumbnail ? (
                  <Image
                    source={{ uri: thumbnail }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <ImagePlus size={40} color={Colors.neutral[400]} />
                    <Text
                      style={{
                        marginTop: Spacing.sm,
                        color: Colors.neutral[500],
                        fontSize: Typography.fontSize.sm,
                      }}
                    >
                      사진 추가
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* 기본 정보 */}
              <View style={{ gap: Spacing.md }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.lg,
                    fontWeight: Typography.fontWeight.bold,
                    color: Colors.neutral[900],
                  }}
                >
                  기본 정보
                </Text>

                {/* 레시피 이름 */}
                <View>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      fontWeight: "500",
                      color: Colors.neutral[700],
                      marginBottom: Spacing.xs,
                    }}
                  >
                    레시피 이름 *
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: Colors.neutral[0],
                      borderWidth: 1,
                      borderColor: Colors.neutral[200],
                      borderRadius: BorderRadius.lg,
                      padding: Spacing.md,
                      fontSize: Typography.fontSize.base,
                      color: Colors.neutral[900],
                    }}
                    placeholder="예: 초간단 계란 볶음밥"
                    placeholderTextColor={Colors.neutral[400]}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                {/* 설명 */}
                <View>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      fontWeight: "500",
                      color: Colors.neutral[700],
                      marginBottom: Spacing.xs,
                    }}
                  >
                    간단한 설명
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: Colors.neutral[0],
                      borderWidth: 1,
                      borderColor: Colors.neutral[200],
                      borderRadius: BorderRadius.lg,
                      padding: Spacing.md,
                      fontSize: Typography.fontSize.base,
                      color: Colors.neutral[900],
                      height: 80,
                      textAlignVertical: "top",
                    }}
                    placeholder="레시피에 대한 간단한 설명을 입력해주세요"
                    placeholderTextColor={Colors.neutral[400]}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                </View>

                {/* 조리시간 & 인분 */}
                <View style={{ flexDirection: "row", gap: Spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        fontWeight: "500",
                        color: Colors.neutral[700],
                        marginBottom: Spacing.xs,
                      }}
                    >
                      조리시간 (분)
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: Colors.neutral[0],
                        borderWidth: 1,
                        borderColor: Colors.neutral[200],
                        borderRadius: BorderRadius.lg,
                        paddingHorizontal: Spacing.md,
                      }}
                    >
                      <Clock size={18} color={Colors.neutral[400]} />
                      <TextInput
                        style={{
                          flex: 1,
                          padding: Spacing.md,
                          fontSize: Typography.fontSize.base,
                          color: Colors.neutral[900],
                        }}
                        placeholder="30"
                        placeholderTextColor={Colors.neutral[400]}
                        value={cookingTime}
                        onChangeText={setCookingTime}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        fontWeight: "500",
                        color: Colors.neutral[700],
                        marginBottom: Spacing.xs,
                      }}
                    >
                      인분
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: Colors.neutral[0],
                        borderWidth: 1,
                        borderColor: Colors.neutral[200],
                        borderRadius: BorderRadius.lg,
                        paddingHorizontal: Spacing.md,
                      }}
                    >
                      <Users size={18} color={Colors.neutral[400]} />
                      <TextInput
                        style={{
                          flex: 1,
                          padding: Spacing.md,
                          fontSize: Typography.fontSize.base,
                          color: Colors.neutral[900],
                        }}
                        placeholder="2"
                        placeholderTextColor={Colors.neutral[400]}
                        value={servings}
                        onChangeText={setServings}
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* 카테고리 */}
              <View style={{ gap: Spacing.md }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.lg,
                    fontWeight: Typography.fontWeight.bold,
                    color: Colors.neutral[900],
                  }}
                >
                  카테고리
                </Text>

                <View>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[600],
                      marginBottom: Spacing.sm,
                    }}
                  >
                    난이도
                  </Text>
                  {renderChipSelector(DIFFICULTY_OPTIONS, difficulty, setDifficulty)}
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[600],
                      marginBottom: Spacing.sm,
                    }}
                  >
                    음식 종류
                  </Text>
                  {renderChipSelector(CUISINE_OPTIONS, cuisineType, setCuisineType)}
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: Typography.fontSize.sm,
                      color: Colors.neutral[600],
                      marginBottom: Spacing.sm,
                    }}
                  >
                    식사 유형
                  </Text>
                  {renderChipSelector(MEAL_TYPE_OPTIONS, mealType, setMealType)}
                </View>
              </View>

              {/* 재료 */}
              <View style={{ gap: Spacing.md }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: Typography.fontSize.lg,
                      fontWeight: Typography.fontWeight.bold,
                      color: Colors.neutral[900],
                    }}
                  >
                    재료 *
                  </Text>
                  <TouchableOpacity
                    onPress={addIngredient}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: Colors.primary[50],
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      borderRadius: BorderRadius.lg,
                    }}
                  >
                    <Plus size={16} color={Colors.primary[500]} />
                    <Text
                      style={{
                        marginLeft: 4,
                        color: Colors.primary[500],
                        fontWeight: "600",
                        fontSize: Typography.fontSize.sm,
                      }}
                    >
                      추가
                    </Text>
                  </TouchableOpacity>
                </View>

                {ingredients.map((ing, index) => (
                  <View
                    key={ing.id}
                    style={{
                      flexDirection: "row",
                      gap: Spacing.sm,
                      alignItems: "center",
                    }}
                  >
                    <TextInput
                      style={{
                        flex: 2,
                        backgroundColor: Colors.neutral[0],
                        borderWidth: 1,
                        borderColor: Colors.neutral[200],
                        borderRadius: BorderRadius.lg,
                        padding: Spacing.md,
                        fontSize: Typography.fontSize.sm,
                      }}
                      placeholder="재료명"
                      placeholderTextColor={Colors.neutral[400]}
                      value={ing.name}
                      onChangeText={(v) => updateIngredient(ing.id, "name", v)}
                    />
                    <TextInput
                      style={{
                        flex: 1,
                        backgroundColor: Colors.neutral[0],
                        borderWidth: 1,
                        borderColor: Colors.neutral[200],
                        borderRadius: BorderRadius.lg,
                        padding: Spacing.md,
                        fontSize: Typography.fontSize.sm,
                      }}
                      placeholder="양"
                      placeholderTextColor={Colors.neutral[400]}
                      value={ing.amount}
                      onChangeText={(v) => updateIngredient(ing.id, "amount", v)}
                      keyboardType="decimal-pad"
                    />
                    <TextInput
                      style={{
                        flex: 1,
                        backgroundColor: Colors.neutral[0],
                        borderWidth: 1,
                        borderColor: Colors.neutral[200],
                        borderRadius: BorderRadius.lg,
                        padding: Spacing.md,
                        fontSize: Typography.fontSize.sm,
                      }}
                      placeholder="단위"
                      placeholderTextColor={Colors.neutral[400]}
                      value={ing.unit}
                      onChangeText={(v) => updateIngredient(ing.id, "unit", v)}
                    />
                    {ingredients.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeIngredient(ing.id)}
                        style={{ padding: 8 }}
                      >
                        <Trash2 size={18} color={Colors.error.main} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {/* 조리 단계 */}
              <View style={{ gap: Spacing.md }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: Typography.fontSize.lg,
                      fontWeight: Typography.fontWeight.bold,
                      color: Colors.neutral[900],
                    }}
                  >
                    조리 단계 *
                  </Text>
                  <TouchableOpacity
                    onPress={addStep}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: Colors.primary[50],
                      paddingHorizontal: Spacing.md,
                      paddingVertical: Spacing.sm,
                      borderRadius: BorderRadius.lg,
                    }}
                  >
                    <Plus size={16} color={Colors.primary[500]} />
                    <Text
                      style={{
                        marginLeft: 4,
                        color: Colors.primary[500],
                        fontWeight: "600",
                        fontSize: Typography.fontSize.sm,
                      }}
                    >
                      추가
                    </Text>
                  </TouchableOpacity>
                </View>

                {steps.map((step, index) => (
                  <View key={step.id} style={{ flexDirection: "row", gap: Spacing.sm }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: Colors.primary[500],
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: Spacing.md,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontWeight: "700",
                          fontSize: Typography.fontSize.sm,
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>
                    <TextInput
                      style={{
                        flex: 1,
                        backgroundColor: Colors.neutral[0],
                        borderWidth: 1,
                        borderColor: Colors.neutral[200],
                        borderRadius: BorderRadius.lg,
                        padding: Spacing.md,
                        fontSize: Typography.fontSize.sm,
                        minHeight: 80,
                        textAlignVertical: "top",
                      }}
                      placeholder={`${index + 1}단계 설명을 입력하세요`}
                      placeholderTextColor={Colors.neutral[400]}
                      value={step.description}
                      onChangeText={(v) => updateStep(step.id, v)}
                      multiline
                    />
                    {steps.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeStep(step.id)}
                        style={{ padding: 8, marginTop: Spacing.md }}
                      >
                        <Trash2 size={18} color={Colors.error.main} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              {/* 태그 */}
              <View style={{ gap: Spacing.sm }}>
                <Text
                  style={{
                    fontSize: Typography.fontSize.lg,
                    fontWeight: Typography.fontWeight.bold,
                    color: Colors.neutral[900],
                  }}
                >
                  태그
                </Text>
                <TextInput
                  style={{
                    backgroundColor: Colors.neutral[0],
                    borderWidth: 1,
                    borderColor: Colors.neutral[200],
                    borderRadius: BorderRadius.lg,
                    padding: Spacing.md,
                    fontSize: Typography.fontSize.base,
                    color: Colors.neutral[900],
                  }}
                  placeholder="쉼표로 구분 (예: 간단요리, 한그릇, 자취생)"
                  placeholderTextColor={Colors.neutral[400]}
                  value={tags}
                  onChangeText={setTags}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
