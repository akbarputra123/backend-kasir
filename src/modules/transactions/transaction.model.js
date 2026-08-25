const pool = require("../../config/database");
const notificationService = require("../notifications/notification.service");

/*
|--------------------------------------------------------------------------
| FIND ALL TRANSACTIONS BY OWNER
|--------------------------------------------------------------------------
*/
const findAllByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      t.id_transaction,
      t.id_store,
      s.nama_toko,
      t.id_user,
      u.nama_lengkap AS nama_kasir,
      t.kode_transaksi,
      t.total_item,
      t.total_qty,
      t.subtotal,
      t.diskon,
      t.pajak,
      t.ppn_persen,
      t.grand_total,
      t.metode_pembayaran,
      t.jumlah_bayar,
      t.kembalian,
      t.status_transaksi,
      t.catatan,
      t.created_at,
      t.updated_at
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    LEFT JOIN users u ON t.id_user = u.id_user
    WHERE s.id_owner = ?
    ORDER BY t.id_transaction DESC
    `,
    [id_owner]
  );
  return rows;
};

/*
|--------------------------------------------------------------------------
| FIND ALL TRANSACTIONS BY STORE
|--------------------------------------------------------------------------
*/
const findAllByStore = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      t.id_transaction,
      t.id_store,
      s.nama_toko,
      t.id_user,
      u.nama_lengkap AS nama_kasir,
      t.kode_transaksi,
      t.total_item,
      t.total_qty,
      t.subtotal,
      t.diskon,
      t.pajak,
      t.ppn_persen,
      t.grand_total,
      t.metode_pembayaran,
      t.jumlah_bayar,
      t.kembalian,
      t.status_transaksi,
      t.catatan,
      t.created_at,
      t.updated_at
    FROM transactions t
    JOIN stores s ON t.id_store = s.id_store
    LEFT JOIN users u ON t.id_user = u.id_user
    WHERE t.id_store = ?
    ORDER BY t.id_transaction DESC
    `,
    [id_store]
  );
  return rows;
};

/*
|--------------------------------------------------------------------------
| FIND TRANSACTION BY ID
|--------------------------------------------------------------------------
*/
const findById = async (id_transaction) => {
  const [rows] = await pool.query(
    `
    SELECT
      t.id_transaction,
      t.id_store,
      s.id_owner,
      s.id_business_category,
      s.nama_toko,
      s.alamat,
      s.no_hp,
      s.email,
      s.logo,
      s.status_toko,
      t.id_user,
      u.nama_lengkap AS nama_kasir,
      t.kode_transaksi,
      t.total_item,
      t.total_qty,
      t.subtotal,
      t.diskon,
      t.pajak,
      t.ppn_persen,
      t.grand_total,
      t.metode_pembayaran,
      t.jumlah_bayar,
      t.kembalian,
      t.status_transaksi,
      t.catatan,
      t.created_at,
      t.updated_at
    FROM transactions t
    INNER JOIN stores s ON s.id_store = t.id_store
    LEFT JOIN users u ON u.id_user = t.id_user
    WHERE t.id_transaction = ?
    LIMIT 1
    `,
    [id_transaction]
  );
  return rows.length ? rows[0] : null;
};

