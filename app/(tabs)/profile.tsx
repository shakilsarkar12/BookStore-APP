import React, { useState } from 'react';
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
  Switch,
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
import { CustomerAddress, CustomerOrder } from '../../src/types/shopify';

type ActiveTab = 'orders' | 'addresses' | 'wishlist' | 'settings';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    isAuthenticated,
    customer,
    wishlistProductIds,
    isLoading,
    loginWithShopify,
    loginAsGuestOrDemo,
    logout,
    toggleWishlist,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useCustomerStore();

  const addItemToCart = useCartStore((state) => state.addItem);
  const clearCart = useCartStore((state) => state.clearCart);

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('orders');

  // Address Modal State
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrName, setAddrName] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Order Tracking Modal State
  const [trackingOrder, setTrackingOrder] = useState<CustomerOrder | null>(null);

  // Notification toggles
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);

  // Developer info collapsed toggle
  const [showDevInfo, setShowDevInfo] = useState(false);

  const shopifyDomain =
    process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN || 'book-store-cpepvunk.myshopify.com';
  const customerClientId =
    process.env.EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID || '6d60f305-08b3-4b38-a6e4-74700703d114';

  const formatCurrency = (val: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(val);
  };

  // Open Add Address Modal
  const openNewAddressModal = () => {
    setEditingAddressId(null);
    setAddrName(customer?.displayName || '');
    setAddrStreet('');
    setAddrCity('');
    setAddrProvince('');
    setAddrZip('');
    setAddrPhone(customer?.phone || '');
    setAddrIsDefault(customer?.addresses.length === 0);
    setIsAddressModalVisible(true);
  };

  // Open Edit Address Modal
  const openEditAddressModal = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setAddrName(addr.name || '');
    setAddrStreet(addr.address1 || '');
    setAddrCity(addr.city || '');
    setAddrProvince(addr.province || '');
    setAddrZip(addr.zip || '');
    setAddrPhone(addr.phone || '');
    setAddrIsDefault(!!addr.isDefault);
    setIsAddressModalVisible(true);
  };

  // Save Address
  const handleSaveAddress = () => {
    if (!addrStreet.trim() || !addrCity.trim() || !addrZip.trim()) {
      Alert.alert('Incomplete Address', 'Please provide Street, City, and Postal Code.');
      return;
    }

    const payload = {
      name: addrName.trim() || customer?.displayName || 'Customer',
      address1: addrStreet.trim(),
      city: addrCity.trim(),
      province: addrProvince.trim(),
      zip: addrZip.trim(),
      country: 'United States',
      phone: addrPhone.trim(),
      isDefault: addrIsDefault,
    };

    if (editingAddressId) {
      updateAddress(editingAddressId, payload);
    } else {
      addAddress(payload);
    }

    setIsAddressModalVisible(false);
  };

  // Reorder Items
  const handleReorder = (order: CustomerOrder) => {
    order.lineItems.forEach((item) => {
      addItemToCart({
        productId: `prod_${item.id}`,
        variantId: `var_${item.id}`,
        title: item.title,
        author: 'Featured Author',
        format: 'Paperback Edition',
        price: item.price,
        currencyCode: order.currencyCode,
        imageUrl: item.imageUrl || '',
        quantity: item.quantity,
      });
    });

    Alert.alert(
      'Added to Cart',
      `All items from ${order.name} have been added to your shopping cart!`,
      [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
      ]
    );
  };

  // Move wishlist book to cart
  const handleMoveWishlistToCart = (book: typeof MOCK_BOOKS[0]) => {
    const variant = book.variants.edges[0]?.node;
    if (!variant) return;

    addItemToCart({
      productId: book.id,
      variantId: variant.id,
      title: book.title,
      author: book.vendor,
      format: variant.title || 'Standard Edition',
      price: parseFloat(variant.price.amount),
      currencyCode: variant.price.currencyCode,
      imageUrl: book.images.edges[0]?.node.url || '',
      quantity: 1,
    });

    Alert.alert('Added to Cart', `"${book.title}" added to your cart!`);
  };

  // Sign out confirmation
  const handleLogoutConfirm = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your customer account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  // -------------------------------------------------------------
  // Render: Not Authenticated (Customer Sign In State)
  // -------------------------------------------------------------
  if (!isAuthenticated || !customer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Customer Account" showBack={false} showCart />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Banner */}
          <View style={styles.guestHeroCard}>
            <View style={styles.guestIconCircle}>
              <Ionicons name="book-outline" size={38} color={colors.primary} />
            </View>
            <Text style={styles.guestTitle}>Welcome to BookStore</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to track your book orders, manage shipping addresses, and save favorites to
              your reading wishlist.
            </Text>

            {/* Shopify OAuth Customer Account Login */}
            <TouchableOpacity
              style={styles.shopifyLoginButton}
              onPress={loginWithShopify}
              activeOpacity={0.88}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <>
                  <Ionicons name="bag-handle" size={20} color={colors.textInverse} />
                  <Text style={styles.shopifyLoginText}>Sign In with Shopify Account</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Demo / One-Click Customer Login */}
            <TouchableOpacity
              style={styles.demoLoginButton}
              onPress={loginAsGuestOrDemo}
              activeOpacity={0.7}
            >
              <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.demoLoginText}>Quick Sign In as VIP Reader Member</Text>
            </TouchableOpacity>
          </View>

          {/* Member Benefits Grid */}
          <Text style={styles.perksSectionTitle}>Why Join Reader Rewards?</Text>

          <View style={styles.perksGrid}>
            <View style={styles.perkCard}>
              <View style={[styles.perkIconWrapper, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="airplane-outline" size={22} color="#0284C7" />
              </View>
              <Text style={styles.perkCardTitle}>Live Order Tracking</Text>
              <Text style={styles.perkCardDesc}>
                Real-time shipping notifications and doorstep parcel tracking.
              </Text>
            </View>

            <View style={styles.perkCard}>
              <View style={[styles.perkIconWrapper, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="heart-outline" size={22} color={colors.accentDark} />
              </View>
              <Text style={styles.perkCardTitle}>Curated Wishlist</Text>
              <Text style={styles.perkCardDesc}>
                Save favorite authors, upcoming titles, and reading queues.
              </Text>
            </View>

            <View style={styles.perkCard}>
              <View style={[styles.perkIconWrapper, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="ribbon-outline" size={22} color="#16A34A" />
              </View>
              <Text style={styles.perkCardTitle}>Bookworm Rewards</Text>
              <Text style={styles.perkCardDesc}>
                Earn 5 points for every $1 spent and redeem exclusive gift cards.
              </Text>
            </View>

            <View style={styles.perkCard}>
              <View style={[styles.perkIconWrapper, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="flash-outline" size={22} color="#9333EA" />
              </View>
              <Text style={styles.perkCardTitle}>1-Tap Express Checkout</Text>
              <Text style={styles.perkCardDesc}>
                Store verified shipping addresses for swift and seamless ordering.
              </Text>
            </View>
          </View>

          {/* Quick Help & FAQ */}
          <View style={styles.menuGroup}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/contact')}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="help-buoy-outline" size={20} color={colors.primary} />
                <Text style={styles.menuText}>Help Center & Store FAQ</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Wishlist Books list
  const wishlistBooks = MOCK_BOOKS.filter((book) => wishlistProductIds.includes(book.id));

  // -------------------------------------------------------------
  // Render: Authenticated Customer Profile & Hub
  // -------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="My Account" showBack={false} showCart />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Header Profile Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {customer.firstName[0]}
                {customer.lastName[0]}
              </Text>
            </View>
            <View style={styles.profileTextCol}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{customer.displayName}</Text>
                <View style={styles.tierPill}>
                  <Text style={styles.tierPillText}>{customer.memberTier}</Text>
                </View>
              </View>
              <Text style={styles.profileEmail}>{customer.email}</Text>
              {customer.phone ? <Text style={styles.profilePhone}>{customer.phone}</Text> : null}
            </View>
          </View>

          {/* Reader Points Banner */}
          <View style={styles.pointsBanner}>
            <View style={styles.pointsLeft}>
              <Ionicons name="sparkles" size={18} color={colors.accent} />
              <View style={{ marginLeft: spacing.sm }}>
                <Text style={styles.pointsTitle}>{customer.points} Reader Points</Text>
                <Text style={styles.pointsSubtitle}>$15 Bookstore Reward Voucher Ready</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.redeemButton}
              onPress={() => Alert.alert('Rewards', 'Points voucher applied automatically at checkout!')}
              activeOpacity={0.8}
            >
              <Text style={styles.redeemButtonText}>Redeem</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Segmented Navigation Tabs */}
        <View style={styles.segmentedTabBar}>
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'orders' && styles.segmentTabActive]}
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
                styles.segmentTabText,
                activeTab === 'orders' && styles.segmentTabTextActive,
              ]}
            >
              Orders ({customer.orders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'addresses' && styles.segmentTabActive]}
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
                styles.segmentTabText,
                activeTab === 'addresses' && styles.segmentTabTextActive,
              ]}
            >
              Addresses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'wishlist' && styles.segmentTabActive]}
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
                styles.segmentTabText,
                activeTab === 'wishlist' && styles.segmentTabTextActive,
              ]}
            >
              Wishlist ({wishlistBooks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'settings' && styles.segmentTabActive]}
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.8}
          >
            <Ionicons
              name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
              size={18}
              color={activeTab === 'settings' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.segmentTabText,
                activeTab === 'settings' && styles.segmentTabTextActive,
              ]}
            >
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: ORDERS & PARCEL TRACKING                                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'orders' && (
          <View style={styles.tabContentContainer}>
            {customer.orders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="basket-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No Orders Yet</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't placed any book orders yet. Browse our literary catalog to find your
                  next favorite read!
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.emptyActionBtnText}>Explore Books</Text>
                </TouchableOpacity>
              </View>
            ) : (
              customer.orders.map((order) => {
                const isDelivered = order.fulfillmentStatus === 'FULFILLED';
                const isInTransit = order.fulfillmentStatus === 'IN_TRANSIT';

                return (
                  <View key={order.id} style={styles.orderCard}>
                    {/* Order Header */}
                    <View style={styles.orderCardHeader}>
                      <View>
                        <Text style={styles.orderNumberText}>{order.name}</Text>
                        <Text style={styles.orderDateText}>
                          {new Date(order.processedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={styles.orderRightHeader}>
                        <Text style={styles.orderTotalText}>
                          {formatCurrency(order.totalPrice, order.currencyCode)}
                        </Text>
                        <View
                          style={[
                            styles.statusPill,
                            isDelivered
                              ? styles.statusPillSuccess
                              : isInTransit
                              ? styles.statusPillTransit
                              : styles.statusPillPending,
                          ]}
                        >
                          <Ionicons
                            name={
                              isDelivered
                                ? 'checkmark-circle'
                                : isInTransit
                                ? 'car-outline'
                                : 'time-outline'
                            }
                            size={12}
                            color={
                              isDelivered
                                ? colors.success
                                : isInTransit
                                ? '#2563EB'
                                : colors.warning
                            }
                          />
                          <Text
                            style={[
                              styles.statusPillText,
                              isDelivered
                                ? styles.statusTextSuccess
                                : isInTransit
                                ? styles.statusTextTransit
                                : styles.statusTextPending,
                            ]}
                          >
                            {order.estimatedDelivery || (isDelivered ? 'Delivered' : 'Processing')}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Order Line Items */}
                    <View style={styles.orderLineItemsWrapper}>
                      {order.lineItems.map((item) => (
                        <View key={item.id} style={styles.orderLineItem}>
                          {item.imageUrl ? (
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={styles.orderBookThumb}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.orderBookPlaceholder}>
                              <Ionicons name="book" size={16} color={colors.textMuted} />
                            </View>
                          )}
                          <View style={styles.orderLineItemInfo}>
                            <Text style={styles.orderLineItemTitle} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={styles.orderLineItemSub}>
                              Qty: {item.quantity} • {formatCurrency(item.price, order.currencyCode)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Order Action Buttons */}
                    <View style={styles.orderActionRow}>
                      <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => setTrackingOrder(order)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="location-outline" size={15} color={colors.primary} />
                        <Text style={styles.trackButtonText}>Track Parcel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.reorderButton}
                        onPress={() => handleReorder(order)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="refresh-outline" size={15} color={colors.textInverse} />
                        <Text style={styles.reorderButtonText}>Buy Again</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: SAVED ADDRESSES                                        */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'addresses' && (
          <View style={styles.tabContentContainer}>
            <View style={styles.tabSectionHeaderRow}>
              <Text style={styles.tabSectionTitle}>Delivery Addresses</Text>
              <TouchableOpacity
                style={styles.addAddressHeaderBtn}
                onPress={openNewAddressModal}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={colors.textInverse} />
                <Text style={styles.addAddressHeaderBtnText}>Add Address</Text>
              </TouchableOpacity>
            </View>

            {customer.addresses.map((addr) => (
              <View key={addr.id} style={styles.addressCard}>
                <View style={styles.addressTopRow}>
                  <View style={styles.addressTitleRow}>
                    <Text style={styles.addressRecipientName}>{addr.name}</Text>
                    {addr.isDefault ? (
                      <View style={styles.defaultAddressBadge}>
                        <Text style={styles.defaultAddressBadgeText}>DEFAULT</Text>
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.editAddressIconBtn}
                    onPress={() => openEditAddressModal(addr)}
                  >
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.addressStreetText}>{addr.address1}</Text>
                {addr.address2 ? <Text style={styles.addressStreetText}>{addr.address2}</Text> : null}
                <Text style={styles.addressCityZipText}>
                  {addr.city}, {addr.province} {addr.zip}
                </Text>
                <Text style={styles.addressCountryText}>{addr.country}</Text>
                {addr.phone ? (
                  <Text style={styles.addressPhoneText}>Phone: {addr.phone}</Text>
                ) : null}

                <View style={styles.addressCardFooter}>
                  {!addr.isDefault ? (
                    <TouchableOpacity
                      style={styles.setDefaultBtn}
                      onPress={() => setDefaultAddress(addr.id)}
                    >
                      <Text style={styles.setDefaultBtnText}>Set as Default</Text>
                    </TouchableOpacity>
                  ) : null}

                  {customer.addresses.length > 1 ? (
                    <TouchableOpacity
                      style={styles.deleteAddressBtn}
                      onPress={() => deleteAddress(addr.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                      <Text style={styles.deleteAddressBtnText}>Delete</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: WISHLIST & SAVED BOOKS                                  */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'wishlist' && (
          <View style={styles.tabContentContainer}>
            {wishlistBooks.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="heart-dislike-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Wishlist is Empty</Text>
                <Text style={styles.emptySubtitle}>
                  Save books to your reading list while browsing to keep track of titles you love.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text style={styles.emptyActionBtnText}>Browse Bookstore</Text>
                </TouchableOpacity>
              </View>
            ) : (
              wishlistBooks.map((book) => {
                const cover = book.images.edges[0]?.node.url;
                const price = parseFloat(book.priceRange.minVariantPrice.amount);

                return (
                  <View key={book.id} style={styles.wishlistCard}>
                    {cover ? (
                      <Image
                        source={{ uri: cover }}
                        style={styles.wishlistCoverImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.wishlistCoverPlaceholder}>
                        <Ionicons name="book" size={24} color={colors.textMuted} />
                      </View>
                    )}

                    <View style={styles.wishlistInfoCol}>
                      <Text style={styles.wishlistVendor}>{book.vendor}</Text>
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

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: ACCOUNT SETTINGS & PREFERENCES                          */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'settings' && (
          <View style={styles.tabContentContainer}>
            {/* Notifications Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeaderTitle}>Notifications & Alerts</Text>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Order Status Updates</Text>
                  <Text style={styles.toggleSubtitle}>
                    Receive shipping alerts and delivery status notifications
                  </Text>
                </View>
                <Switch
                  value={orderAlerts}
                  onValueChange={setOrderAlerts}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={orderAlerts ? colors.primary : '#f4f3f4'}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleTitle}>Book Club & Author Drops</Text>
                  <Text style={styles.toggleSubtitle}>
                    Weekly editorial recommendations and exclusive member sales
                  </Text>
                </View>
                <Switch
                  value={promoAlerts}
                  onValueChange={setPromoAlerts}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={promoAlerts ? colors.primary : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Customer Care & Store Policies */}
            <View style={styles.menuGroup}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/contact')}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name="headset-outline" size={20} color={colors.primary} />
                  <Text style={styles.menuText}>Contact Literary Support</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => router.push('/(tabs)/cart')}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name="bag-handle-outline" size={20} color={colors.primary} />
                  <Text style={styles.menuText}>View Active Cart</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.menuDivider} />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  clearCart();
                  Alert.alert('Done', 'Cart and local caching reset.');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuLeft}>
                  <Ionicons name="trash-bin-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.menuText}>Clear Cart Storage</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Collapsed Shopify API Diagnostics (Accessible for dev/verification, hidden for customer) */}
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.devToggleRow}
                onPress={() => setShowDevInfo(!showDevInfo)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="code-slash-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.devToggleTitle}>Shopify Customer Account API Details</Text>
                </View>
                <Ionicons
                  name={showDevInfo ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {showDevInfo ? (
                <View style={{ marginTop: spacing.md }}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Shopify Store Domain</Text>
                    <Text style={styles.metaValue}>{shopifyDomain}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Customer API Client ID</Text>
                    <Text style={styles.metaValueMono}>{customerClientId.substring(0, 16)}...</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Customer Protocol</Text>
                    <Text style={styles.metaValue}>OAuth 2.0 / GraphQL 2026-07</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Status</Text>
                    <Text style={[styles.metaValue, { color: colors.success }]}>
                      Connected & Ready
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Sign Out Action Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogoutConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
              <Text style={styles.logoutButtonText}>Sign Out of Customer Account</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT DELIVERY ADDRESS                             */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={isAddressModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddressModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAddressId ? 'Edit Address' : 'New Delivery Address'}
              </Text>
              <TouchableOpacity onPress={() => setIsAddressModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Recipient Full Name</Text>
              <TextInput
                style={styles.inputField}
                value={addrName}
                onChangeText={setAddrName}
                placeholder="e.g. Sarah Jenkins"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.inputLabel}>Street Address</Text>
              <TextInput
                style={styles.inputField}
                value={addrStreet}
                onChangeText={setAddrStreet}
                placeholder="e.g. 742 Evergreen Terrace, Apt 4B"
                placeholderTextColor={colors.textMuted}
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.inputField}
                    value={addrCity}
                    onChangeText={setAddrCity}
                    placeholder="Seattle"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.inputLabel}>State / Province</Text>
                  <TextInput
                    style={styles.inputField}
                    value={addrProvince}
                    onChangeText={setAddrProvince}
                    placeholder="WA"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Text style={styles.inputLabel}>Postal / ZIP Code</Text>
                  <TextInput
                    style={styles.inputField}
                    value={addrZip}
                    onChangeText={setAddrZip}
                    placeholder="98101"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.inputLabel}>Contact Phone</Text>
                  <TextInput
                    style={styles.inputField}
                    value={addrPhone}
                    onChangeText={setAddrPhone}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={[styles.toggleRow, { marginTop: spacing.md, paddingVertical: spacing.xs }]}>
                <Text style={styles.toggleTitle}>Set as Default Shipping Address</Text>
                <Switch
                  value={addrIsDefault}
                  onValueChange={setAddrIsDefault}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={addrIsDefault ? colors.primary : '#f4f3f4'}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsAddressModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveAddress}>
                <Text style={styles.modalSaveBtnText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: LIVE ORDER / PARCEL TRACKING                           */}
      {/* ------------------------------------------------------------- */}
      <Modal
        visible={!!trackingOrder}
        animationType="fade"
        transparent
        onRequestClose={() => setTrackingOrder(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Track Parcel</Text>
                <Text style={styles.modalSubtitle}>Order {trackingOrder?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setTrackingOrder(null)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {trackingOrder && (
              <View style={{ marginVertical: spacing.md }}>
                <View style={styles.trackingCarrierBox}>
                  <Ionicons name="cube-outline" size={20} color={colors.primary} />
                  <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                    <Text style={styles.carrierTitle}>Express Book Courier</Text>
                    <Text style={styles.carrierNumber}>
                      Tracking: {trackingOrder.trackingNumber || '1Z9999999999999999'}
                    </Text>
                  </View>
                  <View style={styles.statusPillTransit}>
                    <Text style={styles.statusTextTransit}>
                      {trackingOrder.fulfillmentStatus === 'FULFILLED'
                        ? 'Delivered'
                        : 'On the Way'}
                    </Text>
                  </View>
                </View>

                {/* Timeline Steps */}
                <View style={styles.timelineContainer}>
                  <View style={styles.timelineStep}>
                    <View style={styles.timelineIconActive}>
                      <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text style={styles.timelineTitle}>Order Placed & Confirmed</Text>
                      <Text style={styles.timelineTime}>Payment processed via Shopify</Text>
                    </View>
                  </View>

                  <View style={styles.timelineConnectorActive} />

                  <View style={styles.timelineStep}>
                    <View style={styles.timelineIconActive}>
                      <Ionicons name="checkmark" size={14} color={colors.textInverse} />
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text style={styles.timelineTitle}>Packed at Bookstore Warehouse</Text>
                      <Text style={styles.timelineTime}>Inspected & gift-wrapped with bookmark</Text>
                    </View>
                  </View>

                  <View style={styles.timelineConnectorActive} />

                  <View style={styles.timelineStep}>
                    <View
                      style={
                        trackingOrder.fulfillmentStatus === 'FULFILLED'
                          ? styles.timelineIconActive
                          : styles.timelineIconTransit
                      }
                    >
                      <Ionicons
                        name={
                          trackingOrder.fulfillmentStatus === 'FULFILLED' ? 'checkmark' : 'car'
                        }
                        size={14}
                        color={colors.textInverse}
                      />
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text style={styles.timelineTitle}>In Transit with Courier</Text>
                      <Text style={styles.timelineTime}>Arrived at regional delivery facility</Text>
                    </View>
                  </View>

                  <View
                    style={
                      trackingOrder.fulfillmentStatus === 'FULFILLED'
                        ? styles.timelineConnectorActive
                        : styles.timelineConnectorPending
                    }
                  />

                  <View style={styles.timelineStep}>
                    <View
                      style={
                        trackingOrder.fulfillmentStatus === 'FULFILLED'
                          ? styles.timelineIconActive
                          : styles.timelineIconPending
                      }
                    >
                      <Ionicons
                        name={
                          trackingOrder.fulfillmentStatus === 'FULFILLED'
                            ? 'checkmark'
                            : 'home-outline'
                        }
                        size={14}
                        color={
                          trackingOrder.fulfillmentStatus === 'FULFILLED'
                            ? colors.textInverse
                            : colors.textMuted
                        }
                      />
                    </View>
                    <View style={styles.timelineTextCol}>
                      <Text
                        style={[
                          styles.timelineTitle,
                          trackingOrder.fulfillmentStatus !== 'FULFILLED' && {
                            color: colors.textMuted,
                          },
                        ]}
                      >
                        Delivered to Doorstep
                      </Text>
                      <Text style={styles.timelineTime}>
                        {trackingOrder.estimatedDelivery || 'Estimated Tomorrow by 7:00 PM'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeTrackingBtn}
              onPress={() => setTrackingOrder(null)}
            >
              <Text style={styles.closeTrackingBtnText}>Close</Text>
            </TouchableOpacity>
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
  // Guest / Unauthenticated Hero Styles
  // -------------------------------------------------------------
  guestHeroCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  guestIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  guestTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  guestSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  shopifyLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    width: '100%',
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  shopifyLoginText: {
    ...typography.button,
    color: colors.textInverse,
    marginLeft: spacing.sm,
  },
  demoLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoLoginText: {
    ...typography.button,
    fontSize: 14,
    color: colors.primary,
    marginLeft: spacing.xs,
  },

  perksSectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  perksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  perkCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  perkIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  perkCardTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  perkCardDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // -------------------------------------------------------------
  // Authenticated Customer Header Styles
  // -------------------------------------------------------------
  profileHeaderCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    ...typography.h2,
    color: colors.textInverse,
    fontWeight: '800',
  },
  profileTextCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  profileName: {
    ...typography.h2,
    fontSize: 20,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  tierPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tierPillText: {
    ...typography.caption,
    color: colors.accentDark,
    fontWeight: '700',
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profilePhone: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pointsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pointsTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pointsSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  redeemButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  redeemButtonText: {
    ...typography.button,
    fontSize: 12,
    color: colors.textInverse,
  },

  // -------------------------------------------------------------
  // Segmented Tabs
  // -------------------------------------------------------------
  segmentedTabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
  },
  segmentTabActive: {
    backgroundColor: colors.card,
    ...shadows.subtle,
  },
  segmentTabText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 4,
    fontWeight: '600',
  },
  segmentTabTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  tabContentContainer: {
    marginBottom: spacing.lg,
  },

  // -------------------------------------------------------------
  // Orders Tab Styles
  // -------------------------------------------------------------
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  orderNumberText: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  orderDateText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  orderRightHeader: {
    alignItems: 'flex-end',
  },
  orderTotalText: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.primary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.xs,
    marginTop: 4,
  },
  statusPillSuccess: {
    backgroundColor: colors.successLight,
  },
  statusPillTransit: {
    backgroundColor: '#DBEAFE',
  },
  statusPillPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    ...typography.caption,
    fontWeight: '700',
    marginLeft: 4,
    fontSize: 10,
  },
  statusTextSuccess: {
    color: colors.success,
  },
  statusTextTransit: {
    color: '#1E40AF',
  },
  statusTextPending: {
    color: colors.accentDark,
  },
  orderLineItemsWrapper: {
    marginBottom: spacing.sm,
  },
  orderLineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  orderBookThumb: {
    width: 36,
    height: 50,
    borderRadius: radii.xs,
    backgroundColor: colors.surface,
  },
  orderBookPlaceholder: {
    width: 36,
    height: 50,
    borderRadius: radii.xs,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderLineItemInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  orderLineItemTitle: {
    ...typography.subtitle,
    fontSize: 13,
    color: colors.textPrimary,
  },
  orderLineItemSub: {
    ...typography.caption,
    color: colors.textMuted,
  },
  orderActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trackButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
  },
  reorderButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textInverse,
    marginLeft: 4,
  },

  // -------------------------------------------------------------
  // Addresses Tab Styles
  // -------------------------------------------------------------
  tabSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tabSectionTitle: {
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
  addressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressRecipientName: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  defaultAddressBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
  },
  defaultAddressBadgeText: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.textInverse,
  },
  editAddressIconBtn: {
    padding: 4,
  },
  addressStreetText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  addressCityZipText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  addressCountryText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  addressPhoneText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  addressCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  setDefaultBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  setDefaultBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  deleteAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteAddressBtnText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
    marginLeft: 4,
  },

  // -------------------------------------------------------------
  // Wishlist Tab Styles
  // -------------------------------------------------------------
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
  wishlistCoverImage: {
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
  wishlistVendor: {
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

  // -------------------------------------------------------------
  // Settings Tab & Section Styles
  // -------------------------------------------------------------
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeaderTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  toggleTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  toggleSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xs,
  },
  menuGroup: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.subtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    ...typography.subtitle,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  devToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devToggleTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaValue: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  metaValueMono: {
    ...typography.caption,
    fontFamily: 'monospace',
    color: colors.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorLight,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: spacing.xs,
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.error,
    marginLeft: spacing.xs,
  },

  // -------------------------------------------------------------
  // Empty State Styles
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Modals Styles
  // -------------------------------------------------------------
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
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
  inputRow: {
    flexDirection: 'row',
  },
  modalFooterRow: {
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
  },
  modalSaveBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },

  // Tracking Timeline Styles
  trackingCarrierBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  carrierTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  carrierNumber: {
    ...typography.caption,
    color: colors.textMuted,
  },
  timelineContainer: {
    paddingLeft: spacing.xs,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIconActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconTransit: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconPending: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineConnectorActive: {
    width: 2,
    height: 24,
    backgroundColor: colors.primary,
    marginLeft: 12,
  },
  timelineConnectorPending: {
    width: 2,
    height: 24,
    backgroundColor: colors.border,
    marginLeft: 12,
  },
  timelineTextCol: {
    marginLeft: spacing.md,
    flex: 1,
  },
  timelineTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    fontSize: 14,
    color: colors.textPrimary,
  },
  timelineTime: {
    ...typography.caption,
    color: colors.textMuted,
  },
  closeTrackingBtn: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeTrackingBtnText: {
    ...typography.button,
    color: colors.textPrimary,
  },
});
