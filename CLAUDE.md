# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Shortkki (숏끼) - A short-form recipe sharing and social meal calendar app built with React Native/Expo. Features TikTok/Reels-style vertical video UI for recipe discovery with YouTube Shorts integration.

> **Important**: This app must run correctly on both **iOS** and **Android** platforms simultaneously. When writing or modifying code, always consider cross-platform compatibility — avoid platform-specific APIs without providing fallbacks, test UI rendering on both platforms, and be cautious with platform-dependent styling or behavior differences.

## Commands

```bash
npm install          # Install dependencies (runs patch-package via postinstall)
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
- **Expo Go**: Quick testing but limited — no push notifications, no native OAuth SDKs
- **Development Build**: Full functionality — use EAS build commands above
- Auth storage uses in-memory fallback when `expo-secure-store` is unavailable (Expo Go)

## Architecture

### Tech Stack
- **Framework**: React Native 0.81.5 with Expo SDK 54, New Architecture enabled, React Compiler enabled
- **Language**: TypeScript ~5.9.2 with strict mode
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **Navigation**: Expo Router (file-based routing with typed routes)
- **Video**: react-native-youtube-bridge for YouTube Shorts playback
- **Auth**: Native OAuth SDKs (`@react-native-google-signin/google-signin`, `@react-native-seoul/naver-login`), `expo-secure-store` for token storage
- **Images**: expo-image for optimized loading, expo-image-picker for selection
- **File Upload**: Presigned URL flow to S3 via `services/fileUpload.ts`
- **Icons**: lucide-react-native
- **Animations**: react-native-reanimated, react-native-gesture-handler
- **Share Intent**: expo-share-intent (receive shared URLs from other apps)

### Key Directories
- `app/` — Expo Router screens (file-based routing)
- `app/(tabs)/` — Bottom tab navigator (5 visible tabs: 홈, 식단표, 추가, 레시피북, 그룹; hidden tabs: shorts, explore, calendar, profile with `href: null`)
- `components/feed/` — TikTok-style video feed components
- `components/ui/` — Reusable UI components (Button, Card, Input, Tag, Header)
- `contexts/` — React contexts (AuthContext for app-wide auth state)
- `constants/` — Design tokens (`design-system.ts`) and OAuth configuration (`oauth.ts`)
- `utils/` — Utilities for auth storage and YouTube URL parsing
- `hooks/` — Custom hooks that abstract data fetching (groups, shorts, recipes, notifications)
- `services/` — API client (`api.ts`), file upload (`fileUpload.ts`), push notifications (`pushNotification.ts`), recipe API (`recipeApi.ts`), ingredient API (`ingredientApi.ts`), member API (`memberApi.ts`)
- `data/mock/` — Mock data for development
- `patches/` — patch-package patches applied at install time

### Path Aliases
Use `@/` for absolute imports from project root (e.g., `@/components/`, `@/contexts/`)

### Data Layer Pattern
The app uses a hooks-based data layer with optional mock data:
1. **Hooks** (`hooks/`) — Abstract data fetching with loading/error states
2. **Mock toggle**: `USE_MOCK` in `services/api.ts` — set to `true` for mock data, `false` for real API (currently `false`)
3. **API response format**: Backend returns `{ code, message, data: T }` — the `api.ts` fetch wrapper returns the raw response, so hooks/callers unwrap `.data` as needed
4. **File uploads**: Presigned URL flow — request upload URL from `/api/v1/files/uploads`, PUT to S3, then PATCH to confirm. See `services/fileUpload.ts`
5. **Domain API services**: `recipeApi.ts` (typed CRUD), `ingredientApi.ts` (search/autocomplete, mock-only), `memberApi.ts` (profile operations)

Available hooks (all exported from `hooks/index.ts`):
- `useShorts()`, `useCurationSections()`, `useRecommendedCurations()`, `useCurationShorts()` — Home feed
- `useGroups()`, `useGroupDetail()`, `useGroupFeeds(id)`, `useGroupMembers(id)`, `useShoppingList(id)` — Groups
- `usePersonalRecipeBooks()`, `useGroupRecipeBooks()`, `useGroupRecipeBooksById(id)`, `useRecipeBookDetail(id)` — Recipes
- `useRecipeCalendar(type, startDate, endDate)`, `useRecipeQueue()` — Meal calendar
- `useRecipeSearch(query)` — Search
- `useNotifications()`, `useUnreadNotificationCount()` — Notifications
- Standalone async: `getGroupInviteCode()`, `getGroupPreviewByInviteCode()`, `joinGroupByInviteCode()`, `markNotificationAsRead()`, `markAllNotificationsAsRead()`

### Video Feed Architecture
The home screen uses a TikTok/Shorts-style vertical paging video feed:
- `VideoFeed.tsx` — FlatList with `pagingEnabled` and snap-to-item scrolling
- `VideoFeedItem.tsx` — Individual video player using react-native-youtube-bridge
- Viewability-based playback: only the currently visible video plays (`onViewableItemsChanged` with 50% threshold)
- Item height: `windowHeight - TAB_BAR_HEIGHT (85px)`
- YouTube Shorts require `mute={true}` for autoplay (mobile OS policy)

### Authentication Flow
1. Native SDK OAuth: Login screen → Google/Naver native SDK → receive tokens/auth code
2. Backend exchange: Send auth data to `/api/auth/{provider}` → Receive JWT tokens
3. State management: `AuthContext` wraps app, auto-redirects based on auth state (protected routes in `(tabs)`)
4. Token storage: `expo-secure-store` for secure persistence (falls back to in-memory for Expo Go)
5. OAuth credentials: Stored in `.env` file (see `.env.example` for template), prefixed with `EXPO_PUBLIC_`

### Environment Configuration
- **App config**: Uses `app.config.js` (dynamic), not static `app.json`
- **APP_ENV** in `constants/oauth.ts` controls API target (hardcoded, switch manually):
  - `"local"` → auto-detects host IP from Expo for `http://{ip}:8080` (default)
  - `"dev"` → `http://dev.shortkki.kr`
  - `"prod"` → `https://api.shortkki.kr`
