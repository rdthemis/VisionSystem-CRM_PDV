<?php
require_once __DIR__.'/../config/Security.php';
require_once __DIR__.'/../config/Database.php';

$database = new Database();
$security = new Security($database->getConnection());

// ✅ TROCAR PELA SUA SENHA AQUI
$senha = '@rdTh3m1s';  // A senha que você quer usar

$hash = $security->hashPassword($senha);

echo "✅ Hash bcrypt gerado:\n\n";
echo $hash;
echo "\n\n";
echo "Execute no MySQL:\n\n";
echo "UPDATE usuarios \n";
echo "SET password_hash = '{$hash}', \n";
echo "    senha = NULL \n";
echo "WHERE email = 'rdthemis@gmail.com';\n";