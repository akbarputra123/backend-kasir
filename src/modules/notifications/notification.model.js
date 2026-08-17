const pool = require("../../config/database");

/**
 * ============================================================
 * NOTIFICATION MODEL
 * ============================================================
 *
 * File:
 * modules/notifications/notification.model.js
 *
 * Tabel:
 * notifications
 *
 * Relasi:
 * - users
 * - stores
 *
 * Digunakan untuk:
 * - Pesanan baru
 * - Pembayaran berhasil
 * - Pesanan belum bayar
 * - Stok menipis
 * - Stok habis
 * - Subscription
 * - User baru
 * - Transaksi dibatalkan
 * - Dan notifikasi lainnya
 */


/**
 * ============================================================
 * GET ALL NOTIFICATIONS
 * ============================================================
 */
const findAllByUser = async ({
    idUser,
    idStore = null,
    limit = 20,
    offset = 0,
}) => {
    let query = `
        SELECT
            n.id_notification,
            n.id_user,
            n.id_store,
            n.tipe,
            n.judul,
            n.pesan,
            n.reference_type,
            n.reference_id,
            n.is_read,
            n.read_at,
            n.created_at
        FROM notifications n
        WHERE n.id_user = ?
    `;

    const params = [idUser];

    if (idStore !== null && idStore !== undefined) {
        query += `
            AND n.id_store = ?
        `;

        params.push(idStore);
    }

    query += `
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
    `;

    params.push(
        Number(limit),
        Number(offset)
    );

    const [rows] = await pool.execute(
        query,
        params
    );

    return rows;
};


/**
 * ============================================================
 * GET UNREAD NOTIFICATIONS
 * ============================================================
 */
const findUnreadByUser = async ({
    idUser,
    idStore = null,
    limit = 20,
    offset = 0,
}) => {
    let query = `
        SELECT
            n.id_notification,
            n.id_user,
            n.id_store,
            n.tipe,
            n.judul,
            n.pesan,
            n.reference_type,
            n.reference_id,
            n.is_read,
            n.read_at,
            n.created_at
        FROM notifications n
        WHERE n.id_user = ?
          AND n.is_read = FALSE
    `;

    const params = [idUser];

    if (idStore !== null && idStore !== undefined) {
        query += `
            AND n.id_store = ?
        `;

        params.push(idStore);
    }

    query += `
        ORDER BY n.created_at DESC
        LIMIT ? OFFSET ?
    `;

    params.push(
        Number(limit),
        Number(offset)
    );

    const [rows] = await pool.execute(
        query,
        params
    );

    return rows;
};


/**
 * ============================================================
 * GET UNREAD COUNT
 * ============================================================
 */
const countUnreadByUser = async ({
    idUser,
    idStore = null,
}) => {
    let query = `
        SELECT
            COUNT(*) AS total
        FROM notifications
        WHERE id_user = ?
          AND is_read = FALSE
    `;

    const params = [idUser];

    if (idStore !== null && idStore !== undefined) {
        query += `
            AND id_store = ?
        `;

        params.push(idStore);
    }

    const [rows] = await pool.execute(
        query,
        params
    );

    return Number(
        rows[0]?.total || 0
    );
};


/**
 * ============================================================
 * FIND NOTIFICATION BY ID
 * ============================================================
 */
const findById = async ({
    idNotification,
    idUser,
}) => {
    const [rows] = await pool.execute(
        `
        SELECT
            n.id_notification,
            n.id_user,
            n.id_store,
            n.tipe,
            n.judul,
            n.pesan,
            n.reference_type,
            n.reference_id,
            n.is_read,
            n.read_at,
            n.created_at
        FROM notifications n
        WHERE n.id_notification = ?
          AND n.id_user = ?
        LIMIT 1
        `,
        [
            idNotification,
            idUser,
        ]
    );

    return rows[0] || null;
};


/**
 * ============================================================
 * CREATE NOTIFICATION
 * ============================================================
 */
