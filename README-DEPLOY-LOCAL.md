# 🚀 VisionSystem-CRM_PDV — Guia de Deploy Local (Windows)

> **Autor:** Reinaldo / Gelatto Mannia  
> **Versão:** 1.0.0  
> **Última atualização:** Abril 2026  
> **Ambiente:** Windows 10/11 | PHP 8.2 (NTS) | MySQL 8.0 | Apache 2.4 | React 18

---

## 📋 Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Estrutura do Projeto](#2-estrutura-do-projeto)
3. [Configuração do MySQL](#3-configuração-do-mysql)
4. [Configuração do Backend (.env)](#4-configuração-do-backend-env)
5. [Configuração do Frontend (.env)](#5-configuração-do-frontend-env)
6. [Build do React (Produção)](#6-build-do-react-produção)
7. [Instalação do Apache](#7-instalação-do-apache)
8. [PHP como Serviço (NSSM)](#8-php-como-serviço-nssm)
9. [Apache como Serviço](#9-apache-como-serviço)
10. [Verificação dos Serviços](#10-verificação-dos-serviços)
11. [Teste Completo](#11-teste-completo)
12. [Comandos Úteis do Dia a Dia](#12-comandos-úteis-do-dia-a-dia)
13. [Troubleshooting (Solução de Problemas)](#13-troubleshooting-solução-de-problemas)
14. [Segurança — Checklist de Produção](#14-segurança--checklist-de-produção)
15. [Backup](#15-backup)
16. [Atualizando o Sistema](#16-atualizando-o-sistema)

---

## 1. Pré-requisitos

Antes de começar, confirme que está tudo instalado:

```bash
# Verificar PHP
php -v
# Esperado: PHP 8.2.x (cli) (NTS)

# Verificar MySQL
mysql --version
# Esperado: mysql Ver 8.0.x

# Verificar Node.js (para build do React)
node -v
# Esperado: v18.x ou superior

# Verificar npm
npm -v
```

### Software necessário

| Software | Versão | Download |
|----------|--------|----------|
| PHP | 8.2+ (NTS x64) | https://windows.php.net/download |
| MySQL | 8.0+ | https://dev.mysql.com/downloads |
| Node.js | 18+ | https://nodejs.org |
| Apache | 2.4+ | https://www.apachelounge.com/download |
| NSSM | 2.24+ | https://nssm.cc/download |

### Caminhos padrão do projeto

| Componente | Caminho |
|------------|---------|
| PHP | `C:\php\php.exe` |
| Apache | `C:\Apache24\` |
| NSSM | `C:\Apache24\bin\nssm.exe` |
| Backend | `C:\projetos\VisionSystem-CRM_PDV\backend\` |
| Frontend | `C:\projetos\VisionSystem-CRM_PDV\frontend\` |
| Build React | `C:\projetos\VisionSystem-CRM_PDV\frontend\build\` |

---

## 2. Estrutura do Projeto

```
C:\projetos\VisionSystem-CRM_PDV\
│
├── backend\
│   ├── public\
│   │   └── index.php              ← Entry point da API
│   ├── config\
│   │   ├── Database.php
│   │   ├── Security.php
│   │   ├── SecurityHeaders.php
│   │   ├── Logger.php
│   │   └── environment.php        ← Carrega .env e detecta ambiente
│   ├── controllers\
│   ├── models\
│   ├── middleware\
│   ├── logs\                       ← Logs da aplicação (não commitar)
│   ├── .env                        ← Configurações sensíveis (não commitar)
│   └── .gitignore
│
├── frontend\
│   ├── src\
│   ├── public\
│   ├── build\                      ← Gerado pelo npm run build
│   ├── .env                        ← Configurações do React (não commitar)
│   ├── .gitignore
│   └── package.json
│
└── README-DEPLOY-LOCAL.md          ← Este arquivo
```

---

## 3. Configuração do MySQL

### 3.1. Criar usuário dedicado (NÃO usar root em produção!)

Conecte como root:

```bash
mysql -u root -p
```

Crie o usuário da aplicação:

```sql
-- Criar usuário com senha forte
CREATE USER 'gelatto_app'@'localhost' IDENTIFIED BY 'SuaSenhaForteAqui!';

-- Dar apenas permissões necessárias (NUNCA CREATE, DROP, ALTER)
GRANT SELECT, INSERT, UPDATE, DELETE ON projeto_crm.* TO 'gelatto_app'@'localhost';

-- Aplicar
FLUSH PRIVILEGES;
```

### 3.2. Alterar senha do usuário (se necessário)

```sql
ALTER USER 'gelatto_app'@'localhost' IDENTIFIED BY 'NovaSenhaForte!';
FLUSH PRIVILEGES;
```

### 3.3. Verificar se MySQL roda como serviço

```bash
# No PowerShell como Administrador
sc.exe query MySQL80
# Deve retornar ESTADO: 4 RUNNING
```

### 3.4. Criar tabelas manualmente (se necessário)

O usuário `gelatto_app` não tem permissão de CREATE. Se o sistema precisar de tabelas novas, crie como root:

```bash
mysql -u root -p projeto_crm < caminho/para/migration.sql
```

---

## 4. Configuração do Backend (.env)

Crie/edite o arquivo `backend/.env`:

```dotenv
# =========================================
# BANCO DE DADOS
# =========================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=projeto_crm
DB_USER=gelatto_app
DB_PASS=SuaSenhaForteAqui!

# =========================================
# APLICAÇÃO
# =========================================
APP_ENV=production
APP_DEBUG=false
APP_URL=http://localhost

# =========================================
# JWT (gere um novo com: php -r "echo bin2hex(random_bytes(32));")
# =========================================
JWT_SECRET=seu_jwt_secret_de_64_caracteres_aqui
JWT_EXPIRATION=86400

# =========================================
# CORS
# =========================================
CORS_ALLOWED_ORIGINS=http://localhost,http://localhost:3000
CORS_ALLOWED_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization

# =========================================
# EMAIL
# =========================================
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=seu_email@gmail.com
MAIL_PASSWORD=sua_senha_app
MAIL_FROM_ADDRESS=seu_email@gmail.com
MAIL_FROM_NAME="Sistema de Gestão"

# =========================================
# LOG
# =========================================
LOG_LEVEL=info
LOG_FILE=logs/app.log

# =========================================
# EMPRESA
# =========================================
APP_EMPRESA=SORVETES_GELATTO_MANNIA
APP_ENDERECO=Rua_Guarani_191,_Corumbataí_do_Sul_PR
APP_TELEFONE=(44)9.9826-4006
```

### ⚠️ Regras importantes do .env

- **NUNCA** commitar no Git (já está no `.gitignore`)
- **NUNCA** usar credenciais de exemplo em produção
- Gerar JWT_SECRET novo: `php -r "echo bin2hex(random_bytes(32));"`
- Senhas com caracteres especiais: colocar entre aspas `DB_PASS="senh@F0rte!"`

---

## 5. Configuração do Frontend (.env)

Crie/edite o arquivo `frontend/.env`:

```dotenv
# URL da API Backend
REACT_APP_API_URL=http://localhost:8000

# Ambiente
REACT_APP_ENV=production

# Debug desligado em produção
REACT_APP_DEBUG=false

# Nome da aplicação
REACT_APP_NAME="VisionSystem PDV"

# Versão
REACT_APP_VERSION=1.0.0
```

### ⚠️ Importante

- Mudanças no `.env` do frontend exigem **novo build** (`npm run build`)
- Variáveis do React DEVEM começar com `REACT_APP_`
- **NUNCA** colocar senhas, tokens ou API keys no `.env` do frontend (ele é público!)

---

## 6. Build do React (Produção)

```bash
cd C:\projetos\VisionSystem-CRM_PDV\frontend

# Instalar dependências (se necessário)
npm install

# Gerar build de produção
npm run build
```

Resultado esperado:

```
Compiled successfully.

File sizes after gzip:
  ~185 kB  build\static\js\main.xxxxx.js
  ~36 kB   build\static\css\main.xxxxx.css
```

A pasta `build/` contém os arquivos estáticos que o Apache vai servir.

### Atualizar dados do browserslist (opcional, remove warnings)

```bash
npx update-browserslist-db@latest
```

---

## 7. Instalação do Apache

### 7.1. Download e extração

1. Baixe de: https://www.apachelounge.com/download
2. Extraia para `C:\Apache24\`
3. Confirme que existe: `C:\Apache24\bin\httpd.exe`

### 7.2. Configuração do httpd.conf

Edite `C:\Apache24\conf\httpd.conf`:

**a) Descomente o mod_rewrite:**

```apache
LoadModule rewrite_module modules/mod_rewrite.dll
```

**b) Altere DocumentRoot para o build do React:**

```apache
DocumentRoot "C:/projetos/VisionSystem-CRM_PDV/frontend/build"
<Directory "C:/projetos/VisionSystem-CRM_PDV/frontend/build">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```

**c) Adicione no final do arquivo (React Router):**

```apache
# React Router - redireciona rotas para index.html
<Directory "C:/projetos/VisionSystem-CRM_PDV/frontend/build">
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</Directory>
```

### 7.3. Testar configuração

```bash
C:\Apache24\bin\httpd.exe -t
# Deve retornar: Syntax OK
```

---

## 8. PHP como Serviço (NSSM)

O PHP embutido (`php -S`) não é um servidor de produção. Usamos o NSSM para rodá-lo como serviço do Windows.

### 8.1. Instalar NSSM

1. Baixe de: https://nssm.cc/download
2. Extraia e copie `win64/nssm.exe` para `C:\Apache24\bin\`

### 8.2. Criar o serviço PHP

No PowerShell **como Administrador**:

```bash
# Instalar o serviço
C:\Apache24\bin\nssm.exe install PhpServer "C:\php\php.exe" "-S localhost:8000 -t public"

# Configurar diretório de trabalho
C:\Apache24\bin\nssm.exe set PhpServer AppDirectory "C:\projetos\VisionSystem-CRM_PDV\backend"

# Iniciar o serviço
net start PhpServer
```

### 8.3. Verificar

```bash
sc.exe query PhpServer
# Deve retornar ESTADO: 4 RUNNING
```

---

## 9. Apache como Serviço

No PowerShell **como Administrador**:

```bash
# Instalar como serviço
C:\Apache24\bin\httpd.exe -k install

# Iniciar
net start Apache2.4
```

### Verificar

```bash
sc.exe query Apache2.4
# Deve retornar ESTADO: 4 RUNNING
```

---

## 10. Verificação dos Serviços

Após a instalação, os 3 serviços devem estar rodando:

```bash
# Verificar todos de uma vez
sc.exe query Apache2.4
sc.exe query PhpServer
sc.exe query MySQL80
```

Todos devem retornar `ESTADO: 4 RUNNING`.

### Teste de inicialização automática

1. **Reinicie o computador**
2. Abra o PowerShell e rode os 3 comandos acima
3. Todos devem estar RUNNING sem intervenção manual

---

## 11. Teste Completo

Após o deploy, faça estes testes na ordem:

| # | Teste | URL/Ação | Resultado esperado |
|---|-------|----------|--------------------|
| 1 | Frontend carrega | `http://localhost` | Tela de login aparece |
| 2 | API responde | `http://localhost:8000` | JSON: "API funcionando" |
| 3 | Login funciona | Digitar credenciais | Entra no sistema |
| 4 | Criar pedido | Adicionar itens ao carrinho | Itens aparecem no carrinho |
| 5 | Impressão comanda | Botão "Imprimir" | Comanda sai na Bematech |
| 6 | Impressão conta | Botão "Conta" → Imprimir | Conta com valores sai na impressora |
| 7 | Pagamento | Processar pagamento | Registra no caixa |
| 8 | Caixa | Abrir/fechar caixa | Movimentos registrados |
| 9 | Reiniciar PC | Reiniciar e testar | Tudo funciona sem abrir terminal |

---

## 12. Comandos Úteis do Dia a Dia

### Gerenciar serviços

```bash
# ── PARAR serviços ──
net stop Apache2.4
net stop PhpServer
net stop MySQL80

# ── INICIAR serviços ──
net start Apache2.4
net start PhpServer
net start MySQL80

# ── REINICIAR (parar + iniciar) ──
net stop PhpServer && net start PhpServer
net stop Apache2.4 && net start Apache2.4
```

### Quando usar cada comando

| Situação | Comando |
|----------|---------|
| Alterou o `.env` do backend | `net stop PhpServer && net start PhpServer` |
| Fez novo build do React | `net stop Apache2.4 && net start Apache2.4` |
| Alterou `httpd.conf` | `net stop Apache2.4 && net start Apache2.4` |
| Banco de dados travou | `net stop MySQL80 && net start MySQL80` |
| Tudo travou | Parar e iniciar os 3 serviços |

### Verificar logs

```bash
# Logs do PHP/aplicação
type C:\projetos\VisionSystem-CRM_PDV\backend\logs\app.log

# Logs de erro do Apache
type C:\Apache24\logs\error.log

# Limpar logs antigos (cuidado!)
del C:\projetos\VisionSystem-CRM_PDV\backend\logs\*.log
```

### Testar configuração do Apache

```bash
C:\Apache24\bin\httpd.exe -t
```

### Rebuild do frontend

```bash
cd C:\projetos\VisionSystem-CRM_PDV\frontend
npm run build
net stop Apache2.4 && net start Apache2.4
```

---

## 13. Troubleshooting (Solução de Problemas)

### ❌ Erro CORS ao fazer login

**Causa:** a origem do frontend não está na lista de origens permitidas.

**Solução:** edite `backend/.env`:

```dotenv
CORS_ALLOWED_ORIGINS=http://localhost,http://localhost:3000
```

Reinicie: `net stop PhpServer && net start PhpServer`

### ❌ Tela branca no navegador

**Causa:** build do React não foi gerado ou Apache apontando para pasta errada.

**Solução:**

```bash
# Verificar se o build existe
dir C:\projetos\VisionSystem-CRM_PDV\frontend\build\index.html

# Se não existir, gerar
cd C:\projetos\VisionSystem-CRM_PDV\frontend
npm run build
```

### ❌ API retorna HTML em vez de JSON

**Causa:** erro PHP gerando output HTML antes do JSON (warning ou erro de sintaxe).

**Solução:**

```bash
# Verificar sintaxe de todos os arquivos PHP
php -l C:\projetos\VisionSystem-CRM_PDV\backend\public\index.php
php -l C:\projetos\VisionSystem-CRM_PDV\backend\config\environment.php
```

Verifique se `APP_ENV=production` no `.env` (suprime warnings).

### ❌ "Constant IS_PRODUCTION already defined"

**Causa:** `environment.php` sendo carregado mais de uma vez.

**Solução:** use o guard no `environment.php`:

```php
if (!defined('IS_PRODUCTION')) {
    $isProduction = ($_ENV['APP_ENV'] ?? 'development') === 'production';
    define('IS_PRODUCTION', $isProduction);
}
```

### ❌ Impressora não encontrada

**Causa:** nome de compartilhamento incorreto.

**Solução:**

1. Painel de Controle → Impressoras
2. Botão direito na Bematech → Propriedades → Compartilhamento
3. Anote o nome (ex: `MP-2500 TH`)
4. Edite `print_comanda.php`:

```php
'device' => $isWindows ? 'MP-2500 TH' : '/dev/usb/lp0',
```

### ❌ "Campo 'user_tipo' é obrigatório" ao vender

**Causa:** frontend enviando `tipo` em vez de `user_tipo`.

**Solução:** no `caixaService.js`, use `user_tipo: 'entrada'`.

### ❌ MySQL "CREATE command denied"

**Causa:** o usuário `gelatto_app` não tem permissão de CREATE.

**Solução:** crie a tabela manualmente como root:

```bash
mysql -u root -p projeto_crm
```

```sql
CREATE TABLE IF NOT EXISTS nome_da_tabela (...);
```

### ❌ Serviço não inicia após reiniciar

```bash
# Verificar status
sc.exe query NomeDoServico

# Ver logs de erro do Windows
eventvwr.msc
# Navegue: Logs do Windows → Aplicativo
```

---

## 14. Segurança — Checklist de Produção

Antes de usar o sistema na loja, confirme todos os itens:

### Backend

- [ ] `APP_ENV=production` no `.env`
- [ ] `APP_DEBUG=false` no `.env`
- [ ] `JWT_SECRET` com 64+ caracteres aleatórios (gere novo com `php -r "echo bin2hex(random_bytes(32));"`)
- [ ] `DB_USER` NÃO é `root` (use `gelatto_app` ou similar)
- [ ] `DB_PASS` é uma senha forte
- [ ] `CORS_ALLOWED_ORIGINS` lista apenas origens necessárias
- [ ] `.env` está no `.gitignore`
- [ ] Nenhum `error_log` vaza dados sensíveis (senhas, tokens)
- [ ] Mensagens de erro genéricas para o usuário (detalhes só nos logs)
- [ ] `display_errors = Off` em produção (configurado no `environment.php`)

### Frontend

- [ ] `REACT_APP_ENV=production`
- [ ] `REACT_APP_DEBUG=false`
- [ ] Nenhuma API key ou secret no `.env` do frontend
- [ ] `DANGEROUSLY_DISABLE_HOST_CHECK` removido
- [ ] `SKIP_PREFLIGHT_CHECK` removido
- [ ] Build gerado com `npm run build`

### Banco de Dados

- [ ] Usuário dedicado (`gelatto_app`) com permissões mínimas (SELECT, INSERT, UPDATE, DELETE)
- [ ] Senha forte para o usuário do banco
- [ ] MySQL rodando como serviço do Windows (inicia automático)

### Impressora

- [ ] Bematech MP-2500 TH compartilhada no Windows
- [ ] Nome de compartilhamento configurado no `print_comanda.php`
- [ ] Configuração de 41 colunas para papel 58mm

---

## 15. Backup

### Backup manual do banco de dados

```bash
# Exportar banco completo
mysqldump -u root -p projeto_crm > backup_projeto_crm_%date:~6,4%%date:~3,2%%date:~0,2%.sql
```

### Restaurar backup

```bash
mysql -u root -p projeto_crm < backup_arquivo.sql
```

### Recomendação para o futuro

- Configurar backup automático diário (Task Scheduler do Windows)
- Enviar backup para nuvem (Google Drive, OneDrive)
- Testar restauração periodicamente

---

## 16. Atualizando o Sistema

Quando fizer alterações no código:

### Atualização do Backend (PHP)

```bash
# 1. Faça as alterações no código
# 2. Teste a sintaxe
php -l public/index.php

# 3. Reinicie o serviço
net stop PhpServer && net start PhpServer
```

### Atualização do Frontend (React)

```bash
# 1. Faça as alterações no código
cd C:\projetos\VisionSystem-CRM_PDV\frontend

# 2. Gere novo build
npm run build

# 3. Reinicie o Apache
net stop Apache2.4 && net start Apache2.4
```

### Atualização do Banco de Dados (novas tabelas/colunas)

```bash
# Conecte como root
mysql -u root -p projeto_crm

# Execute as alterações
ALTER TABLE pedidos ADD COLUMN nova_coluna VARCHAR(255);
```

---

## 📌 Referência Rápida

```
┌─────────────────────────────────────────────────┐
│           ARQUITETURA DO DEPLOY LOCAL            │
│                                                  │
│  Navegador ──→ Apache (porta 80)                │
│                  │                               │
│                  ├──→ React Build (arquivos .html │
│                  │    .js, .css estáticos)        │
│                  │                               │
│                  └──→ API PHP (porta 8000)        │
│                         │                        │
│                         ├──→ MySQL (porta 3306)  │
│                         │                        │
│                         └──→ Impressora Bematech │
│                              (USB compartilhada) │
│                                                  │
│  Serviços Windows:                               │
│    • Apache2.4   → porta 80  (frontend)          │
│    • PhpServer   → porta 8000 (backend API)      │
│    • MySQL80     → porta 3306 (banco de dados)   │
└─────────────────────────────────────────────────┘
```

---

> **Nota:** Este documento foi criado durante o processo de desenvolvimento e deploy do VisionSystem-CRM_PDV para a loja Sorvetes Gelatto Mannia, Corumbataí do Sul - PR.
