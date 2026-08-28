const { db } = require("../../config/firebase");
const { FieldValue } = require("firebase-admin/firestore");

// ----------------------------
// KONSTANTA KOLEKSI
// ----------------------------
const NOTIFICATIONS_COLLECTION = "notifications";

// ----------------------------
// UTILITY
// ----------------------------
const parsePositiveInt = (value, fallback, max = null) => {
  let number = Number.parseInt(value, 10);
  if (!Number.isInteger(number) || number < 0) {
    number = fallback;
  }
  if (max !== null && number > max) {
    number = max;
  }
  return number;
};

const parseLimit = (value, fallback = 20) => {
  return parsePositiveInt(value, fallback, 100);
};

const parseOffset = (value, fallback = 0) => {
  return parsePositiveInt(value, fallback);
};

/**
 * Format tanggal ke string dengan timezone WIT (Asia/Jayapura)
 * Digunakan untuk menampilkan waktu di Maluku Utara & Papua
 */
const formatToWIT = (date) => {
  if (!date) return null;
  if (typeof date === "string") date = new Date(date);
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;
  return date.toLocaleString("id-ID", {
    timeZone: "Asia/Jayapura",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// ----------------------------
// NOTIFICATIONS (FIRESTORE)
// ----------------------------

/**
 * Konversi dokumen Firestore ke object notifikasi
 * Menambahkan field created_at_wit dan read_at_wit untuk zona WIT
 */
const docToNotification = (doc) => {
  const data = doc.data();
  const createdAt = data.created_at ? data.created_at.toDate() : null;
  const readAt = data.read_at ? data.read_at.toDate() : null;

  return {
    id_notification: doc.id,
    id_user: data.id_user,
    id_store: data.id_store === "__global__" ? null : data.id_store,
    tipe: data.tipe,
    judul: data.judul,
    pesan: data.pesan,
    reference_type: data.reference_type || null,
    reference_id: data.reference_id || null,
    is_read: data.is_read || false,
    read_at: readAt ? readAt.toISOString() : null,
    created_at: createdAt ? createdAt.toISOString() : null,
    // Tambahan field dengan format WIT
    created_at_wit: createdAt ? formatToWIT(createdAt) : null,
    read_at_wit: readAt ? formatToWIT(readAt) : null,
  };
};

/**
 * Bangun query dasar notifikasi dengan filter
 */
const buildNotificationQuery = (baseQuery, { idUser, idStore = null, isRead = null }) => {
  let query = baseQuery.where("id_user", "==", idUser);
  if (idStore !== null && idStore !== undefined) {
    query = query.where("id_store", "in", [idStore, "__global__"]);
  }
  if (isRead !== null) {
    query = query.where("is_read", "==", isRead);
  }
  return query;
};

// --- CRUD Notifications ---

const findAllByUser = async ({ idUser, idStore = null, limit = 20, offset = 0 }) => {
  const safeLimit = parseLimit(limit);
  const safeOffset = parseOffset(offset);

  let query = db.collection(NOTIFICATIONS_COLLECTION);
  query = buildNotificationQuery(query, { idUser, idStore });
  query = query.orderBy("created_at", "desc");

  const snapshot = await query.limit(safeOffset + safeLimit).get();
  const docs = snapshot.docs.slice(safeOffset);
  return docs.map(docToNotification);
};

const findUnreadByUser = async ({ idUser, idStore = null, limit = 20, offset = 0 }) => {
  const safeLimit = parseLimit(limit);
  const safeOffset = parseOffset(offset);

  let query = db.collection(NOTIFICATIONS_COLLECTION);
  query = buildNotificationQuery(query, { idUser, idStore, isRead: false });
  query = query.orderBy("created_at", "desc");

  const snapshot = await query.limit(safeOffset + safeLimit).get();
  const docs = snapshot.docs.slice(safeOffset);
  return docs.map(docToNotification);
};

const countUnreadByUser = async ({ idUser, idStore = null }) => {
  let query = db.collection(NOTIFICATIONS_COLLECTION);
  query = buildNotificationQuery(query, { idUser, idStore, isRead: false });
  const snapshot = await query.get();
  return snapshot.size;
};

const findById = async ({ idNotification, idUser }) => {
  const doc = await db.collection(NOTIFICATIONS_COLLECTION).doc(idNotification).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (data.id_user !== idUser) return null;
  return docToNotification(doc);
};

const create = async ({
  idUser,
  idStore = null,
  tipe,
  judul,
  pesan,
  referenceType = null,
  referenceId = null,
}) => {
  const now = FieldValue.serverTimestamp();
  const data = {
    id_user: idUser,
    id_store: idStore === null ? "__global__" : idStore,
    tipe,
    judul,
    pesan,
    reference_type: referenceType,
    reference_id: referenceId,
    is_read: false,
    read_at: null,
    created_at: now,
  };
  const docRef = await db.collection(NOTIFICATIONS_COLLECTION).add(data);
  const newDoc = await docRef.get();
  return docToNotification(newDoc);
};

const findByReference = async ({ idUser, tipe, referenceType, referenceId }) => {
  const snapshot = await db.collection(NOTIFICATIONS_COLLECTION)
    .where("id_user", "==", idUser)
    .where("tipe", "==", tipe)
    .where("reference_type", "==", referenceType)
    .where("reference_id", "==", referenceId)
    .orderBy("created_at", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return docToNotification(snapshot.docs[0]);
};

const createIfNotExists = async (params) => {
  const existing = await findByReference(params);
  if (existing) {
    return {
      created: false,
      existing: true,
      notification: existing,
    };
  }
  const notification = await create(params);
  return {
    created: true,
    existing: false,
    notification,
  };
};

const markAsRead = async ({ idNotification, idUser }) => {
  const docRef = db.collection(NOTIFICATIONS_COLLECTION).doc(idNotification);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  const data = doc.data();
  if (data.id_user !== idUser || data.is_read) return false;

  await docRef.update({
    is_read: true,
    read_at: FieldValue.serverTimestamp(),
  });
  return true;
};

const markAllAsRead = async ({ idUser, idStore = null }) => {
  let query = db.collection(NOTIFICATIONS_COLLECTION);
  query = buildNotificationQuery(query, { idUser, idStore, isRead: false });

  const snapshot = await query.get();
  if (snapshot.empty) return 0;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      is_read: true,
      read_at: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
  return snapshot.size;
};

const remove = async ({ idNotification, idUser }) => {
  const docRef = db.collection(NOTIFICATIONS_COLLECTION).doc(idNotification);
  const doc = await docRef.get();
  if (!doc.exists) return false;
  if (doc.data().id_user !== idUser) return false;

  await docRef.delete();
  return true;
};

const removeAllRead = async ({ idUser, idStore = null }) => {
  let query = db.collection(NOTIFICATIONS_COLLECTION);
  query = buildNotificationQuery(query, { idUser, idStore, isRead: true });

  const snapshot = await query.get();
  if (snapshot.empty) return 0;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  return snapshot.size;
};

const exists = async ({ idNotification, idUser }) => {
  const doc = await db.collection(NOTIFICATIONS_COLLECTION).doc(idNotification).get();
  if (!doc.exists) return false;
  return doc.data().id_user === idUser;
};

const findLatestByUser = async ({ idUser, idStore = null, limit = 5 }) => {
  const safeLimit = parseLimit(limit, 5);

  let query = db.collection(NOTIFICATIONS_COLLECTION);
  query = buildNotificationQuery(query, { idUser, idStore });
  query = query.orderBy("created_at", "desc").limit(safeLimit);

  const snapshot = await query.get();
  return snapshot.docs.map(docToNotification);
};

// ----------------------------
// EXPORT
// ----------------------------
module.exports = {
  findAllByUser,
  findUnreadByUser,
  countUnreadByUser,
  findById,
  create,
  createIfNotExists,
  findByReference,
  markAsRead,
  markAllAsRead,
  remove,
  removeAllRead,
  exists,
  findLatestByUser,
  // Ekspor utility format jika diperlukan
  formatToWIT,
};