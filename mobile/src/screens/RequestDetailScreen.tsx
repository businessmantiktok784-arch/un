import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { ArrowLeft, Clock, CheckCircle, XCircle, Trash2, ArrowUp, Paperclip, Upload, FileText, MessageCircle } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import * as DocumentPicker from 'expo-document-picker';

export default function RequestDetailScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const { id } = route.params;
  const [req, setReq] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [voted, setVoted] = useState(false);
  const [voting, setVoting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [answerBody, setAnswerBody] = useState('');
  const [answerFile, setAnswerFile] = useState<any>(null);
  const [posting, setPosting] = useState(false);
  const [showAnswerForm, setShowAnswerForm] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: reqData } = await supabase.from('document_requests').select('*').eq('id', id).single();
      setReq(reqData);

      const { data: ansData } = await supabase
        .from('request_answers')
        .select('*')
        .eq('request_id', id)
        .order('created_at', { ascending: true });
      setAnswers(ansData ?? []);

      if (user) {
        const { data: voteData } = await supabase
          .from('request_votes')
          .select('id')
          .eq('request_id', id)
          .eq('user_id', user.id)
          .maybeSingle();
        setVoted(!!voteData);
      }

      setLoading(false);
    })();
  }, [id]);

  const handleVote = async () => {
    setVoting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert('Sign In Required', 'Please sign in to vote.'); setVoting(false); return; }
    if (voted) {
      await supabase.from('request_votes').delete().eq('request_id', id).eq('user_id', user.id);
      setVoted(false);
      setReq((prev: any) => prev ? { ...prev, votes_count: Math.max(0, prev.votes_count - 1) } : prev);
    } else {
      await supabase.from('request_votes').insert({ request_id: id, user_id: user.id });
      setVoted(true);
      setReq((prev: any) => prev ? { ...prev, votes_count: (prev.votes_count || 0) + 1 } : prev);
    }
    setVoting(false);
  };

  const cancel = () => {
    Alert.alert('Cancel Request', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { Alert.alert('Sign In Required', 'Please sign in to cancel a request.'); return; }
        if (req.requester_id !== user.id) { Alert.alert('Unauthorized', 'You can only cancel your own requests.'); return; }
        await supabase.from('document_requests').update({ status: 'cancelled' }).eq('id', id).eq('requester_id', user.id);
        navigation.goBack();
      }},
    ]);
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (!result.canceled && result.assets?.[0]) setAnswerFile(result.assets[0]);
  };

  const postAnswer = async () => {
    if (!answerBody.trim() && !answerFile) { Alert.alert('Add content', 'Write a message or attach a file.'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert('Sign In Required', 'Please sign in to answer.'); return; }
    setPosting(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;
      if (answerFile) {
        const safe = answerFile.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80);
        const path = `${user.id}/answers/${Date.now()}-${safe}`;
        const response = await fetch(answerFile.uri);
        const blob = await response.blob();
        const { error: upErr } = await supabase.storage.from('documents').upload(path, blob, { upsert: false });
        if (upErr) throw upErr;
        fileUrl = path;
        fileName = answerFile.name;
      }
      const { error } = await supabase.from('request_answers').insert({
        request_id: id, responder_id: user.id, body: answerBody.trim() || null, file_name: fileName, file_url: fileUrl,
      });
      if (error) throw error;
      const { data: newAns } = await supabase.from('request_answers').select('*').eq('request_id', id).order('created_at', { ascending: true });
      setAnswers(newAns ?? []);
      setAnswerBody(''); setAnswerFile(null); setShowAnswerForm(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally { setPosting(false); }
  };

  const openFile = async (url: string) => {
    const { data } = await supabase.storage.from('documents').createSignedUrl(url, 60 * 5);
    if (data?.signedUrl) Linking.openURL(data.signedUrl);
  };

  if (loading || !req) return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}><ArrowLeft size={22} color={theme.colors.grey0} /></TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Request Details</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={[styles.card, { backgroundColor: theme.colors.white }]}>
          <View style={styles.voteRow}>
            <TouchableOpacity onPress={handleVote} disabled={voting} style={[styles.voteBtn, { backgroundColor: voted ? theme.colors.primary + '15' : theme.colors.background }]}>
              <ArrowUp size={20} color={voted ? theme.colors.primary : theme.colors.grey2} />
              <Text style={[styles.voteCount, { color: voted ? theme.colors.primary : theme.colors.grey0 }]}>{req.votes_count || 0}</Text>
            </TouchableOpacity>
            <View style={styles.voteInfo}>
              <Text style={[styles.reqTitle, { color: theme.colors.grey0 }]}>{req.title || req.course_code}</Text>
              <Text style={[styles.reqDesc, { color: theme.colors.grey2 }]}>{req.details}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: theme.colors.grey2 }]}>Status</Text>
            <Text style={[styles.metaValue, { color: req.status === 'fulfilled' ? '#10b981' : req.status === 'cancelled' ? '#ef4444' : '#f59e0b', textTransform: 'capitalize' }]}>{req.status}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: theme.colors.grey2 }]}>Course Code</Text>
            <Text style={[styles.metaValue, { color: theme.colors.grey0 }]}>{req.course_code}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: theme.colors.grey2 }]}>University</Text>
            <Text style={[styles.metaValue, { color: theme.colors.grey0 }]}>{req.university || 'N/A'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: theme.colors.grey2 }]}>Submitted</Text>
            <Text style={[styles.metaValue, { color: theme.colors.grey0 }]}>{new Date(req.created_at).toLocaleDateString()}</Text>
          </View>
          {req.status === 'pending' && (
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.colors.error }]} onPress={cancel}>
              <Trash2 size={16} color={theme.colors.error} />
              <Text style={[styles.cancelText, { color: theme.colors.error }]}>Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.grey0 }]}>
          Answers ({answers.length})
        </Text>

        {answers.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.grey3 }]}>No answers yet. Be the first to respond!</Text>
        ) : (
          answers.map((a) => (
            <View key={a.id} style={[styles.answerCard, { backgroundColor: theme.colors.white }]}>
              {a.body && <Text style={[styles.answerBody, { color: theme.colors.grey0 }]}>{a.body}</Text>}
              {a.file_name && (
                <TouchableOpacity style={styles.fileRow} onPress={() => openFile(a.file_url)}>
                  <FileText size={16} color={theme.colors.primary} />
                  <Text style={[styles.fileName, { color: theme.colors.primary }]}>{a.file_name}</Text>
                </TouchableOpacity>
              )}
              <Text style={[styles.answerTime, { color: theme.colors.grey3 }]}>{new Date(a.created_at).toLocaleDateString()}</Text>
            </View>
          ))
        )}

        {!showAnswerForm ? (
          <TouchableOpacity style={[styles.answerBtn, { backgroundColor: theme.colors.primary }]} onPress={() => setShowAnswerForm(true)}>
            <MessageCircle size={16} color="#fff" />
            <Text style={styles.answerBtnText}>Post an Answer</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.answerForm, { backgroundColor: theme.colors.white }]}>
            <TextInput
              style={[styles.answerInput, { backgroundColor: theme.colors.background, color: theme.colors.grey0 }]}
              placeholder="Write a message..."
              placeholderTextColor={theme.colors.grey3}
              value={answerBody} onChangeText={setAnswerBody} multiline
            />
            {answerFile ? (
              <View style={styles.fileAttached}>
                <FileText size={16} color={theme.colors.primary} />
                <Text style={[styles.fileLabel, { color: theme.colors.grey0 }]} numberOfLines={1}>{answerFile.name}</Text>
                <TouchableOpacity onPress={() => setAnswerFile(null)}><Text style={{ color: theme.colors.error, fontSize: 13 }}>Remove</Text></TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.attachBtn} onPress={pickFile}>
                <Paperclip size={16} color={theme.colors.grey2} />
                <Text style={[styles.attachText, { color: theme.colors.grey2 }]}>Attach PDF</Text>
              </TouchableOpacity>
            )}
            <View style={styles.formActions}>
              <TouchableOpacity onPress={() => { setShowAnswerForm(false); setAnswerBody(''); setAnswerFile(null); }}>
                <Text style={[styles.cancelText, { color: theme.colors.grey2 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.postBtn, { backgroundColor: theme.colors.primary }]} onPress={postAnswer} disabled={posting}>
                {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postText}>Submit Answer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  card: { padding: 16, borderRadius: 12 },
  voteRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  voteBtn: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, minWidth: 44 },
  voteCount: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  voteInfo: { flex: 1 },
  reqTitle: { fontSize: 18, fontWeight: '700' },
  reqDesc: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  metaLabel: { fontSize: 13 },
  metaValue: { fontSize: 14, fontWeight: '500' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1.5, marginTop: 12 },
  cancelText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  answerCard: { padding: 14, borderRadius: 12 },
  answerBody: { fontSize: 14, lineHeight: 20 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  fileName: { fontSize: 13, fontWeight: '500' },
  answerTime: { fontSize: 11, marginTop: 6 },
  answerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  answerBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  answerForm: { padding: 14, borderRadius: 12, gap: 10 },
  answerInput: { padding: 12, borderRadius: 10, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  attachBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  attachText: { fontSize: 13 },
  fileAttached: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  fileLabel: { flex: 1, fontSize: 13 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, alignItems: 'center', marginTop: 4 },
  postBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, minWidth: 80, alignItems: 'center' },
  postText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
