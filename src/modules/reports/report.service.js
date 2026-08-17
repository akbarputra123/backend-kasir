const reportModel = require("./report.model")

/*
|--------------------------------------------------------------------------
| SAFE LIMIT
|--------------------------------------------------------------------------
*/

const safeLimit = (
  limit = 10
) => {
  const value = Number(limit)

  if (
    Number.isNaN(value) ||
    value <= 0
  ) {
    return 10
  }

  return Math.min(
    Math.floor(value),
    100
  )
}

/*
|--------------------------------------------------------------------------
| CURRENT YEAR
|--------------------------------------------------------------------------
*/

const getCurrentYear = () => {
  return new Date().getFullYear()
}

/*
|--------------------------------------------------------------------------
| NORMALIZE STORE ID
|--------------------------------------------------------------------------
|
| Mengambil id_store dari query.
|
| Owner:
|   id_store ada  -> outlet tertentu
|   id_store kosong -> semua outlet
|
*/

const getRequestedStoreId = (
  query
) => {
  if (
    query.id_store === undefined ||
    query.id_store === null ||
    query.id_store === ""
  ) {
    return null
  }

  const storeId =
    Number(query.id_store)

  if (
    !Number.isInteger(storeId) ||
    storeId <= 0
  ) {
    throw new Error(
      "ID outlet tidak valid"
    )
  }

  return storeId
}

/*
|--------------------------------------------------------------------------
| RESOLVE STORE OWNER
|--------------------------------------------------------------------------
|
| Jika owner memilih outlet:
|   - cek outlet milik owner
|   - jika valid -> return id_store
|
| Jika tidak memilih:
|   - return null
|   - berarti semua outlet owner
|
*/

const resolveOwnerStore = async (
  query,
  currentUser
) => {
  const storeId =
    getRequestedStoreId(query)

  if (storeId === null) {
    return null
  }

  const owned =
    await reportModel
      .isStoreOwnedByOwner(
        storeId,
        currentUser.id_user
      )

  if (!owned) {
    throw new Error(
      "Outlet tidak ditemukan atau bukan milik Anda"
    )
  }

  return storeId
}

/*
|--------------------------------------------------------------------------
| GET SUMMARY
|--------------------------------------------------------------------------
*/

