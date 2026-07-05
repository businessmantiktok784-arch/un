import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { supabase } from '../lib/supabase';

const universities = [
  'University of Rwanda', 'University of Kigali', 'Carnegie Mellon University Africa',
  'African Leadership University', 'Mount Kenya University', 'INES Ruhengeri',
  'University of Global Health Equity', 'Rwanda Polytechnic',
];

const years = ['1', '2', '3', '4', '5', '6'];

export default function OnboardingScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);
  const [university, setUniversity] = useState('');
  const [program, setProgram] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleFinish() {
    if (!university || !program || !yearOfStudy) { Alert.alert('Complete all fields'); return; }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Sign In Required', 'Please sign in first.'); navigation.goBack(); return; }
      await supabase.from('profiles').upsert({ id: user.id, university, program, year_of_study: parseInt(yearOfStudy), full_name: user.user_metadata?.full_name || '' });
      await supabase.from('notification_subscriptions').upsert({ user_id: user.id, opportunities: false, document_replies: false });
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    <View key={0}>
      <Text style={[styles.heading, { color: theme.colors.grey0 }]}>Select your university</Text>
      <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator>
        {universities.map((u) => (
          <TouchableOpacity key={u} style={[styles.option, { backgroundColor: university === u ? theme.colors.primary + '15' : theme.colors.white }]} onPress={() => setUniversity(u)}>
            <Text style={[styles.optionText, { color: university === u ? theme.colors.primary : theme.colors.grey0 }]}>{u}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>,
    <View key={1}>
      <Text style={[styles.heading, { color: theme.colors.grey0 }]}>Enter your program</Text>
      <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="e.g. BSc Computer Science" placeholderTextColor={theme.colors.grey3} value={program} onChangeText={setProgram} />
    </View>,
    <View key={2}>
      <Text style={[styles.heading, { color: theme.colors.grey0 }]}>Year of study</Text>
      <View style={styles.yearGrid}>
        {years.map((y) => (
          <TouchableOpacity key={y} style={[styles.yearChip, { backgroundColor: yearOfStudy === y ? theme.colors.primary : theme.colors.white }]} onPress={() => setYearOfStudy(y)}>
            <Text style={{ color: yearOfStudy === y ? '#fff' : theme.colors.grey0, fontWeight: '600', fontSize: 16 }}>{y}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>,
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.progress}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i <= step ? theme.colors.primary : theme.colors.grey4 }]} />
        ))}
      </View>
      <View style={styles.content}>{steps[step]}</View>
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep(step - 1)}>
            <Text style={[styles.backText, { color: theme.colors.grey2 }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: theme.colors.primary }, saving && { opacity: 0.7 }]}
          onPress={() => step < 2 ? setStep(step + 1) : handleFinish()}
          disabled={saving}
        >
          <Text style={styles.nextText}>{saving ? 'Saving...' : step < 2 ? 'Next' : 'Finish'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32, marginTop: 16 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  content: { flex: 1, justifyContent: 'center' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 20 },
  option: { padding: 16, borderRadius: 12, marginBottom: 8 },
  optionText: { fontSize: 15, fontWeight: '500' },
  input: { padding: 16, borderRadius: 12, fontSize: 15 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  yearChip: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  backText: { fontSize: 16, fontWeight: '500' },
  nextBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
