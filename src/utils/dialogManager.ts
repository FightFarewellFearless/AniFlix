type DialogFn = React.Dispatch<React.SetStateAction<boolean>>;
type ContentFn = React.Dispatch<
  React.SetStateAction<{
    title: string;
    message: string;
    buttons: {
      text: string;
      onPress: () => void;
    }[];
  }>
>;
class DialogManager {
  static setDialogVisible: DialogFn;
  static setDialogContent: ContentFn;
  public static setupDialog(visibleFn: DialogFn, contentFn: ContentFn) {
    DialogManager.setDialogVisible = visibleFn;
    DialogManager.setDialogContent = contentFn;
  }
  public static alert(
    title: string,
    message: string,
    buttons?: { text: string; onPress?: () => void }[],
  ) {
    DialogManager.setDialogContent?.({
      title,
      message,
      buttons: buttons?.map(a => ({
        text: a.text,
        onPress: a.onPress
          ? () => {
              a.onPress?.();
              DialogManager.setDialogVisible(false);
            }
          : () => this.setDialogVisible(false),
      })) ?? [{ text: 'Ok', onPress: () => this.setDialogVisible(false) }],
    });
    DialogManager.setDialogVisible?.(true);
  }
}
export default DialogManager;
