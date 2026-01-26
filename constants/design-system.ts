/**
 * 숏끼(Shortkki) Design System
 *
 * 따뜻하고 활기찬 레시피 공유 앱을 위한 통합 디자인 시스템
 * "따뜻한 주방의 설렘" - 요리하는 순간의 따뜻함과 음식을 나누는 즐거움
 */

import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native';

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const Colors = {
  // Primary - Warm Orange (따뜻한 오렌지)
  primary: {
    50: '#FFF7F0',
    100: '#FEEAD8',
    200: '#FDD4B0',
    300: '#FCB97D',
    400: '#FB9D4A',
    500: '#FA8112', // Main Primary
    600: '#E07310',
    700: '#B85E0D',
    800: '#8F490A',
    900: '#663408',
  },

  // Secondary - Warm Yellow/Beige (부드러운 보조 컬러)
  secondary: {
    50: '#FFFDF7',
    100: '#FFF9E6',
    200: '#FFF2C7',
    300: '#FFE999',
    400: '#FFDD66',
    500: '#FFD23F', // Main Secondary
    600: '#E6B800',
    700: '#B38F00',
    800: '#806600',
    900: '#4D3D00',
  },

  // Neutral - Warm Grays (따뜻한 느낌의 그레이)
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAF9',
    100: '#F5F5F4',
    200: '#E7E5E4',
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',
  },

  // Semantic Colors
  success: {
    light: '#ECFDF5',
    main: '#10B981',
    dark: '#059669',
  },
  warning: {
    light: '#FFFBEB',
    main: '#F59E0B',
    dark: '#D97706',
  },
  error: {
    light: '#FEF2F2',
    main: '#EF4444',
    dark: '#DC2626',
  },
  info: {
    light: '#EFF6FF',
    main: '#3B82F6',
    dark: '#2563EB',
  },

  // Special Colors for Food/Recipe Context
  food: {
    fresh: '#22C55E',    // 신선한 재료
    spicy: '#EF4444',    // 매운맛
    sweet: '#F472B6',    // 달콤함
    savory: '#92400E',   // 감칠맛
  },

  // Overlay & Shadow
  overlay: {
    light: 'rgba(0, 0, 0, 0.04)',
    medium: 'rgba(0, 0, 0, 0.08)',
    heavy: 'rgba(0, 0, 0, 0.16)',
    dark: 'rgba(0, 0, 0, 0.48)',
  },
} as const;

// Semantic Aliases
export const SemanticColors = {
  // Background
  background: Colors.neutral[0],
  backgroundSecondary: Colors.neutral[50],
  backgroundTertiary: Colors.neutral[100],

  // Surface (Cards, Modals)
  surface: Colors.neutral[0],
  surfaceHover: Colors.neutral[50],
  surfacePressed: Colors.neutral[100],

  // Text
  textPrimary: Colors.neutral[900],
  textSecondary: Colors.neutral[600],
  textTertiary: Colors.neutral[400],
  textInverse: Colors.neutral[0],
  textBrand: Colors.primary[500],

  // Border
  border: Colors.neutral[200],
  borderFocus: Colors.primary[500],
  borderError: Colors.error.main,

  // Interactive
  interactive: Colors.primary[500],
  interactiveHover: Colors.primary[600],
  interactivePressed: Colors.primary[700],
  interactiveDisabled: Colors.neutral[300],
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Typography = {
  // Font Families
  fontFamily: Platform.select({
    ios: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
      // 한글 타이틀에 적합한 둥근 폰트
      rounded: '-apple-system-body',
    },
    android: {
      regular: 'Roboto',
      medium: 'Roboto-Medium',
      semiBold: 'Roboto-Medium',
      bold: 'Roboto-Bold',
      rounded: 'Roboto',
    },
    default: {
      regular: 'System',
      medium: 'System',
      semiBold: 'System',
      bold: 'System',
      rounded: 'System',
    },
  }),

  // Font Sizes (8pt 배수 기반)
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
    '4xl': 40,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 1.8,
  },

  // Font Weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
} as const;

// Pre-built Text Styles
export const TextStyles = StyleSheet.create({
  // Display (Hero, Splash)
  displayLarge: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize['4xl'] * Typography.lineHeight.tight,
    letterSpacing: Typography.letterSpacing.tight,
    color: SemanticColors.textPrimary,
  },
  displayMedium: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize['3xl'] * Typography.lineHeight.tight,
    letterSpacing: Typography.letterSpacing.tight,
    color: SemanticColors.textPrimary,
  },

  // Headings
  h1: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize['2xl'] * Typography.lineHeight.snug,
    color: SemanticColors.textPrimary,
  },
  h2: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: Typography.fontSize.xl * Typography.lineHeight.snug,
    color: SemanticColors.textPrimary,
  },
  h3: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.snug,
    color: SemanticColors.textPrimary,
  },
  h4: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.snug,
    color: SemanticColors.textPrimary,
  },

  // Body
  bodyLarge: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
    color: SemanticColors.textPrimary,
  },
  bodyMedium: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
    color: SemanticColors.textPrimary,
  },
  bodySmall: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    color: SemanticColors.textSecondary,
  },

  // Labels
  labelLarge: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.tight,
    color: SemanticColors.textPrimary,
  },
  labelMedium: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.tight,
    color: SemanticColors.textPrimary,
  },
  labelSmall: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.tight,
    color: SemanticColors.textSecondary,
  },

  // Caption
  caption: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.normal,
    color: SemanticColors.textTertiary,
  },

  // Button Text
  buttonLarge: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: Typography.fontSize.md * Typography.lineHeight.tight,
    letterSpacing: Typography.letterSpacing.wide,
  },
  buttonMedium: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.tight,
    letterSpacing: Typography.letterSpacing.normal,
  },
  buttonSmall: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semiBold,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.tight,
    letterSpacing: Typography.letterSpacing.normal,
  },
});

