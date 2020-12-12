import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button,
  Image,
} from 'react-native';

var ImagePicker = require('react-native-image-picker');

import {
  Header,
  Colors,
} from 'react-native/Libraries/NewAppScreen';

var fs = require('react-native-fs');

import S3 from 'aws-sdk/clients/s3';

import {ImagePickerResponse} from 'react-native-image-picker';
import {ACCESS_KEY_ID, BUCKET_NAME, REGION, SECRET_ACCESS_KEY} from './secrets';

const App = () => {
  const s3 = new S3({
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
    region: REGION,
  });

  const chooseImage = async () => {
    let options = {
      title: 'Upload Prescription',
      takePhotoButtonTitle: 'Take a Photo',
      chooseFromLibraryButtonTitle: 'Select From Gallery',
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
    ImagePicker.launchImageLibrary(
      options,
      async (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else {
          uploadImageOnS3(response);
        }
      },
    );
  };

  const uploadImageOnS3 = async (file: ImagePickerResponse) => {
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

  const listObjects = () => {
    s3.listObjectsV2({Bucket: BUCKET_NAME})
      .promise()
      .then((res) => {
        console.log(res.Contents);
        res.Contents?.forEach((file) =>
          s3
            .getObject({Bucket: BUCKET_NAME, Key: file.Key as string})
            .promise()
            .then((res) => console.log(res)),
        );
      });
  };

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <Header />
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Learn More</Text>
              <Text style={styles.sectionDescription}>
                Tab the button to upload a file
              </Text>
            </View>
            <Button onPress={() => chooseImage()} title="Upload Image" />
            <Button onPress={() => listObjects()} title="List Objects" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
