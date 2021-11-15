import { createStore } from 'vuex'

const store = createStore({
  state() {
    return {
      currentAddr: null
    }
  },
  mutations: {
    changeAddr (state, newAddr) {
      state.currentAddr = newAddr
    }
  }
})

export default store
