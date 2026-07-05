import { View, Text, StyleSheet, TouchableOpacity, Share, Modal } from 'react-native';
import { useTheme } from '@rneui/themed';
import { Link2, X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export default function ShareModal({ visible, onClose, title, url }: Props) {
  const { theme } = useTheme();

  const shareNative = async () => {
    try { await Share.share({ title, url }); } catch {}
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.container, { backgroundColor: theme.colors.white }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.grey0 }]}>Share</Text>
            <TouchableOpacity onPress={onClose}><X size={20} color={theme.colors.grey2} /></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.option, { backgroundColor: theme.colors.primary + '08' }]} onPress={shareNative}>
            <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '15' }]}><Link2 size={20} color={theme.colors.primary} /></View>
            <Text style={[styles.optionText, { color: theme.colors.grey0 }]}>Share via</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  title: { fontSize: 18, fontWeight: '700' },
  option: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginHorizontal: 16, marginTop: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontSize: 15, fontWeight: '500', marginLeft: 12 },
});
