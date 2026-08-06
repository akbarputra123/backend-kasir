const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| VARIANT GROUP
|--------------------------------------------------------------------------
*/

/**
 * Ambil semua group berdasarkan produk
 */
const findGroupsByProduct = async (id_product) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_variant_group,
      id_product,
      nama_group,
      min_select,
      max_select,
      status_group,
      created_at,
      updated_at
    FROM variant_groups
    WHERE id_product = ?
    ORDER BY id_variant_group ASC
    `,
    [id_product]
  )

  return rows
}

/**
 * Ambil group berdasarkan id
 */
const findGroupById = async (id_variant_group) => {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM variant_groups
    WHERE id_variant_group = ?
    LIMIT 1
    `,
    [id_variant_group]
  )

  return rows[0] || null
}

/**
 * Tambah group
 */
const createGroup = async (data) => {
  const [result] = await pool.query(
    `
    INSERT INTO variant_groups
    (
      id_product,
      nama_group,
      min_select,
      max_select,
      status_group
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      data.id_product,
      data.nama_group,
      data.min_select ?? 1,
      data.max_select ?? 1,
      data.status_group ?? "aktif"
    ]
  )

  return result.insertId
}

/**
 * Update group
 */
const updateGroup = async (id_variant_group, data) => {
  await pool.query(
    `
    UPDATE variant_groups
    SET
      nama_group = ?,
      min_select = ?,
      max_select = ?,
      status_group = ?
    WHERE id_variant_group = ?
    `,
    [
      data.nama_group,
      data.min_select,
      data.max_select,
      data.status_group,
      id_variant_group
    ]
  )
}

/**
 * Hapus group
 */
const deleteGroup = async (id_variant_group) => {
  await pool.query(
    `
    DELETE FROM variant_groups
    WHERE id_variant_group = ?
    `,
    [id_variant_group]
  )
}

/*
|--------------------------------------------------------------------------
| VARIANT OPTION
|--------------------------------------------------------------------------
*/

/**
 * Semua option berdasarkan group
 */
const findOptionsByGroup = async (id_variant_group) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_variant_option,
      id_variant_group,
      nama_option,
      tambahan_harga,
      status_option,
      created_at,
      updated_at
    FROM variant_options
    WHERE id_variant_group = ?
    ORDER BY id_variant_option ASC
    `,
    [id_variant_group]
  )

  return rows
}

/**
 * Cari option berdasarkan id
 */
const findOptionById = async (id_variant_option) => {
  const [rows] = await pool.query(
    `
    SELECT
      vo.*,
      vg.nama_group,
      vg.id_product
    FROM variant_options vo
    INNER JOIN variant_groups vg
      ON vg.id_variant_group = vo.id_variant_group
    WHERE vo.id_variant_option = ?
    LIMIT 1
    `,
    [id_variant_option]
  )

  return rows[0] || null
}

/**
 * Tambah option
 */
const createOption = async (data) => {
  const [result] = await pool.query(
    `
    INSERT INTO variant_options
    (
      id_variant_group,
      nama_option,
      tambahan_harga,
      status_option
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      data.id_variant_group,
      data.nama_option,
      data.tambahan_harga ?? 0,
      data.status_option ?? "aktif"
    ]
  )

  return result.insertId
}

/**
 * Update option
 */
const updateOption = async (id_variant_option, data) => {
  await pool.query(
    `
    UPDATE variant_options
    SET
      nama_option = ?,
      tambahan_harga = ?,
      status_option = ?
    WHERE id_variant_option = ?
    `,
    [
      data.nama_option,
      data.tambahan_harga,
      data.status_option,
      id_variant_option
    ]
  )
}

/**
 * Hapus option
 */
const deleteOption = async (id_variant_option) => {
  await pool.query(
    `
    DELETE FROM variant_options
    WHERE id_variant_option = ?
    `,
    [id_variant_option]
  )
}

module.exports = {
  // GROUP
  findGroupsByProduct,
  findGroupById,
  createGroup,
  updateGroup,
  deleteGroup,

  // OPTION
  findOptionsByGroup,
  findOptionById,
  createOption,
  updateOption,
  deleteOption
}