import React from 'react';
import { Tabs } from 'expo-router';
import { ModernTabBar } from '../../src/components/ModernTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ModernTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />

      <Tabs.Screen
        name="collections"
        options={{
          title: 'Catalog',
        }}
      />

      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
        }}
      />
    </Tabs>
  );
}
