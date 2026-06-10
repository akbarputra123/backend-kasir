const express = require("express")
const authRoutes = require("../modules/auth/auth.routes")
const userRoutes = require("../modules/users/user.routes")
const storeRoutes = require("../modules/stores/store.routes")
const categoryRoutes = require("../modules/categories/category.routes")
const productRoutes = require("../modules/products/product.routes")
const stockLogRoutes = require("../modules/stockLogs/stockLog.routes")
const transactionRoutes = require("../modules/transactions/transaction.routes")
const reportRoutes = require("../modules/reports/report.routes")
const dashboardRoutes = require("../modules/dashboard/dashboard.routes")
const receiptRoutes = require("../modules/receipts/receipt.routes")
const subscriptionRoutes = require("../modules/subscriptions/subscription.routes")
const discountRoutes = require("../modules/discounts/discount.routes")
const router = express.Router()

/**
 * @swagger
 * /:
 *   get:
 *     summary: Cek status API SIOPOS
 *     description: Endpoint untuk memastikan API SIOPOS berjalan dengan baik.
 *     tags:
 *       - Health Check
 *     responses:
 *       200:
 *         description: API berjalan dengan baik
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sukses:
 *                   type: boolean
 *                   example: true
 *                 pesan:
 *                   type: string
 *                   example: API SIOPOS berjalan dengan baik
 *                 aplikasi:
 *                   type: string
 *                   example: SIOPOS
 *                 versi:
 *                   type: string
 *                   example: 1.0.0
 */
router.get("/", (req, res) => {
  res.json({
    sukses: true,
    pesan: "API SIOPOS berjalan dengan baik",
    aplikasi: "SIOPOS",
    versi: "1.0.0"
  })
})

router.use("/auth", authRoutes)
router.use("/users", userRoutes)
router.use("/stores", storeRoutes)
router.use("/categories", categoryRoutes)
router.use("/products", productRoutes)
router.use("/stock-logs", stockLogRoutes)
router.use("/transactions", transactionRoutes)
router.use("/reports", reportRoutes)
router.use("/dashboard", dashboardRoutes)
router.use("/receipts", receiptRoutes)
router.use("/subscriptions", subscriptionRoutes)
router.use("/discounts", discountRoutes)

module.exports = router