import {CognitoIdentityClient} from '@aws-sdk/client-cognito-identity';
import {
  S3Client,
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {fromCognitoIdentityPool} from '@aws-sdk/credential-provider-cognito-identity';
import {ImagePickerResponse} from 'react-native-image-picker';
import {
  ACCESS_KEY_ID,
  BUCKET_NAME,
  REGION,
  IDENTITYPOOLID,
  SECRET_ACCESS_KEY,
} from './secrets';

var fs = require('react-native-fs');

const client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  // credentials: fromCognitoIdentityPool({
  //   client: new CognitoIdentityClient({region: REGION}),
  //   // Replace IDENTITY_POOL_ID with an appropriate Amazon Cognito Identity Pool ID for, such as 'us-east-1:xxxxxx-xxx-4103-9936-b52exxxxfd6'.
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

export const getAllS3Files = () => {
  return client
    .send(
      new ListObjectsCommand({
        Bucket: BUCKET_NAME,
      }),
    )
    .then((res) => res.Contents?.map((file) => file))
    .catch((err) => console.error(err));
};

export const getS3File = (filename: string) => {
  return client
    .send(new GetObjectCommand({Bucket: BUCKET_NAME, Key: filename}))
    .then((res) => res)
    .catch((err) => console.error(err));
};
