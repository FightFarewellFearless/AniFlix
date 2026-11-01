import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export type NativeBottomTabNavigationOptions = {
  tabBarIcon?: (props: { focused: boolean }) => any;
  tabBarLabel?: string;
  [key: string]: any;
};

export type NativeBottomTabScreenProps<
  ParamList extends Record<string, object | undefined>,
  RouteName extends keyof ParamList = keyof ParamList,
> = {
  navigation: any;
  route: {
    key: string;
    name: RouteName;
    params?: ParamList[RouteName];
  };
};

function BottomTabScreen(_props: any) {
  return null;
}

function BottomTabNavigator({
  children,
  tabBarStyle,
  activeIndicatorColor,
  screenOptions,
  initialRouteName,
}: {
  children: React.ReactNode;
  tabBarStyle?: any;
  activeIndicatorColor?: string;
  screenOptions?: any;
  initialRouteName?: string;
}) {
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const isDark = colorScheme === 'dark';
  const isDesktop = width >= 980;
  const parentNavigation = useNavigation<any>();

  // Extract screens from children
  const screens = useMemo(() => {
    const list: Array<{
      name: string;
      options: NativeBottomTabNavigationOptions;
      component?: any;
      renderChildren?: any;
    }> = [];

    React.Children.forEach(children, child => {
      if (!React.isValidElement(child)) return;
      const props = child.props as any;
      if (!props || !props.name) return;

      list.push({
        name: props.name,
        options: props.options || {},
        component: props.component,
        renderChildren: props.children,
      });
    });

    return list;
  }, [children]);

  const screenNames = useMemo(() => screens.map(s => s.name), [screens]);

  const defaultActive = initialRouteName || (screens.length > 0 ? screens[0].name : '');
  const [activeTab, setActiveTab] = useState<string>(defaultActive);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set([defaultActive]));

  const switchTab = useCallback((name: string) => {
    setActiveTab(name);
    setVisitedTabs(prev => {
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  }, []);

  const createTabNavigation = useCallback(
    (name: string) => ({
      ...parentNavigation,
      navigate: (target: any, params?: any) => {
        const targetName = typeof target === 'string' ? target : target?.name;
        if (targetName && screenNames.includes(targetName)) {
          switchTab(targetName);
        } else {
          parentNavigation?.navigate(target, params);
        }
      },
      jumpTo: (target: string) => {
        if (screenNames.includes(target)) {
          switchTab(target);
        }
      },
      dispatch: (action: any) => {
        const targetName = action?.payload?.name;
        if (targetName && screenNames.includes(targetName)) {
          switchTab(targetName);
        } else {
          parentNavigation?.dispatch(action);
        }
      },
    }),
    [parentNavigation, screenNames, switchTab],
  );

  const activeColor = screenOptions?.tabBarActiveTintColor || (isDark ? '#BB86FC' : '#7845AC');
  const inactiveColor = isDark ? '#9E9E9E' : '#757575';
  const indicatorColor =
    activeIndicatorColor || (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)');
  const barBg = tabBarStyle?.backgroundColor || (isDark ? '#181818' : '#f0f0f0');

  const tabBar = (
    <View
      style={[
        styles.tabBar,
        isDesktop && styles.desktopTabBar,
        { backgroundColor: barBg },
        tabBarStyle,
      ]}>
      <View style={isDesktop ? styles.desktopBrand : styles.mobileBrand}>
        <Text style={[styles.brandMark, { color: activeColor }]}>A</Text>
        {isDesktop && (
          <View>
            <Text style={[styles.brandName, { color: isDark ? '#f5f7fb' : '#20242b' }]}>
              AniFlix
            </Text>
            <Text style={[styles.brandCaption, { color: inactiveColor }]}>Your watch space</Text>
          </View>
        )}
      </View>
      {screens.map(screen => {
        const isFocused = screen.name === activeTab;
        const iconGetter = screen.options?.tabBarIcon;
        const label = screen.options?.tabBarLabel || screen.name;
        const color = isFocused ? activeColor : inactiveColor;

        let iconSrc = null;
        if (typeof iconGetter === 'function') {
          try {
            iconSrc = iconGetter({ focused: isFocused });
          } catch {
            iconSrc = null;
          }
        }

        const resolvedSrc = iconSrc?.default || iconSrc;

        return (
          <TouchableOpacity
            key={screen.name}
            onPress={() => switchTab(screen.name)}
            activeOpacity={0.7}
            style={[styles.tabButton, isDesktop && styles.desktopTabButton]}>
            <View
              style={[
                styles.iconPill,
                isDesktop && styles.desktopIconPill,
                isFocused && { backgroundColor: indicatorColor },
              ]}>
              {resolvedSrc ? (
                <Image
                  source={typeof resolvedSrc === 'string' ? { uri: resolvedSrc } : resolvedSrc}
                  style={[styles.tabIcon, { tintColor: color }]}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.tabIconFallback, { backgroundColor: color }]} />
              )}
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.tabLabel,
                isDesktop && styles.desktopTabLabel,
                { color, fontWeight: isFocused ? '700' : '500' },
              ]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, isDesktop && styles.desktopContainer]}>
      {isDesktop && tabBar}
      {/* Screens viewport */}
      <View style={styles.content}>
        {screens.map(screen => {
          const isFocused = screen.name === activeTab;
          const freezeOnBlur = screenOptions?.freezeOnBlur ?? true;

          // If not visited yet, don't mount
          if (!visitedTabs.has(screen.name)) return null;

          // If freeze on blur and not focused, we hide it with display: none to preserve state
          const Comp = screen.component;
          const renderFn = screen.renderChildren;
          const navProp = createTabNavigation(screen.name);
          const routeProp = { key: screen.name, name: screen.name };

          return (
            <View
              key={screen.name}
              style={[styles.screenWrapper, { display: isFocused ? 'flex' : 'none' }]}>
              {Comp
                ? typeof Comp === 'function'
                  ? Comp({ navigation: navProp, route: routeProp })
                  : <Comp navigation={navProp} route={routeProp} />
                : typeof renderFn === 'function'
                  ? renderFn({ navigation: navProp, route: routeProp })
                  : renderFn}
            </View>
          );
        })}
      </View>

      {/* Bottom Tab Bar */}
      {!isDesktop && tabBar}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  desktopContainer: {
    flexDirection: 'row',
  },
  content: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  screenWrapper: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    overflow: 'hidden',
  },
  tabBar: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    paddingBottom: 4,
    paddingTop: 4,
  },
  desktopTabBar: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 224,
    width: 224,
    minWidth: 224,
    maxWidth: 224,
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    borderTopWidth: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(128, 128, 128, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 22,
    gap: 6,
    overflow: 'visible',
  },
  desktopBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingBottom: 28,
  },
  mobileBrand: {
    display: 'none',
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(77, 208, 225, 0.14)',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 22,
    fontWeight: '800',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  brandCaption: {
    fontSize: 11,
    marginTop: 2,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  desktopTabButton: {
    flex: 0,
    flexShrink: 0,
    width: '100%',
    height: 48,
    minHeight: 48,
    maxHeight: 48,
    position: 'relative',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    gap: 12,
    marginBottom: 6,
  },
  iconPill: {
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  desktopIconPill: {
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabIcon: {
    width: 22,
    height: 22,
  },
  tabIconFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  desktopTabLabel: {
    flex: 1,
    flexShrink: 0,
    width: undefined,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 0,
    textAlign: 'left',
  },
});

export function createNativeBottomTabNavigator<
  ParamList extends Record<string, object | undefined> = any,
>() {
  return {
    Navigator: BottomTabNavigator,
    Screen: BottomTabScreen,
  };
}
