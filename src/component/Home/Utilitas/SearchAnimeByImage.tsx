import { View, Text, TouchableNativeFeedback, Image, ScrollView, StyleSheet, useColorScheme } from "react-native";
import useGlobalStyles from "../../../assets/style";
import Icon from "react-native-vector-icons/FontAwesome";
import { pick } from "react-native-document-picker";
import { useState } from "react";
import { FlashList } from "@shopify/flash-list";
import moment from "moment";
moment.locale('en');
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
    }
    filename: string;
    episode: null | number;
    from: number;
    to: number;
    similarity: number;
    video: string;
    image: string;
}

export default function SearchAnimeByImage() {
    const globalStyles = useGlobalStyles();
    const [searchResult, setSearchResult] = useState<SearchResult | undefined>(undefined);
    const [choosenImage, setChoosenImage] = useState<string | undefined>(undefined);
    const styles = useStyles();
    return (
        <ScrollView style={styles.container}>
            <TouchableNativeFeedback background={TouchableNativeFeedback.Ripple('white', false)} onPress={() => {
                pick({
                    type: ['image/*'],
                }).then((result) => {
                    setChoosenImage(result[0].uri);
                    const formData = new FormData();
                    formData.append("image", result[0]);
                    fetch("https://api.trace.moe/search?anilistInfo", {
                        method: "POST",
                        body: formData,
                    }).then((e) => e.json() as Promise<SearchResult>).then(setSearchResult);
                })
            }}>
                <View style={styles.addImage}>
                    <Icon name="image" size={40} color={globalStyles.text.color} />
                    <Text style={[globalStyles.text, { textAlign: 'center' }]}>Pilih gambar</Text>
                </View>
            </TouchableNativeFeedback>
            <Text style={[globalStyles.text, { fontSize: 12 }]}>*Filter hasil dewasa aktif</Text>
            <Text style={[globalStyles.text, { fontSize: 12 }]}>**Untuk hasil maksimal pastikan gambar tidak terpotong dan tidak ada border tambahan (area gelap, video player, dan sebagainya)</Text>
            <Image source={{ uri: choosenImage }} style={styles.choosenImage} />
            <FlashList
                data={searchResult?.result.filter(val => val.anilist.isAdult === false)}
                renderItem={({ item }) => (
                    <View style={styles.searchResultContainer}>
                        <Image style={{ width: 300, height: 100 }} source={{ uri: item.image }} />
                        <Text style={globalStyles.text}>{item.filename}</Text>
                        <Text style={globalStyles.text}>{item.anilist.title.romaji}</Text>
                        <Text style={globalStyles.text}>Episode {item.episode ?? '-'}</Text>
                        <Text style={globalStyles.text}>{moment.unix(item.from).utc(false).format('HH:mm:ss')} - {moment.unix(item.to).utc(false).format('HH:mm:ss')}</Text>
                        <Text style={globalStyles.text}>{((item.similarity || 0) * 100).toFixed(2)}%</Text>
                    </View>
                )}
                estimateSize={100}
            />
        </ScrollView>
    );
}

function useStyles() {
    const colorScheme = useColorScheme();
    return StyleSheet.create({
        container: {
            flex: 1,
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
            width: '100%',
            height: 250,
            resizeMode: 'contain',
            elevation: 5,
        },
        searchResultContainer: {
            backgroundColor: colorScheme === 'dark' ? '#2b2b2b' : '#a8a8a8',
            padding: 10,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 10,
            elevation: 5,
        },
    })
}