const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| FIND ALL STORES
|--------------------------------------------------------------------------
| Mengambil semua data toko.
|--------------------------------------------------------------------------
*/
const findAll = async () => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id_store,
      s.id_owner,
      u.nama_lengkap AS nama_owner,
      s.nama_toko,
      s.alamat,
      s.no_hp,
      s.email,
      s.logo,
      s.status_toko,
      s.ppn_aktif,
      s.ppn_persen,
      s.created_at,
      s.updated_at
    FROM stores s
    LEFT JOIN users u ON s.id_owner = u.id_user
    ORDER BY s.id_store DESC
    `
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID
|--------------------------------------------------------------------------
| Mengambil detail toko berdasarkan id_store.
|--------------------------------------------------------------------------
*/
const findById = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      s.id_store,
      s.id_owner,
      u.nama_lengkap AS nama_owner,
      s.nama_toko,
      s.alamat,
      s.no_hp,
      s.email,
      s.logo,
      s.status_toko,
      s.ppn_aktif,
      s.ppn_persen,
      s.created_at,
      s.updated_at
    FROM stores s
    LEFT JOIN users u ON s.id_owner = u.id_user
    WHERE s.id_store = ?
    LIMIT 1
    `,
    [id_store]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND STORES BY OWNER
|--------------------------------------------------------------------------
| Mengambil semua toko milik owner tertentu.
|--------------------------------------------------------------------------
*/
const findByOwnerId = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_store,
      id_owner,
      nama_toko,
      alamat,
      no_hp,
      email,
      logo,
      status_toko,
      ppn_aktif,
      ppn_persen,
      created_at,
      updated_at
    FROM stores
    WHERE id_owner = ?
    ORDER BY id_store DESC
    `,
    [id_owner]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY NAME AND OWNER
|--------------------------------------------------------------------------
| Mengecek apakah nama toko sudah digunakan oleh owner yang sama.
|--------------------------------------------------------------------------
*/
const findByNameAndOwner = async (nama_toko, id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_store,
      id_owner,
      nama_toko
    FROM stores
    WHERE nama_toko = ?
      AND id_owner = ?
    LIMIT 1
    `,
    [nama_toko, id_owner]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| CREATE STORE
|--------------------------------------------------------------------------
| Membuat toko baru.
|--------------------------------------------------------------------------
*/
const create = async (data) => {
  const [result] = await pool.query(
    `
    INSERT INTO stores
    (
      id_owner,
      nama_toko,
      alamat,
      no_hp,
      email,
      logo,
      status_toko,
      ppn_aktif,
      ppn_persen
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.id_owner,
      data.nama_toko,
      data.alamat || null,
      data.no_hp || null,
      data.email || null,
      data.logo || null,
      data.status_toko || "aktif",
      data.ppn_aktif || "tidak",
      data.ppn_aktif === "ya" ? Number(data.ppn_persen || 0) : 0
    ]
  )

  return {
    id_store: result.insertId,
    id_owner: data.id_owner,
    nama_toko: data.nama_toko,
    alamat: data.alamat || null,
    no_hp: data.no_hp || null,
    email: data.email || null,
    logo: data.logo || null,
    status_toko: data.status_toko || "aktif",
    ppn_aktif: data.ppn_aktif || "tidak",
    ppn_persen: data.ppn_aktif === "ya" ? Number(data.ppn_persen || 0) : 0
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE
|--------------------------------------------------------------------------
| Memperbarui data toko.
|--------------------------------------------------------------------------
*/
const update = async (id_store, data) => {
  const [result] = await pool.query(
    `
    UPDATE stores
    SET
      nama_toko = ?,
      alamat = ?,
      no_hp = ?,
      email = ?,
      logo = ?,
      status_toko = ?,
      ppn_aktif = ?,
      ppn_persen = ?
    WHERE id_store = ?
    `,
    [
      data.nama_toko,
      data.alamat || null,
      data.no_hp || null,
      data.email || null,
      data.logo || null,
      data.status_toko,
      data.ppn_aktif || "tidak",
      data.ppn_aktif === "ya" ? Number(data.ppn_persen || 0) : 0,
      id_store
    ]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE LOGO
|--------------------------------------------------------------------------
| Memperbarui logo toko saja.
|--------------------------------------------------------------------------
*/
const updateLogo = async (id_store, logo) => {
  const [result] = await pool.query(
    `
    UPDATE stores
    SET logo = ?
    WHERE id_store = ?
    `,
    [logo, id_store]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| DELETE STORE
|--------------------------------------------------------------------------
| Menghapus toko.
|--------------------------------------------------------------------------
*/
const remove = async (id_store) => {
  const [result] = await pool.query(
    `
    DELETE FROM stores
    WHERE id_store = ?
    `,
    [id_store]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| ASSIGN STORE TO USER
|--------------------------------------------------------------------------
| Menghubungkan user owner/admin/kasir ke toko.
|--------------------------------------------------------------------------
*/
const assignStoreToUser = async (id_user, id_store) => {
  const [result] = await pool.query(
    `
    UPDATE users
    SET id_store = ?
    WHERE id_user = ?
    `,
    [id_store, id_user]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| COUNT STORE BY OWNER
|--------------------------------------------------------------------------
| Menghitung jumlah toko milik owner.
|--------------------------------------------------------------------------
*/
const countByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM stores
    WHERE id_owner = ?
    `,
    [id_owner]
  )

  return rows[0].total
}

module.exports = {
  findAll,
  findById,
  findByOwnerId,
  findByNameAndOwner,
  create,
  update,
  updateLogo,
  remove,
  assignStoreToUser,
  countByOwner
}