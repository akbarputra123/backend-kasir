const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| FIND ACTIVE PLANS
|--------------------------------------------------------------------------
*/
const findActivePlans = async () => {
  const [rows] = await pool.query(
    `
    SELECT
      id_plan,
      nama_paket,
      deskripsi,
      durasi_hari,
      harga,
      batas_toko,
      batas_user,
      batas_produk,
      status_paket,
      created_at,
      updated_at
    FROM subscription_plans
    WHERE status_paket = 'aktif'
    ORDER BY harga ASC
    `
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND PLAN BY ID
|--------------------------------------------------------------------------
*/
const findPlanById = async (id_plan) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_plan,
      nama_paket,
      deskripsi,
      durasi_hari,
      harga,
      batas_toko,
      batas_user,
      batas_produk,
      status_paket,
      created_at,
      updated_at
    FROM subscription_plans
    WHERE id_plan = ?
    LIMIT 1
    `,
    [id_plan]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND LATEST SUBSCRIPTION BY OWNER
|--------------------------------------------------------------------------
*/
const findLatestByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id_subscription,
      s.id_owner,
      u.nama_lengkap AS nama_owner,
      s.id_plan,
      p.nama_paket,
      p.durasi_hari,
      p.batas_toko,
      p.batas_user,
      p.batas_produk,
      s.kode_invoice,
      s.tanggal_mulai,
      s.tanggal_berakhir,
      s.harga,
      s.status_langganan,
      s.metode_pembayaran,
      s.bukti_pembayaran,
      s.catatan,
      s.created_at,
      s.updated_at
    FROM subscriptions s
    JOIN users u ON s.id_owner = u.id_user
    JOIN subscription_plans p ON s.id_plan = p.id_plan
    WHERE s.id_owner = ?
    ORDER BY s.id_subscription DESC
    LIMIT 1
    `,
    [id_owner]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND ACTIVE SUBSCRIPTION BY OWNER
|--------------------------------------------------------------------------
*/
const findActiveByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id_subscription,
      s.id_owner,
      s.id_plan,
      p.nama_paket,
      p.durasi_hari,
      p.batas_toko,
      p.batas_user,
      p.batas_produk,
      s.kode_invoice,
      s.tanggal_mulai,
      s.tanggal_berakhir,
      s.harga,
      s.status_langganan,
      s.metode_pembayaran,
      s.created_at,
      s.updated_at
    FROM subscriptions s
    JOIN subscription_plans p ON s.id_plan = p.id_plan
    WHERE s.id_owner = ?
      AND s.status_langganan = 'aktif'
      AND s.tanggal_berakhir >= NOW()
    ORDER BY s.tanggal_berakhir DESC
    LIMIT 1
    `,
    [id_owner]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND PENDING SUBSCRIPTION BY OWNER
|--------------------------------------------------------------------------
*/
const findPendingByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_subscription,
      id_owner,
      id_plan,
      kode_invoice,
      harga,
      status_langganan,
      metode_pembayaran,
      created_at
    FROM subscriptions
    WHERE id_owner = ?
      AND status_langganan = 'pending'
    ORDER BY id_subscription DESC
    LIMIT 1
    `,
    [id_owner]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND SUBSCRIPTION BY ID
|--------------------------------------------------------------------------
*/
const findById = async (id_subscription) => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id_subscription,
      s.id_owner,
      u.nama_lengkap AS nama_owner,
      s.id_plan,
      p.nama_paket,
      p.durasi_hari,
      p.batas_toko,
      p.batas_user,
      p.batas_produk,
      s.kode_invoice,
      s.tanggal_mulai,
      s.tanggal_berakhir,
      s.harga,
      s.status_langganan,
      s.metode_pembayaran,
      s.bukti_pembayaran,
      s.catatan,
      s.created_at,
      s.updated_at
    FROM subscriptions s
    JOIN users u ON s.id_owner = u.id_user
    JOIN subscription_plans p ON s.id_plan = p.id_plan
    WHERE s.id_subscription = ?
    LIMIT 1
    `,
    [id_subscription]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| GET OWNER ID BY USER
|--------------------------------------------------------------------------
| Untuk admin/kasir, cari owner dari toko user tersebut.
|--------------------------------------------------------------------------
*/
const getOwnerIdByUser = async (id_user) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,
      u.role,
      s.id_owner
    FROM users u
    LEFT JOIN stores s ON u.id_store = s.id_store
    WHERE u.id_user = ?
    LIMIT 1
    `,
    [id_user]
  )

  const user = rows[0] || null

  if (!user) {
    return null
  }

  if (user.role === "owner") {
    return user.id_user
  }

  return user.id_owner || null
}

