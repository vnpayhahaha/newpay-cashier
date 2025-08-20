<template>
  <div class="container">
    <div class="header">
      <div class="title">Payment Amount</div>
      <div class="amount">₹{{ apiOrderData?.amount || 0 }}
        <div class="countdown-timer" v-if="showCountdown && countdownTime">
          {{ countdownTime }}
        </div>
      </div>
    </div>
    
    <div class="content">
      <div class="payment-title">Choose Your Payment Method</div>
      <div class="payment-options">
        <div 
          v-for="method in paymentMethods" 
          :key="method.id"
          class="option-item" 
          :class="{ selected: selectedMethod === method.id }"
          :data-method="method.id"
          @click="selectPaymentMethod(method.id)"
        >
          <div class="option-content">
            <div class="option-icon">
              <img :src="method.icon" :alt="method.name + ' Logo'">
            </div>
            <div class="option-name">{{ method.name }}</div>
          </div>
          <input type="radio" name="payment" class="option-radio" v-model="selectedMethod" :value="method.id">
        </div>
      </div>
      
      <button class="submit-btn" @click="showPaymentModal">
        Submit Payment
      </button>
    </div>
    
    <div class="bottom">
      <div class="title">Payment Instructions</div>
      <div class="description">
        Please select the payment method you need and make sure your phone has the corresponding wallet software installed. 
        After payment, you may need to enter the UTR number for verification. UTR (Unique Transaction Reference) is a 12-digit 
        number generated for every transaction which helps in tracking the payment.
      </div>
    </div>
    
    <!-- 弹窗结构 -->
    <div class="modal" :class="{ show: showModal }" @click.self="closeModal">
      <div class="modal-content">
        <span class="close-btn" @click="closeModal">&times;</span>
        <p class="modal-text">Warning: After payment, return to enter the UTR</p>
        
        <div class="qrcode-container">
          <img class="modal-qr" :src="currentQrCode" :alt="selectedMethodName + ' QR Code'">
          <p class="qr-text">Open {{ selectedMethodName }} App > Scan QR Code > Confirm Payment</p>
        </div>
        
        <div class="modal-input-container">
          <label class="input-label">Enter UTR Number (After Payment)</label>
          <input type="text" class="modal-input" v-model="utrNumber" placeholder="12-digit UTR number">
        </div>
        
        <div class="modal-footer">How to find the UTR?</div>
        
        <button class="modal-button" @click="confirmFinish">
          <i class="fas fa-check-circle"></i> Submit Payment
        </button>
      </div>
    </div>
    
    <!-- 支付成功弹窗 -->
    <div v-if="showSuccessModal" class="modal show" @click.self="closeModal">
      <div class="modal-content">
        <h3>支付成功！</h3>
        <p>{{ successRedirectTime }} 秒后将自动跳转</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import type { OrderInfo } from '@/types/order'

interface Props {
  orderData: OrderInfo
}

const props = defineProps<Props>()
const route = useRoute()

const selectedMethod = ref('paytm')
const showModal = ref(false)
const utrNumber = ref('')
const apiOrderData = ref<any | null>(null)
const isLoading = ref(true)
const countdownTimer = ref<number | null>(null)
const countdownTime = ref('')
const showCountdown = ref(false)
const showSuccessModal = ref(false)
const successRedirectTime = ref(5)

const paymentMethods = [
  { id: 'paytm', name: 'Paytm', icon: '/static/img/paytm.svg' },
  { id: 'phonepe', name: 'PhonePe', icon: '/static/img/phonepe.png' },
  { id: 'gpay', name: 'Google Pay', icon: '/static/img/gpay.png' },
  { id: 'bhim', name: 'BHIM', icon: '/static/img/bhim.svg' },
  { id: 'amazonpay', name: 'Amazon Pay', icon: '/static/img/amazonpay.svg' },
  { id: 'other', name: 'Other options', icon: '/static/img/other.svg' }
]

const selectedMethodName = computed(() => {
  const method = paymentMethods.find(m => m.id === selectedMethod.value)
  return method ? method.name : 'Payment'
})

const currentQrCode = computed(() => {
  const qrData = apiOrderData.value?.qrCore || `${selectedMethodName.value}:${apiOrderData.value?.amount || 0}`
  return apiOrderData.value?.qrCore 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
    : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
})

