const cron = require("node-cron");
const notificationService = require("../modules/notifications/notification.service");

/**
 * ============================================================
 * CRON JOB SUBSCRIPTION NOTIFICATION
 * ============================================================
 *
 * Menjalankan pengecekan subscription setiap hari pukul 00:05 WIB.
 *
 * Fungsi ini memanfaatkan service yang sudah ada:
 * notificationService.checkSubscriptionNotifications()
 *
 * Service tersebut akan:
 * 1. Mencari subscription yang hampir expired (≤ 7 hari)
 * 2. Membuat notifikasi subscription_hampir_expired (anti duplikat)
 * 3. Mencari subscription yang sudah expired
 * 4. Membuat notifikasi subscription_expired (anti duplikat)
 * 5. Mengupdate status subscription menjadi 'expired'
 *
 * ============================================================
 */

const jalankanSubscriptionCron = () => {
    cron.schedule(
        "5 0 * * *",
        async () => {
            try {
                console.log("⏳ Cron: cek subscription harian (Firestore)...");

                const result = await notificationService.checkSubscriptionNotifications();

                const totalExpiring = result.expiring.length;
                const totalExpired = result.expired.length;

                if (totalExpiring === 0 && totalExpired === 0) {
                    console.log("✅ Tidak ada subscription yang perlu diproses");
                } else {
                    console.log(`⚠️ Notifikasi hampir expired: ${totalExpiring}`);
                    console.log(`🔥 Notifikasi expired: ${totalExpired}`);
                }

                console.log("✅ Cron subscription selesai");
            } catch (error) {
                console.error("❌ Subscription Cron Error:", error);
            }
        },
        {
            timezone: "Asia/Jakarta",
        }
    );

    console.log("✅ Subscription cron aktif - berjalan setiap hari pukul 00:05 WIB");
};

module.exports = jalankanSubscriptionCron;