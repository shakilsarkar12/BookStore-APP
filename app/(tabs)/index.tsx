import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BookProduct } from '../../src/types/shopify';
import { getFeaturedBooks } from '../../src/api/shopifyClient';
import { MOCK_GENRES } from '../../src/data/mockBooks';
import { BookCard } from '../../src/components/BookCard';
import { Header } from '../../src/components/Header';
import { colors } from '../../src/theme/colors';
import { typography, radii, spacing, shadows } from '../../src/theme/typography';

export default function HomeScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<BookProduct[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFeaturedBooks(20);
      setBooks(data);
    } catch (err) {
      console.error('[HomeScreen] Error loading books:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBooks();
  };

  const heroBook = books[0];
  const displayedBooks = selectedGenre === 'All'
    ? books
    : books.filter((b) =>
        b.productType.toLowerCase().includes(selectedGenre.toLowerCase()) ||
        b.tags.some((t) => t.toLowerCase().includes(selectedGenre.toLowerCase()))
      );
  const bestsellers = displayedBooks.slice(0, 6);
  const staffPicks = displayedBooks.slice(2, 6);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Alexandria Books"
        subtitle="Curated Independent Bookstore"
        showCart
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Search Bar Prompt */}
        <TouchableOpacity
          style={styles.searchTrigger}
          onPress={() => router.push('/(tabs)/collections')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>
            Search authors, titles, or genres...
          </Text>
        </TouchableOpacity>

        {/* Hero Banner: Book of the Month */}
        {heroBook ? (
          <View style={styles.heroCard}>
            <View style={styles.heroTagRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={12} color={colors.textInverse} />
                <Text style={styles.heroBadgeText}>BOOK OF THE MONTH</Text>
              </View>
            </View>

            <View style={styles.heroContentRow}>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroAuthor}>{heroBook.vendor}</Text>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {heroBook.title}
                </Text>
                <Text style={styles.heroBlurb} numberOfLines={3}>
                  {heroBook.description}
                </Text>

                <TouchableOpacity
                  style={styles.heroCta}
                  onPress={() =>
                    router.push({
                      pathname: '/product/[id]',
                      params: { id: heroBook.id },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.heroCtaText}>Explore Feature</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.heroCoverWrapper}
                onPress={() =>
                  router.push({
                    pathname: '/product/[id]',
                    params: { id: heroBook.id },
                  })
                }
                activeOpacity={0.9}
              >
                <Image
                  source={{
                    uri:
                      heroBook.images?.edges?.[0]?.node?.url ||
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
                  }}
                  style={styles.heroCoverImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Browse by Genre Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Genre</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/collections')}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreChipsScroll}
          >
            {MOCK_GENRES.map((genre) => {
              const isSelected = selectedGenre === genre;
              return (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreChip,
                    isSelected && styles.genreChipActive,
                  ]}
                  onPress={() => setSelectedGenre(genre)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.genreChipText,
                      isSelected && styles.genreChipTextActive,
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Trending Bestsellers Feed */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Bestsellers</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/collections')}
            >
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.loadingSpinner}
            />
          ) : (
            <View style={styles.gridContainer}>
              {bestsellers.map((book) => (
                <View key={book.id} style={styles.gridCol}>
                  <BookCard book={book} layout="grid" />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Editorial Picks List */}
        {staffPicks.length > 0 ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bookseller’s Picks</Text>
            </View>

            <View style={styles.horizontalList}>
              {staffPicks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  layout="horizontal"
                  style={styles.horizontalCardMargin}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Bookstore Value Propositions */}
        <View style={styles.perksCard}>
          <View style={styles.perkItem}>
            <Ionicons name="sparkles-outline" size={24} color={colors.accent} />
            <Text style={styles.perkTitle}>Curated Editions</Text>
            <Text style={styles.perkDesc}>
              Hardcovers, paperbacks, and collector copies selected by literary experts.
            </Text>
          </View>

          <View style={styles.perkDivider} />

          <View style={styles.perkItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.accent} />
            <Text style={styles.perkTitle}>Shopify Guaranteed</Text>
            <Text style={styles.perkDesc}>
              Direct secure checkout, tracked shipping, and easy returns.
            </Text>
          </View>
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
    paddingBottom: 120,
  },
  searchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 46,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  searchPlaceholder: {
    ...typography.body,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  heroTagRow: {
    marginBottom: spacing.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentDark,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radii.xs,
    alignSelf: 'flex-start',
    gap: 4,
  },
  heroBadgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: spacing.md,
    justifyContent: 'space-between',
  },
  heroAuthor: {
    ...typography.caption,
    color: colors.accentLight,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...typography.h2,
    color: colors.textInverse,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  heroBlurb: {
    ...typography.bodySmall,
    color: colors.surface,
    opacity: 0.85,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  heroCtaText: {
    ...typography.button,
    fontSize: 13,
    color: colors.primary,
  },
  heroCoverWrapper: {
    width: 100,
    height: 150,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  heroCoverImage: {
    width: '100%',
    height: '100%',
  },
  sectionContainer: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 19,
    color: colors.textPrimary,
  },
  seeAllText: {
    ...typography.subtitle,
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  genreChipsScroll: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
  },
  genreChipActive: {
    backgroundColor: colors.primary,
  },
  genreChipText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  genreChipTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  loadingSpinner: {
    marginVertical: spacing.xl,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCol: {
    width: '48.5%',
  },
  horizontalList: {
    marginTop: spacing.xs,
  },
  horizontalCardMargin: {
    marginBottom: spacing.md,
  },
  perksCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  perkItem: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  perkTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    marginBottom: 2,
  },
  perkDesc: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  perkDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
});
