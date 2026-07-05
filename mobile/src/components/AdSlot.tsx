import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@rneui/themed';

interface AdSlotProps {
  slot: string;
}

/**
 * Ad slot for mobile.
 * Uses react-native-google-mobile-ads when available.
 * Falls back to a placeholder when the package isn't installed
 * or when running in Expo Go (which doesn't support native modules).
 */
export default function AdSlot({ slot }: AdSlotProps) {
  const { theme } = useTheme();

  // When AdMob is properly set up, this block will render real banner ads.
  // See: https://docs.page/react-native-google-mobile-ads
  //
  // import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
  //
  // const adUnitId = __DEV__
  //   ? TestIds.BANNER
  //   : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID_ANDROID ?? '');
  //
  // return (
  //   <BannerAd
  //     unitId={adUnitId}
  //     size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
  //   />
  // );

  // Placeholder for now (also shown in Expo Go where native ads don't load)
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.text, { color: theme.colors.grey3 }]}>Ad space</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 8,
  },
  text: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
