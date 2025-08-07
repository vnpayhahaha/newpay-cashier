<template>
  <div class="payment-container">
    <!-- 金额卡片 -->
    <div class="amount-card">
      <div class="amount-label">Amount</div>
      <div class="amount-value">₹100</div>
    </div>

    <!-- 支付卡片（整合标题、选项和按钮） -->
    <div class="payment-card">
      <!-- 支付标题 -->
      <div class="payment-header">Choose Your Payment</div>

      <!-- 支付选项 -->
      <div class="payment-options">
        <div
          v-for="method in paymentMethods"
          :key="method.id"
          class="payment-method"
          :class="{ active: selectedMethod === method.id }"
          @click="selectedMethod = method.id"
        >
          <div class="method-left">
            <div class="method-icon">
              <!-- 这里预留图标位置 -->
              <img v-if="method.icon" :src="method.icon" alt="" />
            </div>
            <div class="method-name">
              {{ method.name }}
              <span v-if="method.id === 'paytm'" class="hindi-text">पे</span>
            </div>
          </div>
          <div class="radio-indicator">
            <div class="radio-inner" v-if="selectedMethod === method.id"></div>
          </div>
        </div>
      </div>

      <!-- 支付按钮 -->
      <button class="pay-button">Pay ₹100</button>

      <!-- 提示文字 -->
      <div class="payment-note">
        Please select the payment method you need and make sure your phone has
        the corresponding wallet software installed
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";

export default defineComponent({
  name: "PaymentPage",
  setup() {
    const selectedMethod = ref("paytm");
    const paymentMethods = [
      { id: "paytm", name: "Paytm", icon: "" },
      { id: "phonepe", name: "PhonePe", icon: "" },
      { id: "googlepay", name: "Google Pay", icon: "" },
      { id: "bhim", name: "BHIM", icon: "" },
      { id: "amazonpay", name: "Amazon Pay", icon: "" },
      { id: "other", name: "Other options", icon: "" },
    ];

    return { selectedMethod, paymentMethods };
  },
});
</script>

<style scoped>
/* 基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
}

.payment-container {
  max-width: 100%;

  margin: 0 auto;
  padding: 120px;
  background: #f8f8f8;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 金额卡片 */
.amount-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.amount-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.amount-value {
  font-size: 32px;
  font-weight: 600;
  color: #000;
}

/* 支付卡片（整合所有元素） */
.payment-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 支付方式标题 */
.payment-header {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 16px;
  padding-left: 8px;
}

/* 支付选项 */
.payment-options {
  margin-bottom: 16px;
}

.payment-method {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 8px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.payment-method:last-child {
  border-bottom: none;
}

.payment-method:hover {
  background: #f9f9f9;
}

.method-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.method-icon {
  width: 24px;
  height: 24px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.method-icon img {
  width: 16px;
  height: 16px;
}

.method-name {
  font-size: 16px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 5px;
}

.hindi-text {
  font-family: "Noto Sans Devanagari", sans-serif;
  font-size: 14px;
  color: #666;
}

/* 单选按钮 */
.radio-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid #007aff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.radio-inner {
  width: 12px;
  height: 12px;
  background: #007aff;
  border-radius: 50%;
}

/* 支付按钮 */
.pay-button {
  width: 100%;
  padding: 16px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 500;
  margin-bottom: 12px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.pay-button:hover {
  opacity: 0.9;
}

.pay-button:active {
  opacity: 0.8;
}

/* 提示文字 */
.payment-note {
  font-size: 13px;
  color: #888;
  text-align: center;
  line-height: 1.4;
  padding: 0 8px;
}

/* 响应式调整 */
@media (max-width: 400px) {
  .payment-container {
    padding: 15px;
  }
}
</style>
