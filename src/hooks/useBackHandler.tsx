import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export function useBackHandler(handler: () => boolean) {
  useEffect(() => {
    const event = BackHandler.addEventListener('hardwareBackPress', handler);

    return () => {
      event.remove();
    };
  }, [handler]);
}
