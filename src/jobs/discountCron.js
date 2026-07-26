const cron = require("node-cron");
const pool = require("../config/database");

const startDiscountCron = () => {
  // Jalan setiap 5 menit
  cron.schedule("*/5 * * * *", async () => {
    try {
      const [result] = await pool.query(`
        UPDATE discounts
        SET status_diskon = 'nonaktif',
            updated_at = NOW()
        WHERE status_diskon = 'aktif'
          AND tanggal_berakhir IS NOT NULL
          AND NOW() > DATE_ADD(
                DATE(tanggal_berakhir),
                INTERVAL 1 DAY
              ) - INTERVAL 1 SECOND
      `);

      if (result.affectedRows > 0) {
        console.log(
          `[CRON] ${result.affectedRows} diskon berhasil dinonaktifkan`
        );
      }
    } catch (err) {
      console.error("[CRON] Gagal mengecek diskon:", err);
    }
  });

  console.log("[CRON] Auto Expired Discount berjalan");
};

module.exports = startDiscountCron;