const variantModel = require("./variant.model")
const productModel = require("../products/product.model")

/*
|--------------------------------------------------------------------------
| GET VARIANT GROUPS BY PRODUCT
|--------------------------------------------------------------------------
*/
const getGroupsByProduct = async (id_product) => {
  if (!id_product) {
    throw new Error("ID produk wajib diisi")
  }

  const product = await productModel.findById(id_product)

  if (!product) {
    throw new Error("Produk tidak ditemukan")
  }

  const groups = await variantModel.findGroupsByProduct(id_product)

  for (const group of groups) {
    group.options = await variantModel.findOptionsByGroup(
      group.id_variant_group
    )
  }

  return groups
}

/*
|--------------------------------------------------------------------------
| CREATE VARIANT GROUP
|--------------------------------------------------------------------------
*/
const createGroup = async (data) => {
  const {
    id_product,
    nama_group,
    min_select,
    max_select,
    status_group
  } = data

  if (!id_product) {
    throw new Error("Produk wajib dipilih")
  }

  const product = await productModel.findById(id_product)

  if (!product) {
    throw new Error("Produk tidak ditemukan")
  }

  if (!nama_group || !nama_group.trim()) {
    throw new Error("Nama group wajib diisi")
  }

  const min = Number(min_select ?? 1)
  const max = Number(max_select ?? 1)

  if (min < 0) {
    throw new Error("Minimum pilihan tidak valid")
  }

  if (max < min) {
    throw new Error("Maximum pilihan tidak boleh lebih kecil dari minimum")
  }

  const id = await variantModel.createGroup({
    id_product,
    nama_group: nama_group.trim(),
    min_select: min,
    max_select: max,
    status_group: status_group || "aktif"
  })

  return await variantModel.findGroupById(id)
}

/*
|--------------------------------------------------------------------------
| UPDATE VARIANT GROUP
|--------------------------------------------------------------------------
*/
const updateGroup = async (id_variant_group, data) => {
  if (!id_variant_group) {
    throw new Error("ID group wajib diisi")
  }

  const group = await variantModel.findGroupById(id_variant_group)

  if (!group) {
    throw new Error("Group varian tidak ditemukan")
  }

  const min = Number(data.min_select)
  const max = Number(data.max_select)

  if (min < 0) {
    throw new Error("Minimum pilihan tidak valid")
  }

  if (max < min) {
    throw new Error("Maximum pilihan tidak boleh lebih kecil dari minimum")
  }

  await variantModel.updateGroup(id_variant_group, {
    nama_group: data.nama_group.trim(),
    min_select: min,
    max_select: max,
    status_group: data.status_group
  })

  return await variantModel.findGroupById(id_variant_group)
}

/*
|--------------------------------------------------------------------------
| DELETE VARIANT GROUP
|--------------------------------------------------------------------------
*/
const deleteGroup = async (id_variant_group) => {
  if (!id_variant_group) {
    throw new Error("ID group wajib diisi")
  }

  const group = await variantModel.findGroupById(id_variant_group)

  if (!group) {
    throw new Error("Group varian tidak ditemukan")
  }

  await variantModel.deleteGroup(id_variant_group)

  return {
    message: "Group varian berhasil dihapus"
  }
}

/*
|--------------------------------------------------------------------------
| CREATE VARIANT OPTION
|--------------------------------------------------------------------------
*/
const createOption = async (data) => {
  const {
    id_variant_group,
    nama_option,
    tambahan_harga,
    status_option
  } = data

  if (!id_variant_group) {
    throw new Error("Group varian wajib dipilih")
  }

  const group = await variantModel.findGroupById(id_variant_group)

  if (!group) {
    throw new Error("Group varian tidak ditemukan")
  }

  if (!nama_option || !nama_option.trim()) {
    throw new Error("Nama pilihan wajib diisi")
  }

  const harga = Number(tambahan_harga || 0)

  if (harga < 0) {
    throw new Error("Tambahan harga tidak boleh negatif")
  }

  const id = await variantModel.createOption({
    id_variant_group,
    nama_option: nama_option.trim(),
    tambahan_harga: harga,
    status_option: status_option || "aktif"
  })

  return await variantModel.findOptionById(id)
}

/*
|--------------------------------------------------------------------------
| UPDATE VARIANT OPTION
|--------------------------------------------------------------------------
*/
const updateOption = async (id_variant_option, data) => {
  if (!id_variant_option) {
    throw new Error("ID pilihan varian wajib diisi")
  }

  const option = await variantModel.findOptionById(id_variant_option)

  if (!option) {
    throw new Error("Pilihan varian tidak ditemukan")
  }

  const harga = Number(data.tambahan_harga)

  if (harga < 0) {
    throw new Error("Tambahan harga tidak boleh negatif")
  }

  await variantModel.updateOption(id_variant_option, {
    nama_option: data.nama_option.trim(),
    tambahan_harga: harga,
    status_option: data.status_option
  })

  return await variantModel.findOptionById(id_variant_option)
}

/*
|--------------------------------------------------------------------------
| DELETE VARIANT OPTION
|--------------------------------------------------------------------------
*/
const deleteOption = async (id_variant_option) => {
  if (!id_variant_option) {
    throw new Error("ID pilihan varian wajib diisi")
  }

  const option = await variantModel.findOptionById(id_variant_option)

  if (!option) {
    throw new Error("Pilihan varian tidak ditemukan")
  }

  await variantModel.deleteOption(id_variant_option)

  return {
    message: "Pilihan varian berhasil dihapus"
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