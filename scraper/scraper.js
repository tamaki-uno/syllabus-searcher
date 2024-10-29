// インポート 
const axios = require('axios'); // HTTPクライアント
const cheerio = require('cheerio'); // HTML解析
const { log } = require('console');
const fs = require('fs'); // ファイル操作

const HOST_URL = 'https://syllabus.sfc.keio.ac.jp'; // ホスト名のURL

// スクレイピングする関数
async function scrape(url, selectors, type='text', save=false, urlsave=false) {
    try {
        const response = await axios.get(url); // リクエストを送信
        const html = response.data; // レスポンスのHTMLを取得
        const $ = cheerio.load(html); // cheerioを使ってHTMLを解析

        // 要素の取得
        let data = {}; // データを格納するオブジェクトを初期化
        if (urlsave) data['URL'] = url; // URLを保存する場合はURLをdataオブジェクトに追加

        // Selectorで要素を取得
        for (const selector in selectors) {
            // if (!selectors.hasOwnProperty(selector)) continue; // セレクターが存在しない場合はスキップ
            if ($(selectors[selector]).length === 0) continue; // セレクターが存在しない場合はスキップ
            const node = $(selectors[selector]); // セレクターで要素を取得
            // ほしい情報の種類ごとに情報を取得
            switch (type) {
                case 'text':
                    data[selector] = node.text(); // テキストを取得してdataオブジェクトにセレクター名をキーにして保存
                    break;
                case 'url':
                    data[selector] = node.attr('href'); // URLを取得してdataオブジェクトにセレクター名をキーにして保存
                    break;
                case 'html':
                    data[selector] = node.html(); // HTMLを取得してdataオブジェクトにセレクター名をキーにして保存
                    break;
                case 'node':
                    data[selector] = node; // ノードを取得してdataオブジェクトにセレクター名をキーにして保存
                    break;
                case  'both':
                    const keyNode = $(selector);
                    const key = keyNode.text();
                    const valueNode = node;
                    const value = valueNode.text();
                    data[key] = value;
                default:
                    console.error('Invalid type <scrape()>');
                    break;
            }
        }
        console.log(`*Scraped: ${url} <scrape()>`);
        // console.log(selectors);
        // console.log('*Scraped:', data);

        return data;
    } catch (error) {
        console.error(`Scrape Error: ${error} <scrape()>`);
    }
}

