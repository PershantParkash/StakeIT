import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Import screens (to be created)
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import GoalsScreen from '../screens/GoalsScreen';
import CreateGoalScreen from '../screens/CreateGoalScreen';
import GoalDetailsScreen from '../screens/GoalDetailsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom icon component using simple shapes
const TabIcon = ({ focused, icon, color }) => {
  const iconSize = 20;
  const strokeWidth = 2;
  
  const renderIcon = () => {
    switch (icon) {
      case 'home':
        return (
          <View style={{
            width: iconSize,
            height: iconSize,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {/* House roof */}
            <View style={{
              width: 0,
              height: 0,
              borderLeftWidth: 6,
              borderRightWidth: 6,
              borderBottomWidth: 6,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: color,
              marginBottom: 2,
            }} />
            {/* House body */}
            <View style={{
              width: 10,
              height: 8,
              borderWidth: strokeWidth,
              borderColor: color,
              borderRadius: 1,
            }} />
          </View>
        );
      
      case 'goals':
        return (
          <View style={{
            width: iconSize,
            height: iconSize,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {/* Clipboard */}
            <View style={{
              width: 12,
              height: 14,
              borderWidth: strokeWidth,
              borderColor: color,
              borderRadius: 1,
              position: 'relative',
            }}>
              {/* Clipboard top */}
              <View style={{
                position: 'absolute',
                top: -3,
                left: 2,
                width: 8,
                height: 3,
                borderWidth: strokeWidth,
                borderColor: color,
                borderBottomWidth: 0,
                borderRadius: 1,
              }} />
              {/* Lines */}
              <View style={{
                position: 'absolute',
                top: 3,
                left: 2,
                width: 8,
                height: 1,
                backgroundColor: color,
              }} />
              <View style={{
                position: 'absolute',
                top: 6,
                left: 2,
                width: 6,
                height: 1,
                backgroundColor: color,
              }} />
              <View style={{
                position: 'absolute',
                top: 9,
                left: 2,
                width: 8,
                height: 1,
                backgroundColor: color,
              }} />
            </View>
          </View>
        );
      
      case 'analytics':
        return (
          <View style={{
            width: iconSize,
            height: iconSize,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {/* Chart bars */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              height: 12,
              gap: 2,
            }}>
              <View style={{
                width: 2,
                height: 4,
                backgroundColor: color,
              }} />
              <View style={{
                width: 2,
                height: 8,
                backgroundColor: color,
              }} />
              <View style={{
                width: 2,
                height: 6,
                backgroundColor: color,
              }} />
              <View style={{
                width: 2,
                height: 10,
                backgroundColor: color,
              }} />
            </View>
          </View>
        );
      
      case 'profile':
        return (
          <View style={{
            width: iconSize,
            height: iconSize,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            {/* Person head */}
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              borderWidth: strokeWidth,
              borderColor: color,
              marginBottom: 2,
            }} />
            {/* Person body */}
            <View style={{
              width: 12,
              height: 8,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopWidth: 0,
              borderRadius: 6,
              borderRadiusTop: 0,
            }} />
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={{
      opacity: focused ? 1 : 0.6,
      transform: [{ scale: focused ? 1.1 : 1 }],
    }}>
      {renderIcon()}
    </View>
  );
};

// Main app tabs (after authentication)
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: '#00d4ff',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} icon="home" color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalsScreen}
        options={{
          tabBarLabel: 'Goals',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} icon="goals" color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} icon="analytics" color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused} icon="profile" color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Authentication stack
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

// Main app navigator
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="CreateGoal" component={CreateGoalScreen} />
            <Stack.Screen name="GoalDetails" component={GoalDetailsScreen} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 