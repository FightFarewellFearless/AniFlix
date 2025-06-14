import { useIsFocused } from '@react-navigation/native';
import { ImageBackground, ImageBackgroundProps } from 'expo-image';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import URL from 'url';
import AnimeLocal from '../utils/animeLocalAPI';

const ImageLoading = (props: ImageBackgroundProps) => {
  const { source, style, children, ...restProps } = props;

  const imageSourceUri = React.useMemo(() => {
    if (
      source &&
      typeof source === 'object' &&
      !Array.isArray(source) &&
      'uri' in source &&
      source.uri
    ) {
      if (source.uri.includes('otakudesu')) {
        const withoutDomain = URL.parse(source.uri);
        return `${withoutDomain.protocol}//${AnimeLocal.BASE.domain}${withoutDomain.pathname}`;
      }
      return source.uri;
    }
    return source;
  }, [source]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const onLoadStart = useCallback(() => {
    setLoading(true);
  }, []);
  const onLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);
  const onError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(false);
    setError(false);
  }, [source]);

  const isFocused = useIsFocused();

  return (
    <ImageBackground
      {...restProps}
      source={
        !isFocused
          ? undefined
          : source &&
              typeof source === 'object' &&
              'uri' in source &&
              typeof imageSourceUri === 'string'
            ? { ...source, uri: imageSourceUri }
            : source
      }
      style={[style, styles.imageBackground]}
      onLoadStart={onLoadStart}
      onLoadEnd={onLoadEnd}
      onError={onError}>
      {children}
      {(loading || error) && (
        <View style={styles.overlay}>
          {loading && <ActivityIndicator size={25} />}
          {error && <Icon name="exclamation-circle" color="red" size={18} />}
        </View>
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  imageBackground: {
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(ImageLoading);
