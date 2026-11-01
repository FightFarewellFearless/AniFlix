import { useKeepAwake } from 'expo-keep-awake';

export const androidKeepAwake = {
  useKeepAwake: () => useKeepAwake(),
  activate: () => {
    // expo-keep-awake activates automatically when component mounts
  },
  deactivate: () => {
    // expo-keep-awake deactivates when component unmounts
  },
};

export const KeepAwake = androidKeepAwake;
export default androidKeepAwake;
