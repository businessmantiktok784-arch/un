import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Svg, { Path } from 'react-native-svg';
import { User, LogOut, Settings, HelpCircle, ChevronRight, GraduationCap, History, MessageSquare, Info, Shield, Copyright } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectUrl = Linking.createURL('auth');

export default function ProfileScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ uploads: 0, downloads: 0, bookmarks: 0 });
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => { loadProfile(); }, [])
  );

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        setProfile(prof);
        if (prof && (!prof.university || !prof.program || !prof.year_of_study)) {
          navigation.navigate('Onboarding');
        }

        const [{ count: up }, { count: dl }, { count: bm }] = await Promise.all([
          supabase.from('documents').select('*', { count: 'exact', head: true }).eq('uploader_id', user.id),
          supabase.from('document_downloads').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        setStats({ uploads: up ?? 0, downloads: dl ?? 0, bookmarks: bm ?? 0 });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      if (result.type === 'success') {
        const url = result.url;
        const params = extractParams(url);
        if (params.access_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token ?? '',
          });
          if (sessionError) throw sessionError;
          loadProfile();
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); } },
    ]);
  }

  const menuItems = [
    { icon: History, label: 'History', action: () => navigation.navigate('History') },
    { icon: Settings, label: 'Settings', action: () => navigation.navigate('Settings') },
    { icon: MessageSquare, label: 'Contact Us', action: () => navigation.navigate('Contact') },
    { icon: HelpCircle, label: 'Help Center', action: () => navigation.navigate('Help') },
    { icon: Info, label: 'About', action: () => navigation.navigate('About') },
    { icon: Shield, label: 'Terms of Service', action: () => navigation.navigate('Terms') },
    { icon: Shield, label: 'Privacy Policy', action: () => navigation.navigate('Privacy') },
    { icon: Copyright, label: 'Copyright Notice', action: () => navigation.navigate('Copyright') },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {user ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.grey0 }]}>Profile</Text>
          </View>

          <View style={[styles.userCard, { backgroundColor: theme.colors.white }]}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary + '15' }]}>
              <User size={28} color={theme.colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: theme.colors.grey0 }]}>
                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.grey2 }]}>{user?.email}</Text>
              {profile?.university && (
                <View style={styles.universityRow}>
                  <GraduationCap size={14} color={theme.colors.primary} />
                  <Text style={[styles.universityText, { color: theme.colors.primary }]}>{profile.university}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.statsRow}>
            {[
              { label: 'Uploads', value: stats.uploads },
              { label: 'Downloads', value: stats.downloads },
              { label: 'Bookmarks', value: stats.bookmarks },
            ].map((stat) => (
              <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.colors.white }]}>
                <Text style={[styles.statValue, { color: theme.colors.grey0 }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.grey2 }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.menuCard, { backgroundColor: theme.colors.white }]}>
            {menuItems.map((item, i) => (
              <TouchableOpacity key={item.label} style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]} onPress={item.action}>
                <View style={styles.menuLeft}>
                  <item.icon size={20} color={theme.colors.grey2} />
                  <Text style={[styles.menuLabel, { color: theme.colors.grey0 }]}>{item.label}</Text>
                </View>
                <ChevronRight size={18} color={theme.colors.grey3} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.signOutBtn, { backgroundColor: theme.colors.white }]} onPress={handleSignOut}>
            <LogOut size={20} color={theme.colors.error} />
            <Text style={[styles.signOutText, { color: theme.colors.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.guestCard}>
          <View style={[styles.guestAvatar, { backgroundColor: theme.colors.primary + '15' }]}>
            <User size={32} color={theme.colors.primary} />
          </View>
          <Text style={[styles.guestTitle, { color: theme.colors.grey0 }]}>Welcome to UniHub</Text>
          <Text style={[styles.guestSub, { color: theme.colors.grey2 }]}>Sign in to access bookmarks, upload documents, and more.</Text>
          <TouchableOpacity
            style={[styles.googleBtn, loading && { opacity: 0.7 }]}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleIcon />
            <Text style={styles.googleBtnText}>{loading ? 'Please wait...' : 'Sign in with Google'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

function GoogleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <Path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <Path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <Path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </Svg>
  );
}

function extractParams(url: string) {
  const params: Record<string, string> = {};
  const queryString = url.includes('#') ? url.split('#')[1] : url.split('?')[1] || '';
  queryString.split('&').forEach((pair) => {
    const [key, val] = pair.split('=');
    if (key && val) params[decodeURIComponent(key)] = decodeURIComponent(val);
  });
  return params;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  userCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  avatar: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  userInfo: { marginLeft: 14, flex: 1 },
  userName: { fontSize: 18, fontWeight: '700' },
  userEmail: { fontSize: 13, marginTop: 2 },
  universityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  universityText: { fontSize: 12, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 14 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },
  menuCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 15, fontWeight: '500' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 12 },
  signOutText: { fontSize: 15, fontWeight: '600' },
  guestCard: { flex: 1, justifyContent: 'center', alignItems: 'center', marginHorizontal: 16 },
  guestAvatar: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  guestTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  guestSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#1a2b3c' },
});
