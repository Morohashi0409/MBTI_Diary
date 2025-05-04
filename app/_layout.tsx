import { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { Theme } from '@/constants/theme';
import { View } from 'react-native';
import UserRegistrationModal from '@/components/UserRegistrationModal';
import { isUserRegistered } from '@/services/userStorage';

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

  // アプリ起動時にユーザー登録状態をチェック
  useEffect(() => {
    const checkUserRegistration = async () => {
      try {
        const registered = await isUserRegistered();
        setShowRegistration(!registered);
      } catch (error) {
        console.error('ユーザー登録チェックエラー:', error);
      } finally {
        setIsCheckingUser(false);
      }
    };

    checkUserRegistration();
  }, []);

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
            backgroundColor: Theme.colors.primary,
          },
          headerTintColor: Theme.colors.white,
          headerTitleStyle: {
            fontFamily: 'Inter-Medium',
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
      <StatusBar style="auto" />
      
      {/* ユーザー登録モーダル */}
      <UserRegistrationModal 
        visible={showRegistration} 
        onComplete={() => setShowRegistration(false)} 
      />
    </>
  );
}