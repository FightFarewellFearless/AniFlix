import MaterialIcon from '@react-native-vector-icons/material-icons';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { TouchableOpacity } from '@component/misc/TouchableOpacityRNGH';

interface HomeShowCaptchaButtonProps {
  callback: () => void;
}

export function Home_ShowCaptchaButton({ callback }: HomeShowCaptchaButtonProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={callback}>
      <MaterialIcon name="warning-amber" size={20} color="#B45309" />
      <Text style={styles.text}>
        Halaman terlindungi captcha, ketuk di sini untuk bypass manual!
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
    color: '#92400E',
    marginLeft: 8,
    flexShrink: 1,
  },
});
