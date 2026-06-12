const swaggerJSDoc = require("swagger-jsdoc")
const os = require("os")
require("dotenv").config()

const PORT = process.env.PORT || 2000

/*
|--------------------------------------------------------------------------
| HOST CONFIG
|--------------------------------------------------------------------------
| PUBLIC_HOST  : untuk IP publik VPS
| API_BASE_URL : optional, kalau nanti pakai domain / reverse proxy
|--------------------------------------------------------------------------
*/
const PUBLIC_HOST = process.env.PUBLIC_HOST || "76.13.197.9"
const API_BASE_URL = process.env.API_BASE_URL || null

/*
|--------------------------------------------------------------------------
| GET LOCAL NETWORK IP
|--------------------------------------------------------------------------
| Ambil IP lokal laptop / server yang aktif di jaringan WiFi / LAN.
|--------------------------------------------------------------------------
*/
const getLocalNetworkIp = () => {
  const interfaces = os.networkInterfaces()

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (
        net.family === "IPv4" &&
        !net.internal
      ) {
        return net.address
      }
    }
  }

  return "localhost"
}

const LOCAL_NETWORK_IP =
  process.env.LOCAL_NETWORK_IP || getLocalNetworkIp()

/*
|--------------------------------------------------------------------------
| BUILD SWAGGER SERVERS
|--------------------------------------------------------------------------
| Fleksibel untuk:
| - Local
| - Network / WiFi
| - VPS
| - Custom domain dari API_BASE_URL
|--------------------------------------------------------------------------
*/
const servers = []

if (API_BASE_URL) {
  servers.push({
    url: API_BASE_URL,
    description: "Custom API Base URL"
  })
}

servers.push(
  {
    url: `http://${LOCAL_NETWORK_IP}:${PORT}/api`,
    description: "Network / WiFi Server"
  },
  {
    url: `http://localhost:${PORT}/api`,
    description: "Local Development Server"
  },
  {
    url: `http://${PUBLIC_HOST}:${PORT}/api`,
    description: "Production VPS Server"
  }
)

const swaggerDefinition = {
  openapi: "3.0.0",

  info: {
    title: "SIOPOS API Documentation",
    version: "1.0.0",
    description: "Dokumentasi REST API untuk aplikasi kasir POS SIOPOS"
  },

  servers,

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