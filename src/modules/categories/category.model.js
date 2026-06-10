const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| FIND ALL BY OWNER
|--------------------------------------------------------------------------
| Owner melihat kategori dari semua toko miliknya.
| Sekaligus menghitung jumlah produk yang memakai setiap kategori.
|--------------------------------------------------------------------------
*/
const findAllByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      c.id_category,
      c.id_store,
      s.nama_toko,
      c.nama_kategori,
      c.deskripsi,
      c.status_kategori,
      c.created_at,
      c.updated_at,
      COUNT(p.id_product) AS total_produk
    FROM categories c
    JOIN stores s ON c.id_store = s.id_store
    LEFT JOIN products p ON p.id_category = c.id_category
      AND p.id_store = c.id_store
    WHERE s.id_owner = ?
    GROUP BY
      c.id_category,
      c.id_store,
      s.nama_toko,
      c.nama_kategori,
      c.deskripsi,
      c.status_kategori,
      c.created_at,
      c.updated_at
    ORDER BY c.id_category DESC
    `,
    [id_owner]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND ALL BY STORE
|--------------------------------------------------------------------------
| Admin/kasir melihat kategori berdasarkan toko tempat dia bekerja.
| Sekaligus menghitung jumlah produk yang memakai setiap kategori.
|--------------------------------------------------------------------------
*/
const findAllByStore = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      c.id_category,
      c.id_store,
      s.nama_toko,
      c.nama_kategori,
      c.deskripsi,
      c.status_kategori,
      c.created_at,
      c.updated_at,
      COUNT(p.id_product) AS total_produk
    FROM categories c
    JOIN stores s ON c.id_store = s.id_store
    LEFT JOIN products p ON p.id_category = c.id_category
      AND p.id_store = c.id_store
    WHERE c.id_store = ?
    GROUP BY
      c.id_category,
      c.id_store,
      s.nama_toko,
      c.nama_kategori,
      c.deskripsi,
      c.status_kategori,
      c.created_at,
      c.updated_at
    ORDER BY c.id_category DESC
    `,
    [id_store]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND BY ID
|--------------------------------------------------------------------------
| Mengambil detail kategori berdasarkan ID.
| Sekaligus menghitung jumlah produk yang memakai kategori tersebut.
|--------------------------------------------------------------------------
*/
const findById = async (id_category) => {
  const [rows] = await pool.query(
    `
    SELECT
      c.id_category,
      c.id_store,
      s.id_owner,
      s.nama_toko,
      c.nama_kategori,
      c.deskripsi,
      c.status_kategori,
      c.created_at,
      c.updated_at,
      COUNT(p.id_product) AS total_produk
    FROM categories c
    JOIN stores s ON c.id_store = s.id_store
    LEFT JOIN products p ON p.id_category = c.id_category
      AND p.id_store = c.id_store
    WHERE c.id_category = ?
    GROUP BY
      c.id_category,
      c.id_store,
      s.id_owner,
      s.nama_toko,
      c.nama_kategori,
      c.deskripsi,
      c.status_kategori,
      c.created_at,
      c.updated_at
    LIMIT 1
    `,
    [id_category]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID AND OWNER
|--------------------------------------------------------------------------
| Mengecek apakah toko benar-benar milik owner.
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
| FIND CATEGORY BY NAME AND STORE
|--------------------------------------------------------------------------
| Mengecek nama kategori agar tidak duplikat dalam toko yang sama.
|--------------------------------------------------------------------------
*/
const findByNameAndStore = async (nama_kategori, id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_category,
      id_store,
      nama_kategori
    FROM categories
    WHERE nama_kategori = ?
      AND id_store = ?
    LIMIT 1
    `,
    [nama_kategori, id_store]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| CREATE CATEGORY
|--------------------------------------------------------------------------
*/
const create = async (data) => {
  const [result] = await pool.query(
    `
    INSERT INTO categories
    (
      id_store,
      nama_kategori,
      deskripsi,
      status_kategori
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      data.id_store,
      data.nama_kategori,
      data.deskripsi || null,
      data.status_kategori || "aktif"
    ]
  )

  return {
    id_category: result.insertId,
    id_store: data.id_store,
    nama_kategori: data.nama_kategori,
    deskripsi: data.deskripsi || null,
    status_kategori: data.status_kategori || "aktif",
    total_produk: 0
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE CATEGORY
|--------------------------------------------------------------------------
*/
const update = async (id_category, data) => {
  const [result] = await pool.query(
    `
    UPDATE categories
    SET
      id_store = ?,
      nama_kategori = ?,
      deskripsi = ?,
      status_kategori = ?
    WHERE id_category = ?
    `,
    [
      data.id_store,
      data.nama_kategori,
      data.deskripsi || null,
      data.status_kategori,
      id_category
    ]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| DELETE CATEGORY
|--------------------------------------------------------------------------
*/
const remove = async (id_category) => {
  const [result] = await pool.query(
    `
    DELETE FROM categories
    WHERE id_category = ?
    `,
    [id_category]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| COUNT PRODUCTS BY CATEGORY
|--------------------------------------------------------------------------
| Cek apakah kategori sedang dipakai produk.
|--------------------------------------------------------------------------
*/
const countProductsByCategory = async (id_category) => {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM products
    WHERE id_category = ?
    `,
    [id_category]
  )

  return rows[0].total
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
  countProductsByCategory
}