- **eas.json** sets `EXPO_PUBLIC_API_URL` per build profile (dev vs production), but `oauth.ts` currently uses `APP_ENV` instead (TODO to migrate)
- `DEV_MODE.ENABLE_MOCK_LOGIN` enabled when `APP_ENV !== "prod"` — allows login without real OAuth
- Typed routes enabled via `experiments.typedRoutes` in app.config.js
- Bundle IDs: iOS `com.anonymous.short-kki-client`, Android `com.anonymous.shortkki`

### Push Notifications
- Requires development build (doesn't work in Expo Go)
- `ENABLE_PUSH` flag in `services/pushNotification.ts` gates functionality
- Uses Expo Notifications with Firebase (`GoogleService-Info.plist` / `google-services.json`)
- Token registration/unregistration handled in `AuthContext` on login/logout

### Testing & CI
- No test framework configured — no test files in the project
- No CI/CD pipelines — builds and deploys use EAS commands manually

## Design System

### Colors (tailwind.config.js / constants/design-system.ts)
- `primary` (#FA8112) — Warm Orange, main accent
- `secondary` (#FFD23F) — Warm Yellow
- `neutral` scale — Warm grays (50–900)
- Semantic: `success`, `warning`, `error`, `info`

### TypeScript Design Tokens
Import from `@/constants/design-system`:
- `Colors`, `Typography`, `Spacing`, `BorderRadius`, `Shadows`, `CommonStyles`
- Utility functions: `getButtonSizeStyle()`, `getInputSizeStyle()`, `getAvatarSizeStyle()`

### UI Guidelines
- Minimal, bold, rounded aesthetic (Toss/Airbnb style)
- Use `rounded-2xl` for rounded corners
- Important buttons should be bottom-fixed
- Immersive design: hide info, emphasize images
- Tab bar: white background, 85px height, primary color for active state

### Code Style
- Prefer NativeWind classes over inline styles
- Use design tokens from `constants/design-system.ts` for consistency
- Use lucide-react-native for all icons
- Use `useSafeAreaInsets()` for safe area handling

## Deep Linking

The app supports deep linking via the `shortkki://` URL scheme:
- OAuth callbacks: `shortkki://oauth/{provider}`
- Group invites: `shortkki://group/invite/{inviteCode}` (handled by `app/group/invite/[inviteCode].tsx`)
- Google OAuth: reverse client ID scheme registered in app.config.js
- Share intent: Receives shared URLs from other apps via expo-share-intent
