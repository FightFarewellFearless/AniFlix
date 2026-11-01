import { ToastAndroid } from 'react-native';

export const androidToast = {
  show: (message: string, duration: number = ToastAndroid.SHORT) =>
    ToastAndroid.show(message, duration),
};

export const Toast = androidToast;
export default androidToast;
