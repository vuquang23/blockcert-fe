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



// //
// const key = Buffer.from('1c4682bcd4430f2a6d4d84b7654be7d0cca5b6d7421f3c133', 'hex')
// // console.log(Buffer.from(x, 'hex'))
//
//
// const CryptoJS = require('crypto-js')
// //
// var encrypted = CryptoJS.AES.encrypt("Message", key).toString()
// var bytes  = CryptoJS.AES.decrypt(encrypted, key);
// var originalText = bytes.toString(CryptoJS.enc.Utf8);
// console.log(originalText)
// var decrypted = CryptoJS.AES.decrypt(encrypted, key);
// console.log(decrypted)


// KEY: 'd64eb0dd27dd03f72094ca330eb2a46d2909d9fc08d72f96ea260682a0b8c5a1'

// function errHandler(err, msg) {
//     console.log(err)
//     throw new Error(msg)
// }
//
// function f() {
//     return new Promise((resolve, reject) => {
//         reject("hello")
//     }).catch(err => errHandler(err, "Fail"))
// }
//
// function g() {
//     f()
//         .catch(err => console.log(err))
// }
//
// g()
//
// const Web3 = require('web3')
// const ERC20 = require("./src/blockchain/web3/abi/ERC20.json");
// const WEB3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545/')
// const feeContract = new WEB3.eth.Contract(ERC20, '0xa9747F59a3403a48491B598b50FBcEA22Aa46c17')
// console.log(feeContract._address)

const a = {
    b: 1
}

function f(a) {
    a.c = 2
}

// const array = [{}, {}, {}]

// a.c = 2
// f(a)
// console.log(a)


// array.map(f)
// console.log(array)

