'use strict';

// htmlの要素を取得
const searchBtn = document.getElementById('searchBtn'); // 検索ボタン
const form = document.getElementById('form'); // form要素
const resultDisplay = document.getElementById('resultDisplay');   // 結果を表示する場所

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

// 結果を表示する関数
function dispaly_results(results) {
    for (const result of results) {
        const div = document.createElement('div'); // div要素を作成
        const h2 = document.createElement('h2'); // h2要素を作成
        const a = document.createElement('a'); // a要素を作成
        const table = document.createElement('table'); // table要素を作成
        const h3 = document.createElement('h3'); // h3要素を作成
        const p = document.createElement('p'); // p要素を作成

        div.className = 'tile'; // div要素にクラスを追加
        h2.className = 'course-name'; // h2要素にクラスを追加
        a.className = 'inherit'; // a要素にクラスを追加
        a.target = '_blank'; // a要素にtargetを追加 (新しいタブで開く)
        a.rel = 'noopener noreferrer'; // a要素にrelを追加 (セキュリティ対策)
        table.className = 'course-info'; // table要素にクラスを追加
        h3.className = 'course-description-title'; // h3要素にクラスを追加
        p.className = 'course-description'; // p要素にクラスを追加

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

// メイン関数
async function main() {
    // jsonファイルを取得
    const data = await fetchJson('data.json');
    const exampleResults = data.slice(0, 3); // 例として最初の3つのデータを取得
    dispaly_results(exampleResults);
    // 検索ボタンにイベントリスナーを追加
    searchBtn.addEventListener('click', async () => {
        resultDisplay.innerHTML = ''; // 表示をリセット
        // const day = form.elements['day'].value; // dayの値を取得
        // const time = form.details.elements['time'].value; // timeの値を取得
        // const field = form.field.value; // fieldの値を取得
        // キーワードを取得
        const keyword = form.keyword.value; // キーワードを取得

        // チェックボックスの値を取得（配列で取得）
        const days = Array.from(form.querySelectorAll('input[name="day"]:checked')).map(input => input.value); // dayの値を取得
        const times = Array.from(form.querySelectorAll('input[name="time"]:checked')).map(input => input.value); // timeの値を取得
        const fields = Array.from(form.querySelectorAll('input[name="field"]:checked')).map(input => input.value); // fieldの値を取得
        const results = await searchCourse(data, keyword, days, times, fields); // 検索
        dispaly_results(results); // 結果を表示
    });
}

// メイン関数を実行
main();