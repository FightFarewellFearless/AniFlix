import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { Provider } from 'react-redux';

import Loading from './src/component/Loading';
import EpsList from './src/component/EpsList';
import Home from './src/component/Home';
import FromUrl from './src/component/FromUrl';
import Video from './src/component/Video';
import Blocked from './src/component/Blocked';
import FailedToConnect from './src/component/FailedToConnect';
import NeedUpdate from './src/component/NeedUpdate';
import Maintenance from './src/component/Maintenance';
import store from './src/misc/reduxStore';
import { RootStackNavigator } from './src/types/navigation';

function App() {
  const Stack = createNativeStackNavigator<RootStackNavigator>();

  useEffect(() => {
    StatusBar.setHidden(false);
    SystemNavigationBar.setNavigationColor('black');
    StatusBar.setBackgroundColor('black');
  }, []);

  return (
    <NavigationContainer theme={DarkTheme}>
      <Provider store={store}>
        <Stack.Navigator
          initialRouteName="loading"
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
          }}>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="EpisodeList" component={EpsList} />
          <Stack.Screen name="FromUrl" component={FromUrl} />
          <Stack.Screen name="Video" component={Video} />
          <Stack.Screen name="loading" component={Loading} />
          <Stack.Screen name="NeedUpdate" component={NeedUpdate} />
          <Stack.Screen name="Blocked" component={Blocked} />
          <Stack.Screen name="FailedToConnect" component={FailedToConnect} />
          <Stack.Screen name="Maintenance" component={Maintenance} />
        </Stack.Navigator>
      </Provider>
    </NavigationContainer>
  );
}
export default App;
