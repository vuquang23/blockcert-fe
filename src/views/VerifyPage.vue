<template>
  <div class="container vh-100">
    <div class="row justify-content-center vh-100">
      <div class="col-6">
        <h6>Verify certificates of Organization:<br>
          <a :href="`https://testnet.bscscan.com/address/${contractAddr}`" target="_blank">{{contractAddr}}</a>
        </h6>

        <div class="mb-3" style="margin-top: 3em">
          <label for="formFile" class="form-label">Upload json certificates to verify!</label>
          <input class="form-control" type="file" id="formFile" @change="handleFileUpload($event)">
        </div>

        <div style="margin-top: 1em; margin-bottom: 1em">
          <button class="btn btn-primary" type="button" @click="verify()">Verify</button>
        </div>

        <h6>{{result}}</h6>
      </div>
    </div>
  </div>
</template>

<script>
import {CONTRACTADDR} from "../env";
import {verifyCert} from "../blockchain/web3";

export default {
  name: "VerifyPage",
  data() {
    return {
      contractAddr: CONTRACTADDR,
      certFiles: null,
      result: null
    }
  },
  methods: {
    handleFileUpload(event) {
      this.$data.certFiles = [...event.target.files]
      this.$data.result = null
    },

    verify() {
      if (this.$data.certFiles === null) {
        this.$data.result = "please choose a file"
        return
      }
      verifyCert(this.$data.contractAddr, this.$data.certFiles)
      .then(response => {
        this.$data.result = (response === true ? "cert is valid" : "cert is not valid")
      })
      .catch(err => {
        console.log(err)
        this.$data.result = "verify failed! plz try again"
      })
    }
  }
}
</script>

<style scoped>

</style>
