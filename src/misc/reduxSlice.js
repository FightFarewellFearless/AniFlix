import { createSlice } from '@reduxjs/toolkit';
import defaultDatabase from './defaultDatabaseValue.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: defaultDatabase,
  reducers: {
    setDatabase(state, act) {
      const action = act.payload;
      const value =
        typeof action.value !== 'string'
          ? JSON.stringify(action.value)
          : action.value;
      // i know side effect is not allow. so i'll change this line letter
      AsyncStorage.setItem(action.target, value);
      state[action.target] = value;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setDatabase } = settingsSlice.actions;

export default settingsSlice.reducer;
