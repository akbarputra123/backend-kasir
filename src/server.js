const http = require("http")
const os = require("os")
require("dotenv").config()

const app = require("./app")
const { initSocket } = require("./config/socket")

const PORT = process.env.PORT || 2000

/*
|--------------------------------------------------------------------------
| HOST SERVER
|--------------------------------------------------------------------------
| 0.0.0.0 artinya server menerima akses dari:
| - localhost
| - IP publik VPS
| - jaringan lokal / WiFi / LAN
| - jaringan luar melalui internet jika firewall mengizinkan
|--------------------------------------------------------------------------
*/
const HOST = "0.0.0.0"

/*
|--------------------------------------------------------------------------
| PUBLIC HOST / IP VPS
|--------------------------------------------------------------------------
| Ambil IP publik VPS dari .env.
| Contoh:
| PUBLIC_HOST=76.13.197.9
|--------------------------------------------------------------------------
*/
const PUBLIC_HOST = process.env.PUBLIC_HOST || "76.13.197.9"

/*
|--------------------------------------------------------------------------
| GET LOCAL NETWORK IP
|--------------------------------------------------------------------------
| Fungsi ini membaca IP lokal laptop / PC / server
| yang satu jaringan WiFi / LAN.
|
| Contoh hasil:
| 192.168.1.10
| 192.168.100.25
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

const LOCAL_NETWORK_IP = process.env.LOCAL_NETWORK_IP || getLocalNetworkIp()

const server = http.createServer(app)

initSocket(server)

server.listen(PORT, HOST, () => {
  const localApiUrl = `http://localhost:${PORT}/api`
  const networkApiUrl = `http://${LOCAL_NETWORK_IP}:${PORT}/api`
  const publicApiUrl = `http://${PUBLIC_HOST}:${PORT}/api`

  const localSwaggerUrl = `http://localhost:${PORT}/api-docs`
  const networkSwaggerUrl = `http://${LOCAL_NETWORK_IP}:${PORT}/api-docs`
  const publicSwaggerUrl = `http://${PUBLIC_HOST}:${PORT}/api-docs`

  console.log("")
  console.log("==============================================")
  console.log("🚀 Server SIOPOS berjalan")
  console.log("==============================================")
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