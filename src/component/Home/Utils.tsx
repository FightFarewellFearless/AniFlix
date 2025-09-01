import { NativeStackScreenProps, createNativeStackNavigator } from '@react-navigation/native-stack';
import { memo, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { TouchableNativeFeedback } from 'react-native-gesture-handler';
import { Appbar } from 'react-native-paper';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { UtilsStackNavigator } from '../../types/navigation';
import About from './Utilitas/About';
import Changelog from './Utilitas/Changelog';
import SearchAnimeByImage from './Utilitas/SearchAnimeByImage';
import Setting from './Utilitas/Setting';
import SupportDev from './Utilitas/SupportDev';

const Stack = createNativeStackNavigator<UtilsStackNavigator>();

function Utils() {
  return (
    <Stack.Navigator
      screenOptions={{
        header: props => (
          <Appbar.Header>
            {props.back && (
              <Appbar.BackAction
                onPress={() => {
                  props.navigation.goBack();
                }}
              />
            )}
            <Appbar.Content
              titleStyle={{ fontWeight: 'bold' }}
              title={
                typeof props.options.headerTitle === 'string'
                  ? props.options.headerTitle
                  : (props.options.title ?? '')
              }
            />
          </Appbar.Header>
        ),
      }}
      initialRouteName="ChooseScreen">
      <Stack.Screen
        name="ChooseScreen"
        component={ChooseScreen}
        options={{ title: 'Pilih utilitas' }}
      />
      <Stack.Screen
        name="SearchAnimeByImage"
        component={SearchAnimeByImage}
        options={{ title: 'Cari Anime dari Gambar' }}
      />
      <Stack.Screen name="Changelog" component={Changelog} options={{ title: 'Changelog' }} />
      <Stack.Screen name="Setting" component={Setting} options={{ title: 'Pengaturan' }} />
      <Stack.Screen name="About" component={About} options={{ title: 'Tentang' }} />
      <Stack.Screen
        name="SupportDev"
        component={SupportDev}
        options={{ title: 'Dukung pengembang' }}
      />
    </Stack.Navigator>
  );
}

export default memo(Utils);

const Screens = [
  {
    title: 'Cari Anime dari Gambar',
    desc: 'Cari judul anime dari gambar screenshot.',
    icon: 'image',
    color: '#3a8fac',
    screen: 'SearchAnimeByImage',
  },
  {
    title: 'Catatan update',
    desc: 'Perubahan setiap update mulai dari versi 0.6.0',
    icon: 'history',
    color: '#417e3b',
    screen: 'Changelog',
  },
  {
    title: 'Pengaturan',
    desc: 'Atur aplikasi AniFlix kamu',
    icon: 'cog',
    color: '#615e58',
    screen: 'Setting',
  },
  {
    title: 'Tentang aplikasi',
    desc: 'Tentang aplikasi AniFlix dan pengembangnya',
    icon: 'information',
    color: '#166db4',
    screen: 'About',
  },
  {
    title: 'Dukung pengembang',
    desc: 'Dukung developer melalui donasi atau kontribusi kode sumber',
    icon: 'hand-heart',
    color: '#810af0',
    screen: 'SupportDev',
  },
] as const;

function ChooseScreen(props: NativeStackScreenProps<UtilsStackNavigator, 'ChooseScreen'>) {
  const styles = useStyles();
  return (
    <ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
        {Screens.map((screen, index) => (
          <TouchableNativeFeedback
            key={index}
            onPress={() => props.navigation.navigate(screen.screen)}
            background={TouchableNativeFeedback.Ripple('#ffffff', false)}>
            <View style={styles.buttonContainer}>
              <MaterialCommunityIcon name={screen.icon} size={30} color={screen.color} />
              <Text style={styles.titleText}>{screen.title}</Text>
              <Text style={styles.descText}>{screen.desc}</Text>
            </View>
          </TouchableNativeFeedback>
        ))}
      </View>
    </ScrollView>
  );
}

function useStyles() {
  const dimensions = useWindowDimensions();
  const colorScheme = useColorScheme();
  const GAP = 4;
  const devidedWidth = (dimensions.width - GAP) / 2;
  return useMemo(
    () =>
      StyleSheet.create({
        buttonContainer: {
          backgroundColor: colorScheme === 'dark' ? '#313131' : '#f1f1f1',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          elevation: 5,
          width: devidedWidth < 150 ? '100%' : devidedWidth,
          minWidth: 150,
          minHeight: 150,
        },
        titleText: {
          color: colorScheme === 'dark' ? '#ffffff' : '#000000',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: 17,
        },
        descText: {
          color: colorScheme === 'dark' ? '#ffffff' : '#000000',
          textAlign: 'center',
        },
      }),
    [colorScheme, devidedWidth],
  );
}
