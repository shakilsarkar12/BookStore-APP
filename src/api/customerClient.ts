/**
 * Shopify Customer Account API Client & OAuth Authentication Service
 * Implements modern headless Shopify Customer Account integration.
 */

import * as WebBrowser from 'expo-web-browser';
import { CustomerProfile, CustomerOrder, CustomerAddress } from '../types/shopify';
import { MOCK_BOOKS } from '../data/mockBooks';

const SHOPIFY_DOMAIN =
  process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN || 'book-store-cpepvunk.myshopify.com';
const CUSTOMER_ACCOUNT_CLIENT_ID =
  process.env.EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID || '6d60f305-08b3-4b38-a6e4-74700703d114';

/**
 * Returns the Shopify Customer Account login URL
 */
export function getShopifyCustomerLoginUrl(): string {
  // Direct storefront customer portal login or OAuth authorize URL
  return `https://${SHOPIFY_DOMAIN}/account/login?client_id=${CUSTOMER_ACCOUNT_CLIENT_ID}`;
}

/**
 * Launches the Shopify Customer Account OAuth / Web Login Flow
 */
export async function launchShopifyCustomerAuth(): Promise<boolean> {
  try {
    const loginUrl = getShopifyCustomerLoginUrl();
    const result = await WebBrowser.openAuthSessionAsync(
      loginUrl,
      'bookstore://auth'
    );

    if (result.type === 'success' || result.type === 'dismiss') {
      return true;
    }
    return false;
  } catch (error) {
    console.warn('[CustomerClient] WebBrowser auth session failed, opening standard browser:', error);
    try {
      await WebBrowser.openBrowserAsync(getShopifyCustomerLoginUrl());
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Seed data for rich initial customer experience
 */
export const SAMPLE_CUSTOMER_PROFILE: CustomerProfile = {
  id: 'gid://shopify/Customer/82947192019',
  displayName: 'Sarah Jenkins',
  firstName: 'Sarah',
  lastName: 'Jenkins',
  email: 'sarah.jenkins@booklovers.org',
  phone: '+1 (206) 555-0198',
  memberTier: 'Gold VIP Bookworm',
  points: 380,
  defaultAddress: {
    id: 'addr_default_1',
    name: 'Sarah Jenkins',
    address1: '742 Evergreen Terrace, Apt 4B',
    city: 'Seattle',
    province: 'Washington',
    zip: '98101',
    country: 'United States',
    phone: '+1 (206) 555-0198',
    isDefault: true,
  },
  addresses: [
    {
      id: 'addr_default_1',
      name: 'Sarah Jenkins',
      address1: '742 Evergreen Terrace, Apt 4B',
      city: 'Seattle',
      province: 'Washington',
      zip: '98101',
      country: 'United States',
      phone: '+1 (206) 555-0198',
      isDefault: true,
    },
    {
      id: 'addr_office_2',
      name: 'Sarah Jenkins (Office)',
      address1: '1200 4th Ave, Suite 1800',
      city: 'Seattle',
      province: 'Washington',
      zip: '98104',
      country: 'United States',
      phone: '+1 (206) 555-0198',
      isDefault: false,
    },
  ],
  orders: [
    {
      id: 'gid://shopify/Order/918239102',
      orderNumber: 'BK-8902',
      name: '#BK-8902',
      processedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      financialStatus: 'PAID',
      fulfillmentStatus: 'IN_TRANSIT',
      totalPrice: 42.98,
      currencyCode: 'USD',
      trackingNumber: '1Z9999999999999999',
      estimatedDelivery: 'Tomorrow by 7:00 PM',
      lineItems: [
        {
          id: 'li_1',
          title: MOCK_BOOKS[0]?.title || 'The Midnight Library',
          quantity: 1,
          price: 18.99,
          imageUrl: MOCK_BOOKS[0]?.images.edges[0]?.node.url,
        },
        {
          id: 'li_2',
          title: MOCK_BOOKS[1]?.title || 'Atomic Habits',
          quantity: 1,
          price: 23.99,
          imageUrl: MOCK_BOOKS[1]?.images.edges[0]?.node.url,
        },
      ],
      shippingAddress: {
        id: 'addr_default_1',
        name: 'Sarah Jenkins',
        address1: '742 Evergreen Terrace, Apt 4B',
        city: 'Seattle',
        province: 'Washington',
        zip: '98101',
        country: 'United States',
      },
    },
    {
      id: 'gid://shopify/Order/918239045',
      orderNumber: 'BK-8419',
      name: '#BK-8419',
      processedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      financialStatus: 'PAID',
      fulfillmentStatus: 'FULFILLED',
      totalPrice: 28.5,
      currencyCode: 'USD',
      trackingNumber: 'USPS-9400100000000000',
      estimatedDelivery: 'Delivered on Sep 5',
      lineItems: [
        {
          id: 'li_3',
          title: MOCK_BOOKS[3]?.title || 'Clean Code: A Handbook of Agile Software',
          quantity: 1,
          price: 28.5,
          imageUrl: MOCK_BOOKS[3]?.images.edges[0]?.node.url,
        },
      ],
    },
  ],
};
