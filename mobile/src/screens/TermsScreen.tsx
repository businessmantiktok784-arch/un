import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

export default function TermsScreen({ navigation }: any) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}><ArrowLeft size={22} color={theme.colors.grey0} /></TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Terms of Service</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.body, { color: theme.colors.grey1 }]}>
          Terms of Service for UniHub{'\n\n'}
          1. Acceptance of Terms{'\n'}
          By using UniHub, you agree to these terms. If you do not agree, do not use the service.{'\n\n'}
          2. User Content{'\n'}
          You retain rights to content you upload. You grant UniHub a license to display and distribute your content within the platform.{'\n\n'}
          3. Prohibited Conduct{'\n'}
          You agree not to upload copyrighted material without authorization, misuse the platform, or engage in any illegal activity.{'\n\n'}
          4. Termination{'\n'}
          We reserve the right to suspend or terminate accounts that violate these terms.{'\n\n'}
          5. Disclaimer{'\n'}
          UniHub provides the platform "as is" without warranties of any kind.{'\n\n'}
          6. Contact{'\n'}
          For questions, contact support@unihub.com.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  body: { fontSize: 13, lineHeight: 20 },
});
