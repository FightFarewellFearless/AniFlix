import React, { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, TVFocusGuideView, View } from 'react-native';

interface DialogButton {
  text: string;
  onPress: () => void;
}

interface TVDialogProps {
  visible: boolean;
  onDismiss: () => void;
  dismissableBackButton?: boolean;
  title: string;
  message: string;
  buttons: DialogButton[];
  firstDialogButtonRef?: React.RefObject<any>;
}

export const TVDialog: React.FC<TVDialogProps> = ({
  visible,
  onDismiss,
  dismissableBackButton = true,
  title,
  message,
  buttons,
  firstDialogButtonRef,
}) => {
  useEffect(() => {
    if (!visible || !dismissableBackButton) return;

    const onBackPress = () => {
      onDismiss();
      return true;
    };

    const listener = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => listener.remove();
  }, [visible, dismissableBackButton, onDismiss]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.backdrop} />
      <TVFocusGuideView
        trapFocusUp
        trapFocusDown
        trapFocusLeft
        trapFocusRight
        style={styles.dialogContainer}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.contentContainer}>
          <Text style={styles.message}>{message}</Text>
        </View>

        <View style={styles.actionsContainer}>
          {buttons.map((button, index) => (
            <Pressable
              key={index}
              ref={index === 0 ? firstDialogButtonRef : undefined}
              hasTVPreferredFocus={index === 0 && visible}
              onPress={() => {
                button.onPress();
                onDismiss();
              }}
              style={({ focused }) => [styles.button, focused && styles.buttonFocused]}>
              {({ focused }) => (
                <Text style={[styles.buttonText, focused && styles.buttonTextFocused]}>
                  {button.text.toUpperCase()}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      </TVFocusGuideView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  dialogContainer: {
    width: '60%',
    maxWidth: 540,
    backgroundColor: '#2b2b2b',
    borderRadius: 28,
    padding: 24,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  contentContainer: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#e0e0e0',
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  buttonFocused: {
    backgroundColor: '#ffffff',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#bb86fc',
  },
  buttonTextFocused: {
    color: '#121212',
  },
});
