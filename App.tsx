import {getAllS3Files, getS3File, uploadImageToS3} from './s3Service';
import React, {useEffect, useState} from 'react';
import {
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {ImagePickerResponse} from 'react-native-image-picker';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import { getData, storeData } from './dataStorage'

var ImagePicker = require('react-native-image-picker');

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  body: {
    backgroundColor: Colors.white,
  },
  container: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  title: {
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
  imagePane: {
    display: 'flex',
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

  const [fetchedFilenames, setFetchedFilenames] = useState([]);
  const [images, setImages] = useState<JSX.Element[]>([]);

  const listObjects = () => {
    getAllS3Files().then(async (res) => {
      const promises = res.map((s3Object) => {
        return getS3File(s3Object.Key as string).then(async (res) => {
          if (res == null) return;
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

      await Promise.all(promises);


      const filenames = JSON.parse(await getData('filenames'));

      setFetchedFilenames(filenames);
    });
  };

  useEffect(() => {
    fetchedFilenames.map(async (filename) => {
      const file = await getData(filename);
      const image = <Image source={file} style={styles.image} />;
      console.log(filename, file);
      setImages([...images, image]);
    });
  });


  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <View style={styles.body}>
            <View style={styles.container}>
              <Text style={styles.title}>Upload a File</Text>
              <Text style={styles.sectionDescription}>
                Tab the button to upload a file
              </Text>
              <Button onPress={() => chooseImage()} title="Upload Image" />
            </View>
            <View style={styles.container}>
              <Text style={styles.title}>Show all Uploaded Files</Text>
              <Text style={styles.sectionDescription}>
                Tab the button to list all uploaded files
              </Text>
              <Button onPress={() => listObjects()} title="List Objects" />
            </View>
          </View>
          <View style={styles.imagePane}>
            {fetchedFilenames.length === 0 ? null : images}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default App;
