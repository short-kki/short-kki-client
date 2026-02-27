/**
 * Expo App Configuration
 * 환경변수를 사용하여 민감한 정보를 분리합니다.
 */

require("dotenv").config();

const NAVER_CONSUMER_KEY = process.env.EXPO_PUBLIC_NAVER_CONSUMER_KEY;
const NAVER_CONSUMER_SECRET = process.env.EXPO_PUBLIC_NAVER_CONSUMER_SECRET;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

// Google Client ID를 URL Scheme으로 변환 (reverse domain)
// 예: "123-abc.apps.googleusercontent.com" -> "com.googleusercontent.apps.123-abc"
const toGoogleUrlScheme = (clientId) => {
  if (!clientId) return null;
  const parts = clientId.split(".");
  return parts.reverse().join(".");
};

const GOOGLE_IOS_URL_SCHEME = toGoogleUrlScheme(GOOGLE_IOS_CLIENT_ID);
const GOOGLE_ANDROID_URL_SCHEME = toGoogleUrlScheme(GOOGLE_ANDROID_CLIENT_ID);

export default {
  expo: {
    name: "short-kki-client",
    slug: "short-kki-client",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: [
      "shortkki",
      GOOGLE_IOS_URL_SCHEME,
      GOOGLE_ANDROID_URL_SCHEME,
    ].filter(Boolean),
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.short-kki-client",
      googleServicesFile: "./GoogleService-Info.plist",
      associatedDomains: ["applinks:shortkki.com"],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["remote-notification"],
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSExceptionDomains: {
            "dev.shortkki.kr": {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSIncludesSubdomains: true,
            },
            "api.shortkki.kr": {
              NSExceptionAllowsInsecureHTTPLoads: true,
              NSIncludesSubdomains: true,
            },
            "localhost": {
              NSExceptionAllowsInsecureHTTPLoads: true,
            },
          },
        },
      },
    },
    android: {
      package: "com.anonymous.shortkki",
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/images/android-icon-foreground.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "shortkki",
              host: "oauth",
              pathPrefix: "/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "shortkki.com",
              pathPrefix: "/group/invite/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
        {
          action: "VIEW",
          data: [
            {
              scheme: "http",
              host: "dev.shortkki.kr",
              pathPrefix: "/group/invite/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
        {
          action: "VIEW",
          data: [
            {
              scheme: "http",
              host: "*",
              port: "8080",
              pathPrefix: "/group/invite/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "@react-native-firebase/app",
      "./plugins/withAndroidVersion",
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
          },
        },
      ],
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      "expo-secure-store",
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#FA8112",
        },
      ],
      [
        "expo-share-intent",
        {
          iosActivationRules: {
            NSExtensionActivationSupportsWebURLWithMaxCount: 1,
            NSExtensionActivationSupportsWebPageWithMaxCount: 1,
            NSExtensionActivationSupportsText: true,
          },
          androidIntentFilters: ["text/*"],
        },
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: GOOGLE_IOS_URL_SCHEME,
        },
      ],
      [
        "@react-native-seoul/naver-login",
        {
          consumerKey: NAVER_CONSUMER_KEY,
          consumerSecret: NAVER_CONSUMER_SECRET,
          appName: "숏끼",
          serviceUrlScheme: "shortkki",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "d982feea-4f84-43f3-ae8a-5eb1572b6ca8",
      },
    },
    owner: "leedonghoon123",
  },
};
