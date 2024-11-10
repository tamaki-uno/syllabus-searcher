// インポート 
const axios = require('axios'); // HTTPクライアント
const cheerio = require('cheerio'); // HTML解析
const { log } = require('console');
const fs = require('fs'); // ファイル操作

const HOST_URL = 'https://syllabus.sfc.keio.ac.jp'; // ホスト名のURL

// スクレイピングする関数
async function scrape(url, selectors, num=1, delay=1000, onlyUrl=false) {
    try {
        console.log(`#scrape ${url}`); // 開始メッセージ
        // await new Promise(resolve => setTimeout(resolve, delay)); // 1秒待機
        const timeFlag = new Promise((resolve) => setTimeout(resolve, 1000)); // 1秒後にresolveするPromise

        const response = await axios.get(url); // リクエストを送信
        const html = response.data; // レスポンスのHTMLを取得
        const $ = cheerio.load(html); // cheerioを使ってHTMLを解析

        if (onlyUrl) {
            const url = $(selectors['URL']).attr('href'); // URLを取得
            await timeFlag; // 1秒待機
            return url; // URLを返す
        }

        // 要素の取得
        const objArray = [];
        for (let i = 0; i < num; i++) {
            const obj = {};
            for (const key in selectors) {
                const selector = selectors[key].replace('{num}', i+1); // セレクターの{num}をi+1に置換
                if ($(selector).length === 0) continue; // セレクターが存在しない場合はスキップ
                const node = $(selector); // セレクターで要素を取得
                if (key === 'URL') {
                    obj[key] = HOST_URL + node.attr('href'); // URLを取得してdataオブジェクトにセレクター名をキーにして保存
                } else {
                    obj[key] = node.text(); // テキストを取得してdataオブジェクトにセレクター名をキーにして保存
                    // obj[key] = node.html(); // HTMLを取得してdataオブジェクトにセレクター名をキーにして保存
                }
            }
            objArray.push(obj); // オブジェクトを配列に追加
        }

        await timeFlag; // 1秒待機
        return objArray; // データを返す
    } catch (error) {
        console.error(`Scrape Error: ${error} <scrape()>`);
    }
}

// 複数のURLをスクレイピングする関数
async function scrapePages(urls, selectors, num=1) {
    let timeRemain = urls.length; // 残り時間を初期化
    console.log('#scrape pages. estimated time:', timeConverter(timeRemain*1000)); // 開始メッセージ
    let datas = []; // データを初期化
    for (const url of urls) {
        if (timeRemain % 10 === 0) console.log(`time remain: ${timeConverter(timeRemain*1000)}`); // 残り時間を10秒ごとに表示
        const data = await scrape(url, selectors, num); // スクレイピング実行
        datas.push(...data); // データを結合
        // await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
        timeRemain--;
    }
    return datas;
}

// 時間を変換する関数
function timeConverter(ms) {
    let result = '';
    const s = ms / 1000; // 秒に変換
    const m = s / 60; // 分に変換
    const h = m / 60; // 時間に変換
    const Hour = Math.floor(h); // 時間部分
    const Minute = Math.floor(m % 60); // 分部分
    const Second = Math.floor(s % 60); // 秒部分
    if (Hour > 0) result += `${Hour}h `; // 時間部分が0より大きい場合は追加
    if (Minute > 0) result += `${Minute}min `; // 分部分が0より大きい場合は追加
    if (Second > 0) result += `${Second}sec`; // 秒部分が0より大きい場合は追加
    return result; // 結果を返す
}

