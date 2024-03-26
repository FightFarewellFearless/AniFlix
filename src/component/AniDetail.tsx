import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackNavigator } from "../types/navigation";
import { ImageBackground, ScrollView, StyleSheet, Text, ToastAndroid, TouchableOpacity, useColorScheme } from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import { View } from "react-native";
import Icon from 'react-native-vector-icons/FontAwesome';
import { useEffect, useState } from "react";
import { getColors } from "react-native-image-colors";
import useGlobalStyles, { darkText, lightText } from "../assets/style";
import { FlashList } from "@shopify/flash-list";
import controlWatchLater from "../utils/watchLaterControl";
import watchLaterJSON from "../types/watchLaterJSON";
import useSelectorIfFocused from "../hooks/useSelectorIfFocused";


type Props = NativeStackScreenProps<RootStackNavigator, "AnimeDetail">;
function AniDetail(props: Props) {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const data = props.route.params.data;

  const watchLaterListsJson = useSelectorIfFocused(
    state => state.settings.watchLater,
    true,
    state => JSON.parse(state) as watchLaterJSON[],
  );
  const isInList = watchLaterListsJson.some(item => item.title === data.title.replace('Subtitle Indonesia', ''));

  const [thumbnailColor, setThumbnailColor] = useState('#00000000');
  const complementThumbnailColor = complementHex(thumbnailColor);
  useEffect(() => {
    getColors(data.thumbnailUrl).then(colors => {
      if (colors.platform === 'android') {
        setThumbnailColor(colors.dominant);
      }
    })
  }, []);
  return (
    <View style={styles.container}>
      <LinearGradient style={[styles.container, styles.centerChildren]} colors={[thumbnailColor, thumbnailColor, 'transparent']}>
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[styles.title, { color: complementThumbnailColor }]}>{data.title}</Text>
          <Text style={[styles.title, { color: complementThumbnailColor, fontWeight: 'normal', fontSize: 14 }]}>{data.alternativeTitle}</Text>
        </View>
        <View style={styles.imageContainer}>
          <View style={[styles.imageContainerChild]}>
            <Text style={[styles.detailText, { color: complementThumbnailColor }]}>
              <Icon name="star" color="yellow" /> {data.rating === '' ? '-' : data.rating}{'\n'}
              <Icon name="calendar" /> {data.releaseYear + '\n'}
              <Icon name="tags" /> {data.status + '\n'}
              <Icon name="building" /> {data.studio + '\n'}
            </Text>
          </View>

          <ImageBackground source={{ uri: data.thumbnailUrl }} style={[{ height: 200, width: 135 }, styles.imageContainerChild]} resizeMode="contain">
            <TouchableOpacity disabled={isInList} style={{ position: 'absolute', bottom: 10, right: 0 }} onPress={() => {
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
            </TouchableOpacity>
          </ImageBackground>

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
        <View style={{ backgroundColor: '#0000009d', position: 'absolute', width: '100%', height: '100%' }} />
        <Text style={[styles.detailText, { color: '#d8d8d8', textAlign: 'center' }]}>
          <Icon name="quote-left" /> {data.genres.join(', ')}
        </Text>
        <ScrollView style={[styles.synopsys]}>
          <Text style={[styles.detailText, { color: '#d8d8d8', textAlign: 'center' }]}>
            {data.synopsys === '' ? 'Tidak ada sinopsis' : data.synopsys}
          </Text>
        </ScrollView>
      </ImageBackground>

      <View style={styles.container}>
        <FlashList
          estimatedItemSize={78}
          data={data.episodeList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.episodeButton} onPress={() => {
              props.navigation.navigate('FromUrl', {
                link: item.link,
              })
            }}>
              <Text style={[globalStyles.text, styles.episodeText]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => (
            <View
              style={{
                width: '100%',
                borderBottomWidth: .5,
                borderColor: colorScheme === 'dark' ? 'white' : 'black',
              }}
            />
          )}
          extraData={styles} />
      </View>
    </View>
  )
}

function useStyles() {
  const globalStyles = useGlobalStyles();
  return StyleSheet.create({
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
      textShadowOffset: { width: .5, height: .5 },
      textShadowRadius: .5,
      fontWeight: 'bold',
    },
    synopsys: {

    },
    episodeButton: {
      padding: 10,
    },
    episodeText: {
      textAlign: 'center',
      textDecorationLine: 'underline',
    },
  });
}

function complementHex(hex: string) {

  hex = hex.replace('#', '');


  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);


  const rComplement = (255 - r).toString(16).padStart(2, '0');
  const gComplement = (255 - g).toString(16).padStart(2, '0');
  const bComplement = (255 - b).toString(16).padStart(2, '0');


  return `#${rComplement}${gComplement}${bComplement}`;
}

export default AniDetail;
