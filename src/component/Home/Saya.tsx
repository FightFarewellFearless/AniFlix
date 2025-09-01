import { createDrawerNavigator } from '@react-navigation/drawer';
import { memo } from 'react';
import { Appbar, useTheme } from 'react-native-paper';
import Icon from '@react-native-vector-icons/fontawesome';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import useGlobalStyles from '../../assets/style';
import { SayaDrawerNavigator } from '../../types/navigation';
import History from './Saya/History';
import WatchLater from './Saya/WatchLater';

const Drawer = createDrawerNavigator<SayaDrawerNavigator>();

function Saya() {
  const globalStyles = useGlobalStyles();
  const theme = useTheme();
  return (
    <Drawer.Navigator
      screenOptions={{
        header: props => (
          <Appbar.Header style={{ flexDirection: 'row-reverse' }}>
            <Appbar.Content
              titleStyle={{ fontWeight: 'bold' }}
              title={
                typeof props.options.headerTitle === 'string'
                  ? props.options.headerTitle
                  : (props.options.title ?? '')
              }
            />
            <Appbar.Action icon="view-headline" onPress={() => props.navigation.openDrawer()} />
          </Appbar.Header>
        ),
        headerTintColor: globalStyles.text.color,
        drawerType: 'front',
        drawerStyle: {
          width: '65%',
        },
        drawerContentStyle: {
          backgroundColor: theme.colors.background,
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
