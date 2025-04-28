import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackNavigator } from '../../types/navigation';
import FallbackComponent from './FallbackErrorBoundary';
import SafeAreaWrapper from './SafeAreaWrapper';

type Props = NativeStackScreenProps<RootStackNavigator, 'ErrorScreen'>;

export default function ErrorScreen(props: Props) {
  return (
    <SafeAreaWrapper>
      <FallbackComponent error={props.route.params.error} />
    </SafeAreaWrapper>
  );
}
