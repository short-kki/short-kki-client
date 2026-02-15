import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { Check, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/design-system";

export type FeedbackToastVariant = "success" | "danger";

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
          backgroundColor: "rgba(28, 25, 23, 0.94)",
          borderWidth: 1,
          borderColor: isSuccess ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)",
          borderRadius: BorderRadius.xl,
          paddingHorizontal: Spacing.md,
          paddingVertical: 11,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.18,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: isSuccess ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSuccess ? (
            <Check size={15} color={Colors.success.main} strokeWidth={3} />
          ) : (
            <X size={15} color={Colors.error.main} strokeWidth={3} />
          )}
        </View>
        <Text
          style={{
            flex: 1,
            color: Colors.neutral[0],
            fontSize: Typography.fontSize.sm,
            fontWeight: Typography.fontWeight.semiBold,
          }}
          numberOfLines={2}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
