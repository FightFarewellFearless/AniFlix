import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import defaultDatabase from './defaultDatabaseValue.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setDatabase = createAsyncThunk(
  'settings/setDatabase',
  async action => {
    const value =
      typeof action.value !== 'string'
        ? JSON.stringify(action.value)
        : action.value;
    await AsyncStorage.setItem(action.target, value);
    return { target: action.target, value };
  },
);

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: defaultDatabase,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(setDatabase.fulfilled, (state, action) => {
      const { target, value } = action.payload;
      state[target] = value;
    });
  },
});

export default settingsSlice.reducer;
