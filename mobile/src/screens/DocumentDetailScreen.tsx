import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Download, Bookmark, BookmarkCheck, Star, Calendar, FileText, Building2, Share2, MessageSquare } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useHistory } from '../contexts/HistoryContext';
import StarRating from '../components/StarRating';
import ShareModal from '../components/ShareModal';
import CommentItem from '../components/CommentItem';
import AdSlot from '../components/AdSlot';

export default function DocumentDetailScreen() {
  const { theme } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { id } = route.params;
  const { addEntry } = useHistory();
  const [doc, setDoc] = useState<any>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useFocusEffect(useCallback(() => {
    loadDocument();
    checkAuth();
    loadRating();
    loadComments();
  }, [id]));

  function trackHistory() {
    if (doc) addEntry({ id: doc.id, title: doc.title, course_code: doc.course_code, university: doc.university });
  }

  async function checkAuth() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      const { data: bm } = await supabase.from('bookmarks').select('*').eq('document_id', id).eq('user_id', data.user.id).maybeSingle();
      setIsBookmarked(!!bm);
    }
  }

  async function loadDocument() {
    try {
      const { data } = await supabase.from('documents').select('*').eq('id', id).maybeSingle();
      if (data) { setDoc(data); trackHistory(); }
    } catch (err) { console.error(err); }
  }

  async function loadRating() {
    try {
      const { data: rows } = await supabase.from('document_ratings').select('rating').eq('document_id', id);
      if (rows && rows.length > 0) {
        const total = rows.reduce((s, r) => s + r.rating, 0);
        setAvgRating(total / rows.length);
        setRatingCount(rows.length);
      }
      if (user) {
        const { data: mine } = await supabase.from('document_ratings').select('rating').eq('document_id', id).eq('user_id', user.id).maybeSingle();
        if (mine) setUserRating(mine.rating);
      }
    } catch {}
  }

  async function loadComments() {
    try {
      const { data } = await supabase.from('document_comments').select('*, profiles(full_name,email), replies:document_comments(*, profiles(full_name,email))').eq('document_id', id).is('parent_id', null).order('created_at', { ascending: false });
      if (data) setComments(data);
    } catch {}
  }

  async function handleRate(val: number) {
    if (!user) { Alert.alert('Sign In Required', 'Please sign in to rate documents.'); return; }
    await supabase.from('document_ratings').upsert({ document_id: id, user_id: user.id, rating: val }, { onConflict: 'document_id,user_id' });
    setUserRating(val);
    loadRating();
  }

  async function postComment() {
    if (!user) { Alert.alert('Sign In Required', 'Please sign in to comment.'); return; }
    if (!newComment.trim()) return;
    setPostingComment(true);
    await supabase.from('document_comments').insert({ document_id: id, user_id: user.id, body: newComment.trim() });
    setNewComment('');
    loadComments();
    setPostingComment(false);
  }

  async function toggleBookmark() {
    if (!user) { Alert.alert('Sign In Required', 'Please sign in to bookmark documents.'); return; }
    try {
      if (isBookmarked) {
        await supabase.from('bookmarks').delete().eq('document_id', id).eq('user_id', user.id);
        setIsBookmarked(false);
      } else {
        await supabase.from('bookmarks').insert({ document_id: id, user_id: user.id });
        setIsBookmarked(true);
      }
    } catch (err) { console.error(err); }
  }

  async function handleDownload() {
    if (!user) { Alert.alert('Sign In Required', 'Please sign in to download documents.'); return; }
    setDownloading(true);
    try {
      const { data, error } = await supabase.rpc('request_document_download', { _document_id: id });
      if (error) throw error;
      if (data && data[0]) {
        const { data: file } = await supabase.storage.from('documents').createSignedUrl(data[0].storage_path, 3600);
        if (file?.signedUrl) {
          Linking.openURL(file.signedUrl);
          setDoc((prev: any) => prev ? { ...prev, downloads_count: (prev.downloads_count ?? 0) + 1 } : prev);
        }
      }
    } catch (err: any) {
      Alert.alert('Download Failed', err.message || 'Could not download file.');
    } finally { setDownloading(false); }
  }

  if (!doc) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loading}><Text style={{ color: theme.colors.grey2 }}>Loading document...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><ArrowLeft size={22} color={theme.colors.grey0} /></TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowShare(true)} style={styles.iconBtn}><Share2 size={20} color={theme.colors.grey2} /></TouchableOpacity>
          <TouchableOpacity onPress={toggleBookmark} style={styles.iconBtn}>
            {isBookmarked ? <BookmarkCheck size={22} color={theme.colors.primary} /> : <Bookmark size={22} color={theme.colors.grey2} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary + '15' }]}>
            <FileText size={14} color={theme.colors.primary} />
            <Text style={[styles.typeText, { color: theme.colors.primary }]}>{doc.doc_type}</Text>
          </View>

          <Text style={[styles.title, { color: theme.colors.grey0 }]}>{doc.title}</Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}><Building2 size={16} color={theme.colors.grey2} /><Text style={[styles.metaText, { color: theme.colors.grey1 }]}>{doc.university}</Text></View>
            <View style={styles.metaItem}><FileText size={16} color={theme.colors.grey2} /><Text style={[styles.metaText, { color: theme.colors.grey1 }]}>{doc.course_code}</Text></View>
            <View style={styles.metaItem}><Calendar size={16} color={theme.colors.grey2} /><Text style={[styles.metaText, { color: theme.colors.grey1 }]}>{new Date(doc.created_at).toLocaleDateString()}</Text></View>
            <View style={styles.metaItem}><Download size={16} color={theme.colors.grey2} /><Text style={[styles.metaText, { color: theme.colors.grey1 }]}>{doc.downloads_count ?? 0} downloads</Text></View>
          </View>

          {/* Star Rating */}
          <View style={styles.ratingSection}>
            <Text style={[styles.sectionLabel, { color: theme.colors.grey0 }]}>Rating</Text>
            <View style={styles.ratingRow}>
              <StarRating rating={userRating || avgRating} size={22} interactive onRate={handleRate} />
              <Text style={[styles.ratingNum, { color: theme.colors.grey0 }]}>{(avgRating || doc.rating_avg || 0).toFixed(1)}</Text>
              <Text style={[styles.ratingCount, { color: theme.colors.grey2 }]}>({ratingCount || doc.rating_count || 0})</Text>
            </View>
            {user && <Text style={[styles.ratingHint, { color: theme.colors.grey3 }]}>{userRating > 0 ? 'Tap to change your rating' : 'Tap a star to rate'}</Text>}
          </View>

          {doc.description && (
            <View style={styles.descriptionBox}>
              <Text style={[styles.descriptionTitle, { color: theme.colors.grey0 }]}>Description</Text>
              <Text style={[styles.descriptionText, { color: theme.colors.grey1 }]}>{doc.description}</Text>
            </View>
          )}

          {doc.course_name && <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.colors.grey2 }]}>Course</Text><Text style={[styles.infoValue, { color: theme.colors.grey0 }]}>{doc.course_name}</Text></View>}
          {doc.faculty && <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.colors.grey2 }]}>Faculty</Text><Text style={[styles.infoValue, { color: theme.colors.grey0 }]}>{doc.faculty}</Text></View>}
          {doc.semester && <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.colors.grey2 }]}>Semester</Text><Text style={[styles.infoValue, { color: theme.colors.grey0 }]}>{doc.semester}</Text></View>}
          {doc.academic_year && <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.colors.grey2 }]}>Academic Year</Text><Text style={[styles.infoValue, { color: theme.colors.grey0 }]}>{doc.academic_year}</Text></View>}

          {/* Fair Use Notice */}
          <View style={[styles.noticeBox, { backgroundColor: theme.colors.grey5, borderColor: theme.colors.grey4 }]}>
            <Text style={[styles.noticeText, { color: theme.colors.grey1 }]}>
              This document is shared for educational purposes. Respect the author's copyright.
            </Text>
          </View>

          {/* Comments — fully wired using CommentItem + document_comments table */}
          <AdSlot slot="doc-detail-inline" />
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <MessageSquare size={18} color={theme.colors.grey0} />
              <Text style={[styles.sectionLabel, { color: theme.colors.grey0 }]}>Comments ({comments.length})</Text>
            </View>

            {user && (
              <View style={styles.commentInputRow}>
                <TextInput style={[styles.commentInput, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="Write a comment..." placeholderTextColor={theme.colors.grey3} value={newComment} onChangeText={setNewComment} multiline />
                <TouchableOpacity style={[styles.postBtn, { backgroundColor: theme.colors.primary }]} onPress={postComment} disabled={postingComment || !newComment.trim()}>
                  {postingComment ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postText}>Post</Text>}
                </TouchableOpacity>
              </View>
            )}

            {comments.length === 0 ? (
              <Text style={[styles.noComments, { color: theme.colors.grey3 }]}>No comments yet. Be the first to comment!</Text>
            ) : (
              comments.map((c) => <CommentItem key={c.id} comment={c} userId={user?.id} onRefresh={loadComments} />)
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.colors.white, borderTopColor: theme.colors.grey5 }]}>
        <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: theme.colors.primary }]} onPress={handleDownload} disabled={downloading}>
          <Download size={18} color="#fff" />
          <Text style={styles.downloadBtnText}>{downloading ? 'Opening...' : 'Download'}</Text>
        </TouchableOpacity>
      </View>

      <ShareModal visible={showShare} onClose={() => setShowShare(false)} title={doc.title} url={`unihub://document/${id}`} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { padding: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 12 },
  typeText: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 30, marginBottom: 16, letterSpacing: -0.3 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13 },
  ratingSection: { marginBottom: 20 },
  sectionLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingNum: { fontSize: 18, fontWeight: '700' },
  ratingCount: { fontSize: 13 },
  ratingHint: { fontSize: 11, marginTop: 4 },
  descriptionBox: { marginBottom: 20 },
  descriptionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  descriptionText: { fontSize: 14, lineHeight: 22 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '500' },
  noticeBox: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  noticeText: { fontSize: 12, textAlign: 'center', lineHeight: 16 },
  commentsSection: { marginBottom: 20 },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  commentInputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  commentInput: { flex: 1, padding: 12, borderRadius: 12, fontSize: 13, minHeight: 40 },
  postBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, justifyContent: 'center' },
  postText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  noComments: { fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  bottomBar: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  downloadBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
