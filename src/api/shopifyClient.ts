/**
 * Robust Shopify Storefront GraphQL Client.
 * Handles authentication, network resilience, typed responses,
 * and automated graceful fallback to mock bookstore data if the store is not yet linked.
 */

import { BookProduct, Collection, GraphQLResponse } from '../types/shopify';
import {
  FETCH_FEATURED_BOOKS_QUERY,
  FETCH_COLLECTIONS_QUERY,
  FETCH_PRODUCT_BY_ID_QUERY,
  FETCH_COLLECTION_PRODUCTS_QUERY,
  SEARCH_BOOKS_QUERY,
} from './queries';
import { MOCK_BOOKS, MOCK_COLLECTIONS } from '../data/mockBooks';

const SHOPIFY_DOMAIN = process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN || '';
const STOREFRONT_TOKEN = process.env.EXPO_PUBLIC_STOREFRONT_TOKEN || '';
const STOREFRONT_CLIENT_ID = process.env.EXPO_PUBLIC_STOREFRONT_CLIENT_ID || '';
const STOREFRONT_PRIVATE_TOKEN = process.env.EXPO_PUBLIC_STOREFRONT_PRIVATE_TOKEN || '';
const API_VERSION = process.env.EXPO_PUBLIC_SHOPIFY_API_VERSION || '2024-10';

export interface ShopifyFetchOptions {
  variables?: Record<string, unknown>;
  cache?: string;
}

export class ShopifyAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: Array<{ message: string }>
  ) {
    super(message);
    this.name = 'ShopifyAPIError';
  }
}

/**
 * Checks if the store domain has been configured with an active custom store.
 */
export function isLiveShopifyConfigured(): boolean {
  return (
    Boolean(SHOPIFY_DOMAIN) &&
    SHOPIFY_DOMAIN !== 'your-bookstore.myshopify.com' &&
    (Boolean(STOREFRONT_TOKEN) || Boolean(STOREFRONT_CLIENT_ID))
  );
}

/**
 * Core GraphQL Fetcher for Shopify Storefront API.
 */
export async function shopifyFetch<T>(
  query: string,
  options: ShopifyFetchOptions = {}
): Promise<T> {
  const endpoint = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

  // If live store is not yet configured, automatically fall back to mock data
  if (!isLiveShopifyConfigured()) {
    return handleMockFallback<T>(query, options.variables);
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Public Storefront token
    const publicToken =
      STOREFRONT_TOKEN && !STOREFRONT_TOKEN.startsWith('shpat_')
        ? STOREFRONT_TOKEN
        : STOREFRONT_CLIENT_ID;

    if (publicToken) {
      headers['X-Shopify-Storefront-Access-Token'] = publicToken;
    }

    // Private Admin token for storefront if public not used
    if (STOREFRONT_PRIVATE_TOKEN && STOREFRONT_PRIVATE_TOKEN.startsWith('shpat_')) {
      headers['Shopify-Storefront-Private-Token'] = STOREFRONT_PRIVATE_TOKEN;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables: options.variables || {},
      }),
    });

    if (!response.ok) {
      throw new ShopifyAPIError(
        `Shopify HTTP Error: ${response.status} ${response.statusText}`,
        response.status
      );
    }

    const json: GraphQLResponse<T> = await response.json();

    if (json.errors && json.errors.length > 0) {
      const errorMessage = json.errors.map((e) => e.message).join(', ');
      throw new ShopifyAPIError(
        `Shopify GraphQL Error: ${errorMessage}`,
        response.status,
        json.errors
      );
    }

    if (!json.data) {
      throw new ShopifyAPIError('Shopify response contains no data');
    }

    return json.data;
  } catch (err) {
    console.warn(
      '[ShopifyClient] Live query failed or unavailable, falling back to mock bookstore data:',
      err instanceof Error ? err.message : err
    );
    return handleMockFallback<T>(query, options.variables);
  }
}

