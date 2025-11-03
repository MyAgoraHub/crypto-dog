import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
  },
  {
    path: '/indicators',
    name: 'Indicators',
    component: () => import('../views/IndicatorsView.vue'),
  },
  {
    path: '/orderbook',
    name: 'OrderBook',
    component: () => import('../views/OrderBookView.vue'),
  },
  {
    path: '/trades',
    name: 'Trades',
    component: () => import('../views/TradesView.vue'),
  },
  {
    path: '/signals',
    name: 'Signals',
    component: () => import('../views/SignalMonitoringView.vue'),
  },
  {
    path: '/signals/config',
    name: 'SignalConfig',
    component: () => import('../views/SignalConfigView.vue'),
  },
  {
    path: '/backtest',
    name: 'Backtest',
    component: () => import('../views/BacktestView.vue'),
  },
  {
    path: '/tradebot',
    name: 'TradeBot',
    component: () => import('../views/TradeBotView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
