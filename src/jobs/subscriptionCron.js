const cron = require("node-cron");
const notificationService = require("../modules/notifications/notification.service");

/**
 * ============================================================
 * CRON JOB SUBSCRIPTION NOTIFICATION
 * ============================================================
 *
 * Menjalankan pengecekan subscription setiap hari pukul 06:30 WITA.
 * (WITA = UTC+8, setara dengan 05:30 WIB)
 *
 * Menggunakan:
 * notificationService.processSubscriptionNotifications()
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
    "30 6 * * *", // 06:30 WITA (Asia/Makassar)
    async () => {
      try {
        console.log("⏳ Cron: cek subscription harian (MySQL → Firestore)...");

        const result = await notificationService.processSubscriptionNotifications();

        const expiringProcessed = result.expiringSoon.processed || 0;
        const expiringCreated = result.expiringSoon.created || 0;
        const expiredProcessed = result.expired.processed || 0;
        const expiredNotified = result.expired.notified || 0;
        const expiredUpdated = result.expired.updated || 0;

        if (expiringProcessed === 0 && expiredProcessed === 0) {
          console.log("✅ Tidak ada subscription yang perlu diproses");
        } else {
          console.log(`⚠️ Hampir expired: ditemukan ${expiringProcessed}, notifikasi dibuat ${expiringCreated}`);
          console.log(`🔥 Expired: ditemukan ${expiredProcessed}, notifikasi ${expiredNotified}, status diupdate ${expiredUpdated}`);
        }

        console.log("✅ Cron subscription selesai");
      } catch (error) {
        console.error("❌ Subscription Cron Error:", error);
      }
    },
    {
      timezone: "Asia/Makassar", // Waktu Indonesia Timur (WITA)
    }
  );

  console.log("✅ Subscription cron aktif - berjalan setiap hari pukul 06:30 WITA");
};

module.exports = jalankanSubscriptionCron;