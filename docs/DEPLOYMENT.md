# 숏끼 클라이언트 - 개발 및 배포 환경

## 개요

숏끼 클라이언트는 **Expo** 프레임워크와 **EAS (Expo Application Services)**를 사용하여 개발 및 배포됩니다.

```
┌─────────────────────────────────────────────────────────────┐
│                        개발 환경                              │
├─────────────────────────────────────────────────────────────┤
│  React Native + Expo SDK 54                                 │
│  TypeScript                                                 │
│  Expo Router (파일 기반 라우팅)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     EAS (클라우드 서비스)                      │
├─────────────────────────────────────────────────────────────┤
│  EAS Build    → 클라우드에서 iOS/Android 앱 빌드             │
│  EAS Submit   → App Store / Play Store 자동 제출            │
│  EAS Update   → OTA 업데이트 (JS 번들만 업데이트)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        배포 대상                              │
├─────────────────────────────────────────────────────────────┤
│  iOS      → App Store / TestFlight / 내부 배포              │
│  Android  → Play Store / APK 직접 배포                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Expo vs Expo Go vs EAS Build

| 구분 | 설명 | 사용 시점 |
|------|------|-----------|
| **Expo** | React Native 기반 프레임워크 | 개발 전체 |
| **Expo Go** | Expo 공식 테스트 앱 | 빠른 프로토타이핑 (네이티브 기능 제한) |
| **EAS Build** | 클라우드 빌드 서비스 | 네이티브 기능 필요 시 (커스텀 URL scheme 등) |

### Expo Go의 한계

```
Expo Go에서 불가능한 것:
- 커스텀 URL scheme (shortkki://)
- 네이티브 모듈 추가
- 푸시 알림 (일부 제한)
- 백그라운드 작업

→ 이런 기능이 필요하면 EAS Build로 Development Build 생성 필요
```

---

## 빌드 프로필 (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

| 프로필 | 용도 | 배포 방식 |
|--------|------|-----------|
| **development** | 개발/테스트용 | 내부 배포 (QR 코드) |
| **preview** | QA/스테이징 | 내부 배포 |
| **production** | 스토어 출시용 | App Store / Play Store |

---

## 빌드 명령어

### iOS

```bash
# Development Build (테스트용)
eas build --platform ios --profile development

# Production Build (스토어 출시용)
eas build --platform ios --profile production
```

### Android

```bash
# Development Build (테스트용)
eas build --platform android --profile development

# Production Build (스토어 출시용)
eas build --platform android --profile production
```

### 양쪽 동시 빌드

```bash
eas build --platform all --profile development
```

---

## 앱 식별자

| 플랫폼 | 식별자 | 값 |
|--------|--------|-----|
| iOS | Bundle Identifier | `com.anonymous.short-kki-client` |
| Android | Package Name | `com.anonymous.short-kki-client` |
| Expo | Project ID | `d982feea-4f84-43f3-ae8a-5eb1572b6ca8` |

---

## URL Scheme 설정

OAuth 콜백 등을 위한 딥링크 스킴:

```json
// app.json
{
  "scheme": [
    "shortkki",
    "com.googleusercontent.apps.6350831070-agbndp2mc029cemdtv2ekqlemrne04ik"
  ]
}
```

| Scheme | 용도 |
|--------|------|
| `shortkki://` | 네이버 OAuth 콜백 |
| `com.googleusercontent.apps.xxx://` | Google OAuth 콜백 (iOS) |

---

## 환경별 API 설정

```typescript
// constants/oauth.ts
export const API_BASE_URL = __DEV__
  ? "http://localhost:8080"      // 개발 환경
  : "https://api.shortkki.com";  // 프로덕션 환경
```

| 환경 | `__DEV__` | API URL |
|------|-----------|---------|
| Development | `true` | `http://localhost:8080` |
| Production | `false` | `https://api.shortkki.com` |

---

## 인증서 및 서명 관리

### iOS

EAS가 자동으로 관리:
- Distribution Certificate
- Provisioning Profile

```bash
# 인증서 확인/관리
eas credentials --platform ios
```

### Android

EAS가 자동으로 관리:
- Keystore
- Upload Key

```bash
# 키스토어 확인/관리
eas credentials --platform android
```

---

## OTA 업데이트 (EAS Update)

JavaScript 코드만 변경된 경우, 스토어 재배포 없이 업데이트 가능:

```bash
# 업데이트 배포
eas update --branch production --message "버그 수정"
```

**제한사항**: 네이티브 코드 변경 시 새 빌드 필요

---

## 배포 플로우

```
1. 개발 완료
   │
   ▼
2. EAS Build (development)
   │  eas build --platform ios --profile development
   │
   ▼
3. 내부 테스트
   │  QR 코드로 설치 후 테스트
   │
   ▼
4. EAS Build (production)
   │  eas build --platform ios --profile production
   │
   ▼
5. EAS Submit
   │  eas submit --platform ios
   │
   ▼
6. App Store / Play Store 심사
   │
   ▼
7. 출시
```

---

## 주요 설정 파일

| 파일 | 역할 |
|------|------|
| `app.json` | Expo 앱 설정 (아이콘, 스킴, 번들 ID 등) |
| `eas.json` | EAS 빌드 프로필 설정 |
| `package.json` | 의존성 및 스크립트 |

---

## 참고 링크

- [Expo 공식 문서](https://docs.expo.dev/)
- [EAS Build 문서](https://docs.expo.dev/build/introduction/)
- [EAS Submit 문서](https://docs.expo.dev/submit/introduction/)
- [EAS Update 문서](https://docs.expo.dev/eas-update/introduction/)
