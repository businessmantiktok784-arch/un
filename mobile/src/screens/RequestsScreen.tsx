import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Plus, FileText, Clock, CheckCircle, XCircle, LogIn, ArrowUp, MessageCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const STATUS_COLORS: Record<string, string> = { pending: '#f59e0b', fulfilled: '#10b981', cancelled: '#ef4444' };
const STATUS_ICONS: Record<string, any> = { pending: Clock, fulfilled: CheckCircle, cancelled: XCircle };

export default function RequestsScreen() {
  const { theme } = useTheme();
  const nav = useNavigation<any>();
  const [requests, setRequests] = useState<any[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'fulfilled'>('all');

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsGuest(true); setLoading(false); return; }
    setIsGuest(false);

    const { data: reqs } = await supabase
      .from('document_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (reqs) setRequests(reqs);

    const { data: votes } = await supabase
      .from('request_votes')
      .select('request_id')
      .eq('user_id', user.id);
    setVotedIds(new Set((votes ?? []).map((v: any) => v.request_id)));
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const handleVote = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (votedIds.has(id)) {
      await supabase.from('request_votes').delete().eq('request_id', id).eq('user_id', user.id);
      setVotedIds((s) => { const n = new Set(s); n.delete(id); return n; });
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, votes_count: Math.max(0, r.votes_count - 1) } : r));
    } else {
      await supabase.from('request_votes').insert({ request_id: id, user_id: user.id });
      setVotedIds((s) => new Set(s).add(id));
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, votes_count: (r.votes_count || 0) + 1 } : r));
    }
  };

  const filtered = filter === 'all'
    ? requests
    : requests.filter((r) => r.status === filter);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Requests</Text>
        {!isGuest && (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.primary }]} onPress={() => nav.navigate('CreateRequest')}>
            <Plus size={18} color="#fff" />
            <Text style={styles.addText}>New</Text>
          </TouchableOpacity>
        )}
      </View>
      {!isGuest && (
        <View style={styles.filterRow}>
          {(['all', 'open', 'fulfilled'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, { backgroundColor: filter === f ? theme.colors.primary : theme.colors.white }]}
              onPress={() => setFilter(f)}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: filter === f ? '#fff' : theme.colors.grey2, textTransform: 'capitalize' }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 60 }} />
        ) : isGuest ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <LogIn size={48} color={theme.colors.grey4} />
            <Text style={[styles.emptyTitle, { color: theme.colors.grey2 }]}>Sign in required</Text>
            <Text style={[styles.emptySub, { color: theme.colors.grey3 }]}>Sign in to request documents from your university</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <FileText size={48} color={theme.colors.grey4} />
            <Text style={[styles.emptyTitle, { color: theme.colors.grey2 }]}>No requests</Text>
            <Text style={[styles.emptySub, { color: theme.colors.grey3 }]}>Tap "New" to request a document</Text>
          </View>
        ) : (
          filtered.map((req) => {
            const Icon = STATUS_ICONS[req.status] || Clock;
            const color = STATUS_COLORS[req.status] || theme.colors.grey3;
            const voted = votedIds.has(req.id);
            return (
              <TouchableOpacity key={req.id} style={[styles.card, { backgroundColor: theme.colors.white }]} onPress={() => nav.navigate('RequestDetail', { id: req.id })}>
                <View style={styles.voteCol}>
                  <TouchableOpacity onPress={() => handleVote(req.id)} style={{ padding: 2 }}>
                    <ArrowUp size={18} color={voted ? theme.colors.primary : theme.colors.grey3} />
                  </TouchableOpacity>
                  <Text style={[styles.voteCount, { color: voted ? theme.colors.primary : theme.colors.grey0 }]}>{req.votes_count || 0}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.docTitle, { color: theme.colors.grey0 }]}>{req.title || req.course_code}</Text>
                  <Text style={[styles.docDesc, { color: theme.colors.grey2 }]} numberOfLines={2}>{req.details}</Text>
                  <View style={styles.metaRow}>
                    <Icon size={13} color={color} />
                    <Text style={{ fontSize: 12, color, fontWeight: '600', textTransform: 'capitalize', marginLeft: 4 }}>{req.status}</Text>
                    <Text style={[styles.timeText, { color: theme.colors.grey3 }]}>{new Date(req.created_at).toLocaleDateString()}</Text>
                    <View style={styles.replyBadge}>
                      <MessageCircle size={12} color={theme.colors.grey3} />
                      <Text style={[styles.replyCount, { color: theme.colors.grey3 }]}>{req.answers_count || 0}</Text>
                    </View>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  card: { flexDirection: 'row', padding: 14, borderRadius: 12, marginBottom: 8 },
  voteCol: { alignItems: 'center', marginRight: 12, paddingTop: 2 },
  voteCount: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  docTitle: { fontSize: 15, fontWeight: '600' },
  docDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, flexWrap: 'wrap' },
  timeText: { fontSize: 11 },
  replyBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 8 },
  replyCount: { fontSize: 11 },
});
