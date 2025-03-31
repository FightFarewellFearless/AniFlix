import { StackScreenProps } from '@react-navigation/stack';
import { memo, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
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

import { getColors } from 'react-native-image-colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import useSelectorIfFocused from '../hooks/useSelectorIfFocused';
import watchLaterJSON from '../types/watchLaterJSON';
import DarkOverlay from './misc/DarkOverlay';

type Props = StackScreenProps<RootStackNavigator, 'MovieDetail'>;
function MovieDetail(props: Props) {
  const window = useWindowDimensions();
  const globalStyles = useGlobalStyles();
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
        const color = colors.dominant;
        setImageColors(color);
      }
    });
  }, [props.route.params.data.thumbnailUrl]);
  return (
    <ScrollView style={[styles.container, { backgroundColor: imageColors }]}>
      <ImageBackground
        source={{ uri: props.route.params.data.thumbnailUrl }}
        blurRadius={3}
        style={[styles.posterContainer, { height: (window.height * 40) / 100 }]}>
        <DarkOverlay />
        <View style={[{ flex: 1, justifyContent: 'center', alignItems: 'center', rowGap: 6 }]}>
          <Text style={styles.titleText}>{props.route.params.data.title}</Text>
          <Image
            source={{ uri: props.route.params.data.thumbnailUrl }}
            resizeMode="contain"
            style={[{ width: '70%', height: '70%' }]}
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
