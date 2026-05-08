<?php

require_once __DIR__.'/../vendor/autoload.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

class EmailService
{
    private $db;
    private $configuracoes;

    public function __construct($database)
    {
        $this->db = $database;
        $this->carregarConfiguracoes();
    }

    /**
     * Carregar configurações de email do banco.
     */
    private function carregarConfiguracoes()
    {
        try {
            $pdo = $this->db->getConnection();

            // Criar tabela se não existir
            {/*}
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS configuracoes_email (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    smtp_host VARCHAR(255) NOT NULL,
                    smtp_port INT NOT NULL DEFAULT 587,
                    smtp_username VARCHAR(255) NOT NULL,
                    smtp_password VARCHAR(255) NOT NULL,
                    smtp_secure VARCHAR(10) DEFAULT 'tls',
                    from_address VARCHAR(255),
                    from_name VARCHAR(255) DEFAULT 'GelattoApp',
                    ativo BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            ");
            */}
            $stmt = $pdo->query('
                SELECT * FROM configuracoes_email 
                WHERE ativo = 1 
                ORDER BY id DESC 
                LIMIT 1
            ');

            $config = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($config) {
                $this->configuracoes = [
                    'smtp_host' => $config['smtp_host'],
                    'smtp_port' => $config['smtp_port'],
                    'smtp_username' => $config['smtp_username'],
                    'smtp_password' => $config['smtp_password'],
                    'smtp_secure' => $config['smtp_secure'],
                    'from_address' => $config['from_address'] ?: $config['smtp_username'],
                    'from_name' => $config['from_name'] ?: 'GelattoApp',
                ];

                error_log('📧 Configurações de email carregadas: '.$config['smtp_host']);
            } else {
                $this->configuracoes = null;
                error_log('⚠️ Nenhuma configuração de email encontrada');
            }
        } catch (Exception $e) {
            error_log('❌ Erro ao carregar configurações de email: '.$e->getMessage());
            $this->configuracoes = null;
        }
    }

    /**
     * Verificar se o email está configurado.
     */
    public function isConfigurado()
    {
        return $this->configuracoes !== null;
    }

    /**
     * Salvar configurações de email.
     */
    public function salvarConfiguracoes($dados)
    {
        try {
            $pdo = $this->db->getConnection();

            // Desativar configurações antigas
            $pdo->exec('UPDATE configuracoes_email SET ativo = 0');

            // Inserir nova configuração
            $stmt = $pdo->prepare('
                INSERT INTO configuracoes_email (
                    smtp_host, smtp_port, smtp_username, smtp_password, 
                    smtp_secure, from_address, from_name, ativo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            ');

            $stmt->execute([
                $dados['smtp_host'],
                $dados['smtp_port'] ?: 587,
                $dados['smtp_username'],
                $dados['smtp_password'],
                $dados['smtp_secure'] ?: 'tls',
                $dados['from_address'] ?: $dados['smtp_username'],
                $dados['from_name'] ?: 'GelattoApp',
            ]);

            // Recarregar configurações
            $this->carregarConfiguracoes();

            error_log('✅ Configurações de email salvas com sucesso');

            return [
                'success' => true,
                'message' => 'Configurações de email salvas com sucesso!',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao salvar configurações de email: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao salvar configurações de email: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Enviar email.
     */
    public function enviarEmail($destinatario, $assunto, $corpo, $anexos = [])
    {
        try {
            if (!$this->isConfigurado()) {
                throw new Exception('Email não está configurado. Configure primeiro nas integrações.');
            }

            error_log('📧 Preparando envio para: '.$destinatario);

            $mail = new PHPMailer(true);

            // Configurações do servidor
            $mail->isSMTP();
            $mail->Host = $this->configuracoes['smtp_host'];
            $mail->SMTPAuth = true;
            $mail->Username = $this->configuracoes['smtp_username'];
            $mail->Password = $this->configuracoes['smtp_password'];
            $mail->SMTPSecure = $this->configuracoes['smtp_secure'];
            $mail->Port = $this->configuracoes['smtp_port'];
            $mail->CharSet = 'UTF-8';

            // Configurações adicionais
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                ],
            ];

            // Remetente
            $mail->setFrom(
                $this->configuracoes['from_address'],
                $this->configuracoes['from_name']
            );

            // Destinatário
            $mail->addAddress($destinatario);

            // Conteúdo
            $mail->isHTML(true);
            $mail->Subject = $assunto;
            $mail->Body = $corpo;

            // Anexos
            foreach ($anexos as $anexo) {
                if (is_array($anexo) && isset($anexo['path'])) {
                    $mail->addAttachment($anexo['path'], $anexo['name'] ?? '');
                } else {
                    $mail->addAttachment($anexo);
                }
            }

            // Enviar
            $mail->send();

            error_log('✅ Email enviado com sucesso para: '.$destinatario);

            return [
                'success' => true,
                'message' => 'Email enviado com sucesso!',
            ];
        } catch (Exception $e) {
            error_log('❌ Erro ao enviar email: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao enviar email: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Testar configuração de email.
     */
    public function testarConfiguracao($emailTeste = null)
    {
        try {
            if (!$this->isConfigurado()) {
                throw new Exception('Configure o email primeiro antes de testar.');
            }

            $emailDestino = $emailTeste ?: $this->configuracoes['smtp_username'];

            $assunto = '✅ Teste de Configuração - GelattoApp';
            $corpo = $this->getTemplateTesteEmail();

            error_log('🧪 Testando email para: '.$emailDestino);

            return $this->enviarEmail($emailDestino, $assunto, $corpo);
        } catch (Exception $e) {
            error_log('❌ Erro no teste de email: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro no teste: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Enviar recibo por email.
     */
    public function enviarRecibo($reciboId, $emailCliente, $nomeCliente = '')
    {
        try {
            if (!$this->isConfigurado()) {
                throw new Exception('Configure o email primeiro.');
            }

            error_log('🧾 Preparando envio de recibo ID: '.$reciboId);

            // Buscar dados do recibo
            $recibos = new Recibos($this->db);
            $resultadoRecibo = $recibos->buscarPorId($reciboId);

            if (!$resultadoRecibo['success']) {
                throw new Exception('Recibo não encontrado');
            }

            $recibo = $resultadoRecibo['data'];

            // Preparar dados do email
            $assunto = "🧾 Recibo de Pagamento - #{$recibo['numero_recibo']}";

            $corpo = $this->getTemplateReciboEmail([
                'nome_cliente' => $nomeCliente ?: $recibo['cliente_nome'],
                'numero_recibo' => $recibo['numero_recibo'],
                'valor' => 'R$ '.number_format($recibo['valor_liquido'], 2, ',', '.'),
                'data_pagamento' => date('d/m/Y', strtotime($recibo['data_pagamento'])),
                'forma_pagamento' => ucfirst($recibo['forma_pagamento']),
                'descricao' => $recibo['descricao'],
            ]);

            error_log('📧 Enviando recibo para: '.$emailCliente);

            // Enviar email
            $resultado = $this->enviarEmail($emailCliente, $assunto, $corpo);

            if ($resultado['success']) {
                error_log('✅ Recibo enviado com sucesso!');
            }

            return $resultado;
        } catch (Exception $e) {
            error_log('❌ Erro ao enviar recibo por email: '.$e->getMessage());

            return [
                'success' => false,
                'message' => 'Erro ao enviar recibo: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Template de email para recibo.
     */
    private function getTemplateReciboEmail($dados)
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Recibo de Pagamento</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 300;
                }
                .content {
                    padding: 30px;
                }
                .greeting {
                    font-size: 18px;
                    margin-bottom: 20px;
                    color: #2c3e50;
                }
                .recibo-info {
                    background: #f8f9ff;
                    border-left: 4px solid #667eea;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 0 8px 8px 0;
                }
                .recibo-info h3 {
                    margin: 0 0 15px 0;
                    color: #2c3e50;
                    font-size: 18px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #ecf0f1;
                }
                .info-row:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                    padding-bottom: 0;
                }
                .info-label {
                    font-weight: 600;
                    color: #555;
                }
                .info-value {
                    color: #2c3e50;
                }
                .valor-destaque {
                    font-size: 20px;
                    font-weight: bold;
                    color: #27ae60;
                }
                .descricao-box {
                    background: #fff;
                    border: 1px solid #ecf0f1;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                }
                .footer {
                    background: #34495e;
                    color: white;
                    text-align: center;
                    padding: 20px;
                    font-size: 14px;
                }
                .footer a {
                    color: #3498db;
                    text-decoration: none;
                }
                .checkmark {
                    color: #27ae60;
                    font-size: 24px;
                    margin-right: 10px;
                }
                @media (max-width: 600px) {
                    .container { margin: 10px; }
                    .content { padding: 20px; }
                    .info-row { flex-direction: column; gap: 5px; }
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🧾 Recibo de Pagamento</h1>
                    <p style='margin: 10px 0 0 0; opacity: 0.9;'>Comprovante de Pagamento Recebido</p>
                </div>
                
                <div class='content'>
                    <div class='greeting'>
                        <span class='checkmark'>✅</span>
                        Olá <strong>{$dados['nome_cliente']}</strong>,
                    </div>
                    
                    <p>Seu pagamento foi recebido com sucesso! Segue abaixo o comprovante para seus registros:</p>
                    
                    <div class='recibo-info'>
                        <h3>📋 Detalhes do Pagamento</h3>
                        
                        <div class='info-row'>
                            <span class='info-label'>Número do Recibo:</span>
                            <span class='info-value'><strong>{$dados['numero_recibo']}</strong></span>
                        </div>
                        
                        <div class='info-row'>
                            <span class='info-label'>Valor Pago:</span>
                            <span class='info-value valor-destaque'>{$dados['valor']}</span>
                        </div>
                        
                        <div class='info-row'>
                            <span class='info-label'>Data do Pagamento:</span>
                            <span class='info-value'>{$dados['data_pagamento']}</span>
                        </div>
                        
                        <div class='info-row'>
                            <span class='info-label'>Forma de Pagamento:</span>
                            <span class='info-value'>{$dados['forma_pagamento']}</span>
                        </div>
                    </div>
                    
                    <div class='descricao-box'>
                        <strong>Descrição:</strong><br>
                        {$dados['descricao']}
                    </div>
                    
                    <p style='color: #27ae60; font-weight: 500;'>
                        ✅ Pagamento confirmado e processado com sucesso!
                    </p>
                    
                    <p style='margin-top: 30px; color: #666; font-size: 14px;'>
                        Este recibo serve como comprovante de pagamento. Guarde-o para seus registros.
                    </p>
                </div>
                
                <div class='footer'>
                    <p style='margin: 0;'>Este é um email automático do <strong>GelattoApp</strong></p>
                    <p style='margin: 5px 0 0 0; opacity: 0.8;'>
                        Em caso de dúvidas, entre em contato conosco
                    </p>
                </div>
            </div>
        </body>
        </html>
        ";
    }

    /**
     * Template de email de teste.
     */
    private function getTemplateTesteEmail()
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <title>Teste de Email</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                }
                .header {
                    background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
                    color: white;
                    padding: 30px 20px;
                    text-align: center;
                }
                .content {
                    padding: 30px;
                }
                .success-box {
                    background: #d4edda;
                    border: 1px solid #c3e6cb;
                    border-radius: 5px;
                    padding: 20px;
                    margin: 20px 0;
                    border-left: 4px solid #28a745;
                }
                .info-list {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 15px 0;
                }
                .footer {
                    background: #343a40;
                    color: white;
                    text-align: center;
                    padding: 20px;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>✅ Teste de Configuração</h1>
                    <p style='margin: 10px 0 0 0; opacity: 0.9;'>Sistema de Email</p>
                </div>
                
                <div class='content'>
                    <div class='success-box'>
                        <h2 style='margin: 0 0 15px 0; color: #155724;'>🎉 Parabéns!</h2>
                        <p style='margin: 0; color: #155724;'>
                            Se você está lendo este email, significa que suas configurações de SMTP estão funcionando perfeitamente!
                        </p>
                    </div>
                    
                    <h3>📊 Informações do Teste:</h3>
                    <div class='info-list'>
                        <p><strong>📅 Data/Hora:</strong> ".date('d/m/Y H:i:s')."</p>
                        <p><strong>🖥️ Servidor:</strong> {$this->configuracoes['smtp_host']}</p>
                        <p><strong>🔌 Porta:</strong> {$this->configuracoes['smtp_port']}</p>
                        <p><strong>👤 Usuário:</strong> {$this->configuracoes['smtp_username']}</p>
                        <p><strong>🔒 Segurança:</strong> {$this->configuracoes['smtp_secure']}</p>
                    </div>
                    
                    <div style='background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;'>
                        <p style='margin: 0; color: #0d47a1;'>
                            <strong>🚀 Agora você pode:</strong><br>
                            • Enviar recibos por email automaticamente<br>
                            • Configurar notificações de vencimento<br>
                            • Enviar relatórios por email<br>
                            • Comunicar-se automaticamente com clientes
                        </p>
                    </div>
                    
                    <p style='color: #666; font-size: 14px; margin-top: 30px;'>
                        Este foi um teste automático do GelattoApp. Suas configurações estão funcionando corretamente!
                    </p>
                </div>
                
                <div class='footer'>
                    <p style='margin: 0;'>GelattoApp - Teste de Configuração</p>
                    <p style='margin: 5px 0 0 0; opacity: 0.8;'>
                        Configuração realizada com sucesso!
                    </p>
                </div>
            </div>
        </body>
        </html>
        ";
    }

    /**
     * Obter configurações atuais.
     */
    public function obterConfiguracoes()
    {
        if (!$this->configuracoes) {
            return [
                'success' => false,
                'message' => 'Nenhuma configuração encontrada',
                'data' => [
                    'ativo' => false,
                    'smtp_host' => '',
                    'smtp_port' => 587,
                    'smtp_username' => '',
                    'smtp_password' => '',
                    'smtp_secure' => 'tls',
                    'from_address' => '',
                    'from_name' => 'GelattoApp',
                ],
            ];
        }

        return [
            'success' => true,
            'data' => [
                'ativo' => true,
                'smtp_host' => $this->configuracoes['smtp_host'],
                'smtp_port' => $this->configuracoes['smtp_port'],
                'smtp_username' => $this->configuracoes['smtp_username'],
                'smtp_password' => '', // Não retornar senha por segurança
                'smtp_secure' => $this->configuracoes['smtp_secure'],
                'from_address' => $this->configuracoes['from_address'],
                'from_name' => $this->configuracoes['from_name'],
            ],
        ];
    }
}