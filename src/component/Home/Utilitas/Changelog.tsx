import { memo } from 'react';
import Markdown from 'react-native-marked';
import { useTheme } from 'react-native-paper';
import CHANGELOG from '../../../../CHANGELOG.md';

function Changelog() {
  const theme = useTheme();
  return (
    <Markdown
      flatListProps={{ style: { backgroundColor: theme.colors.background } }}
      value={CHANGELOG}
    />
  );
}

export default memo(Changelog);
