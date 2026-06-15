
const http = require("http")
const os = require("os")

require("dotenv").config()

const app = require("./app")

const {
  initSocket
} = require("./config/socket")

const {
  verifyMailConnection
} = require("./mail/mail.config")

const PORT = Number(process.env.PORT || 2000)

/*
|--------------------------------------------------------------------------
| HOST SERVER
|--------------------------------------------------------------------------
*/
const HOST = "0.0.0.0"

/*
|--------------------------------------------------------------------------
| PUBLIC HOST
|--------------------------------------------------------------------------
*/
const PUBLIC_HOST =
  process.env.PUBLIC_HOST || "76.13.197.9"

/*
|--------------------------------------------------------------------------
| GET LOCAL NETWORK IP
|--------------------------------------------------------------------------
*/
const getLocalNetworkIp = () => {
  const interfaces = os.networkInterfaces()

  for (const name of Object.keys(interfaces)) {
    const networks = interfaces[name] || []

    for (const network of networks) {
      if (
        network.family === "IPv4" &&
        !network.internal
      ) {
        return network.address
      }
    }
  }

  return "localhost"
}

const LOCAL_NETWORK_IP =
  process.env.LOCAL_NETWORK_IP ||
  getLocalNetworkIp()

/*
|--------------------------------------------------------------------------
| CREATE HTTP SERVER
|--------------------------------------------------------------------------
*/
const server = http.createServer(app)

initSocket(server)

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/
const startServer = async () => {
  /*
  |--------------------------------------------------------------------------
  | CHECK MAIL CONNECTION
  |--------------------------------------------------------------------------
  | Kegagalan koneksi email tidak menghentikan server.
  |--------------------------------------------------------------------------
  */
  const mailConnected =
    await verifyMailConnection()

  server.listen(PORT, HOST, () => {
    const localApiUrl =
      `http://localhost:${PORT}/api`

    const networkApiUrl =
      `http://${LOCAL_NETWORK_IP}:${PORT}/api`

    const publicApiUrl =
      `http://${PUBLIC_HOST}:${PORT}/api`

    const localSwaggerUrl =
      `http://localhost:${PORT}/api-docs`

    const networkSwaggerUrl =
      `http://${LOCAL_NETWORK_IP}:${PORT}/api-docs`

    const publicSwaggerUrl =
      `http://${PUBLIC_HOST}:${PORT}/api-docs`

    console.log("")
    console.log("==============================================")
    console.log("🚀 Server SIOPOS berjalan")
    console.log("==============================================")
    console.log(`Environment        : ${process.env.NODE_ENV || "development"}`)
    console.log(`Port               : ${PORT}`)
    console.log(`Host               : ${HOST}`)
    console.log(`Mail Server        : ${mailConnected ? "Terhubung" : "Tidak terhubung"}`)
    console.log("----------------------------------------------")
    console.log(`Local API          : ${localApiUrl}`)
    console.log(`Network / WiFi API : ${networkApiUrl}`)
    console.log(`Public VPS API     : ${publicApiUrl}`)
    console.log("----------------------------------------------")
    console.log(`Swagger Local      : ${localSwaggerUrl}`)
    console.log(`Swagger Network    : ${networkSwaggerUrl}`)
    console.log(`Swagger Public     : ${publicSwaggerUrl}`)
    console.log("==============================================")
    console.log("")
    console.log("💻 Untuk laptop/server lokal:")
    console.log(`Gunakan base URL : ${localApiUrl}`)
    console.log("")
    console.log("📱 Untuk Flutter / HP fisik satu WiFi:")
    console.log(`Gunakan base URL : ${networkApiUrl}`)
    console.log("")
    console.log("🌐 Untuk akses dari internet / VPS:")
    console.log(`Gunakan base URL : ${publicApiUrl}`)
    console.log("")
  })
}

/*
|--------------------------------------------------------------------------
| SERVER ERROR
|--------------------------------------------------------------------------
*/
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} sedang digunakan oleh aplikasi lain`
    )

    process.exit(1)
  }

  console.error(
    "❌ Server error:",
    error.message
  )

  process.exit(1)
})

/*
|--------------------------------------------------------------------------
| UNHANDLED ERROR
|--------------------------------------------------------------------------
*/
process.on("unhandledRejection", (error) => {
  console.error(
    "❌ Unhandled Promise Rejection:",
    error
  )
})

process.on("uncaughtException", (error) => {
  console.error(
    "❌ Uncaught Exception:",
    error
  )

  process.exit(1)
})

startServer().catch((error) => {
  console.error(
    "❌ Gagal menjalankan server:",
    error.message
  )

  process.exit(1)
})
