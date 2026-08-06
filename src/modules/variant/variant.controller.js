const variantService = require("./variant.service")

/*
|--------------------------------------------------------------------------
| GET VARIANT BY PRODUCT
|--------------------------------------------------------------------------
*/
const getGroupsByProduct = async (req, res) => {
  try {
    const { id_product } = req.params

    const result = await variantService.getGroupsByProduct(id_product)

    return res.status(200).json({
      success: true,
      message: "Data varian berhasil diambil",
      data: result
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

/*
|--------------------------------------------------------------------------
| CREATE VARIANT GROUP
|--------------------------------------------------------------------------
*/
const createGroup = async (req, res) => {
  try {
    const result = await variantService.createGroup(req.body)

    return res.status(201).json({
      success: true,
      message: "Group varian berhasil ditambahkan",
      data: result
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE VARIANT GROUP
|--------------------------------------------------------------------------
*/
const updateGroup = async (req, res) => {
  try {
    const { id_variant_group } = req.params

    const result = await variantService.updateGroup(
      id_variant_group,
      req.body
    )

    return res.status(200).json({
      success: true,
      message: "Group varian berhasil diperbarui",
      data: result
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

/*
|--------------------------------------------------------------------------
| DELETE VARIANT GROUP
|--------------------------------------------------------------------------
*/
const deleteGroup = async (req, res) => {
  try {
    const { id_variant_group } = req.params

    const result = await variantService.deleteGroup(
      id_variant_group
    )

    return res.status(200).json({
      success: true,
      message: result.message
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

/*
|--------------------------------------------------------------------------
| CREATE VARIANT OPTION
|--------------------------------------------------------------------------
*/
const createOption = async (req, res) => {
  try {
    const result = await variantService.createOption(req.body)

    return res.status(201).json({
      success: true,
      message: "Pilihan varian berhasil ditambahkan",
      data: result
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE VARIANT OPTION
|--------------------------------------------------------------------------
*/
const updateOption = async (req, res) => {
  try {
    const { id_variant_option } = req.params

    const result = await variantService.updateOption(
      id_variant_option,
      req.body
    )

    return res.status(200).json({
      success: true,
      message: "Pilihan varian berhasil diperbarui",
      data: result
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

/*
|--------------------------------------------------------------------------
| DELETE VARIANT OPTION
|--------------------------------------------------------------------------
*/
const deleteOption = async (req, res) => {
  try {
    const { id_variant_option } = req.params

    const result = await variantService.deleteOption(
      id_variant_option
    )

    return res.status(200).json({
      success: true,
      message: result.message
    })
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    })
  }
}

module.exports = {
  getGroupsByProduct,

  createGroup,
  updateGroup,
  deleteGroup,

  createOption,
  updateOption,
  deleteOption
}