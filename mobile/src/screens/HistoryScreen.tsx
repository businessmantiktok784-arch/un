import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { Clock, Trash2, FileText } from 'lucide-react-native';
import { useHistory } from '../contexts/HistoryContext';

function fmtTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function HistoryScreen() {
  const { theme } = useTheme();
  const nav = useNavigation<any>();
  const { entries, removeEntry, clearAll } = useHistory();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>History</Text>
        {entries.length > 0 && (
          <TouchableOpacity onPress={clearAll}><Text style={[styles.clearBtn, { color: theme.colors.error }]}>Clear All</Text></TouchableOpacity>
        )}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={entries.length === 0 ? styles.centered : { paddingHorizontal: 16, paddingBottom: 20 }}>
        {entries.length === 0 ? (
          <View style={{ alignItems: 'center' }}>
            <Clock size={48} color={theme.colors.grey4} />
            <Text style={[styles.emptyTitle, { color: theme.colors.grey2 }]}>No history yet</Text>
            <Text style={[styles.emptySub, { color: theme.colors.grey3 }]}>Documents you view will appear here</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <TouchableOpacity key={entry.id} style={[styles.card, { backgroundColor: theme.colors.white }]} onPress={() => nav.navigate('DocumentDetail', { id: entry.id })}>
              <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '12' }]}>
                <FileText size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.docTitle, { color: theme.colors.grey0 }]} numberOfLines={1}>{entry.title}</Text>
                <Text style={[styles.docMeta, { color: theme.colors.grey2 }]}>{entry.course_code} - {entry.university}</Text>
                <Text style={[styles.timeText, { color: theme.colors.grey3 }]}>{fmtTime(entry.viewed_at)}</Text>
              </View>
              <TouchableOpacity onPress={() => removeEntry(entry.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Trash2 size={16} color={theme.colors.grey3} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  clearBtn: { fontSize: 14, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySub: { fontSize: 13, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  docTitle: { fontSize: 14, fontWeight: '600' },
  docMeta: { fontSize: 12, marginTop: 2 },
  timeText: { fontSize: 11, marginTop: 2 },
});
