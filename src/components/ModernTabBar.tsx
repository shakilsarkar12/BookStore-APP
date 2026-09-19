import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Tabs } from 'expo-router';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useCartStore } from '../store/useCartStore';

interface TabConfig {
  name: string;
  label: string;
  iconFilled: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  {
    name: 'index',
    label: 'Home',
    iconFilled: 'home',
    iconOutline: 'home-outline',
  },
  {
    name: 'collections',
    label: 'Catalog',
    iconFilled: 'grid',
    iconOutline: 'grid-outline',
  },
  {
    name: 'cart',
    label: 'Cart',
    iconFilled: 'bag-handle',
    iconOutline: 'bag-handle-outline',
  },
  {
    name: 'profile',
    label: 'Account',
    iconFilled: 'person',
    iconOutline: 'person-outline',
  },
];

const CIRCLE_SIZE = 62;
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
const BORDER_WIDTH = 6;
const WING_SIZE = 20;
const BAR_HEIGHT = 70;

export type ModernTabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>
>[0];

export const ModernTabBar: React.FC<ModernTabBarProps> = ({
  state,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const totalCartItems = useCartStore((s) => s.getTotalItems());
  const [barWidth, setBarWidth] = useState<number>(
    Dimensions.get('window').width
  );

  const tabWidth = barWidth / TABS.length;

  // Single sliding indicator tracking the active tab position
  const indicatorAnim = useRef(new Animated.Value(state.index)).current;

  // Individual animation values for each tab item (lift icon & fade text)
  const tabAnims = useRef(
    TABS.map((_, i) => new Animated.Value(state.index === i ? 1 : 0))
  ).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';

    // 1. Slide the indicator circle horizontally
    Animated.spring(indicatorAnim, {
      toValue: state.index,
      useNativeDriver: useNative,
      tension: 52,
      friction: 8.5,
    }).start();

    // 2. Animate each tab's icon lift and text fade
    TABS.forEach((_, i) => {
      Animated.spring(tabAnims[i], {
        toValue: state.index === i ? 1 : 0,
        useNativeDriver: useNative,
        tension: 52,
        friction: 8.5,
      }).start();
    });
  }, [state.index, indicatorAnim, tabAnims]);

  const onBarLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== barWidth) {
      setBarWidth(width);
    }
  };

  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: TABS.map((_, i) => i),
    outputRange: TABS.map((_, i) => i * tabWidth),
  });

  const bottomPadding =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 10 : 8;

  return (
    <View style={[styles.rootContainer, { paddingBottom: bottomPadding }]}>
      <View style={styles.barOuter} onLayout={onBarLayout}>
        {/* The Single Sliding Indicator with Inverted Wings (Exact match to Modern-Navigation) */}
        <Animated.View
          style={[
            styles.slidingIndicatorContainer,
            {
              width: tabWidth,
              transform: [{ translateX: indicatorTranslateX }],
              pointerEvents: 'none',
            },
          ]}
        >
          {/* Left Concave Wing (replicates .indicator::before) */}
          <View
            style={[
              styles.wingBase,
              {
                left: tabWidth / 2 - CIRCLE_RADIUS - WING_SIZE + 1,
              },
            ]}
          >
            <View style={styles.leftWingCutout} />
          </View>

          {/* Floating Center Circle (replicates .indicator) */}
          <View
            style={[
              styles.indicatorCircle,
              {
                left: tabWidth / 2 - CIRCLE_RADIUS,
              },
            ]}
          />

          {/* Right Concave Wing (replicates .indicator::after) */}
          <View
            style={[
              styles.wingBase,
              {
                left: tabWidth / 2 + CIRCLE_RADIUS - 1,
              },
            ]}
          >
            <View style={styles.rightWingCutout} />
          </View>
        </Animated.View>

        {/* Tab Items Row */}
        <View style={styles.tabsRow}>
          {TABS.map((tab, index) => {
            const isFocused = state.index === index;
            const route = state.routes[index];

            const handlePress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            // EXACT CSS MATCH:
            // .navigation ul li.active a .icon { transform: translateY(-32px); }
            const iconTranslateY = tabAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, -32],
            });

            // EXACT CSS MATCH:
            // .navigation ul li a .text { transform: translateY(20px); opacity: 0; }
            // .navigation ul li.active a .text { transform: translateY(10px); opacity: 1; }
            const textTranslateY = tabAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [20, 10],
            });

            const textOpacity = tabAnims[index].interpolate({
              inputRange: [0, 0.4, 1],
              outputRange: [0, 0, 1],
            });

            const isCart = tab.name === 'cart';

            return (
              <TouchableOpacity
                key={tab.name}
                style={[styles.tabButton, { width: tabWidth }]}
                onPress={handlePress}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={tab.label}
              >
                {/* Icon Container with translateY(-32px) lift */}
                <Animated.View
                  style={[
                    styles.iconWrapper,
                    {
                      transform: [{ translateY: iconTranslateY }],
                    },
                  ]}
                >
                  <Ionicons
                    name={isFocused ? tab.iconFilled : tab.iconOutline}
                    size={24}
                    color={isFocused ? colors.primary : colors.textMuted}
                  />

                  {/* Cart badge */}
                  {isCart && totalCartItems > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {totalCartItems > 99 ? '99+' : totalCartItems}
                      </Text>
                    </View>
                  ) : null}
                </Animated.View>

                {/* Text Label sliding up to translateY(10px) with opacity 1 */}
                <Animated.Text
                  style={[
                    styles.tabText,
                    {
                      opacity: textOpacity,
                      transform: [{ translateY: textTranslateY }],
                    },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Animated.Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    backgroundColor: colors.background, // Matches the screen background
  },
  barOuter: {
    height: BAR_HEIGHT,
    backgroundColor: colors.card, // White bar (or main-color)
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  slidingIndicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: BAR_HEIGHT,
    zIndex: 1,
  },
  indicatorCircle: {
    position: 'absolute',
    top: -CIRCLE_RADIUS, // -31px: exactly top: -50% in CSS!
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,
    backgroundColor: colors.card, // Matches bar background
    borderWidth: BORDER_WIDTH,
    borderColor: colors.background, // Exactly border: 6px solid var(--color) in CSS!
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  wingBase: {
    position: 'absolute',
    top: 0,
    width: WING_SIZE,
    height: WING_SIZE,
    backgroundColor: colors.card, // Base is bar color
    overflow: 'hidden',
  },
  leftWingCutout: {
    width: WING_SIZE,
    height: WING_SIZE,
    backgroundColor: colors.background, // Cuts out into screen background
    borderBottomRightRadius: WING_SIZE,
  },
  rightWingCutout: {
    width: WING_SIZE,
    height: WING_SIZE,
    backgroundColor: colors.background, // Cuts out into screen background
    borderBottomLeftRadius: WING_SIZE,
  },
  tabsRow: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    alignItems: 'center',
    zIndex: 2,
  },
  tabButton: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    ...typography.caption,
    position: 'absolute',
    bottom: 12,
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -2,
    backgroundColor: colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
});
