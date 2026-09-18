/**
 * Global Cart State Management using Zustand + AsyncStorage persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, CartStoreState } from '../types/shopify';

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      currencyCode: 'USD',

      addItem: (newItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.variantId === newItem.variantId
          );

          if (existingIndex > -1) {
            // Update quantity of existing item
            const updatedItems = [...state.items];
            const currentItem = updatedItems[existingIndex];
            const newQty = currentItem.quantity + (newItem.quantity || 1);
            const max = currentItem.maxQuantity || 99;

            updatedItems[existingIndex] = {
              ...currentItem,
              quantity: Math.min(newQty, max),
            };

            return { items: updatedItems };
          }

          // Append newly selected book variant
          const itemWithId: CartItem = {
            ...newItem,
            id: `${newItem.productId}_${newItem.variantId}`,
            quantity: newItem.quantity || 1,
          };

          return {
            items: [...state.items, itemWithId],
            currencyCode: newItem.currencyCode || state.currencyCode,
          };
        });
      },

      removeItem: (variantId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.variantId !== variantId),
            };
          }

          return {
            items: state.items.map((item) => {
              if (item.variantId === variantId) {
                const max = item.maxQuantity || 99;
                return { ...item, quantity: Math.min(quantity, max) };
              }
              return item;
            }),
          };
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        const { items } = get();
        const total = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        return Number(total.toFixed(2));
      },
    }),
    {
      name: 'bookstore-cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        currencyCode: state.currencyCode,
      }),
    }
  )
);
