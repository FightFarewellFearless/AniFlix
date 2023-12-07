import reactNativeDeviceInfo from 'react-native-device-info';


const cheerio = require('cheerio');

const BASE_DOMAIN = 'nanimex2.com';
const BASE_URL = 'https://' + BASE_DOMAIN;
const userAgent = reactNativeDeviceInfo.getUserAgentSync();

const newAnime = async (page = 1) => {
    const {
        default: axios
    } = await import('axios');
    const {
        data: html
    } = await axios.get(BASE_URL + `/page/${page}`, {
        headers: {
            "Accept-Encoding": "*"
        }
    });
    const $ = cheerio.load(html);
    const links = [];
    const data = [];
    $('div.box-body.box-poster').eq(0).find('.col-sm-3.content-item').each((i, el) => {
        links.push($(el))
    });
    for (const _link of links) {
        const link = _link.find('a').attr('href');
        const title = _link.find('h3').attr('title');
        const episode = _link.find('.episode > .label.btn-danger').text().trim();
        const rating = _link.find('.episode > .label.btn-warning').text().trim();
        const thumbnailUrl = _link.find('img').attr('data-lazy-src');
        const releaseYear = _link.find('div.status > a').eq(0).text().trim();
        const status = _link.find('div.status > a').eq(1).text().trim();
        data.push({
            title,
            episode,
            rating,
            thumbnailUrl,
            streamingLink: link,
            releaseYear,
            status,
        })
    }
    return data
}

const searchAnime = async (name, page = 1) => {
    page = Number(page);
    const {
        default: axios
    } = await import('axios');
    const {
        data: searchdata
    } = await axios.get(BASE_URL + `/page/${page}/?s=${name}`, {
        headers: {
            "Accept-Encoding": "*"
        }
    }).catch(() => { });
    const $ = cheerio.load(searchdata);
    const nextPageAvailable = $('a[class="next page-numbers btn-primary btn"]').length > 0;
    const result = [];
    $('div.box-body.box-poster').eq(0).find('.col-sm-3.content-item').each((i, el) => {
        const title = $(el).find('h3').text().trim();
        const animeUrl = $(el).find('a').attr('href');
        const thumbnailUrl = $(el).find('img').attr('src');
        const episode = $(el).find('.episode > .label.btn-danger').text().trim();
        const rating = $(el).find('.episode > .label.btn-warning').text().trim();
        const releaseYear = $(el).find('div.status > a').eq(0).text().trim();
        const status = $(el).find('div.status > a').eq(1).text().trim();
        result.push({
            title,
            animeUrl,
            thumbnailUrl,
            episode,
            rating,
            releaseYear,
            status,
        })
    });
    return { result, nextPageAvailable, nextPage: nextPageAvailable === true ? page + 1 : undefined };
}


const fromUrl = async (url, selectedRes = /480p|360p/, skipAutoRes = false) => {
    const {
        default: axios
    } = await import('axios');
    const _axios = await axios.get(url, {
        headers: {
            "Accept-Encoding": "*"
        }
    }).catch(() => { });
    const data = _axios?.data;
    if (data == undefined) return;
    const $ = cheerio.load(data, { xmlMode: true });
    const isEpsList = $('#change-server').length === 0;

    const dataIndex = {};
    $('.table.table-condensed').eq(0).find('tbody > tr > td').each((i, el) => {
        dataIndex[$(el).text().trim().toLowerCase()] = i + 1;
    });

    const genre = [];
    $('.table.table-condensed').eq(0).find('tbody > tr > td').eq(dataIndex.genre).find('a').each((i, el) => {
        genre.push($(el).text().trim())
    });
    const releaseYear = $('.table.table-condensed').eq(0).find('tbody > tr > td').eq(dataIndex.judul).find('a').eq(1).text().trim();
    const status = $('.table.table-condensed').eq(0).find('tbody > tr > td').eq(dataIndex.status).find('a').text().trim();
    const rating = $('.table.table-condensed').eq(0).find('tbody > tr > td').eq(dataIndex.rating).text().trim();

    if (isEpsList) {

        const eps = $('.box-body.episode_list').eq(0);
        const results = [];
        eps.find('tr > td').each((i, el) => {
            const epslist = $(el);
            results.push({
                link: epslist.find('a').attr('href'),
                episode: epslist.find('a').text().trim()
            })
        });
        return {
            type: 'epsList',
            title: $('.box-title').eq(1).text().trim(),
            synopsys: $('.attachment-text').text().trim(),
            thumbnailUrl: $('.attachment-img.poster').eq(1).attr('src'),
            episodeList: results,
            genre,
            status,
            releaseYear,
            rating,
        }
    } else {
        // const streamingLink = $('#change-server > option').eq(0).attr('value');
        let downloadLinks = $('select#change-server').find('option').filter((i, el) => {
            const text = $(el).text().trim().toLowerCase();
            return text.includes('uservideo.xyz');
        });

        if (downloadLinks.length < 1) {
            downloadLinks = $('select#change-server').find('option').filter((i, el) => {
                const text = $(el).text().trim().toLowerCase();
                return text.includes('vidoza.net');
            });
        }

        if (downloadLinks.length < 1) {
            downloadLinks = $('select#change-server').find('option').filter((i, el) => {
                const text = $(el).text().trim().toLowerCase();
                return text.includes('streamwish.com');
            });
        }

        let selected = downloadLinks.filter((i, el) => {
            return (selectedRes !== undefined ? $(el).text().trim().toLowerCase().match(selectedRes) : true)
        });

        if (selected.length === 0) // resolusi yang dipilih tidak tersedia
            selected = downloadLinks.eq(0);

        let downloadLink = selected.attr('value');
        const validResolution = [];
        downloadLinks.each((i, el) => {
            const resolution = parseInt($(el).text().trim()).toString() + 'p';
            if (!validResolution.includes(resolution)) {
                validResolution.push(resolution)
            }
        })

        let resolution = parseInt(selected.text().trim()).toString() + 'p';

        let episodeData;

        if ($('div.btn-group').length > 0) {
            const EPSDATA = $('div.btn-group');

            let previous = EPSDATA.find('a').eq(0).attr('href');
            if (previous === '#') previous = undefined;

            let next = EPSDATA.find('a').eq(2).attr('href');
            if (next === '#') next = undefined;

            episodeData = {
                previous,
                episodeList: EPSDATA.find('a').eq(1).attr('href'),
                next,
            }
        }
        let streamingLink;
        try {
            streamingLink = await getStreamLink(downloadLink);
        } catch (e) {
            if (!skipAutoRes) {
                validResolution.splice(validResolution.indexOf(resolution), 1);
                for (const validRes of validResolution) {
                    const resDownloadLink = downloadLinks.filter((i, el) => {
                        return $(el).text().trim().toLowerCase().match(validRes);
                    }).attr('href');
                    try {
                        streamingLink = await getStreamLink(resDownloadLink);
                        resolution = validRes;
                        downloadLink = resDownloadLink;
                        break;
                    } catch (e) {
                        validResolution.splice(validResolution.indexOf(validRes), 1);
                        continue;
                    }
                }
            }
        }

        if (streamingLink === undefined) {
            throw new Error('Unsupported')
        }

        return {
            type: 'singleEps',
            title: $('li.active').text().trim(),
            streamingLink,
            downloadLink,
            genre,
            resolution,
            validResolution,
            synopsys: $('.attachment-text').text().trim(),
            thumbnailUrl: $('.attachment-img.poster').eq(1).attr('src'),
            releaseYear,
            status,
            rating,
            episodeData
        }
    }
}

