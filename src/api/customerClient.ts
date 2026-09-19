/**
 * Shopify Native Customer Authentication & Account API Client
 * Connects directly to Shopify Storefront API GraphQL for native customer accounts.
 */

import { CustomerProfile, CustomerOrder, CustomerAddress } from '../types/shopify';

const SHOPIFY_DOMAIN =
  process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN || 'book-store-cpepvunk.myshopify.com';
const STOREFRONT_TOKEN =
  process.env.EXPO_PUBLIC_STOREFRONT_TOKEN || 'abe2619e95b8b403f9cacdbc9f98d062';
const API_VERSION =
  process.env.EXPO_PUBLIC_SHOPIFY_API_VERSION || '2024-10';

const GRAPHQL_ENDPOINT = `https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`;

async function executeShopifyGraphQL<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify Network Error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message || 'Shopify GraphQL Error');
  }

  return json.data as T;
}

/**
 * 1. Native Customer Login via Storefront API
 */
export async function loginCustomer(
  email: string,
  password: string
): Promise<{ accessToken: string; expiresAt: string }> {
  const query = `
    mutation customerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  interface ResponseData {
    customerAccessTokenCreate: {
      customerAccessToken: { accessToken: string; expiresAt: string } | null;
      customerUserErrors: Array<{ code: string; field: string[]; message: string }>;
    };
  }

  const data = await executeShopifyGraphQL<ResponseData>(query, {
    input: { email, password },
  });

  const { customerAccessToken, customerUserErrors } = data.customerAccessTokenCreate;

  if (customerUserErrors && customerUserErrors.length > 0) {
    throw new Error(customerUserErrors[0].message || 'Invalid email or password');
  }

  if (!customerAccessToken) {
    throw new Error('Could not authenticate customer with provided credentials.');
  }

  return customerAccessToken;
}

/**
 * 2. Native Customer Registration via Storefront API
 */
export async function registerCustomer(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}): Promise<{ id: string; email: string }> {
  const query = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer {
          id
          email
          firstName
          lastName
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  interface ResponseData {
    customerCreate: {
      customer: { id: string; email: string } | null;
      customerUserErrors: Array<{ code: string; field: string[]; message: string }>;
    };
  }

  const data = await executeShopifyGraphQL<ResponseData>(query, { input });

  const { customer, customerUserErrors } = data.customerCreate;

  if (customerUserErrors && customerUserErrors.length > 0) {
    throw new Error(customerUserErrors[0].message || 'Registration failed');
  }

  if (!customer) {
    throw new Error('Could not create account. Please try again.');
  }

  return customer;
}

/**
 * 3. Native Password Recovery
 */
export async function recoverCustomerPassword(email: string): Promise<boolean> {
  const query = `
    mutation customerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  interface ResponseData {
    customerRecover: {
      customerUserErrors: Array<{ code: string; field: string[]; message: string }>;
    };
  }

  const data = await executeShopifyGraphQL<ResponseData>(query, { email });

  const { customerUserErrors } = data.customerRecover;

  if (customerUserErrors && customerUserErrors.length > 0) {
    throw new Error(customerUserErrors[0].message || 'Could not send reset password email');
  }

  return true;
}

/**
 * 4. Native Logout / Invalidate Token
 */
