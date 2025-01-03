import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon5 from 'react-native-vector-icons/FontAwesome5';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import EpisodeBaruHome from './AnimeList';
import Search from './Search';
import { EpisodeBaruHomeContext, MovieListHomeContext } from '../../misc/context';
import { StackScreenProps } from '@react-navigation/stack';
import { EpisodeBaruHome as HomeType } from '../../types/anime';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import Utils from './Utils';
import Saya from './Saya';
import { Movies } from '../../utils/animeMovie';

type Props = StackScreenProps<RootStackNavigator, 'Home'>;
const Tab = createBottomTabNavigator<HomeNavigator>();

function BottomTabs(props: Props) {
  const [paramsState, setParamsState] = useState<HomeType>(
    props.route.params.data,
  );
  const [movieParamsState, setMovieParamsState] = useState<Movies[]>([]);
  return (
    <EpisodeBaruHomeContext.Provider value={{ paramsState, setParamsState }}>
      <MovieListHomeContext.Provider value={{ paramsState: movieParamsState, setParamsState: setMovieParamsState }}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarHideOnKeyboard: true,
          }}>
          <Tab.Screen
            name="AnimeList"
            component={EpisodeBaruHome}
            options={{
              tabBarIcon: ({ color }) => (
                <Icon name="home" style={{ color }} size={20} />
              ),
              tabBarLabel: 'Beranda',
            }}
          />
          <Tab.Screen
            name="Search"
            component={Search}
            options={{
              tabBarIcon: ({ color }) => (
                <Icon name="search" style={{ color }} size={20} />
              ),
              tabBarLabel: 'Cari',
            }}
          />
          <Tab.Screen
            name="Saya"
            options={{
              tabBarIcon: ({ color }) => <Icon name="user" style={{ color }} size={20} />,
              tabBarLabel: 'Saya',
            }}
            component={Saya} />
          <Tab.Screen
            name='Utilitas'
            component={Utils}
            options={{ tabBarIcon: ({ color }) => <Icon5 name="toolbox" style={{ color }} size={20} /> }} />
        </Tab.Navigator>
      </MovieListHomeContext.Provider>
    </EpisodeBaruHomeContext.Provider>
  );
}

export default BottomTabs;
