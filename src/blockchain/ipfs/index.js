import {certData} from "../../data";
import { create } from 'ipfs-http-client'
import CryptoJS from 'crypto-js'
// import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import toBuffer from 'it-to-buffer'

function encrypted(jsonData, key) {
    const toString = JSON.stringify(jsonData)
    // console.log(toString)
    // console.log(key)
    const ciphertext = CryptoJS.AES.encrypt(toString, key).toString() //Buffer.from(key, 'hex')
    return ciphertext
}

function decrypted(jsonData, key) {
    const ciphertext = jsonData.achievement
    let bytes = CryptoJS.AES.decrypt(ciphertext, key)
    var originalText = bytes.toString(CryptoJS.enc.Utf8)
    const ret = {
        ...jsonData,
        achievement: JSON.parse(originalText)
    }
    console.log(ret)
    return ret
}

async function pushEncryptedCert(certName, key) {
    const ipfsClient = create('http://localhost:5001')
    // console.log(key)
    let promises = []
    certName.forEach(fileName => {
        const data = { ...certData[fileName] }
        const enAchievement = encrypted(data['achievement'], key)
        data["achievement"] = enAchievement
        // console.log(data)
        const strData = JSON.stringify(data)
        // console.log(strData)
        promises.push(
            new Promise(resolve => {
                resolve(ipfsClient.add(strData))
            })
            .then(({ path }) => {
                return {
                    fileName,
                    CID: path
                }
            })
        )
    })

    return Promise.all(promises)
}

async function getFile(CID) {
    const ipfsClient = create('http://localhost:5001')
    const decoder = new TextDecoder()
    const data = await toBuffer(ipfsClient.cat(CID))
    return decoder.decode(data)
}

export {
    pushEncryptedCert,
    getFile,
    decrypted
}
