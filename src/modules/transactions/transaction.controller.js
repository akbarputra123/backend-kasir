const transactionService = require("./transaction.service")
const { successResponse, errorResponse } = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| GET ALL TRANSACTIONS
|--------------------------------------------------------------------------
*/
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await transactionService.getAllTransactions(req.user)

    return successResponse(
      res,
      "Data transaksi berhasil diambil",
      transactions,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil data transaksi",
      500,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET TRANSACTION BY ID
|--------------------------------------------------------------------------
*/
const getTransactionById = async (req, res) => {
  try {
    const transaction = await transactionService.getTransactionById(
      req.params.id,
      req.user
    )

    return successResponse(
      res,
      "Detail transaksi berhasil diambil",
      transaction,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil detail transaksi",
      404,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CREATE TRANSACTION
|--------------------------------------------------------------------------
*/
const createTransaction = async (req, res) => {
  try {
    const transaction = await transactionService.createTransaction(
      req.body,
      req.user
    )

    return successResponse(
      res,
      "Transaksi berhasil disimpan",
      transaction,
      201
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menyimpan transaksi",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CANCEL TRANSACTION
|--------------------------------------------------------------------------
*/
const cancelTransaction = async (req, res) => {
  try {
    const result = await transactionService.cancelTransaction(
      req.params.id,
      req.body,
      req.user
    )

    return successResponse(
      res,
      "Transaksi berhasil dibatalkan",
      result,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal membatalkan transaksi",
      400,
      error.message
    )
  }
}

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  cancelTransaction
}