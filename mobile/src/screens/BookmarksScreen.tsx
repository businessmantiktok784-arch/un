import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Bookmark, FileText } from 'lucide-react-native';
import { supabase, type DocumentType } from '../lib/supabase';
import DocumentCard from '../components/DocumentCard';

export default function BookmarksScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [bookmarks, setBookmarks] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useFocusEffect(
    useCallback(() => { loadBookmarks(); }, [])
  );

  async function loadBookmarks() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) { setBookmarks([]); setLoading(false); return; }

      const { data } = await supabase
        .from('bookmarks')
        .select('document:document_id(id,title,course_code,course_name,university,doc_type,downloads_count,rating_avg,created_at)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const docs = (data ?? []).map((b: any) => b.document).filter(Boolean) as DocumentType[];
      setBookmarks(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookmarks();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Bookmarks</Text>
      </View>

      {!user ? (
        <View style={styles.centered}>
          <Bookmark size={48} color={theme.colors.grey4} />
          <Text style={[styles.centerTitle, { color: theme.colors.grey2 }]}>Sign in to save bookmarks</Text>
          <Text style={[styles.centerSub, { color: theme.colors.grey3 }]}>Your bookmarked documents will appear here</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.scrollContent}
        >
          {bookmarks.length === 0 && !loading ? (
            <View style={styles.centered}>
              <Bookmark size={48} color={theme.colors.grey4} />
              <Text style={[styles.centerTitle, { color: theme.colors.grey2 }]}>No bookmarks yet</Text>
              <Text style={[styles.centerSub, { color: theme.colors.grey3 }]}>Bookmark documents to find them quickly</Text>
            </View>
          ) : (
            bookmarks.map((doc) => (
              <DocumentCard key={doc.id} document={doc} onPress={() => navigation.navigate('DocumentDetail', { id: doc.id })} />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerTitle: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  centerSub: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },
});
