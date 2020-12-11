let keyStr =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

export const decode = function (input: string) {
  let output = '';
  let i = 0;

  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  let base64test = /[^A-Za-z0-9\+\/\=]/g;
  if (base64test.exec(input)) {
    throw new Error('Invalid characters in decode function');
  }
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');

  do {
    let enc1 = keyStr.indexOf(input.charAt(i++));
    let enc2 = keyStr.indexOf(input.charAt(i++));
    let enc3 = keyStr.indexOf(input.charAt(i++));
    let enc4 = keyStr.indexOf(input.charAt(i++));

    let chr1 = (enc1 << 2) | (enc2 >> 4);
    let chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    let chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 != 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 != 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);

  return output;
};
