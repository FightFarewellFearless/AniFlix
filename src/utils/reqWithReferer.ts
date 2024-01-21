import url from 'url';
import cheerio from 'cheerio';
import axios from 'axios';
import { getUserAgentSync } from 'react-native-device-info';
import animeLocalAPI from '../utils/animeLocalAPI';

const BASE_DOMAIN = animeLocalAPI.BASE_DOMAIN;

const userAgent = getUserAgentSync();

async function reqWithReferer(link: string): Promise<string> {
    const { data } = await axios.get(decodeURIComponent(link), {
        headers: {
            'User-Agent': userAgent,
            'Referer': BASE_DOMAIN
        }
    });

    const parsedUrl = url.parse(link);
    const baseUrl = parsedUrl.protocol + '//' + parsedUrl.host;

    const $ = cheerio.load(data);

    // Define the elements and attributes to update
    const elementsToUpdate = [
        { selector: 'a', attribute: 'href' },
        { selector: 'img', attribute: 'src' },
        { selector: 'link', attribute: 'href' },
        { selector: 'script', attribute: 'src' }
    ];

    // Update each element's URL
    elementsToUpdate.forEach(({ selector, attribute }) => {
        $(selector).each(function () {
            // Get the current attribute value
            const relativeUrl = $(this).attr(attribute);
            if(relativeUrl === undefined) return;
            // Resolve the relative URL against the base URL
            const absoluteUrl = url.resolve(baseUrl, relativeUrl);

            // Update the attribute with the absolute URL
            $(this).attr(attribute, absoluteUrl);
        });
    });

    // Output the updated HTML
    const updatedHtmlContent = $.html();

    return updatedHtmlContent;
}

export default reqWithReferer;
