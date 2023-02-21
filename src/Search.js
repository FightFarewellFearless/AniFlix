import React, { Component } from 'react';
import { View, Image, Text, ScrollView, TouchableOpacity } from 'react-native';
import { StackActions } from '@react-navigation/native';
import styles from './assets/style';

class Search extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>
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
                  <View
                    style={{
                      flexShrink: 1,
                      justifyContent: 'center',
                    }}>
                    <Text style={[{ flexShrink: 1 }, styles.text]}>
                      {z.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.text}>Tidak ada hasil!</Text>
        )}
      </View>
    );
  }
}

export default Search;
