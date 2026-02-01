# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shortkki (숏끼) - A short-form recipe sharing and social meal calendar app built with React Native/Expo. Features TikTok/Reels-style vertical video UI for recipe discovery with YouTube Shorts integration.

## Commands

```bash
npm install          # Install dependencies
npm start            # Start Expo dev server
npm run ios          # Run native iOS build (requires Xcode)
npm run android      # Run native Android build (requires Android Studio)
npm run web          # Run in web browser
npm run lint         # Run ESLint
```

### EAS Build Commands
```bash
eas build --platform ios --profile development         # iOS simulator dev build
eas build --platform ios --profile development-device  # iOS device dev build
eas build --platform android --profile development     # Android dev build
eas build --platform all --profile production          # Production build (both platforms)
eas update --branch production --message "msg"         # OTA update (JS only)
```

Note: The `development` iOS profile builds for simulator only (`"simulator": true` in eas.json). Use `development-device` for physical device testing.

### Expo Go vs Development Build
- **Expo Go**: Quick testing but limited - no push notifications, no custom native modules
- **Development Build**: Full functionality - use EAS build commands above
- Auth storage uses in-memory fallback when `expo-secure-store` is unavailable (Expo Go)

## Architecture

### Tech Stack
- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **Navigation**: Expo Router (file-based routing)
- **Video**: react-native-youtube-iframe for YouTube Shorts playback
- **Auth**: expo-auth-session for OAuth (Naver, Google), expo-secure-store for token storage
- **Icons**: lucide-react-native

### Key Directories
- `app/` - Expo Router screens (file-based routing)
- `app/(tabs)/` - Bottom tab navigator (5 visible tabs: 홈, 식단표, 추가, 레시피북, 그룹; hidden: shorts, explore, calendar, profile)
- `components/feed/` - TikTok-style video feed components
- `components/ui/` - Reusable UI components (Button, Card, Input, Tag, Header)
- `contexts/` - React contexts (AuthContext for app-wide auth state)
- `constants/` - Design tokens and OAuth configuration
- `utils/` - Utilities for auth storage and YouTube URL parsing
- `hooks/` - Custom hooks that abstract data fetching (groups, shorts, recipes)
- `services/` - API client (`api.ts` with fetch wrapper)
- `data/mock/` - Mock data for development (groups, shorts, recipes)

### Path Aliases
Use `@/` for absolute imports from project root (e.g., `@/components/`, `@/contexts/`)

### Data Layer Pattern
The app uses a mock-first pattern for development without a backend:
1. **Hooks** (`hooks/useGroups.ts`, `useShorts.ts`, `useRecipes.ts`) - Abstract data fetching with loading/error states
2. **Mock toggle**: `USE_MOCK` in `services/api.ts` (defaults to `__DEV__`)
3. **Mock data**: `data/mock/` contains typed mock data matching API contracts
4. **Server migration**: Set `USE_MOCK = false` and implement API endpoints - hooks auto-switch

Example hook usage:
```typescript
import { useGroups, useGroupFeeds } from '@/hooks';
const { groups, loading, error, refetch } = useGroups();
```

Available hooks:
- `useShorts()`, `useCurationSections()` - Home feed data
- `useGroups()`, `useGroupFeeds(id)`, `useGroupMembers(id)` - Group data
- `usePersonalRecipeBooks()`, `useGroupRecipeBooks(id)`, `useRecipeBookDetail(id)`, `useShoppingList()` - Recipe data

### Video Feed Architecture
The home screen uses a TikTok/Shorts-style vertical paging video feed:
- `VideoFeed.tsx` - FlatList with `pagingEnabled` and snap-to-item scrolling
- `VideoFeedItem.tsx` - Individual video player using react-native-youtube-iframe
- Viewability-based playback: only the currently visible video plays (`onViewableItemsChanged` with 50% threshold)
- Item height: `windowHeight - TAB_BAR_HEIGHT (85px)`
- YouTube Shorts require `mute={true}` for autoplay (mobile OS policy)

### Authentication Flow
1. OAuth authorization code flow: Login screen → OAuth provider → `oauth/[...callback].tsx`
2. Backend exchange: Send auth code to `/api/auth/{provider}` → Receive JWT tokens
3. State management: `AuthContext` wraps app, auto-redirects based on auth state (protected routes in `(tabs)`)
4. Token storage: `expo-secure-store` for secure persistence (falls back to in-memory for Expo Go)

### Push Notifications
Push notifications are implemented via `services/pushNotification.ts`:
- Requires development build (doesn't work in Expo Go)
- `ENABLE_PUSH` flag gates functionality (set to `true` after building with EAS)
- Uses Expo Notifications with Firebase (config in `GoogleService-Info.plist`/`google-services.json`)
- Token registration/unregistration handled in `AuthContext` on login/logout
- Notification types: `GROUP_INVITE`, `RECIPE_SHARED`, `CALENDAR_UPDATE`, `COMMENT_ADDED`

### Environment Configuration
- `__DEV__` flag switches API URL: `localhost:8080` (dev) vs `api.shortkki.com` (prod)
- `DEV_MODE.ENABLE_MOCK_LOGIN` in `constants/oauth.ts` enables mock login without backend
- Typed routes enabled via `experiments.typedRoutes` in app.json

## Design System

### Colors (tailwind.config.js)
- `primary` (#FA8112) - Warm Orange, main accent
- `secondary` (#FFD23F) - Warm Yellow
- `neutral` scale - Warm grays (50-900)
- Semantic: `success`, `warning`, `error`, `info`

### TypeScript Design Tokens
Import from `@/constants/design-system`:
- `Colors`, `Typography`, `Spacing`, `BorderRadius`, `Shadows`, `CommonStyles`

### UI Guidelines
- Minimal, bold, rounded aesthetic (Toss/Airbnb style)
- Use `rounded-2xl` for rounded corners
- Important buttons should be bottom-fixed
- Immersive design: hide info, emphasize images
- Tab bar: white background, 85px height, primary color for active state

### Code Style
- Prefer NativeWind classes for styling over inline styles
- Use design tokens from `constants/design-system.ts` for consistency
- Use lucide-react-native for all icons
- Use `useSafeAreaInsets()` for safe area handling
