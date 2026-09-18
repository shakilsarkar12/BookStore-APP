import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../store/useCartStore';
import { createShopifyCheckoutSession, openShopifyCheckout } from '../api/checkout';
import { Header } from './Header';
import { colors } from '../theme/colors';
import { typography, radii, spacing, shadows } from '../theme/typography';
import { CartItem } from '../types/shopify';

const FREE_SHIPPING_THRESHOLD = 45.0;

export const CartScreen: React.FC = () => {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getSubtotal, getTotalItems } =
    useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  const subtotal = getSubtotal();
  const totalItems = getTotalItems();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0.0 : 4.99;
  const estimatedTax = Number((subtotal * 0.08).toFixed(2));
  const finalTotal = Number((subtotal + shipping + estimatedTax).toFixed(2));

  const amountNeededForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - subtotal
  );
  const freeShippingProgress = Math.min(
    1,
    subtotal / FREE_SHIPPING_THRESHOLD
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    try {
      setIsCheckingOut(true);
      const checkoutUrl = await createShopifyCheckoutSession(items);
      await openShopifyCheckout(checkoutUrl);
    } catch (err) {
      console.error('[CartScreen] Checkout initiation error:', err);
      Alert.alert(
        'Checkout Notice',
        err instanceof Error
          ? err.message
          : 'Could not connect to Shopify checkout. Please verify your connection or store domain.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleRemoveConfirm = (variantId: string, title: string) => {
    Alert.alert(
      'Remove Book',
      `Are you sure you want to remove "${title}" from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeItem(variantId),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Your Cart"
        subtitle={totalItems > 0 ? `${totalItems} books selected` : 'Empty'}
        showBack={false}
        rightAction={
          items.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Clear Cart', 'Remove all items from your cart?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Clear All', style: 'destructive', onPress: clearCart },
                ]);
              }}
              style={styles.clearCartBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearCartText}>Clear</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {items.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="bag-outline" size={60} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
          <Text style={styles.emptyCartSubtitle}>
            Looks like you haven't added any books to your cart yet. Explore our curated
            bestsellers and literary gems!
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/collections')}
            activeOpacity={0.8}
          >
            <Text style={styles.exploreButtonText}>Explore Catalog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.flex1}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Free Shipping Progress Bar */}
            <View style={styles.freeShippingCard}>
              <View style={styles.freeShippingHeader}>
                <Ionicons
                  name={amountNeededForFreeShipping === 0 ? 'checkmark-circle' : 'cube-outline'}
                  size={18}
                  color={amountNeededForFreeShipping === 0 ? colors.success : colors.accent}
                />
                <Text style={styles.freeShippingText}>
                  {amountNeededForFreeShipping === 0
                    ? 'You unlocked FREE Express Shipping!'
                    : `Add ${formatCurrency(amountNeededForFreeShipping)} more for FREE Shipping`}
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${freeShippingProgress * 100}%`,
                      backgroundColor:
                        amountNeededForFreeShipping === 0
                          ? colors.success
                          : colors.accent,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Cart Items List */}
            <View style={styles.itemsListContainer}>
              {items.map((item: CartItem) => (
                <View key={item.id} style={styles.cartItemCard}>
                  <View style={styles.itemImageWrapper}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={styles.itemDetails}>
                    <View style={styles.itemHeaderRow}>
                      <View style={styles.titleContainer}>
                        <Text style={styles.itemAuthor} numberOfLines={1}>
                          {item.author}
                        </Text>
                        <Text style={styles.itemTitle} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={styles.itemFormat}>{item.format}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleRemoveConfirm(item.variantId, item.title)}
                        style={styles.removeButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemFooterRow}>
                      <Text style={styles.itemPrice}>
                        {formatCurrency(item.price * item.quantity)}
                      </Text>

                      {/* Quantity Stepper */}
                      <View style={styles.stepperContainer}>
                        <TouchableOpacity
                          style={styles.stepButton}
                          onPress={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          accessibilityLabel="Decrease quantity"
                        >
                          <Ionicons name="remove" size={14} color={colors.textPrimary} />
                        </TouchableOpacity>

                        <Text style={styles.stepperValue}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={styles.stepButton}
                          onPress={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          accessibilityLabel="Increase quantity"
                        >
                          <Ionicons name="add" size={14} color={colors.textPrimary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Order Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal ({totalItems} items)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Shipping</Text>
                <Text style={styles.summaryValue}>
                  {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Tax</Text>
                <Text style={styles.summaryValue}>{formatCurrency(estimatedTax)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(finalTotal)}</Text>
              </View>

              <View style={styles.secureBadgeRow}>
                <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                <Text style={styles.secureBadgeText}>
                  Shopify 256-Bit Encrypted Secure Checkout
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Checkout CTA Footer */}
          <View style={styles.stickyFooter}>
            <View style={styles.footerPriceRow}>
              <Text style={styles.footerTotalLabel}>Total</Text>
              <Text style={styles.footerTotalPrice}>{formatCurrency(finalTotal)}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.checkoutButton,
                isCheckingOut && styles.checkoutButtonDisabled,
              ]}
              onPress={handleCheckout}
              disabled={isCheckingOut}
              activeOpacity={0.88}
            >
              {isCheckingOut ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.textInverse} />
                  <Text style={styles.checkoutButtonText}>Opening Checkout...</Text>
                </View>
              ) : (
                <View style={styles.buttonContentRow}>
                  <Ionicons name="lock-closed" size={16} color={colors.textInverse} />
                  <Text style={styles.checkoutButtonText}>
                    Proceed to Shopify Checkout
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.textInverse} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  clearCartBtn: {
    padding: spacing.xs,
  },
  clearCartText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  freeShippingCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  freeShippingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
    gap: spacing.xs,
  },
  freeShippingText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  itemsListContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  itemImageWrapper: {
    width: 70,
    height: 105,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  itemAuthor: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  itemTitle: {
    ...typography.subtitle,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  itemFormat: {
    ...typography.caption,
    color: colors.accentDark,
    marginTop: 2,
    fontWeight: '500',
  },
  removeButton: {
    padding: spacing.xs,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  itemPrice: {
    ...typography.h3,
    fontSize: 16,
    color: colors.primary,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    ...typography.caption,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  summaryTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  totalValue: {
    ...typography.h2,
    fontSize: 20,
    color: colors.primary,
  },
  secureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  secureBadgeText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stickyFooter: {
    backgroundColor: colors.card,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.card,
  },
  footerPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  footerTotalLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  footerTotalPrice: {
    ...typography.h2,
    fontSize: 22,
    color: colors.primary,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.7,
  },
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkoutButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  emptyCartContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyCartTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyCartSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  exploreButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  exploreButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
