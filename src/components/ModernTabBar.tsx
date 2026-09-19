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

const CIRCLE_SIZE = 60;
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
const FILLET_SIZE = 16;
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
      tension: 55,
      friction: 8.5,
    }).start();

    // 2. Animate each tab's icon lift and text fade
    TABS.forEach((_, i) => {
      Animated.spring(tabAnims[i], {
        toValue: state.index === i ? 1 : 0,
        useNativeDriver: useNative,
        tension: 55,
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

  const safeBottom = Math.max(insets.bottom, 0);

  return (
    <View style={styles.rootContainer}>
      <View
        style={[
          styles.barOuter,
          { height: BAR_HEIGHT + safeBottom, paddingBottom: safeBottom },
        ]}
        onLayout={onBarLayout}
      >
        {/* The Single Sliding Indicator with Organic Curved Shoulders */}
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
          {/* Left Smooth Curved Fillet */}
          <View
            style={[
              styles.leftFillet,
              {
                left: tabWidth / 2 - CIRCLE_RADIUS - FILLET_SIZE + 0.5,
              },
            ]}
          />

          {/* Main Floating Center Circle */}
          <View
            style={[
              styles.indicatorCircle,
              {
                left: tabWidth / 2 - CIRCLE_RADIUS,
              },
            ]}
          />

          {/* Right Smooth Curved Fillet */}
          <View
            style={[
              styles.rightFillet,
              {
                left: tabWidth / 2 + CIRCLE_RADIUS - 0.5,
              },
            ]}
          />
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

            // Active icon lifts up into the elevated circle
            const iconTranslateY = tabAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, -28],
            });

            // Text label slides smoothly into position inside the bar
            const textTranslateY = tabAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
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
                {/* Icon Container with lift */}
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

                {/* Text Label sliding up */}
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
    backgroundColor: colors.card,
  },
  barOuter: {
    backgroundColor: colors.card,
    position: 'relative',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  slidingIndicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: BAR_HEIGHT,
    zIndex: 1,
  },
  leftFillet: {
    position: 'absolute',
    top: -FILLET_SIZE + 0.5,
    width: FILLET_SIZE,
    height: FILLET_SIZE,
    backgroundColor: colors.card,
    borderTopLeftRadius: FILLET_SIZE,
  },
  rightFillet: {
    position: 'absolute',
    top: -FILLET_SIZE + 0.5,
    width: FILLET_SIZE,
    height: FILLET_SIZE,
    backgroundColor: colors.card,
    borderTopRightRadius: FILLET_SIZE,
  },
  indicatorCircle: {
    position: 'absolute',
    top: -24,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
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
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    ...typography.caption,
    position: 'absolute',
    top: 42,
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
