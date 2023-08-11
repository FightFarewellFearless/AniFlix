import { StyleSheet } from 'react-native';
import colorScheme from '../utils/colorScheme';

export const darkText = '#dadada';
export const lightText = '#0f0f0f';
const globalStyles = StyleSheet.create({
  text: {
    color: colorScheme === 'dark' ? darkText : lightText,
  },
});
export default globalStyles;
