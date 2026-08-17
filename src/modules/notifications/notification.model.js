const pool = require("../../config/database");

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

const findAllByUser = async ({
    idUser,
    idStore = null,
    limit = 20,
    offset = 0,
}) => {
    const safeLimit = parseLimit(limit);
    const safeOffset = parseOffset(offset);

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
            AND (
                n.id_store = ?
                OR n.id_store IS NULL
            )
        `;

        params.push(idStore);
    }

    query += `
        ORDER BY n.created_at DESC
        LIMIT ${safeLimit}
        OFFSET ${safeOffset}
    `;

    const [rows] = await pool.execute(query, params);

    return rows;
};

const findUnreadByUser = async ({
    idUser,
    idStore = null,
    limit = 20,
    offset = 0,
}) => {
    const safeLimit = parseLimit(limit);
    const safeOffset = parseOffset(offset);

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
            AND (
                n.id_store = ?
                OR n.id_store IS NULL
            )
        `;

        params.push(idStore);
    }

    query += `
        ORDER BY n.created_at DESC
        LIMIT ${safeLimit}
        OFFSET ${safeOffset}
    `;

    const [rows] = await pool.execute(query, params);

    return rows;
};

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
            AND (
                id_store = ?
                OR id_store IS NULL
            )
        `;

        params.push(idStore);
    }

    const [rows] = await pool.execute(query, params);

    return Number(rows[0]?.total || 0);
};

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

const findByReference = async ({
    idUser,
    tipe,
    referenceType,
    referenceId,
}) => {
    const [rows] = await pool.execute(
        `
        SELECT
            id_notification,
            id_user,
            id_store,
            tipe,
            judul,
            pesan,
            reference_type,
            reference_id,
            is_read,
            read_at,
            created_at
        FROM notifications
        WHERE id_user = ?
          AND tipe = ?
          AND reference_type = ?
          AND reference_id = ?
        ORDER BY id_notification DESC
        LIMIT 1
        `,
        [
            idUser,
            tipe,
            referenceType,
            referenceId,
        ]
    );

    return rows[0] || null;
};

const createIfNotExists = async ({
    idUser,
    idStore = null,
    tipe,
    judul,
    pesan,
    referenceType = null,
    referenceId = null,
}) => {
    const existing = await findByReference({
        idUser,
        tipe,
        referenceType,
        referenceId,
    });

    if (existing) {
        return {
            created: false,
            existing: true,
            notification: existing,
        };
    }

    const notification = await create({
        idUser,
        idStore,
        tipe,
        judul,
        pesan,
        referenceType,
        referenceId,
    });

    return {
        created: true,
        existing: false,
        notification,
    };
};

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
            AND (
                id_store = ?
                OR id_store IS NULL
            )
        `;

        params.push(idStore);
    }

    const [result] = await pool.execute(
        query,
        params
    );

    return result.affectedRows;
};

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
            AND (
                id_store = ?
                OR id_store IS NULL
            )
        `;

        params.push(idStore);
    }

    const [result] = await pool.execute(
        query,
        params
    );

    return result.affectedRows;
};

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

const findLatestByUser = async ({
    idUser,
    idStore = null,
    limit = 5,
}) => {
    const safeLimit = parseLimit(limit, 5);

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
            AND (
                n.id_store = ?
                OR n.id_store IS NULL
            )
        `;

        params.push(idStore);
    }

    query += `
        ORDER BY n.created_at DESC
        LIMIT ${safeLimit}
    `;

    const [rows] = await pool.execute(query, params);

    return rows;
};

const findActiveSubscriptionByOwner = async ({
    idOwner,
}) => {
    const [rows] = await pool.execute(
        `
        SELECT
            s.id_subscription,
            s.id_owner,
            s.id_plan,
            s.jenis,
            s.parent_subscription,
            s.jumlah_bulan,
            s.kode_invoice,
            s.tanggal_mulai,
            s.tanggal_berakhir,
            s.harga,
            s.status_langganan,
            s.metode_pembayaran,
            p.nama_paket,
            p.durasi_hari
        FROM subscriptions s
        INNER JOIN subscription_plans p
            ON p.id_plan = s.id_plan
        WHERE s.id_owner = ?
          AND s.status_langganan = 'aktif'
        ORDER BY
            s.tanggal_berakhir DESC,
            s.id_subscription DESC
        LIMIT 1
        `,
        [
            idOwner,
        ]
    );

    return rows[0] || null;
};

