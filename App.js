import React, { useEffect, useMemo, useReducer } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SettingsContext } from './src/misc/context';

import Loading from './src/component/Loading';
import EpsList from './src/component/EpsList';
import Home from './src/component/Home';
import FromUrl from './src/component/FromUrl';
import Video from './src/component/Video';
import Blocked from './src/component/Blocked';
import Search from './src/component/Search';
import FailedToConnect from './src/component/FailedToConnect';
import NeedUpdate from './src/component/NeedUpdate';
import defaultDatabase from './src/misc/defaultDatabaseValue.json';

function reducer(state, action) {
  const value =
    typeof action.value !== 'string'
      ? JSON.stringify(action.value)
      : action.value;
  AsyncStorage.setItem(action.target, value);
  return {
    ...state,
    [action.target]: value,
  };
}

function App() {
  const [settingsContext, dispatchSettings] = useReducer(
    reducer,
    defaultDatabase,
  );

  const Stack = useMemo(createNativeStackNavigator, []);

  useEffect(() => {
    StatusBar.setHidden(false);
    SystemNavigationBar.setNavigationColor('black');
    StatusBar.setBackgroundColor('black');
  }, []);

  return (
    <SettingsContext.Provider value={{ settingsContext, dispatchSettings }}>
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
          <Stack.Screen name="NeedUpdate" component={NeedUpdate} />
          <Stack.Screen name="Blocked" component={Blocked} />
          <Stack.Screen name="FailedToConnect" component={FailedToConnect} />
        </Stack.Navigator>
      </NavigationContainer>
    </SettingsContext.Provider>
  );
}
export default App;
