import { StyleSheet } from 'react-native';
import { PressableProps, Pressable } from 'react-native-gesture-handler';

export function TouchableOpacity(props: PressableProps): ReturnType<typeof Pressable> {
  const style = props.style ?? {};
  return (
    <Pressable
      {...props}
      style={({ pressed }) => ({
        opacity: pressed ? 0.5 : 1,
        ...(typeof style === 'object' ? StyleSheet.flatten(style) : {}),
      })}
    />
  );
}
