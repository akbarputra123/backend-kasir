
const fs = require("fs")
const path = require("path")

const storeService = require("./store.service")

const {
  successResponse,
  errorResponse
} = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| BUILD LOGO PATH
|--------------------------------------------------------------------------
| Jika request membawa file dari multer, simpan path relatif:
| /uploads/stores/nama_file.png
|--------------------------------------------------------------------------
*/
const buildLogoPath = (req) => {
  if (req.file?.filename) {
    return `/uploads/stores/${req.file.filename}`
  }

  if (
    req.body?.logo &&
    String(req.body.logo).trim()
  ) {
    return String(req.body.logo).trim()
  }

  return null
}

/*
|--------------------------------------------------------------------------
| DELETE NEW UPLOADED FILE
|--------------------------------------------------------------------------
| Menghapus file baru apabila proses create/update gagal sehingga tidak
| meninggalkan file yatim di folder uploads.
|--------------------------------------------------------------------------
*/
const deleteUploadedFile = (req) => {
  if (!req.file?.filename) {
    return
  }

  const filePath = path.join(
    process.cwd(),
    "uploads",
    "stores",
    req.file.filename
  )

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath)
    } catch (error) {
      console.error(
        "Gagal menghapus file upload:",
        error.message
      )
    }
  }
}

/*
|--------------------------------------------------------------------------
| GET ERROR STATUS
|--------------------------------------------------------------------------
*/
const getErrorStatus = (
  error,
  fallbackStatus = 400
) => {
  return Number(
    error?.statusCode ||
    fallbackStatus
  )
}

/*
|--------------------------------------------------------------------------
| GET ALL STORES
|--------------------------------------------------------------------------
| Hanya owner.
| Service akan mengambil toko berdasarkan:
| stores.id_owner = req.user.id_user
|--------------------------------------------------------------------------
*/
const getAllStores = async (req, res) => {
  try {
    const stores =
      await storeService.getAllStores(
        req.user
      )

    return successResponse(
      res,
      "Data toko berhasil diambil",
      stores,
      200
    )
  } catch (error) {
    console.error(
      "GET ALL STORES ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Gagal mengambil data toko",
      getErrorStatus(error, 400),
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET MY STORES
|--------------------------------------------------------------------------
| Owner:
| - mendapatkan semua toko miliknya.
|
| Admin/kasir:
| - hanya mendapatkan toko yang terhubung melalui users.id_store.
|--------------------------------------------------------------------------
*/
const getMyStores = async (req, res) => {
  try {
    const stores =
      await storeService.getMyStores(
        req.user
      )

    return successResponse(
      res,
      "Data toko saya berhasil diambil",
      stores,
      200
    )
  } catch (error) {
    console.error(
      "GET MY STORES ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Gagal mengambil data toko saya",
      getErrorStatus(error, 400),
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET STORE BY ID
|--------------------------------------------------------------------------
| Service akan memastikan:
| - owner hanya melihat toko miliknya;
| - admin/kasir hanya melihat toko yang ditugaskan.
|--------------------------------------------------------------------------
*/
const getStoreById = async (req, res) => {
  try {
    const store =
      await storeService.getStoreById(
        req.params.id,
        req.user
      )

    return successResponse(
      res,
      "Detail toko berhasil diambil",
      store,
      200
    )
  } catch (error) {
    console.error(
      "GET STORE BY ID ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Gagal mengambil detail toko",
      getErrorStatus(error, 404),
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET MY STORE USAGE
|--------------------------------------------------------------------------
| Mengambil penggunaan batas toko dari paket langganan owner.
|--------------------------------------------------------------------------
*/
const getMyStoreUsage = async (
  req,
  res
) => {
  try {
    const usage =
      await storeService.getMyStoreUsage(
        req.user
      )

    return successResponse(
      res,
      "Penggunaan paket toko berhasil diambil",
      usage,
      200
    )
  } catch (error) {
    console.error(
      "GET STORE USAGE ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Gagal mengambil penggunaan paket toko",
      getErrorStatus(error, 400),
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CREATE STORE
|--------------------------------------------------------------------------
| Hanya owner.
|
| id_owner tidak diambil dari request body, tetapi dari JWT:
| req.user.id_user
|--------------------------------------------------------------------------
*/
const createStore = async (req, res) => {
  try {
    const logo = buildLogoPath(req)

    const store =
      await storeService.createStore(
        {
          ...req.body,
          logo
        },
        req.user
      )

    return successResponse(
      res,
      "Toko berhasil ditambahkan",
      store,
      201
    )
  } catch (error) {
    deleteUploadedFile(req)

    console.error(
      "CREATE STORE ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Gagal menambahkan toko",
      getErrorStatus(error, 400),
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE
|--------------------------------------------------------------------------
| Hanya owner pemilik toko yang dapat memperbarui toko.
|--------------------------------------------------------------------------
*/
const updateStore = async (req, res) => {
  try {
    const logo = buildLogoPath(req)

    const store =
      await storeService.updateStore(
        req.params.id,
        {
          ...req.body,
          logo
        },
        req.user
      )

    return successResponse(
      res,
      "Toko berhasil diperbarui",
      store,
      200
    )
  } catch (error) {
    deleteUploadedFile(req)

    console.error(
      "UPDATE STORE ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Gagal memperbarui toko",
      getErrorStatus(error, 400),
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE STORE LOGO
|--------------------------------------------------------------------------
| Hanya owner pemilik toko.
|--------------------------------------------------------------------------
*/
const updateStoreLogo = async (
  req,
  res
) => {
  try {
    const logo = buildLogoPath(req)

    if (!logo) {
      return errorResponse(
        res,
        "Logo toko wajib diisi",
        422,
        "Logo toko wajib diisi"
      )
    }

    const store =
      await storeService.updateStoreLogo(
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
    deleteUploadedFile(req)

    console.error(
      "UPDATE STORE LOGO ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Gagal memperbarui logo toko",
      getErrorStatus(error, 400),
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| DELETE STORE
|--------------------------------------------------------------------------
| Hanya owner pemilik toko.
|--------------------------------------------------------------------------
*/
const deleteStore = async (
  req,
  res
) => {
  try {
    const result =
      await storeService.deleteStore(
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
    console.error(
      "DELETE STORE ERROR:",
      error
    )

    return errorResponse(
      res,
      error.message ||
        "Gagal menghapus toko",
      getErrorStatus(error, 400),
      error.message
    )
  }
}

module.exports = {
  getAllStores,
  getMyStores,
  getStoreById,
  getMyStoreUsage,
  createStore,
  updateStore,
  updateStoreLogo,
  deleteStore
}
