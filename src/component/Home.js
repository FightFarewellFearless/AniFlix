import React, { Component } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import History from './History';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from './AnimeList';
import Setting from './Setting';

class BottomTabs extends Component {
  constructor(props) {
    super(props);
    this.Tab = createBottomTabNavigator();
  }

  render() {
    const Tab = this.Tab;
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { height: 40 },
        }}>
        <Tab.Screen
          name="Home1"
          component={Home}
          initialParams={this.props.route.params}
          options={{
            tabBarIcon: ({ color }) => (
              <Icon name="home" color={color} size={20} />
            ),
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="History"
          options={{
            unmountOnBlur: true,
            tabBarIcon: ({ color }) => (
              <Icon name="history" color={color} size={20} />
            ),
          }}
          component={History}
        />
        <Tab.Screen
          name="Setting"
          initialParams={this.props.route.params}
          options={{
            tabBarIcon: ({ color }) => (
              <Icon name="gears" color={color} size={20} />
            ),
          }}
          component={Setting}
        />
      </Tab.Navigator>
    );
  }
}

export default BottomTabs;
