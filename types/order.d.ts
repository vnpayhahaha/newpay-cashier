export interface OrderInfo {
  orderId: string;
  amount: number;
  status: string;
  paymentMethods: string[];
  // 其他订单字段...
}
