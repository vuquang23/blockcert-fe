import Blockcert from './abi/Blockcert.json'
import ERC20 from './abi/ERC20.json'
import Web3 from 'web3'
import {CONTRACTADDR, FEEADDR, AES192KEY, SPADDR} from '../../env'
import BN from "bn.js";
import { pushEncryptedCert, decrypted } from '../ipfs'
import {certData} from "../../data";
const {createHash} = require('crypto')

class Web3Service {
  constructor() {
    this.web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545/')
    this.contract = new this.web3.eth.Contract(Blockcert, CONTRACTADDR)
    this.feeToken = new this.web3.eth.Contract(ERC20, FEEADDR)
    this.privateKey = null
  }

  async approve(issuer, certLen) {
    const batchMintFee = await getFee(this.contract).catch(() => console.log("get fee failed"))
    const batchSize = await getBatchSize(this.contract).catch(() => console.log("get batchSize failed"))
    if (batchSize <= 0) {
      throw new Error('batchSize <= 0')
    }

    const totalFee = (Math.floor((batchSize - 1)/certLen) + 1) * batchMintFee
    console.log(totalFee)

    await approveFee(this.web3, this.feeToken, issuer, CONTRACTADDR, new BN(totalFee), this.privateKey)
      .catch(err => {
        console.log(err)
        throw new Error('approve failed')
      })

    return true
  }

  importPrivateKey(privateKey) {
    this.privateKey = privateKey
    const data = privateKeyToAccount(this.web3, `0x${privateKey}`)
    return data
  }

  async signCerts(issuer, jsonCerts) {
    const fileName = filterName(jsonCerts)

    const cidData = await pushEncryptedCert(fileName, AES192KEY) // [{filename: , cid: }, {}]
    // console.log(cidData)
    let data = extract(fileName) //[ {filename: , ...}, ... ]
    // console.log(data)
    const mergedData = merge(data, cidData) // [{ issuer: ...}, ...]
    // console.log(mergedData)
    const receipt = await pushCert(this.contract, this.web3, issuer, mergedData, this.privateKey)
    .catch(err => {
      console.log(err)
      throw new Error("something wrong. cert_hash maybe existed")
    })
    
    return receipt.reduce((ret, data) => {
      console.log(data, data.transactionHash)
      ret.push(data.transactionHash)
      return ret
    }, [])
  }

  async queryNFT(nftID) {
    const arrayData = await getNFTData(this.contract, nftID)
    return {
      issuer: arrayData[0],
      recipient: arrayData[1],
      certHash: arrayData[2],
      CID: arrayData[3],
      issuanceTimestamp: arrayData[4]
    }
  }

  // viewer pay
  async approveThroughMetamask(viewer) {
    const amount = await getFee(this.contract)
    const data = this.feeToken.methods.approve(SPADDR, amount).encodeABI()
    const txConfig = {
      from: viewer,
      to: FEEADDR,
      value: 0,
      data
    }
    const gasLimit = await this.web3.eth.estimateGas(txConfig).catch(err => console.log(err))
    let nonce = await this.web3.eth.getTransactionCount(viewer).catch(err => console.log(err))
    const tx = {
      ...txConfig,
      nonce: nonce.toString(),
      gas: gasLimit.toString()
    }
    console.log(tx)
    const { ethereum } = window
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx],
    })
    return txHash
  }

  async revokeCertThroughMetamask(issuer, nftID, reason) {
    console.log(issuer, nftID, reason)
    // console.log(nftID)
    // console.log([...nftID])
    const data = this.contract.methods.revokeCertificate([nftID], reason).encodeABI()
    const txConfig = {
      from: issuer,
      to: CONTRACTADDR,
      value: 0,
      data
    }
    const gasLimit = await this.web3.eth.estimateGas(txConfig).catch(err => console.log(err))
    let nonce = await this.web3.eth.getTransactionCount(issuer).catch(err => console.log(err))
    const tx = {
      ...txConfig,
      nonce: nonce.toString(),
      gas: gasLimit.toString()
    }
    console.log(tx)
    const { ethereum } = window
    const txHash = await ethereum.request({
      method: 'eth_sendTransaction',
      params: [tx],
    })
    return txHash
  }

  decrypt(jsonData) {
    return decrypted(jsonData, AES192KEY)
  }

  async queryRevokedStatus(nftID) {
    const status = await queryRevokedStatus(this.contract, nftID)
    console.log(status)
    return {
      isRevoked: status[0],
      reason: status[1]
    }
  }
}

