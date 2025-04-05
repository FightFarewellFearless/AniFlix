import { memo, useMemo } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

export default memo(SupportDev);
function SupportDev() {
  const styles = useStyles();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcon name="hand-heart-outline" size={35} style={styles.headerIcon} />
        <Text style={styles.headerTitle}>Beri dukungan kepada developer</Text>
        <Text adjustsFontSizeToFit style={styles.headerDesc}>
          AniFlix akan tetap gratis, open-source, dan tanpa iklan. Namun, pengembang telah
          menginvestasikan waktu dan tenaga untuk menciptakannya. Jika kamu ingin mendukung
          pengembang sekaligus membantu kelangsungan aplikasi ini, ada dua cara yang bisa kamu pilih
          untuk memberikan dukungan.
        </Text>
      </View>
      <View style={styles.partContainer}>
        <Text style={styles.partTitle}>
          <MaterialCommunityIcon name="wallet-giftcard" size={20} /> Melalui donasi (via Saweria
          atau Trakteer)
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 15,
            gap: 15,
          }}>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL('https://saweria.co/pirles');
            }}
            style={styles.donationButton}>
            <MaterialCommunityIcon name="wallet" size={40} color="#f54f02" />
            <Text style={styles.donationButtonText}>Saweria</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL('https://trakteer.id/pirles');
            }}
            style={styles.donationButton}>
            <MaterialCommunityIcon name="cash-check" size={40} color="#f54f02" />
            <Text style={styles.donationButtonText}>Trakteer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.partContainer, { marginTop: 10 }]}>
        <Text style={styles.partTitle}>
          <MaterialCommunityIcon name="microsoft-visual-studio-code" size={20} /> Melalui kontribusi
          kode sumber
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardDesc}>
            Aplikasi ini bersifat open-source dan dikembangkan secara kolaboratif. Jika kamu ingin
            berkontribusi, kamu dapat melakukan fork repositori, melakukan perubahan, dan
            mengirimkan pull request. Kontribusimu akan sangat membantu pengembangan aplikasi ini
            agar tetap berkualitas.
          </Text>
          <TouchableOpacity
            onPress={() => {
              Linking.openURL('https://github.com/FightFarewellFearless/aniflix');
            }}
            style={styles.cardButton}>
            <Text style={styles.cardButtonText}>Kunjungi Repository</Text>
          </TouchableOpacity>
          <Text style={styles.cardAuthor}>Author: FightFarewellFearless AKA Pirles</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function useStyles() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
      },
      header: {
        paddingVertical: 25,
        paddingHorizontal: 10,
        backgroundColor: '#633697',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 20,
        borderRadius: 15,
        boxShadow: [
          {
            offsetX: -1,
            offsetY: -2,
            blurRadius: '10px',
            spreadDistance: '2px',
            color: 'rgb(112, 32, 204)',
          },
        ],
      },
      headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
      },
      headerDesc: {
        color: 'white',
        textAlign: 'justify',
      },
      headerIcon: {
        color: 'white',
        backgroundColor: '#dddddd96',
        padding: 15,
        borderRadius: 150,
      },
      partContainer: {
        flex: 0.5,
      },
      partTitle: {
        color: !isDark ? 'black' : 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textDecorationStyle: 'dashed',
        textDecorationLine: 'underline',
      },
      donationButton: {
        backgroundColor: !isDark ? '#fff' : '#333',
        borderRadius: 10,
        width: '45%',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: [
          {
            offsetX: -1,
            offsetY: -2,
            blurRadius: '10px',
            spreadDistance: '1px',
            color: 'rgb(158, 161, 193)',
          },
        ],
        elevation: 3,
      },
      donationButtonText: {
        fontWeight: 'bold',
        color: isDark ? '#ffffff' : 'black',
      },
      card: {
        backgroundColor: !isDark ? '#fff' : '#333',
        borderRadius: 10,
        padding: 15,
        marginTop: 10,
        boxShadow: [
          {
            offsetX: -1,
            offsetY: -2,
            blurRadius: '10px',
            spreadDistance: '1px',
            color: 'rgb(158, 161, 193)',
          },
        ],
        elevation: 3,
      },
      cardDesc: {
        color: isDark ? '#ffffff' : 'black',
        marginBottom: 10,
      },
      cardButton: {
        backgroundColor: '#633697',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
      },
      cardButtonText: {
        color: '#fff',
        fontWeight: 'bold',
      },
      cardAuthor: {
        textAlign: 'center',
        color: isDark ? '#ffffff' : 'black',
        fontStyle: 'italic',
      },
    });
  }, [isDark]);
}
