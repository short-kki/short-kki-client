import React, { useRef, useCallback, useState, useEffect } from "react";
import { Animated, Platform, ToastAndroid, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ToastState {
  message: string | null;
  opacity: Animated.Value;
  translate: Animated.Value;
}

interface UseToastReturn {
  toastMessage: string | null;
  toastOpacity: Animated.Value;
  toastTranslate: Animated.Value;
  showToast: (message: string, duration?: number) => void;
}

export function useToast(duration: number = 2000): UseToastReturn {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslate = useRef(new Animated.Value(8)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  const showToast = useCallback(
    (message: string, customDuration?: number) => {
      const toastDuration = customDuration ?? duration;

      if (Platform.OS === "android") {
        ToastAndroid.show(message, ToastAndroid.SHORT);
        return;
      }

      setToastMessage(message);
      toastOpacity.setValue(0);
      toastTranslate.setValue(8);

      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslate, {
          toValue: 0,
          duration: 200,
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
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(toastTranslate, {
            toValue: 8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToastMessage(null);
        });
      }, toastDuration);
    },
    [duration, toastOpacity, toastTranslate]
  );

  return {
    toastMessage,
    toastOpacity,
    toastTranslate,
    showToast,
  };
}

interface ToastProps {
  message: string | null;
  opacity: Animated.Value;
  translate: Animated.Value;
  bottomOffset?: number;
}

export function Toast({ message, opacity, translate, bottomOffset = 20 }: ToastProps) {
  const insets = useSafeAreaInsets();

  if (Platform.OS !== "ios" || !message) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          bottom: insets.bottom + bottomOffset,
          transform: [{ translateY: translate }],
          opacity: opacity,
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 13,
    textAlign: "center",
  },
});
