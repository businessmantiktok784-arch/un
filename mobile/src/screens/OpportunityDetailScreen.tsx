import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { ArrowLeft, MapPin, Calendar, Briefcase, ExternalLink } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function OpportunityDetailScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const { id } = route.params;
  const [opp, setOpp] = useState<any>(null);

  useEffect(() => {
    supabase.from('opportunities').select('*').eq('id', id).single().then(({ data }) => setOpp(data));
  }, [id]);

  if (!opp) return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}><ArrowLeft size={22} color={theme.colors.grey0} /></TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.grey0 }]} numberOfLines={1}>Opportunity</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={[styles.oppTitle, { color: theme.colors.grey0 }]}>{opp.title}</Text>
        {opp.company && <Text style={[styles.company, { color: theme.colors.grey2 }]}>{opp.company}</Text>}
        <View style={styles.metaRow}>
          {opp.type && <View style={[styles.badge, { backgroundColor: theme.colors.primary + '15' }]}><Briefcase size={14} color={theme.colors.primary} /><Text style={[styles.badgeText, { color: theme.colors.primary, textTransform: 'capitalize' }]}>{opp.type}</Text></View>}
          {opp.location && <><MapPin size={14} color={theme.colors.grey3} /><Text style={[styles.meta, { color: theme.colors.grey3 }]}>{opp.location}</Text></>}
          {opp.deadline && <><Calendar size={14} color={theme.colors.grey3} /><Text style={[styles.meta, { color: theme.colors.grey3 }]}>Due {new Date(opp.deadline).toLocaleDateString()}</Text></>}
        </View>
        <Text style={[styles.description, { color: theme.colors.grey1 }]}>{opp.description}</Text>
        {opp.eligibility && <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>ELIGIBILITY</Text>}
        {opp.eligibility && <Text style={[styles.detailText, { color: theme.colors.grey1 }]}>{opp.eligibility}</Text>}
        {opp.benefits && <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>BENEFITS</Text>}
        {opp.benefits && <Text style={[styles.detailText, { color: theme.colors.grey1 }]}>{opp.benefits}</Text>}
        {opp.application_url && (
          <TouchableOpacity style={[styles.applyBtn, { backgroundColor: theme.colors.primary }]} onPress={() => { Linking.openURL(opp.application_url).catch(() => Alert.alert('Error', 'Cannot open link')); }}>
            <ExternalLink size={18} color="#fff" />
            <Text style={styles.applyText}>Apply Now</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  oppTitle: { fontSize: 22, fontWeight: '700' },
  company: { fontSize: 15, marginTop: -8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 13 },
  description: { fontSize: 14, lineHeight: 22 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  detailText: { fontSize: 13, lineHeight: 18 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 8 },
  applyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
