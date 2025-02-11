# ComfyUI Mobile Client

A mobile-friendly web client extension for ComfyUI that allows you to:
- View generated images in a responsive gallery
- Monitor queue status in real-time
- Edit and regenerate prompts
- Upload workflow JSON files
- Customize various settings for prompt generation

## Installation

### Method 1: Using ComfyUI-Manager

You can install directly from ComfyUI-Manager:

![Install from ComfyUI-Manager](https://i.imgur.com/8MRw7GW.png)

### Method 2: Manual Installation

1. Clone this repository into your ComfyUI's `custom_nodes` directory:

```
cd custom_nodes
git clone https://github.com/vkff5833/ComfyUI-MobileClient
```

2. Restart ComfyUI
3. Access the client at: `http://SERVER/extensions/ComfyUI-MobileClient/index.html`

**Note: The "index.html" part of the URL cannot be omitted. Make sure to include it in the URL.**

## Features

### Gallery View
- Responsive image gallery with modal view
- Navigate between images using arrow keys
- View queue ID and regenerate previous prompts

### Queue Monitoring
- Real-time queue status display
- Configurable monitoring interval
- Visual indicators for running and pending tasks

### Prompt Editing
- Edit text prompts, parameters, and seed values
- Automatic seed randomization (optional)
- Customizable field patterns for different input types

### Settings
- Server connection configuration
- Customizable key patterns for form fields
- Adjustable queue monitoring interval
- Settings persistence in local storage

## Usage

1. Configure server settings (click menu icon in top-left)
2. Upload workflow JSON or view generated images
3. Edit prompts using the edit modal
4. Monitor queue status in real-time
5. Navigate gallery using arrow keys:
   - Left/Right: Previous/Next image
   - Up/Down: Previous/Next queue item

---

# ComfyUI モバイルクライアント

ComfyUI用のモバイルフレンドリーなWebクライアント拡張機能です。以下の機能を提供します：
- レスポンシブなギャラリーでの生成画像の表示
- リアルタイムのキュー状態監視
- プロンプトの編集と再生成
- ワークフローJSONファイルのアップロード
- プロンプト生成のための各種設定のカスタマイズ

## インストール方法

### 方法1: ComfyUI-Managerを使用

ComfyUI-Managerから直接インストールできます:

![ComfyUI-Managerでのインストール](https://i.imgur.com/8MRw7GW.png)

### 方法2: 手動インストール

1. ComfyUIの`custom_nodes`ディレクトリにこのリポジトリをクローンします：

```
cd custom_nodes
git clone https://github.com/vkff5833/ComfyUI-MobileClient
```

2. ComfyUIを再起動します
3. 以下のURLでアクセスします：`http://SERVER/extensions/ComfyUI-MobileClient/index.html`

**注意：URLの末尾の "index.html" は省略できません。必ずURLに含めてください。**

## 機能

### ギャラリービュー
- モーダルビュー付きのレスポンシブな画像ギャラリー
- 矢印キーによる画像間のナビゲーション
- キューIDの表示と過去のプロンプトの再生成

### キュー監視
- リアルタイムのキュー状態表示
- 監視間隔の設定
- 実行中・待機中タスクの視覚的表示

### プロンプト編集
- テキストプロンプト、パラメータ、シード値の編集
- 自動シードランダム化（オプション）
- 入力タイプごとのカスタマイズ可能なフィールドパターン

### 設定
- サーバー接続設定
- フォームフィールドのカスタマイズ可能なキーパターン
- キュー監視間隔の調整
- ローカルストレージでの設定保存

## 使用方法

1. サーバー設定を構成（左上のメニューアイコンをクリック）
2. ワークフローJSONをアップロードするか生成済み画像を表示
3. 編集モーダルでプロンプトを編集
4. リアルタイムでキュー状態を監視
5. 矢印キーでギャラリーをナビゲート：
   - 左/右：前/次の画像
   - 上/下：前/次のキューアイテム
