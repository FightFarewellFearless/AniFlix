import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Appbar, Surface, Text, TouchableRipple, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { UtilsStackNavigator } from '../../types/navigation';
import About from './Utilitas/About';
import Changelog from './Utilitas/Changelog';
import SearchAnimeByImage from './Utilitas/SearchAnimeByImage';
import Setting from './Utilitas/Setting';

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
] as const;

function ChooseScreen(props: NativeStackScreenProps<UtilsStackNavigator, 'ChooseScreen'>) {
  const styles = useStyles();
  const theme = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}>
      {Screens.map((screen, index) => (
        <Surface key={index} style={styles.surface} elevation={2}>
          <TouchableRipple
            background={{ color: 'white', foreground: true }}
            onPress={() => props.navigation.navigate(screen.screen as any)}
            style={styles.touchable}
            rippleColor={theme.colors.primaryContainer}>
            <View style={styles.content}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.colors.secondaryContainer },
                ]}>
                <MaterialCommunityIcons name={screen.icon} size={32} color={screen.color} />
              </View>
              <Text
                variant="titleMedium"
                style={[styles.titleText, { color: theme.colors.onSurface }]}>
                {screen.title}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.descText, { color: theme.colors.onSurfaceVariant }]}>
                {screen.desc}
              </Text>
            </View>
          </TouchableRipple>
        </Surface>
      ))}
    </ScrollView>
  );
}

function useStyles() {
  const dimensions = useWindowDimensions();
  const theme = useTheme();
  const GAP = 12;
  const devidedWidth = (dimensions.width - GAP * 3) / 2;

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          padding: GAP,
          gap: GAP,
          paddingBottom: 24,
        },
        surface: {
          borderRadius: 16,
          overflow: 'hidden',
          backgroundColor: theme.colors.surface,
          width: devidedWidth < 150 ? '100%' : devidedWidth,
          minHeight: 160,
        },
        touchable: {
          flex: 1,
        },
        content: {
          padding: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        },
        iconContainer: {
          width: 56,
          height: 56,
          borderRadius: 28,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
        },
        titleText: {
          textAlign: 'center',
          fontWeight: 'bold',
          marginBottom: 4,
        },
        descText: {
          textAlign: 'center',
        },
      }),
    [theme.colors.surface, devidedWidth],
  );
}
