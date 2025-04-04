import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { lazy, memo, startTransition, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon5 from 'react-native-vector-icons/FontAwesome5';
import { EpisodeBaruHomeContext } from '../../misc/context';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import SuspenseLoading from '../misc/SuspenseLoading';

const EpisodeBaruHome = lazy(() => import('./AnimeList'));
const Search = lazy(() => import('./Search'));
const Utils = lazy(() => import('./Utils'));
const Saya = lazy(() => import('./Saya'));

type Props = NativeStackScreenProps<RootStackNavigator, 'Home'>;
const Tab = createBottomTabNavigator<HomeNavigator>();

const withSuspense = (Component: React.ComponentType<any>) => (props: any) => (
  <SuspenseLoading>
    <Component {...props} />
  </SuspenseLoading>
);

const tabScreens = [
  {
    name: 'AnimeList',
    component: withSuspense(EpisodeBaruHome),
    options: {
      tabBarIcon: ({ color }: { color: string }) => (
        <Icon name="home" style={{ color }} size={20} />
      ),
      tabBarLabel: 'Beranda',
    },
  },
  {
    name: 'Search',
    component: withSuspense(Search),
    options: {
      tabBarIcon: ({ color }: { color: string }) => (
        <Icon name="search" style={{ color }} size={20} />
      ),
      tabBarLabel: 'Cari',
    },
  },
  {
    name: 'Saya',
    component: withSuspense(Saya),
    options: {
      tabBarIcon: ({ color }: { color: string }) => (
        <Icon name="user" style={{ color }} size={20} />
      ),
      tabBarLabel: 'Saya',
    },
  },
  {
    name: 'Utilitas',
    component: withSuspense(Utils),
    options: {
      tabBarIcon: ({ color }: { color: string }) => (
        <Icon5 name="toolbox" style={{ color }} size={20} />
      ),
    },
  },
] as const;

function BottomTabs(props: Props) {
  const { setParamsState: setAnimeData } = useContext(EpisodeBaruHomeContext);
  const colorScheme = useColorScheme();
  useEffect(() => {
    startTransition(() => {
      setAnimeData?.(props.route.params.data);
    });
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#121212' : '#f8f9fa',
          borderTopWidth: 0,
          boxShadow: '0 0 5px rgba(0, 0, 0, 0.185)',
          paddingVertical: 10,
        },
        tabBarActiveTintColor: colorScheme === 'dark' ? '#007bff' : '#0056b3',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#666666' : '#bbbbbb',
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '700',
          textTransform: 'uppercase',
        },
        tabBarIconStyle: {
          marginBottom: -5,
        },
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
