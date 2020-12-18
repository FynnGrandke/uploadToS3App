import {
  Bucket,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  _Object,
} from '@aws-sdk/client-s3';
import {ImagePickerResponse} from 'react-native-image-picker';
import {ACCESS_KEY_ID, BUCKET_NAME, REGION, SECRET_ACCESS_KEY} from './secrets';

var fs = require('react-native-fs');

const client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  // credentials: fromCognitoIdentityPool({
  //   client: new CognitoIdentityClient({region: REGION}),
  //   identityPoolId: IDENTITYPOOLID,
  // }),
});

export const uploadImageToS3 = async (file: ImagePickerResponse) => {
  const contentType = file.type as string;
  const contentDeposition = 'inline;filename="' + file.fileName + '"';
  const base64URI = await fs.readFile(file.uri, 'base64');
  const fileKey = new Date().toISOString() + file.fileName;
  const s3Params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentEncoding: 'buffer',
    ContentType: contentType,
    ContentDisposition: contentDeposition,
    ACL: 'public-read',
  };

  fetch(`data:${contentType};base64,` + base64URI, {
    headers: {
      'Content-Type': contentType + ';base64',
    },
  })
    .then((res) => {
      res.blob().then(async (res) => {
        await client
          .send(
            new PutObjectCommand({
              ...s3Params,
              Body: res,
              Metadata: {'upload-date': new Date().toISOString()},
            }),
          )
          .catch((err) => {
            console.error('Uploading file failed:', err);
          });
      });
    })
    .catch((err) => console.error('Cannot get blob from file:', err));
};

export const getAllS3Files: () => Promise<_Object[]> = async () => {
  return client
    .send(new ListObjectsV2Command({Bucket: BUCKET_NAME}))
    .then((res) => {
      return res.Contents?.map((file) => file) || [];
    })
    .catch((err) => {
      throw new Error(`Error in getAllS3Files: ${err}`);
    });
};

export const getS3File = (filename: string) => {
  return client
    .send(new GetObjectCommand({Bucket: BUCKET_NAME, Key: filename}))
    .then((res) => res)
    .catch((err) => {
      throw new Error(`Error in getS3File: ${err}`);
    });
};
