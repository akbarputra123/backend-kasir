const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| CREATE MODEL ERROR
|--------------------------------------------------------------------------
*/
const createModelError = (
  message,
  statusCode = 400,
  code = "PRODUCT_MODEL_ERROR",
  details = null
) => {
  const error = new Error(message)

  error.statusCode = statusCode
  error.code = code

  if (details) {
    error.details = details
  }

  return error
}

/*
|--------------------------------------------------------------------------
| PRICE FINAL CASE
|--------------------------------------------------------------------------
*/
const hargaFinalSql = `
  CASE
    WHEN d.id_discount IS NULL THEN p.harga_jual

    WHEN d.status_diskon != 'aktif' THEN p.harga_jual

    WHEN d.tanggal_mulai IS NOT NULL
         AND NOW() < d.tanggal_mulai THEN p.harga_jual

    WHEN d.tanggal_berakhir IS NOT NULL
         AND NOW() > d.tanggal_berakhir THEN p.harga_jual

    WHEN d.tipe_diskon = 'persen'
      THEN GREATEST(
        p.harga_jual -
        (p.harga_jual * d.nilai_diskon / 100),
        0
      )

    WHEN d.tipe_diskon = 'nominal'
      THEN GREATEST(
        p.harga_jual - d.nilai_diskon,
        0
      )

    ELSE p.harga_jual
  END
`

/*
|--------------------------------------------------------------------------
| FIND ALL PRODUCTS BY OWNER
|--------------------------------------------------------------------------
*/
const findAllByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      p.id_product,
      p.id_store,
      s.nama_toko,

      p.id_category,
      c.nama_kategori,

      p.id_discount,
      d.nama_diskon,
      d.tipe_diskon,
      d.nilai_diskon,
      d.tanggal_mulai,
      d.tanggal_berakhir,
      d.status_diskon,

      p.kode_produk,
      p.barcode,
      p.nama_produk,
      p.deskripsi,
      p.harga_beli,
      p.harga_jual,

      ${hargaFinalSql} AS harga_final,

      p.stok,
      p.stok_minimum,
      p.satuan,
      p.foto,
      p.status_produk,
      p.created_at,
      p.updated_at

    FROM products p

    INNER JOIN stores s
      ON s.id_store = p.id_store

    LEFT JOIN categories c
      ON c.id_category = p.id_category

    LEFT JOIN discounts d
      ON d.id_discount = p.id_discount

    WHERE s.id_owner = ?

    ORDER BY p.id_product DESC
    `,
    [id_owner]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND ALL PRODUCTS BY STORE
|--------------------------------------------------------------------------
*/
const findAllByStore = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      p.id_product,
      p.id_store,
      s.nama_toko,

      p.id_category,
      c.nama_kategori,

      p.id_discount,
      d.nama_diskon,
      d.tipe_diskon,
      d.nilai_diskon,
      d.tanggal_mulai,
      d.tanggal_berakhir,
      d.status_diskon,

      p.kode_produk,
      p.barcode,
      p.nama_produk,
      p.deskripsi,
      p.harga_beli,
      p.harga_jual,

      ${hargaFinalSql} AS harga_final,

      p.stok,
      p.stok_minimum,
      p.satuan,
      p.foto,
      p.status_produk,
      p.created_at,
      p.updated_at

    FROM products p

    INNER JOIN stores s
      ON s.id_store = p.id_store

    LEFT JOIN categories c
      ON c.id_category = p.id_category

    LEFT JOIN discounts d
      ON d.id_discount = p.id_discount

    WHERE p.id_store = ?

    ORDER BY p.id_product DESC
    `,
    [id_store]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND PRODUCT BY ID