const getSummary = async (
  query,
  currentUser
) => {
  if (!currentUser) {
    throw new Error(
      "User tidak valid"
    )
  }

  const {
    start_date,
    end_date,
  } = query

  /*
  |--------------------------------------------------------------------------
  | OWNER
  |--------------------------------------------------------------------------
  */

  if (
    currentUser.role === "owner"
  ) {
    const storeId =
      await resolveOwnerStore(
        query,
        currentUser
      )

    /*
    |----------------------------------------------------------------------
    | OWNER + OUTLET
    |----------------------------------------------------------------------
    */

    if (storeId !== null) {
      return await reportModel
        .getSummaryByStore(
          storeId,
          start_date,
          end_date
        )
    }

    /*
    |----------------------------------------------------------------------
    | OWNER + SEMUA OUTLET
    |----------------------------------------------------------------------
    */

    return await reportModel
      .getSummaryByOwner(
        currentUser.id_user,
        start_date,
        end_date
      )
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN
  |--------------------------------------------------------------------------
  */

  if (
    currentUser.role === "admin"
  ) {
    if (!currentUser.id_store) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return await reportModel
      .getSummaryByStore(
        currentUser.id_store,
        start_date,
        end_date
      )
  }

  throw new Error(
    "Anda tidak memiliki akses ke laporan"
  )
}

/*
|--------------------------------------------------------------------------
| GET DAILY REPORT
|--------------------------------------------------------------------------
*/

const getDailyReport = async (
  query,
  currentUser
) => {
  if (!currentUser) {
    throw new Error(
      "User tidak valid"
    )
  }

  const {
    start_date,
    end_date,
  } = query

  /*
  |--------------------------------------------------------------------------
  | OWNER
  |--------------------------------------------------------------------------
  */

  if (
    currentUser.role === "owner"
  ) {
    const storeId =
      await resolveOwnerStore(
        query,
        currentUser
      )

    if (storeId !== null) {
      return await reportModel
        .getDailyByStore(
          storeId,
          start_date,
          end_date
        )
    }

    return await reportModel
      .getDailyByOwner(
        currentUser.id_user,
        start_date,
        end_date
      )
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN
  |--------------------------------------------------------------------------
  */

  if (
    currentUser.role === "admin"
  ) {
    if (!currentUser.id_store) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return await reportModel
      .getDailyByStore(
        currentUser.id_store,
        start_date,
        end_date
      )
  }

  throw new Error(
    "Anda tidak memiliki akses ke laporan harian"
  )
}

/*
|--------------------------------------------------------------------------
| GET MONTHLY REPORT
|--------------------------------------------------------------------------
*/

const getMonthlyReport = async (
  query,
  currentUser
) => {
  if (!currentUser) {
    throw new Error(
      "User tidak valid"
    )
  }

  const year = Number(
    query.year ||
      getCurrentYear()
  )

  if (
    Number.isNaN(year) ||
    year < 2000
  ) {
    throw new Error(
      "Tahun tidak valid"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | OWNER
  |--------------------------------------------------------------------------
  */

  if (
    currentUser.role === "owner"
  ) {
    const storeId =
      await resolveOwnerStore(
        query,
        currentUser
      )

    if (storeId !== null) {
      return await reportModel
        .getMonthlyByStore(
          storeId,
          year
        )
    }

    return await reportModel
      .getMonthlyByOwner(
        currentUser.id_user,
        year
      )
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN
  |--------------------------------------------------------------------------
  */

  if (
    currentUser.role === "admin"
  ) {
    if (!currentUser.id_store) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return await reportModel
      .getMonthlyByStore(
        currentUser.id_store,
        year
      )
  }

  throw new Error(
    "Anda tidak memiliki akses ke laporan bulanan"
  )
}

/*
|--------------------------------------------------------------------------
| GET TOP PRODUCTS
|--------------------------------------------------------------------------
*/

const getTopProducts = async (
  query,
  currentUser
) => {
  if (!currentUser) {
    throw new Error(
      "User tidak valid"
    )
  }

  const {
    start_date,
    end_date,
  } = query

  const limit = safeLimit(
    query.limit || 10
  )

  /*
  |--------------------------------------------------------------------------
  | OWNER
  |--------------------------------------------------------------------------
  */

  if (
    currentUser.role === "owner"
  ) {
    const storeId =
      await resolveOwnerStore(
        query,
        currentUser
      )

    if (storeId !== null) {
      return await reportModel
        .getTopProductsByStore(
          storeId,
          start_date,
          end_date,
          limit
        )
    }

    return await reportModel
      .getTopProductsByOwner(
        currentUser.id_user,
        start_date,
        end_date,
        limit
      )
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN
  |--------------------------------------------------------------------------
  */

  if (
    currentUser.role === "admin"
  ) {
    if (!currentUser.id_store) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return await reportModel
      .getTopProductsByStore(
        currentUser.id_store,
        start_date,
        end_date,
        limit
      )
  }

  throw new Error(
    "Anda tidak memiliki akses ke produk terlaris"
  )
}

/*
|--------------------------------------------------------------------------
| GET RECENT TRANSACTIONS
|--------------------------------------------------------------------------
*/

const getRecentTransactions = async (
  query,
  currentUser
) => {
  if (!currentUser) {
    throw new Error(
      "User tidak valid"
    )
  }

  const {
    start_date,
    end_date,
  } = query

  const limit = safeLimit(
    query.limit || 10
  )

  /*
  |--------------------------------------------------------------------------
  | OWNER
  |--------------------------------------------------------------------------
  */

  if (
    currentUser.role === "owner"
  ) {
    const storeId =
      await resolveOwnerStore(
        query,
        currentUser
      )

    if (storeId !== null) {
      return await reportModel
        .getRecentTransactionsByStore(
          storeId,
          start_date,
          end_date,
          limit
        )
    }

    return await reportModel
      .getRecentTransactionsByOwner(
        currentUser.id_user,
        start_date,
        end_date,
        limit
      )
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN
  |--------------------------------------------------------------------------
  */

  if (
    currentUser.role === "admin"
  ) {
    if (!currentUser.id_store) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return await reportModel
      .getRecentTransactionsByStore(
        currentUser.id_store,
        start_date,
        end_date,
        limit
      )
  }

  throw new Error(
    "Anda tidak memiliki akses ke transaksi terakhir"
  )
}

/*
|--------------------------------------------------------------------------
| GET LOW STOCK
|--------------------------------------------------------------------------
*/

const getLowStockProducts = async (
  query,
  currentUser
) => {
  if (!currentUser) {
    throw new Error(
      "User tidak valid"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | OWNER
  |--------------------------------------------------------------------------
  */

  if (
    currentUser.role === "owner"
  ) {
    const storeId =
      await resolveOwnerStore(
        query,
        currentUser
      )

    if (storeId !== null) {
      return await reportModel
        .getLowStockProductsByStore(
          storeId
        )
    }

    return await reportModel
      .getLowStockProductsByOwner(
        currentUser.id_user
      )
  }

  /*
  |--------------------------------------------------------------------------
  | ADMIN
  |--------------------------------------------------------------------------
  */

  if (
    currentUser.role === "admin"
  ) {
    if (!currentUser.id_store) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return await reportModel
      .getLowStockProductsByStore(
        currentUser.id_store
      )
  }

  throw new Error(
    "Anda tidak memiliki akses ke stok menipis"
  )
}

/*
|--------------------------------------------------------------------------
| GET DASHBOARD REPORT
|--------------------------------------------------------------------------
*/

const getDashboardReport = async (
  query,
  currentUser
) => {
  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const summary =
    await getSummary(
      query,
      currentUser
    )

  /*
  |--------------------------------------------------------------------------
  | TOP PRODUCTS
  |--------------------------------------------------------------------------
  */

  const topProducts =
    await getTopProducts(
      {
        ...query,

        limit:
          query.limit_top_products ||
          5,
      },
      currentUser
    )

  /*
  |--------------------------------------------------------------------------
  | RECENT TRANSACTIONS
  |--------------------------------------------------------------------------
  |
  | PENTING:
  | query asli tetap dibawa.
  | Jadi start_date, end_date,
  | dan id_store tidak hilang.
  |
  */

  const recentTransactions =
    await getRecentTransactions(
      {
        ...query,

        limit:
          query.limit_recent_transactions ||
          5,
      },
      currentUser
    )

  /*
  |--------------------------------------------------------------------------
  | LOW STOCK
  |--------------------------------------------------------------------------
  */

  const lowStockProducts =
    await getLowStockProducts(
      query,
      currentUser
    )

  /*
  |--------------------------------------------------------------------------
  | RESULT
  |--------------------------------------------------------------------------
  */

  return {
    summary,

    top_products:
      topProducts,

    recent_transactions:
      recentTransactions,

    low_stock_products:
      lowStockProducts,
  }
}

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
  getSummary,
  getDailyReport,
  getMonthlyReport,
  getTopProducts,
  getRecentTransactions,
  getLowStockProducts,
  getDashboardReport,
}