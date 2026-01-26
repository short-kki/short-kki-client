/**
 * Button Component
 *
 * 숏끼 디자인 시스템의 공통 버튼 컴포넌트
 * 부드러운 둥근 모서리와 따뜻한 컬러를 사용한 친근한 버튼
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  PressableStateCallbackType,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
  Typography,
  ComponentSizes,
  Animation,
} from '@/constants/design-system';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================================
// TYPES
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps {
  /** 버튼 텍스트 */
  children: string;
  /** 클릭 핸들러 */
  onPress?: () => void;
  /** 버튼 스타일 변형 */
  variant?: ButtonVariant;
  /** 버튼 크기 */
  size?: ButtonSize;
  /** 전체 너비 사용 */
  fullWidth?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 왼쪽 아이콘 */
  leftIcon?: React.ReactNode;
  /** 오른쪽 아이콘 */
  rightIcon?: React.ReactNode;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 텍스트 추가 스타일 */
  textStyle?: TextStyle;
  /** 접근성 라벨 */
  accessibilityLabel?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VARIANT_STYLES: Record<ButtonVariant, {
  container: ViewStyle;
  containerPressed: ViewStyle;
  text: TextStyle;
  loadingColor: string;
}> = {
  primary: {
    container: {
      backgroundColor: Colors.primary[500],
      ...Shadows.primary,
    },
    containerPressed: {
      backgroundColor: Colors.primary[600],
    },
    text: {
      color: Colors.neutral[0],
    },
    loadingColor: Colors.neutral[0],
  },
  secondary: {
    container: {
      backgroundColor: Colors.neutral[0],
      borderWidth: 1.5,
      borderColor: Colors.neutral[200],
      ...Shadows.xs,
    },
    containerPressed: {
      backgroundColor: Colors.neutral[100],
      borderColor: Colors.neutral[300],
    },
    text: {
      color: Colors.neutral[800],
    },
    loadingColor: Colors.neutral[600],
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    containerPressed: {
      backgroundColor: Colors.overlay.light,
    },
    text: {
      color: Colors.primary[500],
    },
    loadingColor: Colors.primary[500],
  },
  danger: {
    container: {
      backgroundColor: Colors.error.main,
      ...Shadows.sm,
    },
    containerPressed: {
      backgroundColor: Colors.error.dark,
    },
    text: {
      color: Colors.neutral[0],
    },
    loadingColor: Colors.neutral[0],
  },
};

const SIZE_STYLES: Record<ButtonSize, {
  height: number;
  paddingHorizontal: number;
  fontSize: number;
  iconSize: number;
  gap: number;
}> = {
  sm: {
    height: ComponentSizes.button.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    iconSize: 16,
    gap: Spacing.xs,
  },
  md: {
    height: ComponentSizes.button.md,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.base,
    iconSize: 20,
    gap: Spacing.sm,
  },
  lg: {
    height: ComponentSizes.button.lg,
    paddingHorizontal: Spacing.xl,
    fontSize: Typography.fontSize.md,
    iconSize: 22,
    gap: Spacing.sm,
  },
  xl: {
    height: ComponentSizes.button.xl,
    paddingHorizontal: Spacing['2xl'],
    fontSize: Typography.fontSize.lg,
    iconSize: 24,
    gap: Spacing.md,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  accessibilityLabel,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, {
      damping: 15,
      stiffness: 400,
    });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 400,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0.97, 1], [0.9, 1]),
  }));

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel || children}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.base,
        {
          height: sizeStyle.height,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          gap: sizeStyle.gap,
        },
        variantStyle.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.content,
            { gap: sizeStyle.gap },
            pressed && !isDisabled && variantStyle.containerPressed,
          ]}
        >
          {loading ? (
            <ActivityIndicator
              size="small"
              color={variantStyle.loadingColor}
            />
          ) : (
            <>
              {leftIcon && (
                <View style={styles.iconContainer}>
                  {leftIcon}
                </View>
              )}
              <Text
                style={[
                  styles.text,
                  { fontSize: sizeStyle.fontSize },
                  variantStyle.text,
                  isDisabled && styles.textDisabled,
                  textStyle,
                ]}
              >
                {children}
              </Text>
              {rightIcon && (
                <View style={styles.iconContainer}>
                  {rightIcon}
                </View>
              )}
            </>
          )}
        </View>
      )}
    </AnimatedPressable>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.base,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    backgroundColor: Colors.neutral[200],
    shadowOpacity: 0,
    elevation: 0,
    borderColor: Colors.neutral[200],
  },
  text: {
    fontWeight: Typography.fontWeight.semiBold,
    textAlign: 'center',
  },
  textDisabled: {
    color: Colors.neutral[400],
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;
