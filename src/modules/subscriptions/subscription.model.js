const pool = require("../../config/database");

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
  );
  return rows;
};

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
  );
  return rows[0] || null;
};

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
      s.jumlah_bulan,
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
  );
  return rows[0] || null;
};

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
      s.jumlah_bulan,
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
  );
  return rows[0] || null;
};

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
      jumlah_bulan,
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
  );
  return rows[0] || null;
};

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
      s.jumlah_bulan,
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
  );
  return rows[0] || null;
};

/*
|--------------------------------------------------------------------------
| GET OWNER ID BY USER
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
  );
  const user = rows[0] || null;
  if (!user) return null;
  if (user.role === "owner") return user.id_user;
  return user.id_owner || null;
};

/*
|--------------------------------------------------------------------------
| GENERATE INVOICE CODE
|--------------------------------------------------------------------------
*/
const generateInvoiceCode = async () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-SIOPOS-${yyyy}${mm}${dd}-${random}`;
};

/*
|--------------------------------------------------------------------------
| CREATE SUBSCRIPTION CHECKOUT (dengan jumlah_bulan)
|--------------------------------------------------------------------------
*/
const createCheckout = async (data) => {
  const {
    id_owner,
    id_plan,
    jumlah_bulan = 1,
    metode_pembayaran = "manual_transfer",
    catatan = null,
  } = data;

  const plan = await findPlanById(id_plan);

  if (!plan) {
    throw new Error("Plan tidak ditemukan");
  }

  if (plan.status_paket !== "aktif") {
    throw new Error("Plan tidak aktif");
  }

  const subtotal = Number(plan.harga) * Number(jumlah_bulan);
  const diskonPersen = jumlah_bulan === 12 ? 10 : 0;
  const diskon = subtotal * (diskonPersen / 100);
  const totalHarga = subtotal - diskon;
  const kodeInvoice = await generateInvoiceCode();

  const [result] = await pool.query(
    `
    INSERT INTO subscriptions
    (
      id_owner, id_plan, jenis, parent_subscription,
      jumlah_bulan, kode_invoice, harga,
      status_langganan, metode_pembayaran, catatan
    )
    VALUES
    ( ?, ?, 'checkout', NULL, ?, ?, ?, 'pending', ?, ? )
    `,
    [id_owner, id_plan, jumlah_bulan, kodeInvoice, totalHarga, metode_pembayaran, catatan]
  );

  return {
    id_subscription: result.insertId,
    id_owner,
    id_plan,
    jenis: "checkout",
    parent_subscription: null,
    jumlah_bulan,
    kode_invoice: kodeInvoice,
    subtotal,
    diskon_persen: diskonPersen,
    diskon,
    harga: totalHarga,
    status_langganan: "pending",
    metode_pembayaran,
  };
};

/*
|--------------------------------------------------------------------------
| ACTIVATE SUBSCRIPTION
|--------------------------------------------------------------------------
*/
const activateSubscription = async (id_subscription) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
      SELECT
        s.id_subscription,
        s.id_owner,
        s.id_plan,
        s.jumlah_bulan,
        s.harga,
        s.status_langganan,
        s.jenis,
        s.parent_subscription,
        p.durasi_hari
      FROM subscriptions s
      JOIN subscription_plans p ON p.id_plan = s.id_plan
      WHERE s.id_subscription = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id_subscription]
    );

    const subscription = rows[0];
    if (!subscription) throw new Error("Subscription tidak ditemukan");
    if (subscription.status_langganan === "aktif") throw new Error("Subscription sudah aktif");
    if (subscription.status_langganan === "dibatalkan") throw new Error("Subscription sudah dibatalkan");

    const totalHari = subscription.durasi_hari * subscription.jumlah_bulan;

    if (subscription.jenis === "extend") {
      await connection.query(
        `
        UPDATE subscriptions
        SET
          tanggal_berakhir = DATE_ADD(tanggal_berakhir, INTERVAL ? DAY),
          jumlah_bulan = jumlah_bulan + ?,
          harga = harga + ?
        WHERE id_subscription = ?
        `,
        [totalHari, subscription.jumlah_bulan, subscription.harga, subscription.parent_subscription]
      );

      await connection.query(
        `
        UPDATE subscriptions
        SET status_langganan = 'aktif', tanggal_mulai = NOW(), tanggal_berakhir = NOW()
        WHERE id_subscription = ?
        `,
        [id_subscription]
      );

      await connection.commit();
      return { id_subscription, status_langganan: "aktif", is_extend: true };
    }

    // CHECKOUT & UPGRADE
    await connection.query(
      `
      UPDATE subscriptions
      SET tanggal_mulai = NOW(),
          tanggal_berakhir = DATE_ADD(NOW(), INTERVAL ? DAY),
          status_langganan = 'aktif'
      WHERE id_subscription = ?
      `,
      [totalHari, id_subscription]
    );

    await connection.query(
      `
      UPDATE subscriptions
      SET status_langganan = 'expired'
      WHERE id_owner = ?
        AND status_langganan = 'aktif'
        AND id_subscription <> ?
      `,
      [subscription.id_owner, id_subscription]
    );

    await connection.commit();
    return { id_subscription, status_langganan: "aktif" };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/*
|--------------------------------------------------------------------------
| CANCEL SUBSCRIPTION
|--------------------------------------------------------------------------
*/
const cancelSubscription = async (id_subscription, catatan = null) => {
  const [result] = await pool.query(
    `
    UPDATE subscriptions
    SET status_langganan = 'dibatalkan', catatan = ?
    WHERE id_subscription = ? AND status_langganan = 'pending'
    `,
    [catatan || "Subscription dibatalkan", id_subscription]
  );
  return result.affectedRows > 0;
};

/*
|--------------------------------------------------------------------------
| EXPIRE OLD SUBSCRIPTIONS
|--------------------------------------------------------------------------
*/
const expireOldSubscriptions = async () => {
  const [result] = await pool.query(
    `
    UPDATE subscriptions
    SET status_langganan = 'expired'
    WHERE status_langganan = 'aktif' AND tanggal_berakhir < NOW()
    `
  );
  return result.affectedRows;
};

/*
|--------------------------------------------------------------------------
| EXPIRE ALL ACTIVE SUBSCRIPTIONS FOR OWNER (EXCEPT ONE)
|--------------------------------------------------------------------------
*/
const expireAllActiveSubscriptionsForOwner = async (id_owner, excludeId) => {
  const [result] = await pool.query(
    `
    UPDATE subscriptions
    SET status_langganan = 'expired'
    WHERE id_owner = ? AND status_langganan = 'aktif' AND id_subscription != ?
    `,
    [id_owner, excludeId]
  );
  return result.affectedRows;
};

/*
|--------------------------------------------------------------------------
| UPGRADE SUBSCRIPTION
|--------------------------------------------------------------------------
*/
const upgradeSubscription = async (id_subscription, newPlanId, newJumlahBulan) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [subRows] = await connection.query(
      `
      SELECT id_subscription, id_owner, status_langganan
      FROM subscriptions
      WHERE id_subscription = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id_subscription]
    );

    const subscription = subRows[0];
    if (!subscription) throw new Error("Subscription tidak ditemukan");
    if (subscription.status_langganan !== "aktif") throw new Error("Hanya subscription aktif yang bisa di-upgrade");

    const [pendingRows] = await connection.query(
      `
      SELECT id_subscription
      FROM subscriptions
      WHERE id_owner = ? AND status_langganan = 'pending'
      LIMIT 1
      `,
      [subscription.id_owner]
    );
    if (pendingRows.length > 0) throw new Error("Masih ada invoice langganan yang pending");

    const newPlan = await findPlanById(newPlanId);
    if (!newPlan) throw new Error("Plan baru tidak ditemukan");
    if (newPlan.status_paket !== "aktif") throw new Error("Plan baru tidak aktif");

    const subtotal = Number(newPlan.harga) * Number(newJumlahBulan);
    const diskonPersen = Number(newJumlahBulan) === 12 ? 10 : 0;
    const diskon = subtotal * (diskonPersen / 100);
    const totalHarga = subtotal - diskon;
    const kodeInvoice = await generateInvoiceCode();

    const [result] = await connection.query(
      `
      INSERT INTO subscriptions
      (id_owner, id_plan, jenis, parent_subscription, jumlah_bulan, kode_invoice, harga, status_langganan, metode_pembayaran, catatan)
      VALUES (?, ?, 'upgrade', ?, ?, ?, ?, 'pending', 'manual_transfer', ?)
      `,
      [subscription.id_owner, newPlanId, id_subscription, newJumlahBulan, kodeInvoice, totalHarga, `Upgrade ke paket ${newPlan.nama_paket}`]
    );

    await connection.commit();

    return {
      id_subscription: result.insertId,
      id_owner: subscription.id_owner,
      id_plan: newPlanId,
      jenis: "upgrade",
      parent_subscription: id_subscription,
      jumlah_bulan: newJumlahBulan,
      kode_invoice: kodeInvoice,
      subtotal,
      diskon_persen: diskonPersen,
      diskon,
      harga: totalHarga,
      status_langganan: "pending",
      metode_pembayaran: "manual_transfer",
      is_upgrade: true,
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/*
|--------------------------------------------------------------------------
| EXTEND SUBSCRIPTION
|--------------------------------------------------------------------------
*/
const extendSubscription = async (id_subscription, additionalMonths, catatan = null) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
      SELECT
        s.id_subscription,
        s.id_owner,
        s.id_plan,
        s.status_langganan,
        s.tanggal_berakhir,
        p.nama_paket,
        p.harga AS harga_plan
      FROM subscriptions s
      JOIN subscription_plans p ON p.id_plan = s.id_plan
      WHERE s.id_subscription = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id_subscription]
    );

    const subscription = rows[0];
    if (!subscription) throw new Error("Subscription tidak ditemukan");
    if (subscription.status_langganan !== "aktif") throw new Error("Hanya subscription aktif yang dapat diperpanjang");
    if (subscription.tanggal_berakhir < new Date()) throw new Error("Subscription sudah expired");

    const [pendingRows] = await connection.query(
      `
      SELECT id_subscription
      FROM subscriptions
      WHERE id_owner = ? AND status_langganan = 'pending'
      LIMIT 1
      `,
      [subscription.id_owner]
    );
    if (pendingRows.length > 0) throw new Error("Masih ada invoice langganan yang pending");

    const subtotal = Number(subscription.harga_plan) * Number(additionalMonths);
    const diskonPersen = Number(additionalMonths) === 12 ? 10 : 0;
    const diskon = subtotal * (diskonPersen / 100);
    const totalHarga = subtotal - diskon;
    const kodeInvoice = await generateInvoiceCode();

    const [result] = await connection.query(
      `
      INSERT INTO subscriptions
      (id_owner, id_plan, jenis, parent_subscription, jumlah_bulan, kode_invoice, harga, status_langganan, metode_pembayaran, catatan)
      VALUES (?, ?, 'extend', ?, ?, ?, ?, 'pending', 'manual_transfer', ?)
      `,
      [
        subscription.id_owner,
        subscription.id_plan,
        id_subscription,
        additionalMonths,
        kodeInvoice,
        totalHarga,
        catatan ?? `Perpanjangan paket ${subscription.nama_paket} selama ${additionalMonths} bulan`
      ]
    );

    await connection.commit();

    return {
      id_subscription: result.insertId,
      id_owner: subscription.id_owner,
      id_plan: subscription.id_plan,
      jenis: "extend",
      parent_subscription: id_subscription,
      jumlah_bulan: additionalMonths,
      kode_invoice: kodeInvoice,
      subtotal,
      diskon_persen: diskonPersen,
      diskon,
      harga: totalHarga,
      status_langganan: "pending",
      metode_pembayaran: "manual_transfer",
      is_extend: true,
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/*
|--------------------------------------------------------------------------
| FIND ALL SUBSCRIPTIONS (by owner or all)
|--------------------------------------------------------------------------
*/
const findAllByOwner = async (id_owner = null) => {
  let whereClause = "";
  const params = [];
  if (id_owner !== null) {
    whereClause = "WHERE s.id_owner = ?";
    params.push(id_owner);
  }

  const query = `
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
      s.jumlah_bulan,
      s.kode_invoice,
      s.tanggal_mulai,
      s.tanggal_berakhir,
      s.harga,
      s.status_langganan,
      s.metode_pembayaran,
      s.bukti_pembayaran,
      s.catatan,
      s.created_at,
      s.updated_at,
      DATEDIFF(s.tanggal_berakhir, NOW()) AS sisa_hari
    FROM subscriptions s
    JOIN users u ON s.id_owner = u.id_user
    JOIN subscription_plans p ON s.id_plan = p.id_plan
    ${whereClause}
    ORDER BY s.created_at DESC
  `;

  const [rows] = await pool.query(query, params);
  return rows;
};

/*
|--------------------------------------------------------------------------
| FIND SUBSCRIPTION BY INVOICE
|--------------------------------------------------------------------------
*/
const findByInvoice = async (kode_invoice) => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id_subscription,
      s.id_owner,
      s.id_plan,
      p.nama_paket,
      s.jumlah_bulan,
      s.kode_invoice,
      s.tanggal_mulai,
      s.tanggal_berakhir,
      s.harga,
      s.status_langganan,
      s.metode_pembayaran,
      s.bukti_pembayaran,
      s.catatan,
      s.created_at
    FROM subscriptions s
    JOIN subscription_plans p ON s.id_plan = p.id_plan
    WHERE s.kode_invoice = ?
    LIMIT 1
    `,
    [kode_invoice]
  );
  return rows[0] || null;
};

/*
|--------------------------------------------------------------------------
| FIND ALL SUBSCRIPTIONS (for super admin)
|--------------------------------------------------------------------------
*/
const findAll = async (options = {}) => {
  const { limit = 10, offset = 0, status = null } = options;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (status) {
    whereClause += ' AND s.status_langganan = ?';
    params.push(status);
  }

  const query = `
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
      s.jumlah_bulan,
      s.kode_invoice,
      s.tanggal_mulai,
      s.tanggal_berakhir,
      s.harga,
      s.status_langganan,
      s.metode_pembayaran,
      s.bukti_pembayaran,
      s.catatan,
      s.created_at,
      s.updated_at,
      DATEDIFF(s.tanggal_berakhir, NOW()) AS sisa_hari
    FROM subscriptions s
    JOIN users u ON s.id_owner = u.id_user
    JOIN subscription_plans p ON s.id_plan = p.id_plan
    ${whereClause}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM subscriptions s
    ${whereClause}
  `;

  const [rows] = await pool.query(query, [...params, limit, offset]);
  const [countRows] = await pool.query(countQuery, params);

  return {
    subscriptions: rows,
    total: countRows[0]?.total || 0,
  };
};

/*
|--------------------------------------------------------------------------
| DELETE SUBSCRIPTION
|--------------------------------------------------------------------------
*/
const deleteSubscription = async (id_subscription) => {
  const [result] = await pool.query(
    `
    DELETE FROM subscriptions
    WHERE id_subscription = ? AND status_langganan IN ('pending','dibatalkan')
    `,
    [id_subscription]
  );
  return result.affectedRows > 0;
};

// ============================================================
// FUNGSI UNTUK NOTIFIKASI OTOMATIS (CRON)
// ============================================================

/**
 * Ambil subscription aktif yang akan kadaluwarsa dalam `days` hari ke depan.
 */
const findSubscriptionsExpiringSoon = async (days = 7) => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id_subscription,
      s.id_owner,
      s.id_plan,
      p.nama_paket,
      p.durasi_hari,
      s.jumlah_bulan,
      s.kode_invoice,
      s.tanggal_mulai,
      s.tanggal_berakhir,
      s.status_langganan,
      s.harga
    FROM subscriptions s
    JOIN subscription_plans p ON p.id_plan = s.id_plan
    WHERE s.status_langganan = 'aktif'
      AND s.tanggal_berakhir > NOW()
      AND s.tanggal_berakhir <= DATE_ADD(NOW(), INTERVAL ? DAY)
    ORDER BY s.tanggal_berakhir ASC
    `,
    [days]
  );
  return rows;
};

