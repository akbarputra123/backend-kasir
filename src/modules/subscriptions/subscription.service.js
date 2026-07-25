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
*/
const getOwnerIdFromCurrentUser = async (currentUser) => {
  if (!currentUser) throw new Error("User tidak valid")
  if (currentUser.role === "owner") return currentUser.id_user
  const idOwner = await subscriptionModel.getOwnerIdByUser(currentUser.id_user)
  if (!idOwner) throw new Error("Owner langganan tidak ditemukan")
  return idOwner
}

/*
|--------------------------------------------------------------------------
| GET MY SUBSCRIPTION
|--------------------------------------------------------------------------
*/
const getMySubscription = async (currentUser) => {
  const idOwner = await getOwnerIdFromCurrentUser(currentUser)
  await subscriptionModel.expireOldSubscriptions()
  const activeSubscription = await subscriptionModel.findActiveByOwner(idOwner)
  const latestSubscription = await subscriptionModel.findLatestByOwner(idOwner)
  // Tambahkan informasi jumlah_bulan pada active dan latest
  return {
    is_active: !!activeSubscription,
    active_subscription: activeSubscription,
    latest_subscription: latestSubscription
  }
}

/*
|--------------------------------------------------------------------------
| CHECKOUT SUBSCRIPTION (DENGAN DUKUNGAN JUMLAH_BULAN DAN UPGRADE)
|--------------------------------------------------------------------------
*/
const checkoutSubscription = async (data, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat membuat langganan")
  }

  const { id_plan, jumlah_bulan = 1, metode_pembayaran, catatan } = data
  if (!id_plan) throw new Error("ID paket langganan wajib diisi")
  if (jumlah_bulan < 1) throw new Error("Jumlah bulan minimal 1")
  if (metode_pembayaran && !["manual_transfer", "qris_manual"].includes(metode_pembayaran)) {
    throw new Error("Metode pembayaran tidak valid")
  }

  await subscriptionModel.expireOldSubscriptions()

  const plan = await subscriptionModel.findPlanById(id_plan)
  if (!plan) throw new Error("Paket langganan tidak ditemukan")
  if (plan.status_paket !== "aktif") throw new Error("Paket langganan sedang nonaktif")

  // Hitung total harga
  const totalHarga = plan.harga * jumlah_bulan

  // Cek subscription aktif
  const activeSubscription = await subscriptionModel.findActiveByOwner(currentUser.id_user)

  // Jika ada subscription aktif, periksa apakah ini upgrade ke yang lebih mahal
  if (activeSubscription) {
    const activePlan = await subscriptionModel.findPlanById(activeSubscription.id_plan)
    if (!activePlan) throw new Error("Paket aktif tidak ditemukan")
    // Hanya izinkan upgrade jika harga baru > harga lama (atau bisa juga jika plan berbeda)
    // Kita bisa memilih: jika plan sama, maka ini perpanjangan, tetapi kita punya endpoint tersendiri untuk perpanjangan.
    // Untuk checkout, kita anggap sebagai pembelian baru. Jika ada aktif, kita anggap upgrade.
    // Tapi kita izinkan upgrade ke plan yang lebih tinggi (harga >), atau ke plan yang sama? Lebih baik kita batasi upgrade ke plan yang lebih tinggi.
    // Namun user mungkin ingin membeli paket yang sama untuk perpanjang, tapi kita punya extend, jadi di checkout kita tolak jika plan sama atau lebih rendah.
    if (plan.harga <= activePlan.harga) {
      throw new Error("Anda sudah memiliki langganan aktif. Untuk membeli paket baru, pilih paket yang lebih tinggi (upgrade) atau gunakan fitur perpanjangan.")
    }
    // Lolos: ini upgrade
  }

  // Cek pending invoice
  const pendingSubscription = await subscriptionModel.findPendingByOwner(currentUser.id_user)
  if (pendingSubscription) {
    throw new Error("Anda masih memiliki invoice langganan yang pending")
  }

  // Buat subscription baru dengan jumlah_bulan
  const subscription = await subscriptionModel.createCheckout({
    id_owner: currentUser.id_user,
    id_plan,
    jumlah_bulan,
    harga: totalHarga, // model akan menghitung sendiri? Di createCheckout kita passing harga total, tapi model juga menghitung ulang? Lebih baik kita lewatkan totalHarga, dan model menyimpannya.
    metode_pembayaran: metode_pembayaran || "manual_transfer",
    catatan: catatan || (activeSubscription ? `Upgrade dari paket ${activeSubscription.nama_paket}` : null)
  })

  return {
    ...subscription,
    plan: {
      id_plan: plan.id_plan,
      nama_paket: plan.nama_paket,
      durasi_hari: plan.durasi_hari,
      batas_toko: plan.batas_toko,
      batas_user: plan.batas_user,
      batas_produk: plan.batas_produk
    },
    instruksi_pembayaran: {
      pesan: "Silakan lakukan pembayaran manual sesuai nominal invoice, lalu konfirmasi ke admin sistem.",
      nominal: Number(totalHarga),
      kode_invoice: subscription.kode_invoice
    },
    is_upgrade: !!activeSubscription   // tambahkan flag
  }
}

