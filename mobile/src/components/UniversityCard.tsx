import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@rneui/themed';
import { GraduationCap } from 'lucide-react-native';
import { type UniversityType } from '../lib/supabase';

type Props = {
  university: UniversityType;
  onPress?: () => void;
};

export default function UniversityCard({ university, onPress }: Props) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.colors.white }]} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
        <GraduationCap size={20} color={theme.colors.primary} />
      </View>
      <Text style={[styles.name, { color: theme.colors.grey0 }]} numberOfLines={1}>
        {university.abbr || university.name}
      </Text>
      <Text style={[styles.campuses, { color: theme.colors.grey2 }]}>
        {(university.campuses?.length ?? 0)} campus{(university.campuses?.length ?? 0) !== 1 ? 'es' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    padding: 14,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
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
    marginBottom: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  campuses: {
    fontSize: 11,
    marginTop: 4,
  },
});
