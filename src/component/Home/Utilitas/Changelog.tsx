import { useEffect, useState } from "react";
import { Asset } from 'expo-asset';
import Markdown from "react-native-marked";

export default function Changelog() {
    const [value, setValue] = useState<string>('');
    useEffect(() => {
        const uri = Asset.fromModule(require('../../../../CHANGELOG.md')).uri;
        fetch(uri).then(a => a.text()).then(setValue);
    }, [])
    return (
        <Markdown
            value={value}
        />
    )
}