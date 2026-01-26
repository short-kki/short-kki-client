/**
 * Tag/Chip Component
 *
 * 숏끼 디자인 시스템의 태그/칩 컴포넌트
 * 레시피 카테고리, 재료, 필터 등에 사용
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  SemanticColors,
} from '@/constants/design-system';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================================
// TYPES
// ============================================================================

export type TagVariant = 'filled' | 'outlined' | 'soft';
export type TagColor = 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error';
export type TagSize = 'sm' | 'md' | 'lg';

export interface TagProps {
  /** 태그 텍스트 */
  children: string;
  /** 태그 스타일 변형 */
  variant?: TagVariant;
  /** 태그 색상 */
  color?: TagColor;
  /** 태그 크기 */
  size?: TagSize;
  /** 선택 가능 여부 */
  selectable?: boolean;
  /** 선택 상태 */
  selected?: boolean;
  /** 삭제 가능 여부 (X 버튼 표시) */
  removable?: boolean;
  /** 클릭 핸들러 */
  onPress?: () => void;
  /** 삭제 핸들러 */
  onRemove?: () => void;
  /** 왼쪽 아이콘 */
  leftIcon?: React.ReactNode;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 추가 스타일 */
  style?: ViewStyle;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLOR_SCHEMES: Record<TagColor, {
  filled: { bg: string; text: string };
  outlined: { border: string; text: string };
  soft: { bg: string; text: string };
}> = {
  primary: {
    filled: { bg: Colors.primary[500], text: Colors.neutral[0] },
    outlined: { border: Colors.primary[500], text: Colors.primary[500] },
    soft: { bg: Colors.primary[100], text: Colors.primary[600] },
  },
  secondary: {
    filled: { bg: Colors.secondary[500], text: Colors.neutral[900] },
    outlined: { border: Colors.secondary[500], text: Colors.secondary[600] },
    soft: { bg: Colors.secondary[100], text: Colors.secondary[700] },
  },
  neutral: {
    filled: { bg: Colors.neutral[600], text: Colors.neutral[0] },
    outlined: { border: Colors.neutral[300], text: Colors.neutral[600] },
    soft: { bg: Colors.neutral[100], text: Colors.neutral[700] },
  },
  success: {
    filled: { bg: Colors.success.main, text: Colors.neutral[0] },
    outlined: { border: Colors.success.main, text: Colors.success.main },
    soft: { bg: Colors.success.light, text: Colors.success.dark },
  },
  warning: {
    filled: { bg: Colors.warning.main, text: Colors.neutral[900] },
    outlined: { border: Colors.warning.main, text: Colors.warning.dark },
    soft: { bg: Colors.warning.light, text: Colors.warning.dark },
  },
  error: {
    filled: { bg: Colors.error.main, text: Colors.neutral[0] },
    outlined: { border: Colors.error.main, text: Colors.error.main },
    soft: { bg: Colors.error.light, text: Colors.error.dark },
  },
};

