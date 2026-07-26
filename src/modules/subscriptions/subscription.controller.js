// subscription.controller.js

const subscriptionService = require("./subscription.service")
const { successResponse, errorResponse } = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| GET PLANS
|--------------------------------------------------------------------------
*/
const getPlans = async (req, res) => {
  try {
    const plans = await subscriptionService.getPlans()
    return successResponse(
      res,
      "Data paket langganan berhasil diambil",
      plans,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil paket langganan",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET MY SUBSCRIPTION
|--------------------------------------------------------------------------
*/
const getMySubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.getMySubscription(req.user)
    return successResponse(
      res,
      "Data langganan berhasil diambil",
      subscription,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil data langganan",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CHECKOUT SUBSCRIPTION
|--------------------------------------------------------------------------
| Body: { id_plan, jumlah_bulan?, metode_pembayaran?, catatan? }
|--------------------------------------------------------------------------
*/
const checkoutSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.checkoutSubscription(
      req.body,
      req.user
    )
    return successResponse(
      res,
      "Checkout langganan berhasil dibuat",
      subscription,
      201
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal membuat checkout langganan",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| ACTIVATE SUBSCRIPTION
|--------------------------------------------------------------------------
*/
const activateSubscription = async (req, res) => {
  try {
    const subscription = await subscriptionService.activateSubscription(
      req.params.id_subscription,
      req.user
    )
    return successResponse(
      res,
      "Langganan berhasil diaktifkan",
      subscription,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengaktifkan langganan",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CANCEL SUBSCRIPTION (HANYA PENDING)
|--------------------------------------------------------------------------
| Body: { catatan? }
|--------------------------------------------------------------------------
*/
const cancelSubscription = async (req, res) => {
  try {
    const result = await subscriptionService.cancelSubscription(
      req.params.id_subscription,
      req.body,
      req.user
    )
    return successResponse(
      res,
      "Langganan berhasil dibatalkan",
      result,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal membatalkan langganan",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| UPGRADE SUBSCRIPTION (GUNAKAN ID SUBSCRIPTION AKTIF)
|--------------------------------------------------------------------------
| Body: { new_plan_id, jumlah_bulan? }
|--------------------------------------------------------------------------
*/
const upgradeSubscription = async (req, res) => {
  try {
    const result = await subscriptionService.upgradeSubscription(
      req.params.id_subscription,
      req.body,
      req.user
    )
    return successResponse(
      res,
      "Langganan berhasil di-upgrade",
      result,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal melakukan upgrade langganan",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| EXTEND SUBSCRIPTION (TAMBAH BULAN KE MASA AKTIF)
|--------------------------------------------------------------------------
| Body: { additional_months, catatan? }
|--------------------------------------------------------------------------
*/
const extendSubscription = async (req, res) => {
  try {
    const result = await subscriptionService.extendSubscription(
      req.params.id_subscription,
      req.body,
      req.user
    )
    return successResponse(
      res,
      "Langganan berhasil diperpanjang",
      result,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal memperpanjang langganan",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET ALL SUBSCRIPTIONS (UNTUK SUPER_ADMIN)
|--------------------------------------------------------------------------
| Query params: ?limit=10&offset=0&status=aktif
|--------------------------------------------------------------------------
*/
const getAllSubscriptions = async (req, res) => {
  try {
    const { limit = 10, offset = 0, status } = req.query;
    const result = await subscriptionService.getAllSubscriptions(
      req.user,
      { limit: parseInt(limit), offset: parseInt(offset), status }
    );
    return successResponse(
      res,
      'Data semua subscription berhasil diambil',
      result,
      200
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Gagal mengambil data subscription',
      400,
      error.message
    );
  }
};

/*
|--------------------------------------------------------------------------
| GET SUBSCRIPTION BY INVOICE
|--------------------------------------------------------------------------
| Path: /api/subscriptions/invoice/:kode_invoice
|--------------------------------------------------------------------------
*/
const getSubscriptionByInvoice = async (req, res) => {
  try {
    const { kode_invoice } = req.params;
    const subscription = await subscriptionService.getSubscriptionByInvoice(
      kode_invoice,
      req.user
    );
    return successResponse(
      res,
      'Data subscription berhasil diambil',
      subscription,
      200
    );
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Gagal mengambil data subscription',
      400,
      error.message
    );
  }
};

// ============================================================
// EXPORT
// ============================================================
module.exports = {
  getPlans,
  getMySubscription,
  checkoutSubscription,
  activateSubscription,
  cancelSubscription,
  upgradeSubscription,
  extendSubscription,
  getAllSubscriptions,        // sudah benar
  getSubscriptionByInvoice    // sudah benar
};