/*
https://syllabus.sfc.keio.ac.jp/courses
    ?locale=ja
    &search[title]=
    &search[year]=2025
    &search[semester]=
    &search[sub_semester]=
    &search[teacher_name]=
    &search[communication_type][]=online_live
    &search[communication_type][]=online_ondemand
    &search[communication_type][]=on_campus
    &search[day_codes][]=1
    &search[day_codes][]=2
    &search[time_codes][]=1
    &search[time_codes][]=2
    &search[departments][]=23
    &search[departments][]=52
    &search[sfc_guide_title]=23%2F11%2F2014%2F3.Fundamental+Subjects+-+Subjects+of+Language+Communication
    &search[languages][]=en
    &search[languages][]=de
    &search[languages][]=fr
    &search[languages][]=zh
    &search[languages][]=ca
    &search[languages][]=ru
    &search[languages][]=ko
    &search[languages][]=sr
    &search[languages][]=el
    &search[languages][]=ja
    &search[languages][]=pt
    &search[languages][]=id
    &search[languages][]=ar
    &search[languages][]=it
    &search[languages][]=th
    &search[languages][]=99
    &search[summary]=
    &search[locations][]=sfc
    &search[locations][]=ttck
    &search[locations][]=other
    &search[styles][]=lecture
    &search[styles][]=work
    &search[styles][]=practical_training
    &search[styles][]=groupwork
    &button=
*/


// シラバスの検索結果ページのURLを生成する関数
function searchQueryParameterGenerator(page='', title='', year='', semester='', sub_semester='', teacher_name='', day_codes='', time_codes='', departments='', sfc_guide_title='', languages='', summary='', locations='', styles=''){
    // https://syllabus.sfc.keio.ac.jp/courses?locale=en&search[title]=Title&search[year]=2025&search[semester]=fullyear&search[sub_semester]=first&search[teacher_name]=Lecturer-Name&search[communication_type][]=online_live&search[day_codes][]=1&search[time_codes][]=1&search[departments][]=23&search[sfc_guide_title]=23%2F11%2F2014%2F2.Fundamental+Subjects+-+Introductory+Subjects&search[languages][]=id&search[summary]=Summary&search[locations][]=sfc&search[styles][]=lecture&button=
    // クエリパラメータを追加 (空の場合は追加しない)

    let queryParameters = ''; // 検索クエリを初期化
    if (page) (page === '1') ? queryParameters += '' : queryParameters += `&page=${page}`; // ページ番号 (1ページ目の場合は何も追加しない)
    if (title) queryParameters += `&search[title]=${title}`; // タイトル
    if (year) queryParameters += `&search[year]=${year}`; // 年度
    if (semester) queryParameters += `&search[semester]=${semester}`; // 学期
    if (sub_semester) queryParameters += `&search[sub_semester]=${sub_semester}`; // 前半/後半
    if (teacher_name) queryParameters += `&search[teacher_name]=${teacher_name}`; // 教員名
    if (day_codes) queryParameters += `&search[day_codes][]=${day_codes}`; // 曜日
    if (time_codes) queryParameters += `&search[time_codes][]=${time_codes}`; // 時限
    if (departments) queryParameters += `&search[departments][]=${departments}`; // 学部
    if (sfc_guide_title) queryParameters += `&search[sfc_guide_title]=${sfc_guide_title}`; // SFCガイド
    if (languages) queryParameters += `&search[languages][]=${languages}`; // 言語
    if (summary) queryParameters += `&search[summary]=${summary}`; // 概要
    if (locations) queryParameters += `&search[locations][]=${locations}`; // 場所
    if (styles) queryParameters += `&search[styles][]=${styles}`; // スタイル
    // queryParameters += '&button='; // ボタン

    return queryParameters; // クエリパラメータを返す
}

