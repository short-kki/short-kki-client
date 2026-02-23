/**
 * File Upload Service
 *
 * Presigned URL을 사용한 S3 파일 업로드 서비스
 * 흐름: 1) 업로드 URL 요청 → 2) S3 업로드 → 3) 업로드 완료 처리
 */

import { api, USE_MOCK } from './api';
import { API_BASE_URL } from '@/constants/env';
import { getAuthData } from '@/utils/auth-storage';

// ============================================================================
// TYPES
// ============================================================================

export type FileTargetType = 'MEMBER_PROFILE_IMG' | 'RECIPE_IMG' | 'FEED_IMG';
export type FileVisibility = 'PUBLIC' | 'PRIVATE';

interface UploadUrlRequest {
  filename: string;
  contentType: string;
  contentLength: number;
  visibility: FileVisibility;
  targetType: FileTargetType;
}

interface UploadUrlResponse {
  fileId: number;
  objectKey: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string>;
  expiresAt: string;
}

interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface UploadedFile {
  fileId: number;
  objectKey: string;
  url: string;
}

export interface ImagePickerAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number;
  height?: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * API Base URL 가져오기
 */
function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * 인증 헤더 가져오기
 */
async function getAuthHeader(): Promise<string> {
  const authData = await getAuthData();
  if (authData?.tokens?.accessToken) {
    return `Bearer ${authData.tokens.accessToken}`;
  }
  return '';
}

/**
 * URI에서 파일 정보 추출 (React Native용)
 */
async function getFileInfo(uri: string): Promise<{ blob: Blob; size: number }> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return { blob, size: blob.size };
}

/**
 * 파일명 생성
 */
function generateFilename(originalName: string | null | undefined, mimeType: string): string {
  const ext = mimeType.split('/')[1] || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  if (originalName) {
    const baseName = originalName.replace(/\.[^/.]+$/, ''); // 확장자 제거
    return `${baseName}_${timestamp}.${ext}`;
  }

  return `image_${timestamp}_${random}.${ext}`;
}

// ============================================================================
// UPLOAD SERVICE
// ============================================================================

/**
 * 단일 이미지 업로드
 */
export async function uploadImage(
  asset: ImagePickerAsset,
  targetType: FileTargetType = 'FEED_IMG',
  visibility: FileVisibility = 'PUBLIC'
): Promise<UploadedFile> {
  // Mock 모드
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      fileId: Date.now(),
      objectKey: `mock/${Date.now()}.jpg`,
      url: asset.uri,
    };
  }

  const mimeType = asset.mimeType || 'image/jpeg';
  const filename = generateFilename(asset.fileName, mimeType);

  // 파일 데이터 가져오기
  const { blob, size } = await getFileInfo(asset.uri);
  const contentLength = asset.fileSize || size;

  // 1. 업로드 URL 요청
  const uploadUrlRequest: UploadUrlRequest = {
    filename,
    contentType: mimeType,
    contentLength,
    visibility,
    targetType,
  };

  const uploadUrlResponse = await api.post<ApiResponse<UploadUrlResponse>>(
    '/api/v1/files/uploads',
    uploadUrlRequest
  );

  const { fileId, objectKey, uploadUrl, headers } = uploadUrlResponse.data;

  // 2. S3에 파일 업로드
  const s3Response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': mimeType,
    },
    body: blob,
  });

  if (!s3Response.ok) {
    throw new Error(`S3 업로드 실패: ${s3Response.status}`);
  }

  // 3. 업로드 완료 처리 (PATCH)
  const patchResponse = await fetch(`${getApiBaseUrl()}/api/v1/files/uploads/${fileId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': await getAuthHeader(),
    },
  });

  if (!patchResponse.ok) {
    throw new Error(`업로드 완료 처리 실패: ${patchResponse.status}`);
  }

  // 업로드된 파일 URL 생성 (S3 public URL 또는 CDN URL)
  // objectKey를 기반으로 접근 가능한 URL 반환
  const fileUrl = uploadUrl.split('?')[0]; // presigned URL에서 기본 URL 추출

  return {
    fileId,
    objectKey,
    url: fileUrl,
  };
}

/**
 * 여러 이미지 업로드 (병렬 처리)
 */
export async function uploadImages(
  assets: ImagePickerAsset[],
  targetType: FileTargetType = 'FEED_IMG',
  visibility: FileVisibility = 'PUBLIC',
  onProgress?: (completed: number, total: number) => void
): Promise<UploadedFile[]> {
  const results: UploadedFile[] = [];
  let completed = 0;

  // 순차 업로드 (안정성을 위해)
  for (const asset of assets) {
    const result = await uploadImage(asset, targetType, visibility);
    results.push(result);
    completed++;
    onProgress?.(completed, assets.length);
  }

  return results;
}

/**
 * 이미지 업로드 with 재시도
 */
export async function uploadImageWithRetry(
  asset: ImagePickerAsset,
  targetType: FileTargetType = 'FEED_IMG',
  visibility: FileVisibility = 'PUBLIC',
  maxRetries: number = 3
): Promise<UploadedFile> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadImage(asset, targetType, visibility);
    } catch (error) {
      lastError = error as Error;
      console.warn(`업로드 시도 ${attempt}/${maxRetries} 실패:`, error);

      if (attempt < maxRetries) {
        // 재시도 전 대기 (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('이미지 업로드에 실패했습니다.');
}

export default {
  uploadImage,
  uploadImages,
  uploadImageWithRetry,
};
