# Alexandria Book Store — Headless Shopify Mobile App

A production-ready, enterprise-grade mobile application for a **Book Store** built with **React Native (Expo SDK 52+, Expo Router v4, and TypeScript)**. The app connects fully headless to Shopify via the **Shopify Storefront API (GraphQL)**.

---

## 🏛 Architecture Overview

```
Book store/
├── app/                              # Expo Router File-Based Routing
│   ├── (tabs)/                       # Main Tab Navigation
│   │   ├── _layout.tsx               # Bottom tabs with dynamic cart badge & active tints
│   │   ├── index.tsx                 # Home: Hero "Book of the Month", Genres, Bestsellers
│   │   ├── collections.tsx           # Catalog: Live search & Genre filter chips
│   │   ├── cart.tsx                  # Cart Tab (delegates to interactive CartScreen)
│   │   └── profile.tsx               # Customer Account API, store policies, & cache reset
│   ├── product/
│   │   └── [id].tsx                  # Dynamic Product Detail: formats, metadata, sticky CTA
│   ├── checkout.tsx                  # Dedicated Checkout Handler Route & WebBrowser trigger
│   ├── contact.tsx                   # Customer Support, Bookstore FAQs & Inquiries
│   └── _layout.tsx                   # Root Stack layout with SafeArea & Theme Providers
│
├── src/
│   ├── api/                          # Shopify Headless Integration Layer
│   │   ├── shopifyClient.ts          # Resilient GraphQL client with error handling & offline fallback
│   │   ├── queries.ts                # Optimized GraphQL queries & Storefront Cart mutations
│   │   └── checkout.ts               # Checkout session generation & expo-web-browser launcher
│   │
│   ├── store/                        # Global State Management
│   │   └── useCartStore.ts           # Zustand store with AsyncStorage persistence
│   │
│   ├── components/                   # Core UI Components (Pure React Native StyleSheet)
│   │   ├── BookCard.tsx              # 60fps Android-optimized book card with cover elevation
│   │   ├── CatalogScreen.tsx         # Reusable book grid with 2-column layout & search
│   │   ├── CartScreen.tsx            # Interactive cart with quantity steppers & pricing summary
│   │   ├── Header.tsx                # Reusable navigation header with cart badge
│   │   └── Badge.tsx                 # Atomic tags, formats, and rating pills
│   │
│   ├── theme/                        # Literary & Editorial Design System
│   │   ├── colors.ts                 # Deep Oxford Blue (#0F172A), Gold Foil (#D97706), Parchment
│   │   └── typography.ts             # Type scale, spacing, radii, and platform-optimized shadows
│   │
│   ├── types/
│   │   └── shopify.ts                # Strict TypeScript types (zero `any` types)
│   │
│   └── data/
│       └── mockBooks.ts              # Curated fallback bookstore dataset for instant preview
│
├── .env                              # Active environment configuration
├── .env.example                      # Template for environment variables
├── app.json                          # Expo configuration for SDK 52+ & Expo Router
├── package.json                      # Project dependencies and run scripts
└── tsconfig.json                     # Strict TypeScript compiler options with @/ alias
```

---

## 🔑 Shopify Headless Configuration

Configure your Shopify credentials in a local `.env` file (copy from `.env.example`):

| Key | Description | Example / Note |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_STOREFRONT_TOKEN` | Storefront Access Token | `your_storefront_access_token` |
| `EXPO_PUBLIC_STOREFRONT_CLIENT_ID` | Storefront Client ID | `your_storefront_client_id` |
| `EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID` | Customer Account API Client ID | `your_customer_account_client_id` |
| `EXPO_PUBLIC_SHOPIFY_DOMAIN` | Your Shopify Store Domain | `your-store-name.myshopify.com` |
| `EXPO_PUBLIC_SHOPIFY_API_VERSION` | Storefront API Version | `2024-10` |

### Setting Your Live Store Domain:
Edit `.env` and set `EXPO_PUBLIC_SHOPIFY_DOMAIN` to your real myshopify domain:
```env
EXPO_PUBLIC_SHOPIFY_DOMAIN=your-store-name.myshopify.com
```

> **Resilient Fallback Mode**: If `EXPO_PUBLIC_SHOPIFY_DOMAIN` is still pointing to the default placeholder or your store has no book products seeded yet, the app automatically switches to the built-in rich literary mock catalog so developers and testers can verify all UI, cart, search, and details immediately!

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Typecheck Project
```bash
npm run typecheck
```

### 3. Run Development Server
```bash
npm start
```

- Press `a` in terminal to launch on **Android Emulator / Device**.
- Press `i` to launch on **iOS Simulator**.
- Press `w` to launch on **Web**.
- Scan the QR code with **Expo Go** on your physical phone!

---

## ⚡ Performance Optimizations for Android (60fps)

1. **Pure React Native `StyleSheet`**: No heavy component frameworks or CSS-in-JS runtime overhead.
2. **Fixed 2:3 Aspect Ratio Book Covers**: Prevents layout reflow and image jitter during rapid scrolling.
3. **FlatList Windowing**: Optimized `numColumns={2}`, `keyExtractor`, and `useCallback` item renderers.
4. **Zustand Micro-selectors**: Components only re-render when the specific slice of state they subscribe to changes.
5. **Hardware Elevation & Native Shadows**: Platform-specific subtle shadows for native look and silky smooth rendering.
