import MaterialIcons from '@react-native-vector-icons/material-icons';
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { lazy, memo, useCallback, useContext, useEffect } from 'react';
import { AndroidSoftInputModes, KeyboardController } from 'react-native-keyboard-controller';
import { BottomNavigation, useTheme } from 'react-native-paper';
import { withSuspenseAndSafeArea } from '../../../App';
import { EpisodeBaruHomeContext } from '../../misc/context';
import { HomeNavigator, RootStackNavigator } from '../../types/navigation';

const EpisodeBaruHome = lazy(() => import('./AnimeList'));
const Search = lazy(() => import('./Search'));
const Utils = lazy(() => import('./Utils'));
const Saya = lazy(() => import('./Saya'));

type Props = NativeStackScreenProps<RootStackNavigator, 'Home'>;
const Tab = createBottomTabNavigator<HomeNavigator>();

const tabScreens: {
  name: keyof HomeNavigator;
  component: (props: any) => React.JSX.Element;
  options: BottomTabNavigationOptions;
}[] = [
  {
    name: 'AnimeList',
    component: withSuspenseAndSafeArea(EpisodeBaruHome, false),
    options: {
      tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} />,
      tabBarLabel: 'Beranda',
    },
  },
  {
    name: 'Search',
    component: withSuspenseAndSafeArea(Search, true, false, true),
    options: {
      tabBarIcon: ({ color, size }) => <MaterialIcons name="search" size={size} color={color} />,
      tabBarLabel: 'Pencarian',
    },
  },
  {
    name: 'Saya',
    component: withSuspenseAndSafeArea(Saya, false),
    options: {
      tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
      tabBarLabel: 'Saya',
    },
  },
  {
    name: 'Utilitas',
    component: withSuspenseAndSafeArea(Utils, false),
    options: {
      tabBarIcon: ({ color, size }) => <MaterialIcons name="build" size={size} color={color} />,
    },
  },
];

function BottomTabs(props: Props) {
  const { setParamsState: setAnimeData } = useContext(EpisodeBaruHomeContext);
  // const colorScheme = useColorScheme();
  const theme = useTheme();
  useEffect(() => {
    setAnimeData?.(props.route.params.data);
  }, [props.route.params.data, setAnimeData]);
  useFocusEffect(
    useCallback(() => {
      KeyboardController.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_PAN);
      return () => {
        KeyboardController.setDefaultMode();
      };
    }, []),
  );
  return (
    <Tab.Navigator
      // tabBarStyle={{
      //   backgroundColor: colorScheme === 'dark' ? '#181818' : '#f0f0f0',
      // }}
      // activeIndicatorColor={colorScheme === 'dark' ? '#525252' : '#d8d8d8'}
      // getFreezeOnBlur={() => true}
      // TODO: Remove this when the blank screen issue is fixed
      detachInactiveScreens={false}
      screenOptions={{
        animation: 'shift',
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
      }}
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          onTabPress={({ route, preventDefault }) => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (event.defaultPrevented) {
              preventDefault();
            } else {
              navigation.dispatch({
                ...CommonActions.navigate(route.name, route.params),
                target: state.key,
              });
            }
          }}
          renderIcon={({ route, focused, color }) =>
            descriptors[route.key].options.tabBarIcon?.({
              focused,
              color,
              size: 24,
            }) || null
          }
          getLabelText={({ route }) => {
            const { options } = descriptors[route.key];
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : typeof options.title === 'string'
                  ? options.title
                  : route.name;

            return label;
          }}
        />
      )}>
      {tabScreens.map(({ name, component: Component, options }) => (
        <Tab.Screen key={name} name={name} options={options}>
          {Component}
        </Tab.Screen>
      ))}
    </Tab.Navigator>
  );
}

export default memo(BottomTabs);