const fetchOrderInfo = async () => {
  try {
    const orderId = route.params.orderId as string
    if (!orderId) {
      handleError('订单ID不存在')
      return
    }

    const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/v1/common/collection/query_order?platform_order_no=${orderId}`)
    const result = await response.json()
    
    if (result.success && result.data) {
      apiOrderData.value = result.data
      handleOrderStatus(result.data)
    } else {
      handleError('查询订单失败')
    }
  } catch (error) {
    console.error('Failed to fetch order info:', error)
    handleError('网络错误')
  } finally {
    isLoading.value = false
  }
}

const handleOrderStatus = (orderData: any) => {
  const status = orderData.status
  
  switch (status) {
    case 20: // 已支付成功
      handlePaymentSuccess(orderData)
      break
    case 10: // 待支付
      startCountdown(orderData.expire_time)
      break
    case 40: // 支付失败
    case 41: // 已取消
    case 44: // 已退款
      handleError('订单状态异常')
      break
    case 43: // 已失效
      handleTimeout()
      break
    default:
      handleError('未知订单状态')
  }
}

const handlePaymentSuccess = (orderData: any) => {
  if (orderData.return_url) {
    showSuccessModal.value = true
    startSuccessCountdown(orderData.return_url)
  } else {
    window.location.href = `${import.meta.env.VITE_APP_BASE_URL}/success.html`
  }
}

const startSuccessCountdown = (returnUrl: string) => {
  const timer = setInterval(() => {
    successRedirectTime.value--
    if (successRedirectTime.value <= 0) {
      clearInterval(timer)
      window.location.href = returnUrl
    }
  }, 1000)
}

const startCountdown = (expireTime: string) => {
  showCountdown.value = true
  
  const updateCountdown = () => {
    const now = new Date()
    // 转换为印度时间
    const indiaTime = new Date(now.getTime())
    const expireDate = new Date(expireTime)
    const diff = expireDate.getTime() - indiaTime.getTime()
    
    if (diff <= 0) {
      handleTimeout()
      return
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    countdownTime.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  updateCountdown()
  countdownTimer.value = setInterval(updateCountdown, 1000) as any
}

const handleTimeout = () => {
}

const handleError = (message: string) => {
  console.error(message)
  window.location.href = `${import.meta.env.VITE_APP_BASE_URL}/error.html`
}

const selectPaymentMethod = (methodId: string) => {
  selectedMethod.value = methodId
}

const showPaymentModal = () => {
  showModal.value = true
  // 防止背景滚动
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  showModal.value = false
  utrNumber.value = ''
  // 恢复背景滚动
  document.body.style.overflow = 'auto'
}

const confirmFinish = async () => {
  if (!utrNumber.value) {
    alert('请输入UTR')
    return
  }
  
  try {
    const data = {
      out_order_number: props.orderData.orderId,
      utr: utrNumber.value
    }
    
    const response = await fetch('https://api.tzpay.cloud/web/transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    if (result) {
      if (result.code === -1) {
        alert(result.msg)
      }
      if (result.code === 0) {
        alert(result.msg)
        closeModal() // 关闭弹窗并恢复滚动
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    }
  } catch (error) {
    console.error('Network error:', error)
  }
}

onMounted(() => {
  // 初始化默认选中第一个支付方式
  selectedMethod.value = 'paytm'
  // 获取订单信息
  fetchOrderInfo()
})

onUnmounted(() => {
  // 组件卸载时恢复body滚动
  document.body.style.overflow = 'auto'
  // 清除定时器
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
})
</script>

<style scoped>
.container {
  margin: 0 auto;
  background: linear-gradient(135deg, #f5f8f9 0%, #e6f0ff 100%);
  min-height: 100vh;
  padding-bottom: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  letter-spacing: .4px;
  font-weight: 700;
  color: #fff;
  padding: 25px 20px;
  background: linear-gradient(90deg, #305ac2 0%, #1a3a9c 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
  border: 0;
}

.title {
  text-align: center;
  font-size: 24px;
  margin-bottom: 8px;
}

.amount {
  font-size: 42px;
  font-weight: 800;
}

.countdown-timer {
  font-size: 18px;
  color: #ff4757;
  font-weight: 700;
  margin-top: 8px;
  text-align: center;
}

.content {
  background: #fff;
  box-shadow: 0 6px 20px 0 hsla(0, 0%, 72.9%, 0.3);
  border-radius: 12px;
  margin: -30px auto 0;
  padding: 30px 25px;
  position: relative;
  z-index: 15;
  width: 90%;
}

.payment-title {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f4ff;
  text-align: center;
}

.payment-options {
  display: grid;
  gap: 15px;
  margin-bottom: 25px;
}

.option-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 12px 15px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid #e0e7ff;
  cursor: pointer;
}

.option-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(48, 90, 194, 0.15);
  border-color: #a0b8ff;
}

.option-item.selected {
  background: #edf2ff;
  border-color: #305ac2;
}

.option-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 15px;
}

.option-icon {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f8f9 0%, #e6f0ff 100%);
  border-radius: 10px;
  padding: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.option-icon img {
  max-width: 100%;
  max-height: 100%;
}

.option-name {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.option-radio {
  width: 22px;
  height: 22px;
  cursor: pointer;
  accent-color: #305ac2;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: linear-gradient(90deg, #305ac2 0%, #4286f4 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  margin: 10px auto 0;
  font-weight: 600;
  width: 100%;
  max-width: 300px;
  height: 55px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(48, 90, 194, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.submit-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(48, 90, 194, 0.4);
}

.submit-btn:active {
  transform: translateY(1px);
}

.bottom {
  box-shadow: 0 6px 20px 0 hsla(0, 0%, 72.9%, 0.2);
  border-radius: 12px;
  padding: 25px;
  margin: 25px auto 0;
  width: 90%;
  background: #fff;
}

.bottom .title {
  font-size: 20px;
  font-weight: 700;
  color: #305ac2;
  margin-bottom: 15px;
}

.description {
  font-size: 16px;
  line-height: 1.6;
  color: #555;
  margin-bottom: 15px;
}

.order-info {
  background: #f8f9ff;
  border: 1px solid #e0e7ff;
  border-radius: 8px;
  padding: 15px;
  font-size: 14px;
  line-height: 1.5;
}

.order-info div {
  margin-bottom: 5px;
}

.order-info strong {
  color: #305ac2;
}

/* 弹窗样式 */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.7);
  backdrop-filter: blur(3px);
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal.show {
  display: block;
  opacity: 1;
}

.modal-content {
  background-color: #fff;
  border-radius: 15px 15px 0 0;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 90vh;
  overflow-y: visible;
  padding: 20px;
  box-shadow: 0 -5px 30px rgba(0, 0, 0, 0.2);
  transform: translateY(100%);
  transition: transform 0.3s ease;
  box-sizing: border-box;
}

.modal.show .modal-content {
  transform: translateY(0);
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 25px;
  font-size: 32px;
  font-weight: bold;
  color: #888;
  cursor: pointer;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #ff4757;
}

.modal-text {
  font-size: 17px;
  margin-bottom: 20px;
  color: #555;
  line-height: 1.5;
  text-align: center;
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
}

.modal-qr {
  width: 200px;
  height: 200px;
  border: 1px solid #e0e7ff;
  border-radius: 12px;
  padding: 15px;
  background: #f9fbff;
  margin-bottom: 15px;
}

.qr-text {
  font-size: 16px;
  color: #666;
  text-align: center;
  max-width: 300px;
  margin-bottom: 20px;
}

.modal-input-container {
  margin: 20px 0;
}

.input-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.modal-input {
  width: 100%;
  height: 50px;
  background: #f6f6f6;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 0 15px;
  font-size: 17px;
  font-weight: 500;
  outline: none;
  transition: border 0.3s;
  box-sizing: border-box;
}

.modal-input:focus {
  border: 2px solid #305ac2;
  background: #fff;
}

.modal-footer {
  text-align: right;
  color: #1c2aff;
  font-size: 14px;
  margin: 5px 0 15px;
  font-weight: 500;
  cursor: pointer;
}

.modal-button {
  background: linear-gradient(90deg, #00b578 0%, #00cc88 100%);
  width: 100%;
  height: 55px;
  border-radius: 10px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  border: 0;
  cursor: pointer;
  margin: 20px 0 10px;
  box-shadow: 0 4px 15px rgba(0, 181, 120, 0.3);
  transition: all 0.3s ease;
}

.modal-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 181, 120, 0.4);
}

.modal-button i {
  margin-right: 8px;
  font-size: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .payment-options {
    grid-template-columns: 1fr;
  }
  
  .header {
    padding: 20px 15px;
  }
  
  .header .title {
    font-size: 20px;
  }
  
  .header .amount {
    font-size: 36px;
  }
  
  .content {
    padding: 25px 20px;
  }
  
  .option-name {
    font-size: 17px;
  }
}

@media (max-width: 480px) {
  .content {
    padding: 20px 15px;
  }
  
  .option-item {
    padding: 10px 12px;
  }
  
  .option-icon {
    width: 45px;
    height: 45px;
  }
  
  .modal-content {
    padding: 20px 15px;
  }
  
  .modal-text {
    font-size: 16px;
  }
}
</style>