async function searchURIsGenerator(title='', year='', semester='', sub_semester='', teacher_name='', day_codes='', time_codes='', departments='', sfc_guide_title='', languages='', summary='', locations='', styles=''){
    console.log('#search URIs generator'); // 開始メッセージ
    const firstPageQueryParameter = searchQueryParameterGenerator(1, title, year, semester, sub_semester, teacher_name, day_codes, time_codes, departments, sfc_guide_title, languages, summary, locations, styles); // 1ページ目のクエリパラメータを生成
    const firstPageURL = `${HOST_URL}/courses?locale=ja&${firstPageQueryParameter}`; // 1ページ目のURLを生成
    const firstPageSelector = {
        'URL': 'body > div.main > div > div.right-column > div.pager > nav > span.last > a'
    }; // セレクタを定義 (最終ページを取得するためのセレクタ)
    const lastPageURL = await scrape(firstPageURL, firstPageSelector, 1, 1000, true); // 最終ページのURLを取得
    // console.log(`*lastPageURL: ${lastPageURL}`); // 最終ページのURLを表示
    const PAGE_NUM = lastPageURL ? Number(lastPageURL.split('page=')[1].split('&')[0]) : 1; // ページ数を取得 (最終ページが存在する場合は最終ページ番号をURLから取得、存在しない場合は1を代入)
    console.log(`*${PAGE_NUM} pages matched to your search criteria.`); // ページ数を表示

    const urls = [];
    // ページ数分のURLを生成
    for (let page = 1; page <= PAGE_NUM; page++) {
        const searchQueryParameter = searchQueryParameterGenerator(page, title, year, semester, sub_semester, teacher_name, day_codes, time_codes, departments, sfc_guide_title, languages, summary, locations, styles); // クエリパラメータを生成
        const jaURL = `${HOST_URL}/courses?locale=ja${searchQueryParameter}`; // 日本語版のURLを生成
        const enURL = `${HOST_URL}/courses?locale=en${searchQueryParameter}`; // 英語版のURLを生成
        urls.push(jaURL, enURL); // URLを配列に追加
    }
    return urls;
}


async function scrapeSyllabusSimply(title='', year='', semester='', sub_semester='', teacher_name='', day_codes='', time_codes='', departments='', sfc_guide_title='', languages='', summary='', locations='', styles='') {
    console.log('#scrape syllabus simply'); // 開始メッセージ

    const searchURLs = await searchURIsGenerator(title, year, semester, sub_semester, teacher_name, day_codes, time_codes, departments, sfc_guide_title, languages, summary, locations, styles); // 検索結果ページのURLを生成
    // console.log('searchURLs:', searchURLs); // 検索結果ページのURLを表示

    // セレクタを定義 (URLを取得するためのセレクタ)
    const selectors = {
        // 'num': 25,
        'Subject': 'li:nth-child({num}) > h2',
        'Faculty/Graduate School': 'li:nth-child({num}) > div.class-info > div > dl:nth-child(1) > dd:nth-child(2)',
        'Course Registration Number': 'li:nth-child({num}) > div.class-info > div > dl:nth-child(1) > dd:nth-child(4)',
        'Subject Sort': 'li:nth-child({num}) > div.class-info > div > dl:nth-child(2) > dd:nth-child(2)',
        'Field': 'li:nth-child({num}) > div.class-info > div > dl:nth-child(2) > dd:nth-child(4)',
        'Units': 'li:nth-child({num}) > div.class-info > div > dl:nth-child(3) > dd:nth-child(2)',
        'K-Number': 'li:nth-child({num}) > div.class-info > div > dl:nth-child(3) > dd:nth-child(4)',
        'year/semester': 'li:nth-child({num}) > div.class-info > dl:nth-child(2) > dd',
        'Lecturer Name': 'li:nth-child({num}) > div.class-info > dl:nth-child(3) > dd',
        'Class Format': 'li:nth-child({num}) > div.hidden-field > div.syllabus-info > dl:nth-child(1) > dd',
        'class Style': 'li:nth-child({num}) > div.hidden-field > div.syllabus-info > dl:nth-child(2) > dd',
        'Day of Week・Period': 'li:nth-child({num}) > div.hidden-field > div.syllabus-info > dl:nth-child(3) > dd',
        'Language': 'li:nth-child({num}) > div.hidden-field > div.syllabus-info > dl:nth-child(4) > dd',
        'Research Seminar Theme': 'li:nth-child({num}) > div.hidden-field > div.syllabus-info > dl:nth-child(5) > dd',
        'Course Summary': 'li:nth-child({num}) > div.hidden-field > div.outline',
        'URL': 'li:nth-child({num}) > div.detail-btn-wrapper > a'
    }
    const num = 25; // 1ページあたりの取得タイル数
    // スクレイピング実行
    const dataArray = await scrapePages(searchURLs, selectors, num); // スクレイピング実行
    const nullDeletedDataArray = dataArray.filter((data) => data['Subject'] !== undefined); // Subjectが空のデータを削除 
    // console.log(`***nullDeletedDataArray: ${nullDeletedDataArray}***`); // データ
    const results = nullDeletedDataArray.map((data) => {
        // console.log('data:', data); // データを表示
        // 加工ゾーン
        for (const key in data) {
            data[key] = data[key].replaceAll('  ', ''); // ダブルスペースを削除
            if (!(key == 'Course Summary' || key == 'Lecturer Name')) {
                data[key] = data[key].replaceAll('\n', ''); // 改行を削除
            }
            switch (key) {
                case 'Year/Semester': // 年度と学期を分割
                    [data['Year'], data['Semester']] = data[key].split(' ');
                case 'Day of Week・Period': // 曜日と時限を分割
                    data['Day of Week'] = [];
                    data['Period'] = [];
                    const dayOfWeek_period = data[key].split(',');
                    for (let i = 0; i < dayOfWeek_period.length; i++) {
                        [day, period] = dayOfWeek_period[i].split(' ');
                        data['Day of Week'].push(day);
                        data['Period'].push(period);
                    }
                    break;
                case 'Lecturer Name': // 教員名を分割
                    data[key] = data[key].split('\n').filter((name) => name !== ''); // 教員名を分割&空の要素を削除
                    break;
                case 'URL': // URLを加工
                    // data[key] = data[key].replace('?locale=ja', ''); // URLのlocale=jaを削除
                    break;
                case 'Course Summary': // コース概要を加工
                    data[key] = data[key].replace('\n', ''); // 先頭の改行を削除
                    break;
                default:
                    break;
            }
        }
        return data;
    });
    console.log(`@got ${results.length} data`); // データ数を表示-
    return results;
}

