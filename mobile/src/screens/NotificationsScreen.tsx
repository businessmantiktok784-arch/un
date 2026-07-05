import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { Bell, ArrowLeft, Trash2, CheckCheck, Megaphone, Upload, MessageSquare, FileText, Clock } from 'lucide-react-native';
import { useNotifications } from '../contexts/NotificationContext';

const typeIcons: Record<string, any> = {
  opportunity: Megaphone,
  upload: Upload,
  comment: MessageSquare,
  request: FileText,
};

function fmtTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function NotificationsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { notifications, unreadCount, loading, markRead, markAllRead, deleteNotification, clearAll } = useNotifications();

  const handleClearAll = () => {
    Alert.alert('Clear All', 'Delete all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearAll },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.colors.grey0} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={styles.headerBtn}>
              <CheckCheck size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.headerBtn}>
              <Trash2 size={20} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.centered}>
            <Text style={[styles.centerText, { color: theme.colors.grey3 }]}>Loading...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centered}>
            <Bell size={48} color={theme.colors.grey4} />
            <Text style={[styles.centerTitle, { color: theme.colors.grey2 }]}>No notifications</Text>
            <Text style={[styles.centerSub, { color: theme.colors.grey3 }]}>You're all caught up!</Text>
          </View>
        ) : (
          notifications.map((notif) => {
            const Icon = typeIcons[notif.type] || Bell;
            return (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, !notif.read && styles.notifUnread, { backgroundColor: theme.colors.white }]}
                onPress={() => { if (!notif.read) markRead(notif.id); }}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: notif.read ? theme.colors.grey5 : theme.colors.primary + '15' }]}>
                  <Icon size={20} color={notif.read ? theme.colors.grey3 : theme.colors.primary} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, { color: theme.colors.grey0 }]}>{notif.title}</Text>
                  {notif.body && <Text style={[styles.notifBody, { color: theme.colors.grey2 }]} numberOfLines={2}>{notif.body}</Text>}
                  <View style={styles.notifFooter}>
                    <Clock size={12} color={theme.colors.grey3} />
                    <Text style={[styles.notifTime, { color: theme.colors.grey3 }]}>{fmtTime(notif.created_at)}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteNotification(notif.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Trash2 size={16} color={theme.colors.grey3} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerBtn: { padding: 4 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20, flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerText: { fontSize: 14 },
  centerTitle: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  centerSub: { fontSize: 13, marginTop: 4 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notifUnread: {
    borderLeftWidth: 3,
        borderLeftColor: '#2563eb',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: { flex: 1, marginLeft: 12 },
  notifTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  notifBody: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  notifFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  notifTime: { fontSize: 11 },
  deleteBtn: { padding: 4, marginLeft: 8 },
});
