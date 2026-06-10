const http = require("http")
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

const server = http.createServer(app)

initSocket(server)

server.listen(PORT, HOST, () => {
  const localApiUrl = `http://localhost:${PORT}/api`
  const publicApiUrl = `http://${PUBLIC_HOST}:${PORT}/api`

  const localSwaggerUrl = `http://localhost:${PORT}/api-docs`
  const publicSwaggerUrl = `http://${PUBLIC_HOST}:${PORT}/api-docs`

  console.log("")
  console.log("==============================================")
  console.log("🚀 Server SIOPOS berjalan")
  console.log("==============================================")
  console.log(`Local API        : ${localApiUrl}`)
  console.log(`Public VPS API   : ${publicApiUrl}`)
  console.log(`Swagger Local    : ${localSwaggerUrl}`)
  console.log(`Swagger Public   : ${publicSwaggerUrl}`)
  console.log("==============================================")
  console.log("")
  console.log("📱 Untuk Flutter / HP fisik:")
  console.log(`Gunakan base URL : ${publicApiUrl}`)
  console.log("")
})