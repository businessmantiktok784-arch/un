import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { Search, BookOpen, GraduationCap, Briefcase, TrendingUp, Clock, ChevronRight, Bell, MapPin, ExternalLink, Calendar, FileEdit } from 'lucide-react-native';
import { supabase, type DocumentType, type UniversityType, type OpportunityType } from '../lib/supabase';
import { useNotifications } from '../contexts/NotificationContext';
import DocumentCard from '../components/DocumentCard';
import UniversityCard from '../components/UniversityCard';

const typeColors: Record<string, string> = {
  Internship: '#2563eb',
  'Full-time': '#3182ce',
  Traineeship: '#d69e2e',
};

export default function HomeScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { unreadCount } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const [trending, setTrending] = useState<DocumentType[]>([]);
  const [recent, setRecent] = useState<DocumentType[]>([]);
  const [universities, setUniversities] = useState<UniversityType[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityType[]>([]);
  const [stats, setStats] = useState({ documents: 0, students: 0, universities: 0 });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      // Trending docs
      const { data: trend } = await supabase
        .from('documents')
        .select('id,title,course_code,course_name,university,doc_type,downloads_count,rating_avg,created_at')
        .eq('status', 'approved')
        .order('downloads_count', { ascending: false })
        .limit(5);
      setTrending((trend ?? []) as DocumentType[]);

      // Recent docs
      const { data: rec } = await supabase
        .from('documents')
        .select('id,title,course_code,course_name,university,doc_type,downloads_count,rating_avg,created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecent((rec ?? []) as DocumentType[]);

      // Universities
      const { data: unis } = await supabase
        .from('universities')
        .select('id,name,abbr,campuses')
        .order('name');
      setUniversities((unis ?? []).map((u: any) => ({ ...u, campuses: u.campuses ?? [] })));

      // Opportunities
      const { data: opps } = await supabase
        .from('opportunities')
        .select('id,title,type,category,country,deadline')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(3);
      setOpportunities((opps ?? []) as OpportunityType[]);

      // Stats
      const [{ count: docs }, { count: studs }, { count: unisCount }] = await Promise.all([
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('universities').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ documents: docs ?? 0, students: studs ?? 0, universities: unisCount ?? 0 });
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          <View style={styles.headerSpacer} />
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <Bell size={22} color={theme.colors.grey0} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Browse')}>
          <Search size={18} color={theme.colors.grey3} />
          <Text style={[styles.searchText, { color: theme.colors.grey3 }]}>Search resources...</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Documents', value: stats.documents },
            { label: 'Students', value: stats.students },
            { label: 'Universities', value: stats.universities },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: theme.colors.white }]}>
              <Text style={[styles.statValue, { color: theme.colors.grey0 }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.grey2 }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Trending */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <TrendingUp size={18} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.grey0 }]}>Trending</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
              <Text style={[styles.seeAll, { color: theme.colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {trending.map((doc) => (
            <DocumentCard key={doc.id} document={doc} onPress={() => navigation.navigate('DocumentDetail', { id: doc.id })} />
          ))}
        </View>

        {/* Universities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <GraduationCap size={18} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.grey0 }]}>Universities</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {universities.map((uni) => (
              <UniversityCard key={uni.id} university={uni} onPress={() => navigation.navigate('UniversityDetail', { university: uni.name })} />
            ))}
          </ScrollView>
        </View>

        {/* Recent */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Clock size={18} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.grey0 }]}>Recent Uploads</Text>
            </View>
          </View>
          {recent.map((doc) => (
            <DocumentCard key={doc.id} document={doc} onPress={() => navigation.navigate('DocumentDetail', { id: doc.id })} />
          ))}
        </View>

        {/* Opportunities */}
        {opportunities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Briefcase size={18} color={theme.colors.primary} />
                <Text style={[styles.sectionTitle, { color: theme.colors.grey0 }]}>Opportunities</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Opportunities')}>
                <Text style={[styles.seeAll, { color: theme.colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            {opportunities.map((opp) => (
              <TouchableOpacity key={opp.id} style={[styles.oppCard, { backgroundColor: theme.colors.white }]} onPress={() => navigation.navigate('OpportunityDetail', { id: opp.id })}>
                <View style={styles.oppHeader}>
                  <Text style={[styles.oppTitle, { color: theme.colors.grey0 }]}>{opp.title}</Text>
                  {opp.type && (
                    <View style={[styles.oppTypeBadge, { backgroundColor: (typeColors[opp.type] || '#718096') + '15' }]}>
                      <Text style={[styles.oppTypeText, { color: typeColors[opp.type] || '#718096' }]}>{opp.type}</Text>
                    </View>
                  )}
                </View>
                {opp.category && <Text style={[styles.oppCategory, { color: theme.colors.grey1 }]}>{opp.category}</Text>}
                <View style={styles.oppMeta}>
                  {opp.country && (
                    <View style={styles.oppMetaItem}>
                      <MapPin size={12} color={theme.colors.grey3} />
                      <Text style={[styles.oppMetaText, { color: theme.colors.grey2 }]}>{opp.country}</Text>
                    </View>
                  )}
                  {opp.deadline && (
                    <View style={styles.oppMetaItem}>
                      <Calendar size={12} color={theme.colors.grey3} />
                      <Text style={[styles.oppMetaText, { color: theme.colors.grey2 }]}>Due {new Date(opp.deadline).toLocaleDateString()}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Document Requests CTA */}
        <View style={[styles.section, { marginBottom: 12 }]}>
          <TouchableOpacity style={[styles.requestsCta, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate('Requests')}>
            <FileEdit size={24} color="#fff" />
            <Text style={styles.requestsCtaTitle}>Need a document?</Text>
            <Text style={styles.requestsCtaSub}>Request study materials from your university</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  logoImage: { width: 72, height: 72 },

  headerSpacer: { flex: 1 },
  notifBtn: { position: 'relative', padding: 4 },
  notifBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e53e3e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: '#f0f2f5' },
  searchText: { fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statValue: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  horizontalScroll: { marginHorizontal: -4 },
  oppCard: { padding: 14, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  oppHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  oppTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  oppTypeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  oppTypeText: { fontSize: 10, fontWeight: '600' },
  oppCategory: { fontSize: 12, marginTop: 4 },
  oppMeta: { flexDirection: 'row', gap: 16, marginTop: 8 },
  oppMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  oppMetaText: { fontSize: 12 },
  requestsCta: { padding: 20, borderRadius: 16, alignItems: 'center', gap: 4 },
  requestsCtaTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 6 },
  requestsCtaSub: { color: '#ffffffcc', fontSize: 13, textAlign: 'center' },
});
