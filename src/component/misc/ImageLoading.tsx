import { useIsFocused } from '@react-navigation/native';
import { Image, ImageProps } from 'expo-image';
import React, { memo, useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from '@react-native-vector-icons/fontawesome';
import URL from 'url';
import AnimeLocal from '../../utils/scrapers/animeSeries';
import LoadingIndicator from './LoadingIndicator';

const ImageLoading = (props: ImageProps & { children?: React.ReactNode }) => {
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

  useLayoutEffect(() => {
    setLoading(false);
    setError(false);
  }, [source]);

  const isFocused = useIsFocused();

  return (
    <View style={[style, styles.imageBackground]}>
      {isFocused && (
        <Image
          {...restProps}
          source={
            source &&
            typeof source === 'object' &&
            'uri' in source &&
            typeof imageSourceUri === 'string'
              ? { ...source, uri: imageSourceUri }
              : source
          }
          style={[StyleSheet.absoluteFill]}
          onLoadStart={onLoadStart}
          onLoadEnd={onLoadEnd}
          onError={onError}
        />
      )}
      {children}
      {isFocused && (
        <View style={styles.overlay}>
          {loading && <LoadingIndicator size={15} />}
          {error && <Icon name="exclamation-circle" color="red" size={18} />}
        </View>
      )}
    </View>
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
