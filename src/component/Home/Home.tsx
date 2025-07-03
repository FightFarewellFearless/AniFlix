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
import { withSuspenseAndSafeArea } from '../../../App';
import { EpisodeBaruHomeContext } from '../../misc/context';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';

const EpisodeBaruHome = lazy(() => import('./AnimeList'));
const Search = lazy(() => import('./Search'));
const Utils = lazy(() => import('./Utils'));
const Saya = lazy(() => import('./Saya'));

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
      tabBarIcon: () => require('../../assets/icons/home.svg'),
      tabBarLabel: 'Beranda',
    },
  },
  {
    name: 'Search',
    component: withSuspenseAndSafeArea(Search, true, false, true),
    options: {
      tabBarIcon: () => require('../../assets/icons/search.svg'),
      tabBarLabel: 'Pencarian',
    },
  },
  {
    name: 'Saya',
    component: withSuspenseAndSafeArea(Saya, false),
    options: {
      tabBarIcon: () => require('../../assets/icons/user.svg'),
      tabBarLabel: 'Saya',
    },
  },
  {
    name: 'Utilitas',
    component: withSuspenseAndSafeArea(Utils, false),
    options: {
      tabBarIcon: () => require('../../assets/icons/tools.svg'),
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
      KeyboardController.setDefaultMode();
      return () => {
        KeyboardController.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE);
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
