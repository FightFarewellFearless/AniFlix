import { useEffect, useState } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

export const darkText = '#dadada';
export const lightText = '#0f0f0f';
export default function useGlobalStyles() {
  const colorScheme = useColorScheme();
  const [stylesState, setStylesState] = useState(() => ({
    text: {
      color: colorScheme === 'dark' ? darkText : lightText,
    },
  }));
  useEffect(() => {
    const styles = StyleSheet.create({
      text: {
        color: colorScheme === 'dark' ? darkText : lightText,
      },
    });
    setStylesState(styles);
  }, [colorScheme]);
  return stylesState;
}
