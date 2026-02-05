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
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/design-system";
import { recipeApi, type RecipeCreateRequest } from "@/services/recipeApi";

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
  const [tags, setTags] = useState("");

  // UI State
  const [isSaving, setIsSaving] = useState(false);

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
      setThumbnail(result.assets[0].uri);
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
      // Parse tags
      const tagList = tags
        .split(/[,\s#]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const request: RecipeCreateRequest = {
        basicInfo: {
          title: title.trim(),
          description: description.trim() || undefined,
          servingSize: servingsNum,
          cookingTime: cookingTimeNum,
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
          onPress: () => router.push("/(tabs)/recipe-book"),
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
                    onPress={() => setThumbnail(null)}
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
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  placeholder="재료명"
                  placeholderTextColor={Colors.neutral[400]}
                  value={ingredient.name}
                  onChangeText={(text) => updateIngredient(ingredient.id, "name", text)}
                />
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
            <TextInput
              style={styles.input}
              placeholder="#한식 #볶음밥 #간편요리"
              placeholderTextColor={Colors.neutral[400]}
              value={tags}
              onChangeText={setTags}
            />
            <Text style={{ fontSize: 12, color: Colors.neutral[400], marginTop: Spacing.xs }}>
              쉼표, 공백 또는 #으로 구분하세요
            </Text>
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
