const reportModel = require("./report.model")

/*
|--------------------------------------------------------------------------
| SAFE LIMIT
|--------------------------------------------------------------------------
*/
const safeLimit = (limit = 10) => {
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
| GET CURRENT YEAR
|--------------------------------------------------------------------------
*/
const getCurrentYear = () => {
  return new Date().getFullYear()
}

/*
|--------------------------------------------------------------------------
| PARSE STORE ID
|--------------------------------------------------------------------------
|
| id_store berasal dari query Flutter.
|
| Contoh:
|
| /reports/dashboard?id_store=2
|
|--------------------------------------------------------------------------
*/
const parseStoreId = (id_store) => {
  if (
    id_store === undefined ||
    id_store === null ||
    id_store === ""
  ) {
    return null
  }

  const storeId = Number(id_store)

  if (
    Number.isNaN(storeId) ||
    storeId <= 0
  ) {
    throw new Error(
      "ID outlet tidak valid"
    )
  }

  return Math.floor(storeId)
}

/*
|--------------------------------------------------------------------------
| GET OWNER STORE
|--------------------------------------------------------------------------
|
| Owner boleh:
|
| 1. Tidak memilih outlet
|    -> laporan semua outlet
|
| 2. Memilih outlet
|    -> laporan outlet tersebut
|
| Tetapi outlet harus benar-benar milik owner.
|
|--------------------------------------------------------------------------
*/
const resolveOwnerStore = async (
  query,
  currentUser
) => {
  const storeId =
    parseStoreId(
      query.id_store
    )

  /*
  |--------------------------------------------------------------------------
  | OWNER TANPA OUTLET
  |--------------------------------------------------------------------------
  */
  if (storeId === null) {
    return null
  }

  /*
  |--------------------------------------------------------------------------
  | CEK OUTLET MILIK OWNER
  |--------------------------------------------------------------------------
  */
  const isOwner =
    await reportModel.isStoreOwnedByOwner(
      storeId,
      currentUser.id_user
    )

  if (!isOwner) {
    throw new Error(
      "Outlet tidak ditemukan atau bukan milik Anda"
    )
  }

  return storeId
}

/*
|--------------------------------------------------------------------------
| RESOLVE STORE UNTUK REPORT
|--------------------------------------------------------------------------
|
| Return:
|
| owner + tidak pilih outlet
|     -> null
|
| owner + pilih outlet
|     -> id_store
|
| admin
|     -> currentUser.id_store
|
|--------------------------------------------------------------------------
*/
const resolveReportStore = async (
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
    return await resolveOwnerStore(
      query,
      currentUser
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
    if (
      !currentUser.id_store
    ) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return Number(
      currentUser.id_store
    )
  }

  throw new Error(
    "Anda tidak memiliki akses ke laporan"
  )
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
    |--------------------------------------------------------------------------
    | OWNER MEMILIH OUTLET
    |--------------------------------------------------------------------------
    */
    if (storeId !== null) {
      return await reportModel.getSummaryByStore(
        storeId,
        start_date,
        end_date
      )
    }

    /*
    |--------------------------------------------------------------------------
    | OWNER SEMUA OUTLET
    |--------------------------------------------------------------------------
    */
    return await reportModel.getSummaryByOwner(
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
    if (
      !currentUser.id_store
    ) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return await reportModel.getSummaryByStore(
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

    /*
    |--------------------------------------------------------------------------
    | OWNER -> OUTLET TERTENTU
    |--------------------------------------------------------------------------
    */
    if (storeId !== null) {
      return await reportModel.getDailyByStore(
        storeId,
        start_date,
        end_date
      )
    }

    /*
    |--------------------------------------------------------------------------
    | OWNER -> SEMUA OUTLET
    |--------------------------------------------------------------------------
    */
    return await reportModel.getDailyByOwner(
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
    if (
      !currentUser.id_store
    ) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return await reportModel.getDailyByStore(
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

    /*
    |--------------------------------------------------------------------------
    | OWNER -> OUTLET TERTENTU
    |--------------------------------------------------------------------------
    */
    if (storeId !== null) {
      return await reportModel.getMonthlyByStore(
        storeId,
        year
      )
    }

    /*
    |--------------------------------------------------------------------------
    | OWNER -> SEMUA OUTLET
    |--------------------------------------------------------------------------
    */
    return await reportModel.getMonthlyByOwner(
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
    if (
      !currentUser.id_store
    ) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return await reportModel.getMonthlyByStore(
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

    /*
    |--------------------------------------------------------------------------
    | OWNER -> OUTLET TERTENTU
    |--------------------------------------------------------------------------
    */
    if (storeId !== null) {
      return await reportModel.getTopProductsByStore(
        storeId,
        start_date,
        end_date,
        limit
      )
    }

    /*
    |--------------------------------------------------------------------------
    | OWNER -> SEMUA OUTLET
    |--------------------------------------------------------------------------
    */
    return await reportModel.getTopProductsByOwner(
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
    if (
      !currentUser.id_store
    ) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return await reportModel.getTopProductsByStore(
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

    /*
    |--------------------------------------------------------------------------
    | OWNER -> OUTLET TERTENTU
    |--------------------------------------------------------------------------
    */
    if (storeId !== null) {
      return await reportModel.getRecentTransactionsByStore(
        storeId,
        limit
      )
    }

    /*
    |--------------------------------------------------------------------------
    | OWNER -> SEMUA OUTLET
    |--------------------------------------------------------------------------
    */
    return await reportModel.getRecentTransactionsByOwner(
      currentUser.id_user,
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
    if (
      !currentUser.id_store
    ) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return await reportModel.getRecentTransactionsByStore(
      currentUser.id_store,
      limit
    )
  }

  throw new Error(
    "Anda tidak memiliki akses ke transaksi terakhir"
  )
}

/*
|--------------------------------------------------------------------------
| GET LOW STOCK PRODUCTS
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

    /*
    |--------------------------------------------------------------------------
    | OWNER -> OUTLET TERTENTU
    |--------------------------------------------------------------------------
    */
    if (storeId !== null) {
      return await reportModel.getLowStockProductsByStore(
        storeId
      )
    }

    /*
    |--------------------------------------------------------------------------
    | OWNER -> SEMUA OUTLET
    |--------------------------------------------------------------------------
    */
    return await reportModel.getLowStockProductsByOwner(
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
    if (
      !currentUser.id_store
    ) {
      throw new Error(
        "Admin belum terhubung dengan toko"
      )
    }

    return await reportModel.getLowStockProductsByStore(
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
  if (!currentUser) {
    throw new Error(
      "User tidak valid"
    )
  }

  /*
  |--------------------------------------------------------------------------
  | Pastikan outlet yang dikirim owner valid
  |--------------------------------------------------------------------------
  */
  const storeId =
    await resolveReportStore(
      query,
      currentUser
    )

  /*
  |--------------------------------------------------------------------------
  | Buat query dasar
  |--------------------------------------------------------------------------
  |
  | storeId tetap dipertahankan supaya:
  |
  | owner pilih outlet
  |     -> id_store = outlet tersebut
  |
  | owner semua outlet
  |     -> id_store tidak ada
  |
  | admin
  |     -> id_store milik admin
  |
  |--------------------------------------------------------------------------
  */
  const reportQuery = {
    ...query,
  }

  if (storeId !== null) {
    reportQuery.id_store =
      storeId
  } else {
    /*
    |--------------------------------------------------------------------------
    | Jika owner tidak memilih outlet,
    | jangan kirim id_store palsu.
    |--------------------------------------------------------------------------
    */
    delete reportQuery.id_store
  }

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */
  const summary =
    await getSummary(
      reportQuery,
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
        ...reportQuery,

        limit_top_products:
          query.limit_top_products ||
          5,

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
  */
  const recentTransactions =
    await getRecentTransactions(
      {
        ...reportQuery,

        limit_recent_transactions:
          query.limit_recent_transactions ||
          5,

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
      reportQuery,
      currentUser
    )

  /*
  |--------------------------------------------------------------------------
  | RESPONSE
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

    /*
    |--------------------------------------------------------------------------
    | Informasi outlet yang sedang digunakan
    |--------------------------------------------------------------------------
    |
    | Berguna untuk debugging/frontend.
    |
    |--------------------------------------------------------------------------
    */
    id_store:
      storeId,
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