// メイン関数
async function main(){
    console.log('*start'); // 開始メッセージ
    const startTime = new Date(); // 開始時刻を取得
    // スクレイピング検索条件
    const title = '';
    const year = '2024';
    const semester = 'fall';
    // const semester = 'spring';
    const sub_semester = '';
    const teacher_name = '';
    const day_codes = '';
    const time_codes = '';
    const departments = '';
    // const sfc_guide_title = '23/11/2014/2.Fundamental Subjects - Introductory Subjects';
    const sfc_guide_title = '';

    // // 引数から取得
    // // process.argv[0]はNode.jsの実行プロセスのパス、process.argv[1]は実行したスクリプトファイルのパス
    // // process.argv[2]以降が引数
    // const title, year, semester, sub_semester, teacher_name, day_codes, time_codes, departments, sfc_guide_title, languages, summary, locations, styles = process.argv.slice(2);

    // スクレイピング実行
    const data = await scrapeSyllabusSimply(title, year, semester, sub_semester, teacher_name, day_codes, time_codes, departments, sfc_guide_title); // スクレイピング実行

    const now = new Date(); // 現在時刻を取得
    let timeStamp = ''; // タイムスタンプを初期化 (YYYY-MM-DD_HH-MM-SS)
    timeStamp += String(now.getFullYear()).padStart(4, '0'); // 現在の年を取得 このパディングが使われることはないだろ(笑)
    timeStamp += '-' + String(now.getMonth() + 1).padStart(2, '0'); // 現在の月を取得 2桁になるようにパディング　以下同様
    timeStamp += '-' + String(now.getDate()).padStart(2, '0'); // 現在の日を取得
    timeStamp += '_'
    timeStamp += String(now.getHours()).padStart(2, '0'); // 現在の時を取得
    timeStamp += '-' + String(now.getMinutes()).padStart(2, '0'); // 現在の分を取得
    timeStamp += '-' + String(now.getSeconds()).padStart(2, '0'); // 現在の秒を取得
    const filepath = `data\\data_${timeStamp}_${year}-${semester}.json`; // ファイル名 (data_タイムスタンプ_年度-学期.json)
    console.log('filepath:', filepath); // ファイル名を表示

    // await fs.writeFileSync(filepath, JSON.stringify(data, null, 4)); // ファイルにデータを書き込み
    // console.log('data:', data); // データを表示

    const endTime = new Date(); // 終了時刻を取得
    const elapsedTime = endTime - startTime; // 経過時間を取得
    console.log(`*end. elapsed time: ${timeConverter(elapsedTime)}`); // 経過時間を表示
    // console.log('done'); // 完了メッセージ
}

main();