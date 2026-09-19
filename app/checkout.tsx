import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { useCartStore } from '../src/store/useCartStore';
import { createShopifyCheckoutSession } from '../src/api/checkout';
import { colors } from '../src/theme/colors';
import { typography, radii, spacing, shadows } from '../src/theme/typography';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();

  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isWebviewLoading, setIsWebviewLoading] = useState(true);

  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    let isMounted = true;

    async function prepareCheckout() {
      if (items.length === 0) {
        setIsLoadingSession(false);
        setErrorMessage('Your shopping cart is empty.');
        return;
      }

      try {
        setIsLoadingSession(true);
        setErrorMessage(null);

        // Creates Shopify checkout with automatic buyerIdentity prefill
        const url = await createShopifyCheckoutSession(items);

        if (isMounted) {
          setCheckoutUrl(url);
          setIsLoadingSession(false);

          // On desktop web browsers where iframes are blocked by X-Frame-Options: DENY
          if (Platform.OS === 'web') {
            await WebBrowser.openBrowserAsync(url);
            setIsCompleted(true);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setIsLoadingSession(false);
          const msg = err instanceof Error ? err.message : 'Could not launch checkout.';
          setErrorMessage(msg);
        }
      }
    }

    prepareCheckout();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavigationStateChange = (navState: { url: string }) => {
    const url = navState.url.toLowerCase();

    // Detect Shopify order completion URL patterns
    if (
      url.includes('/thank_you') ||
      url.includes('/orders/') ||
      url.includes('order_status') ||
      url.includes('post_purchase')
    ) {
      clearCart();
      setIsCompleted(true);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Leave Checkout?',
      'Your cart items will remain saved so you can complete your purchase anytime.',
      [
        { text: 'Stay Here', style: 'cancel' },
        { text: 'Return to Cart', onPress: () => router.back() },
      ]
    );
  };

  // -------------------------------------------------------------
  // Order Completed Celebration Screen
  // -------------------------------------------------------------
  if (isCompleted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.completedContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={44} color={colors.success} />
          </View>

          <Text style={styles.successTitle}>Order Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Thank you for your book purchase. Your order has been placed through Shopify and your
            receipt is on its way to your email.
          </Text>

          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryActionBtnText}>Continue Browsing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => router.replace('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryActionBtnText}>View My Account & Orders</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // Error Screen
  // -------------------------------------------------------------
  if (errorMessage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.completedContainer}>
          <Ionicons name="alert-circle-outline" size={54} color={colors.error} />
          <Text style={styles.errorTitle}>Checkout Notice</Text>
          <Text style={styles.errorSubtitle}>{errorMessage}</Text>

          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => router.back()}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryActionBtnText}>Back to Cart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // Preparing Session Screen
  // -------------------------------------------------------------
  if (isLoadingSession || !checkoutUrl) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingTitle}>Securing Shopify Checkout</Text>
          <Text style={styles.loadingSubtitle}>
            Linking your cart items and customer identity...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // In-App Native Shopify Checkout WebView
  // -------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* In-App Native Checkout Header */}
      <View style={styles.checkoutHeader}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleClose}
          accessibilityLabel="Close checkout"
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenterBox}>
          <Text style={styles.headerTitle}>Shopify Checkout</Text>
          <View style={styles.sslBadge}>
            <Ionicons name="lock-closed" size={11} color={colors.success} />
            <Text style={styles.sslBadgeText}>256-Bit SSL Encrypted</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => WebBrowser.openBrowserAsync(checkoutUrl)}
            accessibilityLabel="Open in system browser"
          >
            <Ionicons name="open-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => webViewRef.current?.reload()}
              accessibilityLabel="Refresh checkout page"
            >
              <Ionicons name="reload-outline" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Embedded Shopify Checkout Page for Native / Web Fallback */}
      {Platform.OS === 'web' ? (
        <View style={styles.webContainer}>
          <Ionicons name="bag-check-outline" size={64} color={colors.primary} />
          <Text style={styles.webTitle}>Ready for Checkout</Text>
          <Text style={styles.webSubtitle}>
            Shopify requires opening checkout in a secure tab for payment authentication and Shop Pay.
          </Text>
          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={() => {
              if (Platform.OS === 'web') {
                if (typeof (globalThis as any).window !== 'undefined') {
                  (globalThis as any).window.location.href = checkoutUrl;
                } else {
                  WebBrowser.openBrowserAsync(checkoutUrl);
                }
              } else {
                WebBrowser.openBrowserAsync(checkoutUrl);
              }
            }}
          >
            <Text style={styles.primaryActionBtnText}>Proceed to Secure Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryActionBtnText}>Back to Cart</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.webviewWrapper}>
          <WebView
            ref={webViewRef}
            source={{ uri: checkoutUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36"
            mixedContentMode="always"
            cacheEnabled={true}
            allowsBackForwardNavigationGestures={true}
            originWhitelist={['*']}
            startInLoadingState={true}
            onLoadStart={() => setIsWebviewLoading(true)}
            onLoadEnd={() => setIsWebviewLoading(false)}
            onNavigationStateChange={handleNavigationStateChange}
            renderLoading={() => (
              <View style={styles.webviewLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.webviewLoadingText}>Loading Checkout...</Text>
              </View>
            )}
            renderError={(_errorDomain, _errorCode, _errorDesc) => (
              <View style={styles.completedContainer}>
                <Ionicons name="shield-checkmark-outline" size={56} color={colors.primary} />
                <Text style={styles.errorTitle}>Secure Shopify Checkout</Text>
                <Text style={styles.errorSubtitle}>
                  Shopify requires payment authentication in a secure browser window.
                </Text>
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => WebBrowser.openBrowserAsync(checkoutUrl)}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primaryActionBtnText}>Open Secure Checkout</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  onPress={() => webViewRef.current?.reload()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryActionBtnText}>Retry In-App</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.subtle,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenterBox: {
    alignItems: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sslBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  sslBadgeText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.success,
    fontWeight: '700',
    marginLeft: 3,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  webTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  webSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    maxWidth: 400,
  },
  webviewWrapper: {
    flex: 1,
    backgroundColor: colors.card,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.card,
  },
  webviewLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewLoadingText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  loadingSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.h1,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  successSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryActionBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
  secondaryActionBtn: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryActionBtnText: {
    ...typography.button,
    color: colors.textPrimary,
  },
});
