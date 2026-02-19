/**
 * Member Profile API Service
 *
 * 회원 프로필 조회/수정 API
 * @see docs/member-profile-api.md
 */

import { api, USE_MOCK } from './api';

// ============================================================================
// TYPES
// ============================================================================

export interface MemberProfile {
  id: number;
  email: string;
  name: string;
  profileImgFileId: number | null;
  profileImgUrl: string | null;
}

export interface ProfileUpdateRequest {
  name: string;
  profileImgFileId: number | null;
}

interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockProfile: MemberProfile = {
  id: 1,
  email: 'user@example.com',
  name: '요리조리',
  profileImgFileId: null,
  profileImgUrl: 'https://i.pravatar.cc/200?img=10',
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * 내 프로필 조회
 * GET /api/v1/members/profile
 */
export async function getMyProfile(): Promise<MemberProfile> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockProfile;
  }

  const response = await api.get<ApiResponse<MemberProfile>>(
    '/api/v1/members/profile'
  );
  return response.data;
}

/**
 * 내 프로필 수정
 * PATCH /api/v1/members/profile
 */
export async function updateMyProfile(
  request: ProfileUpdateRequest
): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Mock에서는 로컬 데이터만 업데이트
    mockProfile.name = request.name;
    mockProfile.profileImgFileId = request.profileImgFileId;
    return;
  }

  await api.patch<ApiResponse<null>>('/api/v1/members/profile', request);
}

/**
 * 회원 탈퇴
 * DELETE /api/v1/members
 */
export async function deleteMyAccount(): Promise<void> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return;
  }

  await api.delete<ApiResponse<null>>('/api/v1/members');
}

export default {
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
};
