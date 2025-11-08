document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const videoContainer = document.getElementById("videoContainer"); // 追加: サムネ一覧表示用
  let finished = false;
  let lastStatusMessage = "";

  document.getElementById("downloadBtn").addEventListener("click", async () => {
    finished = false;
    lastStatusMessage = "";
    videoContainer.innerHTML = ""; // 表示初期化

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // videoタグ情報＋サムネイルを取得
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return Array.from(document.querySelectorAll("video")).map(
            (v, idx) => {
              let thumb = "";
              try {
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, v.videoWidth);
                canvas.height = Math.max(1, v.videoHeight);
                const ctx = canvas.getContext("2d");
                ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
                thumb = canvas.toDataURL("image/jpeg", 0.5);
              } catch (e) {}
              return {
                idx,
                src: v.src,
                width: v.videoWidth,
                height: v.videoHeight,
                thumb,
              };
            }
          );
        },
      });
      const videos = result.result;

      if (!videos || videos.length === 0) {
        statusDiv.textContent = "エラー: 講義動画（videoタグ）が見つかりません";
        statusDiv.style.background = "#ffd6d6";
        statusDiv.style.color = "#a10000";
        finished = true;
        return;
      }

      let url = "";
      if (videos.length === 1) {
        url = videos[0].src;
        startDownload(url);
      } else {
        // 複数候補をサムネイル＋infoで表示→クリックでダウンロード
        statusDiv.textContent =
          "複数の動画候補があります。ダウンロードする動画をクリックしてください。";
        statusDiv.style.background = "#fffab7";
        statusDiv.style.color = "#222";
        videos.forEach((v) => {
          const div = document.createElement("div");
          div.style.marginBottom = "16px";
          div.style.cursor = "pointer";
          div.style.border = "1px solid #aaa";
          div.style.padding = "5px";
          div.innerHTML =
            `<b>No.${v.idx}</b> サイズ: ${v.width}x${v.height}<br>` +
            (v.thumb
              ? `<img src="${v.thumb}" style="max-width:180px;max-height:120px;display:block;margin:4px 0;">`
              : "") +
            `<span style="font-size:11px;color:#444;">URL末尾: ...${v.src.slice(
              -24
            )}</span>`;
          div.onclick = () => {
            videoContainer.innerHTML = "";
            startDownload(v.src);
          };
          videoContainer.appendChild(div);
        });
        return;
      }

      // 1つだけの時はstartDownload(url)内でダウンロード開始
    } catch (error) {
      statusDiv.textContent = "エラー: " + error.message;
      statusDiv.style.background = "#ffd6d6";
      statusDiv.style.color = "#a10000";
      finished = true;
    }
  });

  function startDownload(url) {
    // この関数内でDLリクエストを行う
    const statusDiv = document.getElementById("status");
    statusDiv.textContent = "ダウンロード中...";
    statusDiv.style.background = "#f1f1f1";
    statusDiv.style.color = "#333";
    chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
      // Cookie取得
      let cookieStr = "";
      try {
        const cookies = await chrome.cookies.getAll({ url: tab.url });
        if (!cookies || cookies.length === 0) {
          statusDiv.textContent =
            "エラー: 認証Cookie取得不可（ログイン状態で再実行してください）";
          statusDiv.style.background = "#ffd6d6";
          statusDiv.style.color = "#a10000";
          return;
        }
        cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
      } catch (e) {
        statusDiv.textContent = "エラー: Cookie取得失敗 " + e;
        statusDiv.style.background = "#ffd6d6";
        statusDiv.style.color = "#a10000";
        return;
      }

      const referer = tab.url;
      const userAgent = navigator.userAgent;

      chrome.runtime.sendMessage(
        {
          type: "download",
          data: {
            url,
            format: "mp4",
            quality: "best",
            cookie: cookieStr,
            referer,
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
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "status" && msg.data) {
      finished = true;
      const response = msg.data;
      if (response.status === "success") {
        statusDiv.textContent = response.message || "ダウンロード完了！";
        statusDiv.style.background = "#d6ffd6";
        statusDiv.style.color = "#005500";
        lastStatusMessage = response.message || "ダウンロード完了！";
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

  if (lastStatusMessage) {
    statusDiv.textContent = lastStatusMessage;
  }
});
