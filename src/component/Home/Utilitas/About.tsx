import { LegendList } from '@legendapp/list';
import { ImageBackground } from 'expo-image';
import { memo, useMemo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Card,
  Divider,
  List,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from 'react-native-paper';
import appPackage from '../../../../package.json';
import { JoinDiscord } from '../../Loading Screen/Connect';
import DarkOverlay from '../../misc/DarkOverlay';

const tokyo = require('../../../assets/tokyo.jpg');

const allDependencies = Object.entries({
  ...appPackage.dependencies,
  ...appPackage.devDependencies,
}).sort(([a], [b]) => a.localeCompare(b));

function About() {
  const theme = useTheme();
  const styles = useStyles();

  const renderHeader = () => (
    <View>
      <View style={styles.headerContainer}>
        <Avatar.Icon
          size={80}
          icon="information-variant"
          style={{ backgroundColor: theme.colors.primaryContainer }}
          color={theme.colors.onPrimaryContainer}
        />
        <Text variant="headlineMedium" style={styles.titleText}>
          AniFlix
        </Text>
        <Text variant="bodyMedium" style={styles.versionText}>
          {appPackage.version} • Build JS_{appPackage.OTAJSVersion}
        </Text>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Dikembangkan oleh Pirles
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodyMedium" style={{ textAlign: 'center', marginBottom: 8 }}>
            AniFlix adalah aplikasi streaming anime non-komersial yang dibangun untuk tujuan
            pembelajaran mobile development.
          </Text>
          <Text variant="bodySmall" style={{ textAlign: 'center', color: theme.colors.outline }}>
            Semua konten didapatkan dari sumber publik di internet. Kami tidak menyimpan file video
            di server kami.
          </Text>
        </Card.Content>
      </Card>

      <Text variant="titleMedium" style={styles.sectionHeader}>
        Komunitas & Kontak
      </Text>
      <Surface style={styles.surface} elevation={1}>
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text variant="bodyMedium" style={{ marginBottom: 12, textAlign: 'center' }}>
            Bergabunglah dengan server Discord kami untuk diskusi, laporan bug, atau saran fitur.
          </Text>
          <JoinDiscord />
        </View>
      </Surface>

      <Text variant="titleMedium" style={styles.sectionHeader}>
        Kredit & Sumber Daya
      </Text>
      <Surface style={styles.surface} elevation={1}>
        <List.Item
          title="Background Image"
          description="Tokyo Architecture by rawpixel"
          left={props => <List.Icon {...props} icon="image" />}
          right={props => <List.Icon {...props} icon="open-in-new" />}
          onPress={() =>
            Linking.openURL(
              'https://www.rawpixel.com/image/13191506/tokyo-architecture-cityscape-building-generated-image-rawpixel',
            )
          }
        />
        <Divider />
        <List.Item
          title="Kutipan/Quotes"
          description="Repository quotes-indonesia"
          left={props => <List.Icon {...props} icon="format-quote-close" />}
          right={props => <List.Icon {...props} icon="open-in-new" />}
          onPress={() => Linking.openURL('https://github.com/lakuapik/quotes-indonesia')}
        />
      </Surface>

      <Text variant="titleMedium" style={styles.sectionHeader}>
        Open Source Libraries
      </Text>
      <Text
        variant="bodySmall"
        style={{ marginHorizontal: 16, marginBottom: 8, color: theme.colors.onSurfaceVariant }}>
        Terima kasih kepada para pengembang library berikut:
      </Text>
    </View>
  );

  const renderFooter = () => (
    <View style={{ padding: 24, alignItems: 'center' }}>
      <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
        Made with ❤️ using React Native & Expo
      </Text>
    </View>
  );

  return (
    <ImageBackground source={tokyo} contentFit="cover" style={{ flex: 1 }}>
      <DarkOverlay transparent={0.85} />

      <LegendList
        data={allDependencies}
        estimatedItemSize={56}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        renderItem={({ item }) => {
          const [key, value] = item;
          return (
            <LibraryItem name={key} version={typeof value === 'string' ? value : String(value)} />
          );
        }}
      />
    </ImageBackground>
  );
}

const LibraryItem = memo(({ name, version }: { name: string; version: string }) => {
  const theme = useTheme();
  return (
    <Surface
      style={{ marginHorizontal: 16, marginBottom: 1, backgroundColor: theme.colors.surface }}
      elevation={0}>
      <TouchableRipple
        background={{ color: theme.colors.primaryContainer, foreground: true }}
        onPress={() => Linking.openURL(`https://www.npmjs.com/package/${name}`)}
        rippleColor={theme.colors.primaryContainer}>
        <List.Item
          title={name}
          description={version}
          titleStyle={{ fontSize: 14, fontWeight: 'bold' }}
          descriptionStyle={{ fontSize: 12, color: theme.colors.primary }}
          left={props => <List.Icon {...props} icon="npm" color={theme.colors.error} />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </TouchableRipple>
      <Divider />
    </Surface>
  );
});

function useStyles() {
  const theme = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        listContent: {
          paddingBottom: 20,
        },
        headerContainer: {
          alignItems: 'center',
          paddingVertical: 32,
        },
        titleText: {
          fontWeight: 'bold',
          marginTop: 16,
          color: theme.colors.onSurface,
        },
        versionText: {
          color: theme.colors.primary,
          marginBottom: 4,
        },
        sectionHeader: {
          paddingHorizontal: 16,
          paddingTop: 24,
          paddingBottom: 8,
          color: theme.colors.primary,
          fontWeight: 'bold',
        },
        card: {
          marginHorizontal: 16,
          backgroundColor: theme.colors.surfaceVariant,
        },
        surface: {
          marginHorizontal: 16,
          borderRadius: 12,
          backgroundColor: theme.colors.surface,
          overflow: 'hidden',
        },
      }),
    [theme],
  );
}

export default memo(About);
