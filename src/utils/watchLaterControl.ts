import watchLaterJSON from '../types/watchLaterJSON';
import { DatabaseManager } from './DatabaseManager';

function controlWatchLater(action: 'add', data: watchLaterJSON): void;
function controlWatchLater(action: 'delete', index: number): void;
function controlWatchLater(action: 'add' | 'delete', data: watchLaterJSON | number) {
  if (action === 'add') {
    const watchLater: watchLaterJSON[] = JSON.parse(DatabaseManager.getSync('watchLater')!);
    watchLater.splice(0, 0, data as watchLaterJSON);
    DatabaseManager.set('watchLater', JSON.stringify(watchLater));
  } else if (action === 'delete') {
    const watchLater: watchLaterJSON[] = JSON.parse(DatabaseManager.getSync('watchLater')!);
    watchLater.splice(data as number, 1);
    DatabaseManager.set('watchLater', JSON.stringify(watchLater));
  }
}

export default controlWatchLater;
