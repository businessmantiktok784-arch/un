import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';

const faqs = [
  { q: 'How do I upload a document?', a: 'Go to the Upload tab, fill in the course details, and select the PDF file to upload.' },
  { q: 'Can I edit or delete my uploads?', a: 'Yes, tap the menu icon on your uploaded document and select Edit or Delete.' },
  { q: 'How do I download a document?', a: 'Open a document and tap the download button (PDF icon) to save it to your device.' },
  { q: 'How are documents rated?', a: 'Each user can rate a document once from 1 to 5 stars. The average rating is shown on the document card.' },
  { q: 'How do I request a document?', a: 'Go to the Requests tab and tap "New". Fill in the course code and details.' },
  { q: 'How do I report an issue?', a: 'Use the Contact form or email us at support@unihub.com.' },
  { q: 'Can I change my notification settings?', a: 'Go to Settings to toggle opportunity alerts and reply notifications.' },
  { q: 'How is my data protected?', a: 'We take your privacy seriously. See our Privacy Policy for details.' },
];

export default function HelpScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}><ArrowLeft size={22} color={theme.colors.grey0} /></TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Help & FAQ</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {faqs.map((faq, i) => {
          const isOpen = openIdx === i;
          return (
            <TouchableOpacity key={i} style={[styles.faqCard, { backgroundColor: theme.colors.white }]} onPress={() => setOpenIdx(isOpen ? null : i)} activeOpacity={0.7}>
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQ, { color: theme.colors.grey0 }]}>{faq.q}</Text>
                {isOpen ? <ChevronUp size={18} color={theme.colors.grey2} /> : <ChevronDown size={18} color={theme.colors.grey2} />}
              </View>
              {isOpen && <Text style={[styles.faqA, { color: theme.colors.grey2 }]}>{faq.a}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  faqCard: { padding: 16, borderRadius: 12, marginBottom: 8 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 },
  faqA: { fontSize: 13, lineHeight: 18, marginTop: 10 },
});
