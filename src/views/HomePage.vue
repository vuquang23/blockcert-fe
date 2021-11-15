<template>
<div>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container-fluid">
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav">
          <li class="nav-item">
            <a class="nav-link" aria-current="page" :href="`/`">Issue</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :href="`/view`">View</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :href="`/revoke`">Revoke</a>
          </li>
        </ul>
      </div>
      <div class="d-flex">
        <button class="btn btn-outline-success" @click="connectWallet()">Connect to metamask</button>
      </div>
    </div>
  </nav>
  <hr>

  <router-view/>
</div>
</template>

<script>
export default {
  name: "HomePage",
  mounted() {
    const { ethereum } = window
    ethereum.on('accountsChanged', (accounts) => {
      this.$store.commit("changeAddr", accounts[0])
    })
  },
  methods: {
    connectWallet() {
      const { ethereum } = window
      ethereum.request({ method: 'eth_requestAccounts' })
      .then(accounts => {
        this.$store.commit("changeAddr", accounts[0])
      })
      .catch(err => console.log(err))
    }
  }
}
</script>

<style scoped>

</style>
