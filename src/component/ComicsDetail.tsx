import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlashList, FlashListProps } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Button, Divider, Surface, TextInput, useTheme } from 'react-native-paper';
import Reanimated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome';
import useGlobalStyles from '../assets/style';
import { RootStackNavigator } from '../types/navigation';
import watchLaterJSON from '../types/watchLaterJSON';
import { useModifiedKeyValueIfFocused } from '../utils/DatabaseManager';
import { KomikuDetail } from '../utils/komiku';
import controlWatchLater from '../utils/watchLaterControl';

const ReanimatedImage = Reanimated.createAnimatedComponent(Image);
const ReanimatedFlashList =
  Reanimated.createAnimatedComponent<FlashListProps<KomikuDetail['chapters'][0]>>(FlashList);

type Props = NativeStackScreenProps<RootStackNavigator, 'ComicsDetail'>;
const IMG_HEIGHT = 200;
export default function ComicsDetail(props: Props) {
  const colorScheme = useColorScheme();
  const globalStyles = useGlobalStyles();
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const scrollRef = useAnimatedRef<FlashList<KomikuDetail['chapters'][0]>>();
  const scrollOffset = useScrollViewOffset(scrollRef as any);
  const imageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [0, IMG_HEIGHT * 2],
            [0, IMG_HEIGHT * 0.85],
            'clamp',
          ),
        },
      ],
      opacity: interpolate(scrollOffset.value, [0, IMG_HEIGHT * 0.85], [1, 0], 'clamp'),
    };
  });
  const { data } = props.route.params;
  const readComic = useCallback(
    (link: string) => {
      props.navigation.navigate('FromUrl', {
        link,
        type: 'comics',
      });
    },
    [props.navigation],
  );

  const [searchQuery, setSearchQuery] = useState('');

  const filteredChapters = useMemo(() => {
    return data.chapters.filter(chapter => {
      return chapter.chapter.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [data.chapters, searchQuery]);

  const watchLaterListsJson = useModifiedKeyValueIfFocused(
    'watchLater',
    state => JSON.parse(state) as watchLaterJSON[],
  );
  const isInList = watchLaterListsJson.some(item => item.title === data.title);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
      <ReanimatedFlashList
        ref={scrollRef}
        data={filteredChapters}
        ListEmptyComponent={() => (
          <View style={[styles.mainContainer, { marginVertical: 6 }]}>
            <Text style={globalStyles.text}>Tidak ada chapter</Text>
          </View>
        )}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity style={styles.chapterItem} onPress={() => readComic(item.chapterUrl)}>
              <View style={styles.chapterTitleContainer}>
                <Text style={[globalStyles.text, styles.chapterText]}>{item.chapter}</Text>
              </View>
              <View style={styles.chapterDetailsContainer}>
                <Text style={[globalStyles.text, styles.chapterDetailText]}>
                  <Icon name="calendar" size={12} /> {item.releaseDate}
                </Text>
                <Text style={[globalStyles.text, styles.chapterDetailText]}>
                  <Icon name="eye" size={12} /> {item.views}x dilihat
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <Divider />}
        keyExtractor={item => item.chapter}
        contentContainerStyle={{
          backgroundColor: styles.mainContainer.backgroundColor,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          paddingBottom: insets.bottom,
        }}
        ListHeaderComponentStyle={[styles.mainContainer, { marginBottom: 12 }]}
        ListHeaderComponent={
          <>
            <ReanimatedImage
              style={[{ width: '100%', height: IMG_HEIGHT }, imageStyle]}
              source={{ uri: data.headerImageUrl }}
            />
            <LinearGradient
              colors={['transparent', 'black']}
              style={{
                width: '100%',
                height: 60,
                position: 'absolute',
                transform: [
                  {
                    translateY: 155,
                  },
                ],
              }}
            />
            <View style={[styles.mainContainer, styles.mainContent]}>
              <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                <Image source={{ uri: data.thumbnailUrl }} style={styles.thumbnail} />
                <View
                  style={{ transform: styles.thumbnail.transform, flexDirection: 'row', gap: 5 }}>
                  <Surface
                    elevation={3}
                    style={{
                      backgroundColor: colorScheme === 'dark' ? '#00608d' : '#5ddfff',
                      borderRadius: 10,
                    }}>
                    <Text style={[globalStyles.text, styles.type]}>{data.type}</Text>
                  </Surface>
                  <Surface
                    elevation={3}
                    style={{
                      borderWidth: 1,
                      borderRadius: 10,
                      borderColor: colorScheme === 'dark' ? 'white' : 'black',
                    }}>
                    <Text style={[globalStyles.text, styles.status]}>{data.status}</Text>
                  </Surface>
                </View>
              </View>
              <View style={styles.infoContainer}>
                <Text style={[globalStyles.text, styles.title]}>{data.title}</Text>
                <Text style={[globalStyles.text, styles.title, styles.indonesianTitle]}>
                  {data.indonesianTitle}
                </Text>
                <Text style={[globalStyles.text, styles.author]}>By {data.author}</Text>
                <View style={styles.genreContainer}>
                  {data.genres.map(z => {
                    return (
                      <Surface
                        key={z}
                        elevation={3}
                        style={{
                          borderRadius: 8,
                        }}>
                        <Text style={styles.genre} key={z}>
                          {z}
                        </Text>
                      </Surface>
                    );
                  })}
                </View>
              </View>
              <View style={styles.secondaryInfoContainer}>
                <View style={styles.additionalInfo}>
                  <Surface style={styles.additionalInfoTextSurface}>
                    <Text style={[globalStyles.text, styles.additionalInfoText]}>
                      <Icon name="check-circle" /> {data.minAge}
                    </Text>
                  </Surface>
                  <Surface style={styles.additionalInfoTextSurface}>
                    <Text style={[globalStyles.text, styles.additionalInfoText]}>
                      <Icon name="map-signs" /> {data.readingDirection}
                    </Text>
                  </Surface>
                  <Surface style={styles.additionalInfoTextSurface}>
                    <Text style={[globalStyles.text, styles.additionalInfoText]}>
                      <Icon name="tag" /> {data.concept}
                    </Text>
                  </Surface>
                </View>

                <Text style={[globalStyles.text]}>{data.synopsis}</Text>
              </View>
              <View style={{ flexDirection: 'column', flex: 1 }}>
                <Button
                  buttonColor={styles.additionalInfoTextSurface.backgroundColor}
                  textColor={styles.additionalInfoText.color}
                  mode="outlined"
                  icon="playlist-plus"
                  disabled={isInList}
                  onPress={() => {
                    const watchLaterJson: watchLaterJSON = {
                      title: data.title,
                      link: props.route.params.link,
                      rating: 'Komik',
                      releaseYear: data.chapters[data.chapters.length - 1].releaseDate,
                      thumbnailUrl: data.thumbnailUrl,
                      genre: data.genres,
                      date: Date.now(),
                      isComics: true,
                    };
                    controlWatchLater('add', watchLaterJson);
                    ToastAndroid.show('Ditambahkan ke tonton nanti', ToastAndroid.SHORT);
                  }}>
                  {isInList ? 'Sudah Ditambahkan' : 'Baca Nanti'}
                </Button>
                <Text style={[globalStyles.text, styles.listChapterText]}>List Chapters</Text>
                <View style={{ gap: 10 }}>
                  <Button
                    onPress={() => readComic(data.chapters[data.chapters.length - 1].chapterUrl)}
                    buttonColor={styles.additionalInfoTextSurface.backgroundColor}
                    textColor={styles.additionalInfoText.color}
                    mode="elevated">
                    Baca Chapter Pertama
                  </Button>
                  <Button
                    onPress={() => readComic(data.chapters[0].chapterUrl)}
                    buttonColor={styles.additionalInfoTextSurface.backgroundColor}
                    textColor={styles.additionalInfoText.color}
                    mode="elevated">
                    Baca Chapter Terbaru
                  </Button>
                </View>
                <TextInput
                  onChangeText={setSearchQuery}
                  value={searchQuery}
                  style={{ margin: 10 }}
                  label="Cari chapter"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </>
        }
      />
    </KeyboardAvoidingView>
  );
}

