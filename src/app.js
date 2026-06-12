const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./docs/swagger")

const routes = require("./routes")

const {
  notFound,
  errorHandler
} = require("./middlewares/errorMiddleware")

const app = express()

/*
|--------------------------------------------------------------------------
| UPLOAD DIRECTORY
|--------------------------------------------------------------------------
| Struktur:
| project/
| ├── src/
| │   └── app.js
| └── uploads/
|     ├── stores/
|     └── products/
|--------------------------------------------------------------------------
*/
const uploadsDir = path.join(__dirname, "../uploads")
const storeUploadsDir = path.join(__dirname, "../uploads/stores")
const productUploadsDir = path.join(__dirname, "../uploads/products")

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

if (!fs.existsSync(storeUploadsDir)) {
  fs.mkdirSync(storeUploadsDir, { recursive: true })
}

if (!fs.existsSync(productUploadsDir)) {
  fs.mkdirSync(productUploadsDir, { recursive: true })
}

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true
  })
)

/*
|--------------------------------------------------------------------------
| LOGGER
|--------------------------------------------------------------------------
*/
app.use(morgan("dev"))

/*
|--------------------------------------------------------------------------
| BODY PARSER
|--------------------------------------------------------------------------
| Untuk JSON dan form biasa.
| Multipart/form-data ditangani multer di route.
|--------------------------------------------------------------------------
*/
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/*
|--------------------------------------------------------------------------
| STATIC FILE UPLOADS
|--------------------------------------------------------------------------
| Contoh URL:
| http://localhost:2000/uploads/products/foto.png
| http://IP_SERVER:2000/uploads/products/foto.png
|--------------------------------------------------------------------------
*/
app.use(
  "/uploads",
  express.static(uploadsDir, {
    fallthrough: false,
    maxAge: "7d"
  })
)

/*
|--------------------------------------------------------------------------
| SWAGGER DOCUMENTATION
|--------------------------------------------------------------------------
*/
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true
  })
)

/*
|--------------------------------------------------------------------------
| SECURITY HEADER
|--------------------------------------------------------------------------
| crossResourcePolicy dimatikan agar gambar upload bisa dibaca dari Flutter/Web.
|--------------------------------------------------------------------------
*/
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    crossResourcePolicy: false,
    originAgentCluster: false,
    hsts: false
  })
)

/*
|--------------------------------------------------------------------------
| API ROUTES
|--------------------------------------------------------------------------
*/
app.use("/api", routes)

/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/
app.get("/", (req, res) => {
  res.json({
    sukses: true,
    pesan: "Server SIOPOS berjalan",
    uploads: "/uploads",
    stores_uploads: "/uploads/stores",
    products_uploads: "/uploads/products",
    api: "/api",
    docs: "/api-docs"
  })
})

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/
app.use(notFound)
app.use(errorHandler)

module.exports = app