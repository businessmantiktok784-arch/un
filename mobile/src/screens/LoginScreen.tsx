import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { LogIn, ArrowRight } from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { LOGIN_ILLUSTRATION } from '../constants/loginIllustration';

export default function LoginScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        navigation.replace('MainTabs');
      } else {
        setChecking(false);
      }
    });
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // For mobile, we use a simplified approach - just navigate to main
      // Real OAuth requires deep linking configuration per platform
      // This is a placeholder that will work in Expo Go for testing
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'unihub://login-callback',
        },
      });
      if (error) {
        console.error('Login error:', error);
        setLoading(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
      setLoading(false);
    }
  };

  const continueAsGuest = () => {
    navigation.replace('MainTabs');
  };

  if (checking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationSection}>
          <SvgXml xml={LOGIN_ILLUSTRATION} width={300} height={300} />
        </View>

        {/* Logo & Title */}
        <View style={styles.logoSection}>
          <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
          <Text style={[styles.subtitle, { color: theme.colors.grey2 }]}>
            Your Academic Resources, All in One Hub
          </Text>
        </View>

        {/* Login Options */}
        <View style={styles.buttonsSection}>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <LogIn size={20} color="#fff" />
                <Text style={styles.loginButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.grey4 }]} />
            <Text style={[styles.dividerText, { color: theme.colors.grey2 }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.grey4 }]} />
          </View>

          <TouchableOpacity
            style={[styles.guestButton, { borderColor: theme.colors.grey4 }]}
            onPress={continueAsGuest}
            activeOpacity={0.8}
          >
            <ArrowRight size={18} color={theme.colors.grey1} />
            <Text style={[styles.guestButtonText, { color: theme.colors.grey1 }]}>
              Continue as Guest
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.grey3 }]}>
            By continuing you agree to our{' '}
            <Text style={[styles.link, { color: theme.colors.primary }]} onPress={() => navigation.navigate('Terms')}>
              Terms
            </Text>{' '}
            and{' '}
            <Text style={[styles.link, { color: theme.colors.primary }]} onPress={() => navigation.navigate('Privacy')}>
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  illustrationSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: -20,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  buttonsSection: {
    gap: 16,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  link: {
    fontSize: 11,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
