document.getElementById("downloadBtn").addEventListener("click", async () => {
  const statusDiv = document.getElementById("status");
  let finished = false;

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const url = tab.url;

    if (!url.includes("youtube.com/watch") && !url.includes("zoom.us/rec/")) {
      statusDiv.textContent = "エラー: 対応動画ページで実行してください";
      statusDiv.style.background = "#ffd6d6";
      statusDiv.style.color = "#a10000";
      finished = true;
      return;
    }

    statusDiv.textContent = "ダウンロード中...";
    statusDiv.style.background = "#f1f1f1";
    statusDiv.style.color = "#333";
    finished = false;

    // Cookie取得
    let cookieStr = "";
    try {
      const cookies = await chrome.cookies.getAll({ url: url });
      if (!cookies || cookies.length === 0) {
        statusDiv.textContent =
          "エラー: Zoom認証Cookie取得不可（ログイン状態で再実行してください）";
        statusDiv.style.background = "#ffd6d6";
        statusDiv.style.color = "#a10000";
        finished = true;
        return;
      }
      cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
      console.log("取得Cookie: ", cookieStr); // debug
    } catch (e) {
      statusDiv.textContent = "エラー: Cookie取得失敗 " + e;
      statusDiv.style.background = "#ffd6d6";
      statusDiv.style.color = "#a10000";
      finished = true;
      return;
    }

    const referer = url;
    const userAgent = navigator.userAgent;

    const port = chrome.runtime.connectNative("com.ytdl.downloader");

    port.onMessage.addListener((response) => {
      finished = true;
      if (response.status === "success") {
        if (response.message && response.message.includes("警告あり")) {
          statusDiv.textContent = response.message;
          statusDiv.style.background = "#fffab7";
          statusDiv.style.color = "#333000";
        } else {
          statusDiv.textContent = response.message || "ダウンロード完了！";
          statusDiv.style.background = "#d6ffd6";
          statusDiv.style.color = "#005500";
        }
      } else if (response.status === "downloading") {
        statusDiv.textContent = response.message || "ダウンロード中...";
        statusDiv.style.background = "#f1f1f1";
        statusDiv.style.color = "#333";
      } else if (response.status === "error") {
        statusDiv.textContent = "エラー: " + (response.error || "不明なエラー");
        statusDiv.style.background = "#ffd6d6";
        statusDiv.style.color = "#a10000";
      }
    });

    port.onDisconnect.addListener(() => {
      if (chrome.runtime.lastError && !finished) {
        statusDiv.textContent = "エラー: " + chrome.runtime.lastError.message;
        statusDiv.style.background = "#ffd6d6";
        statusDiv.style.color = "#a10000";
      }
    });

    // Native hostにcookie送信（必須！）
    port.postMessage({
      url: url,
      format: "mp4",
      quality: "best",
      cookie: cookieStr,
      referer: referer,
      user_agent: userAgent,
    });
  } catch (error) {
    statusDiv.textContent = "エラー: " + error.message;
    statusDiv.style.background = "#ffd6d6";
    statusDiv.style.color = "#a10000";
    finished = true;
  }
});
