// subscription.service.js

const subscriptionModel = require("./subscription.model")

/*
|--------------------------------------------------------------------------
| GET PLANS
|--------------------------------------------------------------------------
*/
const getPlans = async () => {
  return await subscriptionModel.findActivePlans()
}

/*
|--------------------------------------------------------------------------
| GET OWNER ID FROM CURRENT USER
|--------------------------------------------------------------------------
| Untuk super_admin, kita gunakan id_user langsung sebagai owner (jika dia memiliki subscription).
| Untuk role lain, cari owner dari relasi toko.
|--------------------------------------------------------------------------
*/
const getOwnerIdFromCurrentUser = async (currentUser) => {
  if (!currentUser) throw new Error("User tidak valid")

  // Super_admin dianggap sebagai "owner" untuk subscription pribadinya
  if (currentUser.role === "super_admin") {
    return currentUser.id_user
  }

  if (currentUser.role === "owner") {
    return currentUser.id_user
  }

  // Admin/kasir cari owner dari store
  const idOwner = await subscriptionModel.getOwnerIdByUser(currentUser.id_user)
  if (!idOwner) throw new Error("Owner langganan tidak ditemukan")
  return idOwner
}

/*
|--------------------------------------------------------------------------
| GET MY SUBSCRIPTION
|--------------------------------------------------------------------------
| Super_admin dan owner bisa langsung melihat subscription berdasarkan id_user.
| Untuk admin/kasir, dicari melalui toko.
|--------------------------------------------------------------------------
*/
const getMySubscription = async (currentUser) => {
  const idOwner = await getOwnerIdFromCurrentUser(currentUser)
  await subscriptionModel.expireOldSubscriptions()
  const activeSubscription = await subscriptionModel.findActiveByOwner(idOwner)
  const latestSubscription = await subscriptionModel.findLatestByOwner(idOwner)
  return {
    is_active: !!activeSubscription,
    active_subscription: activeSubscription,
    latest_subscription: latestSubscription
  }
}

/*
|--------------------------------------------------------------------------
| CHECKOUT SUBSCRIPTION (HANYA OWNER)
|--------------------------------------------------------------------------
| Super_admin tidak diperbolehkan checkout untuk dirinya sendiri, hanya owner.
|--------------------------------------------------------------------------
*/
const checkoutSubscription = async (data, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat membuat langganan");
  }

  const {
    id_plan,
    jumlah_bulan = 1,
    metode_pembayaran,
    catatan,
  } = data;

  if (!id_plan) {
    throw new Error("ID paket langganan wajib diisi");
  }

  if (jumlah_bulan < 1) {
    throw new Error("Jumlah bulan minimal 1");
  }

  if (
    metode_pembayaran &&
    !["manual_transfer", "qris_manual"].includes(metode_pembayaran)
  ) {
    throw new Error("Metode pembayaran tidak valid");
  }

  await subscriptionModel.expireOldSubscriptions();

  const plan = await subscriptionModel.findPlanById(id_plan);

  if (!plan) {
    throw new Error("Paket langganan tidak ditemukan");
  }

  if (plan.status_paket !== "aktif") {
    throw new Error("Paket langganan sedang nonaktif");
  }

  // =====================================
  // Cek subscription aktif
  // =====================================
  const activeSubscription =
    await subscriptionModel.findActiveByOwner(currentUser.id_user);

  if (activeSubscription) {
    const activePlan =
      await subscriptionModel.findPlanById(activeSubscription.id_plan);

    if (!activePlan) {
      throw new Error("Paket aktif tidak ditemukan");
    }

    if (Number(plan.harga) <= Number(activePlan.harga)) {
      throw new Error(
        "Anda sudah memiliki langganan aktif. Untuk membeli paket baru, pilih paket yang lebih tinggi (upgrade) atau gunakan fitur perpanjangan."
      );
    }
  }

  // =====================================
  // Cek invoice pending
  // =====================================
  const pendingSubscription =
    await subscriptionModel.findPendingByOwner(currentUser.id_user);

  if (pendingSubscription) {
    throw new Error("Anda masih memiliki invoice langganan yang pending");
  }

  // =====================================
  // Buat checkout
  // Harga & diskon dihitung di MODEL
  // =====================================
  const subscription =
    await subscriptionModel.createCheckout({
      id_owner: currentUser.id_user,
      id_plan,
      jumlah_bulan,
      metode_pembayaran:
        metode_pembayaran || "manual_transfer",
      catatan:
        catatan ||
        (activeSubscription
          ? `Upgrade dari paket ${activeSubscription.nama_paket}`
          : null),
    });

  // =====================================
  // Response
  // =====================================
  return {
    ...subscription,

    plan: {
      id_plan: plan.id_plan,
      nama_paket: plan.nama_paket,
      durasi_hari: plan.durasi_hari,
      batas_toko: plan.batas_toko,
      batas_user: plan.batas_user,
      batas_produk: plan.batas_produk,
    },

    instruksi_pembayaran: {
      pesan:
        "Silakan lakukan pembayaran manual sesuai nominal invoice, lalu konfirmasi ke admin sistem.",
      nominal: subscription.harga, // harga setelah diskon
      kode_invoice: subscription.kode_invoice,
    },

    is_upgrade: !!activeSubscription,
  };
};

