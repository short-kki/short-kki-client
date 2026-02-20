import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  UserPlus,
  MoreVertical,
  Crown,
  Shield,
  User,
  UserMinus,
  ShieldCheck,
  ShieldOff,
} from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { useGroupMembers, getGroupInviteCode } from "@/hooks";

// 딥링크 베이스 URL
const INVITE_BASE_URL = "https://shortkki.com";

// 멤버 역할 타입
type MemberRole = "owner" | "admin" | "member";

// 멤버 데이터 타입
interface Member {
  id: string;
  name: string;
  avatar: string | null;
  role: MemberRole;
  joinedAt: string;
}

// 날짜 포맷 함수 (YYYY-MM-DDTHH:mm:ss -> YYYY.MM.DD)
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

// 역할 배지 컴포넌트
function RoleBadge({ role }: { role: MemberRole }) {
  const getRoleConfig = () => {
    switch (role) {
      case "owner":
        return {
          icon: Crown,
          label: "방장",
          bgColor: Colors.secondary[100],
          textColor: Colors.secondary[700],
          iconColor: Colors.secondary[600],
        };
      case "admin":
        return {
          icon: Shield,
          label: "관리자",
          bgColor: Colors.primary[100],
          textColor: Colors.primary[700],
          iconColor: Colors.primary[600],
        };
      default:
        return null;
    }
  };

  const config = getRoleConfig();
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: config.bgColor,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        gap: 4,
      }}
    >
      <IconComponent size={12} color={config.iconColor} />
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: config.textColor,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}

