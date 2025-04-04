import React, { memo, useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ImageBackgroundProps, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import URL from 'url';
import AnimeLocal from '../utils/animeLocalAPI';

function ImageLoading(props: ImageBackgroundProps) {
  let imageSourceUri =
    typeof props.source === 'object' && !Array.isArray(props.source)
      ? props.source.uri
      : props.source;
  if (
    typeof props.source === 'object' &&
    !Array.isArray(props.source) &&
    props.source.uri?.includes('otakudesu')
  ) {
    const withoutDomain = URL.parse(props.source.uri);
    imageSourceUri =
      withoutDomain.protocol + '//' + AnimeLocal.BASE.domain + withoutDomain.pathname;
  }

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
    // reset the state. useful on recycledView
    setLoading(false);
    setError(false);
  }, [props.source]);

  return (
    <ImageBackground
      {...props}
      source={
        typeof props.source === 'object' &&
        'uri' in props.source &&
        typeof imageSourceUri === 'string'
          ? { ...props.source, uri: imageSourceUri }
          : props.source
      }
      style={[props.style, { overflow: 'hidden' }]}
      onLoadStart={onLoadStart}
      onLoadEnd={onLoadEnd}
      onError={onError}>
      {props.children}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {loading && <ActivityIndicator />}
        {error && <Icon name="exclamation-circle" />}
      </View>
    </ImageBackground>
  );
}

export default memo(ImageLoading);
