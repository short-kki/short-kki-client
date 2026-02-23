/**
 * Expo Config Plugin: Android 버전 관리 + Release 서명 설정
 *
 * expo prebuild 시 자동으로 build.gradle에 다음을 적용:
 * - android-version.json에서 versionCode/versionName 읽기
 * - keystore.properties 기반 release signing config
 */
const { withAppBuildGradle } = require("expo/config-plugins");

const VERSION_BLOCK = `// [withAndroidVersion] 버전 관리 + 서명 설정
def versionFile = new File(rootDir.getAbsoluteFile().getParentFile(), "android-version.json")
def appVersion = new groovy.json.JsonSlurper().parseText(versionFile.text)

def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

`;

const RELEASE_SIGNING_CONFIG = `        release {
            storeFile file(keystoreProperties['storeFile'] ?: 'debug.keystore')
            storePassword keystoreProperties['storePassword'] ?: 'android'
            keyAlias keystoreProperties['keyAlias'] ?: 'androiddebugkey'
            keyPassword keystoreProperties['keyPassword'] ?: 'android'
        }`;

module.exports = function withAndroidVersion(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // 1. android-version.json 읽기 + keystore 코드 삽입 (이미 있으면 스킵)
    if (!contents.includes("android-version.json")) {
      contents = contents.replace("android {", VERSION_BLOCK + "android {");
    }

    // 2. versionCode를 android-version.json에서 읽도록 변경 (숫자인 경우만 매칭)
    contents = contents.replace(
      /versionCode \d+/,
      "versionCode appVersion.versionCode"
    );

    // 3. versionName을 android-version.json에서 읽도록 변경 (문자열인 경우만 매칭)
    contents = contents.replace(
      /versionName "[^"]+"/,
      "versionName appVersion.versionName"
    );

    // 4. release signing config 추가 (없으면)
    if (
      contents.includes("signingConfigs") &&
      !contents.match(/signingConfigs[\s\S]*?release\s*\{[\s\S]*?storeFile/)
    ) {
      contents = contents.replace(
        /(signingConfigs\s*\{[^}]*debug\s*\{[^}]*\})/s,
        "$1\n" + RELEASE_SIGNING_CONFIG
      );
    }

    // 5. release buildType의 signingConfig을 release로 변경
    contents = contents.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[^}]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig signingConfigs.release"
    );

    config.modResults.contents = contents;
    return config;
  });
};
