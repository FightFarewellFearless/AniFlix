import { createAsyncThunk, createSlice, Slice } from '@reduxjs/toolkit';
import { SetDatabaseTarget } from '../types/redux';
import { storage } from '../utils/DatabaseManager';
import defaultDatabase from './defaultDatabaseValue.json';
import { AppDispatch, RootState } from './reduxStore';

export const setDatabase = createAsyncThunk<
  {
    target: SetDatabaseTarget;
    value: string;
  },
  {
    target: SetDatabaseTarget;
    value: any;
  },
  {
    dispatch: AppDispatch;
    state: RootState;
  }
>('settings/setDatabase', async action => {
  const value = typeof action.value !== 'string' ? JSON.stringify(action.value) : action.value;
  storage.set(action.target, value);
  return { target: action.target, value };
});

export const settingsSlice: Slice<typeof defaultDatabase, {}, 'settings'> = createSlice({
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
