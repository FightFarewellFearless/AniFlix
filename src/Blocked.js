/* eslint-disable prettier/prettier */
/* eslint-disable quotes */
/* eslint-disable no-trailing-spaces */
import { Component } from "react";
import {View, ActivityIndicator, Text, TouchableOpacity} from 'react-native';
import styles from './assets/style';
import Icon from 'react-native-vector-icons/Entypo';

class Loading extends Component {
    constructor () {
        super();
    }
    render () {
        return (
            <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <Text style={[{fontSize: 20}, styles.text]}>Anime yang kamu tuju tidak di izinkan!</Text>
                <TouchableOpacity style={{borderRadius: 2, borderWidth: 3, backgroundColor: 'lightblue'}} onPress={() => this.props.navigation.goBack()}>
                    <Text style={{color: 'black'}}><Icon name='back' size={14} style={{color:'black'}} /> Kembali</Text>
                </TouchableOpacity>
            </View>
        )
    }

}

export default Loading;