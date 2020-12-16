import {getAllS3Files, getS3File, uploadImageToS3} from './s3Service';
import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { useState } from 'react'
import {
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { ImagePickerResponse } from 'react-native-image-picker'
import { Colors, Header } from 'react-native/Libraries/NewAppScreen'

var ImagePicker = require('react-native-image-picker');

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
  imagePane: {
    display: 'flex',
    backgroundColor: 'red',
    height: 100,
    width: '100%',
  },
  image: {
    flex: 1,
  },
});

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
          console.log('User cancelled the image picker');
        } else {
          uploadImageToS3(response);
        }
      },
    );
  };

  const storeData = async (itemKey: string, value: Object) => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(itemKey, jsonValue);
    } catch (e) {
      throw new Error(`Could not store data ${itemKey} with value ${value}`);
    }
  };

  const getData = async (itemKey: string) => {
    try {
      const jsonValue = await AsyncStorage.getItem(itemKey);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      throw new Error(`Could not get data from key ${itemKey}`);
    }
  };

  const [fetchedFilenames, setFetchedFilenames] = useState([]);

  const listObjects = () => {
    getAllS3Files().then(async (res) => {
      const promises = res?.map((s3Object) => {
        return getS3File(s3Object.Key as string).then(async (res) => {
          const filename = s3Object.Key as string;
          await storeData(filename, res);
          console.log('stored data');
          if ((await getData('filenames')) === null) {
            await storeData('filenames', JSON.stringify([filename]));
          } else {
            const storedFilenames: string[] = JSON.parse(
              await getData('filenames'),
            );
            storedFilenames.push(filename);
            await storeData('filenames', JSON.stringify(storedFilenames));
          }
        });
      });
      console.log('::before');
      await Promise.all(promises);
      console.log('::after');

      const filenames = JSON.parse(await getData('filenames'));
      console.log('fetchedAll', filenames);
      setFetchedFilenames(filenames);
    });
  };

  console.log('render');

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
          <View style={styles.imagePane}>
            {fetchedFilenames.length === 0
              ? null
              : fetchedFilenames.map(async (filename) => {
                  const file = await getData(filename);
                  console.log(filename, file);
                  return <Image source={file} style={styles.image} />;
                })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default App;
