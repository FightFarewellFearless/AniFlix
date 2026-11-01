import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { FlatList } from 'react-native';

/**
 * Web fallback for `@shopify/flash-list`.
 *
 * FlashList is built on top of the native Android `RecyclerView` and needs
 * native layout measurement, so it renders nothing at all in a browser
 * (react-native-web / Electron renderer).
 *
 * `FlatList` from react-native-web is a complete implementation with the same
 * public API surface, so every prop that both libraries understand is simply
 * forwarded. The FlashList-only props are dropped because they have no
 * meaning without the native recycler.
 */

export type ListRenderItemInfo<T> = {
  item: T;
  index: number;
  extraData?: any;
  target?: any;
  separators?: {
    highlight: () => void;
    unhighlight: () => void;
    updateProps: (select: 'leading' | 'trailing', newProps: any) => void;
  };
};

export type ListRenderItem<T> = (info: ListRenderItemInfo<T>) => React.ReactElement | null;

export type FlashListRef<T = any> = {
  scrollToOffset: (params: { offset: number; animated?: boolean }) => void;
  scrollToIndex: (params: {
    index: number;
    animated?: boolean;
    viewPosition?: number;
    viewOffset?: number;
  }) => void;
  scrollToEnd: (params?: { animated?: boolean }) => void;
  scrollToItem: (params: {
    item: T;
    animated?: boolean;
    viewPosition?: number;
    viewOffset?: number;
  }) => void;
  getScrollableNode: () => any;
  measure: (callback: (...args: any[]) => void) => void;
  flash: (config?: any) => void;
};

type FlashListProps<T = any> = {
  data?: ReadonlyArray<T> | null;
  renderItem: ListRenderItem<T>;
  keyExtractor?: (item: T, index: number) => string;
  estimatedItemSize?: number;
  getItemType?: (item: T, index: number) => string | number | undefined;
  drawDistance?: number;
  overrideItemLayout?: (layout: any, item: T, index: number) => void;
  maintainVisibleContentPosition?: any;
  CellRendererComponent?: any;
  onEndReachedThreshold?: number | null;
  [key: string]: any;
};

function FlashListComponent<T = any>(
  {
    estimatedItemSize: _estimatedItemSize,
    getItemType: _getItemType,
    drawDistance: _drawDistance,
    overrideItemLayout: _overrideItemLayout,
    maintainVisibleContentPosition: _maintainVisibleContentPosition,
    CellRendererComponent: _CellRendererComponent,
    ...props
  }: FlashListProps<T>,
  ref: React.Ref<FlashListRef<T>>,
) {
  return <FlatList ref={ref as any} {...(props as any)} />;
}

export const FlashList = forwardRef(FlashListComponent) as unknown as (<T = any>(
  props: FlashListProps<T> & { ref?: React.Ref<FlashListRef<T>> },
) => React.ReactElement);

/**
 * FlashList uses this to build stable keys for manually mapped children.
 * Without the native recycler a plain deterministic key is enough.
 */
export function useMappingHelper(): {
  getMappingKey: (itemKey: string | number | bigint, index: number) => string | number | bigint;
} {
  const getMappingKey = useCallback(
    (itemKey: string | number | bigint, index: number) => `${String(itemKey)}-${index}`,
    [],
  );
  return { getMappingKey };
}

/**
 * FlashList resets the state of a row when its cell is recycled. `FlatList`
 * does not recycle cells, but a row can still be reused when its data changes
 * without the key changing, so the same reset semantics are kept.
 */
export function useRecyclingState<T>(
  initialState: T | (() => T),
  deps: React.DependencyList,
  onReset?: () => void,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialState);
  const previousDepsRef = useRef<React.DependencyList>(deps);

  useEffect(() => {
    const previous = previousDepsRef.current;
    const changed =
      previous.length !== deps.length ||
      previous.some((value, index) => !Object.is(value, deps[index]));
    if (!changed) {
      return;
    }
    previousDepsRef.current = deps;
    setState(
      typeof initialState === 'function' ? (initialState as () => T)() : initialState,
    );
    onReset?.();
    // The dependency list is provided by the caller on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [state, setState];
}

export default FlashList;
