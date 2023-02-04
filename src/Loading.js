/* eslint-disable prettier/prettier */
/* eslint-disable quotes */
/* eslint-disable no-trailing-spaces */
import { Component } from "react";
import { View, ActivityIndicator, Text, ToastAndroid } from 'react-native';
import { StackActions } from '@react-navigation/native';
import RNExitApp from 'react-native-exit-app';
import styles from './assets/style';


class Loading extends Component {
    constructor() {
        super();
    }

    componentDidMount() {
        ToastAndroid.show('Aplikasi masih dalam tahap pengembangan!', ToastAndroid.SHORT);
        fetch('https://animeapi.aceracia.repl.co/newAnime').then(async (data) => {
            const jsondata = await data.json();
            this.props.navigation.dispatch(StackActions.replace('Home', {
                data: jsondata,
            }))
        }).catch(e => {
            ToastAndroid.show('Gagal terhubung ke server.', ToastAndroid.SHORT);
            setTimeout(() => RNExitApp.exitApp(), 200)
        })
    }

    render() {
        return (
            <>
                <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                    <ActivityIndicator size='large' />
                    <Text style={styles.text}>Mengubungkan ke server mohon tunggu.</Text>
                </View>
                <Text style={[styles.text]}>{require('../package.json').version}</Text>
            </>
        )
    }

}

export default Loading;