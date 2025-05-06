import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { Theme } from '@/constants/theme';
import { View } from 'react-native';
import UserRegistrationModal from '@/components/UserRegistrationModal';
import { isUserRegistered, getMBTIProfile } from '@/services/userStorage';
import { onAuthStateChange, getCurrentUser } from '@/services/firebaseService';
import { User } from 'firebase/auth';

// Keep the splash screen visible until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });

  // ユーザー登録状態の管理
  const [showRegistration, setShowRegistration] = useState<boolean>(false);
  const [isCheckingUser, setIsCheckingUser] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasCheckedInitialAuth, setHasCheckedInitialAuth] = useState<boolean>(false);

  // アプリ起動時の初期認証状態チェック
  useEffect(() => {
    const checkInitialAuthState = async () => {
      try {
        // 現在のFirebaseユーザーを取得
        const user = getCurrentUser();
        
        if (user) {
          console.log('アプリ起動時: すでにログイン済みのユーザー検出', user.email);
          setCurrentUser(user);
          
          // MBTIプロファイル情報の存在確認
          const registered = await isUserRegistered();
          if (registered) {
            // すでにログイン済みかつプロファイル登録済み → 登録モーダル非表示
            console.log('アプリ起動時: ユーザー登録済み、登録モーダルをスキップします');
            setShowRegistration(false);
          } else {
            // ログイン済みだがプロファイル未登録 → 登録モーダル表示
            console.log('アプリ起動時: Firebaseログイン済みだがプロファイル未登録');
            setShowRegistration(true);
          }
        } else {
          // 未ログイン → 登録モーダル表示
          console.log('アプリ起動時: ログインユーザーなし、登録モーダルを表示します');
          setShowRegistration(true);
        }
      } catch (error) {
        console.error('初期認証状態確認エラー:', error);
        setShowRegistration(true);
      } finally {
        setIsCheckingUser(false);
        setHasCheckedInitialAuth(true);
      }
    };

    checkInitialAuthState();
  }, []);

  // Firebase認証状態を監視（初期チェック後のみ実行）
  useEffect(() => {
    if (!hasCheckedInitialAuth) return;
    
    const unsubscribe = onAuthStateChange((user) => {
      console.log('認証状態が変更されました:', user ? `ユーザー: ${user.email}` : 'サインアウト');
      setCurrentUser(user);
      
      // すでにFirebase認証されていれば、MBTIプロファイル情報のチェックを行う
      if (user) {
        checkUserRegistration();
      } else {
        // 認証されていない場合は登録画面を表示
        setShowRegistration(true);
        setIsCheckingUser(false);
      }
    });
    
    // クリーンアップ関数
    return () => unsubscribe();
  }, [hasCheckedInitialAuth]);

  // MBTIプロファイル情報が登録済みかチェック
  const checkUserRegistration = async () => {
    try {
      const registered = await isUserRegistered();
      console.log('ユーザー登録チェック結果:', registered ? '登録済み' : '未登録');
      
      // 登録済みなら登録モーダルを表示しない
      setShowRegistration(!registered);
    } catch (error) {
      console.error('ユーザー登録チェックエラー:', error);
    } finally {
      setIsCheckingUser(false);
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if ((fontsLoaded || fontError) && !isCheckingUser) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isCheckingUser]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack 
        screenOptions={{ 
          headerShown: true,
          headerStyle: {
            backgroundColor: Theme.colors.card,
            shadowColor: Theme.colors.black,
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 2,
            elevation: 3,
          },
          headerTintColor: Theme.colors.text,
          headerTitleStyle: {
            fontFamily: 'Inter-Medium',
            color: Theme.colors.text,
          },
          contentStyle: {
            backgroundColor: Theme.colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen name="+not-found" />
        <Stack.Screen 
          name="analysis/[id]" 
          options={{ 
            headerTitle: "分析詳細",
          }} 
        />
      </Stack>
      <StatusBar style="light" />
      
      {/* ユーザー登録モーダル - Firebase認証済みかつプロファイル未登録の場合のみ表示 */}
      <UserRegistrationModal 
        visible={showRegistration} 
        onComplete={() => setShowRegistration(false)} 
      />
    </>
  );
}