export async function logoutCustomer(accessToken: string): Promise<boolean> {
  const query = `
    mutation customerAccessTokenDelete($customerAccessToken: String!) {
      customerAccessTokenDelete(customerAccessToken: $customerAccessToken) {
        deletedAccessToken
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    await executeShopifyGraphQL(query, { customerAccessToken: accessToken });
    return true;
  } catch {
    return false;
  }
}

/**
 * 5. Fetch Real Customer Profile, Addresses, and Orders from Shopify
 */
export async function fetchCustomerProfile(accessToken: string): Promise<CustomerProfile | null> {
  const query = `
    query getCustomerProfile($token: String!) {
      customer(customerAccessToken: $token) {
        id
        displayName
        firstName
        lastName
        email
        phone
        defaultAddress {
          id
          address1
          address2
          city
          province
          zip
          country
          phone
        }
        addresses(first: 20) {
          edges {
            node {
              id
              address1
              address2
              city
              province
              zip
              country
              phone
            }
          }
        }
        orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
          edges {
            node {
              id
              orderNumber
              name
              processedAt
              financialStatus
              fulfillmentStatus
              totalPriceV2 {
                amount
                currencyCode
              }
              lineItems(first: 10) {
                edges {
                  node {
                    title
                    quantity
                    variant {
                      priceV2 {
                        amount
                        currencyCode
                      }
                      image {
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  interface GraphQLCustomerRaw {
    customer: {
      id: string;
      displayName: string;
      firstName?: string;
      lastName?: string;
      email: string;
      phone?: string;
      defaultAddress?: {
        id: string;
        address1: string;
        address2?: string;
        city: string;
        province?: string;
        zip: string;
        country: string;
        phone?: string;
      };
      addresses: {
        edges: Array<{
          node: {
            id: string;
            address1: string;
            address2?: string;
            city: string;
            province?: string;
            zip: string;
            country: string;
            phone?: string;
          };
        }>;
      };
      orders: {
        edges: Array<{
          node: {
            id: string;
            orderNumber: string;
            name: string;
            processedAt: string;
            financialStatus: string;
            fulfillmentStatus: string;
            totalPriceV2: {
              amount: string;
              currencyCode: string;
            };
            lineItems: {
              edges: Array<{
                node: {
                  title: string;
                  quantity: number;
                  variant?: {
                    priceV2: {
                      amount: string;
                      currencyCode: string;
                    };
                    image?: {
                      url: string;
                    };
                  };
                };
              }>;
            };
          };
        }>;
      };
    } | null;
  }

  const data = await executeShopifyGraphQL<GraphQLCustomerRaw>(query, { token: accessToken });

  if (!data.customer) {
    return null;
  }

  const raw = data.customer;

  const defaultAddrId = raw.defaultAddress?.id;

  const addresses: CustomerAddress[] = raw.addresses.edges.map((e) => ({
    id: e.node.id,
    address1: e.node.address1,
    address2: e.node.address2 || undefined,
    city: e.node.city,
    province: e.node.province || undefined,
    zip: e.node.zip,
    country: e.node.country,
    phone: e.node.phone || undefined,
    isDefault: e.node.id === defaultAddrId,
  }));

  const orders: CustomerOrder[] = raw.orders.edges.map((e) => {
    const o = e.node;
    return {
      id: o.id,
      orderNumber: o.orderNumber ? String(o.orderNumber) : o.name.replace('#', ''),
      name: o.name,
      processedAt: o.processedAt,
      financialStatus: o.financialStatus,
      fulfillmentStatus: o.fulfillmentStatus,
      totalPrice: parseFloat(o.totalPriceV2.amount),
      currencyCode: o.totalPriceV2.currencyCode,
      lineItems: o.lineItems.edges.map((li, idx) => ({
        id: `${o.id}_item_${idx}`,
        title: li.node.title,
        quantity: li.node.quantity,
        price: li.node.variant ? parseFloat(li.node.variant.priceV2.amount) : 0,
        imageUrl: li.node.variant?.image?.url,
      })),
    };
  });

  return {
    id: raw.id,
    displayName: raw.displayName || `${raw.firstName || ''} ${raw.lastName || ''}`.trim() || raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    email: raw.email,
    phone: raw.phone,
    defaultAddress: raw.defaultAddress
      ? {
          id: raw.defaultAddress.id,
          address1: raw.defaultAddress.address1,
          address2: raw.defaultAddress.address2 || undefined,
          city: raw.defaultAddress.city,
          province: raw.defaultAddress.province || undefined,
          zip: raw.defaultAddress.zip,
          country: raw.defaultAddress.country,
          phone: raw.defaultAddress.phone || undefined,
          isDefault: true,
        }
      : undefined,
    addresses,
    orders,
  };
}

/**
 * 6. Add Address to Shopify Customer Account
 */
export async function createCustomerAddress(
  accessToken: string,
  address: {
    address1: string;
    address2?: string;
    city: string;
    province?: string;
    zip: string;
    country: string;
    phone?: string;
  }
): Promise<string> {
  const query = `
    mutation customerAddressCreate($customerAccessToken: String!, $address: MailingAddressInput!) {
      customerAddressCreate(customerAccessToken: $customerAccessToken, address: $address) {
        customerAddress {
          id
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  interface ResponseData {
    customerAddressCreate: {
      customerAddress: { id: string } | null;
      customerUserErrors: Array<{ code: string; field: string[]; message: string }>;
    };
  }

  const data = await executeShopifyGraphQL<ResponseData>(query, {
    customerAccessToken: accessToken,
    address,
  });

  const { customerAddress, customerUserErrors } = data.customerAddressCreate;

  if (customerUserErrors && customerUserErrors.length > 0) {
    throw new Error(customerUserErrors[0].message || 'Could not save address');
  }

  return customerAddress?.id || '';
}

/**
 * 7. Delete Customer Address from Shopify
 */
export async function deleteCustomerAddress(accessToken: string, addressId: string): Promise<boolean> {
  const query = `
    mutation customerAddressDelete($customerAccessToken: String!, $id: ID!) {
      customerAddressDelete(customerAccessToken: $customerAccessToken, id: $id) {
        deletedCustomerAddressId
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  interface ResponseData {
    customerAddressDelete: {
      deletedCustomerAddressId: string | null;
      customerUserErrors: Array<{ code: string; field: string[]; message: string }>;
    };
  }

  const data = await executeShopifyGraphQL<ResponseData>(query, {
    customerAccessToken: accessToken,
    id: addressId,
  });

  const { customerUserErrors } = data.customerAddressDelete;

  if (customerUserErrors && customerUserErrors.length > 0) {
    throw new Error(customerUserErrors[0].message || 'Could not delete address');
  }

  return true;
}

/**
 * 8. Set Default Address on Shopify
 */
export async function setDefaultCustomerAddress(accessToken: string, addressId: string): Promise<boolean> {
  const query = `
    mutation customerDefaultAddressUpdate($customerAccessToken: String!, $addressId: ID!) {
      customerDefaultAddressUpdate(customerAccessToken: $customerAccessToken, addressId: $addressId) {
        customer {
          id
        }
        customerUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  interface ResponseData {
    customerDefaultAddressUpdate: {
      customer: { id: string } | null;
      customerUserErrors: Array<{ code: string; field: string[]; message: string }>;
    };
  }

  const data = await executeShopifyGraphQL<ResponseData>(query, {
    customerAccessToken: accessToken,
    addressId,
  });

  const { customerUserErrors } = data.customerDefaultAddressUpdate;

  if (customerUserErrors && customerUserErrors.length > 0) {
    throw new Error(customerUserErrors[0].message || 'Could not set default address');
  }

  return true;
}
