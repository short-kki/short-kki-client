import React, { useCallback, useRef, useState } from "react";
import { Dimensions, FlatList, StatusBar, View, ViewToken } from "react-native";
import VideoFeedItem from "./VideoFeedItem";

/**
 * Dummy Video Data
 * - YouTube Shorts URL 형식 사용
 * - 실제 서비스에서는 API에서 가져올 데이터
 */
const DUMMY_VIDEOS = [
    {
        id: 1,
        url: "https://www.youtube.com/shorts/DkyZ9t12hpo",
        title: "초간단 계란 볶음밥",
        author: "Paik's Cuisine",
        tags: ["#볶음밥", "#자취요리"]
    },
    {
        id: 2,
        url: "https://www.youtube.com/shorts/NnhIbr5lmEg",
        title: "편스토랑 류수영의 꿀팁",
        author: "KBS Entertain",
        tags: ["#편스토랑", "#1분요리"]
    },
    {
        id: 3,
        url: "https://www.youtube.com/shorts/ZPFVC78A2jM",
        title: "한국인이 좋아하는 속도",
        author: "1min_cook",
        tags: ["#한식", "#뚝딱이형"]
    },
];

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const TAB_BAR_HEIGHT = 85;

// 각 아이템의 높이 (탭바 제외)
const ITEM_HEIGHT = WINDOW_HEIGHT - TAB_BAR_HEIGHT;

/**
 * VideoFeed Component
 * - FlatList + pagingEnabled로 틱톡/쇼츠 스타일 구현
 * - onViewableItemsChanged로 현재 보이는 아이템 감지
 * - 현재 보이는 아이템만 재생 (isActive prop)
 */
export default function VideoFeed() {
    console.log("VideoFeed rendering, videos:", DUMMY_VIDEOS.length);

    // 현재 재생 중인 비디오 인덱스
    const [activeIndex, setActiveIndex] = useState<number>(0);

    /**
     * Viewability Config
     * - itemVisiblePercentThreshold: 아이템이 50% 이상 보이면 "viewable"로 간주
     * - 스크롤 중에도 정확한 감지를 위해 낮은 값 사용
     */
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
        waitForInteraction: false,
    }).current;

    /**
     * onViewableItemsChanged Callback
     * - 화면에 보이는 아이템이 변경될 때 호출
     * - 첫 번째 viewable 아이템의 인덱스를 activeIndex로 설정
     */
    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index !== null) {
                setActiveIndex(viewableItems[0].index);
            }
        }
    ).current;

    /**
     * renderItem
     * - useCallback으로 메모이제이션
     * - activeIndex와 현재 index 비교하여 isActive 결정
     */
    const renderItem = useCallback(
        ({ item, index }: { item: typeof DUMMY_VIDEOS[0]; index: number }) => {
            return (
                <VideoFeedItem
                    item={item}
                    isActive={index === activeIndex}
                    itemHeight={ITEM_HEIGHT}
                />
            );
        },
        [activeIndex]
    );

    /**
     * keyExtractor
     * - 각 아이템의 고유 키 추출
     */
    const keyExtractor = useCallback(
        (item: typeof DUMMY_VIDEOS[0]) => item.id.toString(),
        []
    );

    /**
     * getItemLayout
     * - FlatList 최적화: 아이템 크기를 미리 알려줌
     * - 스크롤 성능 향상
     */
    const getItemLayout = useCallback(
        (_: any, index: number) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
        }),
        []
    );

    return (
        <View className="flex-1 bg-black">
            {/* Status Bar 설정 */}
            <StatusBar
                barStyle="light-content"
                translucent
                backgroundColor="transparent"
            />

            <FlatList
                data={DUMMY_VIDEOS}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                // 페이징 활성화 - 한 번에 한 아이템씩 스크롤
                pagingEnabled
                // 스크롤 감속 속도
                decelerationRate="fast"
                // 스크롤 인디케이터 숨김
                showsVerticalScrollIndicator={false}
                // Viewability 설정
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                // 레이아웃 최적화
                getItemLayout={getItemLayout}
                // 렌더링 최적화
                initialNumToRender={1}
                maxToRenderPerBatch={2}
                windowSize={3}
                removeClippedSubviews={true}
                // 스냅 설정
                snapToInterval={ITEM_HEIGHT}
                snapToAlignment="start"
            />
        </View>
    );
}
