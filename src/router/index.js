import { createRouter, createWebHistory } from 'vue-router'
import HomePage from "../views/HomePage"
import IssuePage from "../views/IssuePage"
import ViewPage from "../views/ViewPage"
import RevokePage from "../views/RevokePage";
import VerifyPage from "../views/VerifyPage";

const routes = [{
  path: '/',
  component: HomePage,
  children: [
    {
      path: '',
      component: IssuePage
    },
    {
      path: 'view',
      component: ViewPage
    },
    {
      path: 'revoke',
      component: RevokePage
    },
    {
      path: 'verify',
      component: VerifyPage
    }
  ]
}]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
