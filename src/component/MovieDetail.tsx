import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Appearance,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import useGlobalStyles from '../assets/style';
import { RootStackNavigator } from '../types/navigation';

import controlWatchLater from '../utils/watchLaterControl';

import { useFocusEffect } from '@react-navigation/native';
import { getColors } from 'react-native-image-colors';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import Icon from 'react-native-vector-icons/FontAwesome';
import useSelectorIfFocused from '../hooks/useSelectorIfFocused';
import watchLaterJSON from '../types/watchLaterJSON';
import { hexIsDark } from '../utils/hexIsDark';
import DarkOverlay from './misc/DarkOverlay';

type Props = NativeStackScreenProps<RootStackNavigator, 'MovieDetail'>;
function MovieDetail(props: Props) {
  const window = useWindowDimensions();
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  const styles = useStyles();

  const [imageColors, setImageColors] = useState<string>('#000000');

  const watchLaterListsJson = useSelectorIfFocused(
    state => state.settings.watchLater,
    true,
    state => JSON.parse(state) as watchLaterJSON[],
  );
  const isInList = watchLaterListsJson.some(
    item => item.title === props.route.params.data.title.replace('Subtitle Indonesia', ''),
  );

  useEffect(() => {
    getColors(props.route.params.data.thumbnailUrl, { pixelSpacing: 10 }).then(colors => {
      if (colors.platform === 'android') {
        const color = colorScheme === 'dark' ? colors.darkMuted : colors.lightMuted;
        setImageColors(color);
      }
    });
  }, [colorScheme, props.route.params.data.thumbnailUrl]);

  useFocusEffect(
    useCallback(() => {
      if (imageColors === '#000000') return;
      StatusBar.setBackgroundColor(imageColors);
      StatusBar.setBarStyle(hexIsDark(imageColors) ? 'light-content' : 'dark-content');
      SystemNavigationBar.setNavigationColor(imageColors);
      return () => {
        StatusBar.setBackgroundColor(colorScheme === 'dark' ? '#0A0A0A' : '#FFFFFF');
        StatusBar.setBarStyle(colorScheme === 'dark' ? 'light-content' : 'dark-content');
        SystemNavigationBar.setNavigationColor(colorScheme === 'dark' ? '#0A0A0A' : '#FFFFFF');
      };
    }, [colorScheme, imageColors]),
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: imageColors }]}>
      <ImageBackground
        source={{ uri: props.route.params.data.thumbnailUrl }}
        blurRadius={3}
        style={[styles.posterContainer, { height: (window.height * 40) / 100 }]}>
        <DarkOverlay />
        <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', rowGap: 6 }]}>
          <Text adjustsFontSizeToFit allowFontScaling style={styles.titleText}>
            {props.route.params.data.title}
          </Text>
          <Image
            source={{ uri: props.route.params.data.thumbnailUrl }}
            resizeMode="contain"
            style={{ flex: 1, width: '70%' }}
          />
          <View
            style={{
              flexDirection: 'row',
              columnGap: 4,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}>
            <TouchableOpacity
              disabled={isInList}
              style={[styles.button, { backgroundColor: isInList ? '#ccc' : '#0ff5c3' }]}
              onPress={() => {
                const data = props.route.params.data;
                const watchLaterJson: watchLaterJSON = {
                  title: data.title.replace('Subtitle Indonesia', ''),
                  link: props.route.params.link,
                  rating: data.rating,
                  releaseYear: data.releaseDate,
                  thumbnailUrl: data.thumbnailUrl,
                  genre: data.genres,
                  date: Date.now(),
                  isMovie: true,
                };
                controlWatchLater('add', watchLaterJson);
                ToastAndroid.show('Ditambahkan ke tonton nanti', ToastAndroid.SHORT);
              }}>
              <Icon name={isInList ? 'check' : 'plus'} size={15} color="#fff" />
              <Text style={styles.buttonText}>
                {isInList ? 'Ditambahkan ke tonton nanti' : 'Tambahkan ke tonton nanti'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#07c9cf' }]}
              onPress={() => {
                props.navigation.navigate('FromUrl', {
                  isMovie: true,
                  link: props.route.params.data.streamingUrl,
                });
              }}>
              <Icon name="play" size={15} color="#fff" />
              <Text style={styles.buttonText}>Tonton sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
      {props.route.params.data.episodeList.length > 1 && (
        <Section style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={[styles.container, { gap: 4 }]}>
            <Text style={[globalStyles.text, { fontWeight: 'bold', fontSize: 17 }]}>
              Daftar Episode
            </Text>
            {props.route.params.data.episodeList.map((episode, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.button, { backgroundColor: '#00e1ff' }]}
                onPress={() => {
                  props.navigation.navigate('FromUrl', {
                    isMovie: true,
                    link: episode.url,
                  });
                }}>
                <Icon name="play" size={15} color="#0a456d" />
                <Text style={styles.buttonText}>{episode.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>
      )}
      <Section style={{ flexDirection: 'row' }}>
        <View style={styles.container}>
          <Text style={[globalStyles.text, { fontWeight: 'bold' }]}>
            <Icon name="star" size={15} color="#ffbb00" /> {props.route.params.data.rating}
          </Text>
          <Text style={[globalStyles.text, { fontWeight: 'bold' }]}>
            <Icon name="calendar" size={15} color="#ffbb00" /> {props.route.params.data.releaseDate}
          </Text>
          <Text style={[globalStyles.text, { fontWeight: 'bold' }]}>
            <Icon name="refresh" size={15} color="#ffbb00" /> {props.route.params.data.updateDate}
          </Text>
          <Text style={[globalStyles.text, { fontWeight: 'bold' }]}>
            <Icon name="users" size={15} color="#ffbb00" /> {props.route.params.data.studio}
          </Text>
        </View>

        <View style={styles.container}>
          <Text style={[globalStyles.text, { fontWeight: 'bold' }]}>
            <Icon name="tags" size={15} color="#ffbb00" /> Genre:{' '}
            {props.route.params.data.genres.join(', ')}
          </Text>
        </View>
      </Section>
      <Section>
        <Text style={[globalStyles.text, { fontWeight: 'bold', fontSize: 17 }]}>Sinopsis</Text>
        <Text style={[globalStyles.text, { textAlign: 'justify' }]}>
          {props.route.params.data.synopsis}
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section(props: { children?: React.ReactNode; style?: ViewStyle }) {
  const colorScheme = useColorScheme();
  return (
    <View
      style={{
        ...(props.style ?? {}),
        gap: 4,
        backgroundColor: colorScheme === 'dark' ? '#1b1b1b' : '#f7f7f7',
        padding: 10,
        marginVertical: 2,
        marginHorizontal: 1,
        borderRadius: 8,
      }}>
      {props.children}
    </View>
  );
}

function useStyles() {
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        posterContainer: {
          borderRadius: 10,
        },
        titleText: {
          color: 'white',
          fontWeight: 'bold',
          fontSize: 18,
          textAlign: 'center',
          textShadowColor: 'black',
          textShadowOffset: { width: 1.4, height: 1.4 },
          textShadowRadius: 1,
        },
        button: {
          padding: 8,
          borderRadius: 5,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          columnGap: 4,
          elevation: 5,
        },
        buttonText: {
          color: 'black',
          fontWeight: 'bold',
        },
      }),
    [],
  );
}

export default memo(MovieDetail);
