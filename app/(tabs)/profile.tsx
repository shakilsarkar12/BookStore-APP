import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../src/components/Header';
import { colors } from '../../src/theme/colors';
import { typography, radii, spacing, shadows } from '../../src/theme/typography';
import { useCartStore } from '../../src/store/useCartStore';

export default function ProfileScreen() {
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const totalCartItems = useCartStore((state) => state.getTotalItems());

  const customerClientId =
    process.env.EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID || '';

  const storefrontClientId =
    process.env.EXPO_PUBLIC_STOREFRONT_CLIENT_ID || '';

  const shopifyDomain =
    process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN || '';

  const handleResetData = () => {
    Alert.alert(
      'Reset Local Data',
      'This will clear your local cart and reset stored preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            clearCart();
            Alert.alert('Done', 'Cart and cached data cleared.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Account & Settings" showBack={false} showCart />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={32} color={colors.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Reader Member</Text>
            <Text style={styles.userEmail}>Shopify Customer Account</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Customer API Active</Text>
            </View>
          </View>
        </View>

        {/* Navigation Actions Group */}
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/cart')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="bag-handle-outline" size={20} color={colors.primary} />
              <Text style={styles.menuText}>Shopping Cart</Text>
            </View>
            <View style={styles.menuRight}>
              {totalCartItems > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{totalCartItems}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/contact')}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.menuText}>Customer Support & FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Headless Architecture Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Shopify Headless Configuration</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Store Domain</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {shopifyDomain}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Customer API ID</Text>
            <Text style={styles.metaValueMono} numberOfLines={1}>
              {customerClientId.substring(0, 16)}...
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Storefront Client ID</Text>
            <Text style={styles.metaValueMono} numberOfLines={1}>
              {storefrontClientId.substring(0, 16)}...
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>API Protocol</Text>
            <Text style={styles.metaValue}>GraphQL (2024-10)</Text>
          </View>
        </View>

        {/* Developer & Cache Controls */}
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleResetData}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="refresh-outline" size={20} color={colors.error} />
              <Text style={[styles.menuText, { color: colors.error }]}>
                Clear Cart & Reset Storage
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.appFooter}>
          <Text style={styles.appVersionText}>
            Alexandria Book Store v1.0.0 (Expo SDK 52)
          </Text>
          <Text style={styles.appEngineText}>
            Powered by Shopify Storefront API & React Native
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  userName: {
    ...typography.h2,
    fontSize: 18,
    color: colors.textPrimary,
  },
  userEmail: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  menuGroup: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  menuText: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.lg + 28,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  sectionHeaderTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  metaLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  metaValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metaValueMono: {
    ...typography.bodySmall,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: colors.textSecondary,
  },
  appFooter: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  appVersionText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  appEngineText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
});
