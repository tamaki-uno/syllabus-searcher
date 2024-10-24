'use strict';


/*
JavaScriptの変数名の命名規則
node.jsのスタイルガイド：https://github.com/felixge/node-style-guide#use-lowercamelcase-for-variables-properties-and-function-names
Google JavaScript Style Guide：https://google.github.io/styleguide/jsguide.html#naming-method-names

- 変数、プロパティ、関数名、メソッド名はローワーキャメルケースで記述する （例: myVariable）
- 定数は全て大文字で記述し、単語の区切りにアンダースコアを使用する （例: MY_CONSTANT）
- クラス名はアッパーキャメルケース（パスカルケース）で記述する （例: MyClass）
*/



// jsonファイルを読み込む関数
async function fetchJson(url) {
    // まず、jsonファイルを読み込む
    const request = new Request(url); // リクエストを作成
    const response = await fetch(request); // リクエストを送信
    const data = await response.json(); // レスポンスをjsonとして取得

    return data;
}

// 検索の関数
async function searchCourse(data, keyword, days, times, fields) {
    console.log(`serachCourse: keyword: ${keyword}, days: ${days}, times: ${times}, fields: ${fields}`);
    
    // 検索結果を格納する配列
    const results = [];
    // // jsonファイルのデータを一つずつ取り出す
    // for (const item of data) {
    //     // 検索条件に合致するかを判定
    //     if (item['曜日・時限'] === day && item['時限'] === time && item['分野'] === field) {
    //         results.push(item); // 配列に追加
    //     }
    // }
    results.push(`keyword: ${keyword}`);
    results.push(`days: ${days}`);
    results.push(`times: ${times}`);
    results.push(`fields: ${fields}`);

    return results;
}

// フィルターの関数
function filterCourse(data, filter) {
    console.log(`filterCourse: filter: ${filter}`);
    // フィルター
    // それぞれのフィルター条件はor検索　フィルター同士はand検索
    const results = data.filter(item => {
        for (const key in filter) { // フィルターのkeyを取り出す
            if (!filter[key].includes(item[key])) { // フィルターのkeyにitem[key]が含まれていない場合 value deha?
                return false;
            }
        }
        return true; // すべての条件を満たす場合
    });
    return results;
}

// 結果を表示する関数
function dispalyResults(results) {
    for (const result of results) {
        const div = document.createElement('div'); // div要素を作成
        const h2 = document.createElement('h2'); // h2要素を作成
        const a = document.createElement('a'); // a要素を作成
        const table = document.createElement('table'); // table要素を作成
        const h3 = document.createElement('h3'); // h3要素を作成
        const p = document.createElement('p'); // p要素を作成

        div.className = 'round-box tile'; // div要素にクラスを追加
        h2.className = 'course-name'; // h2要素にクラスを追加
        a.className = 'inherit'; // a要素にクラスを追加
        a.target = '_blank'; // a要素にtargetを追加 (新しいタブで開く)
        a.rel = 'noopener noreferrer'; // a要素にrelを追加 (セキュリティ対策)
        table.className = 'course-info'; // table要素にクラスを追加
        h3.className = 'course-description-title'; // h3要素にクラスを追加
        p.className = 'round-box course-description'; // p要素にクラスを追加

        // resultのkeyを取り出し、それぞれを要素に追加
        for (const key in result) {
            switch (key) {
                case 'URL':
                    console.log('URL', result[key]);
                    div.href = result[key]; // div要素にリンクを追加
                    h2.href = result[key]; // h2要素にリンクを追加
                    a.href = result[key]; // a要素にリンクを追加
                    break;
                case '科目名':
                    a.textContent = result[key]; // a要素に科目名を追加
                    h2.appendChild(a); // h2にaを追加
                    break;
                case '講義概要':
                    h3.textContent = '講義概要'; // h3要素にタイトルを追加
                    p.innerHTML = result[key].replace(/\n/g, '<br>'); // p要素に講義概要を追加 (改行をbrに変換)
                    break;
                default:
                    const tr = document.createElement('tr'); // tr要素を作成 (table row)
                    const th = document.createElement('th'); // th要素を作成 (table header)
                    const td = document.createElement('td'); // td要素を作成 (table data)

                    th.textContent = key; // th要素にkeyを追加
                    td.textContent = result[key]; // td要素にresult[key]を追加
                    tr.appendChild(th); // trにthを追加
                    tr.appendChild(td); // trにtdを追加
                    table.appendChild(tr); // tableにtrを追加
                    break;
            }
        }

        div.appendChild(h2); // divにh2を追加
        div.appendChild(table); // divにtableを追加
        div.appendChild(h3); // divにh3を追加
        div.appendChild(p); // divにpを追加
        resultDisplay.appendChild(div); // resultにdivを追加
    }
}