/*
|--------------------------------------------------------------------------
| ACTIVATE SUBSCRIPTION (DENGAN EXPIRE YANG LAMA)
|--------------------------------------------------------------------------
*/
const activateSubscription = async (id_subscription, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Untuk saat ini aktivasi hanya bisa dilakukan oleh owner saat testing")
  }
  if (!id_subscription) throw new Error("ID subscription wajib diisi")

  const subscription = await subscriptionModel.findById(id_subscription)
  if (!subscription) throw new Error("Subscription tidak ditemukan")
  if (Number(subscription.id_owner) !== Number(currentUser.id_user)) {
    throw new Error("Anda tidak memiliki akses ke subscription ini")
  }

  // Aktivasi subscription baru (di dalam model sudah menonaktifkan yang lain)
  const result = await subscriptionModel.activateSubscription(id_subscription)
  return await subscriptionModel.findById(result.id_subscription)
}

/*
|--------------------------------------------------------------------------
| CANCEL SUBSCRIPTION
|--------------------------------------------------------------------------
*/
const cancelSubscription = async (id_subscription, data, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat membatalkan invoice langganan")
  }
  if (!id_subscription) throw new Error("ID subscription wajib diisi")

  const subscription = await subscriptionModel.findById(id_subscription)
  if (!subscription) throw new Error("Subscription tidak ditemukan")
  if (Number(subscription.id_owner) !== Number(currentUser.id_user)) {
    throw new Error("Anda tidak memiliki akses ke subscription ini")
  }
  if (subscription.status_langganan !== "pending") {
    throw new Error("Hanya invoice pending yang dapat dibatalkan")
  }

  const cancelled = await subscriptionModel.cancelSubscription(
    id_subscription,
    data.catatan
  )
  if (!cancelled) throw new Error("Gagal membatalkan subscription")

  return {
    id_subscription: Number(id_subscription),
    status_langganan: "dibatalkan"
  }
}

/*
|--------------------------------------------------------------------------
| UPGRADE SUBSCRIPTION (GANTI PLAN DAN JUMLAH BULAN, RESET TANGGAL)
|--------------------------------------------------------------------------
*/
const upgradeSubscription = async (id_subscription, data, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat melakukan upgrade")
  }
  const { new_plan_id, jumlah_bulan = 1 } = data
  if (!new_plan_id) throw new Error("ID plan baru wajib diisi")
  if (jumlah_bulan < 1) throw new Error("Jumlah bulan minimal 1")

  const subscription = await subscriptionModel.findById(id_subscription)
  if (!subscription) throw new Error("Subscription tidak ditemukan")
  if (Number(subscription.id_owner) !== Number(currentUser.id_user)) {
    throw new Error("Anda tidak memiliki akses ke subscription ini")
  }
  if (subscription.status_langganan !== "aktif") {
    throw new Error("Hanya subscription aktif yang dapat di-upgrade")
  }

  // Cek plan baru
  const plan = await subscriptionModel.findPlanById(new_plan_id)
  if (!plan) throw new Error("Paket baru tidak ditemukan")
  if (plan.status_paket !== "aktif") throw new Error("Paket baru tidak aktif")

  // Opsional: pastikan plan baru lebih tinggi (harga >)
  const currentPlan = await subscriptionModel.findPlanById(subscription.id_plan)
  if (plan.harga <= currentPlan.harga) {
    throw new Error("Upgrade hanya bisa ke paket dengan harga lebih tinggi")
  }

  // Lakukan upgrade di model
  const result = await subscriptionModel.upgradeSubscription(
    id_subscription,
    new_plan_id,
    jumlah_bulan
  )
  return result
}

/*
|--------------------------------------------------------------------------
| EXTEND SUBSCRIPTION (TAMBAH BULAN KE MASA AKTIF)
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

  // Cek apakah subscription sudah expired? Model akan menangani
  const result = await subscriptionModel.extendSubscription(
    id_subscription,
    additional_months,
    catatan
  )
  return result
}

module.exports = {
  getPlans,
  getMySubscription,
  checkoutSubscription,
  activateSubscription,
  cancelSubscription,
  upgradeSubscription,
  extendSubscription
}