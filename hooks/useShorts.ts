/**
 * 쇼츠/홈 관련 Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { USE_MOCK, api } from '@/services/api';
import {
  MOCK_SHORTS,
  MOCK_CURATION_SECTIONS,
  type ShortsItem,
  type CurationSection,
} from '@/data/mock';

/**
 * 쇼츠 목록 조회
 */
export function useShorts() {
  const [shorts, setShorts] = useState<ShortsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchShorts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 항상 Mock 데이터 사용 (백엔드 미구현)
      setShorts(MOCK_SHORTS);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShorts();
  }, [fetchShorts]);

  return {
    shorts,
    loading,
    error,
    refetch: fetchShorts,
  };
}

/**
 * 홈 화면 큐레이션 섹션 조회
 */
export function useCurationSections() {
  const [sections, setSections] = useState<CurationSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 항상 Mock 데이터 사용 (백엔드 미구현)
      setSections(MOCK_CURATION_SECTIONS);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  return {
    sections,
    loading,
    error,
    refetch: fetchSections,
  };
}
