import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import React, { lazy, memo, Suspense, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon5 from 'react-native-vector-icons/FontAwesome5';
import { EpisodeBaruHomeContext, MovieListHomeContext } from '../../misc/context';
import { EpisodeBaruHome as HomeType } from '../../types/anime';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import { Movies } from '../../utils/animeMovie';
// import EpisodeBaruHome from './AnimeList';
const EpisodeBaruHome = lazy(() => import('./AnimeList'));
// import Search from './Search';
const Search = lazy(() => import('./Search'));
// import Utils from './Utils';
const Utils = lazy(() => import('./Utils'));
// import Saya from './Saya';
const Saya = lazy(() => import('./Saya'));

type Props = StackScreenProps<RootStackNavigator, 'Home'>;
const Tab = createBottomTabNavigator<HomeNavigator>();

function Loading() {
  return (
    <ActivityIndicator
      style={{ flex: 1, justifyContent: 'center', alignSelf: 'center' }}
      size="large"
    />
  );
}

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
          <Tab.Screen
            name="AnimeList"
            options={{
              tabBarIcon: ({ color }) => <Icon name="home" style={{ color }} size={20} />,
              tabBarLabel: 'Beranda',
            }}>
            {prop => (
              <Suspense fallback={<Loading />}>
                <EpisodeBaruHome {...prop} />
              </Suspense>
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Search"
            options={{
              tabBarIcon: ({ color }) => <Icon name="search" style={{ color }} size={20} />,
              tabBarLabel: 'Cari',
            }}>
            {prop => (
              <Suspense fallback={<Loading />}>
                <Search {...prop} />
              </Suspense>
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Saya"
            options={{
              tabBarIcon: ({ color }) => <Icon name="user" style={{ color }} size={20} />,
              tabBarLabel: 'Saya',
            }}>
            {() => (
              <Suspense fallback={<Loading />}>
                <Saya />
              </Suspense>
            )}
          </Tab.Screen>
          <Tab.Screen
            name="Utilitas"
            options={{
              tabBarIcon: ({ color }) => <Icon5 name="toolbox" style={{ color }} size={20} />,
            }}>
            {() => (
              <Suspense fallback={<Loading />}>
                <Utils />
              </Suspense>
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </MovieListHomeContext.Provider>
    </EpisodeBaruHomeContext.Provider>
  );
}

export default memo(BottomTabs);
