const reportModel = require("./report.model");

/*
|--------------------------------------------------------------------------
| SAFE LIMIT
|--------------------------------------------------------------------------
*/
const safeLimit = (limit = 10) => {
  const value = Number(limit);
  if (Number.isNaN(value) || value <= 0) return 10;
  return Math.min(value, 100);
};

/*
|--------------------------------------------------------------------------
| GET CURRENT YEAR
|--------------------------------------------------------------------------
*/
const getCurrentYear = () => {
  return new Date().getFullYear();
};

/*
|--------------------------------------------------------------------------
| GET SUMMARY
|--------------------------------------------------------------------------
*/
const getSummary = async (query, currentUser) => {
  if (!currentUser) throw new Error("User tidak valid");

  const { start_date, end_date, store_id } = query;

  if (currentUser.role === "owner") {
    // Jika store_id diberikan, filter hanya untuk toko tersebut
    const idStore = store_id ? Number(store_id) : null;
    return await reportModel.getSummaryByOwner(
      currentUser.id_user,
      start_date,
      end_date,
      idStore
    );
  }

  if (currentUser.role === "admin") {
    if (!currentUser.id_store) {
      throw new Error("Admin belum terhubung dengan toko");
    }
    return await reportModel.getSummaryByStore(
      currentUser.id_store,
      start_date,
      end_date
    );
  }

  throw new Error("Anda tidak memiliki akses ke laporan");
};

/*
|--------------------------------------------------------------------------
| GET DAILY REPORT
|--------------------------------------------------------------------------
*/
const getDailyReport = async (query, currentUser) => {
  if (!currentUser) throw new Error("User tidak valid");

  const { start_date, end_date, store_id } = query;

  if (currentUser.role === "owner") {
    const idStore = store_id ? Number(store_id) : null;
    return await reportModel.getDailyByOwner(
      currentUser.id_user,
      start_date,
      end_date,
      idStore
    );
  }

  if (currentUser.role === "admin") {
    if (!currentUser.id_store) {
      throw new Error("Admin belum terhubung dengan toko");
    }
    return await reportModel.getDailyByStore(
      currentUser.id_store,
      start_date,
      end_date
    );
  }

  throw new Error("Anda tidak memiliki akses ke laporan harian");
};

/*
|--------------------------------------------------------------------------
| GET MONTHLY REPORT
|--------------------------------------------------------------------------
*/
const getMonthlyReport = async (query, currentUser) => {
  if (!currentUser) throw new Error("User tidak valid");

  const year = Number(query.year || getCurrentYear());
  if (Number.isNaN(year) || year < 2000) {
    throw new Error("Tahun tidak valid");
  }

  const { store_id } = query;

  if (currentUser.role === "owner") {
    const idStore = store_id ? Number(store_id) : null;
    return await reportModel.getMonthlyByOwner(
      currentUser.id_user,
      year,
      idStore
    );
  }

  if (currentUser.role === "admin") {
    if (!currentUser.id_store) {
      throw new Error("Admin belum terhubung dengan toko");
    }
    return await reportModel.getMonthlyByStore(
      currentUser.id_store,
      year
    );
  }

  throw new Error("Anda tidak memiliki akses ke laporan bulanan");
};

/*
|--------------------------------------------------------------------------
| GET TOP PRODUCTS
|--------------------------------------------------------------------------
*/
const getTopProducts = async (query, currentUser) => {
  if (!currentUser) throw new Error("User tidak valid");

  const { start_date, end_date, store_id } = query;
  const limit = safeLimit(query.limit || 10);

  if (currentUser.role === "owner") {
    const idStore = store_id ? Number(store_id) : null;
    return await reportModel.getTopProductsByOwner(
      currentUser.id_user,
      start_date,
      end_date,
      limit,
      idStore
    );
  }

  if (currentUser.role === "admin") {
    if (!currentUser.id_store) {
      throw new Error("Admin belum terhubung dengan toko");
    }
    return await reportModel.getTopProductsByStore(
      currentUser.id_store,
      start_date,
      end_date,
      limit
    );
  }

  throw new Error("Anda tidak memiliki akses ke produk terlaris");
};

/*
|--------------------------------------------------------------------------
| GET RECENT TRANSACTIONS
|--------------------------------------------------------------------------
*/
const getRecentTransactions = async (query, currentUser) => {
  if (!currentUser) throw new Error("User tidak valid");

  const limit = safeLimit(query.limit || 10);
  const { store_id } = query;

  if (currentUser.role === "owner") {
    const idStore = store_id ? Number(store_id) : null;
    return await reportModel.getRecentTransactionsByOwner(
      currentUser.id_user,
      limit,
      idStore
    );
  }

  if (currentUser.role === "admin") {
    if (!currentUser.id_store) {
      throw new Error("Admin belum terhubung dengan toko");
    }
    return await reportModel.getRecentTransactionsByStore(
      currentUser.id_store,
      limit
    );
  }

  throw new Error("Anda tidak memiliki akses ke transaksi terakhir");
};

/*
|--------------------------------------------------------------------------
| GET LOW STOCK PRODUCTS
|--------------------------------------------------------------------------
*/
const getLowStockProducts = async (query, currentUser) => {
  if (!currentUser) throw new Error("User tidak valid");

  const { store_id } = query;

  if (currentUser.role === "owner") {
    const idStore = store_id ? Number(store_id) : null;
    return await reportModel.getLowStockProductsByOwner(
      currentUser.id_user,
      idStore
    );
  }

  if (currentUser.role === "admin") {
    if (!currentUser.id_store) {
      throw new Error("Admin belum terhubung dengan toko");
    }
    return await reportModel.getLowStockProductsByStore(
      currentUser.id_store
    );
  }

  throw new Error("Anda tidak memiliki akses ke stok menipis");
};

/*
|--------------------------------------------------------------------------
| GET DASHBOARD REPORT
|--------------------------------------------------------------------------
*/
const getDashboardReport = async (query, currentUser) => {
  // Gabungkan semua laporan dengan filter store_id yang sama
  const summary = await getSummary(query, currentUser);
  const topProducts = await getTopProducts(
    {
      ...query,
      limit: query.limit_top_products || 5,
    },
    currentUser
  );
  const recentTransactions = await getRecentTransactions(
    {
      limit: query.limit_recent_transactions || 5,
      store_id: query.store_id, // teruskan store_id agar konsisten
    },
    currentUser
  );
  const lowStockProducts = await getLowStockProducts(
    { store_id: query.store_id },
    currentUser
  );

  return {
    summary,
    top_products: topProducts,
    recent_transactions: recentTransactions,
    low_stock_products: lowStockProducts,
  };
};

module.exports = {
  getSummary,
  getDailyReport,
  getMonthlyReport,
  getTopProducts,
  getRecentTransactions,
  getLowStockProducts,
  getDashboardReport,
};