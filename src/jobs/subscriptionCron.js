const cron = require("node-cron");
const notificationService = require("../modules/notifications/notification.service");

/**
 * ============================================================
 * CRON JOB SUBSCRIPTION NOTIFICATION
 * ============================================================
 *
 * Menjalankan pengecekan subscription setiap hari pukul 10:30
 * Waktu Indonesia Timur (WIT).
 *
 * Timezone:
 * Asia/Jayapura
 *
 * Berlaku untuk:
 * - Maluku Utara
 * - Papua
 * - Papua Barat
 * - Papua Barat Daya
 * - Papua Tengah
 * - Papua Pegunungan
 * - Papua Selatan
 *
 * Menggunakan:
 * notificationService.checkSubscriptionNotifications()
 *
 * Alur:
 * 1. Cari subscription yang hampir expired (≤ 7 hari) dari MySQL
 * 2. Buat notifikasi di Firestore (anti duplikat)
 * 3. Cari subscription yang sudah expired dari MySQL
 * 4. Buat notifikasi expired di Firestore (anti duplikat)
 * 5. Update status subscription menjadi 'expired' di MySQL
 *
 * ============================================================
 */

const jalankanSubscriptionCron = () => {
  cron.schedule(
    "30 10 * * *", // Setiap hari pukul 10:30 WIT
    async () => {
      try {
        console.log(
          "⏳ Cron: cek subscription harian (MySQL → Firestore)..."
        );

        const result =
          await notificationService.checkSubscriptionNotifications();

        const expiringCount = result.expiring.length;
        const expiredCount = result.expired.length;

        if (expiringCount === 0 && expiredCount === 0) {
          console.log(
            "✅ Tidak ada subscription yang perlu diproses"
          );
        } else {
          console.log(
            `⚠️ Hampir expired: ditemukan ${expiringCount}, notifikasi dibuat ${expiringCount}`
          );

          console.log(
            `🔥 Expired: ditemukan ${expiredCount}, notifikasi dibuat ${expiredCount}`
          );
        }

        console.log("✅ Cron subscription selesai");
      } catch (error) {
        console.error(
          "❌ Subscription Cron Error:",
          error
        );
      }
    },
    {
      // Waktu Indonesia Timur (WIT)
      // Maluku Utara menggunakan Asia/Jayapura
      timezone: "Asia/Jayapura",
    }
  );

  console.log(
    "✅ Subscription cron aktif - berjalan setiap hari pukul 10:30 WIT (Asia/Jayapura)"
  );
};

module.exports = jalankanSubscriptionCron;