// 検索結果のクラス
class SearchResult {
    // コンストラクタ
    constructor() {
        this.resultDisplay = document.getElementById('resultDisplay'); // 結果を表示する場所 (div要素)
        this.results = []; // 検索結果 json
        this.tiles = []; // 検索結果 CourseTile
        this.sortType = '科目名'; // ソートの種類
        this.sortOrder = 'ascending'; // ソートの順番
    }
    // 検索結果を表示するメソッド
    dispalyResults() {
        console.log('dispalyResults');
        this.resultDisplay.innerHTML = ''; // 表示をリセット
        for (const result of this.results) {
            let tile = new CourseTile(result); // タイルを作成
            this.tiles.push(tile); // タイルを配列に追加
            this.resultDisplay.appendChild(tile); // タイルを表示
        }
    }
    // 検索結果をセットするメソッド
    setResults(results) {
        console.log('setResults');
        this.results = results;
        this.sortTiles();
    }
    // タイルを並べ替えるメソッド
    sortTiles(sortType=this.sortType, sortOrder=this.sortOrder) {
        console.log('sortTiles');
        this.sortType = document.getElementById('sortType').value;
        this.sortOrder = document.getElementById('sortOrder').value;
        this.sortType = sortType;
        this.results.sort((a, b) => {
            // 並べ替えの条件によって比較
            if (sortOrder === 'ascending') {
                return a.courseData[sortType] - b.courseData[sortType];
            } else {
                return b.courseData[sortType] - a.courseData[sortType];
            }
        });
    }
}

class CourseTile {
    constructor(courseData, properties) {
        this.courseData = courseData;
        this.tile = this.createTile(courseData, properties);
    }
    // タイルのdiv要素を作成するメソッド
    createTile(courseData, properties) {
        // 要素を作成
        this.tile = document.createElement('div'); // タイルのdiv要素
        const h2 = document.createElement('h2'); // h2要素を作成
        const a = document.createElement('a'); // a要素を作成
        const table = document.createElement('table'); // table要素を作成
        const h3 = document.createElement('h3'); // h3要素を作成
        const p = document.createElement('p'); // p要素を作成
        // 属性を追加
        this.div.className = 'tile'; // div要素にクラスを追加
        h2.className = 'course-name'; // h2要素にクラスを追加
        a.className = 'inherit'; // a要素にクラスを追加
        a.target = '_blank'; // a要素にtargetを追加 (新しいタブで開く)
        a.rel = 'noopener noreferrer'; // a要素にrelを追加 (セキュリティ対策)
        table.className = 'course-info'; // table要素にクラスを追加
        h3.className = 'course-description-title'; // h3要素にクラスを追加
        p.className = 'course-description'; // p要素にクラスを追加
        // courseDataのkeyを取り出し、それぞれを要素に追加
        for (const key in courseData) {
            switch (key) {
                case 'URL':
                    console.log('URL', result[key]);
                    div.href = result[key]; // div要素にリンクを追加
                    h2.href = result[key]; // h2要素にリンクを追加
                    a.href = result[key]; // a要素にリンクを追加
                    break;
                case '科目名':
                    a.textContent = result[key]; // a要素に科目名を追加
                    h2.appendChild(a); // h2にaを追加
                    break;
                case '講義概要':
                    h3.textContent = '講義概要'; // h3要素にタイトルを追加
                    p.innerHTML = result[key].replace(/\n/g, '<br>'); // p要素に講義概要を追加 (改行をbrに変換)
                    break;
                default:
                    const tr = document.createElement('tr'); // tr要素を作成 (table row)
                    const th = document.createElement('th'); // th要素を作成 (table header)
                    const td = document.createElement('td'); // td要素を作成 (table data)

                    th.textContent = key; // th要素にkeyを追加
                    td.textContent = result[key]; // td要素にresult[key]を追加
                    tr.appendChild(th); // trにthを追加
                    tr.appendChild(td); // trにtdを追加
                    table.appendChild(tr); // tableにtrを追加
                    break;
            }
        }
        // 要素を追加
        this.div.appendChild(h2); // divにh2を追加
        this.div.appendChild(table); // divにtableを追加
        this.div.appendChild(h3); // divにh3を追加
        this.div.appendChild(p); // divにpを追加
        return this.div;
    }
}

