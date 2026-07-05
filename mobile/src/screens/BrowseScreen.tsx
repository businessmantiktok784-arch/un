import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Search, SlidersHorizontal, X, FileText, ArrowUpDown, ChevronDown } from 'lucide-react-native';
import { supabase, type DocumentType } from '../lib/supabase';
import DocumentCard from '../components/DocumentCard';
import AdSlot from '../components/AdSlot';

const PAGE_SIZE = 15;
const docTypes = ['All', 'Exam', 'CAT', 'Assignment', 'Notes', 'Lab Report', 'Project', 'Past Paper'];
const sortOptions = [
  { key: 'created_at', label: 'Recent' },
  { key: 'downloads_count', label: 'Most Downloaded' },
  { key: 'rating_avg', label: 'Top Rated' },
];
const faculties = ['All', 'Engineering', 'Science', 'Business', 'Arts', 'Medicine', 'Law', 'Education'];
const semesters = ['All', 'Semester 1', 'Semester 2', 'Semester 3'];
const academicYears = ['All', '2025-2026', '2024-2025', '2023-2024', '2022-2023', '2021-2022'];

export default function BrowseScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [universities, setUniversities] = useState<{ name: string; abbr: string }[]>([]);
  const [selectedUni, setSelectedUni] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('All');
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');

  const pageRef = useRef(0);

  useFocusEffect(useCallback(() => {
    (async () => {
      const { data: unis } = await supabase.from('universities').select('name,abbr').order('name');
      setUniversities((unis ?? []).map((u: any) => ({ name: u.name, abbr: u.abbr || u.name })));
    })();
    resetAndLoad();
  }, []));

  async function resetAndLoad() {
    pageRef.current = 0;
    setPage(0);
    setHasMore(true);
    await loadDocuments(0, true);
  }

  async function loadDocuments(pageNum = 0, replace = false) {
    if (pageNum === 0) setLoading(true);
    try {
      let q = supabase
        .from('documents')
        .select('id,title,course_code,course_name,university,doc_type,downloads_count,rating_avg,created_at')
        .eq('status', 'approved')
        .order(sortBy, { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (selectedType !== 'All') q = q.eq('doc_type', selectedType as any);
      if (selectedUni) q = q.eq('university', selectedUni);
      if (selectedFaculty !== 'All') q = q.eq('faculty', selectedFaculty);
      if (selectedSemester !== 'All') q = q.eq('semester', selectedSemester);
      if (selectedYear !== 'All') q = q.eq('academic_year', selectedYear);

      if (query.trim()) q = q.or(`title.ilike.%${query.trim()}%,course_code.ilike.%${query.trim()}%,university.ilike.%${query.trim()}%`);

      const { data } = await q;
      if (data) {
        setDocuments(replace ? (data as DocumentType[]) : [...documents, ...(data as DocumentType[])]);
        setHasMore(data.length === PAGE_SIZE);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setLoadingMore(false); }
  }

  function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    pageRef.current = next;
    setPage(next);
    loadDocuments(next, false);
  }

  function onRefresh() {
    setRefreshing(true);
    resetAndLoad().finally(() => setRefreshing(false));
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Browse</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.white }]}>
          <Search size={18} color={theme.colors.grey2} />
          <TextInput style={[styles.searchInput, { color: theme.colors.grey0 }]} placeholder="Search documents..." placeholderTextColor={theme.colors.grey3} value={query} onChangeText={setQuery} onSubmitEditing={resetAndLoad} returnKeyType="search" />
        </View>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: showFilters ? theme.colors.primary : theme.colors.white }]} onPress={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={18} color={showFilters ? '#fff' : theme.colors.grey0} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, { backgroundColor: theme.colors.white }]} onPress={() => setShowSort(true)}>
          <ArrowUpDown size={18} color={theme.colors.grey0} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        {docTypes.map((t) => (
          <TouchableOpacity key={t} style={[styles.typeChip, { backgroundColor: selectedType === t ? theme.colors.primary : theme.colors.white }]} onPress={() => { setSelectedType(t); resetAndLoad(); }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: selectedType === t ? '#fff' : theme.colors.grey0 }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showFilters && (
        <View style={[styles.filterPanel, { backgroundColor: theme.colors.white }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.grey2 }]}>University</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity style={[styles.filterChipSmall, { backgroundColor: !selectedUni ? theme.colors.primary : theme.colors.background }]} onPress={() => { setSelectedUni(''); resetAndLoad(); }}>
                  <Text style={{ fontSize: 12, color: !selectedUni ? '#fff' : theme.colors.grey0 }}>All</Text>
                </TouchableOpacity>
                {universities.map((u) => (
                  <TouchableOpacity key={u.name} style={[styles.filterChipSmall, { backgroundColor: selectedUni === u.name ? theme.colors.primary : theme.colors.background }]} onPress={() => { setSelectedUni(selectedUni === u.name ? '' : u.name); resetAndLoad(); }}>
                    <Text style={{ fontSize: 12, color: selectedUni === u.name ? '#fff' : theme.colors.grey0 }}>{u.abbr}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.grey2 }]}>Faculty</Text>
              {faculties.map((f) => (
                <TouchableOpacity key={f} style={[styles.filterChipSmall, { backgroundColor: selectedFaculty === f ? theme.colors.primary : theme.colors.background }]} onPress={() => { setSelectedFaculty(f); resetAndLoad(); }}>
                  <Text style={{ fontSize: 12, color: selectedFaculty === f ? '#fff' : theme.colors.grey0 }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.grey2 }]}>Semester</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {semesters.map((s) => (
                  <TouchableOpacity key={s} style={[styles.filterChipSmall, { backgroundColor: selectedSemester === s ? theme.colors.primary : theme.colors.background }]} onPress={() => { setSelectedSemester(s); resetAndLoad(); }}>
                    <Text style={{ fontSize: 12, color: selectedSemester === s ? '#fff' : theme.colors.grey0 }}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.grey2 }]}>Year</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {academicYears.map((y) => (
                  <TouchableOpacity key={y} style={[styles.filterChipSmall, { backgroundColor: selectedYear === y ? theme.colors.primary : theme.colors.background }]} onPress={() => { setSelectedYear(y); resetAndLoad(); }}>
                    <Text style={{ fontSize: 12, color: selectedYear === y ? '#fff' : theme.colors.grey0 }}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      )}

      {/* Sort Modal */}
      <Modal visible={showSort} transparent animationType="fade" onRequestClose={() => setShowSort(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowSort(false)}>
          <View style={[styles.sortSheet, { backgroundColor: theme.colors.white }]}>
            <Text style={[styles.sortTitle, { color: theme.colors.grey0 }]}>Sort by</Text>
            {sortOptions.map((opt) => (
              <TouchableOpacity key={opt.key} style={[styles.sortOption, { backgroundColor: sortBy === opt.key ? theme.colors.primary + '10' : 'transparent' }]} onPress={() => { setSortBy(opt.key); setShowSort(false); resetAndLoad(); }}>
                <Text style={[styles.sortText, { color: sortBy === opt.key ? theme.colors.primary : theme.colors.grey0 }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        onMomentumScrollEnd={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          if (contentOffset.y >= contentSize.height - layoutMeasurement.height - 100) loadMore();
        }}
      >
        {loading && documents.length === 0 ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 60 }} />
        ) : documents.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <FileText size={48} color={theme.colors.grey4} />
            <Text style={[styles.emptyTitle, { color: theme.colors.grey2 }]}>No documents found</Text>
            <Text style={[styles.emptySub, { color: theme.colors.grey3 }]}>Try adjusting your search or filters</Text>
          </View>
        ) : (
          <>
            {documents.map((doc) => <DocumentCard key={doc.id} document={doc} onPress={() => navigation.navigate('DocumentDetail', { id: doc.id })} />)}
            <AdSlot slot="browse-inline" />
          </>
        )}
        {loadingMore && <ActivityIndicator size="small" color={theme.colors.primary} style={{ paddingVertical: 16 }} />}
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
  filterPanel: { padding: 12, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, gap: 8 },
  filterGroup: { gap: 6 },
  filterLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  filterChipSmall: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginRight: 6 },
  filterRow: { flexDirection: 'row', gap: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sortSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  sortTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  sortOption: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  sortText: { fontSize: 15, fontWeight: '500' },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: 'center' },
});