/*
|--------------------------------------------------------------------------
| FIND TRANSACTION ITEMS
|--------------------------------------------------------------------------
*/
const findItemsByTransactionId = async (id_transaction) => {
  const [items] = await pool.query(
    `
    SELECT
      id_transaction_item,
      id_transaction,
      id_product,
      kode_produk,
      nama_produk,
      harga_asli,
      id_discount,
      nama_diskon,
      tipe_diskon,
      nilai_diskon,
      diskon,
      harga_jual,
      qty,
      subtotal,
      created_at
    FROM transaction_items
    WHERE id_transaction = ?
    ORDER BY id_transaction_item ASC
    `,
    [id_transaction]
  );

  if (!items.length) return [];

  const ids = items.map(item => item.id_transaction_item);
  const placeholders = ids.map(() => "?").join(",");

  const [variants] = await pool.query(
    `
    SELECT
      id_transaction_item,
      id_variant_option,
      nama_group,
      nama_option,
      tambahan_harga
    FROM transaction_item_variants
    WHERE id_transaction_item IN (${placeholders})
    ORDER BY id_transaction_item ASC
    `,
    ids
  );

  const variantMap = {};
  for (const variant of variants) {
    if (!variantMap[variant.id_transaction_item]) {
      variantMap[variant.id_transaction_item] = [];
    }
    variantMap[variant.id_transaction_item].push({
      id_variant_option: variant.id_variant_option,
      nama_group: variant.nama_group,
      nama_option: variant.nama_option,
      tambahan_harga: Number(variant.tambahan_harga || 0),
    });
  }

  return items.map(item => ({
    ...item,
    variants: variantMap[item.id_transaction_item] || [],
  }));
};

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID AND OWNER
|--------------------------------------------------------------------------
*/
const findStoreByIdAndOwner = async (id_store, id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_store,
      id_owner,
      id_business_category,
      nama_toko,
      status_toko,
      ppn_aktif,
      ppn_persen
    FROM stores
    WHERE id_store = ?
      AND id_owner = ?
    LIMIT 1
    `,
    [id_store, id_owner]
  );
  return rows[0] || null;
};

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID (untuk mengambil owner dan info toko)
|--------------------------------------------------------------------------
*/
const findStoreById = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_store,
      id_owner,
      id_business_category,
      nama_toko,
      status_toko,
      ppn_aktif,
      ppn_persen
    FROM stores
    WHERE id_store = ?
    LIMIT 1
    `,
    [id_store]
  );
  return rows[0] || null;
};

/*
|--------------------------------------------------------------------------
| GENERATE TRANSACTION CODE
|--------------------------------------------------------------------------
*/
const generateTransactionCode = async (id_store, connection = pool) => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const prefix = `TRX-${yyyy}${mm}${dd}`;

  const [rows] = await connection.query(
    `
    SELECT COUNT(*) AS total
    FROM transactions
    WHERE id_store = ?
      AND DATE(created_at) = CURDATE()
    `,
    [id_store]
  );

  const number = Number(rows[0].total) + 1;
  const sequence = String(number).padStart(4, "0");
  return `${prefix}-${sequence}`;
};

