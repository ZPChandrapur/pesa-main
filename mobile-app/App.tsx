import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { WorkDashboardScreen } from './src/screens/WorkDashboardScreen';
import { WorkflowProgressScreen } from './src/screens/WorkflowProgressScreen';
import { WorkflowStepsScreen } from './src/screens/WorkflowStepsScreen';
import { StepEditScreen } from './src/screens/StepEditScreen';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="WorkDashboard"
        component={WorkDashboardScreen}
        options={{
          title: 'Work Dashboard',
          headerStyle: {
            backgroundColor: '#10b981',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={{ marginRight: 16, padding: 8 }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Logout</Text>
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="WorkflowProgress"
        component={WorkflowProgressScreen}
        options={{
          title: 'Workflow Progress',
          headerStyle: {
            backgroundColor: '#10b981',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={{ marginRight: 16, padding: 8 }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Logout</Text>
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>📈</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WorkflowSteps"
        component={WorkflowStepsScreen}
        options={{
          title: 'Workflow Steps',
          headerStyle: {
            backgroundColor: '#10b981',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      />
      <Stack.Screen
        name="StepEdit"
        component={StepEditScreen}
        options={{
          title: 'Edit Step',
          headerStyle: {
            backgroundColor: '#3b82f6',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});
