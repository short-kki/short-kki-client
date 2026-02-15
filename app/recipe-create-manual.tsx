import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Plus,
  X,
  Clock,
  Users,
  ImagePlus,
  Trash2,
  Check,
  Search,
  ChevronRight,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/design-system";
import { recipeApi, type RecipeCreateRequest } from "@/services/recipeApi";
import { api } from "@/services/api";
import { uploadImage, type ImagePickerAsset } from "@/services/fileUpload";
import SuccessResultModal from "@/components/ui/SuccessResultModal";

// ============================================================================
// TYPES
// ============================================================================

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

// API에서 가져오는 재료 타입
interface ApiIngredient {
  id: number;
  name: string;
}

interface IngredientsApiResponse {
  ingredients: ApiIngredient[];
  total: number;
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

// ============================================================================
// COMPONENT
// ============================================================================

export default function RecipeCreateManualScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [servings, setServings] = useState("2");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailAsset, setThumbnailAsset] = useState<ImagePickerAsset | null>(null);

  // Category Info
  const [difficulty, setDifficulty] = useState<Difficulty>("BEGINNER");
  const [cuisineType, setCuisineType] = useState<CuisineType>("KOREAN");
  const [mealType, setMealType] = useState<MealType>("MAIN");

  // Ingredients & Steps
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "1", name: "", amount: "", unit: "" },
  ]);
  const [steps, setSteps] = useState<Step[]>([{ id: "1", description: "" }]);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // UI State
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
  const [savedRecipeTitle, setSavedRecipeTitle] = useState("");

  // 재료 검색 관련 State
  const [apiIngredients, setApiIngredients] = useState<ApiIngredient[]>([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(true);
  const [showIngredientSearchModal, setShowIngredientSearchModal] = useState(false);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState("");
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);

  // 재료 목록 API 호출
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setIngredientsLoading(true);
        // 인증 헤더 포함하여 요청 (문서는 불필요라고 하지만 서버에서 403 반환)
        const response = await api.get<{ data: IngredientsApiResponse }>("/api/v1/ingredients");
        setApiIngredients(response.data.ingredients);
      } catch (error) {
        console.log("재료 목록 조회 실패:", error);
      } finally {
        setIngredientsLoading(false);
      }
    };
    fetchIngredients();
  }, []);

  // 검색 필터링된 재료 목록
  const filteredIngredients = apiIngredients.filter((ing) =>
    ing.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase())
  );

  // Debug: 컴포넌트 마운트 확인
  useEffect(() => {
    console.log("🎨 RecipeCreateManualScreen 마운트됨!");
    return () => {
      console.log("🎨 RecipeCreateManualScreen 언마운트됨!");
    };
  }, []);

  // ============================================================================
  // HANDLERS - Ingredients
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

  const updateIngredient = (
    id: string,
    field: "name" | "amount" | "unit",
    value: string
  ) => {
    setIngredients(
      ingredients.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  // 재료 검색 모달 열기
  const openIngredientSearch = (ingredientId: string) => {
    setEditingIngredientId(ingredientId);
    setIngredientSearchQuery("");
    setShowIngredientSearchModal(true);
  };

  // 재료 선택
  const selectIngredient = (apiIngredient: ApiIngredient) => {
    if (editingIngredientId) {
      updateIngredient(editingIngredientId, "name", apiIngredient.name);
    }
    setShowIngredientSearchModal(false);
    setEditingIngredientId(null);
  };

  // ============================================================================
  // HANDLERS - Steps
  // ============================================================================

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

  // ============================================================================
  // HANDLERS - Tags
  // ============================================================================

  const addTag = () => {
    const trimmedTag = tagInput.trim().replace(/^#/, ""); // # 제거
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputSubmit = () => {
    addTag();
  };

  // ============================================================================
  // HANDLERS - Image
  // ============================================================================

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setThumbnail(asset.uri);
      setThumbnailAsset({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      });
    }
  };

  // ============================================================================
  // HANDLERS - Save
  // ============================================================================

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert("알림", "레시피 제목을 입력해주세요.");
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim());
    if (validIngredients.length === 0) {
      Alert.alert("알림", "최소 1개 이상의 재료를 입력해주세요.");
      return;
    }

    const validSteps = steps.filter((step) => step.description.trim());
    if (validSteps.length === 0) {
      Alert.alert("알림", "최소 1개 이상의 조리 단계를 입력해주세요.");
      return;
    }

    const cookingTimeNum = parseInt(cookingTime) || 30;
    const servingsNum = parseInt(servings) || 2;

    setIsSaving(true);

    try {
      let mainImgFileId: number | undefined;
      if (thumbnailAsset) {
        const uploadedFile = await uploadImage(thumbnailAsset, "RECIPE_IMG", "PUBLIC");
        mainImgFileId = uploadedFile.fileId;
      }

      const request: RecipeCreateRequest = {
        basicInfo: {
          title: title.trim(),
          description: description.trim() || undefined,
          servingSize: servingsNum,
          cookingTime: cookingTimeNum,
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
        tags: tags.length > 0 ? tags : undefined,
      };

      await recipeApi.create(request);
      setSavedRecipeTitle(title.trim());
      setShowSaveSuccessModal(true);
    } catch (error: any) {
      console.error("Recipe create error:", error);
      const errorMessage = error?.message?.toLowerCase() || "";

      // 중복 레시피 에러는 무시하고 성공으로 처리
      if (
        errorMessage.includes("duplicate") ||
        errorMessage.includes("중복") ||
        errorMessage.includes("already exists") ||
        errorMessage.includes("conflict") ||
        error?.message?.includes("409")
      ) {
        console.log("Duplicate recipe - treating as success");
        setSavedRecipeTitle(title.trim());
        setShowSaveSuccessModal(true);
        return;
      }

      Alert.alert("오류", "레시피 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // RENDER HELPERS
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
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md,
            borderRadius: BorderRadius.full,
            backgroundColor:
              selected === option.value ? Colors.primary[500] : Colors.neutral[100],
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontWeight: selected === option.value ? "600" : "400",
              color: selected === option.value ? "#FFF" : Colors.neutral[600],
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
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <ArrowLeft size={24} color={Colors.neutral[900]} />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: Typography.fontSize.lg,
              fontWeight: Typography.fontWeight.bold,
              color: Colors.neutral[900],
              marginRight: 28,
            }}
          >
            레시피 작성
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 썸네일 이미지 */}
          <View style={{ marginBottom: Spacing.xl }}>
            <Text style={styles.label}>대표 이미지</Text>
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.8}
              style={{
                width: "100%",
                height: 180,
                borderRadius: BorderRadius.xl,
                backgroundColor: Colors.neutral[100],
                justifyContent: "center",
                alignItems: "center",
                overflow: "hidden",
                borderWidth: thumbnail ? 0 : 2,
                borderColor: Colors.neutral[200],
                borderStyle: "dashed",
              }}
            >
              {thumbnail ? (
                <>
                  <Image
                    source={{ uri: thumbnail }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setThumbnail(null);
                      setThumbnailAsset(null);
                    }}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: 16,
                      padding: 6,
                    }}
                  >
                    <X size={18} color="#FFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <ImagePlus size={32} color={Colors.neutral[400]} />
                  <Text style={{ color: Colors.neutral[500], marginTop: 8, fontSize: 14 }}>
                    이미지 추가
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 제목 */}
          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={styles.label}>레시피 제목 *</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 초간단 계란볶음밥"
              placeholderTextColor={Colors.neutral[400]}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* 설명 */}
          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={styles.label}>간단 설명</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: "top", paddingTop: Spacing.md }]}
              placeholder="레시피에 대한 간단한 설명을 입력하세요"
              placeholderTextColor={Colors.neutral[400]}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* 시간, 인분 */}
          <View style={{ flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.lg }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>조리 시간 (분)</Text>
              <View style={styles.inputWithIcon}>
                <Clock size={18} color={Colors.neutral[400]} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="30"
                  placeholderTextColor={Colors.neutral[400]}
                  value={cookingTime}
                  onChangeText={setCookingTime}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>인분</Text>
              <View style={styles.inputWithIcon}>
                <Users size={18} color={Colors.neutral[400]} />
                <TextInput
                  style={styles.inputInner}
                  placeholder="2"
                  placeholderTextColor={Colors.neutral[400]}
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {/* 요리 종류 */}
          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={styles.label}>요리 종류</Text>
            {renderChipSelector(CUISINE_OPTIONS, cuisineType, setCuisineType)}
          </View>

          {/* 식사 유형 */}
          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={styles.label}>식사 유형</Text>
            {renderChipSelector(MEAL_TYPE_OPTIONS, mealType, setMealType)}
          </View>

          {/* 난이도 */}
          <View style={{ marginBottom: Spacing.xl }}>
            <Text style={styles.label}>난이도</Text>
            {renderChipSelector(DIFFICULTY_OPTIONS, difficulty, setDifficulty)}
          </View>

          {/* 재료 */}
          <View style={{ marginBottom: Spacing.xl }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>재료 *</Text>
              <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
                <Plus size={16} color={Colors.primary[500]} />
                <Text style={{ color: Colors.primary[500], marginLeft: 4, fontWeight: "600" }}>
                  추가
                </Text>
              </TouchableOpacity>
            </View>

            {ingredients.map((ingredient) => (
              <View key={ingredient.id} style={styles.ingredientRow}>
                <TouchableOpacity
                  onPress={() => openIngredientSearch(ingredient.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.input,
                    {
                      flex: 2,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: ingredient.name ? Colors.neutral[900] : Colors.neutral[400],
                      fontSize: Typography.fontSize.base,
                    }}
                    numberOfLines={1}
                  >
                    {ingredient.name || "재료 검색"}
                  </Text>
                  <Search size={16} color={Colors.neutral[400]} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="수량"
                  placeholderTextColor={Colors.neutral[400]}
                  value={ingredient.amount}
                  onChangeText={(text) => updateIngredient(ingredient.id, "amount", text)}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="단위"
                  placeholderTextColor={Colors.neutral[400]}
                  value={ingredient.unit}
                  onChangeText={(text) => updateIngredient(ingredient.id, "unit", text)}
                />
                {ingredients.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeIngredient(ingredient.id)}
                    style={{ padding: 8 }}
                  >
                    <Trash2 size={18} color={Colors.error.main} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* 조리 순서 */}
          <View style={{ marginBottom: Spacing.xl }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>조리 순서 *</Text>
              <TouchableOpacity onPress={addStep} style={styles.addButton}>
                <Plus size={16} color={Colors.primary[500]} />
                <Text style={{ color: Colors.primary[500], marginLeft: 4, fontWeight: "600" }}>
                  추가
                </Text>
              </TouchableOpacity>
            </View>

            {steps.map((step, index) => (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>
                    {index + 1}
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, { flex: 1, minHeight: 60, textAlignVertical: "top", paddingTop: Spacing.md }]}
                  placeholder={`${index + 1}단계 조리 방법`}
                  placeholderTextColor={Colors.neutral[400]}
                  value={step.description}
                  onChangeText={(text) => updateStep(step.id, text)}
                  multiline
                />
                {steps.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeStep(step.id)}
                    style={{ padding: 8, marginTop: 8 }}
                  >
                    <Trash2 size={18} color={Colors.error.main} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* 태그 */}
          <View style={{ marginBottom: Spacing.xl }}>
            <Text style={styles.label}>태그</Text>

            {/* 태그 입력 */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.input}
                  placeholder="태그 입력 (예: 한식)"
                  placeholderTextColor={Colors.neutral[400]}
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleTagInputSubmit}
                  returnKeyType="done"
                />
              </View>
              <TouchableOpacity
                onPress={addTag}
                activeOpacity={0.7}
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: tagInput.trim() ? Colors.primary[500] : Colors.neutral[200],
                  borderRadius: BorderRadius.xl,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Plus size={20} color={tagInput.trim() ? "#FFF" : Colors.neutral[400]} />
              </TouchableOpacity>
            </View>

            {/* 등록된 태그 목록 */}
            {tags.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: Spacing.sm,
                  marginTop: Spacing.md,
                }}
              >
                {tags.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: Colors.primary[50],
                      paddingVertical: Spacing.xs,
                      paddingLeft: Spacing.md,
                      paddingRight: Spacing.xs,
                      borderRadius: BorderRadius.full,
                      gap: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        color: Colors.primary[700],
                        fontWeight: "500",
                      }}
                    >
                      {tag}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeTag(tag)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{
                        padding: 4,
                        borderRadius: BorderRadius.full,
                      }}
                    >
                      <X size={14} color={Colors.primary[500]} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* 하단 저장 버튼 */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: Spacing.xl,
            paddingTop: Spacing.md,
            paddingBottom: insets.bottom + Spacing.md,
            backgroundColor: Colors.neutral[0],
            borderTopWidth: 1,
            borderTopColor: Colors.neutral[100],
            ...Shadows.md,
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isSaving ? Colors.neutral[300] : Colors.primary[500],
              paddingVertical: Spacing.md,
              borderRadius: BorderRadius.xl,
              ...Shadows.primary,
            }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Check size={20} color="#FFF" />
                <Text
                  style={{
                    color: "#FFF",
                    fontWeight: "700",
                    fontSize: Typography.fontSize.base,
                    marginLeft: Spacing.sm,
                  }}
                >
                  저장하기
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 재료 검색 모달 */}
      <Modal visible={showIngredientSearchModal} transparent animationType="slide">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowIngredientSearchModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: Colors.neutral[0],
              borderTopLeftRadius: BorderRadius["2xl"],
              borderTopRightRadius: BorderRadius["2xl"],
              height: "70%",
              paddingTop: Spacing.md,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 핸들바 */}
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: Colors.neutral[300],
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: Spacing.md,
              }}
            />

            {/* 제목 */}
            <Text
              style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: "700",
                color: Colors.neutral[900],
                paddingHorizontal: Spacing.xl,
                marginBottom: Spacing.md,
              }}
            >
              재료 검색
            </Text>

            {/* 검색 입력창 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: Colors.neutral[100],
                marginHorizontal: Spacing.xl,
                borderRadius: BorderRadius.xl,
                paddingHorizontal: Spacing.md,
                marginBottom: Spacing.md,
              }}
            >
              <Search size={20} color={Colors.neutral[400]} />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: Spacing.md,
                  marginLeft: Spacing.sm,
                  fontSize: Typography.fontSize.base,
                  color: Colors.neutral[900],
                }}
                placeholder="재료명을 검색하세요"
                placeholderTextColor={Colors.neutral[400]}
                value={ingredientSearchQuery}
                onChangeText={setIngredientSearchQuery}
                autoFocus
              />
              {ingredientSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setIngredientSearchQuery("")}>
                  <X size={18} color={Colors.neutral[400]} />
                </TouchableOpacity>
              )}
            </View>

            {/* 재료 목록 */}
            {ingredientsLoading ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="small" color={Colors.primary[500]} />
                <Text style={{ color: Colors.neutral[500], marginTop: Spacing.sm }}>
                  재료 목록 불러오는 중...
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredIngredients}
                keyExtractor={(item) => item.id.toString()}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl, flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={{ padding: Spacing.xl, alignItems: "center" }}>
                    <Text style={{ color: Colors.neutral[500] }}>
                      {ingredientSearchQuery
                        ? `"${ingredientSearchQuery}"에 대한 검색 결과가 없습니다`
                        : "등록된 재료가 없습니다"}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => selectIngredient(item)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: Spacing.md,
                      paddingHorizontal: Spacing.xl,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.neutral[100],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: Typography.fontSize.base,
                        color: Colors.neutral[900],
                      }}
                    >
                      {item.name}
                    </Text>
                    <ChevronRight size={18} color={Colors.neutral[400]} />
                  </TouchableOpacity>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <SuccessResultModal
        visible={showSaveSuccessModal}
        title="레시피 저장 완료!"
        description={savedRecipeTitle ? `"${savedRecipeTitle}" 레시피가 저장되었습니다.` : undefined}
        confirmText="레시피북으로 이동"
        onClose={() => setShowSaveSuccessModal(false)}
        onConfirm={() => {
          setShowSaveSuccessModal(false);
          router.push("/(tabs)/recipe-book");
        }}
      />
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium as "500",
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.neutral[900],
  },
  inputWithIcon: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: Colors.neutral[0],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
  },
  inputInner: {
    flex: 1,
    paddingVertical: Spacing.md,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.base,
    color: Colors.neutral[900],
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: Spacing.sm,
  },
  addButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  ingredientRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary[500],
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginTop: 10,
  },
};
