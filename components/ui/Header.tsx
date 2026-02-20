/**
 * Header Component
 *
 * 숏끼 디자인 시스템의 헤더/네비게이션 바 컴포넌트
 * 깔끔하고 미니멀한 상단 네비게이션
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  ComponentSizes,
  SemanticColors,
  Shadows,
} from '@/constants/design-system';

// ============================================================================
// TYPES
// ============================================================================

export type HeaderVariant = 'default' | 'transparent' | 'elevated';

export interface HeaderProps {
  /** 헤더 타이틀 */
  title?: string;
  /** 서브타이틀 */
  subtitle?: string;
  /** 헤더 스타일 변형 */
  variant?: HeaderVariant;
  /** 뒤로가기 버튼 표시 */
  showBackButton?: boolean;
  /** 닫기 버튼 표시 (모달용) */
  showCloseButton?: boolean;
  /** 뒤로가기 핸들러 (기본: router.back) */
  onBackPress?: () => void;
  /** 닫기 핸들러 */
  onClosePress?: () => void;
  /** 왼쪽 커스텀 요소 */
  leftElement?: React.ReactNode;
  /** 오른쪽 커스텀 요소 */
  rightElement?: React.ReactNode;
  /** 타이틀 위치 */
  titleAlign?: 'left' | 'center';
  /** 하단 경계선 표시 */
  showBorder?: boolean;
  /** Safe Area Insets 포함 여부 */
  includeSafeArea?: boolean;
  /** 추가 스타일 */
  style?: ViewStyle;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VARIANT_STYLES: Record<HeaderVariant, ViewStyle> = {
  default: {
    backgroundColor: SemanticColors.background,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  elevated: {
    backgroundColor: SemanticColors.background,
    ...Shadows.sm,
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function Header({
  title,
  subtitle,
  variant = 'default',
  showBackButton = false,
  showCloseButton = false,
  onBackPress,
  onClosePress,
  leftElement,
  rightElement,
  titleAlign = 'center',
  showBorder = false,
  includeSafeArea = true,
  style,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleClosePress = () => {
    if (onClosePress) {
      onClosePress();
    } else {
      router.back();
    }
  };

  const variantStyle = VARIANT_STYLES[variant];
  const isTransparent = variant === 'transparent';

  // 왼쪽 요소 결정
  const renderLeftElement = () => {
    if (leftElement) return leftElement;

    if (showBackButton) {
      return (
        <HeaderIconButton onPress={handleBackPress} transparent={isTransparent}>
          <ChevronLeft
            size={24}
            color={isTransparent ? Colors.neutral[0] : SemanticColors.textPrimary}
            strokeWidth={2}
          />
        </HeaderIconButton>
      );
    }

    return <View style={styles.placeholder} />;
  };

  // 오른쪽 요소 결정
  const renderRightElement = () => {
    if (rightElement) return rightElement;

    if (showCloseButton) {
      return (
        <HeaderIconButton onPress={handleClosePress} transparent={isTransparent}>
          <X
            size={24}
            color={isTransparent ? Colors.neutral[0] : SemanticColors.textPrimary}
            strokeWidth={2}
          />
        </HeaderIconButton>
      );
    }

    return <View style={styles.placeholder} />;
  };

  return (
    <>
      {/* Status Bar Config */}
      <StatusBar
        barStyle={isTransparent ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <View
        style={[
          styles.container,
          variantStyle,
          includeSafeArea && { paddingTop: insets.top },
          showBorder && styles.withBorder,
          style,
        ]}
      >
        <View style={styles.content}>
          {/* Left Section */}
          <View style={styles.leftSection}>
            {renderLeftElement()}
          </View>

          {/* Center Section - Title */}
          <View style={[styles.centerSection, titleAlign === 'left' && styles.centerLeft]}>
            {title && (
              <Text
                style={[
                  styles.title,
                  isTransparent && styles.titleTransparent,
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  isTransparent && styles.subtitleTransparent,
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {/* Right Section */}
          <View style={styles.rightSection}>
            {renderRightElement()}
          </View>
        </View>
      </View>
    </>
  );
}

// ============================================================================
// HEADER ICON BUTTON
// ============================================================================

interface HeaderIconButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  transparent?: boolean;
  disabled?: boolean;
}

export function HeaderIconButton({
  children,
  onPress,
  transparent = false,
  disabled = false,
}: HeaderIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.iconButton,
        transparent && styles.iconButtonTransparent,
        pressed && !disabled && styles.iconButtonPressed,
        disabled && styles.iconButtonDisabled,
      ]}
    >
      {children}
    </Pressable>
  );
}

// ============================================================================
// HEADER TEXT BUTTON
// ============================================================================

interface HeaderTextButtonProps {
  children: string;
  onPress?: () => void;
  variant?: 'default' | 'primary';
  disabled?: boolean;
}

export function HeaderTextButton({
  children,
  onPress,
  variant = 'default',
  disabled = false,
}: HeaderTextButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.textButton,
        pressed && !disabled && styles.textButtonPressed,
      ]}
    >
      <Text
        style={[
          styles.textButtonLabel,
          variant === 'primary' && styles.textButtonLabelPrimary,
          disabled && styles.textButtonLabelDisabled,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

// ============================================================================
// LARGE HEADER (for scrollable pages)
// ============================================================================

interface LargeHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
}

export function LargeHeader({
  title,
  subtitle,
  rightElement,
  style,
}: LargeHeaderProps) {
  return (
    <View style={[styles.largeHeaderContainer, style]}>
      <View style={styles.largeHeaderContent}>
        <Text style={styles.largeHeaderTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.largeHeaderSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightElement && (
        <View style={styles.largeHeaderRight}>
          {rightElement}
        </View>
      )}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 100,
  },
  content: {
    height: ComponentSizes.header.height,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  leftSection: {
    width: 56,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLeft: {
    alignItems: 'flex-start',
    paddingLeft: Spacing.sm,
  },
  rightSection: {
    width: 56,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  title: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    color: SemanticColors.textPrimary,
  },
  titleTransparent: {
    color: Colors.neutral[0],
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    color: SemanticColors.textSecondary,
    marginTop: Spacing.xxs,
  },
  subtitleTransparent: {
    color: Colors.neutral[200],
  },

  // Icon Button
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonTransparent: {
    backgroundColor: Colors.overlay.light,
  },
  iconButtonPressed: {
    backgroundColor: Colors.overlay.light,
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },

  // Text Button
  textButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  textButtonPressed: {
    opacity: 0.7,
  },
  textButtonLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: SemanticColors.textPrimary,
  },
  textButtonLabelPrimary: {
    color: Colors.primary[500],
  },
  textButtonLabelDisabled: {
    color: Colors.neutral[400],
  },

  // Large Header
  largeHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  largeHeaderContent: {
    flex: 1,
  },
  largeHeaderTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: SemanticColors.textPrimary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  largeHeaderSubtitle: {
    fontSize: Typography.fontSize.base,
    color: SemanticColors.textSecondary,
    marginTop: Spacing.xs,
  },
  largeHeaderRight: {
    marginLeft: Spacing.base,
  },
});

export default Header;
