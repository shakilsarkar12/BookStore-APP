/**
 * Customer Account State Management using Zustand + AsyncStorage persistence.
 * Powered by Shopify Customer Account API integration.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomerStoreState, CustomerAddress } from '../types/shopify';
import {
  SAMPLE_CUSTOMER_PROFILE,
  launchShopifyCustomerAuth,
} from '../api/customerClient';
import { MOCK_BOOKS } from '../data/mockBooks';

export const useCustomerStore = create<CustomerStoreState>()(
  persist(
    (set, get) => ({
      isAuthenticated: true, // Default to true so the user immediately experiences the rich customer UI
      customer: SAMPLE_CUSTOMER_PROFILE,
      wishlistProductIds: [
        MOCK_BOOKS[0]?.id || 'gid://shopify/Product/1',
        MOCK_BOOKS[2]?.id || 'gid://shopify/Product/3',
      ],
      isLoading: false,

      loginWithShopify: async () => {
        set({ isLoading: true });
        try {
          const success = await launchShopifyCustomerAuth();
          if (success) {
            set({
              isAuthenticated: true,
              customer: get().customer || SAMPLE_CUSTOMER_PROFILE,
              isLoading: false,
            });
            return true;
          }
        } catch (error) {
          console.error('[CustomerStore] Shopify login failed:', error);
        } finally {
          set({ isLoading: false });
        }
        return false;
      },

      loginAsGuestOrDemo: () => {
        set({
          isAuthenticated: true,
          customer: SAMPLE_CUSTOMER_PROFILE,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          customer: null,
          isLoading: false,
        });
      },

      toggleWishlist: (productId: string) => {
        set((state) => {
          const exists = state.wishlistProductIds.includes(productId);
          return {
            wishlistProductIds: exists
              ? state.wishlistProductIds.filter((id) => id !== productId)
              : [...state.wishlistProductIds, productId],
          };
        });
      },

      isWishlisted: (productId: string) => {
        return get().wishlistProductIds.includes(productId);
      },

      addAddress: (addressData: Omit<CustomerAddress, 'id'>) => {
        set((state) => {
          if (!state.customer) return state;

          const newId = `addr_${Date.now()}`;
          const newAddress: CustomerAddress = {
            ...addressData,
            id: newId,
          };

          const updatedAddresses = addressData.isDefault
            ? state.customer.addresses.map((a) => ({ ...a, isDefault: false }))
            : [...state.customer.addresses];

          updatedAddresses.push(newAddress);

          return {
            customer: {
              ...state.customer,
              addresses: updatedAddresses,
              defaultAddress: addressData.isDefault
                ? newAddress
                : state.customer.defaultAddress,
            },
          };
        });
      },

      updateAddress: (id: string, partial: Partial<CustomerAddress>) => {
        set((state) => {
          if (!state.customer) return state;

          const updatedAddresses = state.customer.addresses.map((addr) => {
            if (addr.id === id) {
              return { ...addr, ...partial };
            }
            if (partial.isDefault) {
              return { ...addr, isDefault: false };
            }
            return addr;
          });

          const currentDefault = updatedAddresses.find((a) => a.isDefault) || state.customer.defaultAddress;

          return {
            customer: {
              ...state.customer,
              addresses: updatedAddresses,
              defaultAddress: currentDefault,
            },
          };
        });
      },

      deleteAddress: (id: string) => {
        set((state) => {
          if (!state.customer) return state;

          const filtered = state.customer.addresses.filter((a) => a.id !== id);
          return {
            customer: {
              ...state.customer,
              addresses: filtered,
              defaultAddress:
                state.customer.defaultAddress?.id === id
                  ? filtered[0] || undefined
                  : state.customer.defaultAddress,
            },
          };
        });
      },

      setDefaultAddress: (id: string) => {
        set((state) => {
          if (!state.customer) return state;

          let newDefault: CustomerAddress | undefined;
          const updated = state.customer.addresses.map((a) => {
            if (a.id === id) {
              newDefault = { ...a, isDefault: true };
              return newDefault;
            }
            return { ...a, isDefault: false };
          });

          return {
            customer: {
              ...state.customer,
              addresses: updated,
              defaultAddress: newDefault || state.customer.defaultAddress,
            },
          };
        });
      },
    }),
    {
      name: 'bookstore-customer-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        customer: state.customer,
        wishlistProductIds: state.wishlistProductIds,
      }),
    }
  )
);
