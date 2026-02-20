// src/services/thermalPrintService.js
// Serviço específico para impressão térmica com comandos ESC/POS
import printService from "./printService";

class ThermalPrintService {
    constructor() {
        this.config = {
            // Configurações da impressora
            interface: 'usb', // 'usb', 'serial', 'network'
            codePage: 'cp860', // Página de código para português
            characterSet: 'BRAZIL',

            // Configurações do papel
            paperWidth: 80, // mm
            charactersPerLine: 42, // caracteres por linha em fonte normal

            // COMANDOS ESC/POS
            commands: {
                // Controle básico
                ESC: '\x1B',
                GS: '\x1D',
                LF: '\x0A',
                CR: '\x0D',

                // Inicialização
                INIT: '\x1B\x40',

                // FORMATAÇÃO DE TEXTO
                BOLD_ON: '\x1B\x45\x01',
                BOLD_OFF: '\x1B\x45\x00',
                UNDERLINE_ON: '\x1B\x2D\x01',
                UNDERLINE_OFF: '\x1B\x2D\x00',

                // TAMANHOS DE FONTE
                FONT_SMALL: '\x1B\x21\x01',
                FONT_NORMAL: '\x1B\x21\x00',
                FONT_LARGE: '\x1B\x21\x08',
                DOUBLE_HEIGHT: '\x1B\x21\x10',
                DOUBLE_WIDTH: '\x1B\x21\x20',
                DOUBLE_SIZE: '\x1B\x21\x30',

                // DENSIDADE/INTENSIDADE DA IMPRESSÃO
                DENSITY_LIGHT: '\x1D\x7C\x00',
                DENSITY_NORMAL: '\x1D\x7C\x01',
                DENSITY_DARK: '\x1D\x7C\x02',

                // Alinhamento
                ALIGN_LEFT: '\x1B\x61\x00',
                ALIGN_CENTER: '\x1B\x61\x01',
                ALIGN_RIGHT: '\x1B\x61\x02',

                // CORTE DE PAPEL
                CUT_FULL: '\x1D\x56\x00',
                CUT_PARTIAL: '\x1D\x56\x01',
                CUT_FEED_CUT: '\x1D\x56\x42\x00',
                CUT_ALTERNATIVE_1: '\x1D\x56\x30',
                CUT_ALTERNATIVE_2: '\x1D\x56A\x00',
                CUT_ALTERNATIVE_3: '\x1B\x69',
                CUT_ALTERNATIVE_4: '\x1B\x6D',

                // ALIMENTAÇÃO DE PAPEL
                FEED_LINE: '\x1B\x64\x02',
                FEED_LINES_3: '\x1B\x64\x03',
                FEED_LINES_5: '\x1B\x64\x05',

                // Abertura da gaveta
                OPEN_DRAWER: '\x1B\x70\x00\x19\xFA'
            }
        };

        // PROPRIEDADES DE CONTROLE
        this.isConnected = false;
        this.device = null;
        this.port = null;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        this.connectionTimeout = 5000;
        this.connectionState = 'disconnected';

        // 🆕 PROPRIEDADES PARA ESTABILIDADE
        this.writer = null;
        this.reader = null;
        this.keepAliveInterval = null;
        this.vendorId = null;  // Para armazenar o ID do fabricante
        this.productId = null; // Para armazenar o ID do produto

        this.setupDisconnectionListener();
    }

    setupDisconnectionListener() {
        if ('serial' in navigator) {
            navigator.serial.addEventListener('disconnect', (event) => {
                console.log('🔌 Impressora desconectada automaticamente:', event.port);
                this.handleDisconnection();
            });
        }
    }

    handleDisconnection() {
        console.log('🔌 Detectada desconexão da impressora');
        this.isConnected = false;
        this.device = null;
        this.port = null;
        this.writer = null;
        this.reader = null;
        this.connectionState = 'disconnected';
        this.connectionAttempts = 0;

        // 🆕 LIMPAR KEEP-ALIVE
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }

