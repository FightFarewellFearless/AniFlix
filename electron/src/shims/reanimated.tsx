import React from 'react';
import { FlatList, Image, ScrollView, Text, View } from 'react-native';

export type SharedValue<T> = {
  value: T;
  get: () => T;
  set: (value: T) => void;
};

export type AnimatedStyle<T = any> = T;

export const useSharedValue = <T,>(initial: T): SharedValue<T> => {
  const ref = React.useRef<SharedValue<T> | null>(null);
  if (!ref.current) {
    let internal = initial;
    ref.current = {
      get value() {
        return internal;
      },
      set value(v: T) {
        internal = v;
      },
      get: () => internal,
      set: next => (internal = next),
    };
  }
  return ref.current;
};

export const useDerivedValue = <T,>(factory: () => T) => ({
  get: factory,
  set: () => undefined,
  get value() {
    return factory();
  },
});

export const useAnimatedStyle = (factory: () => unknown) => {
  return React.useMemo(() => {
    try {
      return factory() || {};
    } catch {
      return {};
    }
  }, [factory]);
};

export const useAnimatedProps = (factory: () => unknown) => {
  return React.useMemo(() => {
    try {
      return factory() || {};
    } catch {
      return {};
    }
  }, [factory]);
};

export const useAnimatedRef = <T = any,>() => {
  const ref = React.useRef<T>(null) as any;
  ref.current = ref.current || null;
  return ref;
};

export const useAnimatedReaction = (
  prepare: () => any,
  react: (result: any, previous: any) => void,
  dependencies?: any[],
) => {
  const prevRef = React.useRef<any>(undefined);
  React.useEffect(() => {
    try {
      const res = prepare();
      react(res, prevRef.current);
      prevRef.current = res;
    } catch {
      // ignore
    }
  }, dependencies || []);
};

export const useAnimatedScrollHandler = () => undefined;
export const useScrollOffset = (_ref?: any) => {
  return useSharedValue(0);
};

export const useEvent = () => undefined;
export const useHandler = () => ({ context: {}, doDependenciesDiffer: false });
export const runOnJS = (callback: (...args: any[]) => any) => callback;
export const runOnUI = (callback: (...args: any[]) => any) => callback;
export const withTiming = <T,>(value: T, _config?: any, callback?: (finished?: boolean) => void) => {
  if (callback) {
    setTimeout(() => callback(true), 0);
  }
  return value;
};
export const withSpring = <T,>(value: T, _config?: any, callback?: (finished?: boolean) => void) => {
  if (callback) {
    setTimeout(() => callback(true), 0);
  }
  return value;
};
export const withDelay = <T,>(_delay: number, value: T) => value;
export const withRepeat = <T,>(value: T) => value;
export const withSequence = <T,>(...values: T[]) => values[values.length - 1];
export const cancelAnimation = () => undefined;
export const scrollTo = () => undefined;
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};
export const Extrapolate = Extrapolation;

export const interpolate = (
  value: number,
  input: number[],
  output: number[],
  type?: any,
) => {
  if (!input || !output || input.length < 2 || output.length < 2) {
    return output?.[0] ?? value;
  }
  const minInput = input[0];
  const maxInput = input[input.length - 1];

  let clampedValue = value;
  if (
    type === 'clamp' ||
    type?.extrapolateLeft === 'clamp' ||
    type?.extrapolateRight === 'clamp' ||
    type === Extrapolation.CLAMP
  ) {
    clampedValue = Math.min(Math.max(value, minInput), maxInput);
  }

  // Find interval
  for (let i = 0; i < input.length - 1; i++) {
    const x0 = input[i];
    const x1 = input[i + 1];
    const y0 = output[i];
    const y1 = output[i + 1];

    if (clampedValue <= x1 || i === input.length - 2) {
      if (x1 === x0) return y0;
      const progress = (clampedValue - x0) / (x1 - x0);
      return y0 + progress * (y1 - y0);
    }
  }

  return output[output.length - 1];
};

export const Easing = {
  linear: (value: number) => value,
  ease: (value: number) => value,
  in: (fn: any) => fn,
  out: (fn: any) => fn,
  inOut: (fn: any) => fn,
  bezier: () => (value: number) => value,
};

export const ReduceMotion = { Never: 'never', Always: 'always', System: 'system' };

const makeAnimationPreset = () => {
  const handler: any = {
    duration: () => chain,
    springify: () => chain,
    delay: () => chain,
    damping: () => chain,
    stiffness: () => chain,
    mass: () => chain,
    overshootClamping: () => chain,
    restDisplacementThreshold: () => chain,
    restSpeedThreshold: () => chain,
    withInitialValues: () => chain,
    build: () => ({}),
  };
  const chain: any = new Proxy(handler, {
    get: (target, prop) => {
      if (prop in target) return target[prop];
      return () => chain;
    },
  });
  return chain;
};

export const FadeIn = makeAnimationPreset();
export const FadeInRight = makeAnimationPreset();
export const FadeInLeft = makeAnimationPreset();
export const FadeInUp = makeAnimationPreset();
export const FadeInDown = makeAnimationPreset();
export const FadeOut = makeAnimationPreset();
export const FadeOutRight = makeAnimationPreset();
export const FadeOutLeft = makeAnimationPreset();
export const FadeOutUp = makeAnimationPreset();
export const FadeOutDown = makeAnimationPreset();
export const LinearTransition = makeAnimationPreset();
export const ZoomIn = makeAnimationPreset();
export const ZoomInRotate = makeAnimationPreset();
export const ZoomOut = makeAnimationPreset();
export const ZoomOutRotate = makeAnimationPreset();
export const SlideInRight = makeAnimationPreset();
export const SlideInLeft = makeAnimationPreset();
export const SlideInUp = makeAnimationPreset();
export const SlideInDown = makeAnimationPreset();
export const SlideOutRight = makeAnimationPreset();
export const SlideOutLeft = makeAnimationPreset();
export const SlideOutUp = makeAnimationPreset();
export const SlideOutDown = makeAnimationPreset();
export const BounceIn = makeAnimationPreset();
export const BounceOut = makeAnimationPreset();
export const Layout = makeAnimationPreset();
export const Keyframe = class {
  constructor(_defs: any) {}
  duration() {
    return this;
  }
  delay() {
    return this;
  }
};

export const createAnimatedComponent = <P extends object>(
  Component: React.ComponentType<P>,
): React.ComponentType<P> => {
  const AnimatedComponent = React.forwardRef<any, P>((props, ref) => {
    return <Component {...props} ref={ref} />;
  });
  AnimatedComponent.displayName = `Animated(${
    Component.displayName || Component.name || 'Component'
  })`;
  return AnimatedComponent as any;
};

const Reanimated = {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  createAnimatedComponent,
};

export { Reanimated as Animated };
export default Reanimated;
