import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BookProduct } from '../types/shopify';
import { colors } from '../theme/colors';
import { typography, radii, spacing, shadows } from '../theme/typography';
import { useCartStore } from '../store/useCartStore';

export interface BookCardProps {
  book: BookProduct;
  layout?: 'grid' | 'horizontal';
  style?: ViewStyle;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  layout = 'grid',
  style,
}) => {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const coverUrl =
    book.images?.edges?.[0]?.node?.url ||
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop';

  const defaultVariant = book.variants?.edges?.[0]?.node;
  const price = parseFloat(
    defaultVariant?.price?.amount ||
      book.priceRange?.minVariantPrice?.amount ||
      '0.00'
  );
  const compareAtPrice = defaultVariant?.compareAtPrice?.amount
    ? parseFloat(defaultVariant.compareAtPrice.amount)
    : null;

  const currencyCode =
    defaultVariant?.price?.currencyCode ||
    book.priceRange?.minVariantPrice?.currencyCode ||
    'USD';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  const handlePress = () => {
    router.push({
      pathname: '/product/[id]',
      params: { id: book.id },
    });
  };

  const handleQuickAdd = (e: { stopPropagation?: () => void }) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    if (!defaultVariant) return;

    addItem({
      productId: book.id,
      variantId: defaultVariant.id,
      title: book.title,
      author: book.vendor,
      format: defaultVariant.title || 'Standard Edition',
      price,
      currencyCode,
      imageUrl: coverUrl,
      quantity: 1,
    });
  };

  if (layout === 'horizontal') {
    return (
      <View style={[styles.horizontalCard, style]}>
        <TouchableOpacity
          style={styles.horizontalCoverWrapper}
          onPress={handlePress}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={`View details for ${book.title}`}
        >
          <Image
            source={{ uri: coverUrl }}
            style={styles.horizontalCoverImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={styles.horizontalInfo}>
          <TouchableOpacity
            style={styles.horizontalTextWrapper}
            onPress={handlePress}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`View details for ${book.title} by ${book.vendor}`}
          >
            <Text style={styles.authorText} numberOfLines={1}>
              {book.vendor}
            </Text>
            <Text style={styles.horizontalTitle} numberOfLines={2}>
              {book.title}
            </Text>

            {book.rating ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={13} color={colors.rating} />
                <Text style={styles.ratingText}>{book.rating.toFixed(1)}</Text>
                {book.reviewCount ? (
                  <Text style={styles.reviewCount}>({book.reviewCount})</Text>
                ) : null}
              </View>
            ) : null}
          </TouchableOpacity>

          <View style={styles.priceAndActionRow}>
            <TouchableOpacity
              style={styles.priceContainer}
              onPress={handlePress}
              activeOpacity={0.88}
            >
              <Text style={styles.priceText}>{formatCurrency(price)}</Text>
              {compareAtPrice && compareAtPrice > price ? (
                <Text style={styles.comparePriceText}>
                  {formatCurrency(compareAtPrice)}
                </Text>
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={handleQuickAdd}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Add ${book.title} to cart`}
            >
              <Ionicons name="bag-add" size={16} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Default Grid Card
  return (
    <View style={[styles.gridCard, style]}>
      <TouchableOpacity
        style={styles.gridCardBody}
        onPress={handlePress}
        activeOpacity={0.88}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${book.title} by ${book.vendor}`}
      >
        <View style={styles.gridCoverWrapper}>
          <Image
            source={{ uri: coverUrl }}
            style={styles.gridCoverImage}
            resizeMode="cover"
          />
          {compareAtPrice && compareAtPrice > price ? (
            <View style={styles.saleBadge}>
              <Text style={styles.saleBadgeText}>SALE</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.gridInfo}>
          <Text style={styles.authorText} numberOfLines={1}>
            {book.vendor}
          </Text>

          <Text style={styles.gridTitle} numberOfLines={2}>
            {book.title}
          </Text>

          {book.rating ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={colors.rating} />
              <Text style={styles.ratingText}>{book.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      <View style={styles.priceAndActionRow}>
        <TouchableOpacity
          style={styles.priceContainer}
          onPress={handlePress}
          activeOpacity={0.88}
        >
          <Text style={styles.priceText}>{formatCurrency(price)}</Text>
          {compareAtPrice && compareAtPrice > price ? (
            <Text style={styles.comparePriceText}>
              {formatCurrency(compareAtPrice)}
            </Text>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAddCircle}
          onPress={handleQuickAdd}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Add ${book.title} to cart`}
        >
          <Ionicons name="add" size={18} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Grid Styles (Optimized for FlatList 2-columns)
  gridCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.subtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
    flex: 1,
    justifyContent: 'space-between',
  },
  gridCardBody: {
    flex: 1,
  },
  gridCoverWrapper: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    position: 'relative',
  },
  gridCoverImage: {
    width: '100%',
    height: '100%',
  },
  saleBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.accentDark,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  saleBadgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gridInfo: {
    marginTop: spacing.sm,
    flex: 1,
    justifyContent: 'space-between',
  },
  authorText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  gridTitle: {
    ...typography.subtitle,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textPrimary,
    minHeight: 36,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  ratingText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 3,
  },
  reviewCount: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: 3,
  },
  priceAndActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  priceText: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.primary,
  },
  comparePriceText: {
    ...typography.caption,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  quickAddCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Horizontal Card Styles (For Carousels / Lists)
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  horizontalCoverWrapper: {
    width: 80,
    height: 120,
    borderRadius: radii.sm,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  horizontalCoverImage: {
    width: '100%',
    height: '100%',
  },
  horizontalInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  horizontalTextWrapper: {
    flex: 1,
  },
  horizontalTitle: {
    ...typography.h3,
    fontSize: 16,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
});
