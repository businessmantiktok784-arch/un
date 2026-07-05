import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyScreen({ navigation }: any) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}><ArrowLeft size={22} color={theme.colors.grey0} /></TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Privacy Policy</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.body, { color: theme.colors.grey1 }]}>
          Privacy Policy for UniHub{'\n\n'}
          1. Information We Collect{'\n'}
          We collect information you provide when creating an account, uploading documents, and using platform features.{'\n\n'}
          2. How We Use Your Information{'\n'}
          Your information is used to provide and improve the service, send notifications you opted into, and respond to your inquiries.{'\n\n'}
          3. Data Sharing{'\n'}
          We do not sell your personal data. We may share data with service providers who help operate the platform.{'\n\n'}
          4. Security{'\n'}
          We implement reasonable security measures to protect your data. However, no method is 100% secure.{'\n\n'}
          5. Your Rights{'\n'}
          You can access, update, or delete your account data at any time through your profile settings.{'\n\n'}
          6. Contact{'\n'}
          For privacy concerns, contact support@unihub.com.
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
