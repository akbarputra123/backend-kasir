const dashboardModel = require("./dashboard.model")

/*
|--------------------------------------------------------------------------
| SAFE LIMIT
|--------------------------------------------------------------------------
*/
const safeLimit = (limit = 5) => {
  const value = Number(limit)

  if (Number.isNaN(value) || value <= 0) {
    return 5
  }

  return Math.min(value, 50)
}

/*
|--------------------------------------------------------------------------
| TO NUMBER
|--------------------------------------------------------------------------
| Mengubah nilai DECIMAL MySQL dari string menjadi number.
|--------------------------------------------------------------------------
*/
const toNumber = (value) => {
  return Number(value || 0)
}

/*
|--------------------------------------------------------------------------
| NORMALIZE SUMMARY
|--------------------------------------------------------------------------
*/
const normalizeSummary = (summary = {}) => {
  return {
    ...summary,

    total_toko: Number(summary.total_toko || 0),
    total_user: Number(summary.total_user || 0),
    total_kategori: Number(summary.total_kategori || 0),
    total_diskon: Number(summary.total_diskon || 0),
    total_diskon_aktif: Number(summary.total_diskon_aktif || 0),
    total_produk: Number(summary.total_produk || 0),
    total_produk_aktif: Number(summary.total_produk_aktif || 0),
    total_produk_diskon: Number(summary.total_produk_diskon || 0),
    total_stok_menipis: Number(summary.total_stok_menipis || 0),

    transaksi_hari_ini: Number(summary.transaksi_hari_ini || 0),
    total_subtotal_hari_ini: toNumber(summary.total_subtotal_hari_ini),
    total_diskon_hari_ini: toNumber(summary.total_diskon_hari_ini),
    total_pajak_hari_ini: toNumber(summary.total_pajak_hari_ini),
    pendapatan_hari_ini: toNumber(summary.pendapatan_hari_ini),

    transaksi_bulan_ini: Number(summary.transaksi_bulan_ini || 0),
    total_subtotal_bulan_ini: toNumber(summary.total_subtotal_bulan_ini),
    total_diskon_bulan_ini: toNumber(summary.total_diskon_bulan_ini),
    total_pajak_bulan_ini: toNumber(summary.total_pajak_bulan_ini),
    pendapatan_bulan_ini: toNumber(summary.pendapatan_bulan_ini),

    total_produk_aktif: Number(summary.total_produk_aktif || 0),
    transaksi_saya_hari_ini: Number(summary.transaksi_saya_hari_ini || 0),
    total_subtotal_saya_hari_ini: toNumber(summary.total_subtotal_saya_hari_ini),
    total_diskon_saya_hari_ini: toNumber(summary.total_diskon_saya_hari_ini),
    total_pajak_saya_hari_ini: toNumber(summary.total_pajak_saya_hari_ini),
    pendapatan_saya_hari_ini: toNumber(summary.pendapatan_saya_hari_ini),
    transaksi_saya_batal_hari_ini: Number(summary.transaksi_saya_batal_hari_ini || 0)
  }
}

/*
|--------------------------------------------------------------------------
| NORMALIZE TOP PRODUCTS
|--------------------------------------------------------------------------
*/
const normalizeTopProducts = (rows = []) => {
  return rows.map((item) => ({
    ...item,
    id_product: Number(item.id_product || 0),
    total_terjual: Number(item.total_terjual || 0),
    total_pendapatan: toNumber(item.total_pendapatan),
    total_diskon: toNumber(item.total_diskon)
  }))
}

/*
|--------------------------------------------------------------------------
| NORMALIZE RECENT TRANSACTIONS
|--------------------------------------------------------------------------
*/
const normalizeRecentTransactions = (rows = []) => {
  return rows.map((item) => ({
    ...item,
    id_transaction: Number(item.id_transaction || 0),
    id_store: Number(item.id_store || 0),
    id_user: item.id_user ? Number(item.id_user) : null,
    total_item: Number(item.total_item || 0),
    total_qty: Number(item.total_qty || 0),
    subtotal: toNumber(item.subtotal),
    diskon: toNumber(item.diskon),
    pajak: toNumber(item.pajak),
    ppn_persen: toNumber(item.ppn_persen),
    grand_total: toNumber(item.grand_total)
  }))
}

/*
|--------------------------------------------------------------------------
| NORMALIZE LOW STOCK PRODUCTS
|--------------------------------------------------------------------------
*/
const normalizeLowStockProducts = (rows = []) => {
  return rows.map((item) => ({
    ...item,
    id_product: Number(item.id_product || 0),
    id_store: Number(item.id_store || 0),
    stok: Number(item.stok || 0),
    stok_minimum: Number(item.stok_minimum || 0)
  }))
}

