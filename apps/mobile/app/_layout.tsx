import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0a0a0a',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: '900',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[slug]"
          options={{
            title: 'RAMPRS ATELIER',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="orders/[id]"
          options={{
            title: 'ORDER DETAILS',
            headerBackTitle: 'Orders',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

