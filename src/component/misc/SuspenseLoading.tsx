import { Suspense } from 'react';
import { ActivityIndicator } from 'react-native';

function Loading() {
  return (
    <ActivityIndicator
      style={{ flex: 1, justifyContent: 'center', alignSelf: 'center' }}
      size="large"
    />
  );
}

export default function SuspenseLoading({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}
