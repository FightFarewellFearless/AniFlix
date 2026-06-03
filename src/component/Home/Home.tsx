import { withSuspenseAndSafeArea } from '@/misc/withSuspenseAndSafeArea';
import {
  createNativeBottomTabNavigator,
  NativeBottomTabNavigationOptions,
} from '@bottom-tabs/react-navigation';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { lazy, memo, startTransition, useCallback, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { AndroidSoftInputModes, KeyboardController } from 'react-native-keyboard-controller';
import { useTheme } from 'react-native-paper';
import { EpisodeBaruHomeContext } from '../../misc/context';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';

let EpisodeBaruHome: React.ComponentType<any>;
let Search: React.ComponentType<any>;
let Utils: React.ComponentType<any>;
let Saya: React.ComponentType<any>;

if (__DEV__) {
  EpisodeBaruHome = require('./AnimeList').default;
  Search = require('./Search').default;
  Utils = require('./Utils').default;
  Saya = require('./Saya').default;
} else {
  EpisodeBaruHome = lazy(() => import('./AnimeList'));
  Search = lazy(() => import('./Search'));
  Utils = lazy(() => import('./Utils'));
  Saya = lazy(() => import('./Saya'));
}

type Props = NativeStackScreenProps<RootStackNavigator, 'Home'>;
const Tab = createNativeBottomTabNavigator<HomeNavigator>();

const tabScreens: {
  name: keyof HomeNavigator;
  component: (props: any) => React.JSX.Element;
  options: NativeBottomTabNavigationOptions;
}[] = [
  {
    name: 'AnimeList',
    component: withSuspenseAndSafeArea(EpisodeBaruHome, false),
    options: {
      tabBarIcon: () => require('../../assets/icons/home-icon.png'),
      tabBarLabel: 'Beranda',
    },
  },
  {
    name: 'Search',
    component: withSuspenseAndSafeArea(Search, true, false, true),
    options: {
      tabBarIcon: () => require('../../assets/icons/search-icon.png'),
      tabBarLabel: 'Pencarian',
    },
  },
  {
    name: 'Saya',
    component: withSuspenseAndSafeArea(Saya, false),
    options: {
      tabBarIcon: () => require('../../assets/icons/order-history-icon.png'),
      tabBarLabel: 'Saya',
    },
  },
  {
    name: 'Utilitas',
    component: withSuspenseAndSafeArea(Utils, false),
    options: {
      tabBarIcon: () => require('../../assets/icons/administrator-developer-icon.png'),
    },
  },
];

function BottomTabs(props: Props) {
  const { setParamsState: setAnimeData } = useContext(EpisodeBaruHomeContext);
  const colorScheme = useColorScheme();
  const theme = useTheme();
  useEffect(() => {
    startTransition(() => {
      setAnimeData?.(props.route.params.data);
    });
  }, [props.route.params.data, setAnimeData]);
  useFocusEffect(
    useCallback(() => {
      KeyboardController.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_PAN);
      return () => {
        KeyboardController.setDefaultMode();
      };
    }, []),
  );
  return (
    <Tab.Navigator
      tabBarStyle={{
        backgroundColor: colorScheme === 'dark' ? '#181818' : '#f0f0f0',
      }}
      activeIndicatorColor={colorScheme === 'dark' ? '#525252' : '#d8d8d8'}
      screenOptions={{
        freezeOnBlur: true,
        tabBarActiveTintColor: theme.colors.primary,
      }}>
      {tabScreens.map(({ name, component: Component, options }) => (
        <Tab.Screen key={name} name={name} options={options}>
          {Component}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}

export default memo(BottomTabs);
