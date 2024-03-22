import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import gpti from 'gpti';
import { ReactNode, startTransition, useCallback, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Renderer, RendererInterface, useMarkdown } from "react-native-marked";
import Reanimated, { ZoomIn } from 'react-native-reanimated';
import Icon from "react-native-vector-icons/FontAwesome";
import globalStyles, { lightText } from "../../assets/style";
import { HomeNavigator } from "../../types/navigation";
import colorScheme from "../../utils/colorScheme";
import { requestBingAI } from "../../utils/requestBingAI";
import { ViewStyle, TextStyle } from "react-native";

const defaultMessages = [{
  content: 'SISTEM: Kamu adalah AniFlix Chat, sebuah aplikasi yang dibuat oleh FightFarewellFearless (Pirles).',
  role: 'user'
}, {
  content: "Saya adalah AniFlix Chat, saya siap menjawab berbagai pertanyaan anda!",
  role: 'assistant'
}] as const;

type Props = BottomTabScreenProps<HomeNavigator, "Chat">

export interface Message {
  content: string;
  role: 'user' | 'assistant';
  source: 'Bing' | 'AniFlix' | 'Saya';
}

class CustomRenderer extends Renderer implements RendererInterface {
  code(text: string, _language?: string | undefined, containerStyle?: ViewStyle | undefined, textStyle?: TextStyle | undefined): ReactNode {
    return <Text style={[{ backgroundColor: colorScheme === 'dark' ? '#1b1b1b' : '#d1d1d1', padding: 5 }, textStyle]}>{text}</Text>;
  }
}
const customRenderer = new CustomRenderer();

function Chat(props: Props) {

  const flashList = useRef<FlatList<Message>>();

  const [messagesHistroy, setMessagesHistroy] = useState<Message[]>([]);
  const [messageLoading, setMessageLoading] = useState(false);

  const [useBingAI, setUseBingAI] = useState(false);

  const requestToGpt = useCallback((prompt: string, callback: (text: string | undefined, isBingStreaming?: boolean, isDone?: boolean) => void) => {
    if (useBingAI) {
      requestBingAI([...messagesHistroy.slice(-2), { content: prompt, role: 'user' }], (data) => {
        startTransition(() => {
          callback(data?.gpt, true, data.done);
        })
      }).catch(() => {
        callback(undefined);
      })
    }
    else {
      gpti.gpt({
        messages: [...defaultMessages, ...messagesHistroy],
        markdown: false,
        model: 'gpt-4',
        prompt,
      }, (err, data) => {
        callback(data?.gpt, false, true);
      })
    }
  }, [messagesHistroy, useBingAI]);

  const prompt = useRef('');

  const tanya = useCallback(() => {
    if (prompt.current.trim() === '') {
      return;
    }
    const delayScrollToEnd = () => setTimeout(() => {
      flashList.current?.scrollToEnd({ animated: true });
    }, 50);

    setMessagesHistroy(old => [...old, { content: prompt.current, role: 'user', source: 'Saya' }, { content: 'Mohon tunggu sebentar...', role: 'assistant', source: useBingAI ? 'Bing' : 'AniFlix' }]);  
    delayScrollToEnd();
    requestToGpt(prompt.current, (text, isBingStreaming, isDone) => {
      setMessagesHistroy(old => {
        return [...old.slice(0, -1), { content: text ?? 'TERJADI ERROR: Pastikan kamu terhubung ke internet dan coba lagi', role: 'assistant', source: useBingAI ? 'Bing' : 'AniFlix' }];
      });
      if (!isBingStreaming) delayScrollToEnd();
      if(isDone === true) setMessageLoading(false);
    });
    setMessageLoading(true);
  }, [requestToGpt]);

  return (
    <KeyboardAvoidingView behavior="height" style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#0A0A0A' : '#eeedf1' }}>
      <FlatList
        // @ts-ignore
        ref={flashList}
        ListHeaderComponent={
          <View style={styles.center}>
            <Text style={[globalStyles.text, { fontSize: 30 }]}>AniFlix</Text>
            <Icon name="comments" size={37} color="orange" />
            <Text style={[globalStyles.text, { fontSize: 30, fontWeight: 'bold' }]}>Chat (Beta) {useBingAI ? '(Bing)' : ''}</Text>
            <Switch value={useBingAI} onValueChange={setUseBingAI} />
            <Text
              style={[globalStyles.text, {
                fontSize: 19,
                textAlign: 'center',
                fontWeight: 'bold'
              }, !useBingAI ? { paddingBottom: 9 } : undefined]}>Gunakan Bing AI</Text>
            {useBingAI && (
              <Text
                style={[globalStyles.text,
                { fontSize: 15, paddingBottom: 9, color: 'orange' }]}>
                Kamu menggunakan fitur chat dari bing.
              </Text>
            )}
            <Text style={[globalStyles.text, { fontSize: 15, textAlign: 'center' }]}>AniFlix Chat adalah fitur chat yang ada di AniFlix bertujuan
              untuk memberikan pengalaman yang berbeda kepada pengguna.</Text>
            <Text style={[globalStyles.text, { fontSize: 15, textAlign: 'center' }]}>Note: AI tidak terbatas pada informasi seputar anime. Kamu bisa menanyakan apa saja ke AI.</Text>
          </View>
        }
        data={messagesHistroy}
        renderItem={({ item }) => {
          return (
            <Reanimated.View
              style={[item.role === 'user' ? styles.userResponse : styles.assistantResponse, { marginVertical: 5, maxWidth: '80%', minWidth: '40%', elevation: 3 }]}
              entering={ZoomIn}>
              <Text style={{ color: colorScheme === 'dark' ? 'lightblue' : 'darkblue', alignSelf: 'flex-start' }}>{item.source}</Text>
              <CustomMarkdown content={item.content} />
            </Reanimated.View>
          )
        }} />
      <View style={{ flexDirection: 'row' }}>
        <TextInput placeholder="Ketik sesuatu..." style={styles.textInput} multiline onChangeText={t => {
          prompt.current = t;
        }} />
        <TouchableOpacity style={styles.button} disabled={messageLoading} onPress={tanya}>
          <Text style={{ color: lightText }}>{messageLoading ? 'Loading...' : 'Kirim'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

function CustomMarkdown({ content }: { content: string }) {
  const markdown = useMarkdown(content, {
    colorScheme,
    renderer: customRenderer,
  });
  return markdown;
}

const styles = StyleSheet.create({
  textInput: {
    backgroundColor: colorScheme === 'dark' ? '#2e2e2e' : '#e0e0e0',
    padding: 10,
    borderRadius: 8,
    flex: 1,
  },
  button: {
    backgroundColor: 'orange',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantResponse: {
    backgroundColor: colorScheme === 'dark' ? '#2b2b2b' : '#a8a8a8',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  userResponse: {
    backgroundColor: colorScheme === 'dark' ? '#2b2b2b' : '#a8a8a8',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});

export default Chat;
