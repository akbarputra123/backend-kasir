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
| CANCEL SUBSCRIPTION
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

module.exports = {
  getPlans,
  getMySubscription,
  checkoutSubscription,
  activateSubscription,
  cancelSubscription
}