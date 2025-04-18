import { createDrawerNavigator } from '@react-navigation/drawer';
import { memo } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import useGlobalStyles from '../../assets/style';
import { SayaDrawerNavigator } from '../../types/navigation';
import History from './Saya/History';
import WatchLater from './Saya/WatchLater';

const Drawer = createDrawerNavigator<SayaDrawerNavigator>();

function Saya() {
  const globalStyles = useGlobalStyles();
  return (
    <Drawer.Navigator
      screenOptions={{
        headerTintColor: globalStyles.text.color,
        drawerType: 'front',
        drawerStyle: {
          width: '65%',
        },
      }}>
      <Drawer.Screen
        name="History"
        component={History}
        options={{
          title: 'Riwayat',
          drawerIcon: ({ color }) => <MaterialIcons name="history" size={20} color={color} />,
        }}
      />
      <Drawer.Screen
        name="WatchLater"
        component={WatchLater}
        options={{
          title: 'Tonton Nanti',
          drawerIcon: ({ color }) => <Icon name="clock-o" size={20} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
}

export default memo(Saya);
