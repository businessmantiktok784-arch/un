import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

export default function AboutScreen({ navigation }: any) {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}><ArrowLeft size={22} color={theme.colors.grey0} /></TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>About UniHub</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 32, gap: 16 }}>
        <Image source={require('../../assets/logo.png')} style={{ width: 80, height: 80 }} resizeMode="contain" />
        <Text style={[styles.appName, { color: theme.colors.grey0 }]}>UniHub</Text>
        <Text style={[styles.version, { color: theme.colors.grey2 }]}>Version 1.0.0</Text>
        <Text style={[styles.description, { color: theme.colors.grey1 }]}>
          UniHub is a document-sharing platform for university students. Share past exam papers, lecture notes, and
          study materials with your peers. Discover opportunities, request documents, and connect with your academic
          community.
        </Text>
        <Text style={[styles.footer, { color: theme.colors.grey3 }]}>Made with dedication for students everywhere.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  appName: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  version: { fontSize: 14 },
  description: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  footer: { fontSize: 12, marginTop: 16, textAlign: 'center' },
});