// メイン関数
async function main() {
    // htmlの要素を取得
    const FORM = document.getElementById('form'); // form要素
    const ADDITIONAL_CONDITIONS = document.getElementById('additionalConditions'); // 追加の条件のdiv
    const SORT = document.getElementById('sort'); // ソートのdiv
    const SEARCH_BTN = document.getElementById('searchBtn'); // 検索ボタン
    const SORT_BTN = document.getElementById('sortBtn'); // ソートボタン
    // const RESULT_DISPLAY = document.getElementById('resultDisplay');   // 結果を表示する場所
    const RESULT_DISPLAY = new SearchResult(); // 検索結果のクラス

    // jsonファイルを取得
    const DATA = await fetchJson('data.json');

    // 例の表示
    let exampleResults = DATA.slice(0, 3); // 例として最初の3つのデータを取得
    dispalyResults(exampleResults); // 例を表示

    // 検索ボタンにイベントリスナーを追加
    SEARCH_BTN.addEventListener('click', async () => {
        console.log('search');
        RESULT_DISPLAY.innerHTML = ''; // 表示をリセット
        // フォームの値を取得 (キーワード、曜日、時限、分野をそれぞれ配列で取得)
        const KEYWORD = FORM.keyword.value; // キーワードを取得
        // 
        const DAYS = Array.from(
            ADDITIONAL_CONDITIONS.querySelectorAll('input[name="day"]:checked')
        ).map(input => input.value); // dayの値を取得
        // クエリセレクタでnameがdayで、checkedのinput要素を取得し、そのvalueを取得
        // mapで取得したそれぞれのinput要素に対して、valueを取得し、配列に格納
        const TIMES = Array.from(ADDITIONAL_CONDITIONS.querySelectorAll('input[name="time"]:checked')).map(input => input.value); // timeの値を取得
        const FIELDS = Array.from(ADDITIONAL_CONDITIONS.querySelectorAll('input[name="field"]:checked')).map(input => input.value); // fieldの値を取得
        // 検索と表示
        const RESULTS = await searchCourse(DATA, KEYWORD, DAYS, TIMES, FIELDS); // 検索
        RESULT_DISPLAY.setResults(RESULTS); // 結果をセット
        RESULT_DISPLAY.dispalyResults(); // 結果を表示
    });
    SORT_BTN.addEventListener('click', () => {
        console.log('sort');
        // sort_course(data); // ソート
        RESULT_DISPLAY.sortTiles(); // タイルをソート
        RESULT_DISPLAY.dispalyResults(); // 結果を表示
    });
}

// メイン関数を実行
main();