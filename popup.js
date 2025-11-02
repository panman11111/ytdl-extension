document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  let finished = false;
  let lastStatusMessage = "";

  document.getElementById("downloadBtn").addEventListener("click", async () => {
    finished = false;
    lastStatusMessage = "";

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const url = tab.url;

      statusDiv.textContent = "ダウンロード中...";
      statusDiv.style.background = "#f1f1f1";
      statusDiv.style.color = "#333";

      // Cookie取得
      let cookieStr = "";
      try {
        const cookies = await chrome.cookies.getAll({ url: url });
        if (!cookies || cookies.length === 0) {
          statusDiv.textContent =
            "エラー: 認証Cookie取得不可（ログイン状態で再実行してください）";
          statusDiv.style.background = "#ffd6d6";
          statusDiv.style.color = "#a10000";
          finished = true;
          return;
        }
        cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
        console.log("取得Cookie:", cookieStr);
      } catch (e) {
        statusDiv.textContent = "エラー: Cookie取得失敗 " + e;
        statusDiv.style.background = "#ffd6d6";
        statusDiv.style.color = "#a10000";
        finished = true;
        return;
      }

      const referer = url;
      const userAgent = navigator.userAgent;

      // backgroundにDLリクエスト（Native hostはbackground.js経由で管理）
      chrome.runtime.sendMessage(
        {
          type: "download",
          data: {
            url,
            format: "mp4",
            quality: "best",
            cookie: cookieStr,
            referer: referer,
            user_agent: userAgent,
          },
        },
        (resp) => {
          if (resp && resp.started) {
            statusDiv.textContent = "ダウンロード開始";
            lastStatusMessage = "ダウンロード開始";
          }
        }
      );
    } catch (error) {
      statusDiv.textContent = "エラー: " + error.message;
      statusDiv.style.background = "#ffd6d6";
      statusDiv.style.color = "#a10000";
      finished = true;
    }
  });

  // DL進捗/完了通知（popupを閉じたり再度開いても最後のステータス表示維持）
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "status" && msg.data) {
      finished = true;
      const response = msg.data;

      if (response.status === "success") {
        if (response.message && response.message.includes("警告あり")) {
          statusDiv.textContent = response.message;
          statusDiv.style.background = "#fffab7";
          statusDiv.style.color = "#333000";
          lastStatusMessage = response.message;
        } else {
          statusDiv.textContent = response.message || "ダウンロード完了！";
          statusDiv.style.background = "#d6ffd6";
          statusDiv.style.color = "#005500";
          lastStatusMessage = response.message || "ダウンロード完了！";
        }
      } else if (response.status === "downloading") {
        statusDiv.textContent = response.message || "ダウンロード中...";
        statusDiv.style.background = "#f1f1f1";
        statusDiv.style.color = "#333";
        lastStatusMessage = response.message || "ダウンロード中...";
      } else if (response.status === "error") {
        statusDiv.textContent = "エラー: " + (response.error || "不明なエラー");
        statusDiv.style.background = "#ffd6d6";
        statusDiv.style.color = "#a10000";
        lastStatusMessage = "エラー: " + (response.error || "不明なエラー");
      }
    }
  });

  // popup再表示時も前回状態維持
  // ※セッション越えで状態維持したい場合はlocalStorage利用を推奨
  if (lastStatusMessage) {
    statusDiv.textContent = lastStatusMessage;
  }
});