    // 🆕 MÉTODO DE DIAGNÓSTICO COMPLETO - CORRIGIDO PARA USER GESTURE
    async diagnosticarConexao(tentarConexao = false) {
        console.log('🔍 ═══════════════════════════════════════');
        console.log('🔍 INICIANDO DIAGNÓSTICO DE CONEXÃO...');
        console.log('🔍 ═══════════════════════════════════════');

        // 1. Verifica suporte do navegador
        if (!('serial' in navigator)) {
            console.error('❌ Navegador não suporta Web Serial API');
            console.log('💡 Use Chrome, Edge ou Opera versão 89+');
            return {
                success: false,
                message: 'Navegador não suporta Web Serial API. Use Chrome, Edge ou Opera.',
                details: [],
                needsUserGesture: false
            };
        }
        console.log('✅ Navegador suporta Web Serial API');

        const detalhes = [];

        // 2. Tenta listar portas já autorizadas
        try {
            const portas = await navigator.serial.getPorts();
            console.log(`📊 Portas já autorizadas: ${portas.length}`);
            detalhes.push(`Portas autorizadas: ${portas.length}`);

            if (portas.length > 0) {
                for (let i = 0; i < portas.length; i++) {
                    const info = portas[i].getInfo();
                    console.log(`Porta ${i + 1}:`, info);
                    if (info.usbVendorId) {
                        const vendorHex = info.usbVendorId.toString(16).padStart(4, '0');
                        const productHex = info.usbProductId.toString(16).padStart(4, '0');
                        detalhes.push(`Porta ${i + 1}: VendorId=0x${vendorHex}, ProductId=0x${productHex}`);

                        // 🆕 SALVAR OS IDs DA PRIMEIRA PORTA AUTORIZADA
                        if (i === 0) {
                            this.vendorId = info.usbVendorId;
                            this.productId = info.usbProductId;
                        }
                    }
                }

                // Se temos portas autorizadas, testar a primeira
                if (tentarConexao) {
                    return await this.testarPortaAutorizada(portas[0], detalhes);
                } else {
                    return {
                        success: true,
                        message: `Encontradas ${portas.length} porta(s) já autorizada(s). Use "Conectar" para testar.`,
                        details: detalhes,
                        needsUserGesture: false,
                        hasAuthorizedPorts: true
                    };
                }
            }
        } catch (erro) {
            console.error('Erro ao listar portas:', erro);
            detalhes.push(`Erro ao listar portas: ${erro.message}`);
        }

        // 3. Se não há portas autorizadas, precisa de user gesture
        console.log('⚠️ Nenhuma porta autorizada encontrada');
        detalhes.push('Nenhuma porta autorizada encontrada');

        if (tentarConexao) {
            // 🔧 SÓ TENTA REQUESTPORT SE FOR CHAMADO COM USER GESTURE
            try {
                console.log('🔄 Solicitando seleção de porta (requer interação do usuário)...');
                const porta = await navigator.serial.requestPort();
                return await this.testarPortaSelecionada(porta, detalhes);

            } catch (erro) {
                console.error('❌ Erro ao solicitar porta:', erro);

                if (erro.name === 'SecurityError' && erro.message.includes('user gesture')) {
                    return {
                        success: false,
                        message: 'Erro de segurança: Esta ação deve ser chamada através de um clique do usuário.',
                        details: [...detalhes, `Erro: ${erro.message}`],
                        needsUserGesture: true
                    };
                } else if (erro.name === 'NotFoundError') {
                    return {
                        success: false,
                        message: 'Nenhum dispositivo foi selecionado pelo usuário.',
                        details: [...detalhes, 'Usuário cancelou a seleção'],
                        needsUserGesture: false
                    };
                }

                return {
                    success: false,
                    message: `Erro ao solicitar porta: ${erro.message}`,
                    details: [...detalhes, `Erro: ${erro.message}`],
                    needsUserGesture: false
                };
            }
        } else {
            return {
                success: false,
                message: 'Nenhuma porta serial autorizada. Use "Conectar" para selecionar uma impressora.',
                details: detalhes,
                needsUserGesture: true,
                hasAuthorizedPorts: false
            };
        }
    }

    // 🆕 MÉTODO PARA TESTAR PORTA JÁ AUTORIZADA
    async testarPortaAutorizada(porta, detalhesExistentes = []) {
        try {
            const info = porta.getInfo();
            console.log('✅ Testando porta autorizada:', info);

            const detalhes = [...detalhesExistentes];
            let resultado = {
                success: true,
                message: 'Porta autorizada testada com sucesso!',
                details: detalhes
            };

            if (info.usbVendorId) {
                const vendorHex = info.usbVendorId.toString(16).padStart(4, '0');
                const productHex = info.usbProductId.toString(16).padStart(4, '0');

                console.log('📟 Informações do dispositivo:');
                console.log(`VendorId: 0x${vendorHex}`);
                console.log(`ProductId: 0x${productHex}`);

                this.vendorId = info.usbVendorId;
                this.productId = info.usbProductId;

                resultado.vendorId = vendorHex;
                resultado.productId = productHex;
                resultado.details.push(`VendorId: 0x${vendorHex}`);
                resultado.details.push(`ProductId: 0x${productHex}`);
            }

            // Testa conexão se a porta não estiver aberta
            if (!porta.readable) {
                resultado.baudRateRecomendado = await this.testarBaudRates(porta, resultado.details);
            } else {
                resultado.details.push('⚠️ Porta já está aberta');
            }

            return resultado;

        } catch (erro) {
            console.error('❌ Erro ao testar porta autorizada:', erro);
            return {
                success: false,
                message: `Erro ao testar porta: ${erro.message}`,
                details: [...detalhesExistentes, `Erro: ${erro.message}`]
            };
        }
    }

