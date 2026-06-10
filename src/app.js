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

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
)

app.use(helmet())
app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/uploads", express.static("uploads"))
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.use("/api", routes)

app.use(notFound)
app.use(errorHandler)

module.exports = app