function useStyles() {
  const theme = useTheme();
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
        mainContainer: {
          flex: 1,
          backgroundColor: colorScheme === 'dark' ? '#0c0c0c' : '#ebebeb',
        },
        mainContent: {
          gap: 5,
          flex: 1,
          flexWrap: 'wrap',
          flexDirection: 'row',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        infoContainer: {
          gap: 5,
          flex: 1,
          flexDirection: 'column',
          marginTop: 10,
        },
        thumbnail: {
          margin: 15,
          width: 110,
          height: 150,
          borderRadius: 10,
          transform: [{ translateY: -30 }],
        },
        type: {
          color: colorScheme === 'dark' ? 'white' : 'black',
          fontWeight: 'bold',
          padding: 5,
        },
        status: {
          alignSelf: 'flex-start',
          padding: 5,
        },
        title: {
          flexShrink: 1,
          fontSize: 20,
          fontWeight: 'bold',
        },
        indonesianTitle: {
          fontSize: 14,
        },
        author: {
          color: colorScheme === 'dark' ? '#5ddfff' : '#00608d',
        },
        secondaryInfoContainer: {},
        genreContainer: {
          flex: 1,
          gap: 4,
          flexWrap: 'wrap',
          flexDirection: 'row',
        },
        genre: {
          color: globalStyles.text.color,
          fontWeight: 'bold',
          alignSelf: 'flex-start',
          padding: 4,
        },
        additionalInfo: {
          flexDirection: 'row',
          gap: 4,
          flexWrap: 'wrap',
          marginBottom: 12,
        },
        additionalInfoTextSurface: {
          borderRadius: 8,
          backgroundColor: theme.colors.secondaryContainer,
        },
        additionalInfoText: {
          color: theme.colors.onSecondaryContainer,
          fontWeight: 'bold',
          alignSelf: 'flex-start',
          padding: 4,
        },
        listChapterText: {
          fontWeight: 'bold',
          fontSize: 22,
          marginBottom: 10,
        },
        chapterButtonsContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
          gap: 10,
        },
        chapterButton: {
          flex: 1,
          borderRadius: 10,
        },
        chapterButtonLabel: {
          fontSize: 12,
        },
        chapterItem: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 15,
          paddingHorizontal: 10,
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
          borderRadius: 10,
          marginBottom: 8,
          elevation: 3,
        },
        chapterTitleContainer: {
          flex: 2,
        },
        chapterText: {
          fontSize: 16,
          fontWeight: '600',
          color: colorScheme === 'dark' ? '#ffffff' : '#333333',
        },
        chapterDetailsContainer: {
          flex: 1,
          alignItems: 'flex-end',
        },
        chapterDetailText: {
          fontSize: 12,
          color: colorScheme === 'dark' ? '#cccccc' : '#666666',
          marginBottom: 3,
        },
        chapterDivider: {
          backgroundColor: 'transparent',
          height: 0,
        },
      }),
    [
      colorScheme,
      globalStyles.text.color,
      theme.colors.onSecondaryContainer,
      theme.colors.secondaryContainer,
    ],
  );
}
