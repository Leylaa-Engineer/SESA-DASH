<?php
// Bu dosyanın kopyasını config.php adıyla kaydet ve gerçek hosting bilgilerini doldur.
// App_Data klasörü doğrudan web erişimine kapalı tutulmalıdır.
return [
    'host' => 'localhost',
    'port' => '3306',
    'name' => 'sesaitco_bakim',
    'user' => 'DB_KULLANICI_ADI',
    'pass' => 'DB_SIFRESI',
    'charset' => 'utf8mb4',
    // Hostinge yükledikten sonra iki kodu mutlaka değiştir.
    'admin_code' => 'YONETICI_KAYIT_KODU_DEGISTIR',
    'responsible_code' => 'SORUMLU_KAYIT_KODU_DEGISTIR',
];