// 複数のURLをスクレイピングする関数
async function scrapePages(urls, selectors, type='text', save=false, form='connect', urlsave=false) {
    console.log(`#scrape pages. estimated time: ${urls.length}sec`);
    let timeRemain = urls.length;
    let datas;
    switch (form) {
        case 'connect':
            datas = {}; // データを格納するオブジェクトを初期化
            break;
        case 'array':
            datas = []; // データを格納する配列を初期化
            break;
        default:
            console.error('Invalid form <scrapePages()>');
            break;
    }
    for (const url of urls) {
        if (timeRemain % 10 === 0) console.log(`time remain: ${timeRemain}sec`); // 10秒ごとに残り時間を表示
        const data = await scrape(url, selectors, type, save, urlsave); // スクレイピング実行
        switch (form) {
            case 'connect':
                datas = {...datas, ...data}; // データをマージ (オブジェクトの結合) スプレッド構文 後ろのデータで上書きされる
                break;
            case 'array':
                datas.push(data); // データを配列に追加 分割された配列の形で保存
                break;
            default:
                console.error('Invalid form <scrapePages()>');
                break;
        }
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

// 複数の検索結果ページをスクレイピングしてURLを取得する関数
async function scrapePagesToGetUrls(pageNums, title='', year='', semester='', sub_semester='', teacher_name='', day_codes='', time_codes='', departments='', sfc_guide_title='', languages='', summary='', locations='', styles=''){
    console.log(`#scrape page to get urls. this may take maximum ${pageNums*25}secs.`);
    const searchURLs = [];
    // ページ数分のURLを生成
    for (let page = 1; page <= pageNums; page++) {
        searchURLs.push(searchURIGenerator(page, title, year, semester, sub_semester, teacher_name, day_codes, time_codes, departments, sfc_guide_title, languages, summary, locations, styles));
    }
    // セレクタを定義 (URLを取得するためのセレクタ)
    const selectors = {}
    for (let i = 1; i <= 25; i++) {
        selectors[`url${i}`] = `body > div.main > div > div.right-column > div.result > ul > li:nth-child(${i}) > div.detail-btn-wrapper > a`;
    }
    // スクレイピング実行
    const urlsObj = await scrapePages(searchURLs, selectors, 'url', false, 'connect', false);

    // console.log('@got urlsObj', urlsObj);
    // URLの配列を作成
    const urls = [];
    for (const key in urlsObj) {
        if (Object.prototype.hasOwnProperty.call(urlsObj, key)) {
            const url = HOST_URL + urlsObj[key].replace('?locale=ja', ''); // URLのlocale=jaを削除
            urls.push(url + '?locale=ja'); // URLを配列に追加 (日本語)
            urls.push(url + '?locale=en'); // URLを配列に追加 (英語)
        }
    }
    // console.log('@got urls', urls);

    return urls;
}

// シラバスのコース詳細ページをスクレイピングする関数
async function scrapeSyllabus(pageNums, title='', year='', semester='', sub_semester='', teacher_name='', day_codes='', time_codes='', departments='', sfc_guide_title='', languages='', summary='', locations='', styles='') {
    console.log('#scrape syllabus');
    // const pageNums = 10; // ページ数
    // 条件に合う詳細ページのURLを取得
    const urls = await scrapePagesToGetUrls(pageNums, title, year, semester, sub_semester, teacher_name, day_codes, time_codes, departments, sfc_guide_title, languages, summary, locations, styles);
    
    // セレクタを定義
    const selecterKB = 'body > div.main > div > ';
    const selecterKB2 = 'body > div.main > div > div:nth-child(2) > div.class-info > div > ';
    // const selectors = {
    //     '科目名': 'body > div.main > div > h2 > span.title',
    //     // 以下2列ゾーン
    //     '学部・研究科': 'body > div.main > div > div:nth-child(2) > div.class-info > div > dl:nth-child(1) > dd:nth-child(2)',
    //     '登録番号': 'body > div.main > div > div:nth-child(2) > div.class-info > div > dl:nth-child(1) > dd:nth-child(4)',
    //     '科目ソート': 'body > div.main > div > div:nth-child(2) > div.class-info > div > dl:nth-child(2) > dd:nth-child(2)',
    //     // 'おそらく正式な科目名': 'body > div.main > div > div:nth-child(2) > div.class-info > div > dl:nth-child(2) > dd:nth-child(4)',
    //     '分野': 'body > div.main > div > div:nth-child(2) > div.class-info > div > dl:nth-child(3) > dd:nth-child(2)',
    //     '単位': 'body > div.main > div > div:nth-child(2) > div.class-info > div > dl:nth-child(3) > dd:nth-child(4)',
    //     '開講年度・学期': 'body > div.main > div > div:nth-child(2) > div.class-info > div > dl:nth-child(4) > dd:nth-child(2)',
    //     'K-Number': 'body > div.main > div > div:nth-child(2) > div.class-info > div > dl:nth-child(4) > dd:nth-child(4)',
    //     // 以下1列ゾーン
    //     // '開講年度・学期': 'body > div.main > div > div:nth-child(2) > div.syllabus-info > dl:nth-child(1) > dd',
    //     '曜日・時限': 'body > div.main > div > div:nth-child(2) > div.syllabus-info > dl:nth-child(2) > dd',
    //     '授業教員名': 'body > div.main > div > div:nth-child(2) > div.syllabus-info > dl:nth-child(3) > dd',
    //     '実施形態': 'body > div.main > div > div:nth-child(2) > div.syllabus-info > dl:nth-child(4) > dd',
    //     '授業で使う言語': 'body > div.main > div > div:nth-child(2) > div.syllabus-info > dl:nth-child(5) > dd',
    //     '開講場所': 'body > div.main > div > div:nth-child(2) > div.syllabus-info > dl:nth-child(6) > dd',
    //     '授業形態': 'body > div.main > div > div:nth-child(2) > div.syllabus-info > dl:nth-child(7) > dd',
    //     'GIGAサティフィケート対象': 'body > div.main > div > div:nth-child(2) > div.syllabus-info > dl:nth-child(8) > dd',
    //     // 以下詳細
    //     '講義概要': 'body > div.main > div > div:nth-child(3) > dl > dd > p'
    // };

    // const selectors = {
    //     'body > div.main > div > h2 > span.title-label': 'body > div.main > div > h2 > span.title', // 科目名
    //     // `${selecterKB}h2 > span.title-label`: `${selecterKB}h2 > span.title`, // 科目名

    //     'body > div.main > div > div:nth-child(2) > div.class-info > div:nth-child(1) > dl:nth-child(1) > dt:nth-child(1)': 'body > div.main > div > div:nth-child(2) > div.class-info > div:nth-child(1) > dl:nth-child(1) > dd:nth-child(2)', // 学部・研究科
    //     'body > div.main > div > div:nth-child(2) > div.class-info > div:nth-child(1) > dl:nth-child(1) > dt:nth-child(3)': 'body > div.main > div > div:nth-child(2) > div.class-info > div:nth-child(1) > dl:nth-child(1) > dd:nth-child(4)', // 登録番号

    // };


    // スクレイピングの実行
    // const data = await scrapePages(urls, selectors, 'text', true, 'array', true);
    
    const selectors = {body: 'body'};
    const dataArray = await scrapePages(urls, selectors, 'text', false, 'array', true);
    // console.log('data:', data);
    const results = [];
    for (data of dataArray) {
        // console.log('data:', data);
        if (data['body'] === undefined) return 'couldnt find body from:'+data[URL] ; // データが取得できなかった場合はスキップ
        
        const shapedData = data['body'].replaceAll(' \n', '').replaceAll('  ', ''); // 余分な改行とスペースを削除
        const formatedData = shapedData.split('\n'); // 改行で分割
        // console.log('formatedData:', formatedData);
        const result = {
            'URL': data['URL'], // URL
            '科目名': formatedData[8].replace('科目名', '').replace('Subject', '') // 科目名
        };
        for (let i = 9; i < formatedData.length; i += 2) {
            result[formatedData[i]] = formatedData[i + 1]; // その他項目
        }
        // const data = await scrapePages(urls, selectors, 'both', false, 'array', true);
        // console.log('result:', result);
        results.push(result);
    }
    console.log(`scraped ${results.length} courses`);
    // return data;
    return results;
}

// メイン関数
async function main(){
    console.log('start'); // 開始メッセージ
    const pageNums = 100;
    const title = '';
    const year = '2024';
    const semester = 'fall';

    const now = new Date(); // 現在時刻を取得
    // const filename = `data\\data_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.json`; // ファイル名 (data_年/月/日_時:分:秒.json)
    const filename = `data\\data_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.json`; // ファイル名 (data_年/月/日_時:分:秒.json)
    console.log('filename:', filename); // ファイル名を表示

    // // 引数から取得
    // // process.argv[0]はNode.jsの実行プロセスのパス、process.argv[1]は実行したスクリプトファイルのパス
    // // process.argv[2]以降が引数
    // const pageNums, title, year, semester, sub_semester, teacher_name, day_codes, time_codes, departments, sfc_guide_title, languages, summary, locations, styles = process.argv.slice(2);

    const data = await scrapeSyllabus(pageNums, title, year, semester); // スクレイピング実行
    // const data = {
    //     'key': 'value',
    //     'key2': 'value2'
    // }
    // console.log('data:', data);
    // fs.writeFile()
    // fs.writeFileSync('data.json', JSON.stringify(data, null, 4)); // ファイルに保存
    // fs.writeFileSync(filename, JSON.stringify(data, null, 4)); // ファイルに保存
    fs.writeFile(filename, JSON.stringify(data, null, 4), (err) => {
        if (err) throw err;
    }); // ファイルに保存


    console.log('done'); // 完了メッセージ
}

main();
