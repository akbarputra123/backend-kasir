const userService = require("./user.service")
const { successResponse, errorResponse } = require("../../utils/response")

/*
|--------------------------------------------------------------------------
| GET ALL USERS
|--------------------------------------------------------------------------
*/
const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers(req.user)

    return successResponse(
      res,
      "Data user berhasil diambil",
      users,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil data user",
      500,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| GET USER BY ID
|--------------------------------------------------------------------------
*/
const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(
      req.params.id,
      req.user
    )

    return successResponse(
      res,
      "Detail user berhasil diambil",
      user,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal mengambil detail user",
      404,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| CREATE USER
|--------------------------------------------------------------------------
*/
const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(
      req.body,
      req.user
    )

    return successResponse(
      res,
      "User berhasil ditambahkan",
      user,
      201
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menambahkan user",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
*/
const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.body,
      req.user
    )

    return successResponse(
      res,
      "User berhasil diperbarui",
      user,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal memperbarui user",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE USER PASSWORD
|--------------------------------------------------------------------------
*/
const updateUserPassword = async (req, res) => {
  try {
    const result = await userService.updateUserPassword(
      req.params.id,
      req.body,
      req.user
    )

    return successResponse(
      res,
      "Password user berhasil diperbarui",
      result,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal memperbarui password user",
      400,
      error.message
    )
  }
}

/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
*/
const deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(
      req.params.id,
      req.user
    )

    return successResponse(
      res,
      "User berhasil dihapus",
      result,
      200
    )
  } catch (error) {
    return errorResponse(
      res,
      error.message || "Gagal menghapus user",
      400,
      error.message
    )
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser
}