import { Suspense } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import useGlobalStyles from '../../assets/style';

function Loading() {
  const globalStyles = useGlobalStyles();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={globalStyles.text}>Loading bundle...</Text>
    </View>
  );
}

export default function SuspenseLoading({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}
