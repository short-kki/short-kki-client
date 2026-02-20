import React, { useRef, useEffect, useCallback } from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { Users, ShoppingCart } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Typography, Spacing } from "@/constants/design-system";
import type { Group } from "@/data/mock";

const GROUP_ITEM_HEIGHT = 73; // paddingVertical(12*2) + avatar(48) + border(1)
const GROUP_LIST_VISIBLE_COUNT = 2;
const SHEET_TRANSLATE_Y = 400;

export interface GroupSelectBottomSheetProps {
  visible: boolean;
  groups: Group[];
  loading?: boolean;
  onSelect: (groupId: string, groupName: string) => void;
  onClose: () => void;
}

export default function GroupSelectBottomSheet({
  visible,
  groups,
  loading = false,
  onSelect,
  onClose,
}: GroupSelectBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_TRANSLATE_Y)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, overlayOpacity, sheetTranslateY]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: SHEET_TRANSLATE_Y,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [overlayOpacity, sheetTranslateY, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={close}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        {/* 오버레이 */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: overlayOpacity,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={close} />
        </Animated.View>

        {/* 시트 */}
        <Animated.View
          style={{
            transform: [{ translateY: sheetTranslateY }],
            backgroundColor: Colors.neutral[0],
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 8,
            paddingBottom: insets.bottom + 20,
          }}
        >
          {/* 핸들 바 */}
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: Colors.neutral[300],
                borderRadius: 2,
              }}
            />
          </View>

          {/* 제목 */}
          <View style={{ paddingHorizontal: 20, marginBottom: Spacing.md }}>
            <Text
              style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: "700",
                color: Colors.neutral[900],
              }}
            >
              장보기 목록에 추가
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.neutral[500],
                marginTop: 4,
              }}
            >
              어느 그룹의 장보기 목록에 추가할까요?
            </Text>
          </View>

          {/* 그룹 목록 */}
          {loading ? (
            <View style={{ padding: Spacing.xl, alignItems: "center" }}>
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            </View>
          ) : (
            <ScrollView
              style={{ height: GROUP_ITEM_HEIGHT * GROUP_LIST_VISIBLE_COUNT }}
            >
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  onPress={() => onSelect(group.id, group.name)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: Spacing.md,
                    paddingHorizontal: Spacing.xl,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.neutral[100],
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: Colors.primary[100],
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: Spacing.md,
                    }}
                  >
                    <Users size={24} color={Colors.primary[600]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.base,
                        fontWeight: "600",
                        color: Colors.neutral[900],
                      }}
                    >
                      {group.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        color: Colors.neutral[500],
                        marginTop: 2,
                      }}
                    >
                      {group.memberCount}명
                    </Text>
                  </View>
                  <ShoppingCart size={20} color={Colors.neutral[400]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
