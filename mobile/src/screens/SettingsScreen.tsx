import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { ArrowLeft, LogOut, Smartphone, ExternalLink } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useThemeMode } from '../contexts/ThemeContext';

export default function SettingsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { mode, toggle } = useThemeMode();
  const [userId, setUserId] = useState<string | null>(null);
  const [oppAlerts, setOppAlerts] = useState(false);
  const [replyAlerts, setReplyAlerts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appStoreUrl, setAppStoreUrl] = useState<string | null>(null);
  const [playStoreUrl, setPlayStoreUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from('notification_subscriptions').select('*').eq('user_id', user.id).maybeSingle();
        if (data) { setOppAlerts(data.opportunities ?? false); setReplyAlerts(data.document_replies ?? false); }
      }
      // Load app store URLs from site settings
      const { data: settings } = await supabase.from('site_settings').select('play_store_url,app_store_url,play_store_enabled,app_store_enabled').maybeSingle();
      if (settings?.play_store_enabled) setPlayStoreUrl(settings.play_store_url);
      if (settings?.app_store_enabled) setAppStoreUrl(settings.app_store_url);
      setLoading(false);
    })();
  }, []);

  const savePrefs = async (opp: boolean, rep: boolean) => {
    setOppAlerts(opp); setReplyAlerts(rep);
    if (userId) await supabase.from('notification_subscriptions').upsert({ user_id: userId, opportunities: opp, document_replies: rep });
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => supabase.auth.signOut().then(() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })) },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}><ArrowLeft size={22} color={theme.colors.grey0} /></TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Settings</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>APPEARANCE</Text>
        <View style={[styles.row, { backgroundColor: theme.colors.white }]}>
          <Text style={[styles.rowLabel, { color: theme.colors.grey0 }]}>Dark Mode</Text>
          <Switch value={mode === 'dark'} onValueChange={toggle} trackColor={{ false: theme.colors.grey4, true: theme.colors.primary }} thumbColor="#fff" />
        </View>

        {/* App Store Links */}
        {(playStoreUrl || appStoreUrl) && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>GET THE APP</Text>
            {playStoreUrl && (
              <TouchableOpacity style={[styles.row, { backgroundColor: theme.colors.white }]} onPress={() => playStoreUrl && Linking.openURL(playStoreUrl)}>
                <Smartphone size={20} color={theme.colors.primary} />
                <Text style={[styles.rowLabel, { color: theme.colors.primary, marginLeft: 12 }]}>Google Play Store</Text>
                <ExternalLink size={16} color={theme.colors.grey3} />
              </TouchableOpacity>
            )}
            {appStoreUrl && (
              <TouchableOpacity style={[styles.row, { backgroundColor: theme.colors.white }]} onPress={() => appStoreUrl && Linking.openURL(appStoreUrl)}>
                <Smartphone size={20} color={theme.colors.primary} />
                <Text style={[styles.rowLabel, { color: theme.colors.primary, marginLeft: 12 }]}>Apple App Store</Text>
                <ExternalLink size={16} color={theme.colors.grey3} />
              </TouchableOpacity>
            )}
          </>
        )}

        {userId && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>NOTIFICATIONS</Text>
            <View style={[styles.row, { backgroundColor: theme.colors.white }]}>
              <View style={{ flex: 1 }}><Text style={[styles.rowLabel, { color: theme.colors.grey0 }]}>Opportunity Alerts</Text><Text style={[styles.rowSub, { color: theme.colors.grey2 }]}>Internships, jobs, traineeships</Text></View>
              <Switch value={oppAlerts} onValueChange={(v) => savePrefs(v, replyAlerts)} trackColor={{ false: theme.colors.grey4, true: theme.colors.primary }} thumbColor="#fff" />
            </View>
            <View style={[styles.row, { backgroundColor: theme.colors.white }]}>
              <View style={{ flex: 1 }}><Text style={[styles.rowLabel, { color: theme.colors.grey0 }]}>Reply Alerts</Text><Text style={[styles.rowSub, { color: theme.colors.grey2 }]}>Replies on your documents</Text></View>
              <Switch value={replyAlerts} onValueChange={(v) => savePrefs(oppAlerts, v)} trackColor={{ false: theme.colors.grey4, true: theme.colors.primary }} thumbColor="#fff" />
            </View>

            <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>ACCOUNT</Text>
            <TouchableOpacity style={[styles.row, { backgroundColor: theme.colors.white }]} onPress={handleSignOut}>
              <LogOut size={20} color={theme.colors.error} />
              <Text style={[styles.rowLabel, { color: theme.colors.error, marginLeft: 12 }]}>Sign Out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginTop: 8, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  rowSub: { fontSize: 12, marginTop: 2 },
});
