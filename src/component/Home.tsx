import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import History from './History';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from './AnimeList';
import Setting from './Setting';
import Search from './Search';
import { HomeContext } from '../misc/context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Home as HomeType } from '../types/anime';
import { HomeNavigator, RootStackNavigator } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackNavigator, 'Home'>;

function BottomTabs(props: Props) {
  const Tab = createBottomTabNavigator<HomeNavigator>();

  const [paramsState, setParamsState] = useState<HomeType>(
    props.route.params.data,
  );
  return (
    <HomeContext.Provider value={{ paramsState, setParamsState }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { height: 40 },
        }}>
        <Tab.Screen
          name="AnimeList"
          component={Home}
          options={{
            tabBarIcon: ({ color }) => (
              <Icon name="home" style={{ color }} size={20} />
            ),
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="Search"
          component={Search}
          options={{
            tabBarIcon: ({ color }) => (
              <Icon name="search" style={{ color }} size={20} />
            ),
            tabBarLabel: 'Search',
          }}
        />
        <Tab.Screen
          name="History"
          options={{
            // unmountOnBlur: true,
            tabBarIcon: ({ color }) => (
              <Icon name="history" style={{ color }} size={20} />
            ),
          }}
          component={History}
        />
        <Tab.Screen
          name="Setting"
          options={{
            tabBarIcon: ({ color }) => (
              <Icon name="gears" style={{ color }} size={20} />
            ),
          }}
          component={Setting}
        />
      </Tab.Navigator>
    </HomeContext.Provider>
  );
}

export default BottomTabs;