|--------------------------------------------------------------------------
*/
const findById = async (id_product) => {
  const [rows] = await pool.query(
    `
    SELECT
      p.id_product,
      p.id_store,

      s.id_owner,
      s.nama_toko,

      p.id_category,
      c.nama_kategori,

      p.id_discount,
      d.nama_diskon,
      d.tipe_diskon,
      d.nilai_diskon,
      d.tanggal_mulai,
      d.tanggal_berakhir,
      d.status_diskon,

      p.kode_produk,
      p.barcode,
      p.nama_produk,
      p.deskripsi,
      p.harga_beli,
      p.harga_jual,

      ${hargaFinalSql} AS harga_final,

      p.stok,
      p.stok_minimum,
      p.satuan,
      p.foto,
      p.status_produk,
      p.created_at,
      p.updated_at

    FROM products p

    INNER JOIN stores s
      ON s.id_store = p.id_store

    LEFT JOIN categories c
      ON c.id_category = p.id_category

    LEFT JOIN discounts d
      ON d.id_discount = p.id_discount

    WHERE p.id_product = ?

    LIMIT 1
    `,
    [id_product]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID AND OWNER
|--------------------------------------------------------------------------
*/
const findStoreByIdAndOwner = async (
  id_store,
  id_owner
) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_store,
      id_owner,
      nama_toko,
      status_toko
    FROM stores
    WHERE id_store = ?
      AND id_owner = ?
    LIMIT 1
    `,
    [
      id_store,
      id_owner
    ]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND CATEGORY BY ID AND STORE
|--------------------------------------------------------------------------
*/
const findCategoryByIdAndStore = async (
  id_category,
  id_store
) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_category,
      id_store,
      nama_kategori,
      status_kategori
    FROM categories
    WHERE id_category = ?
      AND id_store = ?
    LIMIT 1
    `,
    [
      id_category,
      id_store
    ]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND DISCOUNT BY ID AND STORE
|--------------------------------------------------------------------------
*/
const findDiscountByIdAndStore = async (
  id_discount,
  id_store
) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_discount,
      id_store,
      nama_diskon,
      tipe_diskon,
      nilai_diskon,
      tanggal_mulai,
      tanggal_berakhir,
      status_diskon
    FROM discounts
    WHERE id_discount = ?
      AND id_store = ?
    LIMIT 1
    `,
    [
      id_discount,
      id_store
    ]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND PRODUCT BY CODE AND STORE
|--------------------------------------------------------------------------
*/
const findByKodeAndStore = async (
  kode_produk,
  id_store
) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_product,
      id_store,
      kode_produk
    FROM products
    WHERE kode_produk = ?
      AND id_store = ?
    LIMIT 1
    `,
    [
      kode_produk,
      id_store
    ]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND PRODUCT BY BARCODE AND STORE
|--------------------------------------------------------------------------
*/
const findByBarcodeAndStore = async (
  barcode,
  id_store
) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_product,
      id_store,
      barcode
    FROM products
    WHERE barcode = ?
      AND id_store = ?
    LIMIT 1
    `,
    [
      barcode,
      id_store
    ]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND ACTIVE SUBSCRIPTION BY OWNER
|--------------------------------------------------------------------------
*/
const findActiveSubscriptionByOwner = async (
  id_owner
) => {
  const [rows] = await pool.query(
    `
    SELECT
      sub.id_subscription,
      sub.id_owner,
      sub.id_plan,
      sub.kode_invoice,
      sub.tanggal_mulai,
      sub.tanggal_berakhir,
      sub.status_langganan,

      plan.nama_paket,
      plan.batas_toko,
      plan.batas_user,
      plan.batas_produk,
      plan.status_paket

    FROM subscriptions sub

    INNER JOIN subscription_plans plan
      ON plan.id_plan = sub.id_plan

    WHERE sub.id_owner = ?
      AND sub.status_langganan = 'aktif'
      AND plan.status_paket = 'aktif'
      AND sub.tanggal_mulai IS NOT NULL
      AND sub.tanggal_berakhir IS NOT NULL
      AND sub.tanggal_mulai <= NOW()
      AND sub.tanggal_berakhir >= NOW()

    ORDER BY
      sub.tanggal_berakhir DESC,
      sub.id_subscription DESC

    LIMIT 1
    `,
    [id_owner]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| COUNT PRODUCTS BY OWNER
|--------------------------------------------------------------------------
| Menghitung seluruh produk dari semua toko milik owner.
|--------------------------------------------------------------------------
*/
const countByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM products p

    INNER JOIN stores s
      ON s.id_store = p.id_store

    WHERE s.id_owner = ?
    `,
    [id_owner]
  )

  return Number(rows[0]?.total || 0)
}

