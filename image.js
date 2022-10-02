import imageToBase64 from 'image-to-base64';

export async function imagetobase64(image){

    const Base64 = await imageToBase64(image);
    console.log('5');
    console.log(Base64)
    return Base64;

}

function base64ToArrayBuffer(base64) {
    var binary_string = global.atob(base64.replace(/^data:image\/(png|jpg);base64,/, ''));
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
}

