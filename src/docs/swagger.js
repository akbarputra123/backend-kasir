const swaggerJSDoc = require("swagger-jsdoc")
require("dotenv").config()

const PORT = process.env.PORT || 2000
const PUBLIC_HOST = process.env.PUBLIC_HOST || "76.13.197.9"

const swaggerDefinition = {
  openapi: "3.0.0",

  info: {
    title: "SIOPOS API Documentation",
    version: "1.0.0",
    description: "Dokumentasi REST API untuk aplikasi kasir POS SIOPOS"
  },

  servers: [
    {
      url: `http://${PUBLIC_HOST}:${PORT}/api`,
      description: "Production VPS Server"
    },
    {
      url: `http://localhost:${PORT}/api`,
      description: "Local Development Server"
    }
  ],

  tags: [
    {
      name: "Health Check",
      description: "Endpoint untuk mengecek status API"
    },
    {
      name: "Auth",
      description: "Endpoint autentikasi user"
    },
    {
      name: "Subscriptions",
      description: "Endpoint langganan aplikasi SIOPOS"
    },
    {
      name: "Users",
      description: "Endpoint manajemen user"
    },
    {
      name: "Stores",
      description: "Endpoint manajemen toko"
    },
    {
      name: "Categories",
      description: "Endpoint manajemen kategori produk"
    },
    {
      name: "Discounts",
      description: "Endpoint manajemen diskon produk"
    },
    {
      name: "Products",
      description: "Endpoint manajemen produk"
    },
    {
      name: "Stock Logs",
      description: "Endpoint riwayat dan perubahan stok produk"
    },
    {
      name: "Transactions",
      description: "Endpoint transaksi kasir"
    },
    {
      name: "Reports",
      description: "Endpoint laporan penjualan"
    },
    {
      name: "Dashboard",
      description: "Endpoint ringkasan dashboard SIOPOS"
    },
    {
      name: "Receipts",
      description: "Endpoint data struk transaksi"
    }
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },

  security: [
    {
      bearerAuth: []
    }
  ]
}

const options = {
  definition: swaggerDefinition,
  apis: [
    "./src/routes/*.js",
    "./src/routes/**/*.js",
    "./src/modules/**/*.routes.js",
    "./src/modules/**/*.js"
  ]
}

const swaggerSpec = swaggerJSDoc(options)

module.exports = swaggerSpec