import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BookProduct, BookVariant } from '../../src/types/shopify';
import { getBookById } from '../../src/api/shopifyClient';
import { Header } from '../../src/components/Header';
import { Badge } from '../../src/components/Badge';
import { useCartStore } from '../../src/store/useCartStore';
import { useCustomerStore } from '../../src/store/useCustomerStore';
import { colors } from '../../src/theme/colors';
import { typography, radii, spacing, shadows } from '../../src/theme/typography';

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [book, setBook] = useState<BookProduct | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<BookVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);

  const addItem = useCartStore((state) => state.addItem);
  const isWishlisted = useCustomerStore((state) => (book ? state.isWishlisted(book.id) : false));
  const toggleWishlist = useCustomerStore((state) => state.toggleWishlist);

  useEffect(() => {
    async function loadBook() {
      if (!id) return;
      try {
        setLoading(true);
        const product = await getBookById(id);
        if (product) {
          setBook(product);
          const firstVariant = product.variants?.edges?.[0]?.node;
          if (firstVariant) {
            setSelectedVariant(firstVariant);
          }
        }
      } catch (err) {
        console.error('[ProductDetailScreen] Failed to load book:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [id]);

  const variantsList = useMemo(() => {
    return book?.variants?.edges?.map((e) => e.node) || [];
  }, [book]);

  const currentPrice = parseFloat(
    selectedVariant?.price?.amount ||
      book?.priceRange?.minVariantPrice?.amount ||
      '0.00'
  );
  const compareAtPrice = selectedVariant?.compareAtPrice?.amount
    ? parseFloat(selectedVariant.compareAtPrice.amount)
    : null;
  const currencyCode =
    selectedVariant?.price?.currencyCode ||
    book?.priceRange?.minVariantPrice?.currencyCode ||
    'USD';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const coverUrl =
    book?.images?.edges?.[0]?.node?.url ||
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop';

  const handleAddToCart = () => {
    if (!book || !selectedVariant) return;

    addItem({
      productId: book.id,
      variantId: selectedVariant.id,
      title: book.title,
      author: book.vendor,
      format: selectedVariant.title || 'Standard Edition',
      price: currentPrice,
      currencyCode,
      imageUrl: coverUrl,
      quantity,
    });

    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2200);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Book Details" showBack showCart />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading book details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Not Found" showBack showCart />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={50} color={colors.error} />
          <Text style={styles.errorTitle}>Book Not Found</Text>
          <Text style={styles.errorSubtitle}>
            This book is either unavailable or has been archived.
          </Text>
          <TouchableOpacity
            style={styles.backButtonCta}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonCtaText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={book.title}
        subtitle={book.vendor}
        showBack
        showCart
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Book Cover Showcase */}
        <View style={styles.coverShowcaseSection}>
          <View style={styles.coverWrapper}>
            <Image
              source={{ uri: coverUrl }}
              style={styles.coverImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Title and Author Info */}
        <View style={styles.headerInfoSection}>
          <Text style={styles.authorName}>{book.vendor}</Text>
          <Text style={styles.bookTitle}>{book.title}</Text>

          {/* Rating & Availability Badges */}
          <View style={styles.badgeRow}>
            {book.rating ? (
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={14} color={colors.rating} />
                <Text style={styles.ratingScore}>{book.rating.toFixed(1)}</Text>
                {book.reviewCount ? (
                  <Text style={styles.reviewCount}>({book.reviewCount} reviews)</Text>
                ) : null}
              </View>
            ) : null}

            <Badge
              label={book.availableForSale ? 'In Stock' : 'Backorder'}
              variant={book.availableForSale ? 'success' : 'outline'}
            />

            {book.productType ? (
              <Badge label={book.productType} variant="accent" />
            ) : null}
          </View>
        </View>

        {/* Format / Variant Selection */}
        {variantsList.length > 0 ? (
          <View style={styles.formatSection}>
            <Text style={styles.sectionHeading}>Select Edition / Format</Text>
            <View style={styles.formatGrid}>
              {variantsList.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                const variantPrice = parseFloat(variant.price?.amount || '0.00');

                return (
                  <TouchableOpacity
                    key={variant.id}
                    style={[
                      styles.formatCard,
                      isSelected && styles.formatCardSelected,
                    ]}
                    onPress={() => setSelectedVariant(variant)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.formatTitle,
                        isSelected && styles.formatTitleSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {variant.title}
                    </Text>
                    <Text
                      style={[
                        styles.formatPrice,
                        isSelected && styles.formatPriceSelected,
                      ]}
                    >
                      {formatCurrency(variantPrice)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Synopsis / Blurb */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionHeading}>Synopsis</Text>
          <Text
            style={styles.descriptionText}
            numberOfLines={isDescriptionExpanded ? undefined : 4}
          >
            {book.description ||
              'No summary is currently available for this literary title.'}
          </Text>
          {book.description && book.description.length > 180 ? (
            <TouchableOpacity
              onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              style={styles.expandButton}
            >
              <Text style={styles.expandButtonText}>
                {isDescriptionExpanded ? 'Show Less' : 'Read More'}
              </Text>
              <Ionicons
                name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.accentDark}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Book Specification Table */}
        <View style={styles.specsSection}>
          <Text style={styles.sectionHeading}>Book Details & Metadata</Text>
          <View style={styles.specsCard}>
            {book.publisher ? (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Publisher</Text>
                <Text style={styles.specValue}>{book.publisher}</Text>
              </View>
            ) : null}

            {book.publishedDate ? (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Publication Date</Text>
                <Text style={styles.specValue}>{book.publishedDate}</Text>
              </View>
            ) : null}

            {book.pageCount ? (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>Print Length</Text>
                <Text style={styles.specValue}>{book.pageCount} pages</Text>
              </View>
            ) : null}

            {book.isbn ? (
              <View style={styles.specRow}>
                <Text style={styles.specLabel}>ISBN-13</Text>
                <Text style={styles.specValue}>{book.isbn}</Text>
              </View>
            ) : null}

            <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.specLabel}>Fulfillment</Text>
              <Text style={styles.specValue}>Shopify Standard Delivery</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.stickyFooter}>
        <View style={styles.footerInfoRow}>
          <View style={styles.priceCol}>
            <Text style={styles.footerPriceLabel}>Total Price</Text>
            <View style={styles.footerPriceRow}>
              <Text style={styles.footerPrice}>
                {formatCurrency(currentPrice * quantity)}
              </Text>
              {compareAtPrice && compareAtPrice > currentPrice ? (
                <Text style={styles.footerComparePrice}>
                  {formatCurrency(compareAtPrice * quantity)}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Quantity Controls */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              style={styles.stepButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Ionicons
                name="remove"
                size={14}
                color={quantity <= 1 ? colors.textMuted : colors.textPrimary}
              />
            </TouchableOpacity>

            <Text style={styles.stepperValue}>{quantity}</Text>

            <TouchableOpacity
              style={styles.stepButton}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add" size={14} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.wishlistCircleButton,
              isWishlisted && styles.wishlistCircleButtonActive,
            ]}
            onPress={() => book && toggleWishlist(book.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={22}
              color={isWishlisted ? colors.error : colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.addToCartButton,
              addedSuccess && styles.addToCartButtonSuccess,
            ]}
            onPress={handleAddToCart}
            activeOpacity={0.88}
          >
            {addedSuccess ? (
              <View style={styles.buttonInnerRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.textInverse} />
                <Text style={styles.addToCartText}>Added to Cart!</Text>
              </View>
            ) : (
              <View style={styles.buttonInnerRow}>
                <Ionicons name="bag-add" size={18} color={colors.textInverse} />
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
    paddingBottom: spacing.xxxl * 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  errorSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.sm,
  },
  backButtonCta: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.md,
  },
  backButtonCtaText: {
    ...typography.button,
    color: colors.textInverse,
  },
  coverShowcaseSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  coverWrapper: {
    width: 170,
    height: 255,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  headerInfoSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.card,
  },
  authorName: {
    ...typography.subtitle,
    color: colors.accentDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bookTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    gap: 4,
  },
  ratingScore: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reviewCount: {
    ...typography.caption,
    color: colors.textMuted,
  },
  formatSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.card,
  },
  sectionHeading: {
    ...typography.h3,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  formatCard: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  formatCardSelected: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
    ...shadows.subtle,
  },
  formatTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  formatTitleSelected: {
    color: colors.primary,
  },
  formatPrice: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textMuted,
  },
  formatPriceSelected: {
    color: colors.primary,
  },
  descriptionSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.card,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  expandButtonText: {
    ...typography.caption,
    color: colors.accentDark,
    fontWeight: '700',
  },
  specsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.card,
  },
  specsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  specLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  specValue: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
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
  footerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priceCol: {
    flexDirection: 'column',
  },
  footerPriceLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  footerPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  footerPrice: {
    ...typography.h2,
    fontSize: 22,
    color: colors.primary,
  },
  footerComparePrice: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
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
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValue: {
    ...typography.subtitle,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  wishlistCircleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  wishlistCircleButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButtonSuccess: {
    backgroundColor: colors.success,
  },
  buttonInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addToCartText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
