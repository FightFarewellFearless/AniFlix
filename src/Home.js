import React, { Component } from 'react';
import {
    View,
    RefreshControl,
    Text,
    ScrollView,
    ImageBackground,
    TouchableOpacity,
    TextInput,
    ToastAndroid,
    TouchableHighlight,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import styles from './assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';
import History from './History';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

class Home extends Component {
    constructor() {
        super();
        this.state = {
            searchText: '',
            data: [],
            refresh: false,
        };
    }

    componentDidMount() {
        this.setState({
            data: this.props.route.params.data,
        });
    }

    submit = () => {
        if (this.state.searchText === '') {
            return ToastAndroid.show(
                'Masukkan anime yang kamu cari ke dalam kolom pencarian',
                ToastAndroid.SHORT,
            );
        }
        this.props.navigation.dispatch(
            StackActions.push('FromUrl', {
                query: this.state.searchText,
                type: 'search',
            }),
        );
    };

    refreshing() {
        this.setState({
            refresh: true,
        });

        fetch('https://animeapi.aceracia.repl.co/newAnime')
            .then(async data => {
                const jsondata = await data.json();
                this.setState({
                    data: jsondata,
                    refresh: false,
                });
            })
            .catch(e => {
                ToastAndroid.show(
                    'Gagal terhubung ke server.',
                    ToastAndroid.SHORT,
                );
                this.setState({
                    refresh: false,
                });
            });
    }

    render() {
        return (
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={this.state.refresh}
                        onRefresh={() => this.refreshing()}
                    />
                }>
                <View style={{ flexDirection: 'row' }}>
                    <TextInput
                        onSubmitEditing={this.submit}
                        onChangeText={text => {
                            this.setState({ searchText: text });
                        }}
                        placeholder="Cari anime disini"
                        placeholderTextColor={styles.text.color}
                        style={{
                            width: this.state.searchText !== '' ? '87%' : '98%',
                            height: 35,
                            borderWidth: 1,
                            borderColor: 'red',
                            marginLeft: 2,
                            color: styles.text.color,
                        }}
                    />
                    {this.state.searchText !== '' && (
                        <TouchableHighlight
                            onPress={this.submit}
                            style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '12%',
                                backgroundColor: '#007AFF',
                            }}>
                            <Text style={{ color: '#ffffff' }}>
                                <Icon name="search" size={17} />
                                Cari
                            </Text>
                        </TouchableHighlight>
                    )}
                </View>
                <View>
                    <Text style={[{ fontSize: 20 }, styles.text]}>
                        Anime terbaru:{' '}
                    </Text>
                </View>
                <ScrollView
                    horizontal
                    style={{ overflow: 'hidden', height: 215 }}>
                    {this.state.data.map(z => {
                        return (
                            <TouchableOpacity
                                key={'btn' + z.title + z.episode}
                                onPress={() => {
                                    this.props.navigation.dispatch(
                                        StackActions.push('FromUrl', {
                                            link: z.streamingLink,
                                        }),
                                    );
                                }}>
                                <ImageBackground
                                    resizeMode="stretch"
                                    key={z.title + z.episode}
                                    source={{ uri: z.thumbnailUrl }}
                                    style={{
                                        overflow: 'hidden',
                                        width: 120,
                                        height: 210,
                                        borderWidth: 2,
                                        borderColor: 'red',
                                        marginRight: 12,
                                        flex: 2,
                                    }}>
                                    <View
                                        style={{
                                            justifyContent: 'flex-start',
                                            alignItems: 'flex-start',
                                            height: '50%',
                                            width: '100%',
                                        }}>
                                        <Text
                                            style={{
                                                fontSize: 10,
                                                color: 'black',
                                                backgroundColor: 'orange',
                                                opacity: 0.78,
                                            }}>
                                            {z.title}
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            justifyContent: 'flex-end',
                                            alignItems: 'flex-end',
                                            height: '50%',
                                            width: '100%',
                                        }}>
                                        <Text
                                            style={{
                                                fontSize: 10,
                                                color: 'black',
                                                backgroundColor: 'orange',
                                                opacity: 0.8,
                                            }}>
                                            {z.episode}
                                        </Text>
                                    </View>
                                </ImageBackground>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </ScrollView>
        );
    }
}

class BottomTabs extends Component {
    constructor(props) {
        super(props);
        this.Tab = createBottomTabNavigator();
    }

    render() {
        const Tab = this.Tab;
        return (
            <Tab.Navigator
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: { height: 40 },
                }}>
                <Tab.Screen
                    name="Home1"
                    component={Home}
                    initialParams={this.props.route.params}
                    options={{
                        tabBarIcon: ({ color }) => (
                            <Icon name="home" color={color} size={20} />
                        ),
                        tabBarLabel: 'Home',
                    }}
                />
                <Tab.Screen
                    name="History"
                    options={{
                        unmountOnBlur: true,
                        tabBarIcon: ({ color }) => (
                            <Icon name="history" color={color} size={20} />
                        ),
                    }}
                    component={History}
                />
            </Tab.Navigator>
        );
    }
}

export default BottomTabs;
