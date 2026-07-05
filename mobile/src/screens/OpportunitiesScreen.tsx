import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { Search, MapPin, Calendar, Filter, Briefcase, GraduationCap, Target, IndianRupee } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const TYPE_ICONS: Record<string, any> = { internship: Briefcase, job: Briefcase, traineeship: GraduationCap, scholarship: Target, grant: IndianRupee };
const TYPE_COLORS: Record<string, string> = { internship: '#3b82f6', job: '#8b5cf6', traineeship: '#10b981', scholarship: '#f59e0b', grant: '#ef4444' };

async function fetchOpps(filters: any) {
  let q = supabase.from('opportunities').select('*', { count: 'exact' }).eq('status', 'approved');
  if (filters.search) q = q.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  if (filters.type) q = q.eq('type', filters.type);
  if (filters.category) q = q.eq('category', filters.category);
  if (filters.country) q = q.eq('country', filters.country);
  q = q.order('created_at', { ascending: false }).range(filters.offset || 0, (filters.offset || 0) + 19);
  return q;
}

export default function OpportunitiesScreen() {
  const { theme } = useTheme();
  const nav = useNavigation<any>();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  async function loadData(opts?: { append?: boolean; searchVal?: string; typeVal?: string }) {
    const { append = false, searchVal = search, typeVal = typeFilter } = opts || {};
    setLoading(true);
    const filters: any = { search: searchVal, type: typeVal, offset: append ? data.length : 0 };
    const { data: rows } = await fetchOpps(filters);
    if (rows) setData(append ? [...data, ...rows] : rows);
    setLoading(false);
  }

  const types = ['internship', 'job', 'traineeship', 'scholarship', 'grant'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Opportunities</Text>
      </View>
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.white }]}>
          <Search size={18} color={theme.colors.grey2} />
          <TextInput style={[styles.searchInput, { color: theme.colors.grey0 }]} placeholder="Search opportunities..." placeholderTextColor={theme.colors.grey3} value={search} onChangeText={setSearch} onSubmitEditing={() => loadData({ searchVal: search })} returnKeyType="search" />
        </View>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: showFilter ? theme.colors.primary : theme.colors.white }]} onPress={() => setShowFilter(!showFilter)}>
          <Filter size={18} color={showFilter ? '#fff' : theme.colors.grey0} />
        </TouchableOpacity>
      </View>
      {showFilter && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          {types.map((t) => (
            <TouchableOpacity key={t} style={[styles.typeChip, { backgroundColor: typeFilter === t ? theme.colors.primary : theme.colors.white }]} onPress={() => { const next = typeFilter === t ? '' : t; setTypeFilter(next); loadData({ typeVal: next }); }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: typeFilter === t ? '#fff' : theme.colors.grey0, textTransform: 'capitalize' }}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {loading && data.length === 0 ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 60 }} />
        ) : data.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}><Text style={{ color: theme.colors.grey3, fontSize: 15 }}>No opportunities found</Text></View>
        ) : (
          data.map((opp: any) => {
            const Icon = TYPE_ICONS[opp.type] || Briefcase;
            const color = TYPE_COLORS[opp.type] || theme.colors.primary;
            return (
              <TouchableOpacity key={opp.id} style={[styles.card, { backgroundColor: theme.colors.white }]} onPress={() => nav.navigate('OpportunityDetail', { id: opp.id })}>
                <View style={[styles.typeIcon, { backgroundColor: color + '15' }]}><Icon size={22} color={color} /></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.oppTitle, { color: theme.colors.grey0 }]}>{opp.title}</Text>
                  {opp.category && <Text style={[styles.company, { color: theme.colors.grey2 }]}>{opp.category}</Text>}
                  <View style={styles.metaRow}>
                    {opp.country && <><MapPin size={12} color={theme.colors.grey3} /><Text style={[styles.meta, { color: theme.colors.grey3 }]}>{opp.country}</Text></>}
                    {opp.deadline && <><Calendar size={12} color={theme.colors.grey3} /><Text style={[styles.meta, { color: theme.colors.grey3 }]}>Due {new Date(opp.deadline).toLocaleDateString()}</Text></>}
                    <View style={[styles.typeBadge, { backgroundColor: color + '15' }]}><Text style={{ fontSize: 10, fontWeight: '700', color, textTransform: 'uppercase' }}>{opp.type}</Text></View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 12 },
  searchInput: { flex: 1, fontSize: 15, marginLeft: 8, paddingVertical: 10 },
  filterBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  card: { flexDirection: 'row', padding: 14, borderRadius: 12, marginBottom: 8 },
  typeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  oppTitle: { fontSize: 14, fontWeight: '600' },
  company: { fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  meta: { fontSize: 11 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 4 },
});
