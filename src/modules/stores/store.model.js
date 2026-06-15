
const pool = require("../../config/database")

/*
|--------------------------------------------------------------------------
| CREATE MODEL ERROR
|--------------------------------------------------------------------------
*/
const createModelError = (
  message,
  statusCode = 400,
  code = "STORE_ERROR",
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
| FIND STORES BY OWNER
|--------------------------------------------------------------------------
| Owner hanya dapat mengambil toko berdasarkan stores.id_owner.
|--------------------------------------------------------------------------
*/
const findByOwnerId = async (id_owner) => {
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
    INNER JOIN users u
      ON u.id_user = s.id_owner
    WHERE s.id_owner = ?
    ORDER BY s.id_store DESC
    `,
    [id_owner]
  )

  return rows
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID
|--------------------------------------------------------------------------
| Dipakai ketika akses toko belum diketahui.
| Pemeriksaan kepemilikan tetap dilakukan di service.
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
    INNER JOIN users u
      ON u.id_user = s.id_owner
    WHERE s.id_store = ?
    LIMIT 1
    `,
    [id_store]
  )

  return rows[0] || null
}

/*
|--------------------------------------------------------------------------
| FIND STORE BY ID AND OWNER
|--------------------------------------------------------------------------
| Query aman untuk memastikan toko benar-benar milik owner tertentu.
|--------------------------------------------------------------------------
*/
const findByIdAndOwner = async (
  id_store,
  id_owner
) => {
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
    INNER JOIN users u
      ON u.id_user = s.id_owner
    WHERE s.id_store = ?
      AND s.id_owner = ?
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
| FIND STORE BY NAME AND OWNER
|--------------------------------------------------------------------------
*/
const findByNameAndOwner = async (
  nama_toko,
  id_owner
) => {
  const [rows] = await pool.query(
    `
    SELECT
      id_store,
      id_owner,
      nama_toko
    FROM stores
    WHERE id_owner = ?
      AND LOWER(TRIM(nama_toko)) =
          LOWER(TRIM(?))
    LIMIT 1
    `,
    [
      id_owner,
      nama_toko
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
      sub.harga,
      sub.status_langganan,

      plan.nama_paket,
      plan.deskripsi,
      plan.durasi_hari,
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
| CREATE STORE WITH SUBSCRIPTION LIMIT
|--------------------------------------------------------------------------
| Owner tidak menggunakan users.id_store.
|
| Kepemilikan toko disimpan pada:
| stores.id_owner = users.id_user
|--------------------------------------------------------------------------
*/
const create = async (data) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    /*
    |--------------------------------------------------------------------------
    | LOCK OWNER
    |--------------------------------------------------------------------------
    */
    const [ownerRows] = await connection.query(
      `
      SELECT
        id_user,
        nama_lengkap,
        role,
        status_akun,
        email_verified_at
      FROM users
      WHERE id_user = ?
      LIMIT 1
      FOR UPDATE
      `,
      [data.id_owner]
    )

    const owner = ownerRows[0]

    if (!owner) {
      throw createModelError(
        "Owner tidak ditemukan",
        404,
        "OWNER_NOT_FOUND"
      )
    }

    if (owner.role !== "owner") {
      throw createModelError(
        "User tersebut bukan owner",
        403,
        "USER_NOT_OWNER"
      )
    }

    if (!owner.email_verified_at) {
      throw createModelError(
        "Email owner belum diverifikasi",
        403,
        "OWNER_EMAIL_NOT_VERIFIED"
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
        FOR UPDATE
        `,
        [data.id_owner]
      )

    const subscription =
      subscriptionRows[0]

    if (!subscription) {
      throw createModelError(
        "Anda tidak memiliki langganan aktif. Silakan aktifkan paket terlebih dahulu",
        403,
        "ACTIVE_SUBSCRIPTION_NOT_FOUND"
      )
    }

    /*
    |--------------------------------------------------------------------------
    | COUNT OWNER STORES
    |--------------------------------------------------------------------------
    */
    const [countRows] =
      await connection.query(
        `
        SELECT COUNT(*) AS total
        FROM stores
        WHERE id_owner = ?
        `,
        [data.id_owner]
      )

    const totalStore = Number(
      countRows[0]?.total || 0
    )

    const storeLimit = Number(
      subscription.batas_toko || 0
    )

    if (storeLimit <= 0) {
      throw createModelError(
        "Paket langganan tidak mengizinkan pembuatan toko",
        403,
        "STORE_NOT_ALLOWED",
        {
          nama_paket:
            subscription.nama_paket,
          total_toko:
            totalStore,
          batas_toko:
            storeLimit
        }
      )
    }

    if (totalStore >= storeLimit) {
      throw createModelError(
        `Batas toko pada paket ${subscription.nama_paket} telah tercapai. Maksimal ${storeLimit} toko`,
        403,
        "STORE_LIMIT_REACHED",
        {
          nama_paket:
            subscription.nama_paket,
          total_toko:
            totalStore,
          batas_toko:
            storeLimit,
          sisa_toko:
            0,
          tanggal_berakhir:
            subscription.tanggal_berakhir
        }
      )
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK DUPLICATE STORE NAME
    |--------------------------------------------------------------------------
    */
    const [existingStoreRows] =
      await connection.query(
        `
        SELECT
          id_store,
          id_owner,
          nama_toko
        FROM stores
        WHERE id_owner = ?
          AND LOWER(TRIM(nama_toko)) =
              LOWER(TRIM(?))
        LIMIT 1
        `,
        [
          data.id_owner,
          data.nama_toko
        ]
      )

    if (existingStoreRows.length > 0) {
      throw createModelError(
        "Nama toko sudah digunakan",
        409,
        "STORE_NAME_ALREADY_EXISTS"
      )
    }

    const finalNamaToko = String(
      data.nama_toko || ""
    ).trim()

    const finalAlamat = data.alamat
      ? String(data.alamat).trim()
      : null

    const finalNoHp = data.no_hp
      ? String(data.no_hp).trim()
      : null

    const finalEmail = data.email
      ? String(data.email)
          .trim()
          .toLowerCase()
      : null

    const finalLogo =
      data.logo || null

    const finalStatusToko =
      data.status_toko || "aktif"

    const finalPpnAktif =
      data.ppn_aktif === "ya"
        ? "ya"
        : "tidak"

    const finalPpnPersen =
      finalPpnAktif === "ya"
        ? Number(data.ppn_persen || 0)
        : 0

    /*
    |--------------------------------------------------------------------------
    | INSERT STORE
    |--------------------------------------------------------------------------
    */
    const [result] =
      await connection.query(
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
          finalNamaToko,
          finalAlamat,
          finalNoHp,
          finalEmail,
          finalLogo,
          finalStatusToko,
          finalPpnAktif,
          finalPpnPersen
        ]
      )

    const idStore = result.insertId

    /*
    |--------------------------------------------------------------------------
    | PENTING
    |--------------------------------------------------------------------------
    | Jangan memperbarui users.id_store milik owner.
    |
    | Owner bisa memiliki banyak toko melalui stores.id_owner.
    | users.id_store hanya digunakan oleh admin dan kasir.
    |--------------------------------------------------------------------------
    */

    await connection.commit()

    return {
      id_store:
        idStore,

      id_owner:
        Number(data.id_owner),

      nama_owner:
        owner.nama_lengkap,

      nama_toko:
        finalNamaToko,

      alamat:
        finalAlamat,

      no_hp:
        finalNoHp,

      email:
        finalEmail,

      logo:
        finalLogo,

      status_toko:
        finalStatusToko,

      ppn_aktif:
        finalPpnAktif,

      ppn_persen:
        finalPpnPersen,

      penggunaan_paket: {
        id_subscription:
          subscription.id_subscription,

        id_plan:
          subscription.id_plan,

        nama_paket:
          subscription.nama_paket,

        batas_toko:
          storeLimit,

        total_toko_sebelum:
          totalStore,

        total_toko_sekarang:
          totalStore + 1,

        sisa_toko: Math.max(
          storeLimit -
          (totalStore + 1),
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
      throw createModelError(
        "Nama toko sudah digunakan",
        409,
        "STORE_NAME_ALREADY_EXISTS"
      )
    }

    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE BY OWNER
|--------------------------------------------------------------------------
| UPDATE hanya berjalan jika id_store dan id_owner cocok.
|--------------------------------------------------------------------------
*/
const updateByOwner = async (
  id_store,
  id_owner,
  data
) => {
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
      ppn_persen = ?,
      updated_at = NOW()
    WHERE id_store = ?
      AND id_owner = ?
    `,
    [
      data.nama_toko,
      data.alamat || null,
      data.no_hp || null,
      data.email || null,
      data.logo || null,
      data.status_toko,
      data.ppn_aktif || "tidak",
      data.ppn_aktif === "ya"
        ? Number(data.ppn_persen || 0)
        : 0,
      id_store,
      id_owner
    ]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE LOGO BY OWNER
|--------------------------------------------------------------------------
*/
const updateLogoByOwner = async (
  id_store,
  id_owner,
  logo
) => {
  const [result] = await pool.query(
    `
    UPDATE stores
    SET
      logo = ?,
      updated_at = NOW()
    WHERE id_store = ?
      AND id_owner = ?
    `,
    [
      logo,
      id_store,
      id_owner
    ]
  )

  return result.affectedRows > 0
}

/*
|--------------------------------------------------------------------------
| DELETE STORE BY OWNER
|--------------------------------------------------------------------------
| Owner hanya dapat menghapus toko miliknya.
|--------------------------------------------------------------------------
*/
const removeByOwner = async (
  id_store,
  id_owner
) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [storeRows] =
      await connection.query(
        `
        SELECT
          id_store,
          id_owner
        FROM stores
        WHERE id_store = ?
          AND id_owner = ?
        LIMIT 1
        FOR UPDATE
        `,
        [
          id_store,
          id_owner
        ]
      )

    const store = storeRows[0]

    if (!store) {
      await connection.rollback()
      return false
    }

    /*
    |--------------------------------------------------------------------------
    | LEPASKAN ADMIN DAN KASIR DARI TOKO
    |--------------------------------------------------------------------------
    | Owner tetap memiliki users.id_store = NULL.
    |--------------------------------------------------------------------------
    */
    await connection.query(
      `
      UPDATE users
      SET
        id_store = NULL,
        updated_at = NOW()
      WHERE id_store = ?
        AND role IN ('admin', 'kasir')
      `,
      [id_store]
    )

    const [result] =
      await connection.query(
        `
        DELETE FROM stores
        WHERE id_store = ?
          AND id_owner = ?
        `,
        [
          id_store,
          id_owner
        ]
      )

    await connection.commit()

    return result.affectedRows > 0
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| ASSIGN STORE TO STAFF
|--------------------------------------------------------------------------
| Hanya admin atau kasir yang boleh diberikan id_store.
|--------------------------------------------------------------------------
*/
const assignStoreToStaff = async (
  id_user,
  id_store,
  id_owner
) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const [storeRows] =
      await connection.query(
        `
        SELECT
          id_store,
          id_owner
        FROM stores
        WHERE id_store = ?
          AND id_owner = ?
        LIMIT 1
        FOR UPDATE
        `,
        [
          id_store,
          id_owner
        ]
      )

    if (!storeRows[0]) {
      throw createModelError(
        "Toko tidak ditemukan atau bukan milik owner",
        404,
        "STORE_NOT_FOUND"
      )
    }

    const [result] =
      await connection.query(
        `
        UPDATE users
        SET
          id_store = ?,
          updated_at = NOW()
        WHERE id_user = ?
          AND role IN ('admin', 'kasir')
        `,
        [
          id_store,
          id_user
        ]
      )

    await connection.commit()

    return result.affectedRows > 0
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

/*
|--------------------------------------------------------------------------
| COUNT STORE BY OWNER
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

  return Number(
    rows[0]?.total || 0
  )
}

/*
|--------------------------------------------------------------------------
| GET STORE USAGE BY OWNER
|--------------------------------------------------------------------------
*/
const getStoreUsageByOwner = async (
  id_owner
) => {
  const [rows] = await pool.query(
    `
    SELECT
      sub.id_subscription,
      sub.id_plan,
      plan.nama_paket,
      plan.batas_toko,
      sub.tanggal_mulai,
      sub.tanggal_berakhir,

      (
        SELECT COUNT(*)
        FROM stores store_count
        WHERE store_count.id_owner =
              sub.id_owner
      ) AS total_toko

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

  const batasToko = Number(
    usage.batas_toko || 0
  )

  const totalToko = Number(
    usage.total_toko || 0
  )

  return {
    id_subscription:
      usage.id_subscription,

    id_plan:
      usage.id_plan,

    nama_paket:
      usage.nama_paket,

    batas_toko:
      batasToko,

    total_toko:
      totalToko,

    sisa_toko: Math.max(
      batasToko - totalToko,
      0
    ),

    tanggal_mulai:
      usage.tanggal_mulai,

    tanggal_berakhir:
      usage.tanggal_berakhir
  }
}

module.exports = {
  findByOwnerId,
  findById,
  findByIdAndOwner,
  findByNameAndOwner,

  findActiveSubscriptionByOwner,

  create,

  updateByOwner,
  updateLogoByOwner,
  removeByOwner,

  assignStoreToStaff,

  countByOwner,
  getStoreUsageByOwner
}
