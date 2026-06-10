const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| FIND ALL DISCOUNTS BY OWNER
|--------------------------------------------------------------------------
| Owner melihat semua diskon dari toko miliknya.
|--------------------------------------------------------------------------
*/
const findAllByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      d.id_discount,
      d.id_store,
      s.nama_toko,
      d.nama_diskon,
      d.tipe_diskon,
      d.nilai_diskon,
      d.tanggal_mulai,
      d.tanggal_berakhir,
      d.status_diskon,
      d.created_at,
      d.updated_at
    FROM discounts d
    JOIN stores s ON d.id_store = s.id_store
    WHERE s.id_owner = ?
    ORDER BY d.id_discount DESC
    `,
    [id_owner]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND ALL DISCOUNTS BY STORE
|--------------------------------------------------------------------------
| Admin/kasir melihat diskon berdasarkan toko.
|--------------------------------------------------------------------------
*/
const findAllByStore = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      d.id_discount,
      d.id_store,
      s.nama_toko,
      d.nama_diskon,
      d.tipe_diskon,
      d.nilai_diskon,
      d.tanggal_mulai,
      d.tanggal_berakhir,
      d.status_diskon,
      d.created_at,
      d.updated_at
    FROM discounts d
    JOIN stores s ON d.id_store = s.id_store
    WHERE d.id_store = ?
    ORDER BY d.id_discount DESC
    `,
    [id_store]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND DISCOUNT BY ID
|--------------------------------------------------------------------------
*/
const findById = async (id_discount) => {
  const [rows] = await pool.query(
    `
    SELECT
      d.id_discount,
      d.id_store,
      s.id_owner,
      s.nama_toko,
      d.nama_diskon,
      d.tipe_diskon,
      d.nilai_diskon,
      d.tanggal_mulai,
      d.tanggal_berakhir,
      d.status_diskon,
      d.created_at,
      d.updated_at
    FROM discounts d
    JOIN stores s ON d.id_store = s.id_store
    WHERE d.id_discount = ?
    LIMIT 1
    `,
    [id_discount]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID AND OWNER
|--------------------------------------------------------------------------
| Mengecek toko milik owner.
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
| FIND DISCOUNT BY NAME AND STORE
|--------------------------------------------------------------------------
| Cegah nama diskon duplikat dalam toko yang sama.
|--------------------------------------------------------------------------
*/
const findByNameAndStore = async (nama_diskon, id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_discount,
      id_store,
      nama_diskon
    FROM discounts
    WHERE nama_diskon = ?
      AND id_store = ?
    LIMIT 1
    `,
    [nama_diskon, id_store]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| CREATE DISCOUNT
|--------------------------------------------------------------------------
*/
const create = async (data) => {
  const [result] = await pool.query(
    `
    INSERT INTO discounts
    (
      id_store,
      nama_diskon,
      tipe_diskon,
      nilai_diskon,
      tanggal_mulai,
      tanggal_berakhir,
      status_diskon
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.id_store,
      data.nama_diskon,
      data.tipe_diskon,
      data.nilai_diskon,
      data.tanggal_mulai || null,
      data.tanggal_berakhir || null,
      data.status_diskon || "aktif"
    ]
  )

  return {
    id_discount: result.insertId,
    id_store: data.id_store,
    nama_diskon: data.nama_diskon,
    tipe_diskon: data.tipe_diskon,
    nilai_diskon: data.nilai_diskon,
    tanggal_mulai: data.tanggal_mulai || null,
    tanggal_berakhir: data.tanggal_berakhir || null,
    status_diskon: data.status_diskon || "aktif"
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE DISCOUNT
|--------------------------------------------------------------------------
*/
const update = async (id_discount, data) => {
  const [result] = await pool.query(
    `
    UPDATE discounts
    SET
      id_store = ?,
      nama_diskon = ?,
      tipe_diskon = ?,
      nilai_diskon = ?,
      tanggal_mulai = ?,
      tanggal_berakhir = ?,
      status_diskon = ?
    WHERE id_discount = ?
    `,
    [
      data.id_store,
      data.nama_diskon,
      data.tipe_diskon,
      data.nilai_diskon,
      data.tanggal_mulai || null,
      data.tanggal_berakhir || null,
      data.status_diskon,
      id_discount
    ]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| DELETE DISCOUNT
|--------------------------------------------------------------------------
*/
const remove = async (id_discount) => {
  const [result] = await pool.query(
    `
    DELETE FROM discounts
    WHERE id_discount = ?
    `,
    [id_discount]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| COUNT PRODUCTS BY DISCOUNT
|--------------------------------------------------------------------------
| Cek apakah diskon sedang dipakai produk.
|--------------------------------------------------------------------------
*/
const countProductsByDiscount = async (id_discount) => {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM products
    WHERE id_discount = ?
    `,
    [id_discount]
  )

  return rows[0].total
}

/*
|--------------------------------------------------------------------------
| DETACH DISCOUNT FROM PRODUCTS
|--------------------------------------------------------------------------
| Melepaskan diskon dari produk.
|--------------------------------------------------------------------------
*/
const detachFromProducts = async (id_discount) => {
  const [result] = await pool.query(
    `
    UPDATE products
    SET id_discount = NULL
    WHERE id_discount = ?
    `,
    [id_discount]
  )

  return result.affectedRows
}

module.exports = {
  findAllByOwner,
  findAllByStore,
  findById,
  findStoreByIdAndOwner,
  findByNameAndStore,
  create,
  update,
  remove,
  countProductsByDiscount,
  detachFromProducts
}