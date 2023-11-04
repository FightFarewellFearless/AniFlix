import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { Provider } from 'react-redux';

import Connecting from './src/component/Loading Screen/Connect';
import EpsList from './src/component/EpsList';
import Home from './src/component/Home/Home';
import FromUrl from './src/component/Loading Screen/FromUrl';
import Video from './src/component/Video';
import Blocked from './src/component/Blocked';
import FailedToConnect from './src/component/FailedToConnect';
import NeedUpdate from './src/component/NeedUpdate';
import Maintenance from './src/component/Maintenance';
import store from './src/misc/reduxStore';
import { RootStackNavigator } from './src/types/navigation';
import globalStyles from './src/assets/style';
import colorScheme from './src/utils/colorScheme';

function App() {
  const Stack = createNativeStackNavigator<RootStackNavigator>();

  useEffect(() => {
    StatusBar.setHidden(false);
  }, []);

  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : undefined}>
      {__DEV__ && (
        <View style={styles.Dev} pointerEvents="none">
          <Text style={[globalStyles.text, styles.DevText]}>Dev</Text>
        </View>
      )}
      <Provider store={store}>
        <Stack.Navigator
          initialRouteName="connectToServer"
          screenOptions={{
            headerShown: false,
            animation: 'fade_from_bottom',
          }}>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="EpisodeList" component={EpsList} />
          <Stack.Screen name="FromUrl" component={FromUrl} />
          <Stack.Screen name="Video" component={Video} />
          <Stack.Screen name="connectToServer" component={Connecting} />
          <Stack.Screen name="NeedUpdate" component={NeedUpdate} />
          <Stack.Screen name="Blocked" component={Blocked} />
          <Stack.Screen name="FailedToConnect" component={FailedToConnect} />
          <Stack.Screen name="Maintenance" component={Maintenance} />
        </Stack.Navigator>
      </Provider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  Dev: {
    position: 'absolute',
    bottom: 40,
    zIndex: 100,
    backgroundColor: '#c2c2047e',
    padding: 5,
    paddingHorizontal: 20,
    borderTopRightRadius: 40,
    borderBottomLeftRadius: 40,
  },
  DevText: {
    fontWeight: 'bold',
    fontSize: 17,
  },
});

export default App;
