/**
 * Strict TypeScript definitions for the Shopify Storefront API
 * and Bookstore E-Commerce Application State.
 */

export interface MoneyV2 {
  amount: string;
  currencyCode: string;
}

export interface PriceRange {
  minVariantPrice: MoneyV2;
  maxVariantPrice: MoneyV2;
}

export interface ShopifyImage {
  id?: string;
  url: string;
  altText: string | null;
  width?: number;
  height?: number;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface BookVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: MoneyV2;
  compareAtPrice: MoneyV2 | null;
  selectedOptions?: SelectedOption[];
  image?: ShopifyImage | null;
}

export interface Metafield {
  key: string;
  value: string;
  namespace?: string;
}

export interface BookProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  vendor: string; // Used as Book Author
  productType: string; // e.g., "Fiction", "Non-Fiction", "Sci-Fi"
  tags: string[];
  availableForSale: boolean;
  priceRange: PriceRange;
  images: {
    edges: Array<{
      node: ShopifyImage;
    }>;
  };
  variants: {
    edges: Array<{
      node: BookVariant;
    }>;
  };
  rating?: number;
  reviewCount?: number;
  pageCount?: number;
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
}

export interface Collection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
  products?: {
    edges: Array<{
      node: BookProduct;
    }>;
  };
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface CartLineItemInput {
  merchandiseId: string; // Variant GID
  quantity: number;
}

export interface CartCreateInput {
  lines: CartLineItemInput[];
  buyerIdentity?: {
    email?: string;
    countryCode?: string;
  };
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: MoneyV2;
    product: {
      id: string;
      title: string;
      handle: string;
      vendor: string;
      images: {
        edges: Array<{
          node: ShopifyImage;
        }>;
      };
    };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    totalAmount: MoneyV2;
    subtotalAmount: MoneyV2;
    totalTaxAmount: MoneyV2 | null;
  };
  lines: {
    edges: Array<{
      node: ShopifyCartLine;
    }>;
  };
}

// Global Cart Store Types
export interface CartItem {
  id: string; // Unique combination of product and variant ID
  productId: string;
  variantId: string;
  title: string;
  author: string;
  format: string; // Hardcover, Paperback, E-Book, Audio
  price: number;
  currencyCode: string;
  imageUrl: string;
  quantity: number;
  maxQuantity?: number;
}

export interface CartStoreState {
  items: CartItem[];
  currencyCode: string;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}
