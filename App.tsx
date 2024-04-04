import React, { useEffect } from 'react';
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

const Stack = createNativeStackNavigator<RootStackNavigator>();
function App() {
  const colorScheme = useColorScheme();
  useEffect(() => {
    StatusBar.setHidden(false);
  }, []);
  const globalStyles = useGlobalStyles();

  return (
    <GestureHandlerRootView style={{flex: 1}}>
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
