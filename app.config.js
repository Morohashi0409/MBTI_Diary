const config = {
  name: "MBTI Diary",
  slug: "mbti-diary",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/images/icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.mbtidiary"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.yourcompany.mbtidiary"
  },
  web: {
    favicon: "./assets/images/favicon.png"
  },
  extra: {
    apiUrl: process.env.API_URL || "https://mbti-diary-backend-1028553810221.asia-northeast1.run.app/api/v1",
    firebaseApiKey: process.env.FIREBASE_API_KEY,
    difyApiKey: process.env.DIFY_API_KEY,
    type: "analysis",
    eas: {
      projectId: "your-eas-project-id"
    }
  }
};

export default config;