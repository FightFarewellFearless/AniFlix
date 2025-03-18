import { memo } from 'react';
import Markdown from 'react-native-marked';
import CHANGELOG from '../../../../CHANGELOG.md';

function Changelog() {
  return <Markdown value={CHANGELOG} />;
}

export default memo(Changelog);
