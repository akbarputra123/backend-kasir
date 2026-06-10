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
  if (!currentUser) {
    throw new Error("User tidak valid")
  }

  if (currentUser.role === "owner") {
    return currentUser.id_user
  }

  const idOwner = await subscriptionModel.getOwnerIdByUser(currentUser.id_user)

  if (!idOwner) {
    throw new Error("Owner langganan tidak ditemukan")
  }

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

  return {
    is_active: !!activeSubscription,
    active_subscription: activeSubscription,
    latest_subscription: latestSubscription
  }
}

/*
|--------------------------------------------------------------------------
| CHECKOUT SUBSCRIPTION
|--------------------------------------------------------------------------
*/
const checkoutSubscription = async (data, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Hanya owner yang dapat membuat langganan")
  }

  const { id_plan, metode_pembayaran, catatan } = data

  if (!id_plan) {
    throw new Error("ID paket langganan wajib diisi")
  }

  if (
    metode_pembayaran &&
    !["manual_transfer", "qris_manual"].includes(metode_pembayaran)
  ) {
    throw new Error("Metode pembayaran tidak valid")
  }

  await subscriptionModel.expireOldSubscriptions()

  const plan = await subscriptionModel.findPlanById(id_plan)

  if (!plan) {
    throw new Error("Paket langganan tidak ditemukan")
  }

  if (plan.status_paket !== "aktif") {
    throw new Error("Paket langganan sedang nonaktif")
  }

  const activeSubscription = await subscriptionModel.findActiveByOwner(
    currentUser.id_user
  )

  if (activeSubscription) {
    throw new Error("Anda masih memiliki langganan aktif")
  }

  const pendingSubscription = await subscriptionModel.findPendingByOwner(
    currentUser.id_user
  )

  if (pendingSubscription) {
    throw new Error("Anda masih memiliki invoice langganan yang pending")
  }

  const subscription = await subscriptionModel.createCheckout({
    id_owner: currentUser.id_user,
    id_plan,
    harga: plan.harga,
    metode_pembayaran: metode_pembayaran || "manual_transfer",
    catatan
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
      nominal: Number(plan.harga),
      kode_invoice: subscription.kode_invoice
    }
  }
}

/*
|--------------------------------------------------------------------------
| ACTIVATE SUBSCRIPTION
|--------------------------------------------------------------------------
| Untuk sementara endpoint ini dibuat untuk aktivasi manual.
| Nanti kalau role super_admin sudah ada, route-nya diganti khusus super_admin.
|--------------------------------------------------------------------------
*/
const activateSubscription = async (id_subscription, currentUser) => {
  if (!currentUser || currentUser.role !== "owner") {
    throw new Error("Untuk saat ini aktivasi hanya bisa dilakukan oleh owner saat testing")
  }

  if (!id_subscription) {
    throw new Error("ID subscription wajib diisi")
  }

  const subscription = await subscriptionModel.findById(id_subscription)

  if (!subscription) {
    throw new Error("Subscription tidak ditemukan")
  }

  if (Number(subscription.id_owner) !== Number(currentUser.id_user)) {
    throw new Error("Anda tidak memiliki akses ke subscription ini")
  }

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

  if (!id_subscription) {
    throw new Error("ID subscription wajib diisi")
  }

  const subscription = await subscriptionModel.findById(id_subscription)

  if (!subscription) {
    throw new Error("Subscription tidak ditemukan")
  }

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

  if (!cancelled) {
    throw new Error("Gagal membatalkan subscription")
  }

  return {
    id_subscription: Number(id_subscription),
    status_langganan: "dibatalkan"
  }
}

module.exports = {
  getPlans,
  getMySubscription,
  checkoutSubscription,
  activateSubscription,
  cancelSubscription
}