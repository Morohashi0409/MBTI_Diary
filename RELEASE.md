# MBTI Diary リリース手順書

本ドキュメントは、MBTI Diaryアプリケーションのバックエンドとフロントエンドのリリース手順をまとめたものです。

## 前提条件

- Google Cloud SDK がインストールされていること
- gcloud コマンドラインツールが設定済みであること
- Firebase 認証情報が適切に設定されていること
- Node.js とnpm がインストールされていること
- Python 3.12 以上がインストールされていること

## 1. バックエンドのリリース手順

バックエンドは Cloud Run にデプロイします。

### 1.1 ソースコードの準備

```bash
cd /Users/moroha/MBTI_Diary/backend
```

### 1.2 Cloud Run へのデプロイ

以下のコマンドでバックエンドを Cloud Run にデプロイします：

```bash
gcloud run deploy mbti-diary-backend --source . --region asia-northeast1 --platform managed --allow-unauthenticated
```

このコマンドでは以下のことが実行されます：
- ソースコードからコンテナイメージをビルド
- Google Container Registry にイメージをプッシュ
- Cloud Run にサービスをデプロイ
- 認証なしのアクセスを許可

### 1.3 デプロイの確認

デプロイが完了すると、以下のようなURLが表示されます：
```
Service URL: https://mbti-diary-backend-1028553810221.asia-northeast1.run.app
```

このURLを使用して、バックエンドAPIにアクセスできます。エンドポイントは `/api/v1` から始まります。

### 1.4 環境変数の設定（必要な場合）

環境変数を設定する必要がある場合は、以下のコマンドを使用します：

```bash
gcloud run services update mbti-diary-backend --set-env-vars="KEY=VALUE,ANOTHER_KEY=ANOTHER_VALUE"
```

## 2. フロントエンドのリリース手順

フロントエンドは Google App Engine にデプロイします。

### 2.1 ソースコードの準備

```bash
cd /Users/moroha/MBTI_Diary
```

### 2.2 アプリケーションのビルド

以下のコマンドでExpoアプリケーションをWebプラットフォーム向けにビルドします：

```bash
npm run build:web
```

このコマンドは `dist` ディレクトリにビルド結果を出力します。

### 2.3 APIクライアントの設定確認

`services/apiClient.ts` ファイルで、本番環境用のAPIエンドポイントが正しく設定されていることを確認します：

```typescript
// 本番環境用
this.baseUrl = 'https://mbti-diary-backend-1028553810221.asia-northeast1.run.app/api/v1';
```

### 2.4 Google App Engine へのデプロイ

以下のコマンドでフロントエンドを Google App Engine にデプロイします：

```bash
gcloud app deploy
```

このコマンドでは、`app.yaml` ファイルの設定に基づいてアプリケーションがデプロイされます。

### 2.5 デプロイの確認

デプロイが完了すると、以下のようなURLが表示されます：
```
Deployed service [default] to [https://mbti-diary-458111.an.r.appspot.com]
```

このURLを使用して、フロントエンドアプリケーションにアクセスできます。

### 2.6 ログの確認

アプリケーションのログを確認するには、以下のコマンドを実行します：

```bash
gcloud app logs tail -s default
```

## 3. 更新手順

### 3.1 バックエンドの更新

バックエンドのコードを変更した場合は、以下の手順でアップデートします：

1. コードの変更を行う
2. 「1.2 Cloud Run へのデプロイ」の手順を再度実行

### 3.2 フロントエンドの更新

フロントエンドのコードを変更した場合は、以下の手順でアップデートします：

1. コードの変更を行う
2. 「2.2 アプリケーションのビルド」の手順を実行
3. 「2.4 Google App Engine へのデプロイ」の手順を実行

## 4. トラブルシューティング

### 4.1 バックエンドのデプロイが失敗する場合

- Cloud Build のログを確認する
- Dockerfileに問題がないか確認する
- 必要なサービスアカウント権限が付与されているか確認する

### 4.2 フロントエンドのデプロイが失敗する場合

- ビルドエラーがないか確認する
- `app.yaml` の設定が正しいか確認する
- App Engine のログを確認する

### 4.3 APIが接続できない場合

- CORS設定が正しいか確認する
- APIエンドポイントが正しく設定されているか確認する
- Cloud Run のサービスが稼働しているか確認する

## 5. 注意事項

- Node.js 18は2025年4月30日にサポートが終了するため、将来的に新しいバージョンへのアップグレードが必要
- App Engine のインスタンス数の上限を設定するには `app.yaml` に `automatic_scaling.max_instances` を設定する
- 本番環境に変更をデプロイする前に、テスト環境でテストすることを推奨

## 6. クイックコマンドリスト（簡易版）

以下のコマンドリストは、意味や説明を省略し、実行するコマンドのみを簡潔にまとめたものです。
順番に実行することで、スムーズにリリース作業を進めることができます。

### バックエンドリリース（Cloud Run）

```bash
# バックエンドのデプロイ
cd /Users/moroha/MBTI_Diary/backend
gcloud run deploy mbti-diary-backend --source . --region asia-northeast1 --platform managed --allow-unauthenticated
```

### フロントエンドリリース（App Engine）

```bash
# フロントエンドのビルドとデプロイ
cd /Users/moroha/MBTI_Diary
npm run build:web
gcloud app deploy
```

### 更新とモニタリング

```bash
# バックエンドの更新
cd /Users/moroha/MBTI_Diary/backend
gcloud run deploy mbti-diary-backend --source . --region asia-northeast1 --platform managed --allow-unauthenticated

# フロントエンドの更新
cd /Users/moroha/MBTI_Diary
npm run build:web
gcloud app deploy

# フロントエンドログの確認
gcloud app logs tail -s default

# バックエンドログの確認
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=mbti-diary-backend"
```

これらのコマンドを順次実行することで、迅速にデプロイを完了することができます。