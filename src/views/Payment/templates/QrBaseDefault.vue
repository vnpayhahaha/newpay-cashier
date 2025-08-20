<template>
  <div class="container">
    <div class="header">
      <img class="logo" src="/static/img/upi_white.png" alt="UPI Logo">
      <div class="title">India Payment</div>
    </div>
    
    <div class="content">
      <div class="amount-label">The amount you need to Pay</div>
      <div class="amount-display">
        <div class="countdown-timer" v-if="showCountdown && countdownTime">
          {{ countdownTime }}
        </div>
        <div class="value">₹{{ apiOrderData?.amount || orderData?.amount || 0 }}</div>
      </div>

      <div class="instruction">Use mobile scan code to pay</div>
      <div class="qrcode-container">
        <img class="qrcode" :src="qrCodeUrl" alt="Payment QR Code">
      </div>

      <button class="scan-button" @click="downloadQRCode">
         Download / Scan QR Code
      </button>

      <div class="payment-title">Select an option to pay (UPI)</div>
      
      <div class="payment-options">
        <div class="option-item" :class="{ selected: selectedMethod === 'paytm' }" @click="selectPaymentMethod('paytm')">
          <div class="option-content">
            <div class="option-icon">
              <img src="/static/img/paytm.svg" alt="Paytm Logo">
            </div>
            <div class="option-name">Paytm</div>
          </div>
          <input type="radio" name="payment" class="option-radio" v-model="selectedMethod" value="paytm">
        </div>
      </div>
      <div class="payment-options">
        <div class="option-item" :class="{ selected: selectedMethod === 'phonepe' }" @click="selectPaymentMethod('phonepe')">
          <div class="option-content">
            <div class="option-icon">
              <img src="/static/img/phonepe.png" alt="PhonePe Logo">
            </div>
            <div class="option-name">PhonePe</div>
          </div>
          <input type="radio" name="payment" class="option-radio" v-model="selectedMethod" value="phonepe">
        </div>
      </div>
    </div>
    
    <div class="bottom">
      <div class="title">Payment prompt:</div>
      <div class="description">Please select the payment method you need and make sure your phone has the corresponding wallet software installed. After payment, you may need to enter the UTR number for verification.</div>
      <div v-if="apiOrderData" class="order-info">
        <div><strong>Order:</strong> {{ apiOrderData.out_order_number }}</div>
        <div><strong>Account:</strong> {{ apiOrderData.account }}</div>
        <div v-if="apiOrderData.bank"><strong>Bank:</strong> {{ apiOrderData.bank }}</div>
        <div v-if="apiOrderData.name"><strong>Name:</strong> {{ apiOrderData.name }}</div>
      </div>
    </div>
    
    <!-- 弹窗结构 -->
    <div v-if="showModal && selectedMethod === 'paytm'" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <span class="close-btn" @click="closeModal">&times;</span>
        <h3>Attention</h3>
        <p>Paytm only supports scanning QR codes for payment</p>
        <img class="modal-qr" :src="qrCodeUrl" alt="Paytm QR Code">
        
        <button class="modal-button" @click="downloadQRCode">
           Save QR Code and Pay ₹{{ apiOrderData?.amount || orderData?.amount || 0 }}
        </button>
        
        <div class="modal-footer">How to find the UTR?</div>
        <input type="text" class="modal-input" v-model="utrNumber" placeholder="UTR / UPI Ref No / UPI Transaction ID">
        <button class="modal-button" @click="submitPayment">
           Submit Payment
        </button>
      </div>
    </div>
    
    <div v-if="showModal && selectedMethod === 'phonepe'" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <span class="close-btn" @click="closeModal">&times;</span>
        <h3>Attention</h3>
        <p>PhonePe only supports scanning QR codes for payment</p>
        <img class="modal-qr" :src="qrCodeUrl" alt="PhonePe QR Code">

        <button class="modal-button" @click="downloadQRCode">
           Save QR Code and Pay ₹{{ apiOrderData?.amount || orderData?.amount || 0 }}
        </button>
        
        <div class="modal-footer">How to find the UTR?</div>
        <input type="text" class="modal-input" v-model="utrNumber" placeholder="UTR / UPI Ref No / UPI Transaction ID">
        <button class="modal-button" @click="submitPayment">
           Submit Payment
        </button>
      </div>
    </div>
    
    <!-- 支付成功弹窗 -->
    <div v-if="showSuccessModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <h3>支付成功！</h3>
        <p>{{ successRedirectTime }} 秒后将自动跳转</p>
      </div>
    </div>
    
    <!-- 下载状态提示 -->
    <div v-if="showDownloadStatus" class="download-status" :class="{ success: downloadSuccess, error: !downloadSuccess }">
      <i :class="downloadSuccess ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
      <span>{{ downloadMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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
const showDownloadStatus = ref(false)
const downloadSuccess = ref(false)
const downloadMessage = ref('')
const qrCodeUrl = ref('https://img1.baidu.com/it/u=2172818577,3783888802&fm=253&app=138&f=JPEG?w=800&h=1422')
const apiOrderData = ref<any | null>(null)
const isLoading = ref(true)
const countdownTimer = ref<number | null>(null)
const countdownTime = ref('')
const showCountdown = ref(false)
const showSuccessModal = ref(false)
const successRedirectTime = ref(5)

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
    const indiaTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
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
  window.location.href = `${import.meta.env.VITE_APP_BASE_URL}/timeout.html`
}

const handleError = (message: string) => {
  console.error(message)
  window.location.href = `${import.meta.env.VITE_APP_BASE_URL}/error.html`
}

const selectPaymentMethod = (method: string) => {
  selectedMethod.value = method
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

const showStatus = (message: string, isSuccess: boolean) => {
  downloadMessage.value = message
  downloadSuccess.value = isSuccess
  showDownloadStatus.value = true
  
  setTimeout(() => {
    showDownloadStatus.value = false
  }, 3000)
}

const downloadQRCode = async () => {
  try {
    showStatus('Downloading QR Code...', true)
    
    const response = await fetch(qrCodeUrl.value)
    const blob = await response.blob()
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'payment-qrcode.png'
    document.body.appendChild(a)
    a.click()
    
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showStatus('QR Code downloaded successfully!', true)
    }, 100)
  } catch (error) {
    console.error('Error downloading QR code:', error)
    showStatus('Error downloading QR code. Please try again.', false)
  }
}

