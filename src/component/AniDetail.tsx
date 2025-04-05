import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  TouchableOpacity as TouchableOpacityRN,
  View,
  useColorScheme,
} from 'react-native';
import { CopilotProvider, CopilotStep, useCopilot, walkthroughable } from 'react-native-copilot';
import { getColors } from 'react-native-image-colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import useGlobalStyles, { lightText } from '../assets/style';
import useSelectorIfFocused from '../hooks/useSelectorIfFocused';
import { RootStackNavigator } from '../types/navigation';
import watchLaterJSON from '../types/watchLaterJSON';
import controlWatchLater from '../utils/watchLaterControl';

import { LegendList } from '@legendapp/list';
import { storage } from '../utils/DatabaseManager';
import { complementHex, darkenHexColor } from '../utils/hexColors';

const TouchableOpacityCopilot = walkthroughable(TouchableOpacityRN);

type Props = NativeStackScreenProps<RootStackNavigator, 'AnimeDetail'>;
function AniDetail(props: Props) {
  const colorScheme = useColorScheme();
  return (
    <CopilotProvider
      overlay="svg"
      androidStatusBarVisible={true}
      animated
      labels={{
        finish: 'Oke',
      }}
      backdropColor="rgba(0, 0, 0, 0.692)"
      tooltipStyle={{
        backgroundColor:
          (global as any).nativeFabricUIManager === undefined
            ? colorScheme === 'dark'
              ? '#2b2b2b'
              : '#f8f8f8'
            : 'white',
      }}>
      <AniDetailCopilot {...props} />
    </CopilotProvider>
  );
}
function AniDetailCopilot(props: Props) {
  const { start, copilotEvents } = useCopilot();

  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const data = props.route.params.data;

  const watchLaterListsJson = useSelectorIfFocused(
    state => state.settings.watchLater,
    true,
    state => JSON.parse(state) as watchLaterJSON[],
  );
  const isInList = watchLaterListsJson.some(
    item => item.title === data.title.replace('Subtitle Indonesia', ''),
  );

  const [thumbnailColor, setThumbnailColor] = useState('#00000000');
  const complementThumbnailColor =
    thumbnailColor === '#00000000' ? globalStyles.text.color : complementHex(thumbnailColor);
  useEffect(() => {
    getColors(data.thumbnailUrl, { pixelSpacing: 10 }).then(colors => {
      if (colors.platform === 'android') {
        setThumbnailColor(colors.dominant);
      }
    });
  }, [data.thumbnailUrl]);

  const isCopilotAlreadyStopped = useRef(false);
  const copilotTimeout = useRef<NodeJS.Timeout>(null);
  useEffect(() => {
    copilotEvents.off('stop');
    copilotEvents.on('stop', () => {
      isCopilotAlreadyStopped.current = true;
    });
    if (copilotTimeout.current) clearTimeout(copilotTimeout.current);
    copilotTimeout.current = setTimeout(async () => {
      if (
        isCopilotAlreadyStopped.current === false &&
        storage.getString('copilot.watchLater_firstTime') === 'true' &&
        !isInList
      ) {
        start();
        storage.set('copilot.watchLater_firstTime', 'false');
      }
    }, 500);
  }, [start, copilotEvents, isInList]);

  const colorScheme = useColorScheme();

  const endThumbnailColor = useMemo(
    () => darkenHexColor(thumbnailColor, 50 * (colorScheme === 'dark' ? 1 : -1)),
    [colorScheme, thumbnailColor],
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        style={[styles.container, styles.centerChildren]}
        colors={[thumbnailColor, endThumbnailColor]}>
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[styles.title, { color: complementThumbnailColor }]}>
            {data.title.split('(Episode')[0]}
          </Text>
          <Text
            style={[
              styles.title,
              { color: complementThumbnailColor, fontWeight: 'normal', fontSize: 14 },
            ]}>
            {data.alternativeTitle}
          </Text>
        </View>
        <View style={styles.imageContainer}>
          <View style={[styles.imageContainerChild, { alignItems: 'flex-start' }]}>
            <Text style={[styles.detailText, { color: complementThumbnailColor }]}>
              <Icon name="star" color="yellow" /> {data.rating === '' ? '-' : data.rating}
              {'\n'}
              <Icon name="calendar" /> {data.releaseYear + '\n'}
              <Icon name="tags" /> {data.status + '\n'}
              <Icon name="building" /> {data.studio + '\n'}
            </Text>
          </View>

          <View
            style={[
              { width: 135, height: 'auto', maxHeight: 200, marginVertical: 12 },
              styles.imageContainerChild,
            ]}>
            <Image source={{ uri: data.thumbnailUrl }} style={[{ flex: 1 }]} resizeMode="contain" />
            <CopilotStep
              text="Kamu bisa klik bagian ini untuk menambahkan anime ini ke daftar tonton nanti"
              order={1}
              name="watch-later">
              <TouchableOpacityCopilot
                disabled={isInList}
                style={{ position: 'absolute', bottom: 10, right: 0 }}
                onPress={() => {
                  const watchLaterJson: watchLaterJSON = {
                    title: data.title.replace('Subtitle Indonesia', ''),
                    link: props.route.params.link,
                    rating: data.rating,
                    releaseYear: data.releaseYear,
                    thumbnailUrl: data.thumbnailUrl,
                    genre: data.genres,
                    date: Date.now(),
                  };
                  controlWatchLater('add', watchLaterJson);
                  ToastAndroid.show('Ditambahkan ke tonton nanti', ToastAndroid.SHORT);
                }}>
                {/* tonton nanti */}
                <View style={{ backgroundColor: '#0084ff', padding: 5, borderRadius: 5 }}>
                  <Icon name={isInList ? 'check' : 'clock-o'} color={lightText} size={15} />
                </View>
              </TouchableOpacityCopilot>
            </CopilotStep>
          </View>

          <View style={[styles.imageContainerChild, { alignItems: 'flex-end' }]}>
            <Text style={[styles.detailText, { color: complementThumbnailColor }]}>
              <Icon name="film" /> {data.animeType + '\n'}
              <Icon name="play" /> {data.minutesPerEp + '\n'}
              <Icon name="eye" /> {data.episodeList.length + '/' + data.epsTotal + ' Episode\n'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ImageBackground
        source={{ uri: data.thumbnailUrl }}
        blurRadius={5}
        resizeMode="cover"
        style={{ maxHeight: '20%', alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            backgroundColor: '#0000009d',
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        />
        <Text style={[styles.detailText, { color: '#d8d8d8', textAlign: 'center' }]}>
          <Icon name="tags" /> {data.genres.join(', ')}
        </Text>
        <ScrollView style={[styles.synopsis]}>
          <Text style={[styles.detailText, { color: '#d8d8d8', textAlign: 'center' }]}>
            {data.synopsis === '' ? 'Tidak ada sinopsis' : data.synopsis}
          </Text>
        </ScrollView>
      </ImageBackground>

      <View style={[styles.container, { backgroundColor: thumbnailColor }]}>
        <LegendList
          recycleItems
          drawDistance={250}
          estimatedItemSize={41}
          data={data.episodeList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.episodeButton}
              onPress={() => {
                props.navigation.navigate('FromUrl', {
                  link: item.link,
                });
              }}>
              <Text
                style={[
                  globalStyles.text,
                  styles.episodeText,
                  { color: complementThumbnailColor },
                ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                width: '100%',
                borderBottomWidth: 0.5,
                borderColor: complementThumbnailColor,
              }}
            />
          )}
          extraData={colorScheme + complementThumbnailColor}
        />
      </View>
    </View>
  );
}

function useStyles() {
  const globalStyles = useGlobalStyles();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        centerChildren: {
          justifyContent: 'center',
          alignItems: 'center',
        },
        title: {
          fontSize: 20,
          fontWeight: 'bold',
          color: globalStyles.text.color,
          textAlign: 'center',
          textShadowColor: 'black',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 1,
        },
        imageContainer: {
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
        },
        imageContainerChild: {
          flex: 1,
        },
        detailText: {
          color: globalStyles.text.color,
          textShadowColor: 'black',
          textShadowOffset: { width: 0.8, height: 0.8 },
          textShadowRadius: 0.8,
          fontWeight: 'bold',
        },
        synopsis: {},
        episodeButton: {
          padding: 10,
        },
        episodeText: {
          fontSize: 15,
          fontStyle: 'italic',
          fontWeight: 'bold',
          textAlign: 'center',
          textDecorationLine: 'underline',
          textShadowColor: 'black',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 1,
        },
      }),
    [globalStyles.text.color],
  );
}

export default memo(AniDetail);
