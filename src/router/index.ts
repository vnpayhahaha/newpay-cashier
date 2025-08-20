import { createRouter, createWebHistory } from "vue-router";
import PaymentPage from "../views/Payment/index.vue";

const routes = [
  {
    path: "/",
    redirect: "/payment/QrBaseDefault/demo123"
  },
  {
    path: "/payment/:template/:orderId",
    name: "Payment",
    component: PaymentPage,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
