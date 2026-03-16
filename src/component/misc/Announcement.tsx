import { useEffect, useMemo, useState } from 'react';
import { BackHandler, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Markdown from 'react-native-marked';
import { Button, Modal, Portal, useTheme } from 'react-native-paper';
import useGlobalStyles from '../../assets/style';

export default function Announcement() {
  const [modalVisible, setModalVisible] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  const dimensions = useWindowDimensions();
  const globalStyles = useGlobalStyles();
  const styles = useStyles();
  const theme = useTheme();

  useEffect(() => {
    fetch(
      'https://raw.githubusercontent.com/FightFarewellFearless/AniFlix/refs/heads/master/Announcement.md',
    )
      .then(async data => {
        if (!data.ok) return;
        const text = await data.text();
        if (text.trim() === '') return;
        setAnnouncementText(text);
        setModalVisible(true);
      })
      // silent error
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (modalVisible) {
      const event = BackHandler.addEventListener('hardwareBackPress', () => {
        setModalVisible(false);
      });
      return event.remove;
    }
  }, [modalVisible]);

  return (
    <Portal>
      <Modal visible={modalVisible} contentContainerStyle={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={styles.container}>
            <View style={styles.contentContainer}>
              <View style={styles.contentInnerContainer}>
                <View style={styles.header}>
                  <Text
                    style={[
                      globalStyles.text,
                      { flex: 1, textAlignVertical: 'center' },
                      styles.headerText,
                    ]}>
                    Pemberitahuan
                  </Text>
                </View>
                <View style={styles.content}>
                  <Markdown
                    flatListProps={{
                      style: {
                        backgroundColor: theme.colors.elevation.level0,
                        maxHeight: dimensions.height * 0.6,
                      },
                    }}
                    value={announcementText}
                  />
                </View>
                <Button
                  mode="contained"
                  icon="close"
                  onPress={() => {
                    setModalVisible(false);
                  }}>
                  Tutup
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

function useStyles() {
  const theme = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        width: '90%',
        justifyContent: 'center',
      },
      contentContainer: {
        backgroundColor: theme.colors.elevation.level1,
        padding: 12,
        borderRadius: 6,
      },
      contentInnerContainer: {
        padding: 2,
        borderWidth: 1,
        borderColor: theme.colors.primary,
      },
      header: {
        minHeight: '15%',
        flexDirection: 'row',
        backgroundColor: theme.colors.outlineVariant,
      },
      headerText: {
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 28,
      },
      content: {},
    });
  }, [theme]);
}
