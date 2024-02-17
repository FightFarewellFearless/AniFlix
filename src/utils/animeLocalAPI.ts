import axios, { AxiosRequestConfig } from 'axios';
import deviceUserAgent from './deviceUserAgent';
import cheerio, { Element } from 'cheerio';
import type { Cheerio } from 'cheerio';
import { AniDetail, AniDetailEpsList, AniStreaming, NewAnimeList, SearchAnime, SearchAnimeList, listAnimeTypeList } from '../types/anime';
import URL from 'url';

import { Buffer } from 'buffer/';

let BASE_DOMAIN = 'otakudesu.cloud';
let BASE_URL = 'https://' + BASE_DOMAIN;

const BASE = {
    domain: BASE_DOMAIN,
    url: BASE_URL
};

const fetchLatestDomain = async() => {
    const domainName = await fetch('https://raw.githubusercontent.com/FightFarewellFearless/AniFlix/master/SCRAPE_DOMAIN.txt').then(res => res.text());
    if(domainName === '404: Not Found') {
        throw new Error('Domain not found');
    }
    BASE.domain = domainName;
    BASE.url = 'https://' + BASE.domain;
};

const newAnime = async (page = 1, signal?: AbortSignal): Promise<NewAnimeList[]> => {
    let err = false;
    let errorObj: Error | null = null;
    const response = await axios.get(BASE.url + `/ongoing-anime/page/${page}`, {
        timeout: 40_000,
        headers: {
            "Accept-Encoding": "*",
            'User-Agent': deviceUserAgent,
        },
        signal,
    }).catch((e) => {
        err = true;
        errorObj = e;
    });
    if(err) {
        throw errorObj;
    }
    const html = response!.data;
    const $ = cheerio.load(html);
    const links: Cheerio<Element>[] = [];
    const data = [];
    $('div.venz > ul li').each((i, el) => {
        links.push($(el).find('div.detpost'))
    });
    for (const _link of links) {
        const link = _link.find('div.thumb > a').attr('href')!;
        const title = _link.find('h2.jdlflm').text().trim();
        const episode = _link.find('div.epz').text().trim();
        const thumbnailUrl = _link.find('div.thumbz > img').attr('src')!;
        const releaseDate = _link.find('div.newnime').text().trim();
        const releaseDay = _link.find('div.epztipe').text().trim();
        data.push({
            title,
            episode,
            thumbnailUrl,
            streamingLink: link,
            releaseDate,
            releaseDay,
        })
    }
    return data
}

const searchAnime = async (name: string, signal?: AbortSignal): Promise<SearchAnimeList[]> => {
    let err = false;
    let errorObj: Error | null = null;
    const data = await axios.get(BASE.url + `/?s=${name}&post_type=anime`, {
        timeout: 40_000,
        headers: {
            "Accept-Encoding": "*",
            'User-Agent': deviceUserAgent,
        },
        signal,
    }).catch((e) => {
        err = true;
        errorObj = e;
    });
    if(err) {
        throw errorObj;
    }
    const searchdata = data!.data;
    const $ = cheerio.load(searchdata);
    const result: SearchAnimeList[] = [];
    $('div.vezone > div.venser > div.venutama > div.page > ul li').each((i, el) => {
        const _link = $(el);
        const animeUrl = _link.find('h2 > a').attr('href')!;
        const title = _link.find('h2 > a').text().trim();
        const rating = _link.find('div.set').eq(2).text().replace('Rating : ', '').trim();
        const status = _link.find('div.set').eq(1).text().replace('Status : ', '').trim();
        const thumbnailUrl = _link.find('img').attr('src')!;
        const genres: string[] = [];
        _link.find('div.set').eq(0).find('a').each((i, el) => {
            genres.push($(el).text().trim());
        })

        result.push({
            title,
            genres,
            status,
            animeUrl,
            thumbnailUrl,
            rating,
        })
    });
    return result;
}


