import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './reduxSlice';

export default configureStore({
  reducer: {
    settings: settingsReducer,
  },
});
