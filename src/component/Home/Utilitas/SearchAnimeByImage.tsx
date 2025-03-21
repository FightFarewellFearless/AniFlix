import { FlashList } from '@shopify/flash-list';
import * as DocumentPicker from 'expo-document-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import moment from 'moment';
import React, { memo, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableNativeFeedback,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import useGlobalStyles from '../../../assets/style';

interface SearchResult {
  frameCount: number;
  error: string;
  result: Result[];
}

interface Result {
  anilist: {
    id: number;
    idMal: number;
    title: {
      native: string;
      romaji: string | null;
      english: string | null;
    };
    synonyms: string[];
    isAdult: boolean;
  };
  filename: string;
  episode: null | number;
  from: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
}

const exampleResult: Result = {
  anilist: {
    id: 0,
    idMal: 0,
    title: {
      native: '',
      romaji: 'Judul Anime',
      english: '',
    },
    synonyms: [],
    isAdult: false,
  },
  filename: 'Pilih terlebih dahulu.mp4',
  episode: null,
  from: 0,
  to: 0,
  similarity: 0,
  video: '',
  image: '',
};
const exampleResultArray: Result[] = new Array(3).fill(exampleResult);

function SearchAnimeByImage() {
  const globalStyles = useGlobalStyles();
  const [videoModal, setVideoModal] = useState<{ open: boolean; link: string }>({
    open: false,
    link: '',
  });
  const [searchResult, setSearchResult] = useState<SearchResult>({
    frameCount: 0,
    error: '',
    result: exampleResultArray,
  });
  const player = useVideoPlayer(videoModal.link, p => {
    p.muted = true;
    p.loop = true;
    p.play();
  });
  const [choosenImage, setChoosenImage] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Modal
        visible={videoModal.open}
        transparent
        animationType="slide"
        onRequestClose={() => setVideoModal({ open: false, link: '' })}>
        <View style={{ flex: 1 }}>
          <View style={styles.videoModalContainer}>
            <TouchableOpacity
              onPress={() => setVideoModal({ open: false, link: '' })}
              style={{ position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
              <Icon name="times" color="white" size={40} />
            </TouchableOpacity>
            <VideoView
              player={player}
              nativeControls={false}
              contentFit="contain"
              style={{ width: '100%', flex: 1, alignSelf: 'center' }}
            />
          </View>
        </View>
      </Modal>
      <TouchableNativeFeedback
        background={TouchableNativeFeedback.Ripple('white', false)}
        onPress={() => {
          DocumentPicker.getDocumentAsync({
            type: ['image/*'],
            copyToCacheDirectory: false,
          }).then(result => {
            setChoosenImage(result.assets?.[0].uri);
            const formData = new FormData();
            formData.append('image', {
              uri: result.assets?.[0].uri,
              name: 'image.png',
              type: 'image/png',
            });
            setIsLoading(true);
            fetch('https://api.trace.moe/search?anilistInfo', {
              method: 'POST',
              body: formData,
            })
              .then(e => e.json() as Promise<SearchResult>)
              .then(setSearchResult)
              .finally(() => {
                setIsLoading(false);
              })
              .catch(() => {
                setSearchResult({
                  frameCount: 0,
                  error: '',
                  result: exampleResultArray,
                });
                ToastAndroid.show('Terjadi kesalahan!', ToastAndroid.SHORT);
              });
          });
        }}>
        <View style={styles.addImage}>
          <Icon name="file-image-o" size={40} color={globalStyles.text.color} />
          <Text style={[globalStyles.text, { textAlign: 'center' }]}>Pilih gambar</Text>
        </View>
      </TouchableNativeFeedback>
      <Text style={[globalStyles.text, { fontSize: 12 }]}>*Filter hasil dewasa aktif</Text>
      <Text style={[globalStyles.text, { fontSize: 12 }]}>
        **Untuk hasil maksimal pastikan gambar tidak terpotong dan tidak ada border tambahan (area
        gelap, video player, dan sebagainya)
      </Text>
      {choosenImage ? (
        <Image source={{ uri: choosenImage }} style={styles.choosenImage} />
      ) : (
        <View style={[styles.choosenImage, { justifyContent: 'center' }]}>
          <Icon
            name="image"
            size={40}
            color={globalStyles.text.color}
            style={{ textAlign: 'center' }}
          />
          <Text style={[globalStyles.text, { textAlign: 'center' }]}>
            Pilih gambar terlebih dahulu
          </Text>
        </View>
      )}
      <FlashList
        drawDistance={500}
        data={searchResult?.result?.filter(val => val.anilist.isAdult === false)}
        renderItem={({ item }) => (
          <View style={styles.searchResultContainer}>
            {!isLoading ? (
              <TouchableOpacity
                style={styles.searchResultContainer}
                onPress={() => {
                  setVideoModal({ open: true, link: item.video });
                }}
                disabled={!item.video}>
                {item.image === '' ? (
                  <View
                    style={{
                      width: 300,
                      height: 100,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Icon
                      name="image"
                      size={40}
                      color={globalStyles.text.color}
                      style={{ textAlign: 'center' }}
                    />
                  </View>
                ) : (
                  <Image style={{ width: 300, height: 100 }} source={{ uri: item.image }} />
                )}
                <Text style={globalStyles.text}>{item.filename}</Text>
                <Text style={globalStyles.text}>{item.anilist.title.romaji}</Text>
                <Text style={globalStyles.text}>Episode {item.episode ?? '-'}</Text>
                <Text style={globalStyles.text}>
                  {moment.unix(item.from).utc(false).format('HH:mm:ss')} -{' '}
                  {moment.unix(item.to).utc(false).format('HH:mm:ss')}
                </Text>
                <Text style={globalStyles.text}>
                  {((item.similarity || 0) * 100).toFixed(2)}% Kemiripan
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <View
                  style={{
                    width: 300,
                    height: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <ActivityIndicator />
                </View>

                <Text style={globalStyles.text}>Loading...</Text>
                <Text style={globalStyles.text}>Loading...</Text>
                <Text style={globalStyles.text}>Loading...</Text>
                <Text style={globalStyles.text}>Loading...</Text>
                <Text style={globalStyles.text}>Loading...</Text>
              </>
            )}
          </View>
        )}
        extraData={isLoading}
        estimatedItemSize={207}
      />
    </View>
  );
}

function useStyles() {
  const colorScheme = useColorScheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          gap: 5,
        },
        addImage: {
          backgroundColor: colorScheme === 'dark' ? '#2e2e2e' : '#e0e0e0',
          padding: 10,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 5,
        },
        choosenImage: {
          justifyContent: 'center',
          alignSelf: 'center',
          width: '90%',
          height: 220,
          resizeMode: 'contain',
          backgroundColor: colorScheme === 'dark' ? '#222222' : '#fcfcfc',
        },
        searchResultContainer: {
          backgroundColor: colorScheme === 'dark' ? '#2b2b2b' : '#a8a8a8',
          padding: 10,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 10,
          elevation: 5,
        },
        videoModalContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        },
      }),
    [colorScheme],
  );
}

export default memo(SearchAnimeByImage);
