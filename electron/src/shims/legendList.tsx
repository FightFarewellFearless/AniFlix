import React, { forwardRef } from 'react';
import { FlatList } from 'react-native';

/**
 * Web fallback for `@legendapp/list`.
 *
 * LegendList is a RecyclerView based list (it renders its items through the
 * native `LegendRecyclerView`), so it cannot render inside the Electron
 * renderer. react-native-web's `FlatList` provides the same API and works
 * with plain DOM, so we forward every shared prop and drop the LegendList
 * only ones.
 */

export type LegendListRef<T = any> = {
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
};

type LegendListProps<T = any> = {
  data?: ReadonlyArray<T> | null;
  renderItem: (info: { item: T; index: number; extraData?: any; target?: any }) => React.ReactElement | null;
  keyExtractor?: (item: T, index: number) => string;
  estimatedItemSize?: number;
  recycleItems?: boolean;
  [key: string]: any;
};

function LegendListComponent<T = any>(
  {
    estimatedItemSize: _estimatedItemSize,
    recycleItems: _recycleItems,
    ...props
  }: LegendListProps<T>,
  ref: React.Ref<LegendListRef<T>>,
) {
  return <FlatList ref={ref as any} {...(props as any)} />;
}

export const LegendList = forwardRef(LegendListComponent) as unknown as (<T = any>(
  props: LegendListProps<T> & { ref?: React.Ref<LegendListRef<T>> },
) => React.ReactElement);

export default LegendList;
