import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackNavigator } from '../../types/navigation';
import FallbackComponent from './FallbackErrorBoundary';

type Props = NativeStackScreenProps<RootStackNavigator, 'ErrorScreen'>;

export default function ErrorScreen(props: Props) {
  return <FallbackComponent error={props.route.params.error} />;
}
