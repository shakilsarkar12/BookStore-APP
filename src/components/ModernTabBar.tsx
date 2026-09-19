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
const WING_SIZE = 20; // radius of the rounded shoulder next to the circle
const BAR_HEIGHT = 70;

// Horizontal distance from the circle center to the shoulder's curve center,
// so the shoulder touches the circle's ring exactly.
const WING_OFFSET = Math.sqrt(
  (CIRCLE_RADIUS + WING_SIZE) * (CIRCLE_RADIUS + WING_SIZE) -
  WING_SIZE * WING_SIZE
);

export type ModernTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

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

    // 1. Slide the indicator horizontally
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
        {/* Sliding indicator: left shoulder + right shoulder + circle */}
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
          {/* Left shoulder */}
          <View
            style={[styles.wing, { left: tabWidth / 2 - WING_OFFSET }]}
          >
            <View style={styles.leftWingDisc} />
          </View>

          {/* Right shoulder */}
          <View
            style={[
              styles.wing,
              { left: tabWidth / 2 + WING_OFFSET - WING_SIZE },
            ]}
          >
            <View style={styles.rightWingDisc} />
          </View>

          {/* Floating circle (drawn last so it sits on top) */}
          <View
            style={[
              styles.indicatorCircle,
              { left: tabWidth / 2 - CIRCLE_RADIUS },
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

            // Lift the active icon to the exact center of the circle
            const iconTranslateY = tabAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [0, -BAR_HEIGHT / 2],
            });

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
                <Animated.View
                  style={[
                    styles.iconWrapper,
                    { transform: [{ translateY: iconTranslateY }] },
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
  // Extra space on top holds the upper half of the circle,
  // so it never covers the screen content.
  rootContainer: {
    backgroundColor: colors.background,
    paddingTop: CIRCLE_RADIUS,
  },
  barOuter: {
    backgroundColor: colors.card,
    position: 'relative',
  },
  slidingIndicatorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: BAR_HEIGHT,
    zIndex: 1,
  },
  // Square filled with screen color; a bar-colored disc is cut into its
  // bottom corner, which leaves a rounded shoulder on the bar.
  wing: {
    position: 'absolute',
    top: 0,
    width: WING_SIZE,
    height: WING_SIZE,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  leftWingDisc: {
    position: 'absolute',
    top: 0,
    left: -WING_SIZE,
    width: WING_SIZE * 2,
    height: WING_SIZE * 2,
    borderRadius: WING_SIZE,
    backgroundColor: colors.card,
  },
  rightWingDisc: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WING_SIZE * 2,
    height: WING_SIZE * 2,
    borderRadius: WING_SIZE,
    backgroundColor: colors.card,
  },
  indicatorCircle: {
    position: 'absolute',
    top: -CIRCLE_RADIUS,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_RADIUS,
    backgroundColor: colors.card,
    borderWidth: BORDER_WIDTH,
    borderColor: colors.background,
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