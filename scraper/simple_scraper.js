// インポート 
const axios = require('axios'); // HTTPクライアント
const cheerio = require('cheerio'); // HTML解析
const { log } = require('console');
const fs = require('fs'); // ファイル操作

const HOST_URL = 'https://syllabus.sfc.keio.ac.jp'; // ホスト名のURL

// スクレイピングする関数
async function scrape(url, selectors, num=1) {
    try {
        console.log(`#scrape ${url}`); // 開始メッセージ
        const response = await axios.get(url); // リクエストを送信
        const html = response.data; // レスポンスのHTMLを取得
        const $ = cheerio.load(html); // cheerioを使ってHTMLを解析

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
        return objArray; // データを返す
    } catch (error) {
        console.error(`Scrape Error: ${error} <scrape()>`);
    }
}

// 複数のURLをスクレイピングする関数
async function scrapePages(urls, selectors, num=1) {
    let timeRemain = urls.length; // 残り時間を初期化
    estTimes = '';
    const execHour = Math.floor(timeRemain / 3600); // 実行時間の時間部分
    if (execHour > 0) estTimes += ` ${execHour}hrs`; // 残り時間に時間部分を追加
    const execMin = Math.floor((timeRemain % 3600) / 60); // 実行時間の分部分
    if (execMin > 0) estTimes += ` ${execMin}min`; // 残り時間に分部分を追加
    const execSec = timeRemain % 60; // 最大実行時間の秒部分
    if (execSec > 0) estTimes += ` ${execSec}sec`; // 残り時間に秒部分を追加
    console.log('#scrape pages. estimated time:', estTimes); // 残り時間を表示
    let datas = []; // データを初期化
    for (const url of urls) {
        if (timeRemain % 10 === 0) console.log(`time remain: ${timeRemain}sec`); // 10秒ごとに残り時間を表示
        const data = await scrape(url, selectors, num); // スクレイピング実行
        datas.push(...data); // データを結合
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
        timeRemain--;
    }
    return datas;
}

// シラバスの検索結果ページのURLを生成する関数
function searchURIGenerator(page='', title='', year='', semester='', sub_semester='', teacher_name='', day_codes='', time_codes='', departments='', sfc_guide_title='', languages='', summary='', locations='', styles=''){
    // URLのクエリパラメータを変更して検索結果ページを取得 &つなぎでパラメータを追加 順番は関係ないかもしれない
    let uri = `${HOST_URL}/courses`; // ホストURLを追加 これはURL 以下からURI

    // クエリパラメータを追加 (空の場合は追加しない)
    uri += '?locale=ja'; // 言語
    if (page) (page === '1') ? uri += '' : uri += `&page=${page}`; // ページ番号 (1ページ目の場合は何も追加しない)
    if (title) uri += `&search[title]=${title}`; // タイトル
    if (year) uri += `&search[year]=${year}`; // 年度
    if (semester) uri += `&search[semester]=${semester}`; // 学期
    if (sub_semester) uri += `&search[sub_semester]=${sub_semester}`; // 前半/後半
    if (teacher_name) uri += `&search[teacher_name]=${teacher_name}`; // 教員名
    if (day_codes) uri += `&search[day_codes][]=${day_codes}`; // 曜日
    if (time_codes) uri += `&search[time_codes][]=${time_codes}`; // 時限
    if (departments) uri += `&search[departments][]=${departments}`; // 学部
    if (sfc_guide_title) uri += `&search[sfc_guide_title]=${sfc_guide_title}`; // SFCガイド
    if (languages) uri += `&search[languages][]=${languages}`; // 言語
    if (summary) uri += `&search[summary]=${summary}`; // 概要
    if (locations) uri += `&search[locations][]=${locations}`; // 場所
    if (styles) uri += `&search[styles][]=${styles}`; // スタイル
    // uri += '&button='; // ボタン

    const url = encodeURI(uri); // URIエンコードしてURIを生成 (日本語などの文字列をエンコード)
    return url;
}