/*
|--------------------------------------------------------------------------
| GET PRODUCT USAGE BY OWNER
|--------------------------------------------------------------------------
*/
const getProductUsageByOwner = async (
  id_owner
) => {
  const [rows] = await pool.query(
    `
    SELECT
      sub.id_subscription,
      sub.id_plan,

      plan.nama_paket,
      plan.batas_produk,

      sub.tanggal_mulai,
      sub.tanggal_berakhir,

      (
        SELECT COUNT(*)
        FROM products product_count

        INNER JOIN stores owner_store
          ON owner_store.id_store =
             product_count.id_store

        WHERE owner_store.id_owner =
              sub.id_owner
      ) AS total_produk

    FROM subscriptions sub

    INNER JOIN subscription_plans plan
      ON plan.id_plan = sub.id_plan

    WHERE sub.id_owner = ?
      AND sub.status_langganan = 'aktif'
      AND plan.status_paket = 'aktif'
      AND sub.tanggal_mulai IS NOT NULL
      AND sub.tanggal_berakhir IS NOT NULL
      AND sub.tanggal_mulai <= NOW()
      AND sub.tanggal_berakhir >= NOW()

    ORDER BY
      sub.tanggal_berakhir DESC,
      sub.id_subscription DESC

    LIMIT 1
    `,
    [id_owner]
  )

  if (!rows[0]) {
    return null
  }

  const usage = rows[0]

  const batasProduk = Number(
    usage.batas_produk || 0
  )

  const totalProduk = Number(
    usage.total_produk || 0
  )

  return {
    id_subscription: usage.id_subscription,
    id_plan: usage.id_plan,
    nama_paket: usage.nama_paket,
    batas_produk: batasProduk,
    total_produk: totalProduk,
    sisa_produk: Math.max(
      batasProduk - totalProduk,
      0
    ),
    tanggal_mulai: usage.tanggal_mulai,
    tanggal_berakhir: usage.tanggal_berakhir
  }
}

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT WITH SUBSCRIPTION LIMIT
|--------------------------------------------------------------------------
*/
const create = async (data) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    /*
    |--------------------------------------------------------------------------
    | GET AND LOCK STORE
    |--------------------------------------------------------------------------
    */
    const [storeRows] = await connection.query(
      `
      SELECT
        s.id_store,
        s.id_owner,
        s.nama_toko,
        s.status_toko
      FROM stores s
      WHERE s.id_store = ?
      LIMIT 1
      FOR UPDATE
      `,
      [data.id_store]
    )

    const store = storeRows[0]

    if (!store) {
      throw createModelError(
        "Toko tidak ditemukan",
        404,
        "STORE_NOT_FOUND"
      )
    }

    if (store.status_toko !== "aktif") {
      throw createModelError(
        "Toko sedang nonaktif",
        403,
        "STORE_INACTIVE"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE ACTOR ACCESS
    |--------------------------------------------------------------------------
    */
    if (data.actor_role === "owner") {
      if (
        Number(store.id_owner) !==
        Number(data.actor_id)
      ) {
        throw createModelError(
          "Toko bukan milik owner yang sedang login",
          403,
          "STORE_ACCESS_DENIED"
        )
      }
    } else if (data.actor_role === "admin") {
      if (
        Number(store.id_store) !==
        Number(data.actor_store_id)
      ) {
        throw createModelError(
          "Admin tidak memiliki akses ke toko ini",
          403,
          "STORE_ACCESS_DENIED"
        )
      }
    } else {
      throw createModelError(
        "Anda tidak memiliki akses untuk menambahkan produk",
        403,
        "FORBIDDEN"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | LOCK OWNER
    |--------------------------------------------------------------------------
    | Semua request pembuatan produk untuk owner yang sama akan diproses
    | bergantian, termasuk request dari beberapa admin pada toko berbeda.
    |--------------------------------------------------------------------------
    */
    const [ownerRows] = await connection.query(
      `
      SELECT
        id_user,
        role,
        status_akun
      FROM users
      WHERE id_user = ?
      LIMIT 1
      FOR UPDATE
      `,
      [store.id_owner]
    )

    const owner = ownerRows[0]

    if (!owner) {
      throw createModelError(
        "Owner toko tidak ditemukan",
        404,
        "OWNER_NOT_FOUND"
      )
    }

    if (owner.role !== "owner") {
      throw createModelError(
        "Pemilik toko bukan akun owner",
        403,
        "INVALID_STORE_OWNER"
      )
    }

    if (owner.status_akun !== "aktif") {
      throw createModelError(
        "Akun owner sedang tidak aktif",
        403,
        "OWNER_INACTIVE"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | GET ACTIVE SUBSCRIPTION
    |--------------------------------------------------------------------------
    */
    const [subscriptionRows] =
      await connection.query(
        `
        SELECT
          sub.id_subscription,
          sub.id_owner,
          sub.id_plan,
          sub.kode_invoice,
          sub.tanggal_mulai,
          sub.tanggal_berakhir,

          plan.nama_paket,
          plan.batas_produk,
          plan.status_paket

        FROM subscriptions sub

        INNER JOIN subscription_plans plan
          ON plan.id_plan = sub.id_plan

        WHERE sub.id_owner = ?
          AND sub.status_langganan = 'aktif'
          AND plan.status_paket = 'aktif'
          AND sub.tanggal_mulai IS NOT NULL
          AND sub.tanggal_berakhir IS NOT NULL
          AND sub.tanggal_mulai <= NOW()
          AND sub.tanggal_berakhir >= NOW()

        ORDER BY
          sub.tanggal_berakhir DESC,
          sub.id_subscription DESC

        LIMIT 1
        FOR UPDATE
        `,
        [store.id_owner]
      )

    const subscription = subscriptionRows[0]

    if (!subscription) {
      throw createModelError(
        "Owner tidak memiliki langganan aktif",
        403,
        "ACTIVE_SUBSCRIPTION_NOT_FOUND"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | COUNT OWNER PRODUCTS
    |--------------------------------------------------------------------------
    */
    const [countRows] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM products p

      INNER JOIN stores s
        ON s.id_store = p.id_store

      WHERE s.id_owner = ?
      `,
      [store.id_owner]
    )

    const totalProduct = Number(
      countRows[0]?.total || 0
    )

    const productLimit = Number(
      subscription.batas_produk || 0
    )

    if (productLimit <= 0) {
      throw createModelError(
        "Paket langganan tidak mengizinkan penambahan produk",
        403,
        "PRODUCT_NOT_ALLOWED",
        {
          nama_paket:
            subscription.nama_paket,
          total_produk: totalProduct,
          batas_produk: productLimit,
          sisa_produk: 0
        }
      )
    }

    if (totalProduct >= productLimit) {
      throw createModelError(
        `Batas produk pada paket ${subscription.nama_paket} telah tercapai. Maksimal ${productLimit} produk`,
        403,
        "PRODUCT_LIMIT_REACHED",
        {
          nama_paket:
            subscription.nama_paket,
          total_produk: totalProduct,
          batas_produk: productLimit,
          sisa_produk: 0,
          tanggal_berakhir:
            subscription.tanggal_berakhir
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE CATEGORY
    |--------------------------------------------------------------------------
    */
    let category = null

    if (data.id_category) {
      const [categoryRows] =
        await connection.query(
          `
          SELECT
            id_category,
            id_store,
            nama_kategori,
            status_kategori
          FROM categories
          WHERE id_category = ?
            AND id_store = ?
          LIMIT 1
          `,
          [
            data.id_category,
            data.id_store
          ]
        )

      category = categoryRows[0]

      if (!category) {
        throw createModelError(
          "Kategori tidak ditemukan pada toko ini",
          404,
          "CATEGORY_NOT_FOUND"
        )
      }

      if (
        category.status_kategori !== "aktif"
      ) {
        throw createModelError(
          "Kategori sedang nonaktif",
          403,
          "CATEGORY_INACTIVE"
        )
      }
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE DISCOUNT
    |--------------------------------------------------------------------------
    */
    let discount = null

    if (data.id_discount) {
      const [discountRows] =
        await connection.query(
          `
          SELECT
            id_discount,
            id_store,
            nama_diskon,
            tipe_diskon,
            nilai_diskon,
            tanggal_mulai,
            tanggal_berakhir,
            status_diskon
          FROM discounts
          WHERE id_discount = ?
            AND id_store = ?
          LIMIT 1
          `,
          [
            data.id_discount,
            data.id_store
          ]
        )

      discount = discountRows[0]

      if (!discount) {
        throw createModelError(
          "Diskon tidak ditemukan pada toko ini",
          404,
          "DISCOUNT_NOT_FOUND"
        )
      }

      if (
        discount.status_diskon !== "aktif"
      ) {
        throw createModelError(
          "Diskon sedang nonaktif",
          403,
          "DISCOUNT_INACTIVE"
        )
      }

      if (
        discount.tanggal_mulai &&
        new Date() <
          new Date(discount.tanggal_mulai)
      ) {
        throw createModelError(
          "Diskon belum mulai",
          422,
          "DISCOUNT_NOT_STARTED"
        )
      }

      if (
        discount.tanggal_berakhir &&
        new Date() >
          new Date(discount.tanggal_berakhir)
      ) {
        throw createModelError(
          "Diskon sudah berakhir",
          422,
          "DISCOUNT_EXPIRED"
        )
      }
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK PRODUCT CODE
    |--------------------------------------------------------------------------
    */
    const [codeRows] = await connection.query(
      `
      SELECT id_product
      FROM products
      WHERE id_store = ?
        AND kode_produk = ?
      LIMIT 1
      `,
      [
        data.id_store,
        data.kode_produk
      ]
    )

    if (codeRows.length > 0) {
      throw createModelError(
        "Kode produk sudah digunakan pada toko ini",
        409,
        "PRODUCT_CODE_ALREADY_EXISTS"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK BARCODE
    |--------------------------------------------------------------------------
    */
    if (data.barcode) {
      const [barcodeRows] =
        await connection.query(
          `
          SELECT id_product
          FROM products
          WHERE id_store = ?
            AND barcode = ?
          LIMIT 1
          `,
          [
            data.id_store,
            data.barcode
          ]
        )

      if (barcodeRows.length > 0) {
        throw createModelError(
          "Barcode sudah digunakan pada toko ini",
          409,
          "PRODUCT_BARCODE_ALREADY_EXISTS"
        )
      }
    }

    /*
    |--------------------------------------------------------------------------
    | INSERT PRODUCT
    |--------------------------------------------------------------------------
    */
    const [result] = await connection.query(
      `
      INSERT INTO products
      (
        id_store,
        id_category,
        id_discount,
        kode_produk,
        barcode,
        nama_produk,
        deskripsi,
        harga_beli,
        harga_jual,
        stok,
        stok_minimum,
        satuan,
        foto,
        status_produk
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.id_store,
        data.id_category || null,
        data.id_discount || null,
        data.kode_produk,
        data.barcode || null,
        data.nama_produk,
        data.deskripsi || null,
        data.harga_beli ?? 0,
        data.harga_jual ?? 0,
        data.stok ?? 0,
        data.stok_minimum ?? 0,
        data.satuan || "pcs",
        data.foto || null,
        data.status_produk || "aktif"
      ]
    )

    await connection.commit()

    return {
      id_product: result.insertId,
      id_store: data.id_store,
      nama_toko: store.nama_toko,

      id_category:
        data.id_category || null,

      nama_kategori:
        category?.nama_kategori || null,

      id_discount:
        data.id_discount || null,

      nama_diskon:
        discount?.nama_diskon || null,

      kode_produk: data.kode_produk,
      barcode: data.barcode || null,
      nama_produk: data.nama_produk,
      deskripsi: data.deskripsi || null,
      harga_beli: data.harga_beli ?? 0,
      harga_jual: data.harga_jual ?? 0,
      stok: data.stok ?? 0,
      stok_minimum:
        data.stok_minimum ?? 0,
      satuan: data.satuan || "pcs",
      foto: data.foto || null,
      status_produk:
        data.status_produk || "aktif",

      penggunaan_paket: {
        id_subscription:
          subscription.id_subscription,

        id_plan:
          subscription.id_plan,

        nama_paket:
          subscription.nama_paket,

        batas_produk:
          productLimit,

        total_produk_sebelum:
          totalProduct,

        total_produk_sekarang:
          totalProduct + 1,

        sisa_produk: Math.max(
          productLimit -
            (totalProduct + 1),
          0
        ),

        tanggal_mulai:
          subscription.tanggal_mulai,

        tanggal_berakhir:
          subscription.tanggal_berakhir
      }
    }
  } catch (error) {
    await connection.rollback()

    if (error.code === "ER_DUP_ENTRY") {
      const message = String(
        error.message || ""
      ).toLowerCase()

      if (
        message.includes("kode_produk") ||
        message.includes(
          "unique_kode_produk_store"
        )
      ) {
        throw createModelError(
          "Kode produk sudah digunakan pada toko ini",
          409,
          "PRODUCT_CODE_ALREADY_EXISTS"
        )
      }

      if (
        message.includes("barcode") ||
        message.includes(
          "unique_barcode_store"
        )
      ) {
        throw createModelError(
          "Barcode sudah digunakan pada toko ini",
          409,
          "PRODUCT_BARCODE_ALREADY_EXISTS"
        )
      }

      throw createModelError(
        "Data produk sudah digunakan",
        409,
        "PRODUCT_DATA_ALREADY_EXISTS"
      )
    }

    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
*/
const update = async (
  id_product,
  data
) => {
  try {
    const [result] = await pool.query(
      `
      UPDATE products
      SET
        id_store = ?,
        id_category = ?,
        id_discount = ?,
        kode_produk = ?,
        barcode = ?,
        nama_produk = ?,
        deskripsi = ?,
        harga_beli = ?,
        harga_jual = ?,
        stok = ?,
        stok_minimum = ?,
        satuan = ?,
        foto = ?,
        status_produk = ?
      WHERE id_product = ?
      `,
      [
        data.id_store,
        data.id_category || null,
        data.id_discount || null,
        data.kode_produk,
        data.barcode || null,
        data.nama_produk,
        data.deskripsi || null,
        data.harga_beli ?? 0,
        data.harga_jual ?? 0,
        data.stok ?? 0,
        data.stok_minimum ?? 0,
        data.satuan || "pcs",
        data.foto || null,
        data.status_produk,
        id_product
      ]
    )

    return result.affectedRows > 0
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const message = String(
        error.message || ""
      ).toLowerCase()

      if (
        message.includes("kode_produk") ||
        message.includes(
          "unique_kode_produk_store"
        )
      ) {
        throw createModelError(
          "Kode produk sudah digunakan pada toko ini",
          409,
          "PRODUCT_CODE_ALREADY_EXISTS"
        )
      }

      if (
        message.includes("barcode") ||
        message.includes(
          "unique_barcode_store"
        )
      ) {
        throw createModelError(
          "Barcode sudah digunakan pada toko ini",
          409,
          "PRODUCT_BARCODE_ALREADY_EXISTS"
        )
      }
    }

    throw error
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT PHOTO
|--------------------------------------------------------------------------
*/
const updateFoto = async (
  id_product,
  foto
) => {
  const [result] = await pool.query(
    `
    UPDATE products
    SET foto = ?
    WHERE id_product = ?
    `,
    [
      foto,
      id_product
    ]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
*/
const remove = async (id_product) => {
  const [result] = await pool.query(
    `
    DELETE FROM products
    WHERE id_product = ?
    `,
    [id_product]
  )

  return result.affectedRows > 0
}

module.exports = {
  findAllByOwner,
  findAllByStore,
  findById,
  findStoreByIdAndOwner,
  findCategoryByIdAndStore,
  findDiscountByIdAndStore,
  findByKodeAndStore,
  findByBarcodeAndStore,
  findActiveSubscriptionByOwner,
  countByOwner,
  getProductUsageByOwner,
  create,
  update,
  updateFoto,
  remove
}