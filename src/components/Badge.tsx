import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography, radii, spacing } from '../theme/typography';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'accent' | 'success' | 'outline' | 'surface';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'surface',
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary };
      case 'accent':
        return { backgroundColor: colors.accentMuted };
      case 'success':
        return { backgroundColor: colors.successLight };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'surface':
      default:
        return { backgroundColor: colors.surface };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return { color: colors.textInverse };
      case 'accent':
        return { color: colors.accentDark };
      case 'success':
        return { color: colors.success };
      case 'outline':
        return { color: colors.textSecondary };
      case 'surface':
      default:
        return { color: colors.textSecondary };
    }
  };

  return (
    <View style={[styles.container, getContainerStyle(), style]}>
      <Text style={[styles.text, getTextStyle(), textStyle]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
