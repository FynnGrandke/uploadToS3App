import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (itemKey: string, value: Object) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(itemKey, jsonValue);
  } catch (e) {
    throw new Error(`Could not store data ${itemKey} with value ${value}`);
  }
};

export const getData = async (itemKey: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(itemKey);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    throw new Error(`Could not get data from key ${itemKey}`);
  }
};
