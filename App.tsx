import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button,
} from 'react-native';

var ImagePicker = require('react-native-image-picker');

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

var fs = require('react-native-fs');
var base64 = require('base-64');

import S3, {ManagedUpload} from 'aws-sdk/clients/s3';
// import {decode} from './utils';
import {ImagePickerResponse} from 'react-native-image-picker';
import {ACCESS_KEY_ID, SECRET_ACCESS_KEY} from './secrets';
// import {Credentials} from 'aws-sdk';
// import {v4 as uuid} from 'uuid';

const App = () => {
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
    console.log('::uploadImageOnS3', file);

    const s3bucket = new S3({
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
      signatureVersion: 'v4',
    });

    let contentType = file.type || 'image/jpeg';
    let contentDeposition = 'inline;filename="' + file.fileName + '"';
    const base64URI = await fs.readFile(file.uri, 'base64');
    const arrayBuffer = base64.decode(base64URI);

    const params = {
      Bucket: 'upload-s3-image-test-bucket',
      Key: file.fileName || 'abc',
      Body: arrayBuffer,
      ContentDisposition: contentDeposition,
      ContentType: contentType,
    };
    console.log('::here', s3bucket, params);

    s3bucket.upload(params, (err: Error, data: ManagedUpload.SendData) => {
      if (err) {
        console.log('error in callback', err);
      }
      console.log('success');
      console.log('Response URL : ' + data);
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
          {/* @ts-ignore-next-line */}
          {global.HermesInternal == null ? null : (
            <View style={styles.engine}>
              <Text style={styles.footer}>Engine: Hermes</Text>
            </View>
          )}
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Step One</Text>
              <Text style={styles.sectionDescription}>
                Edit <Text style={styles.highlight}>App.js</Text> to change this
                screen and then come back to see your edits.
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>See Your Changes</Text>
              <Text style={styles.sectionDescription}>
                <ReloadInstructions />
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Debug</Text>
              <Text style={styles.sectionDescription}>
                <DebugInstructions />
              </Text>
            </View>
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Learn More</Text>
              <Text style={styles.sectionDescription}>
                Read the docs to discover what to do next:
              </Text>
            </View>
            <Button onPress={() => chooseImage()} title="Click me" />
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
