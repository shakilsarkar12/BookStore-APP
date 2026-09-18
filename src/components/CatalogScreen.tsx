import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BookProduct } from '../types/shopify';
import { getFeaturedBooks, searchBooks } from '../api/shopifyClient';
import { MOCK_GENRES } from '../data/mockBooks';
import { BookCard } from './BookCard';
import { Header } from './Header';
import { colors } from '../theme/colors';
import { typography, radii, spacing } from '../theme/typography';

export interface CatalogScreenProps {
  initialGenre?: string;
  headerTitle?: string;
  showBack?: boolean;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  initialGenre = 'All',
  headerTitle = 'Book Catalog',
  showBack = false,
}) => {
  const [books, setBooks] = useState<BookProduct[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFeaturedBooks(30);
      setBooks(data);
    } catch (err) {
      console.error('[CatalogScreen] Error loading books:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Perform client/server search and genre filtering
  const filteredBooks = useMemo(() => {
    let result = [...books];

    // Filter by genre
    if (selectedGenre !== 'All') {
      const genreLower = selectedGenre.toLowerCase();
      result = result.filter(
        (b) =>
          b.productType.toLowerCase().includes(genreLower) ||
          b.tags.some((t) => t.toLowerCase().includes(genreLower))
      );
    }

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const queryLower = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(queryLower) ||
          b.vendor.toLowerCase().includes(queryLower) ||
          b.tags.some((t) => t.toLowerCase().includes(queryLower))
      );
    }

    return result;
  }, [books, selectedGenre, searchQuery]);

  const renderBookItem = useCallback(
    ({ item }: { item: BookProduct }) => (
      <View style={styles.gridItemContainer}>
        <BookCard book={item} layout="grid" />
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={headerTitle}
        subtitle={`${filteredBooks.length} titles available`}
        showBack={showBack}
        showCart
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author, or keyword..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Genre Pills */}
      <View style={styles.genreSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreScrollContent}
        >
          {MOCK_GENRES.map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.genrePill,
                  isSelected && styles.genrePillActive,
                ]}
                onPress={() => setSelectedGenre(genre)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.genrePillText,
                    isSelected && styles.genrePillTextActive,
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Book Grid */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching books from store...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={(item) => item.id}
          renderItem={renderBookItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="book-outline"
                size={56}
                color={colors.textMuted}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>No Books Found</Text>
              <Text style={styles.emptySubtitle}>
                We couldn't find any books matching "{searchQuery || selectedGenre}".
              </Text>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSearchQuery('');
                  setSelectedGenre('All');
                }}
              >
                <Text style={styles.resetButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.card,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    height: '100%',
  },
  clearButton: {
    padding: spacing.xs,
  },
  genreSection: {
    backgroundColor: colors.card,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  genreScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  genrePill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
  },
  genrePillActive: {
    backgroundColor: colors.primary,
  },
  genrePillText: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  genrePillTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  gridItemContainer: {
    flex: 1,
    maxWidth: '48.5%',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 1.5,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.md,
    opacity: 0.8,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  resetButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.sm,
  },
  resetButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
