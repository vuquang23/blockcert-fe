<template>
<div class="container vh-100">
    <div class="row justify-content-center vh-100">
      <div class="col-6">
        <h6 style="margin-bottom: 2em;">Organization:<br>
          <a :href="`https://testnet.bscscan.com/address/${contractAddr}`" target="_blank">{{contractAddr}}</a>
        </h6>

        <div class="input-group mb-3">
          <input v-model="nftID" type="text" class="form-control" placeholder="NFT-ID to revoke">
        </div>

         <div class="input-group mb-3">
          <input v-model="reason" type="text" class="form-control" placeholder="reason">
        </div>

        <h6>(please use <span class="fw-bold">{{issuerAddr}}</span> for testing)</h6>
        <h6>Your current address:<br>
          <a :href="`https://testnet.bscscan.com/address/${currentAddr}`" target="_blank">{{currentAddr}}</a>
        </h6>

        <div>
          <button class="btn btn-primary" type="button" @click="revoke(issuerAddr, nftID, reason)">Revoke</button>
        </div>

        <h6 class="fw-bold" style="margin-top: 0.5em">{{txStatus}}</h6>

        <h6 v-show="txHash !== null">Tx Hash:<br>
          <a :href="`https://testnet.bscscan.com/tx/${txHash}`" target="_blank">{{txHash}}</a>
        </h6>
      </div>
    </div>
  </div>
</template>

<script>
import {CONTRACTADDR, ISSUERADDR} from "../env";
import {web3Service} from "../blockchain/web3";

export default {
  name: "RevokePage",
  data() {
    return {
      contractAddr: CONTRACTADDR,
      issuerAddr: ISSUERADDR,
      txStatus: null,
      nftID: null,
      reason: null,
      txHash: null
    }
  },
  computed: {
    currentAddr() {
      return this.$store.state.currentAddr
    }
  },
  methods: {
    revoke(issuerAddr, nftID, reason) {
      if (nftID === null) {
        return
      }

      web3Service.revokeCertThroughMetamask(issuerAddr, nftID, reason)
      .then(txs => {
        console.log(txs)
        this.$data.txStatus = "revoke OK!"
        this.$data.txHash = txs
      })
      .catch(err => {
        console.log(err)
        this.$data.txStatus = "revoke ERROR!"
        this.$data.txHash = null
      })
    }
  }
}
</script>

<style scoped>

</style>
