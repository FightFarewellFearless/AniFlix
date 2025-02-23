import Markdown from 'react-native-marked';
import CHANGELOG from '../../../../CHANGELOG.md';
import { memo } from 'react';

function Changelog() {
  return <Markdown value={CHANGELOG} />;
}

export default memo(Changelog);
