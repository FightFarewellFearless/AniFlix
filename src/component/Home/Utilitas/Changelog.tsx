import CHANGELOG from '@root/CHANGELOG.md';
import { memo } from 'react';
import Markdown from 'react-native-marked';
import { useTheme } from 'react-native-paper';

function Changelog() {
  const theme = useTheme();
  return (
    <Markdown
      flatListProps={{ style: { backgroundColor: theme.colors.elevation.level1 } }}
      value={CHANGELOG}
    />
  );
}

export default memo(Changelog);
