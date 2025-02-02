import gpti from 'gpti';
import { ReactNode, useTransition, useCallback, useEffect, useRef, useState } from "react";
import { FlatList, StyleSheet, Switch, Text, TextInput, View, useColorScheme } from "react-native";
import { TouchableOpacity } from 'react-native'; //rngh
import { Renderer, RendererInterface, useMarkdown } from "react-native-marked";
import Reanimated, { ZoomIn } from 'react-native-reanimated';
import Icon from "react-native-vector-icons/FontAwesome";
import useGlobalStyles, { lightText } from "../../../assets/style";
import { UtilsStackNavigator } from "../../../types/navigation";
import { requestBingAI } from "../../../utils/requestBingAI";
import { ViewStyle, TextStyle } from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import React from 'react';

const defaultMessages = [{
  content: 'SISTEM: Kamu adalah AniFlix Chat, sebuah aplikasi yang dibuat oleh FightFarewellFearless (Pirles).',
  role: 'user'
}, {
  content: "Saya adalah AniFlix Chat, saya siap menjawab berbagai pertanyaan anda!",
  role: 'assistant'
}] as const;

type Props = StackScreenProps<UtilsStackNavigator, "Chat">

export interface Message {
  content: string;
  role: 'user' | 'assistant';
  source: 'Bing' | 'AniFlix' | 'Saya';
}

class CustomRenderer extends Renderer implements RendererInterface {
  code(text: string, _language?: string | undefined, containerStyle?: ViewStyle | undefined, textStyle?: TextStyle | undefined): ReactNode {
    return <TextCode text={text} textStyle={textStyle} />;
  }
}
function TextCode(props: { text: string, textStyle?: TextStyle | undefined }) {
  const colorScheme = useColorScheme();
  return <Text style={[{ backgroundColor: colorScheme === 'dark' ? '#1b1b1b' : '#d1d1d1', padding: 5 }, props.textStyle]}>{props.text}</Text>
}
const customRenderer = new CustomRenderer();

function Chat(_props: Props) {
  const [isPending, startTransition] = useTransition();

  const styles = useStyles();
  const globalStyles = useGlobalStyles();
  const colorScheme = useColorScheme();

  const flashList = useRef<FlatList<Message>>();

  const [messagesHistroy, setMessagesHistroy] = useState<Message[]>([]);
  const [messageLoading, setMessageLoading] = useState(false);

  const [useBingAI, setUseBingAI] = useState(false);
  const [bingAbortRequest] = useState(() => new AbortController());

  useEffect(() => {
    return () => {
      bingAbortRequest.abort();
    }
  }, []);

  const requestToGpt = useCallback((prompt: string, callback: (text: string | undefined, isBingStreaming?: boolean, isDone?: boolean) => void) => {
    if (useBingAI) {
      requestBingAI([...messagesHistroy.slice(-2), { content: prompt, role: 'user' }], (data) => {
        startTransition(() => {
          callback(data?.gpt, true, data.done);
        })
      }, bingAbortRequest.signal).catch((err) => {
        if(err.name === 'AbortError') {
          return;
        }
        callback(undefined);
      })
    }
    else {
      gpti.gpt.v1({
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
    <View style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#0A0A0A' : '#eeedf1' }}>
      <FlatList
        // @ts-ignore
        ref={flashList}
        ListHeaderComponent={
          <View style={styles.center}>
            <Text style={[globalStyles.text, { fontSize: 30 }]}>AniFlix</Text>
            <Icon name="comments" size={37} color="orange" />
            <Text style={[globalStyles.text, { fontSize: 30, fontWeight: 'bold' }]}>Chat (Beta) {useBingAI ? '(Bing)' : ''}</Text>
            <Switch trackColor={{ false: '#767577', true: 'orange' }} thumbColor={colorScheme === 'dark' ? '#f5dd4b' : '#f4f3f4'} value={useBingAI} onValueChange={setUseBingAI} />
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
        extraData={styles}
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
      <View style={{ flexDirection: 'row', maxHeight: '30%' }}>
        <TextInput placeholder="Ketik sesuatu..." style={[styles.textInput, {borderWidth: 1, borderColor: '#0099ff'}]} multiline onChangeText={t => {
          prompt.current = t;
        }} />
        <TouchableOpacity style={styles.button} /* //rngh - containerStyle */ disabled={messageLoading} onPress={tanya}>
          <Text style={{ color: lightText }}>{messageLoading ? 'Loading...' : 'Kirim'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function CustomMarkdown({ content }: { content: string }) {
  const colorScheme = useColorScheme();
  const markdown = useMarkdown(content, {
    colorScheme,
    renderer: customRenderer,
  });
  return <>{markdown}</>;
}

function useStyles() {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    textInput: {
      backgroundColor: colorScheme === 'dark' ? '#1f1e1e' : '#f5f5f5',
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
}

export default Chat;
