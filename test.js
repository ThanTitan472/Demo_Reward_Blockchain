const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

// Tạo cặp khóa
const keyPair = ec.genKeyPair();

// Lấy khóa công khai dưới dạng chuỗi hex
const publicKey = keyPair.getPublic('hex');

// Lấy khóa riêng tư dưới dạng chuỗi hex
const privateKey = keyPair.getPrivate('hex');
console.log(`Key: ${keyPair}`)
console.log(`Khóa công khai: ${publicKey}`);
console.log(`Khóa riêng tư: ${privateKey}`);
