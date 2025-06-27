import {
  createNativeBottomTabNavigator,
  NativeBottomTabNavigationOptions,
} from '@bottom-tabs/react-navigation';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { lazy, memo, startTransition, useCallback, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { AvoidSoftInput } from 'react-native-avoid-softinput';
import { EpisodeBaruHomeContext } from '../../misc/context';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import SuspenseLoading from '../misc/SuspenseLoading';

const EpisodeBaruHome = lazy(() => import('./AnimeList'));
const Search = lazy(() => import('./Search'));
const Utils = lazy(() => import('./Utils'));
const Saya = lazy(() => import('./Saya'));

type Props = NativeStackScreenProps<RootStackNavigator, 'Home'>;
const Tab = createNativeBottomTabNavigator<HomeNavigator>();

const withSuspense = (Component: React.ComponentType<any>) => (props: any) => (
  <SuspenseLoading>
    <Component {...props} />
  </SuspenseLoading>
);

const tabScreens: {
  name: keyof HomeNavigator;
  component: (props: any) => React.JSX.Element;
  options: NativeBottomTabNavigationOptions;
}[] = [
  {
    name: 'AnimeList',
    component: withSuspense(EpisodeBaruHome),
    options: {
      tabBarIcon: () => require('../../assets/icons/home.svg'),
      tabBarLabel: 'Beranda',
    },
  },
  {
    name: 'Search',
    component: withSuspense(Search),
    options: {
      tabBarIcon: () => require('../../assets/icons/search.svg'),
      tabBarLabel: 'Pencarian',
    },
  },
  {
    name: 'Saya',
    component: withSuspense(Saya),
    options: {
      tabBarIcon: () => require('../../assets/icons/user.svg'),
      tabBarLabel: 'Saya',
    },
  },
  {
    name: 'Utilitas',
    component: withSuspense(Utils),
    options: {
      tabBarIcon: () => require('../../assets/icons/tools.svg'),
    },
  },
];

function BottomTabs(props: Props) {
  const { setParamsState: setAnimeData } = useContext(EpisodeBaruHomeContext);
  const colorScheme = useColorScheme();
  useEffect(() => {
    startTransition(() => {
      setAnimeData?.(props.route.params.data);
    });
  }, [props.route.params.data, setAnimeData]);
  useFocusEffect(
    useCallback(() => {
      AvoidSoftInput.setAdjustPan();
      return () => {
        AvoidSoftInput.setAdjustResize();
      };
    }, []),
  );
  return (
    <Tab.Navigator
      tabBarStyle={{
        backgroundColor: colorScheme === 'dark' ? '#181818' : '#fff',
      }}
      activeIndicatorColor={colorScheme === 'dark' ? '#525252' : '#d8d8d8'}
      screenOptions={{
        freezeOnBlur: true,
        tabBarActiveTintColor: colorScheme === 'dark' ? '#007bff' : '#0056b3',
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
