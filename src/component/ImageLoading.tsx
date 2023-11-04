import React, { useState, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  ImageBackground,
  ImageBackgroundProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

function ImageLoading(props: ImageBackgroundProps) {
  const lastLink = useRef(props.source);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  if (lastLink.current !== props.source) {
    lastLink.current = props.source;
    setLoading(false);
    setError(false);
  }

  return (
    <View style={[props.style, { overflow: 'hidden' }]}>
      <ImageBackground
        {...props}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setError(true);
          setLoading(false);
        }}>
        {props.children}
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {loading && <ActivityIndicator />}
          {error && <Icon name="exclamation-circle" />}
        </View>
      </ImageBackground>
    </View>
  );
}

export default ImageLoading;
