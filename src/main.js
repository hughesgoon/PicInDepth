import Vue from "vue";
import App from "./App.vue";
import VueFullPage from "vue-fullpage.js";
import vuetify from "./plugins/vuetify";

Vue.config.productionTip = false;
Vue.use(VueFullPage);

new Vue({
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