const fromUrl = async (url: string, selectedRes: RegExp | string = /480p|360p/, skipAutoRes = false, detailOnly = false, signal?: AbortSignal): Promise<AniStreaming | AniDetail | undefined> => {
    const withoutDomain = URL.parse(url);
    // to make sure only request with latest domain available
    url = withoutDomain.protocol + '//' + BASE.domain + withoutDomain.pathname;
    let err = false;
    let errorObj: Error | null = null;
    const _axios = await axios.get(url, {
        timeout: 40_000,
        headers: {
            "Accept-Encoding": "*",
            'User-Agent': deviceUserAgent,
        },
        signal,
    }).catch((e) => {
        err = true;
        errorObj = e;
    });
    if(err) {
        throw errorObj;
    }
    const data = _axios?.data;
    if (data == undefined) return;
    const $ = cheerio.load(data, { xmlMode: true });
    const isAnimeDetail = $('div.episodelist').length === 3;


    const aniDetail = $('div.venser');

    if (isAnimeDetail) {

        function getSecondTwoDots(text: string) {
            return text.split(':')[1];
        }

        const filmStats = aniDetail.find('div.infozin > div.infozingle');
        const title = aniDetail.find('div.jdlrx').text().trim();
        const sinopsys: string[] = [];
        aniDetail.find('div.sinopc').find('p').each((i, el) => {
            sinopsys.push($(el).text().trim());
        });
        const epsTotal = getSecondTwoDots(filmStats.find('p').eq(6).text()).trim();
        const minutesPerEp = getSecondTwoDots(filmStats.find('p').eq(7).text()).trim();
        const thumbnailUrl = $('div.fotoanime > img').attr('src')!;

        const alternativeTitle = getSecondTwoDots(filmStats.find('p').eq(1).text()).trim();
        const rating = getSecondTwoDots(filmStats.find('p').eq(2).text()).trim();
        const aired = getSecondTwoDots(filmStats.find('p').eq(8).text()).trim();
        const status = getSecondTwoDots(filmStats.find('p').eq(5).text()).trim();
        const studio = getSecondTwoDots(filmStats.find('p').eq(9).text()).trim();
        const animeType = getSecondTwoDots(filmStats.find('p').eq(4).text()).trim();

        const genres: string[] = [];
        filmStats.find('p').eq(10).find('a').each((i, el) => {
            genres.push($(el).text().trim());
        });

        const episodelist = $('div.episodelist').eq(1);
        const episodeList: AniDetailEpsList[] = [];
        if (!detailOnly) episodelist.find('ul li').each((i, el) => {
            const link = $(el).find('a').attr('href')!;
            const title = $(el).find('a').text().trim();
            const releaseDate = $(el).find('span').eq(1).text().trim();
            episodeList.push({
                title,
                link,
                releaseDate,
            })
        });

        return {
            type: 'animeDetail',
            title,
            genres,
            synopsys: sinopsys.join('\n'),
            detailOnly,
            episodeList,
            epsTotal,
            minutesPerEp,
            thumbnailUrl,
            alternativeTitle,
            rating,
            releaseYear: aired,
            status,
            studio,
            animeType,
        }
    } else {

        const title = aniDetail.find('h1.posttl').text().trim();
        const streamingLink = await getStreamLink(aniDetail.find('div.responsive-embed-stream > iframe').attr('src')!, signal);
        const downloadLink = aniDetail.find('div.responsive-embed > iframe').attr('src')!;

        const thumbnailUrl = aniDetail.find('div.cukder > img').attr('src')!;

        const resolution = '480p';

        const episode = aniDetail.find('div.flir a');
        const episodeData: {previous?: string, animeDetail: string, next?: string} = {
            animeDetail: episode.filter((i, el) => $(el).text().trim() === 'See All Episodes').attr('href')!,
        };

        const prev = episode.filter((i, el) => $(el).text().trim() === 'Previous Eps.');
        if (prev.length !== 0) {
            episodeData.previous = prev.attr('href');
        }
        const next = episode.filter((i, el) => $(el).text().trim() === 'Next Eps.');
        if (next.length !== 0) {
            episodeData.next = next.attr('href');
        }

        const changeResScript = $('script').eq(16).text();
        const reqNonceAction = changeResScript.split('processData:!0,cache:!0,data:{action:"')[1].split('"')[0];
        const reqResolutionWithNonceAction = changeResScript.split('processData:!0,cache:!0,data:{...e,nonce:window.__x__nonce,action:"')[1].split('"')[0];

        const mirrorStream = aniDetail.find('div.mirrorstream ul');
        const m360p = mirrorStream.filter((i, el) => $(el).hasClass('m360p')).find('a').filter((i, el) => $(el).text().trim().startsWith('o') || $(el).text().trim().includes('desu')).attr('data-content');
        const m480p = mirrorStream.filter((i, el) => $(el).hasClass('m480p')).find('a').filter((i, el) => $(el).text().trim().startsWith('o') || $(el).text().trim().includes('desu')).attr('data-content');
        const m720p = mirrorStream.filter((i, el) => $(el).hasClass('m720p')).find('a').filter((i, el) => $(el).text().trim().startsWith('o') || $(el).text().trim().includes('desu')).attr('data-content');

        const resolutionRaw = {
            '360p': m360p,
            '480p': m480p,
            '720p': m720p,
        };

        const returnObj: AniStreaming = {
            type: 'animeStreaming',
            title,
            // @ts-expect-error
            streamingLink,
            streamingType: 'raw',
            downloadLink,
            resolution,
            resolutionRaw,
            // synopsys: sinopsys,
            thumbnailUrl,
            // releaseYear: aniStats.find('span.item').eq(1).text().trim(),
            // status: aniStats.find('span.item').eq(0).text().trim(),
            episodeData,
            reqNonceAction,
            reqResolutionWithNonceAction,
        }
        if (streamingLink === undefined) {
            returnObj.streamingLink = aniDetail.find('div.responsive-embed-stream > iframe').attr('src')!;
            returnObj.streamingType = 'embed';
        }
        return returnObj;
    }
}