/*
|--------------------------------------------------------------------------
| CREATE TRANSACTION WITH ITEMS (dengan notifikasi)
|--------------------------------------------------------------------------
*/
const createTransaction = async (data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const kodeTransaksi = await generateTransactionCode(data.id_store, connection);

    const [trxResult] = await connection.query(
      `
      INSERT INTO transactions
      (
        id_store,
        id_user,
        kode_transaksi,
        total_item,
        total_qty,
        subtotal,
        diskon,
        pajak,
        ppn_persen,
        grand_total,
        metode_pembayaran,
        jumlah_bayar,
        kembalian,
        status_transaksi,
        catatan
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'selesai', ?)
      `,
      [
        data.id_store,
        data.id_user || null,
        kodeTransaksi,
        data.total_item,
        data.total_qty,
        data.subtotal,
        data.diskon,
        data.pajak,
        data.ppn_persen || 0,
        data.grand_total,
        data.metode_pembayaran,
        data.jumlah_bayar,
        data.kembalian,
        data.catatan || null,
      ]
    );

    const idTransaction = trxResult.insertId;

    // Simpan item dan varian
    for (const item of data.items) {
      const [itemResult] = await connection.query(
        `
        INSERT INTO transaction_items
        (
          id_transaction,
          id_product,
          kode_produk,
          nama_produk,
          harga_asli,
          id_discount,
          nama_diskon,
          tipe_diskon,
          nilai_diskon,
          diskon,
          harga_jual,
          qty,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          idTransaction,
          item.id_product,
          item.kode_produk || "",
          item.nama_produk || "",
          Number(item.harga_asli || 0),
          item.id_discount || null,
          item.nama_diskon || null,
          item.tipe_diskon || null,
          Number(item.nilai_diskon || 0),
          Number(item.diskon || 0),
          Number(item.harga_jual || 0),
          Number(item.qty || 1),
          Number(item.subtotal || 0),
        ]
      );

      const idTransactionItem = itemResult.insertId;

      if (Array.isArray(item.variants) && item.variants.length > 0) {
        for (const variant of item.variants) {
          await connection.query(
            `
            INSERT INTO transaction_item_variants
            (
              id_transaction_item,
              id_variant_option,
              nama_group,
              nama_option,
              tambahan_harga
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
              idTransactionItem,
              variant.id_variant_option,
              variant.nama_group,
              variant.nama_option,
              Number(variant.tambahan_harga || 0),
            ]
          );
        }
      }
    }

    await connection.commit();

    // ============================================================
    // KIRIM NOTIFIKASI KE FIRESTORE (setelah commit sukses)
    // ============================================================
    try {
      // Ambil owner dari store
      const store = await findStoreById(data.id_store);
      if (store && store.id_owner) {
        const idOwner = store.id_owner;

        // Notifikasi pesanan baru
        await notificationService.notifyNewOrder({
          idUser: idOwner,
          idStore: data.id_store,
          idTransaction: idTransaction,
          kodeTransaksi: kodeTransaksi,
          namaPelanggan: null, // bisa diisi jika ada
          grandTotal: data.grand_total,
        });

        // Notifikasi pembayaran berhasil (jika transaksi selesai)
        await notificationService.notifyPaymentSuccess({
          idUser: idOwner,
          idStore: data.id_store,
          idTransaction: idTransaction,
          kodeTransaksi: kodeTransaksi,
          grandTotal: data.grand_total,
        });

        console.log(`✅ Notifikasi transaksi ${kodeTransaksi} dikirim ke Firestore`);
      }
    } catch (notifError) {
      // Notifikasi gagal tidak menggagalkan transaksi
      console.error("❌ Gagal mengirim notifikasi transaksi:", notifError);
    }

    return {
      id_transaction: idTransaction,
      kode_transaksi: kodeTransaksi,
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
| CANCEL TRANSACTION (dengan notifikasi)
|--------------------------------------------------------------------------
*/
const cancelTransaction = async (id_transaction, data) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [trxRows] = await connection.query(
      `
      SELECT
        id_transaction,
        id_store,
        id_user,
        kode_transaksi,
        status_transaksi
      FROM transactions
      WHERE id_transaction = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id_transaction]
    );

    const trx = trxRows[0] || null;
    if (!trx) throw new Error("Transaksi tidak ditemukan");
    if (trx.status_transaksi === "dibatalkan") throw new Error("Transaksi sudah dibatalkan");

    await connection.query(
      `
      UPDATE transactions
      SET
        status_transaksi = 'dibatalkan',
        catatan = ?
      WHERE id_transaction = ?
      `,
      [data.catatan || "Transaksi dibatalkan", id_transaction]
    );

    await connection.commit();

    // ============================================================
    // KIRIM NOTIFIKASI PEMBATALAN KE FIRESTORE
    // ============================================================
    try {
      // Ambil owner dari store
      const store = await findStoreById(trx.id_store);
      if (store && store.id_owner) {
        await notificationService.notifyTransactionCancelled({
          idUser: store.id_owner,
          idStore: trx.id_store,
          idTransaction: id_transaction,
          kodeTransaksi: trx.kode_transaksi,
        });
        console.log(`✅ Notifikasi pembatalan transaksi ${trx.kode_transaksi} dikirim ke Firestore`);
      }
    } catch (notifError) {
      console.error("❌ Gagal mengirim notifikasi pembatalan:", notifError);
    }

    return {
      id_transaction: Number(id_transaction),
      kode_transaksi: trx.kode_transaksi,
      status_transaksi: "dibatalkan",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  findAllByOwner,
  findAllByStore,
  findById,
  findItemsByTransactionId,
  findStoreByIdAndOwner,
  findStoreById,
  createTransaction,
  cancelTransaction,
};