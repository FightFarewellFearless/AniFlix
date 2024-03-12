import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { FlashList } from "@shopify/flash-list";
import gpti from 'gpti';
import { useCallback, useRef, useState } from "react";
import { KeyboardAvoidingView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useMarkdown } from "react-native-marked";
import Reanimated, { ZoomIn } from 'react-native-reanimated';
import Icon from "react-native-vector-icons/FontAwesome";
import globalStyles, { lightText } from "../../assets/style";
import { HomeNavigator } from "../../types/navigation";
import colorScheme from "../../utils/colorScheme";

const defaultMessages = [{
  content: 'SISTEM: Kamu adalah AniFlix Chat, sebuah aplikasi yang dibuat oleh FightFarewellFearless (Pirles).',
  role: 'user'
}, {
  content: "Saya adalah AniFlix Chat, saya siap menjawab berbagai pertanyaan anda!",
  role: 'assistant'
}] as const;

type Props = BottomTabScreenProps<HomeNavigator, "Chat">

interface Message {
  content: string;
  role: 'user' | 'assistant';
}

function Chat(props: Props) {

  const flashList = useRef<FlashList<Message>>();

  const [messagesHistroy, setMessagesHistroy] = useState<Message[]>([]);
  const [messageLoading, setMessageLoading] = useState(false);

  const [useGptWeb, setUseGptWeb] = useState(false);

  const requestToGpt = useCallback((prompt: string, callback: (text: string | undefined) => void) => {
    if(useGptWeb) {
      gpti.gptweb({
        prompt: 'Respon menggunakan bahasa indonesia.\n\n' + prompt,
        markdown: false,
      }, (err, data) => {
        callback(data?.gpt);
      })
    }
    else {
      gpti.gpt({
        messages: [...defaultMessages, ...messagesHistroy],
        markdown: false,
        model: 'gpt-4',
        prompt,
      }, (err, data) => {
        callback(data?.gpt);
      })
    }
  }, [messagesHistroy, useGptWeb]);

  const prompt = useRef('');

  const tanya = useCallback(() => {
    if(prompt.current.trim() === '') {
      return;
    }
    const delayScrollToEnd = () => setTimeout(() => {
      flashList.current?.scrollToEnd({ animated: true });
    }, 50);

    setMessagesHistroy(old => [...old, { content: prompt.current, role: 'user' }, { content: 'Mohon tunggu sebentar...', role: 'assistant' }]);
    delayScrollToEnd();
    requestToGpt(prompt.current, (text) => {
      setMessagesHistroy(old => {
        old.pop();
        return [...old, { content: text ?? 'TERJADI ERROR: Pastikan kamu terhubung ke internet dan coba lagi', role: 'assistant' }]
      });
      delayScrollToEnd();
      setMessageLoading(false);
    });
    setMessageLoading(true);
  }, [requestToGpt]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      <FlashList
        // @ts-ignore
        ref={flashList}
        ListHeaderComponent={
          <View style={styles.center}>
            <Text style={[globalStyles.text, { fontSize: 30 }]}>AniFlix</Text>
            <Icon name="comments" size={37} color="orange" />
            <Text style={[globalStyles.text, { fontSize: 30, fontWeight: 'bold' }]}>Chat (Beta) {useGptWeb ? '(Web)' : ''}</Text>
             <Switch value={useGptWeb} onValueChange={setUseGptWeb} />
             <Text
              style={[globalStyles.text, {
                fontSize: 19,
                textAlign: 'center',
                fontWeight: 'bold' }, !useGptWeb ? { paddingBottom: 9 } : undefined]}>Aktifkan pencarian web</Text>
             {useGptWeb && (
               <Text
                style={[globalStyles.text, 
                  { fontSize: 15, paddingBottom: 9, color: 'orange' }]}>
                    Pencarian web aktif, kamu akan mendapatkan respon yang lebih terkini tetapi chat history tidak akan bekerja
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
              style={[item.role === 'user' ? styles.userResponse : styles.assistantResponse, { marginVertical: 5, maxWidth: '80%' }]}
              entering={ZoomIn}>
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
