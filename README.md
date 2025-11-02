# 動画ダウンローダ Chrome拡張（汎用・認証動画対応）

## 概要

この拡張は **YouTube、Zoom、Moodle、SharePoint等の認証付き動画をChromeのログイン状態のままMP4最高画質でダウンロード** できるツールです。Cookie/Referer/UAを活用し、通常ダウンロードできない学習・配信サイトにも幅広く対応します。

***

## 特徴

- Chrome拡張でcookie自動取得＆バックグラウンドダウンロード
- settings.jsonでパス・出力先・主要設定を一元管理
- yt-dlpをNative Messaging経由で呼び出すことで認証必須動画も高精度対応
- 完了・警告・エラーをpopupや通知で明確表示
- manifest.jsonのhost_permissionsを `*://*/*` にすれば全動画サイト対応OK

***

## インストール手順

### 必要ソフト

- yt-dlp  
  `brew install yt-dlp`
- ffmpeg  
  `brew install ffmpeg`
- Python 3.x

***

### 1. リポジトリの準備と拡張インストール

1. 当リポジトリをcloneまたはダウンロード
2. Chrome「拡張機能」＞「デベロッパーモード」＞「パッケージ化されていない拡張機能を読み込む」

***

### 2. Native Messaging Hostのセットアップ

#### **超重要: com.ytdl.downloader.jsonは必ず編集！**

- `native_host.py`の絶対パスを `"path"` にセット
    - 例: `/Users/yourname/Documents/work/ytdl-extension/native_host.py`
        - Mac: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/` に配置
        - Windows例: `C:\Users\yourname\AppData\Local\Google\Chrome\User Data\NativeMessagingHosts\`
- 拡張のIDが異なれば `"allowed_origins"` も修正
- **このファイルが「今のPC・ユーザーで一致したパス」になっていない場合は絶対に動きません！**

#### 例（編集必須）

```json
{
    "name": "com.ytdl.downloader",
    "description": "Video Downloader Native Host",
    "path": "/Users/yourname/Documents/work/ytdl-extension/native_host.py",
    "type": "stdio",
    "allowed_origins": [
        "chrome-extension://<your-extension-id>/"
    ]
}
```

***

### 3. settings.jsonの設定

- `settings.json` でyt-dlp, ffmpegのパスやダウンロード先ディレクトリを一括セット
- 他PCや新しいユーザーで使う場合もこのファイルだけ直せばOK
- 例：

```json
{
    "ytdl_path": "/opt/homebrew/bin/yt-dlp",
    "ffmpeg_path": "/opt/homebrew/bin/ffmpeg",
    "download_dir": "~/Downloads/ytdl-extension",
    "env_path": "/usr/local/bin:/opt/homebrew/bin",
    "debug_log": "~/Documents/work/ytdl-extension/debug.log",
    "default_format": "mp4",
    "default_quality": "best"
}
```

***

### 4. manifest.json 設定

- `"host_permissions": ["*://*/*"]` で全動画サイト対応
- その他 `"permissions"` もChromeAPI仕様に合わせて追加

***

## 別環境や初回セットアップ時に**絶対修正が必要な箇所まとめ**

1. `com.ytdl.downloader.json` の `"path"`（native_host.pyの実ファイル絶対パス）
2. `com.ytdl.downloader.json` の `"allowed_origins"`（拡張ID変更時のみ）
3. `settings.json` の全パス・dir（各ユーザーPCで異なる場合に編集）
4. `manifest.json` （必要に応じて）

**これらは「コピペだけ」では絶対に動かないので、導入時に必ず自分用に修正してください。**

***

## 注意・Tips

- yt-dlpの警告（cookieヘッダ廃止予定）は現状放置OK。対応必要になったらcookie.txt方式へ
- 配信サイトがDRMや暗号化DASH（.m4s）などの場合はDL不可（画面録画のみ有効）
- debug.logでDL失敗時はpython実行結果を随時確認
- シェル・パスを環境ごとに一発で切り替えるにはsettings.jsonを必ず編集

***

## 推奨バージョン

- yt-dlp 2024-03 以降  
- ffmpeg 4.x 以降  
- Chrome 100 以降

***

## ライセンス

MIT