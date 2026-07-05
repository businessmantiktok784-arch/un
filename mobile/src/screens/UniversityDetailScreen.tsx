import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, BookOpen, MapPin, FileText } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

interface Course { id: string; course_code: string; title: string; }
interface Campus { id: string; name: string; location: string | null; }

export default function UniversityDetailScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const nav = useNavigation<any>();
  const { university } = route.params;
  const [courses, setCourses] = useState<Course[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [coursesRes, campusesRes, docRes] = await Promise.all([
          supabase.from('courses').select('id, course_code, title').eq('university', university).order('course_code'),
          supabase.from('campuses').select('id, name, location').eq('university', university),
          supabase.from('documents').select('id', { count: 'exact', head: true }).eq('university', university),
        ]);
        if (coursesRes.data) setCourses(coursesRes.data);
        if (campusesRes.data) setCampuses(campusesRes.data);
        if (docRes.count !== null) setDocCount(docRes.count);
      } catch {} finally { setLoading(false); }
    })();
  }, [university]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}><ArrowLeft size={22} color={theme.colors.grey0} /></TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.grey0 }]} numberOfLines={1}>{university}</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={[styles.statRow, { backgroundColor: theme.colors.white }]}>
          <View style={styles.statItem}><FileText size={20} color={theme.colors.primary} /><Text style={[styles.statNum, { color: theme.colors.grey0 }]}>{docCount}</Text><Text style={[styles.statLabel, { color: theme.colors.grey2 }]}>Documents</Text></View>
          <View style={styles.statItem}><BookOpen size={20} color={theme.colors.primary} /><Text style={[styles.statNum, { color: theme.colors.grey0 }]}>{courses.length}</Text><Text style={[styles.statLabel, { color: theme.colors.grey2 }]}>Courses</Text></View>
          <View style={styles.statItem}><MapPin size={20} color={theme.colors.primary} /><Text style={[styles.statNum, { color: theme.colors.grey0 }]}>{campuses.length}</Text><Text style={[styles.statLabel, { color: theme.colors.grey2 }]}>Campuses</Text></View>
        </View>
        {campuses.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>CAMPUSES</Text>
            {campuses.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.card, { backgroundColor: theme.colors.white }]}>
                <MapPin size={16} color={theme.colors.primary} />
                <View style={{ marginLeft: 10 }}><Text style={[styles.cardTitle, { color: theme.colors.grey0 }]}>{c.name}</Text>{c.location && <Text style={[styles.cardSub, { color: theme.colors.grey2 }]}>{c.location}</Text>}</View>
              </TouchableOpacity>
            ))}
          </>
        )}
        {courses.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>COURSES</Text>
            {courses.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.card, { backgroundColor: theme.colors.white }]} onPress={() => nav.navigate('Browse', { course_code: c.course_code })}>
                <BookOpen size={16} color={theme.colors.primary} />
                <View style={{ marginLeft: 10 }}><Text style={[styles.cardTitle, { color: theme.colors.grey0 }]}>{c.course_code}</Text>{c.title && <Text style={[styles.cardSub, { color: theme.colors.grey2 }]}>{c.title}</Text>}</View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.5, flex: 1, textAlign: 'center' },
  statRow: { flexDirection: 'row', padding: 16, borderRadius: 12, justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardSub: { fontSize: 12, marginTop: 2 },
});
