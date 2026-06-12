CREATE TABLE users (
    id_user INT AUTO_INCREMENT PRIMARY KEY,

    id_store INT NULL,

    nama_lengkap VARCHAR(150) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    no_hp VARCHAR(20) NULL,

    password VARCHAR(255) NOT NULL,

    role ENUM('owner', 'admin', 'kasir') NOT NULL DEFAULT 'kasir',

    status_akun ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',

    foto VARCHAR(255) NULL,

    last_login DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE stores (
    id_store INT AUTO_INCREMENT PRIMARY KEY,

    id_owner INT NOT NULL,

    nama_toko VARCHAR(150) NOT NULL,
    alamat TEXT NULL,
    no_hp VARCHAR(20) NULL,
    email VARCHAR(150) NULL,

    logo VARCHAR(255) NULL,

    status_toko ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',

    ppn_aktif ENUM('ya', 'tidak') NOT NULL DEFAULT 'tidak',
    ppn_persen DECIMAL(5,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_stores_owner
        FOREIGN KEY (id_owner)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE categories (
    id_category INT AUTO_INCREMENT PRIMARY KEY,

    id_store INT NOT NULL,

    nama_kategori VARCHAR(100) NOT NULL,
    deskripsi TEXT NULL,

    status_kategori ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_categories_store
        FOREIGN KEY (id_store)
        REFERENCES stores(id_store)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY unique_category_store (id_store, nama_kategori)
);
CREATE TABLE discounts (
    id_discount INT AUTO_INCREMENT PRIMARY KEY,

    id_store INT NOT NULL,

    nama_diskon VARCHAR(150) NOT NULL,

    tipe_diskon ENUM('nominal', 'persen') NOT NULL DEFAULT 'persen',
    nilai_diskon DECIMAL(15,2) NOT NULL DEFAULT 0,

    tanggal_mulai DATETIME NULL,
    tanggal_berakhir DATETIME NULL,

    status_diskon ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_discounts_store
        FOREIGN KEY (id_store)
        REFERENCES stores(id_store)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
CREATE TABLE products (
    id_product INT AUTO_INCREMENT PRIMARY KEY,

    id_store INT NOT NULL,
    id_category INT NULL,
    id_discount INT NULL,

    kode_produk VARCHAR(100) NOT NULL,
    barcode VARCHAR(100) NULL,

    nama_produk VARCHAR(150) NOT NULL,
    deskripsi TEXT NULL,

    harga_beli DECIMAL(15,2) NOT NULL DEFAULT 0,
    harga_jual DECIMAL(15,2) NOT NULL DEFAULT 0,

    stok INT NOT NULL DEFAULT 0,
    stok_minimum INT NOT NULL DEFAULT 0,

    satuan VARCHAR(50) NOT NULL DEFAULT 'pcs',

    foto VARCHAR(255) NULL,

    status_produk ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_store
        FOREIGN KEY (id_store)
        REFERENCES stores(id_store)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_products_category
        FOREIGN KEY (id_category)
        REFERENCES categories(id_category)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_products_discount
        FOREIGN KEY (id_discount)
        REFERENCES discounts(id_discount)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    UNIQUE KEY unique_kode_produk_store (id_store, kode_produk),
    UNIQUE KEY unique_barcode_store (id_store, barcode)
);

CREATE TABLE stock_logs (
    id_stock_log INT AUTO_INCREMENT PRIMARY KEY,

    id_store INT NOT NULL,
    id_product INT NOT NULL,
    id_user INT NULL,

    tipe ENUM('masuk', 'keluar', 'penyesuaian') NOT NULL,

    jumlah INT NOT NULL,
    stok_sebelum INT NOT NULL,
    stok_sesudah INT NOT NULL,

    keterangan TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_logs_store
        FOREIGN KEY (id_store)
        REFERENCES stores(id_store)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_stock_logs_product
        FOREIGN KEY (id_product)
        REFERENCES products(id_product)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_stock_logs_user
        FOREIGN KEY (id_user)
        REFERENCES users(id_user)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
CREATE TABLE transactions (
    id_transaction INT AUTO_INCREMENT PRIMARY KEY,

    id_store INT NOT NULL,
    id_user INT NULL,

    kode_transaksi VARCHAR(100) NOT NULL,

    total_item INT NOT NULL DEFAULT 0,
    total_qty INT NOT NULL DEFAULT 0,

    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    diskon DECIMAL(15,2) NOT NULL DEFAULT 0,
    pajak DECIMAL(15,2) NOT NULL DEFAULT 0,
    grand_total DECIMAL(15,2) NOT NULL DEFAULT 0,

    metode_pembayaran ENUM('tunai', 'transfer', 'qris', 'debit', 'ewallet') NOT NULL DEFAULT 'tunai',

    jumlah_bayar DECIMAL(15,2) NOT NULL DEFAULT 0,
    kembalian DECIMAL(15,2) NOT NULL DEFAULT 0,

    status_transaksi ENUM('selesai', 'dibatalkan') NOT NULL DEFAULT 'selesai',

    catatan TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_transactions_store
        FOREIGN KEY (id_store)
        REFERENCES stores(id_store)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (id_user)
        REFERENCES users(id_user)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    UNIQUE KEY unique_kode_transaksi_store (id_store, kode_transaksi)
);
CREATE TABLE transaction_items (
    id_transaction_item INT AUTO_INCREMENT PRIMARY KEY,

    id_transaction INT NOT NULL,
    id_product INT NULL,

    kode_produk VARCHAR(100) NOT NULL,
    nama_produk VARCHAR(150) NOT NULL,

    harga_asli DECIMAL(15,2) NOT NULL DEFAULT 0,

    id_discount INT NULL,
    nama_diskon VARCHAR(150) NULL,
    tipe_diskon ENUM('nominal', 'persen') NULL,
    nilai_diskon DECIMAL(15,2) NOT NULL DEFAULT 0,

    diskon DECIMAL(15,2) NOT NULL DEFAULT 0,

    harga_jual DECIMAL(15,2) NOT NULL DEFAULT 0,
    qty INT NOT NULL DEFAULT 1,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transaction_items_transaction
        FOREIGN KEY (id_transaction)
        REFERENCES transactions(id_transaction)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_transaction_items_product
        FOREIGN KEY (id_product)
        REFERENCES products(id_product)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_transaction_items_discount
        FOREIGN KEY (id_discount)
        REFERENCES discounts(id_discount)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
CREATE TABLE subscription_plans (
    id_plan INT AUTO_INCREMENT PRIMARY KEY,

    nama_paket VARCHAR(100) NOT NULL,
    deskripsi TEXT NULL,

    durasi_hari INT NOT NULL,
    harga DECIMAL(15,2) NOT NULL DEFAULT 0,

    batas_toko INT NOT NULL DEFAULT 1,
    batas_user INT NOT NULL DEFAULT 3,
    batas_produk INT NOT NULL DEFAULT 100,

    status_paket ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE subscriptions (
    id_subscription INT AUTO_INCREMENT PRIMARY KEY,

    id_owner INT NOT NULL,
    id_plan INT NOT NULL,

    kode_invoice VARCHAR(100) NOT NULL UNIQUE,

    tanggal_mulai DATETIME NULL,
    tanggal_berakhir DATETIME NULL,

    harga DECIMAL(15,2) NOT NULL DEFAULT 0,

    status_langganan ENUM('pending', 'aktif', 'expired', 'dibatalkan') NOT NULL DEFAULT 'pending',

    metode_pembayaran ENUM('manual_transfer', 'qris_manual') NOT NULL DEFAULT 'manual_transfer',

    bukti_pembayaran VARCHAR(255) NULL,

    catatan TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_subscriptions_owner
        FOREIGN KEY (id_owner)
        REFERENCES users(id_user)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_subscriptions_plan
        FOREIGN KEY (id_plan)
        REFERENCES subscription_plans(id_plan)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
