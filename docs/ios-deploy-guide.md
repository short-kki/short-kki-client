# iOS 배포 가이드 (로컬 빌드 → TestFlight)

## 사전 요구사항

- Xcode 설치 (최신 버전 권장)
- Apple Developer 계정 로그인 (Xcode → Settings → Accounts)
- CocoaPods 설치 (`sudo gem install cocoapods`)
- `.env` 파일이 프로젝트 루트에 존재 (환경변수 필요)

> **참고**: EAS Build는 `.env`가 `.gitignore`에 포함되어 있어 서버에서 환경변수를 읽지 못합니다.
> 로컬 빌드 방식을 사용하면 `.env` 파일을 그대로 사용할 수 있습니다.

## 빌드 순서

### 1. 의존성 설치

```bash
npm install
```

### 2. Expo Prebuild (네이티브 프로젝트 생성)

```bash
npx expo prebuild --platform ios --clean
```

- `--clean` 옵션은 기존 `ios/` 폴더를 삭제하고 새로 생성합니다.
- `app.config.js`의 플러그인 설정이 네이티브 코드에 반영됩니다.
- 네이티브 설정 변경(플러그인 추가/수정, 번들 ID 변경 등) 시 반드시 다시 실행해야 합니다.

### 3. CocoaPods 설치

```bash
cd ios && pod install && cd ..
```

#### pod install 에러 대처

**Swift pods 모듈 에러** (FirebaseCoreInternal, FirebaseRemoteConfig 등):
```
The Swift pod `FirebaseCoreInternal` depends upon `GoogleUtilities`, which does not define modules.
```

→ `ios/Podfile`에 `use_modular_headers!`를 `target` 블록 위에 추가:
```ruby
use_modular_headers!

target 'app' do
  use_expo_modules!
  ...
end
```

### 4. Xcode에서 Archive

**방법 A: Xcode GUI (권장)**
1. `ios/app.xcworkspace`를 Xcode로 열기
2. 상단 디바이스를 **Any iOS Device** 선택
3. 메뉴 → **Product → Archive**
4. Archive 완료 후 Organizer 창이 열림

**방법 B: 커맨드라인**
```bash
xcodebuild -allowProvisioningUpdates archive \
  -workspace ios/app.xcworkspace \
  -scheme app \
  -archivePath build/app.xcarchive
```

### 5. TestFlight 배포

1. Xcode Organizer에서 Archive 선택
2. **Distribute App** 클릭
3. **App Store Connect** 선택 → **Upload**
4. Signing 옵션: **Automatically manage signing** 선택
5. 업로드 완료 후 App Store Connect에서 처리 대기 (5~15분)
6. 처리 완료 후 TestFlight에서 테스터에게 자동 배포

## 빌드 번호 관리

`app.config.js`에서 `buildNumber`를 매 배포마다 올려야 합니다:

```js
ios: {
  buildNumber: "42",  // 매번 +1
  ...
}
```

같은 버전(`version`)에서 빌드 번호가 동일하면 App Store Connect에서 업로드가 거부됩니다.

## OTA 업데이트 (JS 변경만 있는 경우)

네이티브 코드 변경 없이 JS/TS만 수정한 경우:

```bash
eas update --branch production --message "업데이트 설명"
```

**주의**: 다음 변경은 반드시 네이티브 빌드가 필요합니다:
- `app.config.js` 플러그인 설정 변경
- 네이티브 모듈 추가/삭제
- `ios/` 또는 `android/` 네이티브 코드 수정
- SDK 버전 업그레이드

## Apple Developer 설정 참고

### 등록된 Identifiers
| 이름 | Identifier |
|------|-----------|
| 메인 앱 | `kr.shortkki.app` |
| Share Extension | `kr.shortkki.app.share-extension` |

### App Groups
| 이름 | Identifier |
|------|-----------|
| 메인 그룹 | `group.kr.shortkki.app` |

### 네이버 개발자 센터
- iOS URL Scheme: `shortkki`
- 서비스 URL: `http://localhost:8080`
- Callback URL: `http://localhost:8080/login/oauth2/code/naver`
