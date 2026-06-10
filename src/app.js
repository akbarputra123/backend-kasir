const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
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
| CORS
|--------------------------------------------------------------------------
| Kalau CLIENT_URL belum diisi, origin dibuat true agar Swagger/API
| tetap bisa diakses dari IP VPS saat development/testing.
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
*/
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/*
|--------------------------------------------------------------------------
| STATIC FILE
|--------------------------------------------------------------------------
*/
app.use("/uploads", express.static("uploads"))

/*
|--------------------------------------------------------------------------
| SWAGGER DOCUMENTATION
|--------------------------------------------------------------------------
| Swagger diletakkan sebelum helmet agar file CSS/JS Swagger tidak
| diblokir oleh security header saat akses via HTTP IP VPS.
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
| Karena kamu masih akses pakai HTTP + IP VPS, beberapa header helmet
| dimatikan agar Swagger tidak memaksa/mengacaukan HTTPS.
|--------------------------------------------------------------------------
*/
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
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
| ERROR HANDLER
|--------------------------------------------------------------------------
*/
app.use(notFound)
app.use(errorHandler)

module.exports = app