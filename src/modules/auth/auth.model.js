const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| FIND USER BY USERNAME OR EMAIL
|--------------------------------------------------------------------------
| Digunakan untuk proses login dan validasi register.
|--------------------------------------------------------------------------
*/
const findUserByUsernameOrEmail = async (usernameOrEmail) => {
  const [rows] = await pool.query(
    `
    SELECT
  id_user,
  id_store,
  nama_lengkap,
  username,
  email,
  no_hp,
  password,
  role,
  status_akun,
  foto,
  last_login,
  created_at,
  updated_at
FROM users
    WHERE username = ?
       OR email = ?
    LIMIT 1
    `,
    [usernameOrEmail, usernameOrEmail]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND USER BY USERNAME
|--------------------------------------------------------------------------
| Digunakan untuk mengecek apakah username sudah dipakai.
|--------------------------------------------------------------------------
*/
const findUserByUsername = async (username) => {
  const [rows] = await pool.query(
    `
   SELECT
  id_user,
  id_store,
  nama_lengkap,
  username,
  email,
  no_hp,
  password,
  role,
  status_akun,
  foto,
  last_login,
  created_at,
  updated_at
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
| Digunakan untuk mengecek apakah email sudah dipakai.
|--------------------------------------------------------------------------
*/
const findUserByEmail = async (email) => {
  const [rows] = await pool.query(
    `
   SELECT
  id_user,
  id_store,
  nama_lengkap,
  username,
  email,
  no_hp,
  password,
  role,
  status_akun,
  foto,
  last_login,
  created_at,
  updated_at
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
| FIND USER BY ID
|--------------------------------------------------------------------------
| Digunakan untuk mengambil profile user berdasarkan token JWT.
|--------------------------------------------------------------------------
*/
const findUserById = async (id_user) => {
  const [rows] = await pool.query(
    `
    SELECT
  id_user,
  id_store,
  nama_lengkap,
  username,
  email,
  no_hp,
  password,
  role,
  status_akun,
  foto,
  last_login,
  created_at,
  updated_at
FROM users
    WHERE id_user = ?
    LIMIT 1
    `,
    [id_user]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| CREATE OWNER
|--------------------------------------------------------------------------
| Digunakan untuk membuat akun owner pertama.
|--------------------------------------------------------------------------
*/
const createOwner = async (data) => {
  const [result] = await pool.query(
    `
    INSERT INTO users
    (
      nama_lengkap,
      username,
      email,
      no_hp,
      password,
      role,
      status_akun
    )
    VALUES (?, ?, ?, ?, ?, 'owner', 'aktif')
    `,
    [
      data.nama_lengkap,
      data.username,
      data.email,
      data.no_hp || null,
      data.password
    ]
  )

  return {
    id_user: result.insertId,
    nama_lengkap: data.nama_lengkap,
    username: data.username,
    email: data.email,
    no_hp: data.no_hp || null,
    role: "owner",
    status_akun: "aktif"
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE LAST LOGIN
|--------------------------------------------------------------------------
| Digunakan saat user berhasil login.
|--------------------------------------------------------------------------
*/
const updateLastLogin = async (id_user) => {
  const [result] = await pool.query(
    `
    UPDATE users
    SET last_login = NOW()
    WHERE id_user = ?
    `,
    [id_user]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| COUNT OWNER
|--------------------------------------------------------------------------
| Digunakan untuk membatasi agar owner pertama tidak dibuat berulang.
|--------------------------------------------------------------------------
*/
const countOwner = async () => {
  const [rows] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM users
    WHERE role = 'owner'
    `
  )

  return rows[0].total
}

module.exports = {
  findUserByUsernameOrEmail,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  createOwner,
  updateLastLogin,
  countOwner
}