const getStreamLink = async (downLink) => {
    const {
        default: axios
    } = await import('axios');
    if (downLink.includes('vidoza.net')) {
        const { data } = await axios.get(downLink);
        const $ = cheerio.load(data);
        const vidLink = $('video#player').find('source').attr('src');
        return [{ "sources": [{ "src": vidLink }] }]
    } else if (downLink.includes('streamwish.com')) {
        const { data } = await axios.get(downLink, {
            // proxy: {
            //     protocol: 'http',
            //     host: '117.54.114.96',
            //     port: 80,
            // },
            headers: {
                Host: 'streamwish.to',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/118.0',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                Referer: 'https://nanimex2.com/',
                DNT: '1',
                Connection: 'keep-alive',
                // Cookie: 'file_id=11023331; aff=4275; ref_url=nanimex2.com; lang=1; _ga_2TL7NH453R=GS1.1.1699141052.1.0.1699141087.0.0.0; _ga=GA1.1.1661670419.1699141052; pp_show_on_32f58d98ad8336e2a6080f93e26e9778=1; pp_main_32f58d98ad8336e2a6080f93e26e9778=1; pp_exp_32f58d98ad8336e2a6080f93e26e9778=1699144655896; dom3ic8zudi28v8lr6fgphwffqoz0j6c=f8087d91-53d5-4f54-8d0f-801c2f8a0bf2%3A2%3A1',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-User': '?1',
                TE: 'trailers'
            }
        });
        const $ = cheerio.load(data, {
            xmlMode: true,
        });
        const link = $('script').eq(12).text().split('sources: ')[1].split(',')[0].split('[{file:"')[1].split('"}]')[0];
        return [{ "sources": [{ "src": link }] }];
    } else {
        const downloadResult = await axios.get(downLink);
        const $ = cheerio.load(downloadResult.data);

        const iframeLinksEl = $('select#videoSelector > option');
        const iframeLinks = iframeLinksEl.length > 0 ? iframeLinksEl.map((i, el) => {
            return $(el).attr('value');
        }).get() : [$('iframe').attr('src')];
        const jsonArr = [];

        for(const iframelink of iframeLinks) {
            const iframeResult = await axios.get(iframelink, {
                headers: {
                    'User-Agent': userAgent,
                }
            });
            const $iframe = cheerio.load(iframeResult.data);
            const varVideoConfig = $iframe('script').eq(0).html();
            const videoConfig = JSON.parse(varVideoConfig.split('var VIDEO_CONFIG = ')[1]);
            jsonArr.push({
                sources: [{ src: (videoConfig.streams[videoConfig.streams.length - 1].play_url) }],
            })
        }
        return jsonArr;
    }
}

const movie = async (page = 1) => {
    const {
        default: axios
    } = await import('axios');

    const url = BASE_URL + '/movie/page/' + page;
    const { data } = await axios.get(url);

    const $ = cheerio.load(data);

    const container = $('div.box-body.box-poster');
    const child = container.find('div.col-sm-3.content-item');
    const childArrayData = [];
    child.each((i, el) => {
        const $$ = $(el);
        childArrayData.push({
            title: $$.find('a').attr('title'),
            streamingLink: $$.find('a').attr('href'),
            thumbnailUrl: $$.find('img').attr('data-lazy-src'),
            rating: $$.find('div.episode > div.label.btn-warning').text().trim(),
            releaseYear: $$.find('div.status > a').eq(0).text().trim(),
        })
    });
    return childArrayData;
}

module.exports = {
    BASE_URL,
    newAnime,
    searchAnime,
    fromUrl,
    movie
}