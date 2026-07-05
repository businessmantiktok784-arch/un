import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { Reply, MoreVertical } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

interface Props {
  comment: any;
  userId: string | null;
  onRefresh: () => void;
}

function fmt(ts: string) {
  const d = new Date(ts);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export default function CommentItem({ comment, userId, onRefresh }: Props) {
  const { theme } = useTheme();
  const nav = useNavigation<any>();
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting] = useState(false);

  const postReply = async () => {
    if (!replyText.trim() || !userId) return;
    setPosting(true);
    await supabase.from('document_comments').insert({ document_id: comment.document_id, user_id: userId, body: replyText.trim(), parent_id: comment.id });
    setReplyText(''); setShowReply(false); onRefresh();
    setPosting(false);
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={[styles.commentBox, { backgroundColor: theme.colors.white }]}>
        <Text style={[styles.author, { color: theme.colors.grey0 }]}>{comment.profiles?.full_name || comment.profiles?.email || 'Anonymous'}</Text>
        <Text style={[styles.content, { color: theme.colors.grey1 }]}>{comment.content}</Text>
        <View style={styles.meta}>
          <Text style={[styles.time, { color: theme.colors.grey3 }]}>{fmt(comment.created_at)}</Text>
          <TouchableOpacity onPress={() => setShowReply(!showReply)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Reply size={12} color={theme.colors.grey2} />
            <Text style={[styles.replyBtn, { color: theme.colors.grey2 }]}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showReply && (
        <View style={styles.replyInput}>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.grey0 }]} placeholder="Write a reply..." placeholderTextColor={theme.colors.grey3} value={replyText} onChangeText={setReplyText} multiline />
          <TouchableOpacity style={[styles.postBtn, { backgroundColor: theme.colors.primary }]} onPress={postReply} disabled={posting || !replyText.trim()}>
            <Text style={styles.postText}>Post</Text>
          </TouchableOpacity>
        </View>
      )}
      {comment.replies?.map((reply: any) => (
        <View key={reply.id} style={[styles.commentBox, { backgroundColor: theme.colors.background, marginLeft: 24, marginTop: 6 }]}>
          <Text style={[styles.author, { color: theme.colors.grey0 }]}>{reply.profiles?.full_name || reply.profiles?.email || 'Anonymous'}</Text>
          <Text style={[styles.content, { color: theme.colors.grey1 }]}>{reply.content}</Text>
          <Text style={[styles.time, { color: theme.colors.grey3 }]}>{fmt(reply.created_at)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  commentBox: { padding: 12, borderRadius: 12 },
  author: { fontSize: 13, fontWeight: '600' },
  content: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  time: { fontSize: 11 },
  replyBtn: { fontSize: 12 },
  replyInput: { marginLeft: 24, marginTop: 4, gap: 6 },
  input: { padding: 10, borderRadius: 8, fontSize: 13, minHeight: 36 },
  postBtn: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  postText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
