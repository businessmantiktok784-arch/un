import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@rneui/themed';
import { FileText, Download, Star } from 'lucide-react-native';
import { type DocumentType } from '../lib/supabase';

type Props = {
  document: DocumentType;
  onPress: () => void;
};

export default function DocumentCard({ document, onPress }: Props) {
  const { theme } = useTheme();

  const typeColors: Record<string, string> = {
    Exam: '#e53e3e',
    CAT: '#dd6b20',
    Assignment: '#3182ce',
    Notes: '#2563eb',
    'Lab Report': '#805ad5',
    Project: '#d69e2e',
    'Past Paper': '#e53e3e',
    Other: '#718096',
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.white }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: (typeColors[document.doc_type] ?? theme.colors.primary) + '12' }]}>
        <FileText size={20} color={typeColors[document.doc_type] ?? theme.colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.grey0 }]} numberOfLines={2}>
          {document.title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={[styles.course, { color: theme.colors.primary }]}>{document.course_code}</Text>
          <Text style={[styles.university, { color: theme.colors.grey2 }]} numberOfLines={1}>
            {document.university}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerItem}>
            <Download size={12} color={theme.colors.grey3} />
            <Text style={[styles.footerText, { color: theme.colors.grey3 }]}>{document.downloads_count ?? 0}</Text>
          </View>
          <View style={styles.footerItem}>
            <Star size={12} color="#f59e0b" />
            <Text style={[styles.footerText, { color: theme.colors.grey3 }]}>
              {(document.rating_avg ?? 0).toFixed(1)}
            </Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: (typeColors[document.doc_type] ?? theme.colors.primary) + '12' }]}>
            <Text style={[styles.typeText, { color: typeColors[document.doc_type] ?? theme.colors.primary }]}>
              {document.doc_type}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  course: {
    fontSize: 12,
    fontWeight: '600',
  },
  university: {
    fontSize: 12,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
