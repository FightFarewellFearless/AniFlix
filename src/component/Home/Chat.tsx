import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { HomeNavigator } from "../../types/navigation";
import { View, Text, TouchableOpacity, ToastAndroid } from "react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { useMarkdown } from "react-native-marked";
import colorScheme from "../../utils/colorScheme";
import { ScrollView } from "react-native";
import { TextInput } from "react-native";
import throttle from "../../utils/throttleFunction";
import globalStyles from "../../assets/style";

type Props = BottomTabScreenProps<HomeNavigator, "Chat">
function Chat(props: Props) {

  let messages = [
    {
      role: "assistant",
      content: "Hello! How can I help you today? 😊"
    },
    {
      role: "user",
      content: "Hi, tell me the names of the movies released in 2023."
    },
    {
      role: "assistant",
      content: "Certainly! Here are some movies that were released in 2023:\n\n1.  **About My Father** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n2.  **The Little Mermaid** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n3.  **Fast X** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n4.  **Spider-Man: Across the Spider-Verse** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n5.  **The Machine** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n6.  **Book Club: The Next Chapter** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n7.  **Guardians of the Galaxy Vol. 3** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n8.  **John Wick: Chapter 4** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n9.  **Are You There God? It's Me, Margaret** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n10.  **Evil Dead Rise** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n11.  **The Super Mario Bros. Movie** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n12.  **Love Again** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n13.  **Kandahar** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n14.  **Dungeons & Dragons: Honor Among Thieves** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n15.  **Shin Kamen Rider** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n16.  **Knights of the Zodiac** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n17.  **The Pope's Exorcist** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n18.  **Shazam! Fury of the Gods** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n19.  **All That Breathes** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n20.  **Sailor Moon Cosmos** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n21.  **Hypnotic** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n22.  **Sound of Freedom** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n23.  **The Boogeyman** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n24.  **Chicken Run: Dawn of the Nugget** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n25.  **A Lot of Nothing** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n26.  **Followers** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n27.  **Big George Foreman** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n28.  **Asterix & Obelix: The Middle Kingdom** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n29.  **Ant-Man and the Wasp: Quantumania** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n30.  **Transformers: Rise of the Beasts** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n31.  **Follow Her** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n32.  **Prom Pact** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n33.  **God Is a Bullet** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n34.  **Still: A Michael J. Fox Movie** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n35.  **Nefarious** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n36.  **Nanny Dearest** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n37.  **Monica** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n38.  **Wild Life** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n39.  **Palm Trees and Power Lines** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n40.  **What's Love Got to Do with It?** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n41.  **Creed III** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n42.  **One True Loves** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n43.  **BlackBerry** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n44.  **Suzume** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n45.  **Rock Dog 3: Battle the Beat** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n46.  **Gridman Universe** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n47.  **Digimon Adventure 02: The Beginning** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n48.  **Woman of the Photographs** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n49.  **El Tonto** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n50.  **Seriously Red** [^1^](https://editorial.rottentomatoes.com/guide/best-movies-of-2023/)\n\nI hope this helps! Let me know if you have any other questions."
    }
  ];

  const streamChat = useCallback((prompt: string, callback: (text: string | null) => void) => {
    fetch("https://nexra.aryahcr.cc/api/chat/complements", {
      //@ts-ignore
      reactNative: { textStreaming: true },
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [...messages, {
          role: "user",
          content: prompt
        }],
        conversation_style: "Balanced",
        markdown: false,
        stream: true,
        model: "Bing"
      })
    }).then(response => {
      const reader = response.body?.getReader();
      console.log(reader)
      let tmp: string | null = '';
      let err: Error | null = null;

      reader?.read().then(function processText({ done, value }) {
        if (done) {
          if (err != null) {
            console.log(err);
          } else {
            // console.log('end');
          }
          return;
        }

        const chunk = new TextDecoder().decode(value);
        const chk = chunk.toString().split('');

        chk.forEach(part => {
          if (err === null) {
            let result = null;
            let convert = "";

            try {
              convert = JSON.parse(part);
              result = part;
              tmp = null;
            } catch (e) {
              if (tmp === null) {
                tmp = part;
              } else {
                try {
                  convert = JSON.parse(tmp);
                  result = tmp;
                  tmp = null;
                } catch (e) {
                  tmp = tmp + part;
                  try {
                    convert = JSON.parse(tmp);
                    result = tmp;
                    tmp = null;
                  } catch (e) {
                    tmp = tmp;
                  }
                }
              }
            }

            if (result !== null) {
              const jsonRes = JSON.parse(result);
              if (jsonRes.code === undefined && jsonRes.status === undefined) {
                callback(jsonRes.message as string | null);
                console.log(jsonRes)
              } else {
                err = jsonRes;
              }
            }
          }
        });

        return reader.read().then(processText);
      }).catch((err) => {
        ToastAndroid.show(err.stack, ToastAndroid.SHORT);
      });
    }).catch((err) => {
      ToastAndroid.show(err.stack, ToastAndroid.SHORT);
    });
  }, []);

  const prompt = useRef('');
  const [text, setText] = useState<string>('');

  const updateThrottle = throttle((text: string | null) => {    
      if(text!==null){
        setText(text);
      }
  }, 600);

  const tanya = useCallback(() => {
    console.log(prompt.current)
    streamChat(prompt.current, (text) => {
      if(text!==null){
        setText(text);
      }
    })
  }, []);

  const markdown = useMarkdown(text, {
    colorScheme: colorScheme,
  });

  return (
    // <View>
    //   <ScrollView>
    //     {markdown}
    //   </ScrollView>
    //   <TextInput onChangeText={t => {
    //     prompt.current = t;
    //   }} />
    //   <TouchableOpacity onPress={tanya}>
    //     <Text>Tanya</Text>
    //   </TouchableOpacity>
    // </View>
    <Text style={[globalStyles.text, {
      fontWeight: 'bold',
      fontSize: 20,
      alignSelf: 'center',
    }]}>Coming soon!</Text>
  )
}
export default Chat;