const submitPayment = async () => {
  if (!utrNumber.value) {
    alert('请输入UTR')
    return
  }
  
  try {
    const data = {
      out_order_number: props.orderData.orderId,
      utr: utrNumber.value,
      type: selectedMethod.value + '-modal'
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
        closeModal() 
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
  // 初始化第一个选项为选中状态
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
  background: linear-gradient(135deg, #f5f8f9 0%, #e6f0ff 100%);
  min-height: 100vh;
  padding-bottom: 20px;
  margin: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  display: flex;
  justify-content: center;
  align-items: center;
  letter-spacing: .4px;
  font-weight: 700;
  font-size: 24px;
  color: #fff;
  gap: 8px;
  padding: 15px 20px;
  background: linear-gradient(90deg, #305ac2 0%, #1a3a9c 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.logo {
  width: auto;
  height: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.title {
  font-size: 24px;
  font-weight: 700;
}

.content {
  background: #fff;
  box-shadow: 0 6px 20px 0 hsla(0, 0%, 72.9%, 0.3);
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  margin: 30px auto 0;
  padding: 25px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.amount-label {
  text-align: center;
  font-size: 17px;
  margin-bottom: 8px;
  color: #555;
}

.amount-display {
  text-align: center;
  margin-bottom: 25px;
}

.value {
  display: flex;
  gap: 3px;
  font-size: 36px;
  color: #305ac2;
  font-weight: 800;
  justify-content: center;
}

.countdown-timer {
  font-size: 24px;
  color: #ff4757;
  font-weight: 700;
  margin-bottom: 10px;
  text-align: center;
}

.instruction {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 18px;
  color: #2c3e50;
}

.qrcode-container {
  position: relative;
  margin-bottom: 18px;
  border: 1px solid #e0e7ff;
  border-radius: 12px;
  padding: 15px;
  background: #f9fbff;
  box-shadow: 0 4px 8px rgba(48, 90, 194, 0.1);
}

.qrcode {
  width: 160px;
  height: 160px;
  transition: transform 0.3s ease;
}

.qrcode:hover {
  transform: scale(1.03);
}

.scan-button {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  background: linear-gradient(90deg, #305ac2 0%, #4286f4 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 10px;
  font-weight: 600;
  width: 210px;
  height: 50px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(48, 90, 194, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.scan-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(48, 90, 194, 0.4);
}

.scan-button:active {
  transform: translateY(1px);
}

.payment-title {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin: 30px 0 20px;
  width: 100%;
  text-align: left;
  border-bottom: 2px solid #f0f4ff;
  padding-bottom: 10px;
}

.payment-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  border: 1px dashed #d0d9ff;
  border-radius: 10px;
  margin: 10px 0 20px;
  padding: 15px;
  background: #f9fbff;
}

.option-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
  cursor: pointer;
}

.option-item:hover {
  background: #edf2ff;
}

.option-item.selected {
  background: #edf2ff;
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
  font-weight: 500;
  color: #2c3e50;
}

.option-radio {
  width: 22px;
  height: 22px;
  cursor: pointer;
  accent-color: #305ac2;
}

.bottom {
  display: flex;
  flex-direction: column;
  width: 90%;
  max-width: 450px;
  margin: 25px auto;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.bottom .title {
  font-size: 20px;
  font-weight: 800;
  color: #305ac2;
  margin-bottom: 8px;
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
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.7);
  backdrop-filter: blur(3px);
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background-color: #fff;
  margin: 8% auto;
  padding: 30px;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  overflow-y: visible;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  position: relative;
  transform: translateY(20px);
  transition: transform 0.3s ease;
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

.modal-content h3 {
  text-align: center;
  font-size: 24px;
  color: #305ac2;
  margin-bottom: 20px;
}

.modal-content p {
  text-align: center;
  font-size: 18px;
  margin-bottom: 25px;
  color: #555;
  line-height: 1.5;
}

.modal-qr {
  display: block;
  width: 180px;
  height: 180px;
  margin: 0 auto 25px;
  border: 1px solid #e0e7ff;
  border-radius: 12px;
  padding: 10px;
  background: #f9fbff;
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
  font-size: 20px;
  font-weight: 600;
  border: 0;
  cursor: pointer;
  margin: 25px 0 15px;
  box-shadow: 0 4px 15px rgba(0, 181, 120, 0.3);
  transition: all 0.3s ease;
}

.modal-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 181, 120, 0.4);
}

.modal-button:active {
  transform: translateY(1px);
}

.modal-footer {
  text-align: right;
  color: #1c2aff;
  font-size: 14px;
  margin: 10px 0;
  font-weight: 500;
}

.modal-input {
  width: 100%;
  height: 50px;
  background: #f6f6f6;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  padding: 0 15px;
  font-size: 18px;
  font-weight: 600;
  outline: none;
  transition: border 0.3s;
  box-sizing: border-box;
}

.modal-input:focus {
  border: 2px solid #305ac2;
  background: #fff;
}

/* 下载状态提示 */
.download-status {
  position: fixed;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2000;
}

.download-status.success {
  border-left: 4px solid #00b578;
}

.download-status.error {
  border-left: 4px solid #ff4757;
}

.download-status i {
  font-size: 24px;
}

.download-status.success i {
  color: #00b578;
}

.download-status.error i {
  color: #ff4757;
}

.download-status span {
  font-size: 14px;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .header {
    font-size: 20px;
  }
  
  .content {
    width: 95%;
    padding: 20px 15px;
  }
  
  .amount-display .value {
    font-size: 32px;
  }
  
  .instruction {
    font-size: 18px;
  }
  
  .scan-button {
    width: 100%;
    max-width: 250px;
    font-size: 16px;
  }
  
  .modal-content {
    padding: 20px;
  }
}
</style>
