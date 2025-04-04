import React, { memo, startTransition, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ImageBackgroundProps,
  View,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import URL from 'url';
import AnimeLocal from '../utils/animeLocalAPI';

const ImageLoading = (props: ImageBackgroundProps) => {
  const { source, style, children, ...restProps } = props;

  const imageSourceUri = React.useMemo(() => {
    if (typeof source === 'object' && !Array.isArray(source) && source.uri) {
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
    startTransition(() => {
      setLoading(true);
    });
  }, []);
  const onLoadEnd = useCallback(() => {
    startTransition(() => {
      setLoading(false);
    });
  }, []);
  const onError = useCallback(() => {
    startTransition(() => {
      setError(true);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    startTransition(() => {
      setLoading(false);
      setError(false);
    });
  }, [source]);

  return (
    <ImageBackground
      {...restProps}
      source={
        typeof source === 'object' && 'uri' in source && typeof imageSourceUri === 'string'
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
          {loading && <ActivityIndicator />}
          {error && <Icon name="exclamation-circle" />}
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
