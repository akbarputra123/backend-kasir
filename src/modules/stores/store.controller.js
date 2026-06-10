const storeService = require("./store.service")
const { successResponse, errorResponse } = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| GET ALL STORES
|--------------------------------------------------------------------------
*/
const getAllStores = async (req, res) => {
  try {
    const stores = await storeService.getAllStores()

    return successResponse(
      res,
      "Data toko berhasil diambil",
      stores,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil data toko",
      500,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET MY STORES
|--------------------------------------------------------------------------
*/
const getMyStores = async (req, res) => {
  try {
    const stores = await storeService.getMyStores(req.user)

    return successResponse(
      res,
      "Data toko saya berhasil diambil",
      stores,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil data toko saya",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET STORE BY ID
|--------------------------------------------------------------------------
*/
const getStoreById = async (req, res) => {
  try {
    const store = await storeService.getStoreById(req.params.id)

    return successResponse(
      res,
      "Detail toko berhasil diambil",
      store,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil detail toko",
      404,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CREATE STORE
|--------------------------------------------------------------------------
*/
const createStore = async (req, res) => {
  try {
    const store = await storeService.createStore(
      req.body,
      req.user
    )

    return successResponse(
      res,
      "Toko berhasil ditambahkan",
      store,
      201
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menambahkan toko",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE
|--------------------------------------------------------------------------
*/
const updateStore = async (req, res) => {
  try {
    const store = await storeService.updateStore(
      req.params.id,
      req.body,
      req.user
    )

    return successResponse(
      res,
      "Toko berhasil diperbarui",
      store,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal memperbarui toko",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE LOGO
|--------------------------------------------------------------------------
*/
const updateStoreLogo = async (req, res) => {
  try {
    const logo = req.file ? `/uploads/stores/${req.file.filename}` : req.body.logo

    const store = await storeService.updateStoreLogo(
      req.params.id,
      logo,
      req.user
    )

    return successResponse(
      res,
      "Logo toko berhasil diperbarui",
      store,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal memperbarui logo toko",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| DELETE STORE
|--------------------------------------------------------------------------
*/
const deleteStore = async (req, res) => {
  try {
    const result = await storeService.deleteStore(
      req.params.id,
      req.user
    )

    return successResponse(
      res,
      "Toko berhasil dihapus",
      result,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menghapus toko",
      400,
      error.message
    )
  }
}

module.exports = {
  getAllStores,
  getMyStores,
  getStoreById,
  createStore,
  updateStore,
  updateStoreLogo,
  deleteStore
}