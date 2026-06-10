const receiptService = require("./receipt.service")
const { successResponse, errorResponse } = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| GET RECEIPT BY TRANSACTION
|--------------------------------------------------------------------------
*/
const getReceiptByTransaction = async (req, res) => {
  try {
    const receipt = await receiptService.getReceiptByTransaction(
      req.params.id_transaction,
      req.user
    )

    return successResponse(
      res,
      "Data struk berhasil diambil",
      receipt,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil data struk",
      400,
      error.message
    )
  }
}

module.exports = {
  getReceiptByTransaction
}