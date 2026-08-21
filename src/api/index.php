<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Garanti statik makine listemiz
$machines = [
    [
        "id" => "1700000001",
        "kod" => "MKN-9174",
        "ad" => "Laminasyon Makinesi",
        "bolum_id" => "1",
        "bolum_ad" => "Genel",
        "ekleyen_email" => "leylahus24@gmail.com"
    ],
    [
        "id" => "1700000002",
        "kod" => "MKN-8821",
        "ad" => "Flekso Baskı Makinesi",
        "bolum_id" => "1",
        "bolum_ad" => "Genel",
        "ekleyen_email" => "leylahus24@gmail.com"
    ]
];

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true) ?? $_POST;
$action = $input['action'] ?? $_GET['action'] ?? '';

// Ekleme isteği geldiyse
if ($action === 'add_machine' || isset($input['ad'])) {
    $newMachine = [
        "id" => uniqid(),
        "kod" => $input['kod'] ?? 'MKN-' . rand(1000, 9999),
        "ad" => $input['ad'] ?? 'Yeni Makine',
        "bolum_id" => $input['bolum_id'] ?? '1',
        "bolum_ad" => $input['bolum_ad'] ?? 'Genel',
        "ekleyen_email" => $input['ekleyen_email'] ?? 'leylahus24@gmail.com'
    ];
    $machines[] = $newMachine;
    
    echo json_encode([
        "success" => true,
        "message" => "Makine eklendi",
        "machines" => $machines,
        "machine" => $newMachine
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// -------------------------------------------------------------
// EN ÖNEMLİ KISIM: İstek POST veya GET fark etmeksizin liste döner
// -------------------------------------------------------------
echo json_encode($machines, JSON_UNESCAPED_UNICODE);
exit();
?>