    // 🆕 MÉTODO PARA TESTAR PORTA SELECIONADA PELO USUÁRIO
    async testarPortaSelecionada(porta, detalhesExistentes = []) {
        try {
            const info = porta.getInfo();
            console.log('✅ Dispositivo selecionado pelo usuário!');
            console.log('📟 Informações completas:', info);

            const detalhes = [...detalhesExistentes];
            let resultado = {
                success: true,
                message: 'Dispositivo encontrado com sucesso!',
                details: detalhes
            };

            if (info.usbVendorId) {
                const vendorHex = info.usbVendorId.toString(16).padStart(4, '0');
                const productHex = info.usbProductId.toString(16).padStart(4, '0');

                console.log('═══════════════════════════════════════');
                console.log('🎯 INFORMAÇÕES IMPORTANTES:');
                console.log(`VendorId: 0x${vendorHex}`);
                console.log(`ProductId: 0x${productHex}`);
                console.log('═══════════════════════════════════════');

                this.vendorId = info.usbVendorId;
                this.productId = info.usbProductId;

                resultado.vendorId = vendorHex;
                resultado.productId = productHex;
                resultado.details.push(`VendorId encontrado: 0x${vendorHex}`);
                resultado.details.push(`ProductId encontrado: 0x${productHex}`);
            }

            // Testa diferentes configurações de baudrate
            resultado.baudRateRecomendado = await this.testarBaudRates(porta, resultado.details);

            return resultado;

        } catch (erro) {
            console.error('❌ Erro ao testar porta selecionada:', erro);
            return {
                success: false,
                message: `Erro ao testar dispositivo: ${erro.message}`,
                details: [...detalhesExistentes, `Erro: ${erro.message}`]
            };
        }
    }

    // 🆕 MÉTODO PARA TESTAR DIFERENTES BAUDRATES
    async testarBaudRates(porta, detalhes) {
        console.log('🔧 Testando configurações de baudrate...');
        const configuracoes = [9600, 19200, 38400, 57600, 115200];

        for (const baudRate of configuracoes) {
            try {
                console.log(`⏳ Testando ${baudRate} baud...`);
                await porta.open({
                    baudRate,
                    dataBits: 8,
                    stopBits: 1,
                    parity: 'none',
                    flowControl: 'none'
                });

                console.log(`✅ Sucesso em ${baudRate} baud`);
                detalhes.push(`✅ Conexão OK em ${baudRate} baud`);
                await porta.close();

                return baudRate;

            } catch (e) {
                console.log(`❌ Falha em ${baudRate} baud:`, e.message);
                detalhes.push(`❌ Falha em ${baudRate} baud: ${e.message}`);

                // Se der erro de porta já aberta, tentar fechar primeiro
                if (e.message.includes('already open')) {
                    try {
                        await porta.close();
                        console.log('🔄 Porta fechada, continuando testes...');
                    } catch (closeError) {
                        console.warn('⚠️ Erro ao fechar porta:', closeError);
                    }
                }
            }
        }

        detalhes.push('⚠️ Nenhum baudrate funcionou perfeitamente');
        return 9600; // Padrão
    }

