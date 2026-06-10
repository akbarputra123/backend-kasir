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
| - jaringan WiFi / LAN
| - HP fisik yang satu WiFi dengan laptop/PC
|--------------------------------------------------------------------------
*/
const HOST = "0.0.0.0"

const server = http.createServer(app)

initSocket(server)

/*
|--------------------------------------------------------------------------
| CEK PRIVATE IP
|--------------------------------------------------------------------------
| IP private biasanya:
| - 192.168.x.x
| - 10.x.x.x
| - 172.16.x.x sampai 172.31.x.x
|--------------------------------------------------------------------------
*/
const isPrivateIp = (ip) => {
  return (
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
  )
}

/*
|--------------------------------------------------------------------------
| GET LOCAL NETWORK IP / WIFI IP
|--------------------------------------------------------------------------
| Mengambil IP jaringan lokal agar API bisa diakses dari HP fisik.
| Contoh hasil:
| http://192.168.1.10:5000/api
|--------------------------------------------------------------------------
*/
const getLocalNetworkIp = () => {
  const interfaces = os.networkInterfaces()

  const preferredNames = [
    "Wi-Fi",
    "WLAN",
    "Wireless",
    "Ethernet",
    "Local Area Connection"
  ]

  const availableIps = []

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      const isIPv4 = net.family === "IPv4"
      const isNotInternal = !net.internal
      const isPrivate = isPrivateIp(net.address)

      if (isIPv4 && isNotInternal && isPrivate) {
        availableIps.push({
          name,
          address: net.address
        })
      }
    }
  }

  if (availableIps.length === 0) {
    return "localhost"
  }

  const preferredIp = availableIps.find((item) =>
    preferredNames.some((keyword) =>
      item.name.toLowerCase().includes(keyword.toLowerCase())
    )
  )

  return preferredIp ? preferredIp.address : availableIps[0].address
}

server.listen(PORT, HOST, () => {
  const localIp = getLocalNetworkIp()

  console.log("")
  console.log("==============================================")
  console.log("🚀 Server SIOPOS berjalan")
  console.log("==============================================")
  console.log(`Local API       : http://localhost:${PORT}/api`)
  console.log(`Network API     : http://${localIp}:${PORT}/api`)
  console.log(`Swagger Local   : http://localhost:${PORT}/api-docs`)
  console.log(`Swagger Network : http://${localIp}:${PORT}/api-docs`)
  console.log("==============================================")
  console.log("")
  console.log("📱 Untuk HP fisik:")
  console.log(`Gunakan base URL: http://${localIp}:${PORT}/api`)
  console.log("")
})