const create = async ({
    idUser,
    idStore = null,
    tipe,
    judul,
    pesan,
    referenceType = null,
    referenceId = null,
}) => {
    const [result] = await pool.execute(
        `
        INSERT INTO notifications (
            id_user,
            id_store,
            tipe,
            judul,
            pesan,
            reference_type,
            reference_id,
            is_read,
            read_at
        )
        VALUES (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            ?,
            FALSE,
            NULL
        )
        `,
        [
            idUser,
            idStore,
            tipe,
            judul,
            pesan,
            referenceType,
            referenceId,
        ]
    );

    return {
        id_notification: result.insertId,

        id_user: idUser,
        id_store: idStore,

        tipe,
        judul,
        pesan,

        reference_type: referenceType,
        reference_id: referenceId,

        is_read: false,
        read_at: null,
    };
};


/**
 * ============================================================
 * MARK ONE NOTIFICATION AS READ
 * ============================================================
 */
const markAsRead = async ({
    idNotification,
    idUser,
}) => {
    const [result] = await pool.execute(
        `
        UPDATE notifications
        SET
            is_read = TRUE,
            read_at = CURRENT_TIMESTAMP
        WHERE id_notification = ?
          AND id_user = ?
          AND is_read = FALSE
        `,
        [
            idNotification,
            idUser,
        ]
    );

    return result.affectedRows > 0;
};


/**
 * ============================================================
 * MARK ALL NOTIFICATIONS AS READ
 * ============================================================
 */
const markAllAsRead = async ({
    idUser,
    idStore = null,
}) => {
    let query = `
        UPDATE notifications
        SET
            is_read = TRUE,
            read_at = CURRENT_TIMESTAMP
        WHERE id_user = ?
          AND is_read = FALSE
    `;

    const params = [idUser];

    if (idStore !== null && idStore !== undefined) {
        query += `
            AND id_store = ?
        `;

        params.push(idStore);
    }

    const [result] = await pool.execute(
        query,
        params
    );

    return result.affectedRows;
};


/**
 * ============================================================
 * DELETE NOTIFICATION
 * ============================================================
 */
const remove = async ({
    idNotification,
    idUser,
}) => {
    const [result] = await pool.execute(
        `
        DELETE FROM notifications
        WHERE id_notification = ?
          AND id_user = ?
        `,
        [
            idNotification,
            idUser,
        ]
    );

    return result.affectedRows > 0;
};


/**
 * ============================================================
 * DELETE ALL READ NOTIFICATIONS
 * ============================================================
 */
const removeAllRead = async ({
    idUser,
    idStore = null,
}) => {
    let query = `
        DELETE FROM notifications
        WHERE id_user = ?
          AND is_read = TRUE
    `;

    const params = [idUser];

    if (idStore !== null && idStore !== undefined) {
        query += `
            AND id_store = ?
        `;

        params.push(idStore);
    }

    const [result] = await pool.execute(
        query,
        params
    );

    return result.affectedRows;
};


/**
 * ============================================================
 * CHECK NOTIFICATION EXISTS
 * ============================================================
 */
const exists = async ({
    idNotification,
    idUser,
}) => {
    const [rows] = await pool.execute(
        `
        SELECT
            id_notification
        FROM notifications
        WHERE id_notification = ?
          AND id_user = ?
        LIMIT 1
        `,
        [
            idNotification,
            idUser,
        ]
    );

    return rows.length > 0;
};


/**
 * ============================================================
 * GET LATEST NOTIFICATIONS
 * ============================================================
 */
const findLatestByUser = async ({
    idUser,
    idStore = null,
    limit = 5,
}) => {
    let query = `
        SELECT
            n.id_notification,
            n.id_user,
            n.id_store,
            n.tipe,
            n.judul,
            n.pesan,
            n.reference_type,
            n.reference_id,
            n.is_read,
            n.read_at,
            n.created_at
        FROM notifications n
        WHERE n.id_user = ?
    `;

    const params = [idUser];

    if (idStore !== null && idStore !== undefined) {
        query += `
            AND n.id_store = ?
        `;

        params.push(idStore);
    }

    query += `
        ORDER BY n.created_at DESC
        LIMIT ?
    `;

    params.push(Number(limit));

    const [rows] = await pool.execute(
        query,
        params
    );

    return rows;
};


/**
 * ============================================================
 * EXPORT
 * ============================================================
 */
module.exports = {
    findAllByUser,
    findUnreadByUser,
    countUnreadByUser,
    findById,
    create,
    markAsRead,
    markAllAsRead,
    remove,
    removeAllRead,
    exists,
    findLatestByUser,
};