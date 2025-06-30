import { FlashList } from '@shopify/flash-list';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import moment from 'moment';
import React, { memo, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
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
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <Modal
        visible={videoModal.open}
        transparent
        animationType="fade"
        onRequestClose={() => setVideoModal({ open: false, link: '' })}>
        <View style={styles.videoModalBackdrop}>
          <View style={styles.videoModalContainer}>
            <TouchableOpacity
              onPress={() => setVideoModal({ open: false, link: '' })}
              style={styles.closeButton}>
              <MaterialIcon name="close" color="white" size={28} />
            </TouchableOpacity>
            <VideoView
              player={player}
              nativeControls={false}
              contentFit="contain"
              style={styles.videoPlayer}
            />
          </View>
        </View>
      </Modal>

      <FlashList
        data={searchResult?.result?.filter(val => val.anilist.isAdult === false)}
        ListHeaderComponent={() => {
          return (
            <>
              <View style={styles.card}>
                <TouchableNativeFeedback
                  background={TouchableNativeFeedback.Ripple(
                    colorScheme === 'dark' ? '#3a3a3a' : '#e0e0e0',
                    false,
                  )}
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
                  <View style={styles.imagePicker}>
                    <Icon
                      name="image"
                      size={32}
                      color={colorScheme === 'dark' ? '#BB86FC' : '#6200EE'}
                    />
                    <Text style={styles.imagePickerText}>Pilih Gambar</Text>
                    <Text style={styles.imagePickerSubtext}>Format: JPG, PNG</Text>
                  </View>
                </TouchableNativeFeedback>
              </View>

              <View style={styles.tipsContainer}>
                <View style={styles.tipItem}>
                  <MaterialIcon
                    name="warning"
                    size={16}
                    color={colorScheme === 'dark' ? '#FFA726' : '#FB8C00'}
                  />
                  <Text style={styles.tipText}>*Filter hasil dewasa aktif</Text>
                </View>
                <View style={styles.tipItem}>
                  <MaterialIcon
                    name="lightbulb"
                    size={16}
                    color={colorScheme === 'dark' ? '#4FC3F7' : '#039BE5'}
                  />
                  <Text style={styles.tipText}>
                    **Untuk hasil maksimal pastikan gambar tidak terpotong dan tidak ada border
                    tambahan
                  </Text>
                </View>
              </View>

              <View style={styles.imagePreviewContainer}>
                {choosenImage ? (
                  <Image
                    source={{ uri: choosenImage }}
                    style={styles.selectedImage}
                    contentFit="contain"
                  />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Icon name="image" size={48} color={colorScheme === 'dark' ? '#555' : '#aaa'} />
                    <Text style={styles.placeholderText}>Pilih gambar terlebih dahulu</Text>
                  </View>
                )}
              </View>
            </>
          );
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => item.video && setVideoModal({ open: true, link: item.video })}
            disabled={!item.video || isLoading}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={colorScheme === 'dark' ? '#BB86FC' : '#6200EE'}
                />
              </View>
            ) : (
              <>
                <View style={styles.resultHeader}>
                  {item.image ? (
                    <Image style={styles.resultImage} source={{ uri: item.image }} />
                  ) : (
                    <View style={styles.resultImagePlaceholder}>
                      <Icon name="image" size={32} color={globalStyles.text.color} />
                    </View>
                  )}
                  <View style={styles.resultTextContainer}>
                    <Text style={styles.animeTitle} numberOfLines={1} ellipsizeMode="tail">
                      {item.anilist.title.romaji || 'Unknown Title'}
                    </Text>
                    <Text style={styles.filename}>{item.filename}</Text>
                  </View>
                </View>

                <View style={styles.resultDetails}>
                  <View style={styles.detailRow}>
                    <MaterialIcon name="info" size={16} color={globalStyles.text.color} />
                    <Text style={styles.detailText}>Episode {item.episode ?? '-'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialIcon name="access-time" size={16} color={globalStyles.text.color} />
                    <Text style={styles.detailText}>
                      {moment.unix(item.from).utc(false).format('HH:mm:ss')} -{' '}
                      {moment.unix(item.to).utc(false).format('HH:mm:ss')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialIcon name="percent" size={16} color={globalStyles.text.color} />
                    <Text style={styles.detailText}>
                      {((item.similarity || 0) * 100).toFixed(2)}% Kemiripan
                    </Text>
                  </View>
                </View>
              </>
            )}
          </TouchableOpacity>
        )}
        estimatedItemSize={220}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

function useStyles() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          paddingHorizontal: 16,
          backgroundColor: isDark ? '#121212' : '#f5f5f7',
        },
        card: {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderRadius: 12,
          overflow: 'hidden',
          elevation: 2,
          marginBottom: 16,
        },
        imagePicker: {
          padding: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        imagePickerText: {
          fontSize: 18,
          fontWeight: '500',
          color: isDark ? '#E0E0E0' : '#333',
          marginTop: 4,
        },
        imagePickerSubtext: {
          fontSize: 12,
          color: isDark ? '#AAA' : '#777',
          marginTop: 2,
        },
        tipsContainer: {
          marginBottom: 16,
        },
        tipItem: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        },
        tipText: {
          fontSize: 12,
          color: isDark ? '#AAA' : '#666',
          marginLeft: 8,
          flex: 1,
        },
        imagePreviewContainer: {
          width: '100%',
          height: 128,
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderRadius: 12,
          marginBottom: 16,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          elevation: 2,
        },
        selectedImage: {
          width: '100%',
          height: '100%',
        },
        placeholderContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        },
        placeholderText: {
          fontSize: 14,
          color: isDark ? '#777' : '#AAA',
          marginTop: 12,
          textAlign: 'center',
        },
        listContent: {
          paddingBottom: 16,
        },
        resultCard: {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        resultHeader: {
          flexDirection: 'row',
          marginBottom: 12,
        },
        resultImage: {
          width: 80,
          height: 60,
          borderRadius: 6,
        },
        resultImagePlaceholder: {
          width: 80,
          height: 60,
          borderRadius: 6,
          backgroundColor: isDark ? '#2A2A2A' : '#EEE',
          justifyContent: 'center',
          alignItems: 'center',
        },
        resultTextContainer: {
          flex: 1,
          marginLeft: 12,
          justifyContent: 'center',
        },
        animeTitle: {
          fontSize: 16,
          fontWeight: 'bold',
          color: isDark ? '#E0E0E0' : '#333',
          marginBottom: 4,
        },
        filename: {
          fontSize: 12,
          color: isDark ? '#AAA' : '#777',
        },
        resultDetails: {
          marginTop: 8,
        },
        detailRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 6,
        },
        detailText: {
          fontSize: 14,
          color: isDark ? '#E0E0E0' : '#555',
          marginLeft: 8,
        },
        loadingContainer: {
          height: 120,
          justifyContent: 'center',
          alignItems: 'center',
        },
        videoModalBackdrop: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.9)',
          justifyContent: 'center',
        },
        videoModalContainer: {
          marginHorizontal: 20,
          borderRadius: 12,
          overflow: 'hidden',
        },
        videoPlayer: {
          width: '100%',
          aspectRatio: 16 / 9,
        },
        closeButton: {
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: 20,
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    [isDark],
  );
}

export default memo(SearchAnimeByImage);
