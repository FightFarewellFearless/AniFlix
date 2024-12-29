import { View } from "react-native";

export default function DarkOverlay({ transparent = 0.451 } : { transparent?: number }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: `rgba(0, 0, 0, ${transparent})`,
        position: 'absolute',
        width: '100%',
        height: '100%',
      }}
    />
  );
}