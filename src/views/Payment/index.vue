<script setup lang="ts">
import { computed, ref, watch, type Component } from "vue";
import { useRoute } from "vue-router";
import QrBaseDefault from "./templates/QrBaseDefault.vue";
import QrBasePPAndPTM from "./templates/QrBasePPAndPTM.vue";
import type { OrderInfo } from "@/types/order";
import { api } from "../../utils/api";

const route = useRoute();
const orderInfo = ref<OrderInfo | null>(null);
// 定义有效的模板名称类型
type TemplateName = "QrBaseDefault" | "QrBasePPAndPTM";
// 类型安全的模板组件映射
const templateComponents: Record<TemplateName, Component> = {
  QrBaseDefault: QrBaseDefault,
  QrBasePPAndPTM: QrBasePPAndPTM,
};

// 类型安全的模板名称计算属性
const templateName = computed<TemplateName>(() => {
  console.log('Current template param:', route.params.template);
  // 确保路由参数是字符串类型
  const name = Array.isArray(route.params.template)
    ? route.params.template[0]
    : route.params.template;

  // 验证模板名称有效性，如果无效则使用默认模板
  if (!name || !(name in templateComponents)) {
    console.warn(`Invalid or missing template name: ${name}, using default QrBaseDefault`);
    return "QrBaseDefault";
  }

  return name as TemplateName;
});
// 获取订单数据
const fetchOrderData = async (orderId: string) => {
  try {
    const res = await api.getOrderDetail(orderId);
    orderInfo.value = res.data;
  } catch (error) {
    console.error("获取订单信息失败", error);
  }
};

// 监听路由参数变化
watch(
  () => route.params.orderId,
  (newVal) => {
    if (newVal) fetchOrderData(newVal as string);
  },
  { immediate: true }
);
</script>

<template>
  <div class="payment-container">
    <component
      :is="templateComponents[templateName]"
      v-if="orderInfo"
      :order-data="orderInfo"
    />
    <el-skeleton v-else :rows="6" animated />
  </div>
</template>
