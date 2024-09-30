const { PORTS, ENVS } = require('@ebazdev/core');

module.exports = {
  apps: [
    {
      name: "product",
      script: "./build/index.js",
      instances: 1,
      exec_mode: "cluster",
      env_development: {
        NODE_ENV: "development",
        PORT: PORTS.DEV.Product,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `product-service-${process.env.PM2_INSTANCE_ID}` : 'product-service',
        ...ENVS.DEV,
        COLA_USERNAME: "bazaar",
        COLA_PASSWORD: "M8@46jkljkjkljlk#$2024",
        COLA_GET_TOKEN_URI: "http://122.201.28.22:8083/api/tokenbazaar",
        COLA_PRODUCTS_BY_MERCHANTID: "http://122.201.28.22:8083/api/ebazaar/productremains"
      },
      env_stag: {
        NODE_ENV: "stag",
        PORT: PORTS.STAG.Product,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `product-service-${process.env.PM2_INSTANCE_ID}` : 'product-service',
        ...ENVS.STAG,
        COLA_USERNAME: "bazaar",
        COLA_PASSWORD: "M8@46jkljkjkljlk#$2024",
        COLA_GET_TOKEN_URI: "http://122.201.28.22:8083/api/tokenbazaar",
        COLA_PRODUCTS_BY_MERCHANTID: "http://122.201.28.22:8083/api/ebazaar/productremains"
      },
      env_production: {
        NODE_ENV: "production",
        PORT: PORTS.DEV.Product,
        NATS_CLIENT_ID: process.env.PM2_INSTANCE_ID ? `product-service-${process.env.PM2_INSTANCE_ID}` : 'product-service',
        ...ENVS.PROD,
        COLA_USERNAME: "bazaar",
        COLA_PASSWORD: "M8@46jkljkjkljlk#$2024",
        COLA_GET_TOKEN_URI: "http://122.201.28.22:8083/api/tokenbazaar",
        COLA_PRODUCTS_BY_MERCHANTID: "http://122.201.28.22:8083/api/ebazaar/productremains"
      },
    },
  ],
};
