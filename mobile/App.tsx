import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, createTheme } from '@rneui/themed';
import 'react-native-url-polyfill/auto';

// Icons
import { Home, Search, Upload, Bookmark, User, Settings, History, Briefcase, FileEdit, HelpCircle, Info, Shield, Copyright, MessageSquare } from 'lucide-react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import BrowseScreen from './src/screens/BrowseScreen';
import DocumentDetailScreen from './src/screens/DocumentDetailScreen';
import UploadScreen from './src/screens/UploadScreen';
import BookmarksScreen from './src/screens/BookmarksScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SplashScreen from './src/screens/SplashScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import OpportunitiesScreen from './src/screens/OpportunitiesScreen';
import OpportunityDetailScreen from './src/screens/OpportunityDetailScreen';
import RequestsScreen from './src/screens/RequestsScreen';
import RequestDetailScreen from './src/screens/RequestDetailScreen';
import CreateRequestScreen from './src/screens/CreateRequestScreen';
import UniversityDetailScreen from './src/screens/UniversityDetailScreen';
import HelpScreen from './src/screens/HelpScreen';
import ContactScreen from './src/screens/ContactScreen';
import AboutScreen from './src/screens/AboutScreen';
import TermsScreen from './src/screens/TermsScreen';
import PrivacyScreen from './src/screens/PrivacyScreen';
import DocCopyrightScreen from './src/screens/DocCopyrightScreen';
import LoginScreen from './src/screens/LoginScreen';

// Contexts
import { NotificationProvider } from './src/contexts/NotificationContext';
import { ThemeModeProvider } from './src/contexts/ThemeContext';
import { HistoryProvider } from './src/contexts/HistoryContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const theme = createTheme({
  lightColors: {
    primary: '#2563eb',
    secondary: '#1d4ed8',
    background: '#fafbfc',
    white: '#ffffff',
    grey0: '#1a2b3c',
    grey1: '#4a5568',
    grey2: '#718096',
    grey3: '#a0aec0',
    grey4: '#cbd5e0',
    grey5: '#e2e8f0',
    error: '#e53e3e',
    success: '#38a169',
  },
  darkColors: {
    primary: '#60a5fa',
    secondary: '#93c5fd',
    background: '#0f1720',
    white: '#1a2535',
    grey0: '#f7fafc',
    grey1: '#e2e8f0',
    grey2: '#cbd5e0',
    grey3: '#a0aec0',
    grey4: '#4a5568',
    grey5: '#2d3748',
    error: '#fc8181',
    success: '#4ade80',
  },
  mode: 'light',
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
});

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="OpportunityDetail" component={OpportunityDetailScreen} />
      <Stack.Screen name="UniversityDetail" component={UniversityDetailScreen} />
    </Stack.Navigator>
  );
}

function BrowseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BrowseMain" component={BrowseScreen} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
      <Stack.Screen name="UniversityDetail" component={UniversityDetailScreen} />
    </Stack.Navigator>
  );
}

function UploadStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UploadMain" component={UploadScreen} />
    </Stack.Navigator>
  );
}

function BookmarksStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BookmarksMain" component={BookmarksScreen} />
      <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="Copyright" component={DocCopyrightScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#a0aec0',
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, any> = {
            Home: Home,
            Browse: Search,
            Upload: Upload,
            Bookmarks: Bookmark,
            Profile: User,
          };
          const Icon = icons[route.name];
          return Icon ? <Icon size={size} color={color} strokeWidth={2} /> : null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Browse" component={BrowseStack} />
      <Tab.Screen name="Upload" component={UploadStack} />
      <Tab.Screen name="Bookmarks" component={BookmarksStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <ThemeModeProvider>
          <NotificationProvider>
            <HistoryProvider>
              <NavigationContainer>
                <StatusBar style="auto" />
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Terms" component={TermsScreen} />
                  <Stack.Screen name="Privacy" component={PrivacyScreen} />
                  <Stack.Screen name="MainTabs" component={TabNavigator} />
                  <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                  <Stack.Screen name="Opportunities" component={OpportunitiesScreen} />
                  <Stack.Screen name="OpportunityDetail" component={OpportunityDetailScreen} />
                  <Stack.Screen name="Requests" component={RequestsScreen} />
                  <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
                  <Stack.Screen name="CreateRequest" component={CreateRequestScreen} />
                  <Stack.Screen name="History" component={HistoryScreen} />
                  <Stack.Screen name="UniversityDetail" component={UniversityDetailScreen} />
                  <Stack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
                  <Stack.Screen name="Help" component={HelpScreen} />
                  <Stack.Screen name="Contact" component={ContactScreen} />
                </Stack.Navigator>
              </NavigationContainer>
            </HistoryProvider>
          </NotificationProvider>
        </ThemeModeProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 4,
    paddingBottom: 8,
    height: 64,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});
