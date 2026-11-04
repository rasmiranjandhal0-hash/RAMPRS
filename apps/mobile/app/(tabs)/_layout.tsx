import { Tabs } from 'expo-router';
import { Home, Compass, ShoppingBag, Heart, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a0a0a',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '900',
        },
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#262626',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#737373',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'RAMPRS',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'COLLECTIONS',
          tabBarLabel: 'Shop',
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="bag"
        options={{
          title: 'SHOPPING BAG',
          tabBarLabel: 'Bag',
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'SAVED FITS',
          tabBarLabel: 'Wishlist',
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'MY ACCOUNT',
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

