/**
 * Customer Account State Management using Zustand + AsyncStorage persistence.
 * Connects to live Shopify Storefront API for authentic, native customer accounts.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomerStoreState } from '../types/shopify';
import {
  loginCustomer,
  registerCustomer,
  recoverCustomerPassword,
  logoutCustomer,
  fetchCustomerProfile,
  createCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
} from '../api/customerClient';

export const useCustomerStore = create<CustomerStoreState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      accessToken: null,
      customer: null,
      wishlistProductIds: [],
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const auth = await loginCustomer(email.trim(), password);
          const customer = await fetchCustomerProfile(auth.accessToken);

          set({
            isAuthenticated: true,
            accessToken: auth.accessToken,
            customer,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Login failed';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      register: async (input) => {
        set({ isLoading: true, error: null });
        try {
          await registerCustomer({
            email: input.email.trim(),
            password: input.password,
            firstName: input.firstName?.trim(),
            lastName: input.lastName?.trim(),
            phone: input.phone?.trim(),
          });

          // Automatically authenticate user after successful creation
          const auth = await loginCustomer(input.email.trim(), input.password);
          const customer = await fetchCustomerProfile(auth.accessToken);

          set({
            isAuthenticated: true,
            accessToken: auth.accessToken,
            customer,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Registration failed';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await recoverCustomerPassword(email.trim());
          set({ isLoading: false, error: null });
          return { success: true };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Could not recover password';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      fetchCustomer: async () => {
        const { accessToken } = get();
        if (!accessToken) return;

        try {
          const customer = await fetchCustomerProfile(accessToken);
          if (customer) {
            set({ customer, isAuthenticated: true });
          } else {
            // Token expired or invalid
            set({ customer: null, isAuthenticated: false, accessToken: null });
          }
        } catch (err) {
          console.warn('[CustomerStore] fetchCustomer failed:', err);
        }
      },

      logout: async () => {
        const { accessToken } = get();
        if (accessToken) {
          await logoutCustomer(accessToken);
        }

        set({
          isAuthenticated: false,
          accessToken: null,
          customer: null,
          isLoading: false,
          error: null,
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

      addAddress: async (addressData) => {
        const { accessToken, fetchCustomer } = get();
        if (!accessToken) {
          return { success: false, error: 'Not authenticated' };
        }

        try {
          const addressId = await createCustomerAddress(accessToken, {
            address1: addressData.address1,
            address2: addressData.address2,
            city: addressData.city,
            province: addressData.province,
            zip: addressData.zip,
            country: addressData.country,
            phone: addressData.phone,
          });

          if (addressData.isDefault && addressId) {
            await setDefaultCustomerAddress(accessToken, addressId);
          }

          await fetchCustomer();
          return { success: true };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to add address';
          return { success: false, error: message };
        }
      },

      deleteAddress: async (addressId) => {
        const { accessToken, fetchCustomer } = get();
        if (!accessToken) {
          return { success: false, error: 'Not authenticated' };
        }

        try {
          await deleteCustomerAddress(accessToken, addressId);
          await fetchCustomer();
          return { success: true };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to delete address';
          return { success: false, error: message };
        }
      },

      setDefaultAddress: async (addressId) => {
        const { accessToken, fetchCustomer } = get();
        if (!accessToken) {
          return { success: false, error: 'Not authenticated' };
        }

        try {
          await setDefaultCustomerAddress(accessToken, addressId);
          await fetchCustomer();
          return { success: true };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to update default address';
          return { success: false, error: message };
        }
      },
    }),
    {
      name: 'bookstore-customer-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        wishlistProductIds: state.wishlistProductIds,
      }),
    }
  )
);
