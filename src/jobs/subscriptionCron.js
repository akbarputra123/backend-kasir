const cron = require("node-cron");
const db = require("../config/database");

const jalankanSubscriptionCron = () => {
    cron.schedule(
        "5 0 * * *",
        async () => {
            try {
                console.log("⏳ Cron: cek subscription harian...");

                const [expiredSubscriptions] = await db.execute(`
                    SELECT
                        s.id_subscription,
                        s.id_owner,
                        s.id_plan,
                        s.tanggal_berakhir,
                        s.status_langganan,
                        p.nama_paket
                    FROM subscriptions s
                    LEFT JOIN subscription_plans p
                        ON p.id_plan = s.id_plan
                    WHERE s.status_langganan = 'aktif'
                      AND s.tanggal_berakhir IS NOT NULL
                      AND s.tanggal_berakhir <= NOW()
                    ORDER BY s.tanggal_berakhir ASC
                `);

                for (const subscription of expiredSubscriptions) {
                    const [existing] = await db.execute(
                        `
                        SELECT
                            id_notification
                        FROM notifications
                        WHERE id_user = ?
                          AND tipe = 'subscription_expired'
                          AND reference_type = 'subscription'
                          AND reference_id = ?
                        LIMIT 1
                        `,
                        [
                            subscription.id_owner,
                            subscription.id_subscription,
                        ]
                    );

                    if (existing.length === 0) {
                        await db.execute(
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
                                NULL,
                                'subscription_expired',
                                ?,
                                ?,
                                'subscription',
                                ?,
                                FALSE,
                                NULL
                            )
                            `,
                            [
                                subscription.id_owner,
                                "Langganan Telah Berakhir",
                                `Langganan ${subscription.nama_paket || "Subscription"} telah berakhir. Silakan perpanjang langganan untuk terus menggunakan SIOPOS.`,
                                subscription.id_subscription,
                            ]
                        );

                        console.log(
                            `🔔 Notifikasi expired dibuat untuk owner ${subscription.id_owner}`
                        );
                    }

                    await db.execute(
                        `
                        UPDATE subscriptions
                        SET
                            status_langganan = 'expired',
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id_subscription = ?
                          AND status_langganan = 'aktif'
                        `,
                        [
                            subscription.id_subscription,
                        ]
                    );

                    console.log(
                        `🔥 Subscription ${subscription.id_subscription} → expired`
                    );
                }

                const [expiringSubscriptions] = await db.execute(`
                    SELECT
                        s.id_subscription,
                        s.id_owner,
                        s.id_plan,
                        s.tanggal_berakhir,
                        s.status_langganan,
                        p.nama_paket
                    FROM subscriptions s
                    LEFT JOIN subscription_plans p
                        ON p.id_plan = s.id_plan
                    WHERE s.status_langganan = 'aktif'
                      AND s.tanggal_berakhir IS NOT NULL
                      AND s.tanggal_berakhir > NOW()
                      AND s.tanggal_berakhir <= DATE_ADD(
                          NOW(),
                          INTERVAL 7 DAY
                      )
                    ORDER BY s.tanggal_berakhir ASC
                `);

                for (const subscription of expiringSubscriptions) {
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

                    if (daysRemaining <= 0) {
                        continue;
                    }

                    if (daysRemaining > 7) {
                        continue;
                    }

                    const [existingToday] = await db.execute(
                        `
                        SELECT
                            id_notification
                        FROM notifications
                        WHERE id_user = ?
                          AND tipe = 'subscription_hampir_expired'
                          AND reference_type = 'subscription'
                          AND reference_id = ?
                          AND DATE(created_at) = CURDATE()
                        LIMIT 1
                        `,
                        [
                            subscription.id_owner,
                            subscription.id_subscription,
                        ]
                    );

                    if (existingToday.length > 0) {
                        console.log(
                            `ℹ️ Notifikasi hari ini sudah ada untuk subscription ${subscription.id_subscription}`
                        );

                        continue;
                    }

                    await db.execute(
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
                            NULL,
                            'subscription_hampir_expired',
                            ?,
                            ?,
                            'subscription',
                            ?,
                            FALSE,
                            NULL
                        )
                        `,
                        [
                            subscription.id_owner,
                            "Langganan Segera Berakhir",
                            `Langganan ${subscription.nama_paket || "Subscription"} akan berakhir dalam ${daysRemaining} hari. Silakan lakukan perpanjangan agar layanan tetap aktif.`,
                            subscription.id_subscription,
                        ]
                    );

                    console.log(
                        `⚠️ Notifikasi H-${daysRemaining} dibuat untuk owner ${subscription.id_owner}`
                    );
                }

                if (
                    expiredSubscriptions.length === 0 &&
                    expiringSubscriptions.length === 0
                ) {
                    console.log(
                        "✅ Tidak ada subscription yang perlu diproses"
                    );
                }

                console.log(
                    "✅ Cron subscription selesai"
                );
            } catch (error) {
                console.error(
                    "❌ Subscription Cron Error:",
                    error
                );
            }
        },
        {
            timezone: "Asia/Jakarta",
        }
    );

    console.log(
        "✅ Subscription cron aktif - berjalan setiap hari pukul 00:05"
    );
};

module.exports = jalankanSubscriptionCron;