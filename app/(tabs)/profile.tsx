import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../src/components/Header';
import { colors } from '../../src/theme/colors';
import { typography, radii, spacing, shadows } from '../../src/theme/typography';
import { useCustomerStore } from '../../src/store/useCustomerStore';
import { useCartStore } from '../../src/store/useCartStore';
import { MOCK_BOOKS } from '../../src/data/mockBooks';
import { CustomerOrder, CustomerAddress } from '../../src/types/shopify';

type AuthMode = 'login' | 'register' | 'forgot';
type ProfileTab = 'orders' | 'addresses' | 'wishlist';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    isAuthenticated,
    customer,
    wishlistProductIds,
    wishlistBooks,
    isLoading,
    login,
    register,
    forgotPassword,
    fetchCustomer,
    logout,
    toggleWishlist,
    addAddress,
    deleteAddress,
    setDefaultAddress,
  } = useCustomerStore();

  const addItemToCart = useCartStore((state) => state.addItem);

  // Auth Form State
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Profile Tabs
  const [activeTab, setActiveTab] = useState<ProfileTab>('orders');

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Selected Order for detail / tracking
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomer();
    }
  }, [isAuthenticated]);

  const formatCurrency = (val: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(val);
  };

  // Handle Native Shopify Login
  const handleLogin = async () => {
    setAuthError(null);
    setAuthSuccessMsg(null);

    if (!email.trim() || !password) {
      setAuthError('Please enter your email and password.');
      return;
    }

    const result = await login(email, password);
    if (!result.success) {
      setAuthError(result.error || 'Login failed. Please verify your credentials.');
    }
  };

  // Handle Native Shopify Registration
  const handleRegister = async () => {
    setAuthError(null);
    setAuthSuccessMsg(null);

    if (!email.trim() || !password) {
      setAuthError('Please provide an email and password.');
      return;
    }

    if (password.length < 5) {
      setAuthError('Password must be at least 5 characters long.');
      return;
    }

    const result = await register({
      email,
      password,
      firstName,
      lastName,
    });

    if (!result.success) {
      setAuthError(result.error || 'Registration failed. Please try again.');
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    setAuthError(null);
    setAuthSuccessMsg(null);

    if (!email.trim()) {
      setAuthError('Please enter your registered email address.');
      return;
    }

    const result = await forgotPassword(email);
    if (result.success) {
      setAuthSuccessMsg('Password reset instructions have been sent to your email.');
    } else {
      setAuthError(result.error || 'Could not send reset password email.');
    }
  };

  // Save new address to Shopify
  const handleSaveAddress = async () => {
    if (!addrStreet.trim() || !addrCity.trim() || !addrZip.trim()) {
      Alert.alert('Incomplete Address', 'Please provide Street, City, and Postal Code.');
      return;
    }

    setIsSavingAddress(true);
    const res = await addAddress({
      address1: addrStreet.trim(),
      city: addrCity.trim(),
      province: addrProvince.trim(),
      zip: addrZip.trim(),
      country: 'United States',
      phone: addrPhone.trim(),
      isDefault: addrIsDefault,
    });
    setIsSavingAddress(false);

    if (res.success) {
      setIsAddressModalOpen(false);
      setAddrStreet('');
      setAddrCity('');
      setAddrProvince('');
      setAddrZip('');
      setAddrPhone('');
      Alert.alert('Address Saved', 'Your address has been saved to your Shopify account.');
    } else {
      Alert.alert('Error', res.error || 'Could not save address.');
    }
  };

  // Delete address
  const handleDeleteAddress = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this address from your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const res = await deleteAddress(id);
          if (!res.success) {
            Alert.alert('Error', res.error || 'Could not delete address');
          }
        },
      },
    ]);
  };

  // Reorder items from past order
  const handleReorder = (order: CustomerOrder) => {
    order.lineItems.forEach((item) => {
      addItemToCart({
        productId: item.id,
        variantId: item.id,
        title: item.title,
        author: 'Store Author',
        format: 'Standard Edition',
        price: item.price,
        currencyCode: order.currencyCode,
        imageUrl: item.imageUrl || '',
        quantity: item.quantity,
      });
    });

    Alert.alert(
      'Added to Cart',
      `Items from order ${order.name} have been added to your shopping cart.`,
      [
        { text: 'Continue Shopping', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
      ]
    );
  };

  // Move wishlist book to cart
  const handleMoveWishlistToCart = (book: any) => {
    const variant = book.variants?.edges?.[0]?.node;
    const price = parseFloat(
      variant?.price?.amount ||
      book.priceRange?.minVariantPrice?.amount ||
      '0'
    );
    const currencyCode =
      variant?.price?.currencyCode ||
      book.priceRange?.minVariantPrice?.currencyCode ||
      'USD';
    const cover =
      book.images?.edges?.[0]?.node?.url || '';

    addItemToCart({
      productId: book.id,
      variantId: variant?.id || book.id,
      title: book.title,
      author: book.vendor,
      format: variant?.title || 'Standard Edition',
      price,
      currencyCode,
      imageUrl: cover,
      quantity: 1,
    });

    Alert.alert('Added to Cart', `"${book.title}" added to your cart!`);
  };

  // Logout confirmation
  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your Shopify account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  // -------------------------------------------------------------
  // RENDER: NOT AUTHENTICATED (Native Shopify Login / Register)
  // -------------------------------------------------------------
  if (!isAuthenticated || !customer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Account" showBack={false} showCart />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authContainer}>
            {/* Header Icon */}
            <View style={styles.authHeaderBox}>
              <View style={styles.authIconCircle}>
                <Ionicons name="person-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.authHeading}>Customer Account</Text>
              <Text style={styles.authSubheading}>
                Sign in or register to manage your orders, delivery addresses, and saved books.
              </Text>
            </View>

            {/* Mode Switcher */}
            <View style={styles.authModeSwitcher}>
              <TouchableOpacity
                style={[styles.authModeBtn, authMode === 'login' && styles.authModeBtnActive]}
                onPress={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthSuccessMsg(null);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.authModeBtnText,
                    authMode === 'login' && styles.authModeBtnTextActive,
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authModeBtn, authMode === 'register' && styles.authModeBtnActive]}
                onPress={() => {
                  setAuthMode('register');
                  setAuthError(null);
                  setAuthSuccessMsg(null);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.authModeBtnText,
                    authMode === 'register' && styles.authModeBtnTextActive,
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {authError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.errorBannerText}>{authError}</Text>
              </View>
            ) : null}

            {/* Success Message */}
            {authSuccessMsg ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.successBannerText}>{authSuccessMsg}</Text>
              </View>
            ) : null}

            {/* 1. SIGN IN FORM */}
            {authMode === 'login' && (
              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.inputField}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordField}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.forgotPassLink}
                  onPress={() => {
                    setAuthMode('forgot');
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                  }}
                >
                  <Text style={styles.forgotPassText}>Forgot your password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.88}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.textInverse} size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 2. CREATE ACCOUNT FORM */}
            {authMode === 'register' && (
              <View style={styles.formCard}>
                <View style={styles.nameRow}>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text style={styles.inputLabel}>First Name</Text>
                    <TextInput
                      style={styles.inputField}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="John"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.inputLabel}>Last Name</Text>
                    <TextInput
                      style={styles.inputField}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Doe"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.inputField}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={styles.passwordField}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a password (min 5 characters)"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.88}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.textInverse} size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 3. FORGOT PASSWORD FORM */}
            {authMode === 'forgot' && (
              <View style={styles.formCard}>
                <Text style={styles.inputLabel}>Enter Registered Email</Text>
                <TextInput
                  style={styles.inputField}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.email@example.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleForgotPassword}
                  disabled={isLoading}
                  activeOpacity={0.88}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.textInverse} size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backToLoginBtn}
                  onPress={() => {
                    setAuthMode('login');
                    setAuthError(null);
                    setAuthSuccessMsg(null);
                  }}
                >
                  <Ionicons name="arrow-back" size={16} color={colors.primary} />
                  <Text style={styles.backToLoginText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Support Link */}
            <TouchableOpacity
              style={styles.supportLinkRow}
              onPress={() => router.push('/contact')}
            >
              <Ionicons name="help-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.supportLinkText}>Need help? Contact Bookstore Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Real Wishlist Books from store with fallback to mock if applicable
  const displayedWishlistBooks = [
    ...wishlistBooks,
    ...MOCK_BOOKS.filter(
      (mb) =>
        wishlistProductIds.includes(mb.id) &&
        !wishlistBooks.some((wb) => wb.id === mb.id)
    ),
  ];

  // -------------------------------------------------------------
  // RENDER: AUTHENTICATED CUSTOMER (Real Shopify Customer Profile)
  // -------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Account" showBack={false} showCart />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Real Customer Banner */}
        <View style={styles.customerHeaderCard}>
          <View style={styles.customerAvatar}>
            <Text style={styles.customerAvatarText}>
              {customer.firstName ? customer.firstName[0].toUpperCase() : ''}
              {customer.lastName ? customer.lastName[0].toUpperCase() : customer.email[0].toUpperCase()}
            </Text>
          </View>

          <View style={styles.customerInfoCol}>
            <Text style={styles.customerDisplayName}>{customer.displayName}</Text>
            <Text style={styles.customerEmailText}>{customer.email}</Text>
            {customer.phone ? (
              <Text style={styles.customerPhoneText}>{customer.phone}</Text>
            ) : null}
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.profileTabBar}>
          <TouchableOpacity
            style={[styles.profileTabBtn, activeTab === 'orders' && styles.profileTabBtnActive]}
            onPress={() => setActiveTab('orders')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'orders' ? 'cube' : 'cube-outline'}
              size={18}
              color={activeTab === 'orders' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.profileTabText,
                activeTab === 'orders' && styles.profileTabTextActive,
              ]}
            >
              Orders ({customer.orders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.profileTabBtn, activeTab === 'addresses' && styles.profileTabBtnActive]}
            onPress={() => setActiveTab('addresses')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'addresses' ? 'location' : 'location-outline'}
              size={18}
              color={activeTab === 'addresses' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.profileTabText,
                activeTab === 'addresses' && styles.profileTabTextActive,
              ]}
            >
              Addresses ({customer.addresses.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.profileTabBtn, activeTab === 'wishlist' && styles.profileTabBtnActive]}
            onPress={() => setActiveTab('wishlist')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'wishlist' ? 'heart' : 'heart-outline'}
              size={18}
              color={activeTab === 'wishlist' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.profileTabText,
                activeTab === 'wishlist' && styles.profileTabTextActive,
              ]}
            >
              Wishlist ({displayedWishlistBooks.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* --------------------------------------------------------- */}
        {/* TAB 1: REAL ORDERS FROM SHOPIFY                           */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'orders' && (
          <View style={styles.tabContainer}>
            {customer.orders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="bag-handle-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Orders Yet</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't placed any orders yet. Once you complete a purchase, your order history
                  and live status will appear here.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.emptyActionBtnText}>Browse Bookstore</Text>
                </TouchableOpacity>
              </View>
            ) : (
              customer.orders.map((order) => {
                const isPaid = order.financialStatus === 'PAID';
                const isFulfilled = order.fulfillmentStatus === 'FULFILLED';

                return (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderCardTop}>
                      <View>
                        <Text style={styles.orderNameText}>{order.name}</Text>
                        <Text style={styles.orderDateText}>
                          {new Date(order.processedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.orderTotalText}>
                          {formatCurrency(order.totalPrice, order.currencyCode)}
                        </Text>
                        <View style={styles.statusPillsRow}>
                          <View
                            style={[
                              styles.statusPill,
                              isPaid ? styles.statusPillSuccess : styles.statusPillWarning,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                isPaid ? styles.statusTextSuccess : styles.statusTextWarning,
                              ]}
                            >
                              {order.financialStatus}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusPill,
                              isFulfilled ? styles.statusPillSuccess : styles.statusPillInfo,
                              { marginLeft: 4 },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusPillText,
                                isFulfilled ? styles.statusTextSuccess : styles.statusTextInfo,
                              ]}
                            >
                              {order.fulfillmentStatus || 'UNFULFILLED'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Order Line Items */}
                    <View style={styles.orderLineItemsList}>
                      {order.lineItems.map((item) => (
                        <View key={item.id} style={styles.orderLineItem}>
                          {item.imageUrl ? (
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={styles.orderItemImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.orderItemImagePlaceholder}>
                              <Ionicons name="book-outline" size={16} color={colors.textMuted} />
                            </View>
                          )}
                          <View style={styles.orderItemInfoCol}>
                            <Text style={styles.orderItemTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={styles.orderItemSub}>
                              Qty: {item.quantity} • {formatCurrency(item.price, order.currencyCode)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Reorder Button */}
                    <View style={styles.orderCardFooter}>
                      <TouchableOpacity
                        style={styles.reorderBtn}
                        onPress={() => handleReorder(order)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="refresh-outline" size={15} color={colors.textInverse} />
                        <Text style={styles.reorderBtnText}>Reorder</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 2: REAL ADDRESSES FROM SHOPIFY                        */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'addresses' && (
          <View style={styles.tabContainer}>
            <View style={styles.addressSectionHeader}>
              <Text style={styles.addressSectionTitle}>Shipping Addresses</Text>
              <TouchableOpacity
                style={styles.addAddressHeaderBtn}
                onPress={() => setIsAddressModalOpen(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color={colors.textInverse} />
                <Text style={styles.addAddressHeaderBtnText}>Add Address</Text>
              </TouchableOpacity>
            </View>

            {customer.addresses.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="location-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Addresses Saved</Text>
                <Text style={styles.emptySubtitle}>
                  Add your shipping address for fast and seamless checkout on your future orders.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => setIsAddressModalOpen(true)}
                >
                  <Text style={styles.emptyActionBtnText}>Add New Address</Text>
                </TouchableOpacity>
              </View>
            ) : (
              customer.addresses.map((addr) => (
                <View key={addr.id} style={styles.addressCard}>
                  <View style={styles.addressCardTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.addressStreet}>{addr.address1}</Text>
                      {addr.isDefault ? (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {addr.address2 ? (
                    <Text style={styles.addressLine}>{addr.address2}</Text>
                  ) : null}
                  <Text style={styles.addressLine}>
                    {addr.city}, {addr.province} {addr.zip}
                  </Text>
                  <Text style={styles.addressCountry}>{addr.country}</Text>
                  {addr.phone ? (
                    <Text style={styles.addressPhone}>Phone: {addr.phone}</Text>
                  ) : null}

                  <View style={styles.addressCardFooter}>
                    {!addr.isDefault ? (
                      <TouchableOpacity
                        style={styles.setDefaultLink}
                        onPress={() => setDefaultAddress(addr.id)}
                      >
                        <Text style={styles.setDefaultLinkText}>Set as Default</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={styles.deleteAddressLink}
                      onPress={() => handleDeleteAddress(addr.id)}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.error} />
                      <Text style={styles.deleteAddressLinkText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* --------------------------------------------------------- */}
        {/* TAB 3: WISHLIST                                           */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'wishlist' && (
          <View style={styles.tabContainer}>
            {displayedWishlistBooks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="heart-dislike-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Wishlist is Empty</Text>
                <Text style={styles.emptySubtitle}>
                  Save titles while browsing our catalog to keep track of books you want to read.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.emptyActionBtnText}>Browse Catalog</Text>
                </TouchableOpacity>
              </View>
            ) : (
              displayedWishlistBooks.map((book) => {
                const cover =
                  book.images?.edges?.[0]?.node?.url || '';
                const price = parseFloat(
                  book.priceRange?.minVariantPrice?.amount ||
                  book.variants?.edges?.[0]?.node?.price?.amount ||
                  '0'
                );

                return (
                  <View key={book.id} style={styles.wishlistCard}>
                    {cover ? (
                      <Image
                        source={{ uri: cover }}
                        style={styles.wishlistCover}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.wishlistCoverPlaceholder}>
                        <Ionicons name="book-outline" size={24} color={colors.textMuted} />
                      </View>
                    )}

                    <View style={styles.wishlistInfoCol}>
                      <Text style={styles.wishlistAuthor}>{book.vendor}</Text>
                      <Text style={styles.wishlistTitle} numberOfLines={2}>
                        {book.title}
                      </Text>
                      <Text style={styles.wishlistPrice}>{formatCurrency(price)}</Text>

                      <View style={styles.wishlistActionRow}>
                        <TouchableOpacity
                          style={styles.wishlistAddToCartBtn}
                          onPress={() => handleMoveWishlistToCart(book)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="bag-add-outline" size={15} color={colors.textInverse} />
                          <Text style={styles.wishlistAddToCartBtnText}>Add to Cart</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.wishlistRemoveBtn}
                          onPress={() => toggleWishlist(book.id)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutBtnText}>Sign Out of Shopify Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --------------------------------------------------------- */}
      {/* MODAL: ADD DELIVERY ADDRESS TO SHOPIFY                    */}
      {/* --------------------------------------------------------- */}
      <Modal
        visible={isAddressModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddressModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Shipping Address</Text>
              <TouchableOpacity onPress={() => setIsAddressModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <Text style={styles.inputLabel}>Street Address *</Text>
              <TextInput
                style={styles.inputField}
                value={addrStreet}
                onChangeText={setAddrStreet}
                placeholder="e.g. 123 Main Street"
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.nameRow}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TextInput
                    style={styles.inputField}
                    value={addrCity}
                    onChangeText={setAddrCity}
                    placeholder="e.g. New York"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.inputLabel}>State / Province</Text>
                  <TextInput
                    style={styles.inputField}
                    value={addrProvince}
                    onChangeText={setAddrProvince}
                    placeholder="e.g. NY"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.nameRow}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Text style={styles.inputLabel}>Postal / ZIP Code *</Text>
                  <TextInput
                    style={styles.inputField}
                    value={addrZip}
                    onChangeText={setAddrZip}
                    placeholder="e.g. 10001"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.inputField}
                    value={addrPhone}
                    onChangeText={setAddrPhone}
                    placeholder="+1 555-0100"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddressModalOpen(false)}
                disabled={isSavingAddress}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveAddress}
                disabled={isSavingAddress}
              >
                {isSavingAddress ? (
                  <ActivityIndicator color={colors.textInverse} size="small" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl * 2,
  },

  // -------------------------------------------------------------
  // Auth Form Styles
  // -------------------------------------------------------------
  authContainer: {
    paddingVertical: spacing.md,
  },
  authHeaderBox: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  authIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  authHeading: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  authSubheading: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  authModeSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  authModeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  authModeBtnActive: {
    backgroundColor: colors.card,
    ...shadows.subtle,
  },
  authModeBtnText: {
    ...typography.subtitle,
    fontSize: 14,
    color: colors.textMuted,
  },
  authModeBtnTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },

  formCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  inputField: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
  },
  nameRow: {
    flexDirection: 'row',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
  },
  passwordField: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
  },
  eyeBtn: {
    paddingHorizontal: spacing.md,
  },
  forgotPassLink: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  forgotPassText: {
    ...typography.caption,
    color: colors.accentDark,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  backToLoginText: {
    ...typography.button,
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successBannerText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },

  supportLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  supportLinkText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 4,
  },

  // -------------------------------------------------------------
  // Authenticated Profile Styles
  // -------------------------------------------------------------
  customerHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerAvatarText: {
    ...typography.h2,
    color: colors.textInverse,
    fontWeight: '800',
  },
  customerInfoCol: {
    marginLeft: spacing.md,
    flex: 1,
  },
  customerDisplayName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  customerEmailText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customerPhoneText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  profileTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  profileTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  profileTabBtnActive: {
    backgroundColor: colors.card,
    ...shadows.subtle,
  },
  profileTabText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
    fontWeight: '600',
  },
  profileTabTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  tabContainer: {
    marginBottom: spacing.lg,
  },

  // Orders Tab
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  orderNameText: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  orderDateText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  orderTotalText: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.primary,
  },
  statusPillsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  statusPillSuccess: {
    backgroundColor: colors.successLight,
  },
  statusPillWarning: {
    backgroundColor: '#FEF3C7',
  },
  statusPillInfo: {
    backgroundColor: '#DBEAFE',
  },
  statusPillText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
  },
  statusTextSuccess: {
    color: colors.success,
  },
  statusTextWarning: {
    color: colors.accentDark,
  },
  statusTextInfo: {
    color: '#1E40AF',
  },

  orderLineItemsList: {
    marginVertical: spacing.xs,
  },
  orderLineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  orderItemImage: {
    width: 36,
    height: 50,
    borderRadius: radii.xs,
    backgroundColor: colors.surface,
  },
  orderItemImagePlaceholder: {
    width: 36,
    height: 50,
    borderRadius: radii.xs,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItemInfoCol: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  orderItemTitle: {
    ...typography.subtitle,
    fontSize: 13,
    color: colors.textPrimary,
  },
  orderItemSub: {
    ...typography.caption,
    color: colors.textMuted,
  },

  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  reorderBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textInverse,
    marginLeft: 4,
  },

  // Addresses Tab
  addressSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addressSectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  addAddressHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  addAddressHeaderBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textInverse,
    marginLeft: 2,
  },
  addressCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  addressCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressStreet: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  defaultBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  defaultBadgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textInverse,
  },
  addressLine: {
    ...typography.body,
    color: colors.textSecondary,
  },
  addressCountry: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  addressPhone: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  addressCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  setDefaultLink: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  setDefaultLinkText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  deleteAddressLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  deleteAddressLinkText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Wishlist Tab
  wishlistCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  wishlistCover: {
    width: 70,
    height: 105,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  wishlistCoverPlaceholder: {
    width: 70,
    height: 105,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistInfoCol: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  wishlistAuthor: {
    ...typography.caption,
    color: colors.textMuted,
  },
  wishlistTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  wishlistPrice: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.primary,
  },
  wishlistActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  wishlistAddToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  wishlistAddToCartBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textInverse,
    marginLeft: 4,
  },
  wishlistRemoveBtn: {
    padding: 6,
  },

  // Empty States
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.subtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: 4,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  emptyActionBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorLight,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: spacing.md,
  },
  logoutBtnText: {
    ...typography.button,
    color: colors.error,
    marginLeft: spacing.xs,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  modalCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  modalCancelBtnText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
