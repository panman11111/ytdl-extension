# 動画ダウンローダ Chrome拡張 (YouTube/Zoom対応)

## 概要

本拡張は**YouTube や Zoom 録画ページなどの映像ページを Chrome 上で認証状態のまま最高画質MP4でダウンロードできる**ユーティリティです。  
CookieやReferer・User-Agentなどの認証情報を活用し、ログインが必要な動画にも幅広く対応します。

- **サポート対象例**:
  - YouTubeの動画
  - Zoom録画（認証付き含む）
  - 今後、対象サイトをmanifestで追加可能

## 特徴
- Chrome拡張から動画ページの認証cookieを自動取得
- Native Messaging経由でローカルのPythonダウンローダ（yt-dlp）を呼び出し
- **認証必須なZoomやYouTube等での一撃ダウンロード**
- 成功/警告/エラー判定と分かりやすいUI表示

***

## インストール手順

### 1. 必要ソフトの導入

- **yt-dlp**  
  インストール例（Mac）:  
  ```sh
  brew install yt-dlp
  ```
- **ffmpeg**  
  動画変換用に必要です  
  ```sh
  brew install ffmpeg
  ```
- **Python 3.x**  
  標準でOK

***

### 2. Chrome拡張のインストール

1. このリポジトリをclone or ダウンロード
2. Chromeの「拡張機能」メニュー → 「デベロッパーモード」 → 「パッケージ化されていない拡張機能を読み込む」→ 本リポジトリのフォルダ選択

### 3. Native Messaging Hostのセットアップ

- `native_host.py`をフルパスで配置（例: `/Users/xxx/Documents/work/ytdl-extension/native_host.py`  ）
- マニフェスト(`com.videodl.downloader.json` など)をChromeが参照するネイティブメッセージホストディレクトリへ配置  
  Macの場合例:  
  ```
  ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/
  ```
- `path`を書き換えて、**ご自身の`native_host.py`の場所**を必ず指定

***

## 初期設定

- `manifest.json`のname/description等は用途・対応サービスに合わせて任意に変更してください
- 必要な拡張権限はその都度manifest.jsonの`"permissions"`/`"host_permissions"`に追加

***

## 別環境で実行する場合に**変更が必須な箇所**

1. **native_host.pyのパス（Native Messaging hostマニフェストの`"path"`フィールド）**  
   - 新しいPCや別ユーザー環境ごとに絶対パスを書き換えてください

2. **yt-dlpとffmpegのパス**
   - 標準パス（brewやapt等）以外の場合は、`native_host.py`内の`ytdl_path`・os.environ["PATH"]を自分の環境の実ファイルパスに修正

3. **Chromeが使用するNative Messaging hostマニフェストの設置フォルダ**
   - OSごと（Mac/Linux/Windows）で異なるため自分の環境に合わせてインストール

4. **新たな対応サイトを追加したい場合**
   - `manifest.json`の `"host_permissions"`と `"permissions"` に適切なドメインを追加

***

## 注意・Tips

- **yt-dlp警告の「Deprecated Feature: Passing cookies as a header...」は現状無視できます**  
  未来の仕様変更時はcookie.txt運用等に切り替えてください
- 正常に動かない場合は*debug.log*でnative_host.py/pythonの入出力値を確認してください
- macOS以外をご利用の場合はshebangやpython/yt-dlp/ffmpegパスを適宜修正します

***

## 推奨バージョン

- **yt-dlp 2024-03 以降**
- **ffmpeg 4.x 以降**
- **Chrome 100 以降**