/**
 * 최근 검색어 저장 유틸리티
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY_COUNT = 10;

export interface SearchHistoryItem {
  keyword: string;
  timestamp: number;
}

/**
 * 최근 검색어 목록 가져오기
 */
export async function getSearchHistory(): Promise<SearchHistoryItem[]> {
  try {
    const data = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('검색 기록 로드 실패:', error);
    return [];
  }
}

/**
 * 검색어 추가 (중복 시 맨 위로 이동)
 */
export async function addSearchHistory(keyword: string): Promise<void> {
  try {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    const history = await getSearchHistory();

    // 기존에 같은 키워드가 있으면 제거
    const filtered = history.filter(item => item.keyword !== trimmed);

    // 맨 앞에 추가
    const newHistory: SearchHistoryItem[] = [
      { keyword: trimmed, timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_HISTORY_COUNT);

    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('검색 기록 저장 실패:', error);
  }
}

/**
 * 특정 검색어 삭제
 */
export async function removeSearchHistory(keyword: string): Promise<void> {
  try {
    const history = await getSearchHistory();
    const filtered = history.filter(item => item.keyword !== keyword);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('검색 기록 삭제 실패:', error);
  }
}

/**
 * 전체 검색어 삭제
 */
export async function clearSearchHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('검색 기록 초기화 실패:', error);
  }
}
