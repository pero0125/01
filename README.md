# プロジェクト概要

このプロジェクトは、AWS Distro for OpenTelemetry (ADOT) を使用してメトリクスを収集し、AWS CloudWatchに送信するためのインフラをCDKを使用して構築するサンプルです。

## フォルダ構成

以下は各フォルダの説明です。

| フォルダ名 | 説明 |
|------------|------|
| adot       | ADOTの設定ファイルとDockerfileが含まれています。 |
| app2       | アプリケーションのソースコードとDockerfileが含まれています。 |
| cdkL2      | CDKレベル2のスタック定義が含まれています。 |
| cdkL3      | CDKレベル3のスタック定義が含まれています。 |

## 展開手順

### 1. `upload_image.ps1` の説明と実行

`upload_image.ps1` は、DockerイメージをAWS ECRにプッシュするためのスクリプトです。

```powershell
# DockerビルドとECRへのプッシュ
./upload_image.ps1
```

### 2. CDKのデプロイ手順

CDKをデプロイするためには、以下のツールが必要です：

- Node.js
- TypeScript
- AWS CDK

これらがインストールされていない場合、以下のコマンドでインストールしてください：

```sh
# Node.jsのインストール (必要な場合)
https://nodejs.org/ からインストール

# TypeScriptのインストール
npm install -g typescript

# AWS CDKのインストール
npm install -g aws-cdk
```

次に、プロジェクトの依存関係をインストールします：

```sh
# cdkL2の依存関係をインストール
cd cdkL2
npm install

# cdkL3の依存関係をインストール
cd ../cdkL3
npm install
```

### 3. CDKのデプロイ手順

CDKスタックをデプロイするには、以下のコマンドを実行します：

```sh
# デプロイ
cd cdkL2 または cd cdkL3
cdk synth
cdk diff
cdk deploy
```

### 4. CDKで構築されるAWSリソースの図示

以下は、このプロジェクトで構築されるAWSリソースの概略図です：

#### cdkL2構成図
![cdkL2](diagrams/cdkL2.svg)


#### cdkL3構成図
![cdkL3](diagrams/cdkL3.svg)

---