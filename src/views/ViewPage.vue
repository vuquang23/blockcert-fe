<template>
  <div class="container vh-100">
    <div class="row justify-content-center vh-100">
      <div class="col-6">
        <h6>View certificates for Organization:<br>
          <a :href="`https://testnet.bscscan.com/address/${contractAddr}`" target="_blank">{{contractAddr}}</a>
        </h6>

        <div class="input-group mb-3">
          <input v-model="nftID" type="text" class="form-control" placeholder="NFT-ID">
        </div>

        <div>
          <button class="btn btn-primary" type="button" @click="queryBlockchain(nftID)">View on blockchain</button>
        </div>

        <div style="margin-top: 1em; margin-bottom: 1em">
          <button class="btn btn-primary" type="button" @click="queryIPFS(nftID)">View on IPFS</button>
        </div>


        <h6>Your current address:<br>
          <a :href="`https://testnet.bscscan.com/address/${currentAddr}`" target="_blank">{{currentAddr}}</a>
        </h6>
        <h6>Approve to pay fee and view decrypted certificate</h6>

        <div>
          <button class="btn btn-primary" type="button" @click="payToView(nftID)">approve and view</button>
        </div>

        <div class="" style="margin-top: 1em; display: block;">
          <VueJsonPretty :data="data" />
        </div>

      </div>
    </div>
  </div>

</template>

<script>

import {CONTRACTADDR} from "../env";
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'
import {web3Service} from "../blockchain/web3"
import {getFile} from "../blockchain/ipfs"

export default {
  name: "ViewPage",
  components: {
    VueJsonPretty
  },
  data() {
    return {
      contractAddr: CONTRACTADDR,
      nftID: null,
      data: ""
    }
  },
  computed: {
    currentAddr() {
      return this.$store.state.currentAddr
    }
  },
  methods: {
    queryBlockchain(nftID) {
      if (nftID === null) {
        return
      }
      web3Service.queryNFT(nftID)
      .then(response => {
        this.$data.data = response
      })
      .catch(err => {
        console.log(err)
        this.$data.data = err.message
      })
    },

    queryIPFS(nftID) {
      if (nftID === null) {
        return
      }
      web3Service.queryNFT(nftID)
      .then(({ CID }) => {
        return getFile(CID)
      })
      .then(response => {
        this.$data.data = JSON.parse(response)
      })
      .catch(err => {
        console.log(err)
        this.$data.data = err.message
      })
    },

    payToView(nftID) {
      if (nftID === null) {
        return
      }
      let promises = []

      let p1 = web3Service.queryNFT(nftID)
      .then(({ CID }) => {
        return getFile(CID)
      })
      .then(response => {
        return JSON.parse(response)
      })
      .catch(err => {
        console.log(err)
        this.$data.data = err.message
      })
      promises.push(p1)

      // fake action
      let p2 = web3Service.approveThroughMetamask(this.$store.state.currentAddr)
      promises.push(p2)

      Promise.all(promises)
      .then(arrayData => {
        const encryptedData = arrayData[0]
        this.$data.data = web3Service.decrypt(encryptedData)
      })
      .catch(err => {
        console.log(err)
        this.$data.data = "query failed"
      })
    }
  }
}
</script>

<style scoped>
div, div > * {
  border: 1px solid black;
}
</style>
