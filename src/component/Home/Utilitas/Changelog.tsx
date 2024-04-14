import Markdown from "react-native-marked";
import CHANGELOG from "../../../../CHANGELOG.md";

export default function Changelog() {
    return (
        <Markdown
            value={CHANGELOG}
        />
    )
}