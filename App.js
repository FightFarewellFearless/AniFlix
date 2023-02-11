/* eslint-disable no-trailing-spaces */
/* eslint-disable semi */
/* eslint-disable prettier/prettier */
import React, { Component } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, ToastAndroid } from 'react-native';
import SystemNavigationBar from 'react-native-system-navigation-bar';

import Loading from './src/Loading';
import EpsList from './src/EpsList';
import Home from './src/Home';
import FromUrl from './src/FromUrl';
import Video from './src/Video';
import Blocked from './src/Blocked';
import Search from './src/Search';
import FailedToConnect from './src/FailedToConnect';

class App extends Component {
    constructor() {
        super();
        this.state = {
            loading: true,
            result: null,
        }
        this.Stack = createNativeStackNavigator();
        StatusBar.setHidden(false)
    }

    componentDidMount() {
        SystemNavigationBar.setBarMode('dark');
        StatusBar.setBarStyle('light-content')
        ToastAndroid.show('Aplikasi masih dalam tahap pengembangan!', ToastAndroid.SHORT);
    }

    render() {
        const Stack = this.Stack;
        return (
            <NavigationContainer theme={DarkTheme}>
                <Stack.Navigator initialRouteName='loading' screenOptions={{ headerShown: false }}>
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
        )
    }
}



export default App;
