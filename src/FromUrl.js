/* eslint-disable prettier/prettier */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable quotes */
/* eslint-disable no-trailing-spaces */
import { Component } from "react";
import { View, ActivityIndicator, Text, Alert, BackHandler, ToastAndroid } from 'react-native';
import { StackActions } from '@react-navigation/native';
import styles from './assets/style';


class FromUrl extends Component {
    constructor() {
        super();
        this.state = {
            unmount: false,
        };
    }


    async componentDidMount() {
        const abort = new AbortController();
        this.backhandler = BackHandler.addEventListener('hardwareBackPress', () => {
            this.setState({
                unmount: true,
            });
            abort.abort();
            return false;
        });
        if (this.props.route.params.type === 'search') {
            const results = await fetch('https://animeapi.aceracia.repl.co/search?q=' + this.props.route.params.query, {
                signal: abort.signal
            }).catch(err => {
                if(err.message === 'Aborted') return;
                Alert.alert('Error', err.message);
                this.props.navigation.goBack();
            });
            if (results && this.state.unmount === false) {
                const result = await results.json();
                this.props.navigation.dispatch(StackActions.replace('Search', {
                    data: result,
                    query: this.props.route.params.query
                }));
            }


        } else {
            const results = await fetch('https://animeapi.aceracia.repl.co/fromUrl?link=' + this.props.route.params.link, {
                signal: abort.signal
            }).catch(err => {
                if(err.message === 'Aborted') return;
                Alert.alert('Error', err.message);
                this.props.navigation.goBack();
            });
            try {
                if (results && this.state.unmount === false) {
                    const result = await results.json();
                    if (result.blocked) {
                        this.props.navigation.dispatch(StackActions.replace('Blocked'));
                    }
                    else if (result.type === 'epsList') {
                        this.props.navigation.dispatch(StackActions.replace('EpisodeList', {
                            data: result,
                        }));
                    }
                    else if (result.type === 'singleEps') {
                        this.props.navigation.dispatch(StackActions.replace('Video', {
                            data: result,
                            link: this.props.route.params.link
                        }));
                    }
                };
            } catch (e) {
                Alert.alert('Error', e.message);
                this.props.navigation.goBack();
            }
        }
    }

    componentWillUnmount() {
        this.backhandler.remove();
    }

    render() {
        return (
            <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <ActivityIndicator size='large' />
                <Text style={styles.text}>Loading.</Text>
            </View>
        )
    }

}

export default FromUrl;