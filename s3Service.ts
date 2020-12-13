import S3 from 'aws-sdk/clients/s3';
import {ImagePickerResponse} from 'react-native-image-picker';
import {ACCESS_KEY_ID, BUCKET_NAME, REGION, SECRET_ACCESS_KEY} from './secrets';

var fs = require('react-native-fs');

const s3 = new S3({
  accessKeyId: ACCESS_KEY_ID,
  secretAccessKey: SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: REGION,
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
      res.blob().then((res) => {
        s3.putObject({
          ...s3Params,
          Body: res,
          Metadata: {'upload-date': new Date().toISOString()},
        })
          .promise()
          .catch((err) => {
            console.error('Uploading file failed:', err);
          });
      });
    })
    .catch((err) => console.error('Cannot get blob from file:', err));
};

export const getAllS3Files = () => {
  return s3
    .listObjectsV2({Bucket: BUCKET_NAME})
    .promise()
    .then((res) => res.Contents?.map((file) => file));
};

export const getS3File = (filename: string) => {
  return s3.getObject({Bucket: BUCKET_NAME, Key: filename})
    .promise()
    .then((res) => res);
};