const SIZE_STYLES: Record<TagSize, {
  height: number;
  paddingHorizontal: number;
  fontSize: number;
  iconSize: number;
  gap: number;
}> = {
  sm: {
    height: 24,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.fontSize.xs,
    iconSize: 12,
    gap: Spacing.xxs,
  },
  md: {
    height: 32,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    iconSize: 14,
    gap: Spacing.xs,
  },
  lg: {
    height: 40,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.fontSize.base,
    iconSize: 16,
    gap: Spacing.xs,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function Tag({
  children,
  variant = 'soft',
  color = 'primary',
  size = 'md',
  selectable = false,
  selected = false,
  removable = false,
  onPress,
  onRemove,
  leftIcon,
  disabled = false,
  style,
}: TagProps) {
  const scale = useSharedValue(1);
  const colorScheme = COLOR_SCHEMES[color];
  const sizeStyle = SIZE_STYLES[size];

  const isInteractive = (selectable || removable || onPress) && !disabled;

  const handlePressIn = useCallback(() => {
    if (isInteractive) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    }
  }, [isInteractive]);

  const handlePressOut = useCallback(() => {
    if (isInteractive) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  }, [isInteractive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // 현재 변형에 따른 스타일 계산
  const getVariantStyles = (): ViewStyle => {
    // 선택 상태일 때는 filled로 변경
    const activeVariant = selected ? 'filled' : variant;

    if (activeVariant === 'outlined') {
      const scheme = colorScheme.outlined;
      return {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: scheme.border,
      };
    }

    const scheme = colorScheme[activeVariant];
    return {
      backgroundColor: scheme.bg,
    };
  };

  const getTextColor = (): string => {
    const activeVariant = selected ? 'filled' : variant;
    return colorScheme[activeVariant].text;
  };

  const containerStyles: ViewStyle = {
    height: sizeStyle.height,
    paddingHorizontal: sizeStyle.paddingHorizontal,
    gap: sizeStyle.gap,
    ...getVariantStyles(),
    ...(disabled && styles.disabled),
  };

  const textStyles: TextStyle = {
    fontSize: sizeStyle.fontSize,
    color: disabled ? Colors.neutral[400] : getTextColor(),
  };

  const content = (
    <>
      {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
      <Text style={[styles.text, textStyles]}>{children}</Text>
      {removable && (
        <Pressable
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          style={styles.removeButton}
          disabled={disabled}
        >
          <X
            size={sizeStyle.iconSize}
            color={disabled ? Colors.neutral[400] : getTextColor()}
            strokeWidth={2.5}
          />
        </Pressable>
      )}
    </>
  );

  if (isInteractive) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.container, containerStyles, animatedStyle, style]}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View style={[styles.container, containerStyles, style]}>
      {content}
    </View>
  );
}

// ============================================================================
// TAG GROUP
// ============================================================================

export interface TagGroupProps {
  /** 태그 목록 */
  tags: string[];
  /** 선택된 태그들 */
  selectedTags?: string[];
  /** 태그 선택/해제 핸들러 */
  onTagPress?: (tag: string) => void;
  /** 태그 삭제 핸들러 */
  onTagRemove?: (tag: string) => void;
  /** 태그 속성들 */
  tagProps?: Omit<TagProps, 'children' | 'onPress' | 'onRemove' | 'selected'>;
  /** 한 줄에 태그 overflow 시 wrap */
  wrap?: boolean;
  /** 추가 스타일 */
  style?: ViewStyle;
}

export function TagGroup({
  tags,
  selectedTags = [],
  onTagPress,
  onTagRemove,
  tagProps = {},
  wrap = true,
  style,
}: TagGroupProps) {
  return (
    <View style={[styles.tagGroup, wrap && styles.tagGroupWrap, style]}>
      {tags.map((tag, index) => (
        <Tag
          key={`${tag}-${index}`}
          selected={selectedTags.includes(tag)}
          selectable={!!onTagPress}
          removable={!!onTagRemove}
          onPress={onTagPress ? () => onTagPress(tag) : undefined}
          onRemove={onTagRemove ? () => onTagRemove(tag) : undefined}
          {...tagProps}
        >
          {tag}
        </Tag>
      ))}
    </View>
  );
}

// ============================================================================
// CATEGORY TAG (Special styled for recipe categories)
// ============================================================================

export interface CategoryTagProps {
  /** 카테고리 이름 */
  name: string;
  /** 아이콘 */
  icon?: React.ReactNode;
  /** 선택 상태 */
  selected?: boolean;
  /** 클릭 핸들러 */
  onPress?: () => void;
  /** 추가 스타일 */
  style?: ViewStyle;
}

export function CategoryTag({
  name,
  icon,
  selected = false,
  onPress,
  style,
}: CategoryTagProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.categoryTag,
        selected && styles.categoryTagSelected,
        animatedStyle,
        style,
      ]}
    >
      {icon && <View style={styles.categoryIcon}>{icon}</View>}
      <Text
        style={[
          styles.categoryText,
          selected && styles.categoryTextSelected,
        ]}
      >
        {name}
      </Text>
    </AnimatedPressable>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
  },
  disabled: {
    backgroundColor: Colors.neutral[100],
    borderColor: Colors.neutral[200],
  },
  text: {
    fontWeight: Typography.fontWeight.medium,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    marginLeft: -Spacing.xxs,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tag Group
  tagGroup: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tagGroupWrap: {
    flexWrap: 'wrap',
  },

  // Category Tag
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.neutral[100],
    gap: Spacing.sm,
  },
  categoryTagSelected: {
    backgroundColor: Colors.primary[500],
  },
  categoryIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: SemanticColors.textSecondary,
  },
  categoryTextSelected: {
    color: Colors.neutral[0],
  },
});

export default Tag;
