// NavigationService.ts
import {
  CommonActions,
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';
import type { RootStackNavigator } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackNavigator>();

export function navigate<RouteName extends keyof RootStackNavigator>(
  name: RouteName,
  params?: RootStackNavigator[RouteName],
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.navigate(name, params));
  }
}

export function push<RouteName extends keyof RootStackNavigator>(
  name: RouteName,
  params?: RootStackNavigator[RouteName],
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.push(name, params));
  }
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function replaceAllWith<RouteName extends keyof RootStackNavigator>(
  name: RouteName,
  params?: RootStackNavigator[RouteName],
) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name, params }],
      }),
    );
  }
}
