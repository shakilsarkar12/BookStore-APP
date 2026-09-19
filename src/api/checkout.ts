/**
 * Shopify Checkout Integration Layer.
 * Converts local cart items into a Shopify Cart Session and launches
 * secure in-app WebBrowser checkout.
 */

import * as WebBrowser from 'expo-web-browser';
import { CartItem, ShopifyCart } from '../types/shopify';
import { CART_CREATE_MUTATION } from './queries';
import { isLiveShopifyConfigured, shopifyFetch } from './shopifyClient';
import { useCustomerStore } from '../store/useCustomerStore';
import { colors } from '../theme/colors';

export interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}

interface CartCreateResponse {
  cartCreate: {
    cart: ShopifyCart | null;
    userErrors: Array<{
      field: string[];
      message: string;
      code?: string;
    }>;
  };
}

/**
 * Creates a Shopify Cart session and returns the secure checkoutUrl.
 * Automatically attaches logged-in customer credentials and default address.
 */
export async function createShopifyCheckoutSession(
  items: CartItem[]
): Promise<string> {
  if (!items || items.length === 0) {
    throw new Error('Cannot checkout with an empty cart.');
  }

  // Check if cart contains demo items from previous mock session
  const hasMockItems = items.some((item) =>
    item.variantId.startsWith('gid://shopify/ProductVariant/200')
  );

  // If live store is not yet configured or items are demo books, provide fallback
  if (!isLiveShopifyConfigured()) {
    const totalAmount = items
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2);
    const currency = items[0]?.currencyCode || 'USD';
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return `https://shopify.com/checkout?demo=true&items=${itemCount}&total=${totalAmount}&currency=${currency}`;
  }

  if (hasMockItems) {
    throw new Error(
      'Your cart contains demo books from before your live Shopify store was connected. Please tap "Clear" in the Cart and add books from your live store.'
    );
  }

  // Format line items for Shopify Storefront Cart API
  const lines = items.map((item) => ({
    merchandiseId: item.variantId,
    quantity: item.quantity,
  }));

  // Build buyer identity to automatically prefill customer details at checkout
  const { customer, accessToken } = useCustomerStore.getState();
  const buyerIdentity: Record<string, unknown> = {};

  if (customer?.email) {
    buyerIdentity.email = customer.email;
  }
  if (accessToken) {
    buyerIdentity.customerAccessToken = accessToken;
  }
  if (customer?.defaultAddress) {
    const addr = customer.defaultAddress;
    buyerIdentity.deliveryAddressPreferences = [
      {
        deliveryAddress: {
          address1: addr.address1,
          address2: addr.address2 || '',
          city: addr.city,
          province: addr.province || '',
          zip: addr.zip,
          country: addr.country || 'US',
          firstName: addr.firstName || customer.firstName || '',
          lastName: addr.lastName || customer.lastName || '',
          phone: addr.phone || customer.phone || '',
        },
      },
    ];
  }

  const cartInput: Record<string, unknown> = { lines };
  if (Object.keys(buyerIdentity).length > 0) {
    cartInput.buyerIdentity = buyerIdentity;
  }

  const response = await shopifyFetch<CartCreateResponse>(CART_CREATE_MUTATION, {
    variables: {
      input: cartInput,
    },
  });

  if (response.cartCreate.userErrors && response.cartCreate.userErrors.length > 0) {
    const errorMsg = response.cartCreate.userErrors
      .map((e) => e.message)
      .join(', ');
    throw new Error(`Shopify Checkout Error: ${errorMsg}`);
  }

  const checkoutUrl = response.cartCreate.cart?.checkoutUrl;

  if (!checkoutUrl) {
    throw new Error('Failed to obtain a valid Shopify checkout URL.');
  }

  return checkoutUrl;
}

/**
 * Opens the Shopify checkout session in an in-app secure browser window.
 */
export async function openShopifyCheckout(
  checkoutUrl: string
): Promise<WebBrowser.WebBrowserResult> {
  try {
    const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: colors.primary,
      controlsColor: colors.textInverse,
      enableBarCollapsing: true,
      showTitle: true,
    });
    return result;
  } catch (error) {
    console.error('[ShopifyCheckout] Error opening web browser:', error);
    throw error;
  }
}
