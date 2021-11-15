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
    </div>
  </nav>
  <hr>

  <router-view/>
</div>
</template>

<script>
export default {
  name: "HomePage"
}
</script>

<style scoped>

</style>
