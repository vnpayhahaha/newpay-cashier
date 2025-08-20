export interface OrderInfo {
  orderId: string;
  amount: number;
  status: string;
  paymentMethods: string[];
  // 其他订单字段...
}

export interface ApiOrderInfo {
  account: string;
  amount: string;
  bank: string;
  name: string;
  out_order_number: string;
  qrCore: string;
  status: number;
}

export interface ApiResponse {
  code: number;
  msg: string;
  data: ApiOrderInfo;
}
