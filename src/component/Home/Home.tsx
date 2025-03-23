import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import React, { lazy, memo, useState } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon5 from 'react-native-vector-icons/FontAwesome5';
import { EpisodeBaruHomeContext, MovieListHomeContext } from '../../misc/context';
import { EpisodeBaruHome as HomeType } from '../../types/anime';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import { Movies } from '../../utils/animeMovie';
import SuspenseLoading from '../misc/SuspenseLoading';

const EpisodeBaruHome = lazy(() => import('./AnimeList'));
const Search = lazy(() => import('./Search'));
const Utils = lazy(() => import('./Utils'));
const Saya = lazy(() => import('./Saya'));

type Props = StackScreenProps<RootStackNavigator, 'Home'>;
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
  const [paramsState, setParamsState] = useState<HomeType>(props.route.params.data);
  const [movieParamsState, setMovieParamsState] = useState<Movies[]>([]);

  return (
    <EpisodeBaruHomeContext.Provider value={{ paramsState, setParamsState }}>
      <MovieListHomeContext.Provider
        value={{ paramsState: movieParamsState, setParamsState: setMovieParamsState }}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
          }}>
          {tabScreens.map(({ name, component: Component, options }) => (
            <Tab.Screen key={name} name={name} options={options}>
              {Component}
            </Tab.Screen>
          ))}
        </Tab.Navigator>
      </MovieListHomeContext.Provider>
    </EpisodeBaruHomeContext.Provider>
  );
}

export default memo(BottomTabs);
