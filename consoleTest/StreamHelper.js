// Note:
// console test
// 全選複製貼console可用
// 直播開始後在直播頁面使用 重整後請重新使用 無須登入
// log level 可以開 Info only
// 網站音訊關閉時 提示聲也會關閉

var ObserveConfig = { childList: true };
var EventType = Object.freeze({ "DEFAULT": 0, "JOIN": 1, "MSG": 2, "GIFT": 3 });
var userName = userIdentify();
var attentionList = [];

function userIdentify() {
    var name = "name";
    var btmBar = document.querySelector('.bottom-bar');
    // login
    if (btmBar != undefined) {
        var userInfo = btmBar.querySelectorAll('.username');
        if (userInfo.length > 0) {
            //小耳朵
            name = userInfo[0].innerText;
        } else {
            //主播
            name = document.querySelector('.creator').querySelectorAll('.nickname')[0].innerText;
        }
    }
    console.log("username : " + name);
    return name;
}

//////////////////////////////////////////////////////////////////////
// Beep.

/**
 * example audio by EventType + attentionRing
 * ["DEFAULT", "JOIN", "MSG", "GIFT", "attentionRing"]
 * todo: use local audio in Extension 
*/
var beeps = [
    new Audio("https://freesound.org/data/previews/192/192276_3509815-lq.mp3"),

    // 進入直播間
    new Audio("https://cdn.freesound.org/previews/13/13658_12368-lq.mp3"),

    // 留言
    new Audio("https://cdn.freesound.org/previews/256/256116_4486188-lq.mp3"),
    new Audio("https://cdn.freesound.org/previews/590/590042_129727-lq.mp3"),
];
var attentionBeeps = [
    new Audio("https://freesound.org/data/previews/192/192276_3509815-lq.mp3"),
    new Audio("https://cdn.freesound.org/previews/242/242429_3509815-lq.mp3"),
    new Audio("https://cdn.freesound.org/previews/177/177494_33044-lq.mp3"),
    new Audio("https://cdn.freesound.org/previews/352/352661_4019029-lq.mp3")
];

//louder 留言 https://freesound.org/data/previews/43/43677_24837-lq.mp3
//louder 進入直播間 https://freesound.org/data/previews/484/484344_5121236-lq.mp3

/**
 * Beep Volume on EventType
 */
var BeepVolume = [true, true, true, true];

function playBeep(type = EventType.DEFAULT, isAttention = false) {

    if (BeepVolume[EventType.DEFAULT] && BeepVolume[type]) {
        isAttention ? attentionBeeps[type].play() : beeps[type].play();
    }
}

/**
 * set beep volume by event type, 
 * mute all volume by type DEFAULT
 * @param {*EventType} type 
 * @param {*Boolean} volume 
 */
function volumeBeep(type = EventType.DEFAULT, volume = false) {
    BeepVolume[type] = volume;
    if (volume) { BeepVolume[EventType.DEFAULT] = volume };
}

//////////////////////////////////////////////////////////////////////
// AutoReply.
// 可能移除
// input event 未處理

var inputBox = document.getElementsByClassName('input-box')[0].lastChild;
var replybtn = document.getElementsByClassName('btn btn-send');

function autoReply(reply = "") {
    if (stopReply) return;
    if (inputBox.value != "") console.log("清除: " + inputBox.value);
    inputBox.setAttribute('value', reply);
    //replybtn[0].click();
}

//////////////////////////////////////////////////////////////////////
// Join.

/**
*	welcome with greeting(早中晚好/anonymous, not random)
*	可以不留言歡迎anonymous
*/
function welcome(name, anonymous = false) {
    if (name == undefined || name == userName) return; // ||anonymous
    var today = new Date();
    var hr = today.getHours();
    var greeting = "";
    if (anonymous) { greeting = "欢迎 " + name }
    else if (hr >= 5 && hr <= 10) { greeting = name + " 早上好ヽ(•̀ω•́ )ゝ" }
    else if (hr >= 11 && hr <= 17) { greeting = name + " 午好呀 (•̀ᴗ•́)و ̑̑ " }
    else { greeting = name + " 晚好呀～" }

    // todo: poster
    console.log(today.getHours() + ":" + today.getMinutes());
    console.log(greeting);
    autoReply(greeting);
}

