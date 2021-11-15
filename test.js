// function f() {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       reject("fuck you")
//     }, 5000)
//   })
//     .catch(err => {
//       console.log("djt me may")
//       throw new Error(err)
//     })
// }
//
// async function g() {
//   await f()
//     .catch(err => console.log(err))
// }
//
// g()
// const BN = require('bn.js')
// const a = new BN(5)
// console.log(a.toString())



// 'd64eb0dd27dd03f72094ca330eb2a46d2909d9fc08d72f96ea260682a0b8c5a1'
const key = Buffer.from('1c4682bcd4430f2a6d4d84b7654be7d0cca5b6d7421f3c133', 'hex')
// console.log(Buffer.from(x, 'hex'))


const CryptoJS = require('crypto-js')
//
var encrypted = CryptoJS.AES.encrypt("Message", key).toString()
var bytes  = CryptoJS.AES.decrypt(encrypted, key);
var originalText = bytes.toString(CryptoJS.enc.Utf8);
console.log(originalText)
var decrypted = CryptoJS.AES.decrypt(encrypted, key);
console.log(decrypted)
