import SafeAreaWrapper from '@component/misc/SafeAreaWrapper';
import SuspenseLoading from '@component/misc/SuspenseLoading';
import React from 'react';

export const withSuspenseAndSafeArea = (
  Component: React.ComponentType<any>,
  safeArea = true,
  ignoreTop = false,
  ignoreBottom = false,
) => {
  const SuspenseComponent = (props: any) => (
    <SuspenseLoading>
      <Component {...props} />
    </SuspenseLoading>
  );
  return (props: any) =>
    safeArea ? (
      <SafeAreaWrapper ignoreTop={ignoreTop} ignoreBottom={ignoreBottom}>
        {<SuspenseComponent {...props} />}
      </SafeAreaWrapper>
    ) : (
      <SuspenseComponent {...props} />
    );
};
