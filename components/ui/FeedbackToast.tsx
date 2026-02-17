import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { Check, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/design-system";

export type FeedbackToastVariant = "success" | "danger";

/** 토스트 메시지에 표시할 제목을 최대 길이로 잘라줍니다. */
export function truncateTitle(title: string, maxLength: number = 12): string {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength) + "...";
}

interface FeedbackToastState {
  toastMessage: string | null;
  toastVariant: FeedbackToastVariant;
  toastOpacity: Animated.Value;
  toastTranslate: Animated.Value;
  showToast: (message: string, variant?: FeedbackToastVariant) => void;
}

export function useFeedbackToast(duration: number = 1500): FeedbackToastState {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<FeedbackToastVariant>("success");
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslate = useRef(new Animated.Value(12)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const showToast = useCallback((message: string, variant: FeedbackToastVariant = "success") => {
    setToastVariant(variant);
    setToastMessage(message);

    toastOpacity.stopAnimation();
    toastTranslate.stopAnimation();
    toastOpacity.setValue(0);
    toastTranslate.setValue(12);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslate, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastTimer.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslate, {
          toValue: 12,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setToastMessage(null));
    }, duration);
  }, [duration, toastOpacity, toastTranslate]);

  return {
    toastMessage,
    toastVariant,
    toastOpacity,
    toastTranslate,
    showToast,
  };
}

interface FeedbackToastProps {
  message: string | null;
  variant: FeedbackToastVariant;
  opacity: Animated.Value;
  translate: Animated.Value;
  bottomOffset?: number;
}

export function FeedbackToast({
  message,
  variant,
  opacity,
  translate,
  bottomOffset = 88,
}: FeedbackToastProps) {
  const insets = useSafeAreaInsets();

  if (!message) {
    return null;
  }

  const isSuccess = variant === "success";

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: Spacing.lg,
        right: Spacing.lg,
        bottom: insets.bottom + bottomOffset,
        zIndex: 300,
        opacity,
        transform: [{ translateY: translate }],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: Colors.neutral[0],
          borderRadius: 16,
          overflow: "hidden",
          paddingVertical: 12,
          paddingHorizontal: 14,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: isSuccess ? Colors.success.light : Colors.error.light,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSuccess ? (
            <Check size={16} color={Colors.success.main} strokeWidth={3} />
          ) : (
            <X size={16} color={Colors.error.main} strokeWidth={3} />
          )}
        </View>
        <Text
          style={{
            color: Colors.neutral[900],
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
