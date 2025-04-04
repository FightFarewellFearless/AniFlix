import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import store, { RootState } from '../misc/reduxStore';

function useSelectorIfFocused(
  selector: (state: RootState) => string,
  fetchOnFocus?: boolean,
): string;
function useSelectorIfFocused<T = string>(
  selector: (state: RootState) => string,
  fetchOnFocus?: boolean,
  modifierFunc?: (result: string) => T,
): T;
function useSelectorIfFocused<T = string>(
  selector: (state: RootState) => string,
  fetchOnFocus?: boolean,
  modifierFunc?: (result: string) => T,
) {
  const lastValue = useRef<string>();
  const [data, setData] = useState<T | string>(
    modifierFunc ? modifierFunc(selector(store.getState())) : selector(store.getState()),
  );
  const fetchData = () => {
    const stateNow = selector(store.getState());
    if (lastValue.current !== stateNow) {
      let result: T | string;
      if (modifierFunc) {
        result = modifierFunc(stateNow);
      } else {
        result = stateNow;
      }
      setData(result);
    }
    lastValue.current = stateNow;
  };
  useFocusEffect(
    useCallback(() => {
      if (fetchOnFocus === true) {
        fetchData();
      }
      const unsubscribe = store.subscribe(fetchData);
      return () => {
        unsubscribe();
      };
      // eslint-disable-next-line react-compiler/react-compiler
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );
  return data;
}

export default useSelectorIfFocused;
