let nativePort = null;
let lastStatus = null;

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // DL要求を受け取った場合
  if (request.type === "download") {
    // Native host起動
    if (nativePort) nativePort.disconnect(); // 既存接続クローズ
    nativePort = chrome.runtime.connectNative("com.ytdl.downloader");
    nativePort.onMessage.addListener((msg) => {
      lastStatus = msg;
      // DL進捗・完了等をポップアップ/Badge/通知API等で通知可能
      chrome.runtime.sendMessage({ type: "status", data: msg });
    });
    nativePort.onDisconnect.addListener(() => {
      nativePort = null;
      chrome.runtime.sendMessage({ type: "status", data: lastStatus });
    });
    // Native hostにリクエスト
    nativePort.postMessage(request.data);
    sendResponse({ started: true });
    return true;
  }
});
