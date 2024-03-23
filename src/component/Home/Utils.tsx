import { NativeStackScreenProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { UtilsStackNavigator } from "../../types/navigation";
import Chat from "./Utilitas/Chat";
import { Text, View, useColorScheme, TouchableNativeFeedback } from "react-native";
import useGlobalStyles from "../../assets/style";
import Icon from "react-native-vector-icons/FontAwesome";
import SearchAnimeByImage from "./Utilitas/SearchAnimeByImage";

const Stack = createNativeStackNavigator<UtilsStackNavigator>();

export default function Utils() {
  return (
    <Stack.Navigator initialRouteName="ChooseScreen">
      <Stack.Screen name="ChooseScreen" component={ChooseScreen} options={{ title: 'Pilih utilitas' }} />
      <Stack.Screen name="Chat" component={Chat} />
      <Stack.Screen name="SearchAnimeByImage" component={SearchAnimeByImage} options={{ title: 'Cari Anime dari Gambar' }} />
    </Stack.Navigator>
  )
}

function ChooseScreen(props: NativeStackScreenProps<UtilsStackNavigator, 'ChooseScreen'>) {
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      <TouchableNativeFeedback style={{ flex: 1 }} onPress={() => {
        props.navigation.push('Chat')
      }} background={TouchableNativeFeedback.Ripple('white', false)}>
        <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#1b1b1b' : '#d1d1d1', justifyContent: 'center', alignItems: 'center', padding: 10, elevation: 5 }}>
          <Icon name="comments" size={40} color={globalStyles.text.color} />
          <Text style={[globalStyles.text, { textAlign: 'center' }]}>Chat</Text>
        </View>
      </TouchableNativeFeedback>

      <TouchableNativeFeedback style={{ flex: 1 }} onPress={() => {
        props.navigation.navigate('SearchAnimeByImage')
      }} background={TouchableNativeFeedback.Ripple('white', false)}>
        <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#1b1b1b' : '#d1d1d1', justifyContent: 'center', alignItems: 'center', padding: 10, elevation: 5 }}>
          <Icon name="image" size={40} color={globalStyles.text.color} />
          <Text style={[globalStyles.text, { textAlign: 'center' }]}>Cari anime berdasarkan gambar</Text>
        </View>
      </TouchableNativeFeedback>
    </View>
  )
}