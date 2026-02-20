/**
 * Design System Showcase
 *
 * 숏끼 디자인 시스템의 모든 컴포넌트를 확인할 수 있는 쇼케이스 스크린
 * 개발 중에 /design-showcase로 접근하여 컴포넌트들을 확인할 수 있습니다.
 */

import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Heart, Plus, ChefHat, Flame, Leaf } from 'lucide-react-native';

import {
  Button,
  Input,
  Card,
  RecipeCard,
  GroupCard,
  Header,
  LargeHeader,
  Tag,
  TagGroup,
  CategoryTag,
} from '@/components/ui';
import {
  Colors,
  Spacing,
  Typography,
  TextStyles,
  SemanticColors,
} from '@/constants/design-system';

export default function DesignShowcaseScreen() {
  const insets = useSafeAreaInsets();
  const [inputValue, setInputValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['한식']);

  const handleTagPress = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="디자인 시스템"
        subtitle="Shortkki"
        showBackButton
        showBorder
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================ */}
        {/* COLOR PALETTE */}
        {/* ============================================================ */}
        <Section title="컬러 팔레트">
          <Text style={styles.subheading}>Primary (Warm Coral)</Text>
          <View style={styles.colorRow}>
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
              <View
                key={shade}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: Colors.primary[shade as keyof typeof Colors.primary] },
                ]}
              >
                <Text
                  style={[
                    styles.colorLabel,
                    shade >= 500 && { color: Colors.neutral[0] },
                  ]}
                >
                  {shade}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.subheading}>Secondary (Warm Yellow)</Text>
          <View style={styles.colorRow}>
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
              <View
                key={shade}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: Colors.secondary[shade as keyof typeof Colors.secondary] },
                ]}
              >
                <Text
                  style={[
                    styles.colorLabel,
                    shade >= 600 && { color: Colors.neutral[0] },
                  ]}
                >
                  {shade}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.subheading}>Neutral (Warm Gray)</Text>
          <View style={styles.colorRow}>
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
              <View
                key={shade}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: Colors.neutral[shade as keyof typeof Colors.neutral] },
                ]}
              >
                <Text
                  style={[
                    styles.colorLabel,
                    shade >= 500 && { color: Colors.neutral[0] },
                  ]}
                >
                  {shade}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.subheading}>Semantic</Text>
          <View style={styles.colorRow}>
            <View style={[styles.colorSwatchLarge, { backgroundColor: Colors.success.main }]}>
              <Text style={[styles.colorLabel, { color: Colors.neutral[0] }]}>Success</Text>
            </View>
            <View style={[styles.colorSwatchLarge, { backgroundColor: Colors.warning.main }]}>
              <Text style={styles.colorLabel}>Warning</Text>
            </View>
            <View style={[styles.colorSwatchLarge, { backgroundColor: Colors.error.main }]}>
              <Text style={[styles.colorLabel, { color: Colors.neutral[0] }]}>Error</Text>
            </View>
            <View style={[styles.colorSwatchLarge, { backgroundColor: Colors.info.main }]}>
              <Text style={[styles.colorLabel, { color: Colors.neutral[0] }]}>Info</Text>
            </View>
          </View>
        </Section>

        {/* ============================================================ */}
        {/* TYPOGRAPHY */}
        {/* ============================================================ */}
        <Section title="타이포그래피">
          <Text style={TextStyles.displayLarge}>Display Large</Text>
          <Text style={TextStyles.displayMedium}>Display Medium</Text>
          <Text style={TextStyles.h1}>Heading 1 - 숏끼</Text>
          <Text style={TextStyles.h2}>Heading 2 - 레시피 공유</Text>
          <Text style={TextStyles.h3}>Heading 3 - 오늘의 요리</Text>
          <Text style={TextStyles.h4}>Heading 4 - 간단한 볶음밥</Text>
          <View style={styles.spacer} />
          <Text style={TextStyles.bodyLarge}>Body Large - 맛있는 요리를 함께 만들어요</Text>
          <Text style={TextStyles.bodyMedium}>Body Medium - 신선한 재료로 건강한 한 끼</Text>
          <Text style={TextStyles.bodySmall}>Body Small - 조리시간 15분 · 난이도 쉬움</Text>
          <View style={styles.spacer} />
          <Text style={TextStyles.labelLarge}>Label Large</Text>
          <Text style={TextStyles.labelMedium}>Label Medium</Text>
          <Text style={TextStyles.labelSmall}>Label Small</Text>
          <Text style={TextStyles.caption}>Caption - 2시간 전</Text>
        </Section>

        {/* ============================================================ */}
        {/* BUTTONS */}
        {/* ============================================================ */}
        <Section title="버튼">
          <Text style={styles.subheading}>Variants</Text>
          <View style={styles.buttonRow}>
            <Button variant="primary" onPress={() => {}}>
              Primary
            </Button>
            <Button variant="secondary" onPress={() => {}}>
              Secondary
            </Button>
            <Button variant="ghost" onPress={() => {}}>
              Ghost
            </Button>
            <Button variant="danger" onPress={() => {}}>
              Danger
            </Button>
          </View>

          <Text style={styles.subheading}>Sizes</Text>
          <View style={styles.buttonColumn}>
            <Button size="sm" onPress={() => {}}>
              Small Button
            </Button>
            <Button size="md" onPress={() => {}}>
              Medium Button
            </Button>
            <Button size="lg" onPress={() => {}}>
              Large Button
            </Button>
            <Button size="xl" fullWidth onPress={() => {}}>
              Extra Large (Full Width)
            </Button>
          </View>

          <Text style={styles.subheading}>States</Text>
          <View style={styles.buttonRow}>
            <Button disabled onPress={() => {}}>
              Disabled
            </Button>
            <Button loading onPress={() => {}}>
              Loading
            </Button>
          </View>

          <Text style={styles.subheading}>With Icons</Text>
          <View style={styles.buttonColumn}>
            <Button
              leftIcon={<Plus size={20} color={Colors.neutral[0]} />}
              onPress={() => {}}
            >
              레시피 추가
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Heart size={20} color={Colors.neutral[800]} />}
              onPress={() => {}}
            >
              좋아요
            </Button>
          </View>
        </Section>

        {/* ============================================================ */}
        {/* INPUT FIELDS */}
        {/* ============================================================ */}
        <Section title="입력 필드">
          <Input
            label="레시피 이름"
            placeholder="예: 김치볶음밥"
            value={inputValue}
            onChangeText={setInputValue}
          />

          <Input
            label="검색"
            placeholder="레시피 검색..."
            leftIcon={<Search size={20} color={Colors.neutral[400]} />}
          />

          <Input
            label="조리 시간"
            placeholder="분 단위로 입력"
            hint="숫자만 입력해주세요"
            keyboardType="numeric"
          />

          <Input
            label="에러 상태"
            placeholder="에러 예시"
            error="필수 입력 항목입니다"
          />

          <Input
            label="비활성화"
            placeholder="수정할 수 없습니다"
            disabled
            value="비활성화된 입력"
          />

          <Text style={styles.subheading}>Sizes</Text>
          <Input size="sm" placeholder="Small Input" />
          <Input size="md" placeholder="Medium Input" />
          <Input size="lg" placeholder="Large Input" />
        </Section>

        {/* ============================================================ */}
        {/* TAGS */}
        {/* ============================================================ */}
        <Section title="태그">
          <Text style={styles.subheading}>Variants</Text>
          <View style={styles.tagRow}>
            <Tag variant="filled" color="primary">Filled</Tag>
            <Tag variant="outlined" color="primary">Outlined</Tag>
            <Tag variant="soft" color="primary">Soft</Tag>
          </View>

          <Text style={styles.subheading}>Colors</Text>
          <View style={styles.tagRow}>
            <Tag color="primary">Primary</Tag>
            <Tag color="secondary">Secondary</Tag>
            <Tag color="neutral">Neutral</Tag>
            <Tag color="success">Success</Tag>
            <Tag color="warning">Warning</Tag>
            <Tag color="error">Error</Tag>
          </View>

          <Text style={styles.subheading}>Sizes</Text>
          <View style={styles.tagRow}>
            <Tag size="sm">Small</Tag>
            <Tag size="md">Medium</Tag>
            <Tag size="lg">Large</Tag>
          </View>

          <Text style={styles.subheading}>Selectable Tag Group</Text>
          <TagGroup
            tags={['한식', '양식', '중식', '일식', '분식']}
            selectedTags={selectedTags}
            onTagPress={handleTagPress}
          />

          <Text style={styles.subheading}>Removable Tags</Text>
          <TagGroup
            tags={['계란', '양파', '당근', '파']}
            onTagRemove={(tag) => console.log('Remove:', tag)}
            tagProps={{ removable: true, color: 'neutral' }}
          />

          <Text style={styles.subheading}>Category Tags</Text>
          <View style={styles.categoryRow}>
            <CategoryTag
              name="한식"
              icon={<ChefHat size={18} color={Colors.neutral[500]} />}
            />
            <CategoryTag
              name="매운맛"
              icon={<Flame size={18} color={Colors.neutral[0]} />}
              selected
            />
            <CategoryTag
              name="채식"
              icon={<Leaf size={18} color={Colors.neutral[500]} />}
            />
          </View>
        </Section>

        {/* ============================================================ */}
        {/* CARDS */}
        {/* ============================================================ */}
        <Section title="카드">
          <Text style={styles.subheading}>Base Card</Text>
          <Card>
            <Text style={TextStyles.h4}>기본 카드</Text>
            <Text style={TextStyles.bodySmall}>
              카드 컴포넌트는 콘텐츠를 그룹화하고 구분하는 데 사용됩니다.
            </Text>
          </Card>

          <Text style={styles.subheading}>Card Variants</Text>
          <Card variant="elevated">
            <Text style={TextStyles.labelMedium}>Elevated</Text>
          </Card>
          <Card variant="outlined">
            <Text style={TextStyles.labelMedium}>Outlined</Text>
          </Card>
          <Card variant="filled">
            <Text style={TextStyles.labelMedium}>Filled</Text>
          </Card>

          <Text style={styles.subheading}>Recipe Card</Text>
          <RecipeCard
            id="1"
            thumbnail="https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400"
            title="초간단 계란 볶음밥"
            author="백종원"
            cookTime={15}
            likes={12400}
            tags={['#볶음밥', '#자취요리']}
            onPress={() => console.log('Recipe pressed')}
          />

          <RecipeCard
            id="2"
            thumbnail="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400"
            title="화덕 마르게리타 피자 만들기"
            author="이탈리안 셰프"
            cookTime={45}
            likes={8200}
            tags={['#피자', '#홈베이킹']}
            onPress={() => console.log('Recipe pressed')}
          />

          <Text style={styles.subheading}>Group Card</Text>
          <GroupCard
            id="1"
            name="자취생 요리 모임"
            description="간단하고 맛있는 자취 요리를 공유하는 그룹입니다"
            memberCount={1234}
            lastActive="방금 전"
            onPress={() => console.log('Group pressed')}
          />

          <GroupCard
            id="2"
            image="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=100"
            name="건강한 한 끼"
            description="영양 균형 잡힌 건강식 레시피"
            memberCount={567}
            lastActive="1시간 전"
            onPress={() => console.log('Group pressed')}
          />
        </Section>

        {/* ============================================================ */}
        {/* HEADERS */}
        {/* ============================================================ */}
        <Section title="헤더">
          <Text style={styles.subheading}>Large Header</Text>
          <View style={styles.headerPreview}>
            <LargeHeader
              title="오늘의 레시피"
              subtitle="새로운 요리를 발견하세요"
            />
          </View>

          <Text style={styles.subheading}>Default Header</Text>
          <View style={styles.headerPreview}>
            <Header
              title="레시피 상세"
              showBackButton
              includeSafeArea={false}
            />
          </View>

          <Text style={styles.subheading}>Header with Actions</Text>
          <View style={styles.headerPreview}>
            <Header
              title="내 레시피"
              rightElement={
                <Button size="sm" onPress={() => {}}>
                  저장
                </Button>
              }
              includeSafeArea={false}
            />
          </View>
        </Section>

        {/* ============================================================ */}
        {/* SPACING & RADIUS */}
        {/* ============================================================ */}
        <Section title="스페이싱 & 라운딩">
          <Text style={styles.subheading}>8pt Grid Spacing</Text>
          <View style={styles.spacingDemo}>
            {[8, 16, 24, 32, 40, 48].map((size) => (
              <View
                key={size}
                style={[
                  styles.spacingBox,
                  { width: size, height: size },
                ]}
              >
                <Text style={styles.spacingLabel}>{size}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.subheading}>Border Radius</Text>
          <View style={styles.radiusDemo}>
            {[
              { name: 'sm', value: 8 },
              { name: 'md', value: 12 },
              { name: 'base', value: 16 },
              { name: 'xl', value: 24 },
              { name: 'full', value: 50 },
            ].map((item) => (
              <View
                key={item.name}
                style={[styles.radiusBox, { borderRadius: item.value }]}
              >
                <Text style={styles.radiusLabel}>{item.name}</Text>
              </View>
            ))}
          </View>
        </Section>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// SECTION COMPONENT
// ============================================================================

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SemanticColors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing['2xl'],
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    ...TextStyles.h2,
    color: Colors.primary[500],
    marginBottom: Spacing.sm,
  },
  subheading: {
    ...TextStyles.labelMedium,
    color: SemanticColors.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  spacer: {
    height: Spacing.md,
  },

  // Colors
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  colorSwatch: {
    width: 56,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSwatchLarge: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral[700],
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  buttonColumn: {
    gap: Spacing.sm,
  },

  // Tags
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },

  // Headers
  headerPreview: {
    backgroundColor: Colors.neutral[100],
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Spacing Demo
  spacingDemo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  spacingBox: {
    backgroundColor: Colors.primary[200],
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacingLabel: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[700],
  },

  // Radius Demo
  radiusDemo: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  radiusBox: {
    width: 64,
    height: 64,
    backgroundColor: Colors.secondary[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.secondary[800],
  },
});
