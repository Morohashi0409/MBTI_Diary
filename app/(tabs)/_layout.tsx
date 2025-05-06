import { Tabs } from 'expo-router';
import { BookOpen, ChartBar as BarChart2, User, Sparkles } from 'lucide-react-native';
import { Theme } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.colors.white,
        tabBarInactiveTintColor: Theme.colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginBottom: 4,
          textAlign: 'center',
        },
        tabBarItemStyle: {
          alignItems: 'center',
        },
        tabBarStyle: {
          backgroundColor: Theme.colors.card,
          borderTopColor: Theme.colors.border,
          height: 60,
          paddingTop: 8,
          shadowColor: Theme.colors.black,
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: -1 },
          shadowRadius: 3,
          elevation: 4,
        },
        headerStyle: {
          backgroundColor: Theme.colors.card,
          shadowColor: Theme.colors.black,
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 1 },
          shadowRadius: 3,
          elevation: 4,
        },
        headerTintColor: Theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 18,
          textAlign: 'center',
          color: Theme.colors.white,
        },
        headerTitleAlign: 'center',
        headerShadowVisible: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '日記',
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
          headerTitle: '日記',
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: '分析',
          tabBarIcon: ({ color, size }) => (
            <BarChart2 size={size} color={color} />
          ),
          headerTitle: 'MBTI',
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
          title: 'のびしろ',
          tabBarIcon: ({ color, size }) => (
            <Sparkles size={size} color={color} />
          ),
          headerTitle: 'のびしろ',
        }}
      />
    </Tabs>
  );
}