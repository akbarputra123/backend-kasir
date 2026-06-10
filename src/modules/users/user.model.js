const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| FIND ALL USERS
|--------------------------------------------------------------------------
| Mengambil semua data user kecuali password.
| Menampilkan juga data toko.
|--------------------------------------------------------------------------
*/
const findAll = async () => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,
      s.nama_toko,
      u.nama_lengkap,
      u.username,
      u.email,
      u.no_hp,
      u.role,
      u.status_akun,
      u.foto,
      u.last_login,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN stores s ON u.id_store = s.id_store
    ORDER BY u.id_user DESC
    `
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND ALL USERS BY OWNER
|--------------------------------------------------------------------------
| Owner hanya melihat user yang berada di toko miliknya.
|--------------------------------------------------------------------------
*/
const findAllByOwner = async (id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,
      s.nama_toko,
      u.nama_lengkap,
      u.username,
      u.email,
      u.no_hp,
      u.role,
      u.status_akun,
      u.foto,
      u.last_login,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN stores s ON u.id_store = s.id_store
    WHERE 
      u.id_user = ?
      OR s.id_owner = ?
    ORDER BY u.id_user DESC
    `,
    [id_owner, id_owner]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND ALL USERS BY STORE
|--------------------------------------------------------------------------
| Mengambil user berdasarkan toko tertentu.
|--------------------------------------------------------------------------
*/
const findAllByStore = async (id_store) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,
      s.nama_toko,
      u.nama_lengkap,
      u.username,
      u.email,
      u.no_hp,
      u.role,
      u.status_akun,
      u.foto,
      u.last_login,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN stores s ON u.id_store = s.id_store
    WHERE u.id_store = ?
    ORDER BY u.id_user DESC
    `,
    [id_store]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND USER BY ID
|--------------------------------------------------------------------------
*/
const findById = async (id_user) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,
      s.nama_toko,
      u.nama_lengkap,
      u.username,
      u.email,
      u.no_hp,
      u.role,
      u.status_akun,
      u.foto,
      u.last_login,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN stores s ON u.id_store = s.id_store
    WHERE u.id_user = ?
    LIMIT 1
    `,
    [id_user]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND USER BY ID AND OWNER
|--------------------------------------------------------------------------
| Memastikan user yang diakses berada di toko milik owner.
|--------------------------------------------------------------------------
*/
const findByIdAndOwner = async (id_user, id_owner) => {
  const [rows] = await pool.query(
    `
    SELECT
      u.id_user,
      u.id_store,
      s.nama_toko,
      s.id_owner,
      u.nama_lengkap,
      u.username,
      u.email,
      u.no_hp,
      u.role,
      u.status_akun,
      u.foto,
      u.last_login,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN stores s ON u.id_store = s.id_store
    WHERE u.id_user = ?
      AND (
        u.id_user = ?
        OR s.id_owner = ?
      )
    LIMIT 1
    `,
    [id_user, id_owner, id_owner]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND USER BY USERNAME
|--------------------------------------------------------------------------
*/
const findByUsername = async (username) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_user,
      id_store,
      username
    FROM users
    WHERE username = ?
    LIMIT 1
    `,
    [username]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND USER BY EMAIL
|--------------------------------------------------------------------------
*/
const findByEmail = async (email) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_user,
      id_store,
      email
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID AND OWNER
|--------------------------------------------------------------------------
| Mengecek apakah toko benar-benar milik owner yang sedang login.
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
| CREATE USER
|--------------------------------------------------------------------------
| Owner membuat akun admin/kasir dan menghubungkannya ke toko.
|--------------------------------------------------------------------------
*/
const create = async (data) => {
  const [result] = await pool.query(
    `
    INSERT INTO users
    (
      id_store,
      nama_lengkap,
      username,
      email,
      no_hp,
      password,
      role,
      status_akun
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.id_store,
      data.nama_lengkap,
      data.username,
      data.email,
      data.no_hp || null,
      data.password,
      data.role,
      data.status_akun || "aktif"
    ]
  )

  return {
    id_user: result.insertId,
    id_store: data.id_store,
    nama_lengkap: data.nama_lengkap,
    username: data.username,
    email: data.email,
    no_hp: data.no_hp || null,
    role: data.role,
    status_akun: data.status_akun || "aktif"
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
| Owner mengubah data admin/kasir termasuk toko.
|--------------------------------------------------------------------------
*/
const update = async (id_user, data) => {
  const [result] = await pool.query(
    `
    UPDATE users
    SET
      id_store = ?,
      nama_lengkap = ?,
      username = ?,
      email = ?,
      no_hp = ?,
      role = ?,
      status_akun = ?
    WHERE id_user = ?
    `,
    [
      data.id_store,
      data.nama_lengkap,
      data.username,
      data.email,
      data.no_hp || null,
      data.role,
      data.status_akun,
      id_user
    ]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| UPDATE PASSWORD
|--------------------------------------------------------------------------
*/
const updatePassword = async (id_user, password) => {
  const [result] = await pool.query(
    `
    UPDATE users
    SET password = ?
    WHERE id_user = ?
    `,
    [password, id_user]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
*/
const remove = async (id_user) => {
  const [result] = await pool.query(
    `
    DELETE FROM users
    WHERE id_user = ?
    `,
    [id_user]
  )

  return result.affectedRows > 0
}

module.exports = {
  findAll,
  findAllByOwner,
  findAllByStore,
  findById,
  findByIdAndOwner,
  findByUsername,
  findByEmail,
  findStoreByIdAndOwner,
  create,
  update,
  updatePassword,
  remove
}