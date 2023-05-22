import React, { useState } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import History from './History';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from './AnimeList';
import Setting from './Setting';
import { HomeContext } from '../misc/context';

function BottomTabs(props) {
  const Tab = createBottomTabNavigator();

  const [paramsState, setParamsState] = useState(props.route.params.data);
  return (
    <HomeContext.Provider value={{ paramsState, setParamsState }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { height: 40 },
        }}>
        <Tab.Screen
          name="Home1"
          component={Home}
          options={{
            tabBarIcon: ({ color }) => (
              <Icon name="home" style={{ color }} size={20} />
            ),
            tabBarLabel: 'Home',
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
