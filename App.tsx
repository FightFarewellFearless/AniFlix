import React, { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Provider } from 'react-redux';

import Connecting from './src/component/Loading Screen/Connect';
import AniDetail from './src/component/AniDetail';
import Home from './src/component/Home/Home';
import FromUrl from './src/component/Loading Screen/FromUrl';
import Video from './src/component/Video';
import Blocked from './src/component/Blocked';
import FailedToConnect from './src/component/FailedToConnect';
import NeedUpdate from './src/component/NeedUpdate';
import store from './src/misc/reduxStore';
import { RootStackNavigator } from './src/types/navigation';
import useGlobalStyles from './src/assets/style';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { CFBypassIsOpen, CFBypassWebView, setWebViewOpen } from './src/utils/CFBypass';

enableScreens((global as any).nativeFabricUIManager === undefined); // TEMP: temporary fix for crashed app on new architecture

const Stack = createNativeStackNavigator<RootStackNavigator>();
function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [cfUrl, setCfUrl] = useState('');
  setWebViewOpen.openWebViewCF = (isOpen: boolean, url: string) => {
    setIsOpen(isOpen);
    setCfUrl(url);
  };
  const colorScheme = useColorScheme();
  useEffect(() => {
    StatusBar.setHidden(false);
  }, []);
  useEffect(() => {
    StatusBar.setBackgroundColor(colorScheme === 'dark' ? '#0A0A0A' : '#FFFFFF');
    StatusBar.setBarStyle(colorScheme === 'dark' ? 'light-content' : 'dark-content');
  }, [colorScheme]);
  const globalStyles = useGlobalStyles();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer theme={colorScheme === 'dark' ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: '#0A0A0A',
        }
      } : undefined}>
        <Provider store={store}>
          <Stack.Navigator
            initialRouteName="connectToServer"
            screenOptions={{
              headerShown: false,
              animation: 'fade_from_bottom',
            }}>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="AnimeDetail" component={AniDetail} />
            <Stack.Screen name="FromUrl" component={FromUrl} />
            <Stack.Screen name="Video" component={Video} />
            <Stack.Screen name="connectToServer" component={Connecting} />
            <Stack.Screen name="NeedUpdate" component={NeedUpdate} />
            <Stack.Screen name="Blocked" component={Blocked} />
            <Stack.Screen name="FailedToConnect" component={FailedToConnect} />
          </Stack.Navigator>
        </Provider>
        <CFBypassIsOpen.Provider value={{ isOpen, url: cfUrl, setIsOpen }}>
          <CFBypassWebView />
        </CFBypassIsOpen.Provider>
        {__DEV__ && (
          <View style={styles.Dev} pointerEvents="none">
            <Text style={[globalStyles.text, styles.DevText]}>Dev</Text>
          </View>
        )}
      </NavigationContainer>
    </GestureHandlerRootView>
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
