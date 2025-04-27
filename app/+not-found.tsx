import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Theme } from '@/constants/theme';
import { Chrome as Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ 
        title: 'Page Not Found',
        headerStyle: {
          backgroundColor: Theme.colors.primary,
        },
        headerTintColor: Theme.colors.white,
        headerTitleStyle: {
          fontFamily: 'Inter-Medium',
        },
      }} />
      <View style={styles.container}>
        <Text style={styles.title}>Oops!</Text>
        <Text style={styles.text}>This screen doesn't exist.</Text>
        <Link href="/" asChild>
          <TouchableOpacity style={styles.button}>
            <Home size={18} color={Theme.colors.white} />
            <Text style={styles.buttonText}>Go to Diary</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Theme.colors.background,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.md,
  },
  text: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.round,
    ...Theme.shadows.md,
  },
  buttonText: {
    marginLeft: Theme.spacing.xs,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: Theme.colors.white,
  },
});