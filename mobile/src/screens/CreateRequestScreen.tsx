import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function CreateRequestScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [courseCode, setCourseCode] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!courseCode.trim()) { Alert.alert('Required', 'Course code is required'); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Sign In Required', 'Please sign in to submit a request.'); return; }
      const { data: profile } = await supabase.from('profiles').select('university').eq('id', user.id).single();
      await supabase.from('document_requests').insert({
        requester_id: user.id, course_code: courseCode.trim(), title: docTitle.trim() || courseCode.trim(),
        details: description.trim() || null, university: profile?.university || null,
      });
      Alert.alert('Submitted', 'Your request has been submitted.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}><ArrowLeft size={22} color={theme.colors.grey0} /></TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>New Request</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>COURSE CODE *</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="e.g. CSC 301" placeholderTextColor={theme.colors.grey3} value={courseCode} onChangeText={setCourseCode} autoCapitalize="characters" />
        <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>DOCUMENT TITLE</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="e.g. Past Exam Paper 2023" placeholderTextColor={theme.colors.grey3} value={docTitle} onChangeText={setDocTitle} />
        <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>DESCRIPTION</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0, minHeight: 100, textAlignVertical: 'top' }]} placeholder="Any specific details about what you need..." placeholderTextColor={theme.colors.grey3} value={description} onChangeText={setDescription} multiline />
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.colors.primary }, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Request</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  input: { padding: 16, borderRadius: 12, fontSize: 15 },
  submitBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