/*
|--------------------------------------------------------------------------
| GENERATE INVOICE CODE
|--------------------------------------------------------------------------
*/
const generateInvoiceCode = async () => {
  const date = new Date()
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const random = Math.floor(1000 + Math.random() * 9000)

  return `INV-SIOPOS-${yyyy}${mm}${dd}-${random}`
}

/*
|--------------------------------------------------------------------------
| CREATE SUBSCRIPTION CHECKOUT
|--------------------------------------------------------------------------
*/
const createCheckout = async (data) => {
  const kodeInvoice = await generateInvoiceCode()

  const [result] = await pool.query(
    `
    INSERT INTO subscriptions
    (
      id_owner,
      id_plan,
      kode_invoice,
      harga,
      status_langganan,
      metode_pembayaran,
      catatan
    )
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `,
    [
      data.id_owner,
      data.id_plan,
      kodeInvoice,
      data.harga,
      data.metode_pembayaran || "manual_transfer",
      data.catatan || null
    ]
  )

  return {
    id_subscription: result.insertId,
    id_owner: data.id_owner,
    id_plan: data.id_plan,
    kode_invoice: kodeInvoice,
    harga: data.harga,
    status_langganan: "pending",
    metode_pembayaran: data.metode_pembayaran || "manual_transfer"
  }
}

/*
|--------------------------------------------------------------------------
| ACTIVATE SUBSCRIPTION
|--------------------------------------------------------------------------
*/
const activateSubscription = async (id_subscription) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [rows] = await connection.query(
      `
      SELECT
        s.id_subscription,
        s.id_owner,
        s.id_plan,
        s.status_langganan,
        p.durasi_hari
      FROM subscriptions s
      JOIN subscription_plans p ON s.id_plan = p.id_plan
      WHERE s.id_subscription = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id_subscription]
    )

    const subscription = rows[0] || null

    if (!subscription) {
      throw new Error("Subscription tidak ditemukan")
    }

    if (subscription.status_langganan === "aktif") {
      throw new Error("Subscription sudah aktif")
    }

    if (subscription.status_langganan === "dibatalkan") {
      throw new Error("Subscription sudah dibatalkan")
    }

    await connection.query(
      `
      UPDATE subscriptions
      SET
        tanggal_mulai = NOW(),
        tanggal_berakhir = DATE_ADD(NOW(), INTERVAL ? DAY),
        status_langganan = 'aktif'
      WHERE id_subscription = ?
      `,
      [
        subscription.durasi_hari,
        id_subscription
      ]
    )

    await connection.commit()

    return {
      id_subscription: Number(id_subscription),
      status_langganan: "aktif"
    }
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| CANCEL SUBSCRIPTION
|--------------------------------------------------------------------------
*/
const cancelSubscription = async (id_subscription, catatan = null) => {
  const [result] = await pool.query(
    `
    UPDATE subscriptions
    SET
      status_langganan = 'dibatalkan',
      catatan = ?
    WHERE id_subscription = ?
      AND status_langganan = 'pending'
    `,
    [
      catatan || "Subscription dibatalkan",
      id_subscription
    ]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| EXPIRE OLD SUBSCRIPTIONS
|--------------------------------------------------------------------------
| Menandai langganan aktif yang sudah lewat tanggal berakhir.
|--------------------------------------------------------------------------
*/
const expireOldSubscriptions = async () => {
  const [result] = await pool.query(
    `
    UPDATE subscriptions
    SET status_langganan = 'expired'
    WHERE status_langganan = 'aktif'
      AND tanggal_berakhir < NOW()
    `
  )

  return result.affectedRows
}

module.exports = {
  findActivePlans,
  findPlanById,
  findLatestByOwner,
  findActiveByOwner,
  findPendingByOwner,
  findById,
  getOwnerIdByUser,
  createCheckout,
  activateSubscription,
  cancelSubscription,
  expireOldSubscriptions
}