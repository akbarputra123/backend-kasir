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
  const { id_owner, id_plan, jumlah_bulan = 1, metode_pembayaran = "manual_transfer", catatan = null } = data;

  // Ambil data plan untuk menghitung harga total
  const plan = await findPlanById(id_plan);
  if (!plan) throw new Error("Plan tidak ditemukan");
  if (plan.status_paket !== "aktif") throw new Error("Plan tidak aktif");

  const totalHarga = plan.harga * jumlah_bulan;
  const kodeInvoice = await generateInvoiceCode();

  const [result] = await pool.query(
    `
    INSERT INTO subscriptions
    (
      id_owner,
      id_plan,
      jumlah_bulan,
      kode_invoice,
      harga,
      status_langganan,
      metode_pembayaran,
      catatan
    )
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `,
    [id_owner, id_plan, jumlah_bulan, kodeInvoice, totalHarga, metode_pembayaran, catatan]
  );

  return {
    id_subscription: result.insertId,
    id_owner,
    id_plan,
    jumlah_bulan,
    kode_invoice: kodeInvoice,
    harga: totalHarga,
    status_langganan: "pending",
    metode_pembayaran,
  };
};

/*
|--------------------------------------------------------------------------
| ACTIVATE SUBSCRIPTION (menggunakan jumlah_bulan untuk durasi)
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
        s.status_langganan,
        p.durasi_hari
      FROM subscriptions s
      JOIN subscription_plans p ON s.id_plan = p.id_plan
      WHERE s.id_subscription = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id_subscription]
    );

    const subscription = rows[0] || null;
    if (!subscription) throw new Error("Subscription tidak ditemukan");
    if (subscription.status_langganan === "aktif") throw new Error("Subscription sudah aktif");
    if (subscription.status_langganan === "dibatalkan") throw new Error("Subscription sudah dibatalkan");

    // Hitung total hari dari durasi_hari * jumlah_bulan
    const totalHari = subscription.durasi_hari * subscription.jumlah_bulan;

    await connection.query(
      `
      UPDATE subscriptions
      SET
        tanggal_mulai = NOW(),
        tanggal_berakhir = DATE_ADD(NOW(), INTERVAL ? DAY),
        status_langganan = 'aktif'
      WHERE id_subscription = ?
      `,
      [totalHari, id_subscription]
    );

    // Expire semua subscription aktif lainnya milik owner yang sama
    await connection.query(
      `
      UPDATE subscriptions
      SET status_langganan = 'expired'
      WHERE id_owner = ?
        AND status_langganan = 'aktif'
        AND id_subscription != ?
      `,
      [subscription.id_owner, id_subscription]
    );

    await connection.commit();
    return {
      id_subscription: Number(id_subscription),
      status_langganan: "aktif"
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
    WHERE status_langganan = 'aktif'
      AND tanggal_berakhir < NOW()
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
    WHERE id_owner = ?
      AND status_langganan = 'aktif'
      AND id_subscription != ?
    `,
    [id_owner, excludeId]
  );
  return result.affectedRows;
};

/*
|--------------------------------------------------------------------------
| UPGRADE SUBSCRIPTION (ganti plan dan jumlah bulan, mulai dari sekarang)
|--------------------------------------------------------------------------
*/
/*
|--------------------------------------------------------------------------
| UPGRADE SUBSCRIPTION
|--------------------------------------------------------------------------
| Membuat invoice upgrade baru dengan status pending.
| Subscription lama tetap aktif sampai invoice di-approve.
|--------------------------------------------------------------------------
*/
const upgradeSubscription = async (
  id_subscription,
  newPlanId,
  newJumlahBulan
) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Ambil subscription lama
    const [subRows] = await connection.query(
      `
      SELECT
        s.id_subscription,
        s.id_owner,
        s.id_plan,
        s.status_langganan
      FROM subscriptions s
      WHERE s.id_subscription = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id_subscription]
    );

    const subscription = subRows[0];

    if (!subscription) {
      throw new Error("Subscription tidak ditemukan");
    }

    if (subscription.status_langganan !== "aktif") {
      throw new Error("Hanya subscription aktif yang bisa di-upgrade");
    }

    // Ambil plan lama
    const oldPlan = await findPlanById(subscription.id_plan);

    // Ambil plan baru
    const newPlan = await findPlanById(newPlanId);

    if (!newPlan) {
      throw new Error("Plan baru tidak ditemukan");
    }

    if (newPlan.status_paket !== "aktif") {
      throw new Error("Plan baru tidak aktif");
    }

    // Tidak boleh downgrade
    if (newPlan.harga <= oldPlan.harga) {
      throw new Error(
        "Upgrade hanya dapat dilakukan ke paket dengan harga lebih tinggi"
      );
    }

    const totalHarga = newPlan.harga * newJumlahBulan;
    const kodeInvoice = await generateInvoiceCode();

    // Buat subscription baru (pending)
    const [result] = await connection.query(
      `
      INSERT INTO subscriptions
      (
        id_owner,
        id_plan,
        jumlah_bulan,
        kode_invoice,
        harga,
        status_langganan,
        metode_pembayaran,
        catatan
      )
      VALUES
      (
        ?, ?, ?, ?, ?, 'pending', 'manual_transfer', ?
      )
      `,
      [
        subscription.id_owner,
        newPlanId,
        newJumlahBulan,
        kodeInvoice,
        totalHarga,
        `Upgrade dari paket ${oldPlan.nama_paket}`
      ]
    );

    await connection.commit();

    return {
      id_subscription: result.insertId,
      id_owner: subscription.id_owner,
      id_plan: newPlanId,
      jumlah_bulan: newJumlahBulan,
      harga: totalHarga,
      kode_invoice: kodeInvoice,
      status_langganan: "pending",
      metode_pembayaran: "manual_transfer",
      is_upgrade: true
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
| EXTEND SUBSCRIPTION (perpanjang masa aktif dengan jumlah bulan tambahan)
|--------------------------------------------------------------------------
*/
const extendSubscription = async (id_subscription, additionalMonths, catatan = null) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Ambil data subscription dan plan yang terkait
    const [rows] = await connection.query(
      `
      SELECT
        s.id_subscription,
        s.id_owner,
        s.id_plan,
        s.jumlah_bulan,
        s.status_langganan,
        s.tanggal_berakhir,
        p.durasi_hari,
        p.harga AS harga_plan
      FROM subscriptions s
      JOIN subscription_plans p ON s.id_plan = p.id_plan
      WHERE s.id_subscription = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id_subscription]
    );
    const subscription = rows[0] || null;
    if (!subscription) throw new Error("Subscription tidak ditemukan");
    if (subscription.status_langganan !== "aktif") throw new Error("Hanya subscription aktif yang dapat diperpanjang");
    if (subscription.tanggal_berakhir < new Date()) throw new Error("Subscription sudah expired, tidak bisa diperpanjang");

    const tambahanHari = subscription.durasi_hari * additionalMonths;
    const biayaTambahan = subscription.harga_plan * additionalMonths;

    // Update tanggal_berakhir dan jumlah_bulan (akumulasi)
    await connection.query(
      `
      UPDATE subscriptions
      SET
        tanggal_berakhir = DATE_ADD(tanggal_berakhir, INTERVAL ? DAY),
        jumlah_bulan = jumlah_bulan + ?,
        harga = harga + ?,
        catatan = CONCAT(IFNULL(catatan, ''), ' Perpanjangan ', ?, ' bulan.')
      WHERE id_subscription = ?
      `,
      [tambahanHari, additionalMonths, biayaTambahan, additionalMonths, id_subscription]
    );

    await connection.commit();
    return {
      id_subscription: Number(id_subscription),
      tambahan_bulan: additionalMonths,
      biaya_tambahan: biayaTambahan,
      tanggal_berakhir_baru: (await findById(id_subscription)).tanggal_berakhir
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

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
  expireOldSubscriptions,
  expireAllActiveSubscriptionsForOwner,
  upgradeSubscription,   // baru
  extendSubscription     // baru
};