/*app.ts*/
import express, { Express } from 'express';
import { logger } from './logger';
import { CustomMetrics } from './customMetrics';
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

const PORT: number = parseInt(process.env.PORT || '8080');
const app: Express = express();
const customMetrics = new CustomMetrics();
const s3Client = new S3Client({ region: "ap-northeast-1" });

// dice
function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}
app.get('/rolldice', (req, res) => {
  const result = getRandomNumber(1, 6);
  logger.info(`Dice rolled: ${result}`);
  customMetrics.updateMetrics(1); // 単純なアクセス数としてカウント
  res.send(result.toString());
});

// S3バケットリストを取得するエンドポイントを追加
app.get('/s3buckets', async (req, res) => {
  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    const bucketList = response.Buckets?.map(bucket => bucket.Name) || [];
    logger.info(`S3 buckets listed: ${bucketList.length} buckets found`);
    
    res.json(bucketList);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list S3 buckets' });
  }
});

// ヘルスチェックのためのエンドポイント
app.get('/healthcheck', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening for requests on http://localhost:${PORT}`);
});