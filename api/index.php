<?php
session_set_cookie_params([
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
]);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function respond($data, $status = 200) { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function fail($message, $status = 400) { respond(['error' => $message], $status); }
function input() { $raw = file_get_contents('php://input'); $data = json_decode($raw ?: '{}', true); return is_array($data) ? $data : []; }
function uuid() { $hex = bin2hex(random_bytes(16)); return substr($hex,0,8).'-'.substr($hex,8,4).'-'.substr($hex,12,4).'-'.substr($hex,16,4).'-'.substr($hex,20); }
function db() {
    static $mysqli;
    if ($mysqli) return $mysqli;
    $configPath = dirname(__DIR__) . '/App_Data/config.php';
    if (!is_file($configPath)) fail('MySQL yapılandırması bulunamadı. App_Data/config.php dosyasını oluşturun.', 500);
    $config = require $configPath;
    mysqli_report(MYSQLI_REPORT_OFF);
    $mysqli = new mysqli($config['host'], $config['user'], $config['pass'], $config['name'], (int)$config['port']);
    if ($mysqli->connect_errno) fail('Veritabanı bağlantısı kurulamadı.', 500);
    $mysqli->set_charset($config['charset']);
    return $mysqli;
}
function json_value($value) {
    if ($value === null || $value === '') return null;
    $decoded = json_decode($value, true);
    return json_last_error() === JSON_ERROR_NONE ? $decoded : $value;
}
function iso_date($value) { return $value ? ['__date' => date(DATE_ATOM, strtotime($value))] : null; }
function public_user($row) {
    if (!$row) return null;
    return ['id'=>$row['id'], 'email'=>$row['email'], 'ad_soyad'=>$row['ad_soyad'], 'telefon'=>$row['telefon'], 'rol'=>$row['rol'], 'bolum_idler'=>json_value($row['bolum_idler']), 'bolum_id'=>$row['bolum_id'], 'aktif'=>(bool)$row['aktif'], 'sonGirisTarihi'=>iso_date($row['son_giris_tarihi'])];
}
function row_to_document($collection, $row) {
    if ($collection === 'sorumlular' || $collection === 'yoneticiler') return public_user($row);
    if ($collection === 'bolumler') return ['id'=>$row['id'], 'ad'=>$row['ad'], 'aktif'=>(bool)$row['aktif']];
    if ($collection === 'makineler') return ['id'=>$row['id'], 'kod'=>$row['kod'], 'ad'=>$row['ad'], 'bolum_id'=>$row['bolum_id'], 'bolum_ad'=>$row['bolum_ad'], 'ekleyen_email'=>$row['ekleyen_email'], 'aktif'=>(bool)$row['aktif'], 'olusturulma_tarihi'=>iso_date($row['created_at']), 'guncellenme_tarihi'=>iso_date($row['updated_at'])];
    if ($collection === 'arizalar') return ['id'=>$row['id'], 'makine_id'=>$row['makine_id'], 'makine_kod'=>$row['makine_kod'], 'makine_ad'=>$row['makine_ad'], 'bolum_id'=>$row['bolum_id'], 'bolum_ad'=>$row['bolum_ad'], 'ekleyen_email'=>$row['ekleyen_email'], 'sorumlu_email'=>$row['sorumlu_email'], 'email'=>$row['email'], 'aciklama'=>$row['aciklama'], 'foto_url'=>$row['foto_url'], 'durum'=>$row['durum'], 'cozulme_tarihi'=>iso_date($row['cozulme_tarihi']), 'cozen_sorumlu_id'=>$row['cozen_sorumlu_id'], 'durum_gecmisi'=>json_value($row['durum_gecmisi']), 'olusturulma_tarihi'=>iso_date($row['created_at']), 'guncellenme_tarihi'=>iso_date($row['updated_at'])];
    if ($collection === 'ayarlar') {
        $data = json_value($row['data']) ?: [];
        $data['id'] = $row['id'];
        return $data;
    }
    return $row;
}
function collection_table($collection) {
    return ['sorumlular'=>'users','yoneticiler'=>'users','bolumler'=>'departments','makineler'=>'machines','arizalar'=>'issues','ayarlar'=>'settings'][$collection] ?? null;
}
function allowed_value($key, $value) {
    if (is_array($value)) return json_encode($value, JSON_UNESCAPED_UNICODE);
    if ($value && is_object($value)) return json_encode($value, JSON_UNESCAPED_UNICODE);
    return $value;
}
function current_user() {
    if (empty($_SESSION['user_id'])) return null;
    $stmt = db()->prepare('SELECT * FROM users WHERE id = ? LIMIT 1'); $stmt->bind_param('s', $_SESSION['user_id']); $stmt->execute(); return $stmt->get_result()->fetch_assoc() ?: null;
}
function require_user() { $user = current_user(); if (!$user) fail('Oturum gerekli.', 401); return $user; }
function find_rows($collection) {
    $table = collection_table($collection); if (!$table) fail('Geçersiz koleksiyon.');
    $mysqli = db();
    if ($collection === 'sorumlular') $sql = "SELECT * FROM users WHERE rol = 'sorumlu' ORDER BY ad_soyad";
    elseif ($collection === 'yoneticiler') $sql = "SELECT * FROM users WHERE rol = 'admin' ORDER BY ad_soyad";
    elseif ($collection === 'ayarlar') $sql = 'SELECT * FROM settings ORDER BY id';
    else $sql = "SELECT * FROM `$table` ORDER BY created_at DESC";
    $result = $mysqli->query($sql); if (!$result) fail('Veriler okunamadı.', 500);
    $items = []; while ($row = $result->fetch_assoc()) $items[] = row_to_document($collection, $row);
    return $items;
}
function matches_filters($item, $filters) {
    foreach (($filters ?: []) as $filter) {
        $field = $filter['field'] ?? ''; $operator = $filter['operator'] ?? '=='; $wanted = $filter['value'] ?? null; $actual = $item[$field] ?? null;
        if ($operator === 'array-contains') { if (!is_array($actual) || !in_array($wanted, $actual, true)) return false; }
        elseif ($operator === '!=') { if ($actual == $wanted) return false; }
        elseif ($actual != $wanted) return false;
    }
    return true;
}
function insert_document($collection, $id, $data) {
    $mysqli = db(); $id = $id ?: uuid();
    if ($collection === 'makineler') {
        $stmt=$mysqli->prepare('INSERT INTO machines (id,kod,ad,bolum_id,bolum_ad,ekleyen_email,aktif) VALUES (?,?,?,?,?,?,1)'); $stmt->bind_param('ssssss',$id,$data['kod'],$data['ad'],$data['bolum_id'],$data['bolum_ad'],$data['ekleyen_email']);
    } elseif ($collection === 'arizalar') {
        $history=json_encode($data['durum_gecmisi'] ?? [],JSON_UNESCAPED_UNICODE); $stmt=$mysqli->prepare('INSERT INTO issues (id,makine_id,makine_kod,makine_ad,bolum_id,bolum_ad,ekleyen_email,sorumlu_email,email,aciklama,foto_url,durum,cozulme_tarihi,cozen_sorumlu_id,durum_gecmisi) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'); $null=null; $stmt->bind_param('sssssssssssssss',$id,$data['makine_id'],$data['makine_kod'],$data['makine_ad'],$data['bolum_id'],$data['bolum_ad'],$data['ekleyen_email'],$data['sorumlu_email'],$data['email'],$data['aciklama'],$data['foto_url'],$data['durum'],$null,$null,$history);
    } elseif ($collection === 'sorumlular' || $collection === 'yoneticiler') {
        $role=$collection==='yoneticiler'?'admin':'sorumlu'; $json=json_encode($data['bolum_idler'] ?? [],JSON_UNESCAPED_UNICODE); $hash=$data['password_hash'] ?? password_hash($data['password'] ?? bin2hex(random_bytes(8)),PASSWORD_DEFAULT); $stmt=$mysqli->prepare('INSERT INTO users (id,email,password_hash,ad_soyad,telefon,rol,bolum_idler,bolum_id,aktif) VALUES (?,?,?,?,?,?,?,?,1)'); $stmt->bind_param('sssssssss',$id,$data['email'],$hash,$data['ad_soyad'],$data['telefon'],$role,$json,$data['bolum_id']);
    } elseif ($collection === 'bolumler') {
        $stmt=$mysqli->prepare('INSERT INTO departments (id,ad,aktif) VALUES (?,?,1)'); $stmt->bind_param('ss',$id,$data['ad']);
    } else fail('Bu koleksiyona kayıt eklenemez.');
    if (!$stmt->execute()) fail('Kayıt eklenemedi: '.$stmt->error, 500); return $id;
}
function update_document($collection, $id, $data) {
    $mysqli=db(); $allowed=['makineler'=>['kod','ad','bolum_id','bolum_ad','ekleyen_email','aktif'],'arizalar'=>['durum','sorumlu_email','cozulme_tarihi','cozen_sorumlu_id','durum_gecmisi','aciklama','foto_url'],'sorumlular'=>['ad_soyad','telefon','rol','bolum_idler','bolum_id','aktif'],'yoneticiler'=>['ad_soyad','telefon','rol','bolum_idler','bolum_id','aktif']][$collection] ?? [];
    $table=collection_table($collection); $sets=[]; $values=[]; $types=''; foreach($allowed as $field){ if(array_key_exists($field,$data)){ $sets[]="`$field` = ?"; $value=$data[$field]; if(is_array($value)) $value=json_encode($value,JSON_UNESCAPED_UNICODE); $values[]=$value; $types.='s'; }} if(!$sets) return; $values[]=$id; $types.='s'; $sql="UPDATE `$table` SET ".implode(',',$sets)." WHERE id = ?"; $stmt=$mysqli->prepare($sql); $stmt->bind_param($types,...$values); if(!$stmt->execute()) fail('Kayıt güncellenemedi.',500);
}
$action=$_GET['action'] ?? ''; $payload=input();
if ($action==='session') { $user=current_user(); respond(['user'=>public_user($user)]); }
if ($action==='login') { $email=trim($payload['email']??''); $password=$payload['password']??''; $stmt=db()->prepare('SELECT * FROM users WHERE email = ? AND aktif = 1 LIMIT 1'); $stmt->bind_param('s',$email); $stmt->execute(); $user=$stmt->get_result()->fetch_assoc(); if(!$user || !password_verify($password,$user['password_hash'])) fail('E-posta veya şifre hatalı.',401); $_SESSION['user_id']=$user['id']; db()->query("UPDATE users SET son_giris_tarihi=NOW() WHERE id='".db()->real_escape_string($user['id'])."'"); respond(['user'=>public_user($user)]); }
if ($action==='register') { $email=trim($payload['email']??''); if(!$email || strlen($payload['password']??'')<6) fail('Geçerli bir e-posta ve en az 6 karakterli şifre gerekli.'); $id=insert_document('sorumlular',null,['email'=>$email,'password'=>$payload['password'],'ad_soyad'=>'','telefon'=>'','bolum_idler'=>[],'bolum_id'=>'']); $_SESSION['user_id']=$id; $stmt=db()->prepare('SELECT * FROM users WHERE id=?'); $stmt->bind_param('s',$id); $stmt->execute(); respond(['user'=>public_user($stmt->get_result()->fetch_assoc())]); }
if ($action==='logout') { $_SESSION=[]; session_destroy(); respond(['ok'=>true]); }
if ($action==='list') { $items=find_rows($payload['collection']??''); $items=array_values(array_filter($items,fn($item)=>matches_filters($item,$payload['filters']??[]))); respond(['items'=>$items]); }
if ($action==='get') { $collection=$payload['collection']??''; $id=$payload['id']??''; $items=find_rows($collection); foreach($items as $item) if(($item['id']??'')===$id) respond(['item'=>$item]); respond(['item'=>null]); }
if ($action==='create') { $id=insert_document($payload['collection']??'',null,$payload['data']??[]); respond(['id'=>$id]); }
if ($action==='set') { $collection=$payload['collection']??''; $id=$payload['id']??uuid(); $items=find_rows($collection); $exists=false; foreach($items as $item) if(($item['id']??'')===$id) $exists=true; if($exists) update_document($collection,$id,$payload['data']??[]); else insert_document($collection,$id,$payload['data']??[]); respond(['ok'=>true]); }
if ($action==='update') { update_document($payload['collection']??'', $payload['id']??'', $payload['data']??[]); respond(['ok'=>true]); }
if ($action==='delete') { $table=collection_table($payload['collection']??''); if(!$table) fail('Geçersiz koleksiyon.'); $stmt=db()->prepare("DELETE FROM `$table` WHERE id=?"); $stmt->bind_param('s',$payload['id']); if(!$stmt->execute()) fail('Kayıt silinemedi.',500); respond(['ok'=>true]); }
fail('Geçersiz API isteği.',404);
