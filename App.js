import React, { Component } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import SystemNavigationBar from 'react-native-system-navigation-bar';

import Loading from './src/component/Loading';
import EpsList from './src/component/EpsList';
import Home from './src/component/Home';
import FromUrl from './src/component/FromUrl';
import Video from './src/component/Video';
import Blocked from './src/component/Blocked';
import Search from './src/component/Search';
import FailedToConnect from './src/component/FailedToConnect';

class App extends Component {
  constructor() {
    super();
    this.state = {
      loading: true,
      result: null,
    };
    this.Stack = createNativeStackNavigator();
    StatusBar.setHidden(false);
  }

  componentDidMount() {
    SystemNavigationBar.setNavigationColor('black');
    StatusBar.setBackgroundColor('black');
  }

  render() {
    const Stack = this.Stack;
    return (
      <NavigationContainer theme={DarkTheme}>
        <Stack.Navigator
          initialRouteName="loading"
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="EpisodeList" component={EpsList} />
          <Stack.Screen name="FromUrl" component={FromUrl} />
          <Stack.Screen name="Video" component={Video} />
          <Stack.Screen name="Search" component={Search} />
          <Stack.Screen name="loading" component={Loading} />
          <Stack.Screen name="Blocked" component={Blocked} />
          <Stack.Screen name="FailedToConnect" component={FailedToConnect} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
}

export default App;
