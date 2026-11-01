/**
 * Registers the icon fonts used by `@react-native-vector-icons` with the browser.
 *
 * On React Native the fonts are registered natively by the OS, so the
 * `<Icon />` components just render a glyph character. In the Electron
 * renderer (react-native-web) that glyph is plain text, so the browser needs
 * a matching `@font-face` rule for the family name the library puts into
 * `fontFamily` - which is the PostScript name of each font.
 *
 * Without these rules the glyph falls back to the default sans-serif font and
 * the icons show up as empty boxes / random characters.
 *
 * Reference: https://github.com/oblador/react-native-vector-icons/blob/master/docs/SETUP-WEB.md
 */
import entypoFont from '@react-native-vector-icons/entypo/fonts/Entypo.ttf';
import fontAwesomeFont from '@react-native-vector-icons/fontawesome/fonts/FontAwesome.ttf';
import fontAwesome5BrandsFont from '@react-native-vector-icons/fontawesome5/fonts/FontAwesome5_Brands.ttf';
import fontAwesome5RegularFont from '@react-native-vector-icons/fontawesome5/fonts/FontAwesome5_Regular.ttf';
import fontAwesome5SolidFont from '@react-native-vector-icons/fontawesome5/fonts/FontAwesome5_Solid.ttf';
import fontistoFont from '@react-native-vector-icons/fontisto/fonts/Fontisto.ttf';
import materialDesignIconsFont from '@react-native-vector-icons/material-design-icons/fonts/MaterialDesignIcons.ttf';
import materialIconsFont from '@react-native-vector-icons/material-icons/fonts/MaterialIcons.ttf';

/**
 * The `family` values must match the `postScriptName` that
 * `@react-native-vector-icons/common` uses as `fontFamily`:
 *
 *  - material-icons        -> MaterialIcons-Regular
 *  - material-design-icons -> MaterialDesignIcons
 *  - fontawesome           -> FontAwesome
 *  - fontawesome5          -> FontAwesome5Free-Regular / FontAwesome5Free-Solid / FontAwesome5Brands-Regular
 *  - fontisto              -> fontisto
 *  - entypo                -> Entypo
 */
const ICON_FONTS: { family: string; url: string }[] = [
  { family: 'MaterialIcons-Regular', url: materialIconsFont },
  { family: 'MaterialDesignIcons', url: materialDesignIconsFont },
  { family: 'FontAwesome', url: fontAwesomeFont },
  { family: 'FontAwesome5Free-Regular', url: fontAwesome5RegularFont },
  { family: 'FontAwesome5Free-Solid', url: fontAwesome5SolidFont },
  { family: 'FontAwesome5Brands-Regular', url: fontAwesome5BrandsFont },
  { family: 'fontisto', url: fontistoFont },
  { family: 'Entypo', url: entypoFont },
];

const STYLE_ELEMENT_ID = 'aniflix-icon-fonts';

export function registerIconFonts(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ELEMENT_ID)) return;

  const css = ICON_FONTS.map(
    ({ family, url }) =>
      `@font-face {` +
      `font-family: '${family}';` +
      `src: url(${url}) format('truetype');` +
      `font-weight: normal;` +
      `font-style: normal;` +
      `font-display: block;` +
      `}`,
  ).join('\n');

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.type = 'text/css';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
}

export default registerIconFonts;