    // 🔧 MÉTODO CONECTAR MELHORADO COM AS CORREÇÕES
    async conectarSerialMelhorado() {
        try {
            if (!('serial' in navigator)) {
                throw new Error('API Serial não suportada neste navegador. Use Chrome, Edge ou Opera.');
            }

            // 🆕 PRIMEIRO: VERIFICAR SE JÁ TEMOS PORTAS AUTORIZADAS
            const portasAutorizadas = await navigator.serial.getPorts();

            if (portasAutorizadas.length > 0 && !this.port) {
                console.log(`📡 Encontradas ${portasAutorizadas.length} porta(s) já autorizada(s), usando a primeira...`);
                this.port = portasAutorizadas[0];

                // Obter informações da porta
                const info = this.port.getInfo();
                if (info.usbVendorId) {
                    this.vendorId = info.usbVendorId;
                    this.productId = info.usbProductId;
                    console.log(`📟 Usando dispositivo: VendorId=0x${info.usbVendorId.toString(16).padStart(4, '0')}`);
                }
            }

            // Se ainda não temos porta, solicitar ao usuário
            if (!this.port) {
                console.log('📡 Solicitando seleção de porta (requer clique do usuário)...');

                try {
                    if (this.vendorId) {
                        // Se já temos o vendor ID, usar filtro
                        console.log(`🔄 Tentando com filtro VendorId: 0x${this.vendorId.toString(16).padStart(4, '0')}`);
                        this.port = await navigator.serial.requestPort({
                            filters: [{ usbVendorId: this.vendorId }]
                        });
                    } else {
                        // Sem filtros
                        this.port = await navigator.serial.requestPort();
                    }
                } catch (requestError) {
                    if (requestError.name === 'SecurityError' && requestError.message.includes('user gesture')) {
                        throw new Error('Esta ação deve ser executada através de um clique do usuário. Use o botão "Conectar" na interface.');
                    }
                    throw requestError;
                }
            }

            // Obter informações do dispositivo conectado
            const info = this.port.getInfo();
            console.log('📟 Informações do dispositivo:', info);

            if (info.usbVendorId && info.usbProductId) {
                this.vendorId = info.usbVendorId;
                this.productId = info.usbProductId;
                console.log(`🔌 USB VendorId: 0x${info.usbVendorId.toString(16).padStart(4, '0')}`);
                console.log(`🔌 USB ProductId: 0x${info.usbProductId.toString(16).padStart(4, '0')}`);
                console.log('💾 IDs salvos para próximas conexões');
            }

            // Verificar se a porta já está aberta
            if (this.port.readable && this.port.writable) {
                console.log('✅ Porta já estava aberta, reutilizando conexão');
                this.device = this.port;
                this.isConnected = true;
                this.connectionState = 'connected';
                this.connectionAttempts = 0;
                this.setupWriterReader();
                this.iniciarKeepAlive();
                return true;
            }

            // 🆕 CONFIGURAÇÕES MELHORADAS PARA IMPRESSORAS TÉRMICAS
            const configuracoesParaTestar = [
                { baudRate: 9600, flowControl: 'none' },
                { baudRate: 19200, flowControl: 'none' },
                { baudRate: 38400, flowControl: 'none' },
                { baudRate: 9600, flowControl: 'hardware' },
                { baudRate: 115200, flowControl: 'none' }
            ];

            let conexaoSucesso = false;

            for (const config of configuracoesParaTestar) {
                try {
                    console.log(`🔓 Tentando abrir porta com ${config.baudRate} baud, flow: ${config.flowControl}...`);

                    await this.port.open({
                        baudRate: config.baudRate,
                        dataBits: 8,
                        stopBits: 1,
                        parity: 'none',
                        bufferSize: 8192,
                        flowControl: config.flowControl
                    });

                    console.log(`✅ Porta aberta com sucesso! (${config.baudRate} baud)`);
                    conexaoSucesso = true;
                    break;

                } catch (configError) {
                    console.log(`❌ Falha com ${config.baudRate} baud: ${configError.message}`);
                    if (configError.message.includes('already open')) {
                        conexaoSucesso = true;
                        break;
                    }
                }
            }

            if (!conexaoSucesso) {
                throw new Error('Não foi possível abrir a porta com nenhuma configuração');
            }

            this.device = this.port;
            this.isConnected = true;
            this.connectionState = 'connected';
            this.connectionAttempts = 0;

            // 🆕 CONFIGURAR WRITER E READER SEPARADOS
            this.setupWriterReader();

            // 🆕 INICIAR KEEP-ALIVE PARA MANTER CONEXÃO
            this.iniciarKeepAlive();

            console.log('✅ Conexão serial estabelecida com sucesso');
            return true;

        } catch (error) {
            this.connectionAttempts++;
            console.error(`❌ Erro na conexão serial (tentativa ${this.connectionAttempts}):`, error);

            // Tratar erro específico de porta já aberta
            if (error.message.includes('already open') || error.message.includes('port is already open')) {
                console.log('🔄 Porta já aberta, tentando reutilizar...');

                try {
                    this.device = this.port;
                    this.isConnected = true;
                    this.connectionState = 'connected';
                    this.setupWriterReader();
                    this.iniciarKeepAlive();
                    return true;
                } catch (reuseError) {
                    console.error('❌ Não foi possível reutilizar conexão:', reuseError);
                    await this.forcarResetConexao();
                }
            }

            // Não tentar novamente se for erro de user gesture
            if (error.message.includes('user gesture')) {
                throw error;
            }

            // Se ainda temos tentativas, tentar novamente
            if (this.connectionAttempts < this.maxConnectionAttempts) {
                console.log(`🔄 Tentando novamente em 2 segundos... (${this.connectionAttempts}/${this.maxConnectionAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return await this.conectarSerialMelhorado();
            }

            throw error;
        }
    }

    // 🆕 CONFIGURAR WRITER E READER SEPARADOS
    setupWriterReader() {
        try {
            if (this.port && this.port.writable && this.port.readable) {
                // Não obter writer/reader aqui, obter apenas quando necessário
                console.log('📝 Writer e Reader configurados para uso sob demanda');
            }
        } catch (error) {
            console.warn('⚠️ Erro ao configurar writer/reader:', error);
        }
    }

    // 🆕 KEEP-ALIVE PARA MANTER A CONEXÃO ESTÁVEL
    iniciarKeepAlive() {
        // Limpar keep-alive anterior se existir
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }

        // Enviar comando de status a cada 30 segundos para manter conexão
        this.keepAliveInterval = setInterval(async () => {
            if (this.isConnected && this.port && this.port.writable) {
                try {
                    // Comando simples para verificar se impressora está respondendo
                    const statusCommand = '\x10\x04\x01'; // Comando DLE EOT para status
                    await this.enviarDados(statusCommand, false); // false = não fazer log
                } catch (error) {
                    console.warn('⚠️ Keep-alive falhou, conexão pode ter sido perdida');
                    this.handleDisconnection();
                }
            }
        }, 30000); // 30 segundos

        console.log('💓 Keep-alive iniciado (verifica a cada 30s)');
    }

    // Método conectar principal
    async conectar() {
        if (this.connectionState === 'connecting') {
            console.log('⏳ Conexão já em andamento...');
            return await this.waitForConnection();
        }

        if (this.isConnected && this.connectionState === 'connected') {
            console.log('✅ Impressora já conectada');
            return true;
        }

        try {
            this.connectionState = 'connecting';
            console.log('🔌 Iniciando conexão com impressora térmica...');

            if ('serial' in navigator) {
                return await this.conectarSerialMelhorado();
            } else if ('usb' in navigator) {
                return await this.conectarUSBMelhorado();
            } else {
                console.warn('⚠️ APIs não suportadas, usando fallback');
                return this.conectarFallback();
            }
        } catch (error) {
            this.connectionState = 'error';
            console.error('❌ Erro ao conectar:', error);
            throw new Error(`Falha na conexão: ${error.message}`);
        }
    }

    // 🔧 MÉTODO ENVIAR DADOS MELHORADO
    async enviarDados(dados, makeLog = true) {
        if (!this.port || !this.port.writable) {
            throw new Error('Porta não está disponível para escrita');
        }

        const writer = this.port.writable.getWriter();

        try {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(dados);

            if (makeLog) {
                console.log(`📤 Enviando ${bytes.length} bytes...`);
            }

            await writer.write(bytes);

            if (makeLog) {
                console.log('✅ Dados enviados com sucesso');
            }

        } finally {
            // SEMPRE liberar o writer
            writer.releaseLock();
        }
    }

    // ========================================
    // 🔧 FUNÇÃO CORRIGIDA: enviarParaImpressora
    // Substitua a função existente (linha ~615) por esta versão
    // ========================================

    async enviarParaImpressora(comandosESCPOS, tipo) {
        console.log('🖨️ Enviando comanda para impressora...');

        // 🆕 TENTAR CONECTAR AUTOMATICAMENTE SE NÃO ESTIVER CONECTADO
        if (!this.device && !this.port) {
            console.log('⚠️ Impressora não conectada, tentando conectar automaticamente...');

            try {
                // Verificar se há portas já autorizadas
                if ('serial' in navigator) {
                    const portas = await navigator.serial.getPorts();

                    if (portas.length > 0) {
                        console.log('🔄 Encontrada porta autorizada, conectando...');
                        const conectado = await this.conectar();

                        if (!conectado) {
                            console.log('❌ Falha na conexão automática, usando fallback...');
                            return await this.imprimirFallback(comandosESCPOS, tipo);
                        }

                        console.log('✅ Conexão automática bem-sucedida!');
                    } else {
                        console.log('⚠️ Nenhuma porta autorizada encontrada, usando fallback...');
                        console.log('💡 Dica: Clique em "Conectar Impressora" primeiro');
                        return await this.imprimirFallback(comandosESCPOS, tipo);
                    }
                } else {
                    console.log('⚠️ Web Serial API não disponível, usando fallback...');
                    return await this.imprimirFallback(comandosESCPOS, tipo);
                }
            } catch (error) {
                console.error('❌ Erro ao tentar conexão automática:', error);
                return await this.imprimirFallback(comandosESCPOS, tipo);
            }
        }

        // 🆕 VERIFICAR SE A CONEXÃO AINDA ESTÁ VÁLIDA
        if (this.port && !this.port.readable) {
            console.log('⚠️ Porta não está legível, reconectando...');
            try {
                await this.conectar();
            } catch (error) {
                console.error('❌ Falha ao reconectar:', error);
                return await this.imprimirFallback(comandosESCPOS, tipo);
            }
        }

        try {
            console.log('📤 Enviando comandos ESC/POS para a impressora...');

            // CONVERSÃO PARA BYTES
            const encoder = new TextEncoder();
            const data = encoder.encode(comandosESCPOS);

            // ENVIO PARA WEB SERIAL API
            if (this.port && this.port.writable) {
                if (!this.writer) {
                    this.writer = this.port.writable.getWriter();
                }

                await this.writer.write(data);
                console.log('✅ Dados enviados com sucesso via Serial!');

                // Aguardar processamento
                await new Promise(resolve => setTimeout(resolve, 500));

                return { success: true };
            }

            // FALLBACK: WEB USB API (MENOS COMUM)
            if (this.device && this.device.opened) {
                const config = this.device.configuration.interfaces[0];
                const endpoint = config.alternates[0].endpoints.find(e => e.direction === 'out');

                if (endpoint) {
                    await this.device.transferOut(endpoint.endpointNumber, data);
                    console.log('✅ Dados enviados com sucesso via USB!');
                    return { success: true };
                }
            }

            console.log('⚠️ Nenhum método de envio válido, usando fallback...');
            return await this.imprimirFallback(comandosESCPOS, tipo);

        } catch (error) {
            console.error('❌ Erro ao enviar para impressora:', error);

            // 🆕 TRATAMENTO DE ERROS ESPECÍFICOS
            if (error.name === 'NetworkError' || error.message.includes('device unavailable')) {
                console.log('🔄 Dispositivo indisponível, tentando reconectar...');
                this.handleDisconnection();

                try {
                    const reconectado = await this.conectar();
                    if (reconectado) {
                        console.log('✅ Reconectado! Tentando imprimir novamente...');
                        return await this.enviarParaImpressora(comandosESCPOS, tipo);
                    }
                } catch (reconectError) {
                    console.error('❌ Falha na reconexão:', reconectError);
                }
            }

            console.log('🔄 Usando fallback devido ao erro...');
            return await this.imprimirFallback(comandosESCPOS, tipo);
        }
    }

    // Resto dos métodos permanecem iguais...
    async forcarResetConexao() {
        console.log('🔄 Forçando reset da conexão...');

        try {
            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }
            if (this.reader) {
                this.reader.releaseLock();
                this.reader = null;
            }
            if (this.port && this.port.readable) {
                await this.port.close();
            }
        } catch (closeError) {
            console.warn('⚠️ Erro ao fechar porta:', closeError);
        }

        this.port = null;
        this.device = null;
        this.isConnected = false;
        this.connectionState = 'disconnected';

        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async waitForConnection() {
        return new Promise((resolve, reject) => {
            const checkConnection = () => {
                if (this.connectionState === 'connected') {
                    resolve(true);
                } else if (this.connectionState === 'error') {
                    reject(new Error('Conexão falhou'));
                } else if (this.connectionState === 'connecting') {
                    setTimeout(checkConnection, 100);
                } else {
                    reject(new Error('Estado de conexão inesperado'));
                }
            };

            checkConnection();

            setTimeout(() => {
                if (this.connectionState === 'connecting') {
                    this.connectionState = 'error';
                    reject(new Error('Timeout na conexão'));
                }
            }, this.connectionTimeout);
        });
    }

    async conectarUSBMelhorado() {
        try {
            const device = await navigator.usb.requestDevice({
                filters: [
                    { vendorId: 0x04b8 }, // Epson
                    { vendorId: 0x0519 }, // Elgin
                    { vendorId: 0x0483 }, // Generic
                    { vendorId: 0x28e9 }, // Daruma
                ]
            });

            await device.open();
            await device.selectConfiguration(1);
            await device.claimInterface(0);

            this.device = device;
            this.isConnected = true;
            this.connectionState = 'connected';
            console.log('✅ Conectado via USB:', device.productName);
            return true;
        } catch (error) {
            console.error('❌ Erro conexão USB:', error);
            throw error;
        }
    }

    conectarFallback() {
        console.log('⚠️ Usando modo fallback - impressão via browser');
        this.isConnected = true;
        this.device = 'fallback';
        this.connectionState = 'connected';
        return true;
    }

    // Métodos básicos de impressão (mantidos do código original)
    gerarComandaESCPOS(pedido) {
        const cmd = this.config.commands;
        const estabelecimento = JSON.parse(localStorage.getItem('estabelecimento') || '{}');

        let escpos = '';

        escpos += cmd.INIT;
        escpos += cmd.DENSITY_NORMAL;
        escpos += cmd.FONT_NORMAL;

        escpos += cmd.ALIGN_CENTER;
        escpos += cmd.FONT_LARGE;
        escpos += cmd.BOLD_ON;
        escpos += (estabelecimento.nome || 'LANCHONETE') + cmd.LF;
        escpos += cmd.FONT_NORMAL;
        escpos += cmd.BOLD_OFF;

        escpos += cmd.FONT_SMALL;
        escpos += (estabelecimento.endereco || '') + cmd.LF;
        escpos += (estabelecimento.telefone || '') + cmd.LF;
        escpos += cmd.FONT_NORMAL;
        escpos += cmd.LF;

        escpos += cmd.ALIGN_CENTER;
        escpos += cmd.DOUBLE_SIZE;
        escpos += cmd.BOLD_ON;
        escpos += cmd.DENSITY_DARK;
        escpos += '=== COMANDA ===';
        escpos += cmd.LF;
        escpos += cmd.FONT_NORMAL;
        escpos += cmd.BOLD_OFF;
        escpos += cmd.DENSITY_NORMAL;
        escpos += cmd.LF;

        escpos += cmd.ALIGN_LEFT;
        escpos += cmd.FONT_NORMAL;
        escpos += cmd.BOLD_ON;
        escpos += `PEDIDO: #${pedido.numero}` + cmd.LF;
        escpos += cmd.BOLD_OFF;

        escpos += cmd.FONT_SMALL;
        escpos += `DATA: ${new Date().toLocaleString('pt-BR')}` + cmd.LF;
        escpos += `CLIENTE: ${pedido.cliente || 'Balcao'}` + cmd.LF;

        if (pedido.mesa) {
            escpos += `MESA: ${pedido.mesa}` + cmd.LF;
        }
        escpos += cmd.FONT_NORMAL;

        escpos += cmd.LF;
        escpos += this.gerarLinha('=', 32) + cmd.LF;
        escpos += cmd.LF;

        escpos += cmd.BOLD_ON;
        escpos += cmd.FONT_NORMAL;
        escpos += 'ITENS DO PEDIDO:' + cmd.LF;
        escpos += cmd.BOLD_OFF;
        escpos += this.gerarLinha('-', 32) + cmd.LF;

        pedido.itens.forEach((item, index) => {
            escpos += cmd.LF;
            escpos += cmd.BOLD_ON;
            escpos += cmd.FONT_SMALL;
            escpos += `${item.quantidade}x ${item.nome}` + cmd.LF;
            escpos += cmd.BOLD_OFF;

            if (item.observacoes) {
                escpos += cmd.FONT_SMALL;
                escpos += `   OBS: ${item.observacoes}` + cmd.LF;
                escpos += cmd.FONT_NORMAL;
            }

            if (index < pedido.itens.length - 1) {
                escpos += this.gerarLinha('.', 32) + cmd.LF;
            }
        });

        escpos += cmd.LF;
        escpos += this.gerarLinha('=', 32) + cmd.LF;

        if (pedido.observacoes) {
            escpos += cmd.LF;
            escpos += cmd.BOLD_ON;
            escpos += cmd.DENSITY_DARK;
            escpos += 'OBSERVACOES ESPECIAIS:' + cmd.LF;
            escpos += cmd.BOLD_OFF;
            escpos += cmd.DENSITY_NORMAL;
            escpos += cmd.FONT_NORMAL;
            escpos += pedido.observacoes + cmd.LF;
            escpos += this.gerarLinha('=', 32) + cmd.LF;
        }

        escpos += cmd.LF;
        escpos += cmd.ALIGN_CENTER;
        escpos += cmd.BOLD_ON;
        escpos += cmd.FONT_NORMAL;
        escpos += '*** COMANDA PARA PREPARO ***' + cmd.LF;
        escpos += cmd.BOLD_OFF;

        escpos += cmd.FONT_SMALL;
        escpos += `Impresso: ${new Date().toLocaleString('pt-BR')}` + cmd.LF;
        escpos += cmd.FONT_NORMAL;

        escpos += cmd.LF;
        escpos += cmd.LF;
        escpos += cmd.FEED_LINES_3;
        escpos += cmd.CUT_ALTERNATIVE_3;

        return escpos;
    }

    async imprimirFallback(dados, tipo) {
        const html = this.escposParaHTML(dados, tipo);

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(html);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            setTimeout(() => printWindow.close(), 1000);
        }, 500);

        return { success: true };
    }

    gerarLinha(caractere, tamanho) {
        return caractere.repeat(tamanho);
    }

    escposParaHTML(escpos, tipo) {
        let html = escpos
            .replace(/\x1B\x45\x01/g, '<strong>')
            .replace(/\x1B\x45\x00/g, '</strong>')
            .replace(/\x1B\x61\x01/g, '<div style="text-align: center">')
            .replace(/\x1B\x61\x00/g, '</div><div style="text-align: left">')
            .replace(/\x0A/g, '<br>');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${tipo}</title>
                <style>
                    body { 
                        font-family: 'Courier New', monospace; 
                        font-size: 12px; 
                        width: 80mm; 
                        margin: 0; 
                        padding: 5mm; 
                    }
                    @media print { 
                        @page { margin: 0; size: 80mm auto; }
                    }
                </style>
            </head>
            <body>${html}</body>
            </html>
        `;
    }

    async desconectar() {
        console.log('🔌 Iniciando desconexão...');

        try {
            if (this.keepAliveInterval) {
                clearInterval(this.keepAliveInterval);
                this.keepAliveInterval = null;
                console.log('💓 Keep-alive parado');
            }

            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }

            if (this.reader) {
                this.reader.releaseLock();
                this.reader = null;
            }

            if (this.port && this.port.readable) {
                console.log('🔓 Fechando porta serial...');
                await this.port.close();
            } else if (this.device && this.device.close) {
                console.log('🔓 Fechando dispositivo USB...');
                await this.device.close();
            }
        } catch (error) {
            console.warn('⚠️ Erro ao desconectar (não crítico):', error);
        } finally {
            this.handleDisconnection();
            console.log('✅ Desconexão concluída');
        }
    }

    // 🆕 MÉTODO PARA TESTAR TUDO
    async testarConexaoCompleta() {
        console.log('🧪 ═══════════════════════════════════════');
        console.log('🧪 TESTE COMPLETO DE CONEXÃO E IMPRESSÃO');
        console.log('🧪 ═══════════════════════════════════════');

        const resultado = {
            success: false,
            etapas: [],
            detalhes: []
        };

        try {
            // Etapa 1: Diagnóstico
            resultado.etapas.push('Executando diagnóstico...');
            const diagnostico = await this.diagnosticarConexao();

            if (!diagnostico.success) {
                resultado.detalhes.push(`❌ Diagnóstico falhou: ${diagnostico.message}`);
                return resultado;
            }

            resultado.detalhes.push('✅ Diagnóstico passou');
            resultado.detalhes.push(...diagnostico.details);

            // Etapa 2: Conectar
            resultado.etapas.push('Tentando conectar...');
            const conectado = await this.conectar();

            if (!conectado) {
                resultado.detalhes.push('❌ Falha na conexão');
                return resultado;
            }

            resultado.detalhes.push('✅ Conexão estabelecida');

            // Etapa 3: Teste de impressão
            resultado.etapas.push('Testando impressão...');
            const pedidoTeste = {
                numero: 'TESTE-' + Date.now(),
                cliente: 'Cliente Teste',
                mesa: '99',
                itens: [
                    {
                        quantidade: 1,
                        nome: 'TESTE DE IMPRESSÃO',
                        observacoes: 'Este é um teste de funcionalidade'
                    }
                ],
                observacoes: 'Se você conseguir ler isto, sua impressora está funcionando!'
            };

            const escpos = this.gerarComandaESCPOS(pedidoTeste);
            const impressao = await this.enviarParaImpressora(escpos, 'teste-completo');

            if (impressao.success) {
                resultado.detalhes.push('✅ Teste de impressão enviado com sucesso');
                resultado.success = true;
            } else {
                resultado.detalhes.push('❌ Falha no teste de impressão');
            }

            return resultado;

        } catch (error) {
            resultado.detalhes.push(`❌ Erro durante teste: ${error.message}`);
            return resultado;
        }
    }

    // 🆕 OBTER STATUS DETALHADO
    obterStatusDetalhado() {
        return {
            conectada: this.isConnected,
            estado: this.connectionState,
            dispositivo: this.device ? 'Conectado' : 'Ausente',
            porta: this.port ? 'Ativa' : 'Inativa',
            portaLegivel: this.port?.readable || false,
            portaEscrevivel: this.port?.writable || false,
            tentativasConexao: this.connectionAttempts,
            maxTentativas: this.maxConnectionAttempts,
            tempoTimeout: this.connectionTimeout,
            tipoConexao: this.port ? 'Serial' : (this.device ? 'USB' : 'Nenhuma'),
            vendorId: this.vendorId ? `0x${this.vendorId.toString(16).padStart(4, '0')}` : 'Desconhecido',
            productId: this.productId ? `0x${this.productId.toString(16).padStart(4, '0')}` : 'Desconhecido',
            keepAliveAtivo: !!this.keepAliveInterval
        };
    }
}

// Criar instância global
const thermalPrintService = new ThermalPrintService();

export default thermalPrintService;