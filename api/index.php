<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
$action = $input['action'] ?? $_GET['action'] ?? '';

$dbFile = __DIR__ . '/machines_data.json';

if (!file_exists($dbFile)) {
    $initialData = [
        [
            "id" => "test-1",
            "kod" => "MKN-9999",
            "ad" => "Test Makinesi (Sistem)",
            "bolum_id" => "1",
            "bolum_ad" => "Üretim",
            "ekleyen_email" => "sorumlu@sesa.com"
        ]
    ];
    file_put_contents($dbFile, json_encode($initialData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$content = file_get_contents($dbFile);
$machines = json_decode($content, true) ?: [];

// Yeni makine ekleme
if ($action === 'create_machine') {
    $newMachine = [
        "id" => uniqid(),
        "kod" => $input['kod'] ?? ("MKN-" . rand(1000, 9999)),
        "ad" => $input['ad'] ?? 'Yeni Makine',
        "bolum_id" => $input['bolum_id'] ?? '1',
        "bolum_ad" => $input['bolum_ad'] ?? 'Genel',
        "ekleyen_email" => $input['ekleyen_email'] ?? ''
    ];
    array_unshift($machines, $newMachine);
    file_put_contents($dbFile, json_encode($machines, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    echo json_encode([
        "success" => true,
        "message" => "Makine başarıyla eklendi.",
        "machine" => $newMachine
    ]);
    exit();
}

// Filtreleme Parametreleri (Frontend'den gelen rol ve sorumluluk bilgisi)
$userRole = $_GET['role'] ?? $input['role'] ?? 'admin';
$selectedSorumlu = $_GET['sorumlu_email'] ?? $input['sorumlu_email'] ?? '';

$filteredMachines = $machines;

// Eğer giriş yapan kullanıcı 'sorumlu' ise, sadece kendi eklediği veya kendi bölümüne ait makineleri göster
if ($userRole === 'sorumlu' && !empty($selectedSorumlu)) {
    $filteredMachines = array_values(array_filter($machines, function($m) use ($selectedSorumlu) {
        return isset($m['ekleyen_email']) && $m['ekleyen_email'] === $selectedSorumlu;
    }));
} 
// Eğer yönetici (admin) bir sorumlu seçtiyse, sadece o sorumlunun makinelerini filtrele
else if ($userRole === 'admin' && !empty($selectedSorumlu) && $selectedSorumlu !== 'all') {
    $filteredMachines = array_values(array_filter($machines, function($m) use ($selectedSorumlu) {
        return isset($m['ekleyen_email']) && $m['ekleyen_email'] === $selectedSorumlu;
    }));
}

echo json_encode($filteredMachines);
exit();
?>