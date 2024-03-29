import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import History from './Saya/History';
import WatchLater from './Saya/WatchLater';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SayaDrawerNavigator } from '../../types/navigation';
import useGlobalStyles from '../../assets/style';

const Drawer = createDrawerNavigator<SayaDrawerNavigator>();

export default function Saya() {
    const globalStyles = useGlobalStyles();
    return (
        <Drawer.Navigator screenOptions={{
            headerTintColor: globalStyles.text.color,
            drawerType: 'slide',
        }}>
            <Drawer.Screen name="History" component={History}
                options={{
                    title: 'Riwayat',
                    drawerIcon: ({ color }) => <MaterialIcons name="history" size={20} color={color} />
                }} />
            <Drawer.Screen name="WatchLater" component={WatchLater}
                options={{
                    title: 'Tonton Nanti',
                    drawerIcon: ({ color }) => <Icon name="clock-o" size={20} color={color} />
                }} />
        </Drawer.Navigator>
    )
}