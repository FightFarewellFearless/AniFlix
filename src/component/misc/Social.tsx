import useGlobalStyles from '@assets/style';
import Icon from '@react-native-vector-icons/fontawesome';
import { Fontisto } from '@react-native-vector-icons/fontisto';
import React, { useMemo } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  ViewStyle,
} from 'react-native';

function useStyles() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return useMemo(
    () =>
      StyleSheet.create({
        socialButton: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: isDark ? '#252525' : '#e0e0e0',
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20,
          marginHorizontal: 8,
        },
        socialButtonText: {
          fontSize: 14,
          fontWeight: '500',
          color: isDark ? '#e0e0e0' : '#333',
          marginLeft: 8,
        },
      }),
    [isDark],
  );
}

export const JoinDiscord = ({
  buttonColor,
  size = 24,
  style,
}: {
  buttonColor?: string;
  size?: number;
  style?: ViewStyle;
}) => {
  const styles = useStyles();
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL('https://discord.gg/sbTwxHb9NM')}
      style={[styles.socialButton, buttonColor ? { backgroundColor: buttonColor } : {}, style]}>
      <Fontisto name="discord" size={size} color={'#7289d9'} />
      <Text style={styles.socialButtonText}>Join Discord</Text>
    </TouchableOpacity>
  );
};

export const Github = ({
  buttonColor,
  size = 24,
  style,
}: {
  buttonColor?: string;
  size?: number;
  style?: ViewStyle;
}) => {
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL('https://github.com/FightFarewellFearless/AniFlix')}
      style={[styles.socialButton, buttonColor ? { backgroundColor: buttonColor } : {}, style]}>
      <Icon name="github" size={size} color={globalStyles.text.color} />
      <Text style={styles.socialButtonText}>GitHub</Text>
    </TouchableOpacity>
  );
};