async function searchURIsGenerator(title='', year='', semester='', sub_semester='', teacher_name='', day_codes='', time_codes='', departments='', sfc_guide_title='', languages='', summary='', locations='', styles=''){
    console.log('#search URIs generator'); // 開始メッセージ
    const searchFirstURL = searchURIGenerator(1, title, year, semester, sub_semester, teacher_name, day_codes, time_codes, departments, sfc_guide_title, languages, summary, locations, styles); // 1ページ目のURLを生成
    const firstPageSelector = {
        'URL': 'body > div.main > div > div.right-column > div.pager > nav > span.last > a'
    }; // セレクタを定義 (最終ページを取得するためのセレクタ)
    const lastPageURLObjArray = await scrape(searchFirstURL, firstPageSelector); // 最終ページのURLを取得
    const lastPageURL = lastPageURLObjArray[0]['URL']; // 最終ページのURLを取得
    console.log('lastPageURL:', lastPageURL); // 最終ページのURLを表示
    let lastPageNum = 1; // ページ数を1に固定
    if (lastPageURL !== undefined) { // 最終ページが存在する場合
        lastPageNum = lastPageURL.split('page=')[1].split('&')[0]; // 最終ページ番号を取得
    }
    const PAGE_NUM = Number(lastPageNum); // 最終ページ番号を数値に変換
    console.log(`# ${PAGE_NUM} pages matched to your search criteria.`); // ページ数を表示

    const urls = [];
    // ページ数分のURLを生成
    for (let page = 1; page <= PAGE_NUM; page++) {
        urls.push(searchURIGenerator(page, title, year, semester, sub_semester, teacher_name, day_codes, time_codes, departments, sfc_guide_title, languages, summary, locations, styles));
    }
    return urls;
}


async function scrapeSyllabusSimply(title='', year='', semester='', sub_semester='', teacher_name='', day_codes='', time_codes='', departments='', sfc_guide_title='', languages='', summary='', locations='', styles='') {
    console.log('#scrape syllabus simply'); // 開始メッセージ

    const searchURLs = await searchURIsGenerator(title, year, semester, sub_semester, teacher_name, day_codes, time_codes, departments, sfc_guide_title, languages, summary, locations, styles); // 検索結果ページのURLを生成
    console.log('searchURLs:', searchURLs); // 検索結果ページのURLを表示

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

    // スクレイピング実行
    const dataArray = await scrapePages(searchURLs, selectors, searchURLs.length); // スクレイピング実行
    const nullDeletedDataArray = dataArray.filter((data) => data['Subject'] !== undefined); // Subjectが空のデータを削除 
    const results = nullDeletedDataArray.map((data) => {
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
                    data[key] = data[key].split(' \n').filter((name) => name !== ''); // 教員名を分割&空の要素を削除
                    break;
                case 'URL': // URLを加工
                    data[key] = HOST_URL + data[key].replace('?locale=ja', ''); // URLのlocale=jaを削除
                    break;
                default:
                    break;
            }
        }
        return data;
    });

    return results;
}

// メイン関数
async function main(){
    console.log('start'); // 開始メッセージ
    const title = '';
    const year = '2024';
    const semester = 'fall';

    const now = new Date(); // 現在時刻を取得
    const filepath = `data\\data_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}_${year}_${semester}.json`; // ファイル名 (data_年-月-日_時-分-秒_ページ数_タイトル_年度_学期.json)
    console.log('filepath:', filepath); // ファイル名を表示

    // // 引数から取得
    // // process.argv[0]はNode.jsの実行プロセスのパス、process.argv[1]は実行したスクリプトファイルのパス
    // // process.argv[2]以降が引数
    // const pageNums, title, year, semester, sub_semester, teacher_name, day_codes, time_codes, departments, sfc_guide_title, languages, summary, locations, styles = process.argv.slice(2);

    const data = await scrapeSyllabusSimply(title, year, semester); // スクレイピング実行

    await fs.writeFileSync(filepath, JSON.stringify(data, null, 4)); // ファイルに保存
    // console.log('data:', data); // データを表示

    console.log('done'); // 完了メッセージ
}

main();