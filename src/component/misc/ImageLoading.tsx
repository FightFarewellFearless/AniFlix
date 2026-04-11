import Icon from '@react-native-vector-icons/fontawesome';
import { useIsFocused } from '@react-navigation/native';
import React, { memo, useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Image,
  ImageProps,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
} from 'react-native';
import Reanimated, { AnimatedStyle } from 'react-native-reanimated';
import URL from 'url';
import { generateUrlWithLatestDomain } from '../../utils/domainChanger';
import { BASE } from '../../utils/scrapers/animeSeries';
import { BASE_URL } from '../../utils/scrapers/comics1';
import LoadingIndicator from './LoadingIndicator';

const ImageLoading = (
  props: ImageProps & {
    children?: React.ReactNode;
    style?: StyleProp<AnimatedStyle<StyleProp<ImageStyle>>>;
    displayLoading?: boolean;
  },
) => {
  const { source, style, children, displayLoading = true, ...restProps } = props;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const onLoadStart = useCallback(() => setLoading(true), []);
  const onLoadEnd = useCallback(() => setLoading(false), []);
  const onError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  useLayoutEffect(() => {
    setLoading(false);
    setError(false);
  }, [source]);

  const isFocused = useIsFocused();

  const resolvedSource = useMemo<ImageSourcePropType | undefined>(() => {
    if (!source) return source;

    if (typeof source === 'number') return source;

    const activeSource = Array.isArray(source) ? source[0] : source;
    let baseSourceObj: any = {};

    if (typeof activeSource === 'string') {
      baseSourceObj = { uri: activeSource };
    } else if (typeof activeSource === 'object' && activeSource !== null) {
      baseSourceObj = { ...activeSource };
    } else {
      return source as ImageSourcePropType;
    }

    if (typeof baseSourceObj.uri === 'string') {
      if (typeof source === 'object' && !Array.isArray(source)) {
        if (baseSourceObj.uri.includes('otakudesu')) {
          const withoutDomain = URL.parse(baseSourceObj.uri);
          baseSourceObj.uri = `${withoutDomain.protocol}//${BASE.domain}${withoutDomain.pathname}`;
        } else {
          try {
            // fix invalid url crash
            baseSourceObj.uri = generateUrlWithLatestDomain(baseSourceObj.uri);
          } catch {}
        }
      }
    }

    let computedHeaders: Record<string, string> = { ...baseSourceObj.headers };

    if (typeof baseSourceObj.uri === 'string' && baseSourceObj.uri.includes('softkomik')) {
      computedHeaders.Referer = BASE_URL;
    }

    if (Object.keys(computedHeaders).length > 0) {
      baseSourceObj.headers = computedHeaders;
    } else {
      delete baseSourceObj.headers;
    }

    return baseSourceObj as ImageSourcePropType;
  }, [source]);

  return (
    <Reanimated.View style={[style, styles.imageBackground]}>
      {isFocused && (
        <Image
          fadeDuration={200}
          {...restProps}
          source={resolvedSource}
          style={[StyleSheet.absoluteFill]}
          onLoadStart={onLoadStart}
          onLoadEnd={onLoadEnd}
          onError={onError}
        />
      )}
      {children}
      {isFocused && (
        <View style={styles.overlay}>
          {loading && displayLoading && <LoadingIndicator size={15} />}
          {error && displayLoading && <Icon name="exclamation-circle" color="red" size={18} />}
        </View>
      )}
    </Reanimated.View>
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
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
});

export default memo(ImageLoading);