// 멤버 카드 컴포넌트
function MemberCard({
  member,
  onMenuPress,
  isCurrentUser,
  canShowMenu,
}: {
  member: Member;
  onMenuPress: () => void;
  isCurrentUser: boolean;
  canShowMenu: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.neutral[0],
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: Colors.neutral[100],
      }}
    >
      {/* 아바타 */}
      {member.avatar ? (
        <Image
          source={{ uri: member.avatar }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
          }}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: Colors.primary[100],
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <User size={24} color={Colors.primary[500]} />
        </View>
      )}

      {/* 정보 */}
      <View style={{ flex: 1, marginLeft: Spacing.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontSize: Typography.fontSize.base,
              fontWeight: "600",
              color: Colors.neutral[900],
            }}
          >
            {member.name}
            {isCurrentUser && (
              <Text style={{ color: Colors.neutral[400] }}> (나)</Text>
            )}
          </Text>
          <RoleBadge role={member.role} />
        </View>
        <Text
          style={{
            fontSize: Typography.fontSize.sm,
            color: Colors.neutral[500],
            marginTop: 2,
          }}
        >
          {formatDate(member.joinedAt)} 가입
        </Text>
      </View>

      {/* 메뉴 버튼 (관리자/방장만 볼 수 있고, 방장인 멤버에게는 표시 안함) */}
      {canShowMenu && member.role !== "owner" && (
        <TouchableOpacity
          onPress={onMenuPress}
          style={{ padding: 8 }}
          activeOpacity={0.7}
        >
          <MoreVertical size={20} color={Colors.neutral[400]} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function GroupMembersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId: string; groupName: string }>();

  const groupId = params.groupId || "1";
  const groupName = params.groupName || "그룹";

  // API에서 멤버 목록 조회
  const { members: apiMembers, loading, error, refetch } = useGroupMembers(groupId);

  // API 응답을 화면용 타입으로 변환
  const members: Member[] = apiMembers.map((m) => ({
    id: m.id,
    name: m.name,
    avatar: m.profileImgUrl,
    role: m.role as MemberRole,
    joinedAt: m.joinedAt,
  }));

  const [showMemberMenuModal, setShowMemberMenuModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // 현재 사용자 ID (실제로는 AuthContext에서 가져옴)
  // TODO: AuthContext에서 현재 사용자 정보 가져오기
  const currentUserId = "";

  // 현재 사용자의 역할 확인 (첫 번째 ADMIN을 방장으로 간주)
  const currentUser = members.find((m) => m.id === currentUserId);
  const currentUserRole = currentUser?.role || "member";
  const isAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  const handleMemberMenuPress = (member: Member) => {
    setSelectedMember(member);
    setShowMemberMenuModal(true);
  };

  const handleMemberMenuAction = (action: "makeAdmin" | "removeAdmin" | "kick") => {
    if (!selectedMember) return;

    setShowMemberMenuModal(false);

    setTimeout(() => {
      switch (action) {
        case "makeAdmin":
          Alert.alert(
            "관리자 지정",
            `${selectedMember.name}님을 관리자로 지정하시겠습니까?`,
            [
              { text: "취소", style: "cancel" },
              { text: "확인", onPress: () => Alert.alert("완료", "관리자로 지정되었습니다.") },
            ]
          );
          break;
        case "removeAdmin":
          Alert.alert(
            "관리자 해제",
            `${selectedMember.name}님의 관리자 권한을 해제하시겠습니까?`,
            [
              { text: "취소", style: "cancel" },
              { text: "확인", onPress: () => Alert.alert("완료", "관리자 권한이 해제되었습니다.") },
            ]
          );
          break;
        case "kick":
          Alert.alert(
            "멤버 내보내기",
            `${selectedMember.name}님을 그룹에서 내보내시겠습니까?`,
            [
              { text: "취소", style: "cancel" },
              {
                text: "내보내기",
                style: "destructive",
                onPress: () => Alert.alert("완료", "멤버가 그룹에서 내보내졌습니다."),
              },
            ]
          );
          break;
      }
    }, 200);
  };

  const [inviteLoading, setInviteLoading] = useState(false);

  const handleInvite = async () => {
    try {
      setInviteLoading(true);

      // API에서 초대 코드 받기
      const inviteCode = await getGroupInviteCode(groupId);

      // 딥링크 URL 생성
      const inviteUrl = `${INVITE_BASE_URL}/group/invite/${inviteCode}`;

      // 시스템 공유 시트 열기
      // iOS: url을 별도로 전달하면 메시지와 링크가 분리됨
      // Android: url 파라미터가 없으므로 message에 포함해야 함
      await Share.share(
        Platform.OS === "ios"
          ? {
              message: `${groupName} 그룹에 초대합니다!`,
              url: inviteUrl,
            }
          : {
              message: `${groupName} 그룹에 초대합니다!\n${inviteUrl}`,
            }
      );
    } catch (err) {
      // 사용자가 공유를 취소한 경우는 에러로 처리하지 않음
      if ((err as Error).message !== "User did not share") {
        Alert.alert("오류", "초대 링크를 생성할 수 없습니다. 다시 시도해주세요.");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  // 역할별로 멤버 정렬 (방장 > 관리자 > 일반)
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder: Record<MemberRole, number> = { owner: 0, admin: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  // 로딩 상태
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.neutral[50],
          paddingTop: insets.top,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary[500]} />
        <Text style={{ marginTop: Spacing.md, color: Colors.neutral[500] }}>
          멤버 목록을 불러오는 중...
        </Text>
      </View>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.neutral[50],
          paddingTop: insets.top,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: Spacing.xl,
        }}
      >
        <User size={48} color={Colors.neutral[300]} />
        <Text
          style={{
            fontSize: Typography.fontSize.lg,
            fontWeight: "600",
            color: Colors.neutral[500],
            marginTop: Spacing.md,
            textAlign: "center",
          }}
        >
          멤버 목록을 불러올 수 없습니다
        </Text>
        <TouchableOpacity
          onPress={refetch}
          style={{
            marginTop: Spacing.lg,
            backgroundColor: Colors.primary[500],
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: BorderRadius.lg,
          }}
        >
          <Text style={{ color: "#FFF", fontWeight: "600" }}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.neutral[50],
        paddingTop: insets.top,
      }}
    >
      {/* 헤더 */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.neutral[100],
          backgroundColor: Colors.neutral[0],
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 8, marginRight: 8 }}
          >
            <ArrowLeft size={24} color={Colors.neutral[900]} />
          </Pressable>
          <View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: Colors.neutral[900],
              }}
            >
              멤버 관리
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: Colors.neutral[500],
                marginTop: 2,
              }}
            >
              {groupName} · {members.length}명
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleInvite}
          activeOpacity={0.7}
          disabled={inviteLoading}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: inviteLoading ? Colors.primary[300] : Colors.primary[500],
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: BorderRadius.full,
            gap: 6,
          }}
        >
          {inviteLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <UserPlus size={18} color="#FFF" />
          )}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#FFF",
            }}
          >
            초대
          </Text>
        </TouchableOpacity>
      </View>

      {/* 멤버 목록 */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {sortedMembers.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onMenuPress={() => handleMemberMenuPress(member)}
            isCurrentUser={member.id === currentUserId}
            canShowMenu={isAdmin}
          />
        ))}

        {members.length === 0 && (
          <View
            style={{
              alignItems: "center",
              paddingVertical: Spacing["4xl"],
            }}
          >
            <User size={48} color={Colors.neutral[300]} />
            <Text
              style={{
                fontSize: Typography.fontSize.lg,
                fontWeight: "600",
                color: Colors.neutral[500],
                marginTop: Spacing.md,
              }}
            >
              멤버가 없습니다
            </Text>
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.neutral[400],
                marginTop: Spacing.xs,
              }}
            >
              초대 버튼을 눌러 멤버를 추가하세요
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 멤버 메뉴 바텀시트 */}
      <Modal visible={showMemberMenuModal} transparent animationType="slide">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          onPress={() => setShowMemberMenuModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: Colors.neutral[0],
              borderTopLeftRadius: BorderRadius.xl,
              borderTopRightRadius: BorderRadius.xl,
              paddingTop: Spacing.md,
              paddingBottom: insets.bottom + Spacing.lg,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* 핸들바 */}
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: Colors.neutral[300],
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: Spacing.lg,
              }}
            />

            {/* 멤버 정보 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: Spacing.xl,
                paddingBottom: Spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: Colors.neutral[100],
              }}
            >
              {selectedMember && (
                <>
                  {selectedMember.avatar ? (
                    <Image
                      source={{ uri: selectedMember.avatar }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                      }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: Colors.primary[100],
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <User size={24} color={Colors.primary[500]} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text
                        style={{
                          fontSize: Typography.fontSize.lg,
                          fontWeight: "700",
                          color: Colors.neutral[900],
                        }}
                      >
                        {selectedMember.name}
                      </Text>
                      <RoleBadge role={selectedMember.role} />
                    </View>
                    <Text
                      style={{
                        fontSize: Typography.fontSize.sm,
                        color: Colors.neutral[500],
                        marginTop: 2,
                      }}
                    >
                      {formatDate(selectedMember.joinedAt)} 가입
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* 메뉴 옵션들 */}
            <View style={{ paddingTop: Spacing.sm }}>
              {/* 관리자 지정/해제 */}
              {selectedMember?.role === "admin" ? (
                <TouchableOpacity
                  onPress={() => handleMemberMenuAction("removeAdmin")}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: Spacing.md,
                    paddingHorizontal: Spacing.xl,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: Colors.neutral[100],
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ShieldOff size={20} color={Colors.neutral[700]} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: Typography.fontSize.base,
                      fontWeight: "500",
                      color: Colors.neutral[900],
                      marginLeft: Spacing.md,
                    }}
                  >
                    관리자 해제
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => handleMemberMenuAction("makeAdmin")}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: Spacing.md,
                    paddingHorizontal: Spacing.xl,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: Colors.primary[100],
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ShieldCheck size={20} color={Colors.primary[600]} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: Typography.fontSize.base,
                      fontWeight: "500",
                      color: Colors.neutral[900],
                      marginLeft: Spacing.md,
                    }}
                  >
                    관리자로 지정
                  </Text>
                </TouchableOpacity>
              )}

              {/* 내보내기 */}
              <TouchableOpacity
                onPress={() => handleMemberMenuAction("kick")}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.xl,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: Colors.error.light,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <UserMinus size={20} color={Colors.error.main} />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: Typography.fontSize.base,
                    fontWeight: "500",
                    color: Colors.error.main,
                    marginLeft: Spacing.md,
                  }}
                >
                  그룹에서 내보내기
                </Text>
              </TouchableOpacity>
            </View>

            {/* 취소 버튼 */}
            <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.md }}>
              <TouchableOpacity
                onPress={() => setShowMemberMenuModal(false)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: Colors.neutral[100],
                  borderRadius: BorderRadius.lg,
                  paddingVertical: Spacing.md,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.fontSize.base,
                    fontWeight: "600",
                    color: Colors.neutral[700],
                  }}
                >
                  취소
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
