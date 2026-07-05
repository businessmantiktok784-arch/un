import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function ContactScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) { Alert.alert('Required', 'Subject and message are required.'); return; }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('contact_messages').insert({
        subject: subject.trim(), body: message.trim(), name: user?.email || 'Anonymous', email: user?.email || '',
      });
      Alert.alert('Sent', 'Thank you for reaching out. We will get back to you soon.');
      setSubject(''); setMessage('');
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
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Contact Us</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>SUBJECT *</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="What is this about?" placeholderTextColor={theme.colors.grey3} value={subject} onChangeText={setSubject} />
        <Text style={[styles.sectionTitle, { color: theme.colors.grey2 }]}>MESSAGE *</Text>
        <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0, minHeight: 150, textAlignVertical: 'top' }]} placeholder="Describe your issue or question..." placeholderTextColor={theme.colors.grey3} value={message} onChangeText={setMessage} multiline />
        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.colors.primary }, submitting && { opacity: 0.7 }]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Send Message</Text>}
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
