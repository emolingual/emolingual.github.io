'use strict';
// let list = ["あいうえお", "あかさたな"];
let word2emoji = {};
let word_list = [];
let word_list_focus = [];
let emoji_list = []; // emojiクラスのインスタンスを入れる配列

let timeInterval = 1000; // テキストエリアの内容取得のタイムインターバル
let url = 'https://piez406ba1.execute-api.us-east-2.amazonaws.com/v1?text=';

function setup(){
    // window.addEventListener("touchstart", function (event) { event.preventDefault(); }, { passive: false });
    // window.addEventListener("touchmove", function (event) { event.preventDefault(); }, { passive: false });
    canvas = createCanvas(windowWidth, windowHeight);
    canvas.position(0,0);
    canvas.style('z-index','-1'); //canvasを後ろに移動する
    frameRate(60);
    getWord2Emoji();
    //timeIntervalごとにテキストエリアの内容を確認
    setInterval(getText, timeInterval);
}

function draw(){
    background(250);
    // console.log(mouseY);
    // console.log(emoji_list);
    emoji_list.forEach((emoji) => {
      // すべてのemojiに対して1フレームごとに実行
      // console.log(emoji.key+":"+emoji.emoji);
      emoji.display();
      drop_emoji();
    });
}
let selectemoji = "";
let pre_selectemoji = "";

//CSVファイルを読み込む関数getCSV()の定義
function getWord2Emoji(){
    var req = new XMLHttpRequest(); // HTTPでファイルを読み込むためのXMLHttpRrequestオブジェクトを生成
    req.open("get", "data/word2emoji.csv", true); // アクセスするファイルを指定
    req.send(null); // HTTPリクエストの発行

    // レスポンスが返ってきたらconvertCSVtoArray()を呼ぶ
    req.onload = function() {
    	convertCSVtoDic(req.responseText); // 渡されるのは読み込んだCSVデータ
    }
    return;
}

// 読み込んだCSVデータを二次元配列に変換する関数convertCSVtoArray()の定義
function convertCSVtoDic(str){ // 読み込んだCSVデータが文字列として渡される
    let result = []; // 最終的な二次元配列を入れるための配列
    let tmp = str.split("\n"); // 改行を区切り文字として行を要素とした配列を生成
    // 各行ごとにカンマで区切った文字列を要素とした二次元配列を生成
    for(let i=0;i<tmp.length-1;i++) {
        result[i] = tmp[i].split(',');
        let dic_list = [];
        let word = result[i][0];
        word_list.push(word);
        for (let j=1; j<result[i].length; j++) {
          dic_list.push(result[i][j]);
        }
        word2emoji[word] = dic_list;
        // print(word2emoji);
    }
    // console.log(word2emoji['time']);
    return
}

//drop-emoji
function drop_emoji(){
  emoji_list.forEach((emoji) => {
    //テキストボックスに絵文字入れる
    if(emoji.drop){
      // 　触った絵文字をテキストボックスに追加していく
      var area = document.getElementById("filecontent");

      //カーソルの位置を基準に前後を分割して、その間に文字列を挿入
      area.value = area.value.substr(0, area.selectionStart)
      + selectemoji
      + area.value.substr(area.selectionStart);
      pre_selectemoji = selectemoji;
      selectemoji = "";
      emoji.drop = false;
    }
  });

}
// mouse Interaction
function mousePressed() {
  emoji_list.forEach((emoji) => {
    //check if mouse is over the ellipse
    //絵文字の左上隅とマウス位置との距離
    emoji.offset.x = emoji.pos.x - mouseX;
    emoji.offset.y = emoji.pos.y - mouseY;
    //絵文字をクリック
    if(dist(emoji.pos.x-emoji.size/2, emoji.pos.y-emoji.size/2, mouseX, mouseY) < emoji.size){
      emoji.dragging = true;
      // emoji.selectemoji = emoji.emoji;
      selectemoji = emoji.emoji;
      // console.log(emoji.selectemoji);
    }
  });
}

function mouseReleased(){
  emoji_list.forEach((emoji) => {
    emoji.dragging = false;
  //  if(mouseX > 290 && mouseX < 600){
  //    if(mouseY > 80 && mouseY < 430){
        // emoji.dragging = false;
        emoji.drop = true;
  //    }
  //  }
    // emoji.dragging = false;
    // emoji.drop = true;
  });
}

// --------- API :P ------------

let input_message = "";
let ex_input_message = "";

