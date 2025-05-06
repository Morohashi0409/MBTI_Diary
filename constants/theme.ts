export const Theme = {
  colors: {
    primary: '#FFFFFF', // メインカラー（紫色）
    primaryLight: '#FFFFFF',
    primaryDark: '#6A4A78',
    secondary: '#33A474', // セカンダリ（緑色）
    secondaryLight: '#5EB991',
    secondaryDark: '#278A5E',
    accent: '#4298B4', // アクセント（青色）
    accentLight: '#65B0C8',
    accentDark: '#337D97',
    success: '#33A474', // 成功色（緑色）
    warning: '#E4AE3A', // 警告色（黄色）
    error: '#E74C3C',
    background: '#2C2C2C', // 背景色を濃いグレーに変更
    card: '#3C3C3C', // カード背景をさらに濃いグレーに
    text: '#FFFFFF', // テキストを白に変更
    textSecondary: '#E0E0E0', // セカンダリテキストも明るく
    textTertiary: '#BBBBBB', // 第三テキストも明るく
    disabled: '#555555', // 無効化状態も暗めのグレー
    border: '#555555', // ボーダーも暗めのグレー
    white: '#FFFFFF',
    black: '#000000',
    // MBTI次元のカラーコード（指定された値をそのまま使用）
    mbti: {
      EI: '#4298B4', // 青色
      SN: '#E4AE3A', // 黄色
      TF: '#33A474', // 緑色
      JP: '#88619a', // 紫色
    },
    // MBTIタイプごとのカラーコード
    mbtiType: {
      // 青色グループ（センサー判断型）
      "ISTJ": "#4298B4",
      "ISFJ": "#4298B4",
      "ESTJ": "#4298B4",
      "ESFJ": "#4298B4",

      // 黄色グループ（センサー知覚型）
      "ISTP": "#E4AE3A",
      "ISFP": "#E4AE3A",
      "ESTP": "#E4AE3A",
      "ESFP": "#E4AE3A",

      // 緑色グループ（直感感情型）
      "INFP": "#33A474",
      "INFJ": "#33A474",
      "ENFP": "#33A474",
      "ENFJ": "#33A474",

      // 紫色グループ（直感思考型）
      "INTP": "#88619a",
      "INTJ": "#88619a",
      "ENTP": "#88619a",
      "ENTJ": "#88619a"
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      bold: 'Inter-Bold',
    },
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 4,
    },
  },
};