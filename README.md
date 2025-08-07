src/
│
├── assets/ // 静态资源（图片、样式等）
├── components/ // 公共组件（支付模板组件等）
│
├── views/ // 不同模板的页面视图（动态根据路由渲染模板）
│ ├── PaymentDefault.vue
│ ├── PaymentPPAndPTM.vue
│ └── ...（其他模板）
│
├── router/ // 路由配置
│ └── index.ts
│
├── store/ // 状态管理（可选，简单状态可用组合式 API 管理）
│
├── App.vue
└── main.ts

src/
├─ assets/
├─ components/
│ └─ Header.vue # 公共头部
├─ views/
│ ├─ Payment/ # 支付页目录
│ │ ├─ index.vue # 支付页入口
│ │ └─ templates/ # 支付模板目录
│ │ ├─ QrBaseDefault.vue
│ │ └─ QrBasePPAndPTM.vue
├─ router/
│ └─ index.ts # 路由配置
├─ types/
│ └─ order.d.ts # 类型定义
├─ utils/
│ └─ api.ts # API 接口
├─ App.vue
└─ main.ts