/*
|--------------------------------------------------------------------------
| NORMALIZE SALES CHART
|--------------------------------------------------------------------------
*/
const normalizeSalesChart = (rows = []) => {
  return rows.map((item) => ({
    ...item,
    total_transaksi: Number(item.total_transaksi || 0),
    total_subtotal: toNumber(item.total_subtotal),
    total_diskon: toNumber(item.total_diskon),
    total_pajak: toNumber(item.total_pajak),
    total_pendapatan: toNumber(item.total_pendapatan)
  }))
}

/*
|--------------------------------------------------------------------------
| GET OWNER DASHBOARD
|--------------------------------------------------------------------------
*/
const getOwnerDashboard = async (currentUser, query) => {
  const limitTopProducts = safeLimit(query.limit_top_products || 5)
  const limitRecentTransactions = safeLimit(query.limit_recent_transactions || 5)
  const limitLowStock = safeLimit(query.limit_low_stock || 10)

  const summary = await dashboardModel.getOwnerSummary(currentUser.id_user)

  const topProducts = await dashboardModel.getOwnerTopProducts(
    currentUser.id_user,
    limitTopProducts
  )

  const recentTransactions = await dashboardModel.getOwnerRecentTransactions(
    currentUser.id_user,
    limitRecentTransactions
  )

  const lowStockProducts = await dashboardModel.getOwnerLowStockProducts(
    currentUser.id_user,
    limitLowStock
  )

  const salesChart = await dashboardModel.getOwnerSalesChart(
    currentUser.id_user
  )

  return {
    role: "owner",
    summary: normalizeSummary(summary),
    top_products: normalizeTopProducts(topProducts),
    recent_transactions: normalizeRecentTransactions(recentTransactions),
    low_stock_products: normalizeLowStockProducts(lowStockProducts),
    sales_chart: normalizeSalesChart(salesChart)
  }
}

/*
|--------------------------------------------------------------------------
| GET ADMIN DASHBOARD
|--------------------------------------------------------------------------
*/
const getAdminDashboard = async (currentUser, query) => {
  if (!currentUser.id_store) {
    throw new Error("Admin belum terhubung dengan toko")
  }

  const limitTopProducts = safeLimit(query.limit_top_products || 5)
  const limitRecentTransactions = safeLimit(query.limit_recent_transactions || 5)
  const limitLowStock = safeLimit(query.limit_low_stock || 10)

  const summary = await dashboardModel.getStoreSummary(currentUser.id_store)

  const topProducts = await dashboardModel.getStoreTopProducts(
    currentUser.id_store,
    limitTopProducts
  )

  const recentTransactions = await dashboardModel.getStoreRecentTransactions(
    currentUser.id_store,
    limitRecentTransactions
  )

  const lowStockProducts = await dashboardModel.getStoreLowStockProducts(
    currentUser.id_store,
    limitLowStock
  )

  const salesChart = await dashboardModel.getStoreSalesChart(
    currentUser.id_store
  )

  return {
    role: "admin",
    id_store: Number(currentUser.id_store),
    summary: normalizeSummary(summary),
    top_products: normalizeTopProducts(topProducts),
    recent_transactions: normalizeRecentTransactions(recentTransactions),
    low_stock_products: normalizeLowStockProducts(lowStockProducts),
    sales_chart: normalizeSalesChart(salesChart)
  }
}

/*
|--------------------------------------------------------------------------
| GET CASHIER DASHBOARD
|--------------------------------------------------------------------------
*/
const getCashierDashboard = async (currentUser, query) => {
  if (!currentUser.id_store) {
    throw new Error("Kasir belum terhubung dengan toko")
  }

  const limitRecentTransactions = safeLimit(query.limit_recent_transactions || 5)

  const summary = await dashboardModel.getCashierSummary(
    currentUser.id_store,
    currentUser.id_user
  )

  const recentTransactions = await dashboardModel.getCashierRecentTransactions(
    currentUser.id_store,
    currentUser.id_user,
    limitRecentTransactions
  )

  return {
    role: "kasir",
    id_store: Number(currentUser.id_store),
    summary: normalizeSummary(summary),
    recent_transactions: normalizeRecentTransactions(recentTransactions)
  }
}

/*
|--------------------------------------------------------------------------
| GET DASHBOARD
|--------------------------------------------------------------------------
*/
const getDashboard = async (currentUser, query = {}) => {
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (currentUser.role === "owner") {
    return await getOwnerDashboard(currentUser, query)
  }

  if (currentUser.role === "admin") {
    return await getAdminDashboard(currentUser, query)
  }

  if (currentUser.role === "kasir") {
    return await getCashierDashboard(currentUser, query)
  }

  throw new Error("Role tidak memiliki akses dashboard")
}

module.exports = {
  getDashboard
}