/*
|--------------------------------------------------------------------------
| ACTIVATE SUBSCRIPTION (DENGAN EXPIRE YANG LAMA)
|--------------------------------------------------------------------------
| Diperbaiki: mengizinkan super_admin dan owner.
| Super_admin tidak perlu cek kepemilikan.
| Owner tetap harus memiliki subscription tersebut.
|--------------------------------------------------------------------------
*/
const activateSubscription = async (id_subscription, currentUser) => {
  // 1. Validasi role
  if (!currentUser) throw new Error("User tidak valid")
  if (currentUser.role !== "owner" && currentUser.role !== "super_admin") {
    throw new Error("Hanya owner atau super_admin yang dapat mengaktifkan langganan")
  }
  if (!id_subscription) throw new Error("ID subscription wajib diisi")

  // 2. Ambil data subscription
  const subscription = await subscriptionModel.findById(id_subscription)
  if (!subscription) throw new Error("Subscription tidak ditemukan")

  // 3. Jika bukan super_admin, cek kepemilikan
  if (currentUser.role !== "super_admin") {
    if (Number(subscription.id_owner) !== Number(currentUser.id_user)) {
      throw new Error("Anda tidak memiliki akses ke subscription ini")
    }
  }

  // 4. Aktivasi subscription (model akan menonaktifkan yang lain)
  const result = await subscriptionModel.activateSubscription(id_subscription)
  return await subscriptionModel.findById(result.id_subscription)
}


/*
|--------------------------------------------------------------------------
| UPGRADE SUBSCRIPTION
|--------------------------------------------------------------------------
| Hanya owner. Super_admin tidak perlu, tapi jika ingin bisa ditambahkan.
|--------------------------------------------------------------------------
*/
const upgradeSubscription = async (id_subscription, data, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat melakukan upgrade");
  }

  const { new_plan_id, jumlah_bulan = 1 } = data;

  if (!new_plan_id) {
    throw new Error("ID plan baru wajib diisi");
  }

  if (jumlah_bulan < 1) {
    throw new Error("Jumlah bulan minimal 1");
  }

  console.log("========== UPGRADE ==========");

  const subscription = await subscriptionModel.findById(id_subscription);

  console.log("Subscription :", subscription);

  if (!subscription) {
    throw new Error("Subscription tidak ditemukan");
  }

  if (Number(subscription.id_owner) !== Number(currentUser.id_user)) {
    throw new Error("Anda tidak memiliki akses ke subscription ini");
  }

  if (subscription.status_langganan !== "aktif") {
    throw new Error("Hanya subscription aktif yang dapat di-upgrade");
  }

  const plan = await subscriptionModel.findPlanById(new_plan_id);

  console.log("Plan Baru :", plan);

  if (!plan) {
    throw new Error("Paket baru tidak ditemukan");
  }

  if (plan.status_paket !== "aktif") {
    throw new Error("Paket baru tidak aktif");
  }

  const currentPlan = await subscriptionModel.findPlanById(subscription.id_plan);

  console.log("Plan Lama :", currentPlan);

  console.log({
    currentSubscriptionId: subscription.id_subscription,
    currentPlanId: subscription.id_plan,
    currentPlanPrice: Number(currentPlan.harga),

    newPlanId: plan.id_plan,
    newPlanPrice: Number(plan.harga),

    isUpgrade: Number(plan.harga) > Number(currentPlan.harga)
  });

  if (Number(plan.harga) <= Number(currentPlan.harga)) {
    throw new Error("Upgrade hanya bisa ke paket dengan harga lebih tinggi");
  }

  const result = await subscriptionModel.upgradeSubscription(
    id_subscription,
    new_plan_id,
    jumlah_bulan
  );

  return result;
};

/*
|--------------------------------------------------------------------------
| EXTEND SUBSCRIPTION
|--------------------------------------------------------------------------
| Hanya owner.
|--------------------------------------------------------------------------
*/
const extendSubscription = async (id_subscription, data, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat memperpanjang langganan")
  }
  const { additional_months = 1, catatan } = data
  if (additional_months < 1) throw new Error("Tambahan bulan minimal 1")

  const subscription = await subscriptionModel.findById(id_subscription)
  if (!subscription) throw new Error("Subscription tidak ditemukan")
  if (Number(subscription.id_owner) !== Number(currentUser.id_user)) {
    throw new Error("Anda tidak memiliki akses ke subscription ini")
  }
  if (subscription.status_langganan !== "aktif") {
    throw new Error("Hanya subscription aktif yang dapat diperpanjang")
  }

  const result = await subscriptionModel.extendSubscription(
    id_subscription,
    additional_months,
    catatan
  )
  return result
}
const getAllSubscriptions = async () => {
  return await subscriptionModel.findAllByOwner(null);
};
/*
|--------------------------------------------------------------------------
| GET SUBSCRIPTION DETAIL BY ID (UNTUK SUPER_ADMIN)
|--------------------------------------------------------------------------
*/
const getSubscriptionById = async (id_subscription) => {
  if (!id_subscription) throw new Error("ID subscription wajib diisi");
  const subscription = await subscriptionModel.findById(id_subscription);
  if (!subscription) throw new Error("Subscription tidak ditemukan");
  return subscription;
};

