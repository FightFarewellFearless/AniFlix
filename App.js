/* eslint-disable no-trailing-spaces */
/* eslint-disable semi */
/* eslint-disable prettier/prettier */
import React, { Component } from 'react';
import RNFetchBlob from 'rn-fetch-blob'
import { NavigationContainer, DarkTheme, StackActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

import Loading from './src/Loading';
import EpsList from './src/EpsList';
import Home from './src/Home';
import FromUrl from './src/FromUrl';
import Video from './src/Video';
import Blocked from './src/Blocked';
import Search from './src/Search';

class App extends Component {
    constructor() {
        super();
        this.state = {
            loading: true,
            result: null,
        }
    }

    render() {
        const Stack = createNativeStackNavigator();
        return (
            <>
            <StatusBar hidden={false} />
                <NavigationContainer theme={DarkTheme}>
                    <Stack.Navigator initialRouteName='loading' screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Home" component={Home} />
                        <Stack.Screen name="EpisodeList" component={EpsList} />
                        <Stack.Screen name="FromUrl" component={FromUrl} />
                        <Stack.Screen name="Video" component={Video} />
                        <Stack.Screen name="Search" component={Search} />
                        <Stack.Screen name="loading" component={Loading} />
                        <Stack.Screen name="Blocked" component={Blocked} />
                    </Stack.Navigator>
                </NavigationContainer>
            </>
        )
    }
}
export default App;