function sha256Hash(cert) {
  const strCert = JSON.stringify(cert)
  const hash = createHash('sha256')
  const jsonHash = hash.update(strCert).digest('hex')
  return '0x' + jsonHash
}

function extract(fileNames) {
  return fileNames.reduce((ret, name) => {
    const cert = certData[name]
    ret.push({
      fileName: name,
      issuer: cert["issuer"]["publickey"],
      recipient: cert["recipient"]["publickey"],
      certHash: sha256Hash(cert),
      issuanceTimestamp: Date.now()
    })
    return ret
  }, [])
}

function merge(currentData, cidData) {
  return currentData.reduce((ret, data) => {
    for (let i = 0; i < cidData.length; i++) {
      if (data.fileName === cidData[i].fileName) {
        let merged = {
          ...data,
          ...cidData[i]
        }
        delete merged.fileName
        ret.push(merged)
        break
      }
    }
    return ret
  }, [])
}

function divideBatch(data, batchSize) {
  let certBatch = []
  data.forEach((cert, index) => {
    if (index % batchSize === 0) {
      certBatch.push([])
    }
    const batchID = Math.floor(index / batchSize)
    certBatch[batchID].push(cert)
  })
  return certBatch
}

async function pushCert(contract, web3, issuer, data, privateKey) {
  const batchSize = await contract.methods.batchSize().call()
  const certBatch = divideBatch(data, batchSize)

  let txs = []
  let nonce = await web3.eth.getTransactionCount(issuer) - 1
  for (const batchID in certBatch) {
    console.log(`sign batchID: ${batchID}`)
    const data = contract.methods.batchMint(certBatch[batchID]).encodeABI()
    const txConfig = {
      from: issuer,
      to: CONTRACTADDR,
      value: 0,
      data
    }
    const gasLimit = await web3.eth.estimateGas(txConfig).catch(err => console.log(err))
    nonce ++
    const tx = {
      ...txConfig,
      nonce,
      gas: gasLimit
    }
    // console.log(privateKey)
    const signed = await web3.eth.accounts.signTransaction(tx, privateKey).catch(err => console.log(err))
    txs.push(web3.eth.sendSignedTransaction(signed.rawTransaction))
  }

  return Promise.all(txs)
}

function filterName(jsonCerts) {
  return jsonCerts.reduce((ret, data) => {
    const fileName = data.name
    ret.push(fileName.split(".")[0])
    return ret
  }, [])
}

function queryRevokedStatus(contract, nftID) {
  return contract.methods.revokedStatus(nftID).call()
}

function getNFTData(contract, nftID) {
  return contract.methods.certData(nftID).call()
}

function getFee(contract) {
  return contract.methods.platformFee().call()
}

function getBatchSize(contract) {
  return contract.methods.batchSize().call()
}

function privateKeyToAccount(web3, privateKey) {
  return web3.eth.accounts.privateKeyToAccount(privateKey).address
}

async function approveFee(web3, feeToken, owner, spender, amount, privateKey) {
  const data = feeToken.methods.approve(spender, amount).encodeABI()
  const txConfig = {
    from: owner,
    to: FEEADDR,
    value: 0,
    data
  }
  const gasLimit = await web3.eth.estimateGas(txConfig).catch(err => console.log(err))
  let nonce = await web3.eth.getTransactionCount(owner).catch(err => console.log(err))
  const tx = {
    ...txConfig,
    nonce,
    gas: gasLimit
  }
  const signed = await web3.eth.accounts.signTransaction(tx, privateKey).catch(err => console.log(err))
  return web3.eth.sendSignedTransaction(signed.rawTransaction)
}


export const web3Service = new Web3Service()
