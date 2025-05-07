import { useEffect, useState, useCallback } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { Theme } from '@/constants/theme';
import { View } from 'react-native';
import UserRegistrationModal from '@/components/UserRegistrationModal';
import { isUserRegistered, getMBTIProfile } from '@/services/userStorage';
import { onAuthStateChange, getCurrentUser, getCurrentUserAsync } from '@/services/firebaseService';
import { User } from 'firebase/auth';

// Keep the splash screen visible until fonts are loaded
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const segments = useSegments();
  
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

  // 登録完了時のハンドラー - より強力な実装
  const handleRegistrationComplete = useCallback(() => {
    console.log('登録完了処理を開始します');
    setShowRegistration(false);
    
    // 現在のパスをログ出力
    console.log('現在のパス:', segments.join('/'));
    
    // 少し遅延を入れて確実に画面遷移させる（モーダルの閉じるアニメーションの後）
    setTimeout(() => {
      try {
        console.log('日記画面への遷移を実行します');
        // Webブラウザで確実に動作するよう対策
        if (typeof window !== 'undefined') {
          // 直接URL変更（最終手段）
          window.location.href = '/';
        } else {
          // ネイティブ環境の場合は通常の遷移
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('画面遷移エラー:', error);
        // 別の方法を試す
        router.replace('/');
      }
    }, 300);
    
    console.log('登録完了：日記画面に遷移します');
  }, [router, segments]);

  // アプリ起動時の初期認証状態チェック
  useEffect(() => {
    const checkInitialAuthState = async () => {
      setIsCheckingUser(true);
      try {
        // 現在のFirebaseユーザーを取得（非同期版を使用して確実に取得）
        const user = await getCurrentUserAsync();
        
        if (user) {
          console.log('アプリ起動時: すでにログイン済みのユーザー検出', user.email);
          setCurrentUser(user);
          
          // MBTIプロファイル情報の存在確認
          const registered = await isUserRegistered();
          if (registered) {
            // すでにログイン済みかつプロファイル登録済み → 登録モーダル非表示
            setShowRegistration(false);
            console.log('ユーザー登録済み: 登録モーダルを非表示にします');
          } else {
            // ログイン済みだがプロファイル未登録 → 登録モーダル表示
            setShowRegistration(true);
            console.log('ユーザーはログイン済みですが、プロファイル未登録: 登録モーダルを表示します');
          }
        } else {
          console.log('アプリ起動時: ログインユーザーなし');
          // 未ログイン状態 → 認証が必要なので登録モーダル表示
          setShowRegistration(true);
        }
      } catch (error) {
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
        // 認証されていない場合のみ登録画面を表示
        // リダイレクトによる認証中はユーザーがnullになることがあるので、
        // リダイレクト認証の状態を確認するため少し遅延させる
        setTimeout(() => {
          // 再度認証状態を確認（リダイレクトからの復帰対策）
          const currentFirebaseUser = getCurrentUser();
          if (!currentFirebaseUser) {
            console.log('認証状態再確認: ユーザーなし、登録画面を表示します');
            setShowRegistration(true);
            setIsCheckingUser(false);
          } else {
            console.log('認証状態再確認: ユーザーあり', currentFirebaseUser.email);
          }
        }, 500);
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
        onComplete={handleRegistrationComplete} 
      />
    </>
  );
}