const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| PRICE FINAL CASE
|--------------------------------------------------------------------------
| Menghitung harga final berdasarkan diskon aktif.
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
      THEN GREATEST(p.harga_jual - (p.harga_jual * d.nilai_diskon / 100), 0)

    WHEN d.tipe_diskon = 'nominal'
      THEN GREATEST(p.harga_jual - d.nilai_diskon, 0)

    ELSE p.harga_jual
  END
`

/*
|--------------------------------------------------------------------------
| FIND ALL PRODUCTS BY OWNER
|--------------------------------------------------------------------------
| Owner melihat semua produk dari toko miliknya.
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
    JOIN stores s ON p.id_store = s.id_store
    LEFT JOIN categories c ON p.id_category = c.id_category
    LEFT JOIN discounts d ON p.id_discount = d.id_discount
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
| Admin/kasir melihat produk berdasarkan toko.
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
    JOIN stores s ON p.id_store = s.id_store
    LEFT JOIN categories c ON p.id_category = c.id_category
    LEFT JOIN discounts d ON p.id_discount = d.id_discount
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
    JOIN stores s ON p.id_store = s.id_store
    LEFT JOIN categories c ON p.id_category = c.id_category
    LEFT JOIN discounts d ON p.id_discount = d.id_discount
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
const findStoreByIdAndOwner = async (id_store, id_owner) => {
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
    [id_store, id_owner]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND CATEGORY BY ID AND STORE
|--------------------------------------------------------------------------
| Memastikan kategori benar-benar milik toko yang dipilih.
|--------------------------------------------------------------------------
*/
const findCategoryByIdAndStore = async (id_category, id_store) => {
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
    [id_category, id_store]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND DISCOUNT BY ID AND STORE
|--------------------------------------------------------------------------
| Memastikan diskon benar-benar milik toko yang dipilih.
|--------------------------------------------------------------------------
*/
const findDiscountByIdAndStore = async (id_discount, id_store) => {
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
    [id_discount, id_store]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND BY KODE PRODUK AND STORE
|--------------------------------------------------------------------------
*/
const findByKodeAndStore = async (kode_produk, id_store) => {
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
    [kode_produk, id_store]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND BY BARCODE AND STORE
|--------------------------------------------------------------------------
*/
const findByBarcodeAndStore = async (barcode, id_store) => {
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
    [barcode, id_store]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
*/
const create = async (data) => {
  const [result] = await pool.query(
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
      data.harga_beli || 0,
      data.harga_jual || 0,
      data.stok || 0,
      data.stok_minimum || 0,
      data.satuan || "pcs",
      data.foto || null,
      data.status_produk || "aktif"
    ]
  )

  return {
    id_product: result.insertId,
    id_store: data.id_store,
    id_category: data.id_category || null,
    id_discount: data.id_discount || null,
    kode_produk: data.kode_produk,
    barcode: data.barcode || null,
    nama_produk: data.nama_produk,
    deskripsi: data.deskripsi || null,
    harga_beli: data.harga_beli || 0,
    harga_jual: data.harga_jual || 0,
    stok: data.stok || 0,
    stok_minimum: data.stok_minimum || 0,
    satuan: data.satuan || "pcs",
    foto: data.foto || null,
    status_produk: data.status_produk || "aktif"
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
*/
const update = async (id_product, data) => {
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
      data.harga_beli || 0,
      data.harga_jual || 0,
      data.stok || 0,
      data.stok_minimum || 0,
      data.satuan || "pcs",
      data.foto || null,
      data.status_produk,
      id_product
    ]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| UPDATE PRODUCT FOTO
|--------------------------------------------------------------------------
*/
const updateFoto = async (id_product, foto) => {
  const [result] = await pool.query(
    `
    UPDATE products
    SET foto = ?
    WHERE id_product = ?
    `,
    [foto, id_product]
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
  create,
  update,
  updateFoto,
  remove
}