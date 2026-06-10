const subscriptionModel = require("../modules/subscriptions/subscription.model")
const { errorResponse } = require("../utils/response")

/*
|--------------------------------------------------------------------------
| SUBSCRIPTION MIDDLEWARE
|--------------------------------------------------------------------------
| Mengecek apakah owner dari user login punya langganan aktif.
|--------------------------------------------------------------------------
*/
const subscriptionMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(
        res,
        "User belum terautentikasi",
        401
      )
    }

    let idOwner = null

    if (req.user.role === "owner") {
      idOwner = req.user.id_user
    }

    if (req.user.role === "admin" || req.user.role === "kasir") {
      idOwner = await subscriptionModel.getOwnerIdByUser(req.user.id_user)
    }

    if (!idOwner) {
      return errorResponse(
        res,
        "Owner langganan tidak ditemukan",
        403
      )
    }

    await subscriptionModel.expireOldSubscriptions()

    const activeSubscription = await subscriptionModel.findActiveByOwner(idOwner)

    if (!activeSubscription) {
      return errorResponse(
        res,
        "Langganan belum aktif atau sudah expired. Silakan aktifkan langganan terlebih dahulu",
        403,
        {
          code: "SUBSCRIPTION_REQUIRED"
        }
      )
    }

    req.subscription = activeSubscription

    next()
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal memvalidasi langganan",
      500,
      error.message
    )
  }
}

module.exports = {
  subscriptionMiddleware
}