/**
 * Ambil subscription aktif yang sudah kadaluwarsa (tanggal_berakhir <= NOW()).
 */
const findSubscriptionsExpired = async () => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id_subscription,
      s.id_owner,
      s.id_plan,
      p.nama_paket,
      s.kode_invoice,
      s.tanggal_mulai,
      s.tanggal_berakhir,
      s.status_langganan,
      s.harga
    FROM subscriptions s
    JOIN subscription_plans p ON p.id_plan = s.id_plan
    WHERE s.status_langganan = 'aktif'
      AND s.tanggal_berakhir <= NOW()
    ORDER BY s.tanggal_berakhir ASC
    `
  );
  return rows;
};

/**
 * Update status subscription menjadi 'expired' (hanya jika benar-benar expired).
 */
const markSubscriptionExpired = async (idSubscription) => {
  const [result] = await pool.query(
    `
    UPDATE subscriptions
    SET status_langganan = 'expired', updated_at = NOW()
    WHERE id_subscription = ?
      AND status_langganan = 'aktif'
      AND tanggal_berakhir <= NOW()
    `,
    [idSubscription]
  );
  return result.affectedRows > 0;
};

// ============================================================
// EXPORT
// ============================================================

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
  deleteSubscription,
  expireOldSubscriptions,
  expireAllActiveSubscriptionsForOwner,
  upgradeSubscription,
  extendSubscription,
  findAllByOwner,
  findByInvoice,
  findAll,
  // FUNGSI BARU UNTUK NOTIFIKASI
  findSubscriptionsExpiringSoon,
  findSubscriptionsExpired,
  markSubscriptionExpired,
};