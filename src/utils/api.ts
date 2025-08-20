import type { OrderInfo } from '@/types/order'

export const api = {
  getOrderDetail: (orderId: string) => {
    return new Promise<{ data: OrderInfo }>((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            orderId,
            amount: 100.0,
            status: "待支付",
            paymentMethods: ["微信支付", "支付宝"],
          },
        });
      }, 500);
    });
  },
};
