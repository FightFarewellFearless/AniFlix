import CHANGELOG from '@root/CHANGELOG.md';
import { memo } from 'react';
import { Platform } from 'react-native';
import Markdown from 'react-native-marked';
import { useTheme } from 'react-native-paper';

function Changelog() {
  const theme = useTheme();
  return (
    <Markdown
      flatListProps={{
        style: { backgroundColor: theme.colors.elevation.level1 },
        scrollEnabled: !Platform.isTV,
        accessible: false,
        focusable: false,
        isTVSelectable: false,
        scrollsChildToFocus: false,
      }}
      value={CHANGELOG}
    />
  );
}

export default memo(Changelog);