/**
 * observer callback
 * @param {*} mutationsList 
 */
var callbackJ = function (mutationsList) {
    for (var mutation of mutationsList) {
        if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].className.includes('join-queue-effect')) {
            // check anonymous
            var userClassName = mutation.addedNodes[0].firstChild.className;
            if (userClassName != 'join-user') userClassName = 'username';
            // get name
            var name = mutation.addedNodes[0].querySelector('.' + userClassName).innerText.replace(" 来啦", "");

            playBeep(EventType.JOIN, attentionList.includes(name));
            welcome(name, userClassName == 'join-user');
        }
    }
};

var observerJ = new MutationObserver(callbackJ);
var joinTarget = document.getElementById('ChatBox');

//////////////////////////////////////////////////////////////////////
// Msg.

/**
 * observer callback
 * @param {*} mutationsList 
 */
var callbackM = function (mutationsList) {
    for (var mutation of mutationsList) {
        if (mutation.addedNodes[0] && mutation.addedNodes[0].querySelector('.username').innerText == userName) return;

        // todo: marquee
        /*
        var today = new Date();
        console.log(today.getHours() + ":" + today.getMinutes());
        console.log(
            "U: " + mutation.addedNodes[0].querySelector('.username').innerText + " : " +
            "M: " + mutation.addedNodes[0].querySelector('.message-content').innerText
        );
        */
        let isAttention = mutation.addedNodes[0] && mutation.addedNodes[0].querySelector('.username') && attentionList.includes(mutation.addedNodes[0].querySelector('.username').innerText);
        playBeep(EventType.MSG, isAttention);
    }
};

var observerM = new MutationObserver(callbackM);
var msgTarget = document.querySelector('.message-list');

//////////////////////////////////////////////////////////////////////
// Gift.

/**
 * observer callback
 * todo: difference on 猫粮 猫罐头 
 * @param {*} mutationsList 
 */
var callbackG = function (mutationsList) {
    for (var mutation of mutationsList) {
        if (mutation.addedNodes.length > 0) {
            var strAry = mutation.addedNodes[0].innerText.split('\n');
            autoReply("感謝 " + strAry[0] + " 的 " + strAry[1].replace("送出 ", ""));

            // todo: poster
            var today = new Date();
            console.log(today.getHours() + ":" + today.getMinutes());
            console.log("感謝 " + strAry[0] + " 的 " + strAry[1].replace("送出 ", "") + strAry[2]);
            // playBeep(EventType.GIFT);
            playBeep(EventType.GIFT, attentionList.includes(strAry[0]));
        }
    }
};

var observerG = new MutationObserver(callbackG);
var giftTarget = document.querySelector('.gift-queue');

//////////////////////////////////////////////////////////////////////
// Settings.

// 特別關注 填完整ID ["NameA","NameB","NameC"]
attentionList = [];

var stopReply = true;

// window.open
// todo: poster(marquee) on/off by EventType

//全部靜音
//volumeBeep(EventType.DEFAULT, false);
//取消全部靜音
//volumeBeep(EventType.DEFAULT, true);

//靜音留言
//volumeBeep(EventType.MSG, false);
//開啟留言音效
//volumeBeep(EventType.MSG, true);
//靜音禮物
//volumeBeep(EventType.GIFT, false);
//開啟禮物音效
//volumeBeep(EventType.GIFT, true);
//靜音歡迎
//volumeBeep(EventType.JOIN, false);
//開啟歡迎音效
//volumeBeep(EventType.JOIN, true);

//observerJ.disconnect();
//observerM.disconnect();
//observerG.disconnect();
observerJ.observe(joinTarget, ObserveConfig);
observerM.observe(msgTarget, ObserveConfig);
observerG.observe(giftTarget, ObserveConfig);