const getStreamLink = async (downLink: string, signal?: AbortSignal): Promise<string | undefined> => {
    if (downLink.includes('desustream')) {
        let err = false;
        let errorObj: Error | null = null;
        const response = await axios.get(downLink, {
            timeout: 40_000,
            headers: {
                "User-Agent": deviceUserAgent
            },
            signal,    
        }).catch((e) => {
            err = true;
            errorObj = e;
        });
        if (err) {
            throw errorObj;
        }
        const data = response!.data;
        return data.split("sources: [{'file':'")[1].split("',")[0];
    }
}


const listAnime = async (signal?: AbortSignal): Promise<listAnimeTypeList[]> => {
    const url = BASE.url + '/anime-list/';
    let err = false;
    let errorObj: Error | null = null;
    const response = await axios.get(url, {
        timeout: 40_000,
        headers: {
            'User-Agent': deviceUserAgent,
        },
        signal,
    }).catch((e) => {
        err = true;
        errorObj = e;
    });
    if (err) {
        throw errorObj;
    }

    const data = response!.data;
    
    const $ = cheerio.load(data, {
        xmlMode: true,
        xml: true,
        // thoose two options somehow improve performance
    });

    const eachWord = $('div.jdlbar');

    const eachWordArrays = eachWord.toArray();
    const listAnimeData: listAnimeTypeList[] = [];

    let i = 0;
    while (i < eachWordArrays.length) {
        const elm = $(eachWordArrays[i++]);
        listAnimeData.push({
            title: elm.find('a').text().trim(),
            streamingLink: elm.find('a').attr('href')!
        })
        if(i % 50 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    return listAnimeData;
}

async function fetchStreamingResolution(requestData: string | Object, reqNonceAction: string, reqResolutionWithNonceAction: string, nonce?: string, signal?: AbortSignal): Promise<string | undefined> {
    let err = false;
    let errorObj: Error | null = null;
    const requestOptions: AxiosRequestConfig = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': '*/*',
            'X-Requested-With': 'XMLHttpRequest',
            // 'User-Agent': deviceUserAgent
        },
        // body: new URLSearchParams({ ...requestData, action: reqResolutionWithNonceAction, nonce }).toString(),
        timeout: 40_000,
        signal,
    };
    if (!nonce) {
        const data = await axios.post(BASE.url + '/wp-admin/admin-ajax.php', {
            action: reqNonceAction
        }, requestOptions).then(response => response.data).catch((e) => {
            err = true;
            errorObj = e;
        });
        if (err) {
            throw errorObj;
        }
        if (data.data === undefined) return undefined;
        return await fetchStreamingResolution(requestData, reqNonceAction, reqResolutionWithNonceAction, data.data, signal);
    }
    requestData = JSON.parse(Buffer.from(requestData as string, 'base64').toString('utf8')) as Object;

    const response = await axios.post(BASE.url + '/wp-admin/admin-ajax.php', {
        ...requestData,
        action: reqResolutionWithNonceAction,
        nonce
    }, requestOptions).then(a => a.data).catch((e) => {
        err = true;
        errorObj = e;
    });
    if (err) {
        throw errorObj;
    }
    const data = response.data;
    return await getStreamLink(cheerio.load(Buffer.from(data, 'base64').toString('utf8'))('div > iframe').attr('src')!);
}

async function jadwalAnime(signal?: AbortSignal) {
    let err = false;
    let errorObj: Error | null = null;
    const response = await axios.get(BASE.url + '/jadwal-rilis/', {
        headers: {
            'User-Agent': deviceUserAgent,
        },
        timeout: 40_000,
        signal,
    }).catch((e) => {
        err = true;
        errorObj = e;
    });
    if (err) {
        throw errorObj;
    }
    const data = response!.data;
    const $ = cheerio.load(data);
    const list = $('div.kglist321');

    const jadwal: { [key: string]: { title: string, link: string }[] } = {};

    list.each((i, el) => {
        const $$ = $(el);
        const arr: { title: string, link: string }[] = [];
        $$.find('ul li > a').each((_, a) => {
            arr.push({
                title: $(a).text().trim(),
                link: $(a).attr('href')!
            })
        });
        jadwal[$$.find('h2').text().trim()] = arr;
    });

    return jadwal;
}

export default {
    BASE,
    fetchLatestDomain,
    newAnime,
    searchAnime,
    fromUrl,
    listAnime,
    fetchStreamingResolution,
    jadwalAnime
}