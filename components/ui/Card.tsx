/**
 * Card Component
 *
 * 숏끼 디자인 시스템의 카드 컴포넌트
 * 레시피 카드, 그룹 카드 등 다양한 콘텐츠를 담는 컨테이너
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  Colors,
  Spacing,
  BorderRadius,
  Shadows,
  Typography,
  TextStyles,
  SemanticColors,
} from '@/constants/design-system';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================================================
// TYPES
// ============================================================================

export type CardVariant = 'elevated' | 'outlined' | 'filled';
export type CardSize = 'sm' | 'md' | 'lg';

export interface CardProps {
  /** 자식 요소 */
  children?: React.ReactNode;
  /** 카드 스타일 변형 */
  variant?: CardVariant;
  /** 카드 크기 */
  size?: CardSize;
  /** 클릭 가능 여부 */
  pressable?: boolean;
  /** 클릭 핸들러 */
  onPress?: () => void;
  /** 추가 스타일 */
  style?: ViewStyle;
}

export interface RecipeCardProps {
  /** 레시피 ID */
  id: string | number;
  /** 썸네일 이미지 */
  thumbnail: ImageSourcePropType | string;
  /** 레시피 제목 */
  title: string;
  /** 작성자 이름 */
  author: string;
  /** 조리 시간 (분) */
  cookTime?: number;
  /** 좋아요 수 */
  likes?: number;
  /** 태그 목록 */
  tags?: string[];
  /** 클릭 핸들러 */
  onPress?: () => void;
  /** 추가 스타일 */
  style?: ViewStyle;
}

export interface GroupCardProps {
  /** 그룹 ID */
  id: string | number;
  /** 그룹 이미지 */
  image?: ImageSourcePropType | string;
  /** 그룹 이름 */
  name: string;
  /** 그룹 설명 */
  description?: string;
  /** 멤버 수 */
  memberCount: number;
  /** 최근 활동 시간 */
  lastActive?: string;
  /** 클릭 핸들러 */
  onPress?: () => void;
  /** 추가 스타일 */
  style?: ViewStyle;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const VARIANT_STYLES: Record<CardVariant, ViewStyle> = {
  elevated: {
    backgroundColor: SemanticColors.surface,
    ...Shadows.md,
  },
  outlined: {
    backgroundColor: SemanticColors.surface,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  filled: {
    backgroundColor: Colors.neutral[50],
  },
};

const SIZE_STYLES: Record<CardSize, {
  padding: number;
  borderRadius: number;
}> = {
  sm: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  md: {
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
  },
  lg: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
};

// ============================================================================
// BASE CARD COMPONENT
// ============================================================================

export function Card({
  children,
  variant = 'elevated',
  size = 'md',
  pressable = false,
  onPress,
  style,
}: CardProps) {
  const scale = useSharedValue(1);
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  const handlePressIn = useCallback(() => {
    if (pressable) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  }, [pressable, scale]);

  const handlePressOut = useCallback(() => {
    if (pressable) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  }, [pressable, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (pressable) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.base,
          variantStyle,
          { padding: sizeStyle.padding, borderRadius: sizeStyle.borderRadius },
          animatedStyle,
          style,
        ]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View
      style={[
        styles.base,
        variantStyle,
        { padding: sizeStyle.padding, borderRadius: sizeStyle.borderRadius },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ============================================================================
// RECIPE CARD COMPONENT
// ============================================================================

export function RecipeCard({
  id,
  thumbnail,
  title,
  author,
  cookTime,
  likes,
  tags,
  onPress,
  style,
}: RecipeCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imageSource = typeof thumbnail === 'string' ? { uri: thumbnail } : thumbnail;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.recipeCard, animatedStyle, style]}
    >
      {/* Thumbnail */}
      <View style={styles.recipeThumbnailContainer}>
        <Image
          source={imageSource}
          style={styles.recipeThumbnail}
          contentFit="cover"
          transition={200}
        />
        {/* Duration Badge */}
        {cookTime && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{cookTime}분</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.recipeAuthor}>{author}</Text>

        {/* Footer */}
        <View style={styles.recipeFooter}>
          {/* Tags */}
          {tags && tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tagBadge}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Likes */}
          {likes !== undefined && (
            <View style={styles.likesContainer}>
              <Text style={styles.likesIcon}>♥</Text>
              <Text style={styles.likesText}>{formatNumber(likes)}</Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

// ============================================================================
// GROUP CARD COMPONENT
// ============================================================================

export function GroupCard({
  id,
  image,
  name,
  description,
  memberCount,
  lastActive,
  onPress,
  style,
}: GroupCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imageSource = typeof image === 'string' ? { uri: image } : image;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.groupCard, animatedStyle, style]}
    >
      {/* Group Image */}
      <View style={styles.groupImageContainer}>
        {image ? (
          <Image
            source={imageSource}
            style={styles.groupImage}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.groupImagePlaceholder}>
            <Text style={styles.groupImagePlaceholderText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.groupContent}>
        <Text style={styles.groupName} numberOfLines={1}>
          {name}
        </Text>
        {description && (
          <Text style={styles.groupDescription} numberOfLines={2}>
            {description}
          </Text>
        )}

        {/* Meta Info */}
        <View style={styles.groupMeta}>
          <Text style={styles.groupMetaText}>
            멤버 {memberCount}명
          </Text>
          {lastActive && (
            <>
              <Text style={styles.groupMetaDot}>•</Text>
              <Text style={styles.groupMetaText}>{lastActive}</Text>
            </>
          )}
        </View>
      </View>

      {/* Chevron */}
      <View style={styles.groupChevron}>
        <Text style={styles.groupChevronText}>›</Text>
      </View>
    </AnimatedPressable>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '만';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  // Base Card
  base: {
    overflow: 'hidden',
  },

  // Recipe Card
  recipeCard: {
    backgroundColor: SemanticColors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  recipeThumbnailContainer: {
    position: 'relative',
    aspectRatio: 16 / 10,
    backgroundColor: Colors.neutral[200],
  },
  recipeThumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.overlay.dark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.sm,
  },
  durationText: {
    color: Colors.neutral[0],
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  recipeContent: {
    padding: Spacing.base,
  },
  recipeTitle: {
    ...TextStyles.h4,
    marginBottom: Spacing.xxs,
  },
  recipeAuthor: {
    ...TextStyles.bodySmall,
    color: Colors.neutral[500],
    marginBottom: Spacing.sm,
  },
  recipeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flex: 1,
  },
  tagBadge: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    color: Colors.primary[600],
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxs,
  },
  likesIcon: {
    color: Colors.primary[500],
    fontSize: Typography.fontSize.sm,
  },
  likesText: {
    ...TextStyles.labelSmall,
    color: Colors.neutral[500],
  },

  // Group Card
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SemanticColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  groupImageContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  groupImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupImagePlaceholderText: {
    color: Colors.primary[600],
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  groupContent: {
    flex: 1,
  },
  groupName: {
    ...TextStyles.h4,
    marginBottom: Spacing.xxs,
  },
  groupDescription: {
    ...TextStyles.bodySmall,
    color: Colors.neutral[500],
    marginBottom: Spacing.xs,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMetaText: {
    ...TextStyles.caption,
  },
  groupMetaDot: {
    ...TextStyles.caption,
    marginHorizontal: Spacing.xs,
  },
  groupChevron: {
    justifyContent: 'center',
  },
  groupChevronText: {
    color: Colors.neutral[400],
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.regular,
  },
});

export default Card;
