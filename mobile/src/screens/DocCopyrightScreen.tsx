import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

export default function DocCopyrightScreen({ navigation }: any) {
  const { theme } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}><ArrowLeft size={22} color={theme.colors.grey0} /></TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Copyright Notice</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.body, { color: theme.colors.grey1 }]}>
          Copyright Notice for UniHub{'\n\n'}
          All documents uploaded to UniHub are the intellectual property of their respective owners.{'\n\n'}
          By uploading content, you confirm that you have the right to share it. If you believe your copyrighted
          work has been uploaded without authorization, please contact us at copyright@unihub.com.{'\n\n'}
          UniHub respects intellectual property rights and will respond to takedown requests in accordance
          with applicable law.
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
