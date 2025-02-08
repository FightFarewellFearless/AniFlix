import { StackScreenProps, createStackNavigator } from "@react-navigation/stack"
import { UtilsStackNavigator } from "../../types/navigation";
import Chat from "./Utilitas/Chat";
import { Text, View, useColorScheme, TouchableNativeFeedback, StyleSheet, useWindowDimensions, ScrollView } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import SearchAnimeByImage from "./Utilitas/SearchAnimeByImage";
import Setting from "./Utilitas/Setting";
import Changelog from "./Utilitas/Changelog";
import About from "./Utilitas/About";
import { memo } from "react";

const Stack = createStackNavigator<UtilsStackNavigator>();

function Utils() {
  return (
    <Stack.Navigator initialRouteName="ChooseScreen">
      <Stack.Screen name="ChooseScreen" component={ChooseScreen} options={{ title: 'Pilih utilitas' }} />
      <Stack.Screen name="Chat" component={Chat} />
      <Stack.Screen name="SearchAnimeByImage" component={SearchAnimeByImage} options={{ title: 'Cari Anime dari Gambar' }} />
      <Stack.Screen name="Changelog" component={Changelog} options={{ title: 'Changelog' }} />
      <Stack.Screen name="Setting" component={Setting} options={{ title: 'Pengaturan' }} />
      <Stack.Screen name="About" component={About} options={{ title: 'Tentang' }} />
    </Stack.Navigator>
  )
}

export default memo(Utils);

function ChooseScreen(props: StackScreenProps<UtilsStackNavigator, 'ChooseScreen'>) {
  const styles = useStyles();
  return (
    <ScrollView>

      <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TouchableNativeFeedback onPress={() => {
          props.navigation.push('Chat')
        }} background={TouchableNativeFeedback.Ripple('white', false)}>
          <View style={[styles.buttonContainer, { backgroundColor: 'orange' }]}>
            <Icon name="comments" size={40} color={{ color: 'black' }.color} />
            <Text style={[styles.titleText, { color: 'black' }]}>Chat</Text>
            <Text style={[styles.descText, { color: 'black' }]}>Chat dengan AI Bing dan GPT-4</Text>
          </View>
        </TouchableNativeFeedback>

        <TouchableNativeFeedback onPress={() => {
          props.navigation.navigate('SearchAnimeByImage')
        }} background={TouchableNativeFeedback.Ripple('white', false)}>
          <View style={[styles.buttonContainer, { backgroundColor: '#3a8fac' }]}>
            <Icon name="image" size={40} color={{ color: 'black' }.color} />
            <Text style={[styles.titleText, { color: 'black' }]}>Cari anime berdasarkan gambar</Text>
            <Text style={[styles.descText, { color: 'black' }]}>Cari judul anime dari gambar screenshot.</Text>
          </View>
        </TouchableNativeFeedback>

        <TouchableNativeFeedback onPress={() => {
          props.navigation.navigate('Changelog')
        }} background={TouchableNativeFeedback.Ripple('white', false)}>
          <View style={[styles.buttonContainer, { backgroundColor: '#417e3b' }]}>
            <Icon name="history" size={40} color={{ color: '#dbdbdb' }.color} />
            <Text style={[styles.titleText, { color: '#dbdbdb' }]}>Catatan update</Text>
            <Text style={[styles.descText, { color: '#dbdbdb' }]}>Perubahan setiap update mulai dari versi 0.6.0</Text>
          </View>
        </TouchableNativeFeedback>

        <TouchableNativeFeedback onPress={() => {
          props.navigation.navigate('Setting')
        }} background={TouchableNativeFeedback.Ripple('white', false)}>
          <View style={[styles.buttonContainer, { backgroundColor: '#615e58' }]}>
            <Icon name="cog" size={40} color={{ color: '#dbdbdb' }.color} />
            <Text style={[styles.titleText, { color: '#dbdbdb' }]}>Pengaturan</Text>
            <Text style={[styles.descText, { color: '#dbdbdb' }]}>Atur aplikasi AniFlix kamu</Text>
          </View>
        </TouchableNativeFeedback>

        <TouchableNativeFeedback onPress={() => {
          props.navigation.navigate('About')
        }} background={TouchableNativeFeedback.Ripple('white', false)}>
          <View style={[styles.buttonContainer, { backgroundColor: '#166db4' }]}>
            <Icon name="info-circle" size={40} color={{ color: '#dbdbdb' }.color} />
            <Text style={[styles.titleText, { color: '#dbdbdb' }]}>Tentang aplikasi</Text>
            <Text style={[styles.descText, { color: '#dbdbdb' }]}>
              Tentang aplikasi AniFlix dan pengembangnya
            </Text>
          </View>
        </TouchableNativeFeedback>
      </View>
    </ScrollView>
  )
}

function useStyles() {
  const dimensions = useWindowDimensions();

  const colorScheme = useColorScheme();
  const GAP = 2;
  const devidedWidth = (dimensions.width - GAP) / 2;
  return StyleSheet.create({
    buttonContainer: {
      backgroundColor: colorScheme === 'dark' ? '#1b1b1b' : '#d1d1d1',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 10,
      elevation: 5,
      width: devidedWidth < 150 ? '100%' : devidedWidth,
      minWidth: 150,
    },
    titleText: {
      textAlign: 'center',
      fontWeight: 'bold',
      fontSize: 17,
    },
    descText: {
      textAlign: 'center',
    },
  });
}