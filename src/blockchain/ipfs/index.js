import { create } from 'ipfs-http-client'
import CryptoJS from 'crypto-js'
// import { concat as uint8ArrayConcat } from 'uint8arrays/concat'
import toBuffer from 'it-to-buffer'
import {IPFSAPI} from "../../env";

const ENCRYPTEDFIELDS = ['achievement']

function decrypt(jsonData, key) {
    ENCRYPTEDFIELDS.forEach(fieldE => {
        const ciphertext = jsonData[fieldE]
        const bytes = CryptoJS.AES.decrypt(ciphertext, key)
        const originalText = bytes.toString(CryptoJS.enc.Utf8)
        jsonData[fieldE] = JSON.parse(originalText)
    })
    return jsonData
}

async function getFile(CID) {
    const ipfsClient = create(IPFSAPI)
    const decoder = new TextDecoder()
    const data = await toBuffer(ipfsClient.cat(CID))
    return decoder.decode(data)
}

function encryptString(data, key) {
    if (typeof data !== 'string') {
        data = JSON.stringify(data)
    }
    const ciphertext = CryptoJS.AES.encrypt(data, key).toString()
    return ciphertext
}

function encrypt(jsonCerts, key) {
    jsonCerts.forEach(jsonE => {
        ENCRYPTEDFIELDS.forEach(fieldE => {
            jsonE[fieldE] = encryptString(jsonE[fieldE], key)
        })
    })
    return jsonCerts
}

async function pushToIPFS(jsonCerts, key) {
    jsonCerts = encrypt(jsonCerts, key)
    const ipfsClient = create(IPFSAPI) //TODO: need to specify in env to deploy to cloud
    let promises = []
    jsonCerts.forEach(jsonE => {
        promises.push(
            new Promise(resolve => {
                resolve(ipfsClient.add(JSON.stringify(jsonE)))
            })
            .then(({ path }) => {
                return {
                    ...jsonE,
                    CID: path
                }
            })
        )
    })
    return Promise.all(promises)
}

export {
    pushToIPFS,
    getFile,
    decrypt
}
