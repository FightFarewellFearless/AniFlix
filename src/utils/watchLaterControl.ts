import watchLaterJSON from '../types/watchLaterJSON';
import { getState, storage } from './DatabaseManager';

function controlWatchLater(action: 'add', data: watchLaterJSON): void;
function controlWatchLater(action: 'delete', index: number): void;
function controlWatchLater(action: 'add' | 'delete', data: watchLaterJSON | number) {
  if (action === 'add') {
    const watchLater: watchLaterJSON[] = JSON.parse(getState().settings.watchLater);
    watchLater.splice(0, 0, data as watchLaterJSON);
    storage.set('watchLater', JSON.stringify(watchLater));
  } else if (action === 'delete') {
    const watchLater: watchLaterJSON[] = JSON.parse(getState().settings.watchLater);
    watchLater.splice(data as number, 1);
    storage.set('watchLater', JSON.stringify(watchLater));
  }
}

export default controlWatchLater;