function getText($this){
  // カーソルがある行の文章を取得
  let textarea = document.getElementById("filecontent");
  let index = getCursorPos(textarea.value, textarea.selectionStart);
  let sentences = textarea.value.split("\n");
  let input_message = sentences[index]

  console.log(word2emoji);

  // 中身が更新されていたら
  if(input_message != ex_input_message){
    word_list_focus = [];
    let input_words = input_message.split(" ");
    // console.log(input_words);
    input_words.forEach((word) => {
      if (word2emoji[word]) {
        // word_list_focus.push(word);
        word2emoji[word].forEach((emoji_from_word) => {
          emoji_list.push(new Emoji (word, emoji_from_word));
        });
        // console.log(word2emoji[word]);
        // emoji_list.push(new Emoji(word, word2emoji[word]));

      }
    });
    // getFromApi(input_message);
    ex_input_message = input_message;
  }
}

function getCursorPos(value, pos) {
  let before_text = value.substr(0, pos);
  let index = before_text.split("\n").length - 1;
  return index
}

function getFromApi(message){
    var request = new XMLHttpRequest();
    url = url + message;
    request.open('GET', url, true);

    // レスポンスが返ってきた時の処理
    request.onload = function() {
        let cnt =0;
        let responsejson = JSON.parse(request.response);
        responsejson.body.emojis.forEach((emojis) => {
            emojis.some((emoji) => {
              cnt++;
                // Emojiクラスを作成
                emoji_list.push(new Emoji(emoji.key, uni2emo(emoji.unicode), emoji.distance))
                if(cnt >=10){
                  return true;
                }
            });
        });
    }
    request.send();
}

// Unicodeをemojiに変換する関数(入力："-U+1F636"，出力："😶")．サロゲートペア対応
function uni2emo(unicode){
  // HTML Entityに変換する(例：-U+1F636 => &#x1F636;)
  let emoji_html = unicode.replace(/-U\+/g, ";&#x")+";";
  emoji_html = emoji_html.slice(1);
  // html Entityからemojiに変換する(例 &#x1F636; => 😶)
  let emoji = emoji_html.replace(/&#(.*?);/g, (m, p1) => String.fromCodePoint(`0${p1}`));
  return emoji
}

function createEmojis() {
  for (let key in word2emoji) {
    console.log('key:' + key + 'value:');
    console.log(word2emoji[key]);
    new Emoji(key, word2emoji[key]);
  }
}

// --------- emoji class :) ------------
//emoji-rain
class Emoji{
    constructor(key, emoji){
      //初期設定
      this.emoji = emoji; // emojiそのもの
      this.key = key; // emojiに関連づいたキーワード
      // this.distance = distance; // emojiとkeyの距離(小さいほど関連が深い)
      this.flag = true; // falseにすると元リストから取り除かれる
      this.size = 50;
      this.pos= createVector(width/2, height/2);

      console.log(this.emoji+" is associated with "+this.key);
      this.setup();
    }

    setup() {
      // ここにインスタンス作成時に行いたい初期化などの処理を書く
      // コンストラクタはいろんなUIに共通するものだけを書きたいので，
      // UI依存の処理はこっちに書く

      //emoji-座標系
      this.pos= createVector(random(width), random(-500,-10));
      this.velocity = createVector(0,0);
      this.offset = createVector(0,0);
      this.offset = createVector(0,0);

      //boolean
      this.dragging=false;
      this.drop = false;
      // this.size = 100;
      // emoji選択
      // this.selectemoji="";
      // this.pre_selectemoji="";
      // this.emojiCode=str(128512);
    }

    update(){
      // ここに1フレームごとにemojiオブジェクトに対して行いたい処理を書く
      //降ってくる動き
        // this.velocity.y = float(random(1,3));
        this.velocity.y = 1;
        this.pos.y += this.velocity.y;

        //mouse
        if(this.dragging){
            this.pos.x = mouseX + this.offset.x;
            this.pos.y = mouseY + this.offset.y;
        }

        if(this.pos.y > height){
            this.pos.y = 0;
            this.delete();
        }

        // //テキストボックスに絵文字入れる
        // if(this.drop){
        //   // 　触った絵文字をテキストボックスに追加していく
        //   var area = document.getElementById("filecontent");

        //   //カーソルの位置を基準に前後を分割して、その間に文字列を挿入
        //   area.value = area.value.substr(0, area.selectionStart)
        //   + this.selectemoji
        //   + area.value.substr(area.selectionStart);
        //   // this.pre_selectemoji = this.selectemoji;
        //   // this.selectemoji = "";
        //   this.drop = false;
        // }
    }

    display() {
      // this.setup();
      this.update();
      textSize(this.size);
      // console.log(this.emoji+" is displayed");
      text(this.emoji, this.pos.x, this.pos.y);
    }

    delete() {
      // 使い終わったemojiを削除する関数
      this.flag = false;
    }
}