import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
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
  ChefHat,
  ImagePlus,
  Trash2,
  GripVertical,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";

interface Ingredient {
  id: string;
  name: string;
  amount: string;
}

interface Step {
  id: string;
  content: string;
}

export default function RecipeCreateManualScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [servings, setServings] = useState("2");
  const [difficulty, setDifficulty] = useState<"쉬움" | "보통" | "어려움">("보통");
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "1", name: "", amount: "" },
  ]);
  const [steps, setSteps] = useState<Step[]>([{ id: "1", content: "" }]);
  const [tags, setTags] = useState("");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now().toString(), name: "", amount: "" },
    ]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((ing) => ing.id !== id));
    }
  };

  const updateIngredient = (id: string, field: "name" | "amount", value: string) => {
    setIngredients(
      ingredients.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const addStep = () => {
    setSteps([...steps, { id: Date.now().toString(), content: "" }]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter((step) => step.id !== id));
    }
  };

  const updateStep = (id: string, content: string) => {
    setSteps(steps.map((step) => (step.id === id ? { ...step, content } : step)));
  };

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

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("알림", "레시피 제목을 입력해주세요.");
      return;
    }

    const validIngredients = ingredients.filter((ing) => ing.name.trim());
    if (validIngredients.length === 0) {
      Alert.alert("알림", "최소 1개 이상의 재료를 입력해주세요.");
      return;
    }

    const validSteps = steps.filter((step) => step.content.trim());
    if (validSteps.length === 0) {
      Alert.alert("알림", "최소 1개 이상의 조리 단계를 입력해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      // 실제로는 서버에 저장
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("저장 완료", `"${title}" 레시피가 저장되었습니다.`, [
        {
          text: "확인",
          onPress: () => router.push("/(tabs)/recipe-book"),
        },
      ]);
    } catch (error) {
      Alert.alert("오류", "레시피 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

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
            justifyContent: "space-between",
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
              fontSize: Typography.fontSize.lg,
              fontWeight: Typography.fontWeight.bold,
              color: Colors.neutral[900],
            }}
          >
            레시피 작성
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={{
              backgroundColor: isSaving ? Colors.neutral[300] : Colors.primary[500],
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: BorderRadius.lg,
            }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>저장</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.xl, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 썸네일 이미지 */}
          <View style={{ marginBottom: Spacing.xl }}>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: Typography.fontWeight.medium,
                color: Colors.neutral[700],
                marginBottom: Spacing.sm,
              }}
            >
              대표 이미지
            </Text>
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
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: Typography.fontWeight.medium,
                color: Colors.neutral[700],
                marginBottom: Spacing.sm,
              }}
            >
              레시피 제목 *
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.neutral[0],
                borderWidth: 1,
                borderColor: Colors.neutral[200],
                borderRadius: BorderRadius.lg,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.md,
                fontSize: Typography.fontSize.base,
                color: Colors.neutral[900],
              }}
              placeholder="예: 초간단 계란볶음밥"
              placeholderTextColor={Colors.neutral[400]}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* 설명 */}
          <View style={{ marginBottom: Spacing.lg }}>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: Typography.fontWeight.medium,
                color: Colors.neutral[700],
                marginBottom: Spacing.sm,
              }}
            >
              간단 설명
            </Text>
            <TextInput
              style={{
                backgroundColor: Colors.neutral[0],
                borderWidth: 1,
                borderColor: Colors.neutral[200],
                borderRadius: BorderRadius.lg,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.md,
                fontSize: Typography.fontSize.base,
                color: Colors.neutral[900],
                minHeight: 80,
                textAlignVertical: "top",
              }}
              placeholder="레시피에 대한 간단한 설명을 입력하세요"
              placeholderTextColor={Colors.neutral[400]}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* 시간, 인분, 난이도 */}
          <View style={{ flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.lg }}>
            {/* 조리 시간 */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontWeight: Typography.fontWeight.medium,
                  color: Colors.neutral[700],
                  marginBottom: Spacing.sm,
                }}
              >
                조리 시간
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
                    paddingVertical: Spacing.md,
                    marginLeft: Spacing.sm,
                    fontSize: Typography.fontSize.base,
                    color: Colors.neutral[900],
                  }}
                  placeholder="15분"
                  placeholderTextColor={Colors.neutral[400]}
                  value={duration}
                  onChangeText={setDuration}
                />
              </View>
            </View>

            {/* 인분 */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontWeight: Typography.fontWeight.medium,
                  color: Colors.neutral[700],
                  marginBottom: Spacing.sm,
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
                    paddingVertical: Spacing.md,
                    marginLeft: Spacing.sm,
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

          {/* 난이도 */}
          <View style={{ marginBottom: Spacing.xl }}>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: Typography.fontWeight.medium,
                color: Colors.neutral[700],
                marginBottom: Spacing.sm,
              }}
            >
              난이도
            </Text>
            <View style={{ flexDirection: "row", gap: Spacing.sm }}>
              {(["쉬움", "보통", "어려움"] as const).map((level) => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setDifficulty(level)}
                  style={{
                    flex: 1,
                    paddingVertical: Spacing.md,
                    borderRadius: BorderRadius.lg,
                    backgroundColor: difficulty === level ? Colors.primary[500] : Colors.neutral[100],
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: difficulty === level ? "#FFF" : Colors.neutral[600],
                    }}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 재료 */}
          <View style={{ marginBottom: Spacing.xl }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: Spacing.sm,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontWeight: Typography.fontWeight.medium,
                  color: Colors.neutral[700],
                }}
              >
                재료 *
              </Text>
              <TouchableOpacity
                onPress={addIngredient}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: 4,
                }}
              >
                <Plus size={16} color={Colors.primary[500]} />
                <Text style={{ color: Colors.primary[500], marginLeft: 4, fontWeight: "600" }}>
                  추가
                </Text>
              </TouchableOpacity>
            </View>

            {ingredients.map((ingredient, index) => (
              <View
                key={ingredient.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.sm,
                  marginBottom: Spacing.sm,
                }}
              >
                <TextInput
                  style={{
                    flex: 2,
                    backgroundColor: Colors.neutral[0],
                    borderWidth: 1,
                    borderColor: Colors.neutral[200],
                    borderRadius: BorderRadius.lg,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                    fontSize: 14,
                    color: Colors.neutral[900],
                  }}
                  placeholder="재료명"
                  placeholderTextColor={Colors.neutral[400]}
                  value={ingredient.name}
                  onChangeText={(text) => updateIngredient(ingredient.id, "name", text)}
                />
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: Colors.neutral[0],
                    borderWidth: 1,
                    borderColor: Colors.neutral[200],
                    borderRadius: BorderRadius.lg,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.sm,
                    fontSize: 14,
                    color: Colors.neutral[900],
                  }}
                  placeholder="양"
                  placeholderTextColor={Colors.neutral[400]}
                  value={ingredient.amount}
                  onChangeText={(text) => updateIngredient(ingredient.id, "amount", text)}
                />
                {ingredients.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeIngredient(ingredient.id)}
                    style={{ padding: 4 }}
                  >
                    <Trash2 size={18} color={Colors.error[500]} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* 조리 순서 */}
          <View style={{ marginBottom: Spacing.xl }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: Spacing.sm,
              }}
            >
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontWeight: Typography.fontWeight.medium,
                  color: Colors.neutral[700],
                }}
              >
                조리 순서 *
              </Text>
              <TouchableOpacity
                onPress={addStep}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: 4,
                }}
              >
                <Plus size={16} color={Colors.primary[500]} />
                <Text style={{ color: Colors.primary[500], marginLeft: 4, fontWeight: "600" }}>
                  추가
                </Text>
              </TouchableOpacity>
            </View>

            {steps.map((step, index) => (
              <View
                key={step.id}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: Spacing.sm,
                  marginBottom: Spacing.sm,
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
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>
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
                    paddingHorizontal: Spacing.md,
                    paddingVertical: Spacing.md,
                    fontSize: 14,
                    color: Colors.neutral[900],
                    minHeight: 60,
                    textAlignVertical: "top",
                  }}
                  placeholder={`${index + 1}단계 조리 방법`}
                  placeholderTextColor={Colors.neutral[400]}
                  value={step.content}
                  onChangeText={(text) => updateStep(step.id, text)}
                  multiline
                />
                {steps.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeStep(step.id)}
                    style={{ padding: 4, marginTop: 8 }}
                  >
                    <Trash2 size={18} color={Colors.error[500]} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* 태그 */}
          <View style={{ marginBottom: Spacing.xl }}>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: Typography.fontWeight.medium,
                color: Colors.neutral[700],
                marginBottom: Spacing.sm,
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
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.md,
                fontSize: Typography.fontSize.base,
                color: Colors.neutral[900],
              }}
              placeholder="#한식 #볶음밥 #간편요리"
              placeholderTextColor={Colors.neutral[400]}
              value={tags}
              onChangeText={setTags}
            />
            <Text
              style={{
                fontSize: 12,
                color: Colors.neutral[400],
                marginTop: Spacing.xs,
              }}
            >
              쉼표 또는 공백으로 구분하세요
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
