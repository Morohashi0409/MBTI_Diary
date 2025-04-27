import { Tabs } from 'expo-router';
import { BookOpen, ChartBar as BarChart2, User, Sparkles } from 'lucide-react-native';
import { Theme } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: Theme.colors.white,
          borderTopColor: Theme.colors.border,
          height: 60,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: Theme.colors.primary,
        },
        headerTintColor: Theme.colors.white,
        headerTitleStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '日記',
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
          headerTitle: '私の日記',
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: '分析',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 size={size} color={color} />
          ),
          headerTitle: 'MBTI分析',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'マイページ',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
          headerTitle: 'マイページ',
        }}
      />
      <Tabs.Screen
        name="growth"
        options={{
          title: '伸び代',
          tabBarIcon: ({ color, size }) => (
            <Sparkles size={size} color={color} />
          ),
          headerTitle: '伸び代',
        }}
      />
    </Tabs>
  );
}