import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Users, UserPlus, AlertCircle, CheckCircle } from "lucide-react-native";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/design-system";
import { getGroupPreviewByInviteCode, joinGroupByInviteCode } from "@/hooks";
import { useAuth } from "@/contexts/AuthContext";

type JoinStatus = "loading" | "preview" | "joining" | "success" | "error" | "already_joined";

interface GroupPreview {
  id: string;
  name: string;
  description: string | null;
  thumbnailImgUrl: string | null;
  groupType: string;
  memberCount: number;
}

export default function GroupInviteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { inviteCode } = useLocalSearchParams<{ inviteCode: string }>();
  const { isAuthenticated } = useAuth();

  const [status, setStatus] = useState<JoinStatus>("loading");
  const [groupPreview, setGroupPreview] = useState<GroupPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // 그룹 미리보기 로드
  useEffect(() => {
    if (!inviteCode) {
      setStatus("error");
      setErrorMessage("유효하지 않은 초대 링크입니다.");
      return;
    }

    loadGroupPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  const loadGroupPreview = async () => {
    try {
      setStatus("loading");
      const preview = await getGroupPreviewByInviteCode(inviteCode!);
      setGroupPreview(preview);
      setStatus("preview");
    } catch (err) {
      const error = err as Error;
      if (error.message.includes("GROUP_005") || error.message.includes("유효하지 않은")) {
        setErrorMessage("유효하지 않은 초대 코드입니다.");
      } else if (error.message.includes("GROUP_009") || error.message.includes("만료")) {
        setErrorMessage("만료된 초대 링크입니다.");
      } else {
        setErrorMessage("그룹 정보를 불러올 수 없습니다.");
      }
      setStatus("error");
    }
  };

  const handleJoinGroup = async () => {
    // 로그인 필요
    if (!isAuthenticated) {
      router.replace({
        pathname: "/login",
        params: { redirect: `/group/invite/${inviteCode}` },
      });
      return;
    }

    try {
      setStatus("joining");
      const joinedGroup = await joinGroupByInviteCode(inviteCode!);
      // 참여한 그룹 정보로 업데이트 (ID 확보)
      if (joinedGroup) {
        setGroupPreview((prev) => prev ? { ...prev, id: joinedGroup.id } : null);
      }
      setStatus("success");
    } catch (err) {
      const error = err as Error;
      if (error.message.includes("GROUP_004") || error.message.includes("이미 가입")) {
        setStatus("already_joined");
      } else if (error.message.includes("GROUP_005")) {
        setErrorMessage("유효하지 않은 초대 코드입니다.");
        setStatus("error");
      } else if (error.message.includes("GROUP_009")) {
        setErrorMessage("만료된 초대 링크입니다.");
        setStatus("error");
      } else {
        setErrorMessage("그룹 참여에 실패했습니다. 다시 시도해주세요.");
        setStatus("error");
      }
    }
  };

  const handleGoToGroup = () => {
    // 그룹 상세 페이지로 이동
    if (groupPreview?.id) {
      router.replace({
        pathname: "/(tabs)/group",
        params: { groupId: groupPreview.id, _t: Date.now().toString() },
      });
    } else {
      router.replace("/(tabs)/group");
    }
  };

  const handleGoHome = () => {
    router.replace("/(tabs)");
  };

  const getGroupTypeLabel = (type: string) => {
    switch (type) {
      case "COUPLE":
        return "커플";
      case "FAMILY":
        return "가족";
      case "FRIENDS":
        return "친구";
      default:
        return "기타";
    }
  };

  // 로딩 상태
  if (status === "loading") {
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
        <Text
          style={{
            marginTop: Spacing.md,
            fontSize: Typography.fontSize.base,
            color: Colors.neutral[500],
          }}
        >
          초대 정보를 불러오는 중...
        </Text>
      </View>
    );
  }

  // 에러 상태
  if (status === "error") {
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
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: Colors.error.light,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: Spacing.lg,
          }}
        >
          <AlertCircle size={40} color={Colors.error.main} />
        </View>
        <Text
          style={{
            fontSize: Typography.fontSize.xl,
            fontWeight: "700",
            color: Colors.neutral[900],
            textAlign: "center",
            marginBottom: Spacing.sm,
          }}
        >
          초대 링크 오류
        </Text>
        <Text
          style={{
            fontSize: Typography.fontSize.base,
            color: Colors.neutral[500],
            textAlign: "center",
            marginBottom: Spacing.xl,
          }}
        >
          {errorMessage}
        </Text>
        <TouchableOpacity
          onPress={handleGoHome}
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary[500],
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: BorderRadius.lg,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.base,
              fontWeight: "600",
              color: "#FFF",
            }}
          >
            홈으로 가기
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 성공 상태
  if (status === "success") {
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
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: Colors.success.light,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: Spacing.lg,
          }}
        >
          <CheckCircle size={40} color={Colors.success.main} />
        </View>
        <Text
          style={{
            fontSize: Typography.fontSize.xl,
            fontWeight: "700",
            color: Colors.neutral[900],
            textAlign: "center",
            marginBottom: Spacing.sm,
          }}
        >
          그룹에 참여했습니다!
        </Text>
        <Text
          style={{
            fontSize: Typography.fontSize.base,
            color: Colors.neutral[500],
            textAlign: "center",
            marginBottom: Spacing.xl,
          }}
        >
          {groupPreview?.name} 그룹의 멤버가 되었습니다.
        </Text>
        <TouchableOpacity
          onPress={handleGoToGroup}
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary[500],
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: BorderRadius.lg,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.base,
              fontWeight: "600",
              color: "#FFF",
            }}
          >
            그룹으로 가기
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 이미 가입된 상태
  if (status === "already_joined") {
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
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: Colors.info.light,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: Spacing.lg,
          }}
        >
          <Users size={40} color={Colors.info.main} />
        </View>
        <Text
          style={{
            fontSize: Typography.fontSize.xl,
            fontWeight: "700",
            color: Colors.neutral[900],
            textAlign: "center",
            marginBottom: Spacing.sm,
          }}
        >
          이미 참여 중인 그룹입니다
        </Text>
        <Text
          style={{
            fontSize: Typography.fontSize.base,
            color: Colors.neutral[500],
            textAlign: "center",
            marginBottom: Spacing.xl,
          }}
        >
          {groupPreview?.name} 그룹에 이미 가입되어 있습니다.
        </Text>
        <TouchableOpacity
          onPress={handleGoToGroup}
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary[500],
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: BorderRadius.lg,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.base,
              fontWeight: "600",
              color: "#FFF",
            }}
          >
            그룹으로 가기
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 미리보기 & 참여 화면
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.neutral[50],
        paddingTop: insets.top,
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: Spacing.xl,
        }}
      >
        {/* 그룹 썸네일 */}
        {groupPreview?.thumbnailImgUrl ? (
          <Image
            source={{ uri: groupPreview.thumbnailImgUrl }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              marginBottom: Spacing.lg,
            }}
            contentFit="cover"
          />
        ) : (
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              backgroundColor: Colors.primary[100],
              justifyContent: "center",
              alignItems: "center",
              marginBottom: Spacing.lg,
            }}
          >
            <Users size={48} color={Colors.primary[500]} />
          </View>
        )}

        {/* 그룹 정보 */}
        <Text
          style={{
            fontSize: Typography.fontSize["2xl"],
            fontWeight: "700",
            color: Colors.neutral[900],
            textAlign: "center",
            marginBottom: Spacing.xs,
          }}
        >
          {groupPreview?.name}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: Spacing.sm,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.neutral[100],
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: BorderRadius.full,
            }}
          >
            <Text
              style={{
                fontSize: Typography.fontSize.sm,
                color: Colors.neutral[600],
              }}
            >
              {getGroupTypeLabel(groupPreview?.groupType || "")}
            </Text>
          </View>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              color: Colors.neutral[500],
            }}
          >
            멤버 {groupPreview?.memberCount}명
          </Text>
        </View>

        {groupPreview?.description && (
          <Text
            style={{
              fontSize: Typography.fontSize.base,
              color: Colors.neutral[600],
              textAlign: "center",
              marginBottom: Spacing.lg,
            }}
          >
            {groupPreview.description}
          </Text>
        )}

        {/* 초대 메시지 */}
        <View
          style={{
            backgroundColor: Colors.neutral[100],
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            marginTop: Spacing.md,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              color: Colors.neutral[600],
              textAlign: "center",
            }}
          >
            이 그룹에 초대받으셨습니다
          </Text>
        </View>
      </View>

      {/* 하단 버튼 */}
      <View
        style={{
          paddingHorizontal: Spacing.xl,
          paddingBottom: insets.bottom + Spacing.lg,
          paddingTop: Spacing.lg,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={handleJoinGroup}
          activeOpacity={0.8}
          disabled={status === "joining"}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: status === "joining" ? Colors.primary[300] : Colors.primary[500],
            paddingVertical: 16,
            borderRadius: BorderRadius.lg,
            gap: 8,
          }}
        >
          {status === "joining" ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <UserPlus size={20} color="#FFF" />
          )}
          <Text
            style={{
              fontSize: Typography.fontSize.base,
              fontWeight: "600",
              color: "#FFF",
            }}
          >
            {status === "joining" ? "참여 중..." : "그룹 참여하기"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleGoHome}
          activeOpacity={0.7}
          style={{
            alignItems: "center",
            paddingVertical: 12,
          }}
        >
          <Text
            style={{
              fontSize: Typography.fontSize.base,
              color: Colors.neutral[500],
            }}
          >
            나중에 할게요
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
