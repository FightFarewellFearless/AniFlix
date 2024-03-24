import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon5 from 'react-native-vector-icons/FontAwesome5';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from './AnimeList';
import Search from './Search';
import { HomeContext } from '../../misc/context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Home as HomeType } from '../../types/anime';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';
import { TouchableOpacity } from 'react-native';
import Utils from './Utils';
import Saya from './Saya';

type Props = NativeStackScreenProps<RootStackNavigator, 'Home'>;
const Tab = createBottomTabNavigator<HomeNavigator>();

function BottomTabs(props: Props) {
  const [paramsState, setParamsState] = useState<HomeType>(
    props.route.params.data,
  );
  return (
    <HomeContext.Provider value={{ paramsState, setParamsState }}>
      <Tab.Navigator
        // TEMP: temporary fix for crashed app on nested navigator
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { height: 40 },
          tabBarHideOnKeyboard: true,
          tabBarButton: Bprops => <TouchableOpacity {...Bprops} />,
        }}>
        <Tab.Screen
          name="AnimeList"
          component={Home}
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
    </HomeContext.Provider>
  );
}

export default BottomTabs;
