// @ts-nocheck
import { Message } from "../component/Home/Chat";
export function requestBingAI(messages: Omit<Message, 'source'>[], cb: (data: { gpt: string; original: null | string; status: boolean; code: number; done?: boolean }) => any) {
  
    return fetch("https://nexra.aryahcr.cc/api/chat/complements", {
        //@ts-ignore
        reactNative: { textStreaming: true },
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: messages,
            conversation_style: "Creative",
            markdown: false,
            stream: true,
            model: "Bing"
        })
    }).then(response => {
        const reader = response.body.getReader();
        let tmp = '';
        let nowResult: any = {};
        let err = null;

        reader.read().then(function processText({ done, value }) {
            if (done) {
                if (err != null) {
                    if (err) {
                        cb.apply(null, [{ gpt: undefined, original: null, status: true, code: 0 }]);
                        return;
                    }
                } else {
                    cb.apply(null, [{ ...nowResult, gpt: nowResult.message, done: true }]);
                }
                return;
            }

            const chunk = new TextDecoder().decode(value);
            let chk = chunk.toString().split('');

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
                        const resJSON = JSON.parse(result);
                        if (resJSON.code === undefined && resJSON.status === undefined) {
                            if (typeof resJSON.message === 'string') {
                                nowResult = resJSON;
                                cb.apply(null, [{ ...resJSON, gpt: resJSON.message }]);
                            }
                        } else {
                            err = result;
                        }
                    }
                }
            });

            return reader.read().then(processText);
        });
    });
}