const findSubscriptionById = async ({
    idSubscription,
    idOwner = null,
}) => {
    let query = `
        SELECT
            s.id_subscription,
            s.id_owner,
            s.id_plan,
            s.jenis,
            s.parent_subscription,
            s.jumlah_bulan,
            s.kode_invoice,
            s.tanggal_mulai,
            s.tanggal_berakhir,
            s.harga,
            s.status_langganan,
            s.metode_pembayaran,
            s.bukti_pembayaran,
            s.catatan,
            s.created_at,
            s.updated_at,
            p.nama_paket,
            p.durasi_hari,
            p.deskripsi
        FROM subscriptions s
        INNER JOIN subscription_plans p
            ON p.id_plan = s.id_plan
        WHERE s.id_subscription = ?
    `;

    const params = [idSubscription];

    if (idOwner !== null && idOwner !== undefined) {
        query += `
            AND s.id_owner = ?
        `;

        params.push(idOwner);
    }

    query += `
        LIMIT 1
    `;

    const [rows] = await pool.execute(
        query,
        params
    );

    return rows[0] || null;
};

const findSubscriptionsExpiring = async ({
    days = 7,
}) => {
    const safeDays = Math.max(
        1,
        Math.min(
            Number.parseInt(days, 10) || 7,
            365
        )
    );

    const [rows] = await pool.execute(
        `
        SELECT
            s.id_subscription,
            s.id_owner,
            s.id_plan,
            s.kode_invoice,
            s.tanggal_mulai,
            s.tanggal_berakhir,
            s.harga,
            s.status_langganan,
            p.nama_paket,
            p.durasi_hari
        FROM subscriptions s
        INNER JOIN subscription_plans p
            ON p.id_plan = s.id_plan
        WHERE s.status_langganan = 'aktif'
          AND s.tanggal_berakhir IS NOT NULL
          AND s.tanggal_berakhir > NOW()
          AND s.tanggal_berakhir <= DATE_ADD(
              NOW(),
              INTERVAL ${safeDays} DAY
          )
        ORDER BY
            s.tanggal_berakhir ASC
        `
    );

    return rows;
};

const findExpiredSubscriptions = async () => {
    const [rows] = await pool.execute(
        `
        SELECT
            s.id_subscription,
            s.id_owner,
            s.id_plan,
            s.kode_invoice,
            s.tanggal_mulai,
            s.tanggal_berakhir,
            s.harga,
            s.status_langganan,
            p.nama_paket,
            p.durasi_hari
        FROM subscriptions s
        INNER JOIN subscription_plans p
            ON p.id_plan = s.id_plan
        WHERE s.status_langganan = 'aktif'
          AND s.tanggal_berakhir IS NOT NULL
          AND s.tanggal_berakhir <= NOW()
        ORDER BY
            s.tanggal_berakhir ASC
        `
    );

    return rows;
};

const markSubscriptionExpired = async ({
    idSubscription,
}) => {
    const [result] = await pool.execute(
        `
        UPDATE subscriptions
        SET
            status_langganan = 'expired',
            updated_at = CURRENT_TIMESTAMP
        WHERE id_subscription = ?
          AND status_langganan = 'aktif'
          AND tanggal_berakhir IS NOT NULL
          AND tanggal_berakhir <= NOW()
        `,
        [
            idSubscription,
        ]
    );

    return result.affectedRows > 0;
};

const getSubscriptionStatus = async ({
    idOwner,
}) => {
    const subscription =
        await findActiveSubscriptionByOwner({
            idOwner,
        });

    if (!subscription) {
        return {
            subscription: null,
            status: "expired",
            days_remaining: 0,
        };
    }

    if (!subscription.tanggal_berakhir) {
        return {
            subscription,
            status: "aktif",
            days_remaining: null,
        };
    }

    const endDate = new Date(
        subscription.tanggal_berakhir
    );

    const now = new Date();

    const difference =
        endDate.getTime() -
        now.getTime();

    const daysRemaining = Math.ceil(
        difference /
        (1000 * 60 * 60 * 24)
    );

    if (difference <= 0) {
        return {
            subscription,
            status: "expired",
            days_remaining: 0,
        };
    }

    if (daysRemaining <= 7) {
        return {
            subscription,
            status: "hampir_expired",
            days_remaining: daysRemaining,
        };
    }

    return {
        subscription,
        status: "aktif",
        days_remaining: daysRemaining,
    };
};

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
    findActiveSubscriptionByOwner,
    findSubscriptionById,
    findSubscriptionsExpiring,
    findExpiredSubscriptions,
    markSubscriptionExpired,
    getSubscriptionStatus,
};