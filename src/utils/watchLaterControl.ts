import { setDatabase } from '../misc/reduxSlice';
import store from '../misc/reduxStore';
import watchLaterJSON from '../types/watchLaterJSON';

function controlWatchLater(action: 'add', data: watchLaterJSON): void;
function controlWatchLater(action: 'delete', index: number): void;
function controlWatchLater(
  action: 'add' | 'delete',
  data: watchLaterJSON | number,
) {
  if (action === 'add') {
    const watchLater: watchLaterJSON[] = JSON.parse(
      store.getState().settings.watchLater,
    );
    watchLater.splice(0, 0, data as watchLaterJSON);
    store.dispatch(
      setDatabase({
        target: 'watchLater',
        value: JSON.stringify(watchLater),
      }),
    );
  } else if (action === 'delete') {
    const watchLater: watchLaterJSON[] = JSON.parse(
      store.getState().settings.watchLater,
    );
    watchLater.splice(data as number, 1);
    store.dispatch(
      setDatabase({
        target: 'watchLater',
        value: JSON.stringify(watchLater),
      }),
    );
  }
}

export default controlWatchLater;
