import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../src/store/useCartStore';
import { createShopifyCheckoutSession, openShopifyCheckout } from '../src/api/checkout';
import { Header } from '../src/components/Header';
import { colors } from '../src/theme/colors';
import { typography, radii, spacing, shadows } from '../src/theme/typography';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [status, setStatus] = useState<
    'preparing' | 'ready' | 'completed' | 'error'
  >('preparing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');

  const initiateCheckout = useCallback(async () => {
    if (items.length === 0) {
      setStatus('error');
      setErrorMessage('Your shopping cart is empty.');
      return;
    }

    try {
      setStatus('preparing');
      const url = await createShopifyCheckoutSession(items);
      setCheckoutUrl(url);
      setStatus('ready');

      // Open Shopify WebBrowser
      await openShopifyCheckout(url);
      setStatus('completed');
    } catch (err) {
      console.error('[CheckoutRoute] Error:', err);
      setStatus('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to launch Shopify checkout.'
      );
    }
  }, [items]);

  useEffect(() => {
    initiateCheckout();
  }, [initiateCheckout]);

  const handleFinish = (cleared: boolean) => {
    if (cleared) {
      clearCart();
    }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Shopify Checkout" showBack />

      <View style={styles.content}>
        {status === 'preparing' ? (
          <View style={styles.statusBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.title}>Securing Checkout Session</Text>
            <Text style={styles.subtitle}>
              Connecting to Shopify Storefront API and preparing payment gateway...
            </Text>
          </View>
        ) : null}

        {status === 'ready' ? (
          <View style={styles.statusBox}>
            <Ionicons name="open-outline" size={48} color={colors.accent} />
            <Text style={styles.title}>Redirecting to Shopify</Text>
            <Text style={styles.subtitle}>
              If your browser did not automatically open, tap below to resume.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => openShopifyCheckout(checkoutUrl)}
            >
              <Text style={styles.primaryButtonText}>Reopen Checkout Window</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {status === 'completed' ? (
          <View style={styles.statusBox}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={36} color={colors.success} />
            </View>
            <Text style={styles.title}>Order Status</Text>
            <Text style={styles.subtitle}>
              Did you complete your book purchase in the Shopify checkout portal?
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleFinish(true)}
            >
              <Text style={styles.primaryButtonText}>
                Yes, Order Complete (Clear Cart)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleFinish(false)}
            >
              <Text style={styles.secondaryButtonText}>
                Keep Items in Cart & Continue Browsing
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {status === 'error' ? (
          <View style={styles.statusBox}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text style={styles.title}>Checkout Incomplete</Text>
            <Text style={styles.subtitle}>{errorMessage}</Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={initiateCheckout}
            >
              <Text style={styles.primaryButtonText}>Retry Checkout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
            >
              <Text style={styles.secondaryButtonText}>Return to Cart</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  statusBox: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    fontSize: 20,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
});
