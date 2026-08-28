
const cron = require("node-cron");
const notificationService = require("../modules/notifications/notification.service");

/**
 * ============================================================
 * CRON JOB SUBSCRIPTION NOTIFICATION
 * ============================================================
 *
 * Menjalankan pengecekan subscription setiap hari pukul 12:00
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
 * Jadwal:
 * Setiap hari pukul 12:00 WIT
 * Timezone: Asia/Jayapura
 *
 * ============================================================
 */

const jalankanSubscriptionCron = () => {
  cron.schedule(
    "0 12 * * *", // Setiap hari pukul 12:00 WIT
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
      timezone: "Asia/Jayapura",
    }
  );

  console.log(
    "✅ Subscription cron aktif - berjalan setiap hari pukul 12:00 WIT (Asia/Jayapura)"
  );
};

module.exports = jalankanSubscriptionCron;