import React, { Component } from 'react';
import {
  View,
  Image,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import globalStyles from '../assets/style';
import Icon from 'react-native-vector-icons/FontAwesome';

class Search extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Text style={globalStyles.text}>
          Hasil pencarian untuk: {this.props.route.params.query}
        </Text>
        {this.props.route.params.data.length > 0 ? (
          <ScrollView>
            {this.props.route.params.data.map(z => {
              return (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    marginVertical: 5,
                    backgroundColor: '#444242',
                    borderRadius: 16,
                  }}
                  key={'btn' + z.title}
                  onPress={() => {
                    this.props.navigation.dispatch(
                      StackActions.push('FromUrl', {
                        link: z.animeUrl,
                      }),
                    );
                  }}>
                  <Image
                    resizeMode="stretch"
                    key={z.title + z.episode}
                    source={{ uri: z.thumbnailUrl }}
                    style={{
                      width: 120,
                      height: 210,
                      borderTopLeftRadius: 16,
                      borderBottomLeftRadius: 16,
                      marginRight: 7,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexShrink: 1,
                        justifyContent: 'center',
                        flex: 1,
                      }}>
                      <Text style={[{ flexShrink: 1 }, globalStyles.text]}>
                        {z.title}
                      </Text>
                    </View>

                    <View style={styles.episodeInfo}>
                      <Text style={globalStyles.text}>
                        {z.episode === '' ? 'Movie' : z.episode}
                      </Text>
                    </View>

                    <View style={styles.ratingInfo}>
                      <Text style={globalStyles.text}>
                        <Icon name="star" style={{ color: 'gold' }} />{' '}
                        {z.rating}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusInfo,
                        {
                          borderColor:
                            z.status === 'Ongoing' ? '#cf0000' : '#22b422',
                        },
                      ]}>
                      <Text style={globalStyles.text}>{z.status}</Text>
                    </View>

                    <View style={styles.releaseInfo}>
                      <Text style={globalStyles.text}>
                        <Icon name="calendar" /> {z.releaseYear}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={globalStyles.text}>Tidak ada hasil!</Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  episodeInfo: {
    position: 'absolute',
    right: 5,
  },
  ratingInfo: {
    position: 'absolute',
    left: 0,
  },
  statusInfo: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  releaseInfo: {
    position: 'absolute',
    bottom: 0,
    right: 5,
  },
});

export default Search;
