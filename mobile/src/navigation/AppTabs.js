import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { themes } from '../theme';
import Icon from '../components/Icon';
import DashboardScreen from '../screens/DashboardScreen';
import OrdersScreen from '../screens/OrdersScreen';
import IncomeScreen from '../screens/IncomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function OverviewIcon({ color, focused }) {
  return React.createElement(Icon, {
    name: 'overview',
    color,
    size: 21,
    strokeWidth: focused ? 2.1 : 1.7,
  });
}

function OrdersIcon({ color, focused }) {
  return React.createElement(Icon, {
    name: 'orders',
    color,
    size: 21,
    strokeWidth: focused ? 2.1 : 1.7,
  });
}

function IncomeIcon({ color, focused }) {
  return React.createElement(Icon, {
    name: 'income',
    color,
    size: 21,
    strokeWidth: focused ? 2.1 : 1.7,
  });
}

function ProfileIcon({ color, focused }) {
  return React.createElement(Icon, {
    name: 'profile',
    color,
    size: 21,
    strokeWidth: focused ? 2.1 : 1.7,
  });
}

export default function AppTabs() {
  const { themeName } = useApp();
  const insets = useSafeAreaInsets();
  const theme = themes[themeName];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.line,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom, 5),
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={DashboardScreen}
        options={{ title: 'Обзор', tabBarIcon: OverviewIcon }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Заказы', tabBarIcon: OrdersIcon }}
      />
      <Tab.Screen
        name="Income"
        component={IncomeScreen}
        options={{ title: 'Доходы', tabBarIcon: IncomeIcon }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Профиль', tabBarIcon: ProfileIcon }}
      />
    </Tab.Navigator>
  );
}
