/**
 * Input Component
 *
 * 숏끼 디자인 시스템의 공통 입력 필드 컴포넌트
 * 부드러운 배경과 포커스 상태의 명확한 피드백
 */

import React, { useState, forwardRef, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  ComponentSizes,
  Animation,
  SemanticColors,
} from '@/constants/design-system';

// ============================================================================
// TYPES
// ============================================================================

export type InputSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'focused' | 'error' | 'disabled';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** 라벨 텍스트 */
  label?: string;
  /** 힌트/설명 텍스트 */
  hint?: string;
  /** 에러 메시지 */
  error?: string;
  /** 입력 필드 크기 */
  size?: InputSize;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 왼쪽 아이콘 */
  leftIcon?: React.ReactNode;
  /** 오른쪽 아이콘/액션 */
  rightIcon?: React.ReactNode;
  /** 오른쪽 아이콘 클릭 핸들러 */
  onRightIconPress?: () => void;
  /** 전체 너비 사용 */
  fullWidth?: boolean;
  /** 컨테이너 스타일 */
  containerStyle?: ViewStyle;
  /** 입력 필드 스타일 */
  inputStyle?: TextStyle;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_STYLES: Record<InputSize, {
  height: number;
  fontSize: number;
  labelFontSize: number;
  paddingHorizontal: number;
}> = {
  sm: {
    height: ComponentSizes.input.sm,
    fontSize: Typography.fontSize.sm,
    labelFontSize: Typography.fontSize.xs,
    paddingHorizontal: Spacing.md,
  },
  md: {
    height: ComponentSizes.input.md,
    fontSize: Typography.fontSize.base,
    labelFontSize: Typography.fontSize.sm,
    paddingHorizontal: Spacing.base,
  },
  lg: {
    height: ComponentSizes.input.lg,
    fontSize: Typography.fontSize.md,
    labelFontSize: Typography.fontSize.base,
    paddingHorizontal: Spacing.lg,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      hint,
      error,
      size = 'md',
      disabled = false,
      leftIcon,
      rightIcon,
      onRightIconPress,
      fullWidth = true,
      containerStyle,
      inputStyle,
      ...textInputProps
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const focusProgress = useSharedValue(0);
    const sizeStyle = SIZE_STYLES[size];

    const hasError = !!error;
    const currentState: InputState = disabled
      ? 'disabled'
      : hasError
      ? 'error'
      : isFocused
      ? 'focused'
      : 'default';

    const handleFocus = useCallback(
      () => {
        setIsFocused(true);
        focusProgress.value = withTiming(1, { duration: Animation.duration.fast });
      },
      [focusProgress]
    );

    const handleBlur = useCallback(
      () => {
        setIsFocused(false);
        focusProgress.value = withTiming(0, { duration: Animation.duration.fast });
      },
      [focusProgress]
    );

    const animatedBorderStyle = useAnimatedStyle(() => {
      const borderColor = interpolateColor(
        focusProgress.value,
        [0, 1],
        [
          hasError ? Colors.error.main : Colors.neutral[200],
          hasError ? Colors.error.main : Colors.primary[500],
        ]
      );
      return { borderColor };
    });

    const getBackgroundColor = () => {
      if (disabled) return Colors.neutral[100];
      if (hasError) return Colors.error.light;
      if (isFocused) return Colors.neutral[0];
      return Colors.neutral[50];
    };

    return (
      <View style={[fullWidth && styles.fullWidth, containerStyle]}>
        {/* Label */}
        {label && (
          <Text
            style={[
              styles.label,
              { fontSize: sizeStyle.labelFontSize },
              hasError && styles.labelError,
              disabled && styles.labelDisabled,
            ]}
          >
            {label}
          </Text>
        )}

        {/* Input Container */}
        <Animated.View
          style={[
            styles.inputContainer,
            {
              height: sizeStyle.height,
              paddingHorizontal: sizeStyle.paddingHorizontal,
              backgroundColor: getBackgroundColor(),
            },
            animatedBorderStyle,
            disabled && styles.inputContainerDisabled,
          ]}
        >
          {/* Left Icon */}
          {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}

          {/* Text Input */}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              { fontSize: sizeStyle.fontSize },
              disabled && styles.inputDisabled,
              inputStyle,
            ]}
            placeholderTextColor={Colors.neutral[400]}
            editable={!disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...textInputProps}
          />

          {/* Right Icon */}
          {rightIcon && (
            <Pressable
              onPress={onRightIconPress}
              disabled={!onRightIconPress || disabled}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.iconContainer}
            >
              {rightIcon}
            </Pressable>
          )}
        </Animated.View>

        {/* Hint or Error Message */}
        {(hint || error) && (
          <Text
            style={[
              styles.hint,
              hasError && styles.hintError,
            ]}
          >
            {error || hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  label: {
    fontWeight: Typography.fontWeight.medium,
    color: SemanticColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  labelError: {
    color: Colors.error.main,
  },
  labelDisabled: {
    color: Colors.neutral[400],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.base,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  inputContainerDisabled: {
    borderColor: Colors.neutral[200],
  },
  input: {
    flex: 1,
    color: SemanticColors.textPrimary,
    fontWeight: Typography.fontWeight.regular,
    paddingVertical: 0,
  },
  inputDisabled: {
    color: Colors.neutral[400],
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.neutral[500],
    marginTop: Spacing.xs,
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.normal,
  },
  hintError: {
    color: Colors.error.main,
  },
});

export default Input;