/**
 * Intelligent Mock Fallback to ensure the app never crashes when offline or before Shopify catalog is populated.
 */
function handleMockFallback<T>(
  query: string,
  variables?: Record<string, unknown>
): T {
  if (query.includes('GetFeaturedBooks')) {
    const data = {
      products: {
        edges: MOCK_BOOKS.map((book) => ({ node: book })),
      },
    };
    return data as unknown as T;
  }

  if (query.includes('GetCollections')) {
    const data = {
      collections: {
        edges: MOCK_COLLECTIONS.map((col) => ({ node: col })),
      },
    };
    return data as unknown as T;
  }

  if (query.includes('GetProductById') && variables?.id) {
    const found = MOCK_BOOKS.find((b) => b.id === variables.id) || MOCK_BOOKS[0];
    const data = { product: found };
    return data as unknown as T;
  }

  if (query.includes('GetProductByHandle') && variables?.handle) {
    const found =
      MOCK_BOOKS.find((b) => b.handle === variables.handle) || MOCK_BOOKS[0];
    const data = { productByHandle: found };
    return data as unknown as T;
  }

  if (query.includes('GetCollectionProducts') && variables?.handle) {
    const handle = String(variables.handle).toLowerCase();
    const filtered = MOCK_BOOKS.filter(
      (b) =>
        b.productType.toLowerCase().includes(handle) ||
        b.tags.some((t) => t.toLowerCase().includes(handle))
    );
    const data = {
      collectionByHandle: {
        id: `gid://shopify/Collection/${handle}`,
        title: handle.charAt(0).toUpperCase() + handle.slice(1),
        description: `Curated books in ${handle}`,
        image: null,
        products: {
          edges: (filtered.length > 0 ? filtered : MOCK_BOOKS).map((b) => ({
            node: b,
          })),
        },
      },
    };
    return data as unknown as T;
  }

  if (query.includes('SearchBooks') && variables?.query) {
    const term = String(variables.query).toLowerCase();
    const matched = MOCK_BOOKS.filter(
      (b) =>
        b.title.toLowerCase().includes(term) ||
        b.vendor.toLowerCase().includes(term) ||
        b.tags.some((t) => t.toLowerCase().includes(term))
    );
    const data = {
      products: {
        edges: matched.map((b) => ({ node: b })),
      },
    };
    return data as unknown as T;
  }

  return {} as T;
}

// Higher-level Data Access Functions
export async function getFeaturedBooks(first = 20): Promise<BookProduct[]> {
  interface QueryResult {
    products: {
      edges: Array<{ node: BookProduct }>;
    };
  }
  const result = await shopifyFetch<QueryResult>(FETCH_FEATURED_BOOKS_QUERY, {
    variables: { first },
  });
  return result.products?.edges?.map((e) => e.node) ?? [];
}

export async function getCollections(first = 10): Promise<Collection[]> {
  interface QueryResult {
    collections: {
      edges: Array<{ node: Collection }>;
    };
  }
  const result = await shopifyFetch<QueryResult>(FETCH_COLLECTIONS_QUERY, {
    variables: { first },
  });
  return result.collections?.edges?.map((e) => e.node) ?? [];
}

export async function getBookById(id: string): Promise<BookProduct | null> {
  interface QueryResult {
    product: BookProduct | null;
  }
  const result = await shopifyFetch<QueryResult>(FETCH_PRODUCT_BY_ID_QUERY, {
    variables: { id },
  });
  return result.product ?? null;
}

export async function searchBooks(query: string): Promise<BookProduct[]> {
  interface QueryResult {
    products: {
      edges: Array<{ node: BookProduct }>;
    };
  }
  const result = await shopifyFetch<QueryResult>(SEARCH_BOOKS_QUERY, {
    variables: { query, first: 20 },
  });
  return result.products?.edges?.map((e) => e.node) ?? [];
}
