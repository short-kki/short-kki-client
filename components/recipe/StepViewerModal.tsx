import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Dimensions,
  StatusBar,
  Animated,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/design-system";

interface Step {
  stepOrder: number;
  description: string;
}

interface Props {
  visible: boolean;
  steps: Step[];
  initialIndex?: number;
  onClose: () => void;
}

const { width: W, height: H } = Dimensions.get("window");

export function StepViewerModal({ visible, steps, initialIndex = 0, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const insets = useSafeAreaInsets();

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) setCurrentIndex(initialIndex);
  }, [visible, initialIndex]);

  const animateTransition = useCallback(
    (nextIndex: number, dir: "next" | "prev") => {
      const slideOut = dir === "next" ? -W * 0.08 : W * 0.08;
      const slideIn = dir === "next" ? W * 0.08 : -W * 0.08;

      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(contentTranslateX, { toValue: slideOut, duration: 120, useNativeDriver: true }),
      ]).start(() => {
        setCurrentIndex(nextIndex);
        contentTranslateX.setValue(slideIn);
        Animated.parallel([
          Animated.timing(contentOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(contentTranslateX, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start();
      });
    },
    [contentOpacity, contentTranslateX]
  );

  const goTo = useCallback(
    (index: number, dir: "next" | "prev") => {
      if (index >= 0 && index < steps.length) {
        animateTransition(index, dir);
      }
    },
    [steps.length, animateTransition]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1, "next"), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1, "prev"), [currentIndex, goTo]);

  // 회전된 화면에서 Y축 스와이프 = 가로 방향 이동
  const swipeGesture = Gesture.Pan().onEnd((event) => {
    if (event.translationY < -60) runOnJS(goNext)();
    else if (event.translationY > 60) runOnJS(goPrev)();
  });

  const step = steps[currentIndex];
  if (!step) return null;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" }}>
        <GestureDetector gesture={swipeGesture}>
          {/* 90도 회전 → 가로 풀화면 */}
          <View
            style={{
              width: H,
              height: W,
              transform: [{ rotate: "90deg" }],
              backgroundColor: "#FFFFFF",
            }}
          >
            {/* ── 헤더 ── */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 24,
                paddingTop: 18,
                paddingBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    backgroundColor: Colors.primary[500],
                    borderRadius: 7,
                    paddingHorizontal: 11,
                    paddingVertical: 5,
                  }}
                >
                  <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700", letterSpacing: 1.5 }}>
                    STEP {step.stepOrder || currentIndex + 1}
                  </Text>
                </View>
                <Text style={{ color: Colors.neutral[400], fontSize: 13, fontWeight: "500" }}>
                  {currentIndex + 1} / {steps.length}
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                hitSlop={16}
                style={({ pressed }) => ({
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: pressed ? Colors.neutral[200] : Colors.neutral[100],
                  justifyContent: "center",
                  alignItems: "center",
                })}
              >
                <X size={20} color={Colors.neutral[600]} />
              </Pressable>
            </View>

            {/* ── 진행 바 ── */}
            <View style={{ height: 2, backgroundColor: Colors.neutral[100] }}>
              <View
                style={{
                  width: `${((currentIndex + 1) / steps.length) * 100}%`,
                  height: "100%",
                  backgroundColor: Colors.primary[400],
                }}
              />
            </View>

            {/* ── 메인 영역: 전자책 방식 탭 존 ── */}
            <View style={{ flex: 1, position: "relative" }}>

              {/* 투명 탭 존: 왼쪽 절반 → 이전 */}
              <Pressable
                onPress={goPrev}
                disabled={isFirst}
                style={{
                  position: "absolute",
                  top: 0, bottom: 0, left: 0,
                  width: "45%",
                  zIndex: 10,
                }}
              />

              {/* 투명 탭 존: 오른쪽 절반 → 다음 */}
              <Pressable
                onPress={goNext}
                disabled={isLast}
                style={{
                  position: "absolute",
                  top: 0, bottom: 0, right: 0,
                  width: "45%",
                  zIndex: 10,
                }}
              />

              {/* 방향 힌트 */}
              {!isFirst && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: 20,
                    top: 0, bottom: 0,
                    justifyContent: "center",
                    zIndex: 11,
                    opacity: 0.55,
                  }}
                >
                  <ChevronLeft size={28} color={Colors.neutral[700]} strokeWidth={2} />
                </View>
              )}
              {!isLast && (
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    right: Math.max(insets.top, 20) + 12,
                    top: 0, bottom: 0,
                    justifyContent: "center",
                    zIndex: 11,
                    opacity: 0.55,
                  }}
                >
                  <ChevronRight size={28} color={Colors.neutral[700]} strokeWidth={2} />
                </View>
              )}

              {/* 단계 텍스트: 가운데에 띄워서 표시, 터치 통과 */}
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 80,
                  opacity: contentOpacity,
                  transform: [{ translateX: contentTranslateX }],
                  zIndex: 5,
                }}
              >
                <Text
                  style={{
                    fontSize: 21,
                    fontWeight: "500",
                    color: Colors.neutral[900],
                    lineHeight: 36,
                    textAlign: "center",
                    letterSpacing: -0.3,
                  }}
                >
                  {step.description}
                </Text>
              </Animated.View>
            </View>

            {/* ── 하단 점 표시 ── */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 7,
                paddingTop: 10,
                paddingBottom: 18,
              }}
            >
              {steps.length <= 12 ? (
                steps.map((_, i) => (
                  <View
                    key={i}
                    style={{
                      width: i === currentIndex ? 22 : 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor:
                        i === currentIndex
                          ? Colors.primary[500]
                          : i < currentIndex
                          ? Colors.primary[200]
                          : Colors.neutral[200],
                    }}
                  />
                ))
              ) : (
                <Text style={{ color: Colors.neutral[400], fontSize: 13 }}>
                  {currentIndex + 1} / {steps.length}
                </Text>
              )}
            </View>
          </View>
        </GestureDetector>
      </View>
    </Modal>
  );
}
