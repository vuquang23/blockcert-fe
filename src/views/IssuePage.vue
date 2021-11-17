<template>
<div class="container vh-100">
  <div class="row justify-content-center vh-100">
    <div class="col-6">
      <h6>(please use <span class="fw-bold">{{issuerAddr}}</span> for testing)</h6>
      <h6>Your current address:<br>
        <a :href="`https://testnet.bscscan.com/address/${currentAddr}`" target="_blank">{{currentAddr}}</a>
      </h6>
      <h6>Your organization address:<br>
        <a :href="`https://testnet.bscscan.com/address/${contractAddr}`" target="_blank">{{contractAddr}}</a>
      </h6>
      <h6>Service Provider address:<br>
        <a :href="`https://testnet.bscscan.com/address/${spAddr}`" target="_blank">{{spAddr}}</a>
      </h6>

      <div>
        <div class="mb-3" style="margin-top: 3em">
          <label for="formFileMultiple" class="form-label">Upload json certificates to sign!</label>
          <input class="form-control" type="file" id="formFileMultiple" multiple @change="handleFileUpload($event)">
        </div>

        <h6 class="fw-bold alert-warning" style="margin-top: 3em">Please approve to pay fee before signing</h6>
        <button class="btn btn-sm btn-primary" @click="makeApprove()">Approve</button>
        <h6 class="fw-bold" style="margin-top: 0.5em">{{approveStatus}}</h6>

        <h6 class="fw-bold" style="margin-top: 3em">Sign certs</h6>
        <button type="submit" class="btn btn-sm btn-primary" @click="signCerts()" :disabled="!isApproved">Sign</button>

        <h6 class="fw-bold" style="margin-top: 0.5em">{{signStatus}}</h6>

        <h6 v-show="typeof txsHash === 'object' ? (txsHash.length > 0) : false">Tx Hash:</h6>
       
        <h6 v-for="(item, index) in txsHash" :key="index">
           <a :href="`https://testnet.bscscan.com/tx/${item}`" target="_blank">{{item}}</a>
        </h6> 
        
      </div>
    </div>
  </div>
</div>
</template>

<script>
import {CONTRACTADDR, ISSUERADDR, SPADDR} from "@/env";
import {web3Service} from "../blockchain/web3";

export default {
  name: "IssuePage",
  data() {
    return {
      issuerAddr: ISSUERADDR,
      contractAddr: CONTRACTADDR,
      spAddr: SPADDR,
      jsonCerts: [],
      isApproved: false,
      privateKey: null,
      approveStatus: null,
      signStatus: null,
      txsHash: []
    }
  },
  computed: {
    currentAddr() {
      return this.$store.state.currentAddr
    }
  },
  methods: {
    handleFileUpload(event) {
      this.$data.jsonCerts = [...event.target.files]
      this.$data.isApproved = false
      this.$data.approveStatus = null
      this.$data.signStatus = null,
      this.$data.txsHash = []
    },

    importPrivateKey() {
      this.$data.currentAddr = web3Service.importPrivateKey(this.$data.privateKey)
      this.$data.privateKey = null
    },

    //TODO: show fee amount on UI
    makeApprove() {
      if (this.$data.jsonCerts.length === 0) {
        console.log('no certs selected')
        return
      }
      web3Service.approve(this.currentAddr, this.$data.jsonCerts.length)
      .then(response => {
        console.log(response)
        this.$data.isApproved = response
        this.$data.approveStatus = "approve OK!"
      })
      .catch(err => {
        console.log(err)
        this.$data.approveStatus = "approve ERROR!"
      })
    },

    signCerts() {
      web3Service.signCerts(this.currentAddr, this.$data.jsonCerts)
      .then((txsHash) => {
        this.$data.signStatus = "sign OK!"
        this.$data.txsHash = txsHash
        console.log(txsHash)
      })
      .catch(err => {
        console.log(err)
        this.$data.signStatus = err.message
      })
    }
  }
}
</script>

<style scoped>
/*
div, div > * {
  border: 1px solid black;
}
*/

</style>
