import Blockcert from './abi/Blockcert.json'
import ERC20 from './abi/ERC20.json'
import Web3 from 'web3'
import BN from "bn.js"
import {readFile} from "../util"
import {AES192KEY} from "../../env";
import { pushToIPFS} from '../ipfs'
const {createHash} = require('crypto')

const WEB3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545/')

async function initContract(nftAddress) {
  const nftContract = new WEB3.eth.Contract(Blockcert, nftAddress)
  const feeAddress = await queryFeeToken(nftContract)
  const feeContract = new WEB3.eth.Contract(ERC20, feeAddress)
  return {
    nftContract,
    feeContract
  }
}

async function approveIssueFee(issuer, nftAddress, certLen) {
  const { nftContract, feeContract } = await initContract(nftAddress)
  const batchMintFee = await queryPlatformFee(nftContract).catch(err => errNoti(err, "Get fee failed"))
  const batchSize = await queryBatchSize(nftContract).catch(err => errNoti(err, "Get batchsize failed"))
  if (batchSize <= 0) {
    throw new Error("Batchsize not greater than 0")
  }
  const totalFee = (Math.floor((certLen - 1)/batchSize) + 1) * batchMintFee
  await approve(feeContract, issuer, nftContract._address, new BN(totalFee)).catch(err => errNoti(err, "approve to sp failed"))
  return true
}

async function issueCerts(issuer, nftAddress, certFiles) {
  const { nftContract } = await initContract(nftAddress)
  const certsStringContent = await readFile(certFiles).catch(err => errNoti(err, "Readfile failed"))
  let jsonCerts = certsStringContent.map(strContent => JSON.parse(strContent))
  //TODO: query "AES192KEY" from server (server make tx from SP-address
  jsonCerts = await pushToIPFS(jsonCerts, AES192KEY) // added CID field
  jsonCerts = addCertHash(jsonCerts)
  const certsData = filterBlockchainData(jsonCerts)
  console.log(certsData[0])
  const certBatch = await divideToBatch(nftContract, certsData)
  const txsHash = await batchMint(issuer, nftContract, certBatch).catch(err => errNoti(err, "batchmint failed"))
  return txsHash
}

async function revokeCert(issuer, nftAddress, nftIDs, reason) {
  const { nftContract } = await initContract(nftAddress)
  const tx = await revoke(nftContract, issuer, nftIDs, reason)
  return tx
}

// -----------------------

async function approve(erc20Contract, owner, spender, amount) {
  const data = erc20Contract.methods.approve(spender, amount).encodeABI()
  const rawTx = await initTx(owner, erc20Contract._address, 0, data).catch(err => errNoti(err, "init tx failed"))
  return sendTxMetamask(rawTx)
}

// -------- query -----/
function queryFeeToken(nftContract) {
  return nftContract.methods.feeToken().call()
}

function queryPlatformFee(nftContract) {
  return nftContract.methods.platformFee().call()
}

function queryBatchSize(nftContract) {
  return nftContract.methods.batchSize().call()
}

async function queryCertData(nftAddress, nftID) {
  const { nftContract } = await initContract(nftAddress)
  const data = await nftContract.methods.certData(nftID).call()
  return {
    issuer: data[0],
    recipient: data[1],
    certHash: data[2],
    CID: data[3],
    issuanceTimestamp: data[4]
  }
}

async function queryRevokedStatus(nftAddress, nftID) {
  const { nftContract } = await initContract(nftAddress)
  const data = await nftContract.methods.revokedStatus(nftID).call()
  return {
      isRevoked: data[0],
      reason: data[1]
    }
}
// function queryServiceProvider(nftContract) {
//   return nftContract.methods.serviceProvider().call()
// }
// ---------util ------/
function errNoti(err, msg) {
  console.log(err)
  throw new Error(msg)
}

async function divideToBatch(nftContract, certsData) {
  const batchSize = await queryBatchSize(nftContract)
  let certBatch = []
  certsData.forEach((cert, index) => {
    if (index % batchSize === 0) {
      certBatch.push([])
    }
    const batchID = Math.floor(index / batchSize)
    certBatch[batchID].push(cert)
  })
  return certBatch
}

function filterBlockchainData(jsonCerts) {
  return jsonCerts.reduce((ret, jsonE) => {
    ret.push({
      issuer: jsonE.issuer.publickey,
      recipient: jsonE.recipient.publickey,
      certHash: jsonE.certHash,
      CID: jsonE.CID,
      issuanceTimestamp: Date.now()
    })
    return ret
  }, [])
}

function sha256Hash(data) {
  const hash = createHash('sha256')
  return '0x' + hash.update(data).digest('hex')
}

function addCertHash(jsonCerts) {
  jsonCerts.forEach(jsonE => {
    jsonE.certHash = sha256Hash(JSON.stringify(jsonE))
  })
  return jsonCerts
}

async function mintBatch(issuer, nftContract, certBatch, batchID) {
  if (batchID === certBatch.length) {
    return []
  }
  let txs = []

  const mint = async () => {
    const data = nftContract.methods.batchMint(certBatch[batchID]).encodeABI()
    const rawTx = await initTx(issuer, nftContract._address, 0, data)
    return sendTxMetamask(rawTx)
  }

  const txHash = await mint()
  let status = null
  while (status === null) {
    await sleep(3000)
    const receipt = await WEB3.eth.getTransactionReceipt(txHash)
    if (receipt !== null) {
      status = receipt.status
    }
  }
  if (status === false) {
    await mintBatch(issuer, nftContract, certBatch, batchID)
  } else {
    txs.push(txHash)
    const nxtTx = await mintBatch(issuer, nftContract, certBatch, batchID + 1)
    txs.push(...nxtTx)
  }
  return txs
}

function batchMint(issuer, nftContract, certBatch) {
  return mintBatch(issuer, nftContract, certBatch, 0)
}

async function revoke(nftContract, issuer, nftIDs, reason) {
  const data = nftContract.methods.revokeCertificate(nftIDs, reason).encodeABI()
  const rawTx = await initTx(issuer, nftContract._address, 0, data)
  return sendTxMetamask(rawTx)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function initTx(from, to, value, data) {
  const txConfig = {
    from,
    to,
    value,
    data
  }
  // console.log(txConfig)
  const gasLimit = await WEB3.eth.estimateGas(txConfig).catch(err => errNoti(err, "get gasLimit failed"))
  let nonce = await WEB3.eth.getTransactionCount(from).catch(err => errNoti(err, "get nonce failed"))
  return {
    ...txConfig,
    nonce: nonce.toString(),
    gas: gasLimit.toString()
  }
}

function sendTxMetamask(rawTx) {
  const { ethereum } = window
  return ethereum.request({
    method: 'eth_sendTransaction',
    params: [rawTx],
  })
}

export {
  approveIssueFee,
  issueCerts,
  queryCertData,
  revokeCert,
  queryRevokedStatus
}