/*
|--------------------------------------------------------------------------
| GET SUBSCRIPTIONS BY OWNER (UNTUK SUPER_ADMIN)
|--------------------------------------------------------------------------
| Super_admin dapat melihat daftar subscription milik owner tertentu.
|--------------------------------------------------------------------------
*/
const getSubscriptionsByOwner = async (id_owner, options = {}) => {
  if (!id_owner) throw new Error("ID owner wajib diisi");
  return await subscriptionModel.findAllByOwner(id_owner, options);
};

/*
|--------------------------------------------------------------------------
| ACTIVATE SUBSCRIPTION (SUPER_ADMIN BISA UNTUK SEMUA)
|--------------------------------------------------------------------------
| Super_admin dapat mengaktifkan subscription milik siapa pun.
|--------------------------------------------------------------------------
*/
const activateSubscriptionAsAdmin = async (id_subscription) => {
  if (!id_subscription) throw new Error("ID subscription wajib diisi");
  const subscription = await subscriptionModel.findById(id_subscription);
  if (!subscription) throw new Error("Subscription tidak ditemukan");
  await subscriptionModel.activateSubscription(id_subscription);
  return await subscriptionModel.findById(id_subscription);
};
const cancelSubscription = async (
  id_subscription,
  data,
  currentUser
) => {
  if (!currentUser) {
    throw new Error("User tidak valid");
  }

  if (
    currentUser.role !== "owner" &&
    currentUser.role !== "super_admin"
  ) {
    throw new Error(
      "Hanya owner atau super_admin yang dapat membatalkan invoice langganan"
    );
  }

  if (!id_subscription) {
    throw new Error("ID subscription wajib diisi");
  }

  const subscription =
    await subscriptionModel.findById(id_subscription);

  if (!subscription) {
    throw new Error("Subscription tidak ditemukan");
  }

  // owner hanya boleh membatalkan miliknya sendiri
  if (currentUser.role === "owner") {
    if (
      Number(subscription.id_owner) !==
      Number(currentUser.id_user)
    ) {
      throw new Error(
        "Anda tidak memiliki akses ke subscription ini"
      );
    }
  }

  if (subscription.status_langganan !== "pending") {
    throw new Error(
      "Hanya invoice pending yang dapat dibatalkan"
    );
  }

  const cancelled =
    await subscriptionModel.cancelSubscription(
      id_subscription,
      data?.catatan
    );

  if (!cancelled) {
    throw new Error(
      "Gagal membatalkan subscription"
    );
  }

  return {
    id_subscription: Number(id_subscription),
    status_langganan: "dibatalkan",
  };
};

/*
|--------------------------------------------------------------------------
| DELETE SUBSCRIPTION (SUPER_ADMIN)
|--------------------------------------------------------------------------
*/
const deleteSubscription = async (
  id_subscription,
  currentUser
) => {
  if (!currentUser) {
    throw new Error("User tidak valid");
  }

  if (currentUser.role !== "super_admin") {
    throw new Error(
      "Hanya super_admin yang dapat menghapus subscription"
    );
  }

  if (!id_subscription) {
    throw new Error("ID subscription wajib diisi");
  }

  const subscription =
    await subscriptionModel.findById(id_subscription);

  if (!subscription) {
    throw new Error("Subscription tidak ditemukan");
  }

  // hanya boleh menghapus pending / dibatalkan
  if (
    subscription.status_langganan !== "pending" &&
    subscription.status_langganan !== "dibatalkan"
  ) {
    throw new Error(
      "Hanya subscription pending atau dibatalkan yang dapat dihapus"
    );
  }

  const deleted =
    await subscriptionModel.deleteSubscription(
      id_subscription
    );

  if (!deleted) {
    throw new Error("Gagal menghapus subscription");
  }

  return {
    id_subscription: Number(id_subscription),
    deleted: true,
  };
};
module.exports = {
  getPlans,
  getMySubscription,
  checkoutSubscription,
  activateSubscription,
  cancelSubscription,
  upgradeSubscription,
  extendSubscription,

  // super admin
  getAllSubscriptions,
  getSubscriptionById,
  getSubscriptionsByOwner,
  activateSubscriptionAsAdmin,
  deleteSubscription, // <-- tambahkan
};