import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface Props {
  rating: number;
  max?: number;
  size?: number;
  color?: string;
  interactive?: boolean;
  onRate?: (val: number) => void;
}

export default function StarRating({ rating, max = 5, size = 18, color = '#f59e0b', interactive = false, onRate }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: max }, (_, i) => (
        <TouchableOpacity key={i} disabled={!interactive} onPress={() => onRate?.(i + 1)} style={{ padding: 2 }}>
          <Star size={size} fill={i < rating ? color : 'transparent'} color={color} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
});