// ============================================================================
// SPACING (8pt Grid System)
// ============================================================================

export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,    // 기본 - 버튼, 인풋 등
  lg: 20,
  xl: 24,      // 카드, 모달
  '2xl': 32,
  full: 9999,  // 원형 (아바타, 태그)
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  // Colored shadows for primary elements
  primary: {
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ============================================================================
// ANIMATION
// ============================================================================

export const Animation = {
  duration: {
    instant: 50,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },
  easing: {
    // React Native Animated에서 사용
    standard: 'ease-in-out',
    enter: 'ease-out',
    exit: 'ease-in',
  },
} as const;

// ============================================================================
// COMPONENT SIZES
// ============================================================================

export const ComponentSizes = {
  // Button Heights
  button: {
    sm: 36,
    md: 44,
    lg: 52,
    xl: 56,
  },
  // Input Heights
  input: {
    sm: 40,
    md: 48,
    lg: 56,
  },
  // Icon Sizes
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
  },
  // Avatar Sizes
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
  },
  // Tab Bar
  tabBar: {
    height: 85,
    iconSize: 24,
  },
  // Header
  header: {
    height: 56,
  },
} as const;

// ============================================================================
// COMMON COMPONENT STYLES
// ============================================================================

export const CommonStyles = StyleSheet.create({
  // ========== CONTAINERS ==========
  screenContainer: {
    flex: 1,
    backgroundColor: SemanticColors.background,
  },
  contentContainer: {
    paddingHorizontal: Spacing.base,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ========== CARDS ==========
  card: {
    backgroundColor: SemanticColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  cardPressed: {
    backgroundColor: SemanticColors.surfacePressed,
    transform: [{ scale: 0.98 }],
  },
  cardLarge: {
    backgroundColor: SemanticColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.md,
  },

  // ========== BUTTONS ==========
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.base,
    gap: Spacing.sm,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary[500],
    ...Shadows.primary,
  },
  buttonPrimaryPressed: {
    backgroundColor: Colors.primary[600],
  },
  buttonSecondary: {
    backgroundColor: Colors.neutral[0],
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
  },
  buttonSecondaryPressed: {
    backgroundColor: Colors.neutral[100],
    borderColor: Colors.neutral[300],
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonGhostPressed: {
    backgroundColor: Colors.overlay.light,
  },
  buttonDisabled: {
    backgroundColor: Colors.neutral[200],
    shadowOpacity: 0,
    elevation: 0,
  },

  // ========== INPUT FIELDS ==========
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.base,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  inputContainerFocused: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.neutral[0],
  },
  inputContainerError: {
    borderColor: Colors.error.main,
    backgroundColor: Colors.error.light,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: SemanticColors.textPrimary,
    paddingVertical: 0,
  },

  // ========== TAGS / CHIPS ==========
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  tagPrimary: {
    backgroundColor: Colors.primary[100],
  },
  tagSecondary: {
    backgroundColor: Colors.neutral[100],
  },

  // ========== DIVIDER ==========
  divider: {
    height: 1,
    backgroundColor: Colors.neutral[200],
  },
  dividerThick: {
    height: 8,
    backgroundColor: Colors.neutral[100],
  },

  // ========== LIST ITEMS ==========
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  listItemPressed: {
    backgroundColor: Colors.neutral[50],
  },

  // ========== HEADER ==========
  header: {
    height: ComponentSizes.header.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    backgroundColor: SemanticColors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  headerTransparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },

  // ========== AVATAR ==========
  avatar: {
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  // ========== BADGE ==========
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },

  // ========== OVERLAY / MODAL ==========
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay.dark,
  },
  modalContainer: {
    backgroundColor: SemanticColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.xl,
  },
  bottomSheet: {
    backgroundColor: SemanticColors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.xl,
  },
  bottomSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral[300],
    alignSelf: 'center',
    marginBottom: Spacing.base,
  },
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * 버튼 사이즈에 따른 스타일 반환
 */
export function getButtonSizeStyle(size: 'sm' | 'md' | 'lg' | 'xl'): ViewStyle {
  const heights = ComponentSizes.button;
  const paddings = {
    sm: Spacing.md,
    md: Spacing.base,
    lg: Spacing.lg,
    xl: Spacing.xl,
  };

  return {
    height: heights[size],
    paddingHorizontal: paddings[size],
  };
}

/**
 * 인풋 사이즈에 따른 스타일 반환
 */
export function getInputSizeStyle(size: 'sm' | 'md' | 'lg'): ViewStyle {
  return {
    height: ComponentSizes.input[size],
  };
}

/**
 * 아바타 사이즈에 따른 스타일 반환
 */
export function getAvatarSizeStyle(
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
): ViewStyle {
  const dimension = ComponentSizes.avatar[size];
  return {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };
}

// ============================================================================
// THEME EXPORT (for NativeWind/Tailwind integration)
// ============================================================================

export const TailwindExtension = {
  colors: {
    primary: Colors.primary,
    secondary: Colors.secondary,
    neutral: Colors.neutral,
    success: Colors.success.main,
    warning: Colors.warning.main,
    error: Colors.error.main,
    info: Colors.info.main,
  },
  spacing: Spacing,
  borderRadius: BorderRadius,
};
