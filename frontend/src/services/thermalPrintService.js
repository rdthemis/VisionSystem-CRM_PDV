// src/services/thermalPrintService.js
// Serviço específico para impressão térmica com comandos ESC/POS
import Logger from '../utils/Logger';

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

        // PROPRIEDADES PARA ESTABILIDADE
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
                Logger.info('Impressora desconectada automaticamente:', { info: 'thermalPrintService.disconnect', port: event.port });
                this.handleDisconnection();
            });
        }
    }

    handleDisconnection() {
        Logger.info('Detectada desconexão da impressora', { info: 'thermalPrintService.handleDisconnection' });
        this.isConnected = false;
        this.device = null;
        this.port = null;
        this.writer = null;
        this.reader = null;
        this.connectionState = 'disconnected';
        this.connectionAttempts = 0;

        // LIMPAR KEEP-ALIVE
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
            this.keepAliveInterval = null;
        }
    }

    // MÉTODO DE DIAGNÓSTICO COMPLETO - CORRIGIDO PARA USER GESTURE
    async diagnosticarConexao(tentarConexao = false) {
        Logger.info('INICIANDO DIAGNÓSTICO DE CONEXÃO...', { info: 'thermalPrintService.diagnosticarConexao' });

        // 1. Verifica suporte do navegador
        if (!('serial' in navigator)) {
            Logger.error('Navegador não suporta Web Serial API',{ erro: 'thermalPrintService.diagnosticarConexao' });
            Logger.info('Use Chrome, Edge ou Opera versão 89+', { info: 'thermalPrintService.diagnosticarConexao' });
            return {
                success: false,
                message: 'Navegador não suporta Web Serial API. Use Chrome, Edge ou Opera.',
                details: [],
                needsUserGesture: false
            };
        }
        Logger.info('Navegador suporta Web Serial API', { info: 'thermalPrintService.diagnosticarConexao' });

        const detalhes = [];

        // 2. Tenta listar portas já autorizadas
        try {
            const portas = await navigator.serial.getPorts();
            Logger.debug(`Portas já autorizadas: ${portas.length}`, { debug: 'thermalPrintService.diagnosticarConexao' });
            detalhes.push(`Portas autorizadas: ${portas.length}`);

            if (portas.length > 0) {
                for (let i = 0; i < portas.length; i++) {
                    const info = portas[i].getInfo();
                    Logger.debug(`Porta ${i + 1}:`, { debug: 'thermalPrintService.diagnosticarConexao' }, info);
                    if (info.usbVendorId) {
                        const vendorHex = info.usbVendorId.toString(16).padStart(4, '0');
                        const productHex = info.usbProductId.toString(16).padStart(4, '0');
                        detalhes.push(`Porta ${i + 1}: VendorId=0x${vendorHex}, ProductId=0x${productHex}`);

                        //  SALVAR OS IDs DA PRIMEIRA PORTA AUTORIZADA
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
            Logger.error('Erro ao listar portas:', { erro: erro });
            detalhes.push(`Erro ao listar portas: ${erro.message}`);
        }

        // 3. Se não há portas autorizadas, precisa de user gesture
        Logger.info('Nenhuma porta autorizada encontrada', { info: 'thermalPrintService.diagnosticarConexao' });
        detalhes.push('Nenhuma porta autorizada encontrada');

        if (tentarConexao) {
            // SÓ TENTA REQUESTPORT SE FOR CHAMADO COM USER GESTURE
            try {
                Logger.info('Solicitando seleção de porta (requer interação do usuário)...', { info: 'thermalPrintService.diagnosticarConexao' });
                const porta = await navigator.serial.requestPort();
                return await this.testarPortaSelecionada(porta, detalhes);

            } catch (erro) {
                Logger.error('Erro ao solicitar porta:', { erro: erro });

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

    // MÉTODO PARA TESTAR PORTA JÁ AUTORIZADA
    async testarPortaAutorizada(porta, detalhesExistentes = []) {
        try {
            const info = porta.getInfo();
            Logger.debug('Testando porta autorizada:', { debug: 'thermalPrintService.testarPortaAutorizada' }, info);

            const detalhes = [...detalhesExistentes];
            let resultado = {
                success: true,
                message: 'Porta autorizada testada com sucesso!',
                details: detalhes
            };

            if (info.usbVendorId) {
                const vendorHex = info.usbVendorId.toString(16).padStart(4, '0');
                const productHex = info.usbProductId.toString(16).padStart(4, '0');

                Logger.debug('Informações do dispositivo:', { debug: 'thermalPrintService.testarPortaAutorizada' }, { vendorId: vendorHex, productId: productHex });

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
                resultado.details.push('Porta já está aberta');
            }

            return resultado;

        } catch (erro) {
            Logger.error('Erro ao testar porta autorizada:', { erro: erro });
            return {
                success: false,
                message: `Erro ao testar porta: ${erro.message}`,
                details: [...detalhesExistentes, `Erro: ${erro.message}`]
            };
        }
    }

    // MÉTODO PARA TESTAR PORTA SELECIONADA PELO USUÁRIO
    async testarPortaSelecionada(porta, detalhesExistentes = []) {
        try {
            const info = porta.getInfo();
            Logger.debug('Dispositivo selecionado pelo usuário!', { debug: 'thermalPrintService.testarPortaSelecionada' }, info);
            Logger.debug('Informações completas:', { debug: 'thermalPrintService.testarPortaSelecionada' }, info);

            const detalhes = [...detalhesExistentes];
            let resultado = {
                success: true,
                message: 'Dispositivo encontrado com sucesso!',
                details: detalhes
            };

            if (info.usbVendorId) {
                const vendorHex = info.usbVendorId.toString(16).padStart(4, '0');
                const productHex = info.usbProductId.toString(16).padStart(4, '0');

                Logger.debug('INFORMAÇÕES IMPORTANTES:', { debug: 'thermalPrintService.testarPortaSelecionada' }, { vendorId: vendorHex, productId: productHex });

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
            Logger.error(' Erro ao testar porta selecionada:', { erro: erro });
            return {
                success: false,
                message: `Erro ao testar dispositivo: ${erro.message}`,
                details: [...detalhesExistentes, `Erro: ${erro.message}`]
            };
        }
    }

    // MÉTODO PARA TESTAR DIFERENTES BAUDRATES
    async testarBaudRates(porta, detalhes) {
        Logger.debug('Testando configurações de baudrate...', { debug: 'thermalPrintService.testarBaudRates' });
        const configuracoes = [9600, 19200, 38400, 57600, 115200];

        for (const baudRate of configuracoes) {
            try {
                Logger.debug(`Testando ${baudRate} baud...`, { debug: 'thermalPrintService.testarBaudRates' });
                await porta.open({
                    baudRate,
                    dataBits: 8,
                    stopBits: 1,
                    parity: 'none',
                    flowControl: 'none'
                });

                Logger.debug(`Sucesso em ${baudRate} baud`, { debug: 'thermalPrintService.testarBaudRates' });
                detalhes.push(`Conexão OK em ${baudRate} baud`);
                await porta.close();

                return baudRate;

            } catch (e) {
                Logger.debug(`Falha em ${baudRate} baud:`, { debug: 'thermalPrintService.testarBaudRates' }, { message: e.message });
                detalhes.push(`Falha em ${baudRate} baud: ${e.message}`);

                // Se der erro de porta já aberta, tentar fechar primeiro
                if (e.message.includes('already open')) {
                    try {
                        await porta.close();
                        Logger.debug('Porta fechada, continuando testes...', { debug: 'thermalPrintService.testarBaudRates' });
                    } catch (closeError) {
                        Logger.warn('Erro ao fechar porta:', { debug: 'thermalPrintService.testarBaudRates' }, { message: closeError.message });
                    }
                }
            }
        }

        detalhes.push('Nenhum baudrate funcionou perfeitamente');
        return 9600; // Padrão
    }

    // MÉTODO CONECTAR MELHORADO COM AS CORREÇÕES
    async conectarSerialMelhorado() {
        try {
            if (!('serial' in navigator)) {
                throw new Error('API Serial não suportada neste navegador. Use Chrome, Edge ou Opera.');
            }

            //  PRIMEIRO: VERIFICAR SE JÁ TEMOS PORTAS AUTORIZADAS
            const portasAutorizadas = await navigator.serial.getPorts();

            if (portasAutorizadas.length > 0 && !this.port) {
                Logger.debug(`Encontradas ${portasAutorizadas.length} porta(s) já autorizada(s), usando a primeira...`, { debug: 'thermalPrintService.conectarSerialMelhorado' });
                this.port = portasAutorizadas[0];

                // Obter informações da porta
                const info = this.port.getInfo();
                if (info.usbVendorId) {
                    this.vendorId = info.usbVendorId;
                    this.productId = info.usbProductId;
                    Logger.debug(`Usando dispositivo: VendorId=0x${info.usbVendorId.toString(16).padStart(4, '0')}`, { debug: 'thermalPrintService.conectarSerialMelhorado' });
                }
            }

            // Se ainda não temos porta, solicitar ao usuário
            if (!this.port) {
                Logger.debug('Solicitando seleção de porta (requer clique do usuário)...', { debug: 'thermalPrintService.conectarSerialMelhorado' });

                try {
                    if (this.vendorId) {
                        // Se já temos o vendor ID, usar filtro
                        Logger.debug(`Tentando com filtro VendorId: 0x${this.vendorId.toString(16).padStart(4, '0')}`, { debug: 'thermalPrintService.conectarSerialMelhorado' });
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
            Logger.debug('Informações do dispositivo:', { debug: 'thermalPrintService.conectarSerialMelhorado' }, { info: info });

            if (info.usbVendorId && info.usbProductId) {
                this.vendorId = info.usbVendorId;
                this.productId = info.usbProductId;
                Logger.debug(`USB VendorId: 0x${info.usbVendorId.toString(16).padStart(4, '0')}`, { debug: 'thermalPrintService.conectarSerialMelhorado' });
                Logger.debug(`USB ProductId: 0x${info.usbProductId.toString(16).padStart(4, '0')}`, { debug: 'thermalPrintService.conectarSerialMelhorado' });
                Logger.debug('IDs salvos para próximas conexões', { debug: 'thermalPrintService.conectarSerialMelhorado' });
            }

            // Verificar se a porta já está aberta
            if (this.port.readable && this.port.writable) {
                Logger.debug('Porta já estava aberta, reutilizando conexão', { debug: 'thermalPrintService.conectarSerialMelhorado' });
                this.device = this.port;
                this.isConnected = true;
                this.connectionState = 'connected';
                this.connectionAttempts = 0;
                this.setupWriterReader();
                this.iniciarKeepAlive();
                return true;
            }

            // CONFIGURAÇÕES MELHORADAS PARA IMPRESSORAS TÉRMICAS
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
                    Logger.debug(`Tentando abrir porta com ${config.baudRate} baud, flow: ${config.flowControl}...`, { debug: 'thermalPrintService.conectarSerialMelhorado' });

                    await this.port.open({
                        baudRate: config.baudRate,
                        dataBits: 8,
                        stopBits: 1,
                        parity: 'none',
                        bufferSize: 8192,
                        flowControl: config.flowControl
                    });

                    Logger.debug(`Porta aberta com sucesso! (${config.baudRate} baud)`, { debug: 'thermalPrintService.conectarSerialMelhorado' });
                    conexaoSucesso = true;
                    break;

                } catch (configError) {
                    Logger.debug(`Falha com ${config.baudRate} baud: ${configError.message}`, { debug: 'thermalPrintService.conectarSerialMelhorado' });
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

            // CONFIGURAR WRITER E READER SEPARADOS
            this.setupWriterReader();

            // INICIAR KEEP-ALIVE PARA MANTER CONEXÃO
            this.iniciarKeepAlive();

            Logger.debug('Conexão serial estabelecida com sucesso', { debug: 'thermalPrintService.conectarSerialMelhorado' });
            return true;

        } catch (error) {
            this.connectionAttempts++;
            Logger.error(`Erro na conexão serial (tentativa ${this.connectionAttempts}):`, { debug: 'thermalPrintService.conectarSerialMelhorado' }, { error: error });

            // Tratar erro específico de porta já aberta
            if (error.message.includes('already open') || error.message.includes('port is already open')) {
                Logger.debug('Porta já estava aberta, reutilizando conexão', { debug: 'thermalPrintService.conectarSerialMelhorado' });

                try {
                    this.device = this.port;
                    this.isConnected = true;
                    this.connectionState = 'connected';
                    this.setupWriterReader();
                    this.iniciarKeepAlive();
                    return true;
                } catch (reuseError) {
                    Logger.error('Não foi possível reutilizar conexão:', { debug: 'thermalPrintService.conectarSerialMelhorado' }, { error: reuseError });
                    await this.forcarResetConexao();
                }
            }

            // Não tentar novamente se for erro de user gesture
            if (error.message.includes('user gesture')) {
                throw error;
            }

            // Se ainda temos tentativas, tentar novamente
            if (this.connectionAttempts < this.maxConnectionAttempts) {
                Logger.debug(`Tentando novamente em 2 segundos... (${this.connectionAttempts}/${this.maxConnectionAttempts})`, { debug: 'thermalPrintService.conectarSerialMelhorado' });
                await new Promise(resolve => setTimeout(resolve, 2000));
                return await this.conectarSerialMelhorado();
            }

            throw error;
        }
    }

    // CONFIGURAR WRITER E READER SEPARADOS
    setupWriterReader() {
        try {
            if (this.port && this.port.writable && this.port.readable) {
                // Não obter writer/reader aqui, obter apenas quando necessário
                Logger.debug('Writer e Reader configurados para uso sob demanda', { debug: 'thermalPrintService.setupWriterReader' });
            }
        } catch (error) {
            Logger.warn('Erro ao configurar writer/reader:', { debug: 'thermalPrintService.setupWriterReader' }, { error: error });
        }
    }

    //  KEEP-ALIVE PARA MANTER A CONEXÃO ESTÁVEL
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
                    Logger.warn('Keep-alive falhou, conexão pode ter sido perdida', { debug: 'thermalPrintService.iniciarKeepAlive' }, { error: error });
                    this.handleDisconnection();
                }
            }
        }, 30000); // 30 segundos

        Logger.debug('Keep-alive iniciado (verifica a cada 30s)', { debug: 'thermalPrintService.iniciarKeepAlive' });
    }

    // Método conectar principal
    async conectar() {
        if (this.connectionState === 'connecting') {
            Logger.debug('Conexão já em andamento...', { debug: 'thermalPrintService.conectar' });
            return await this.waitForConnection();
        }

        if (this.isConnected && this.connectionState === 'connected') {
            Logger.debug('Impressora já conectada', { debug: 'thermalPrintService.conectar' });
            return true;
        }

        try {
            this.connectionState = 'connecting';
            Logger.debug('Iniciando conexão com impressora térmica...', { debug: 'thermalPrintService.conectar' });

            if ('serial' in navigator) {
                return await this.conectarSerialMelhorado();
            } else if ('usb' in navigator) {
                return await this.conectarUSBMelhorado();
            } else {
                Logger.warn('APIs não suportadas, usando fallback', { debug: 'thermalPrintService.conectar' });
                return this.conectarFallback();
            }
        } catch (error) {
            this.connectionState = 'error';
            Logger.error('Erro ao conectar:', { debug: 'thermalPrintService.conectar' }, { error: error });
            throw new Error(`Falha na conexão: ${error.message}`);
        }
    }

    // MÉTODO ENVIAR DADOS MELHORADO
    async enviarDados(dados, makeLog = true) {
        if (!this.port || !this.port.writable) {
            throw new Error('Porta não está disponível para escrita');
        }

        const writer = this.port.writable.getWriter();

        try {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(dados);

            if (makeLog) {
                Logger.debug(`Enviando ${bytes.length} bytes...`, { debug: 'thermalPrintService.enviarDados' });
            }

            await writer.write(bytes);

            if (makeLog) {
                Logger.debug('Dados enviados com sucesso', { debug: 'thermalPrintService.enviarDados' });
            }

        } finally {
            // SEMPRE liberar o writer
            writer.releaseLock();
        }
    }

    // ========================================
    // FUNÇÃO CORRIGIDA: enviarParaImpressora
    // Substitua a função existente (linha ~615) por esta versão
    // ========================================

    async enviarParaImpressora(comandosESCPOS, tipo) {
        Logger.debug('Enviando comanda para impressora...', { debug: 'thermalPrintService.enviarParaImpressora' });

        // TENTAR CONECTAR AUTOMATICAMENTE SE NÃO ESTIVER CONECTADO
        if (!this.device && !this.port) {
            Logger.debug('Impressora não conectada, tentando conectar automaticamente...', { debug: 'thermalPrintService.enviarParaImpressora' });

            try {
                // Verificar se há portas já autorizadas
                if ('serial' in navigator) {
                    const portas = await navigator.serial.getPorts();

                    if (portas.length > 0) {
                        Logger.debug('Encontrada porta autorizada, conectando...', { debug: 'thermalPrintService.enviarParaImpressora' });
                        const conectado = await this.conectar();

                        if (!conectado) {
                            Logger.debug('Falha na conexão automática, usando fallback...', { debug: 'thermalPrintService.enviarParaImpressora' });
                            return await this.imprimirFallback(comandosESCPOS, tipo);
                        }

                        Logger.debug(' Conexão automática bem-sucedida!', { debug: 'thermalPrintService.enviarParaImpressora' });
                    } else {
                        Logger.debug('Nenhuma porta autorizada encontrada, usando fallback...', { debug: 'thermalPrintService.enviarParaImpressora' });
                        Logger.debug('Dica: Clique em "Conectar Impressora" primeiro', { debug: 'thermalPrintService.enviarParaImpressora' });
                        return await this.imprimirFallback(comandosESCPOS, tipo);
                    }
                } else {
                    Logger.debug('Web Serial API não disponível, usando fallback...', { debug: 'thermalPrintService.enviarParaImpressora' });
                    return await this.imprimirFallback(comandosESCPOS, tipo);
                }
            } catch (error) {
                Logger.error('Erro ao tentar conexão automática:', error, { debug: 'thermalPrintService.enviarParaImpressora' });
                return await this.imprimirFallback(comandosESCPOS, tipo);
            }
        }

        // VERIFICAR SE A CONEXÃO AINDA ESTÁ VÁLIDA
        if (this.port && !this.port.readable) {
            Logger.debug('⚠️ Porta não está legível, reconectando...', { debug: 'thermalPrintService.enviarParaImpressora' });
            try {
                await this.conectar();
            } catch (error) {
                Logger.error('Falha ao reconectar:', error, { erro: 'thermalPrintService.enviarParaImpressora' });
                return await this.imprimirFallback(comandosESCPOS, tipo);
            }
        }

        try {
            Logger.debug('Enviando comandos ESC/POS para a impressora...', { debug: 'thermalPrintService.enviarParaImpressora' });

            // CONVERSÃO PARA BYTES
            const encoder = new TextEncoder();
            const data = encoder.encode(comandosESCPOS);

            // ENVIO PARA WEB SERIAL API
            if (this.port && this.port.writable) {
                if (!this.writer) {
                    this.writer = this.port.writable.getWriter();
                }

                await this.writer.write(data);
                Logger.debug('Dados enviados com sucesso via Serial!', { debug: 'thermalPrintService.enviarParaImpressora' });

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
                    Logger.debug('Dados enviados com sucesso via USB!', { debug: 'thermalPrintService.enviarParaImpressora' });
                    return { success: true };
                }
            }

            Logger.debug('Nenhum método de envio válido, usando fallback...', { debug: 'thermalPrintService.enviarParaImpressora' });
            return await this.imprimirFallback(comandosESCPOS, tipo);

        } catch (error) {
            Logger.error('Erro ao enviar para impressora:', error, { erro: 'thermalPrintService.enviarParaImpressora' });

            // TRATAMENTO DE ERROS ESPECÍFICOS
            if (error.name === 'NetworkError' || error.message.includes('device unavailable')) {
                Logger.debug('Dispositivo indisponível, tentando reconectar...', { debug: 'thermalPrintService.enviarParaImpressora' });
                this.handleDisconnection();

                try {
                    const reconectado = await this.conectar();
                    if (reconectado) {
                        Logger.debug('Reconectado! Tentando imprimir novamente...', { debug: 'thermalPrintService.enviarParaImpressora' });
                        return await this.enviarParaImpressora(comandosESCPOS, tipo);
                    }
                } catch (reconectError) {
                    Logger.error('Falha na reconexão:', reconectError, { erro: 'thermalPrintService.enviarParaImpressora' });
                }
            }

            Logger.debug('Usando fallback devido ao erro...', { debug: 'thermalPrintService.enviarParaImpressora' });
            return await this.imprimirFallback(comandosESCPOS, tipo);
        }
    }

    // Resto dos métodos permanecem iguais...
    async forcarResetConexao() {
        Logger.debug('Forçando reset da conexão...', { debug: 'thermalPrintService.forcarResetConexao' });

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
            Logger.warn('Erro ao fechar porta:', closeError, { aviso: 'thermalPrintService.forcarResetConexao' });
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
            Logger.debug('Conectado via USB:', { debug: 'thermalPrintService.conectarUSBMelhorado', device: device.productName });
            return true;
        } catch (error) {
            Logger.error('Erro conexão USB:', error, { erro: 'thermalPrintService.conectarUSBMelhorado' });
            throw error;
        }
    }

    conectarFallback() {
        Logger.info('Usando modo fallback - impressão via browser', { info: 'thermalPrintService.conectarFallback' });
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
        Logger.info('Iniciando desconexão...', { info: 'thermalPrintService.desconectar' });

        try {
            if (this.keepAliveInterval) {
                clearInterval(this.keepAliveInterval);
                this.keepAliveInterval = null;
                Logger.debug('Keep-alive parado', { debug: 'thermalPrintService.desconectar' });
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
                Logger.debug('Fechando porta serial...', { debug: 'thermalPrintService.desconectar' });
                await this.port.close();
            } else if (this.device && this.device.close) {
                Logger.debug('Fechando dispositivo USB...', { debug: 'thermalPrintService.desconectar' });
                await this.device.close();
            }
        } catch (error) {
            Logger.warn('Erro ao desconectar (não crítico):', error, { warn: 'thermalPrintService.desconectar' });
        } finally {
            this.handleDisconnection();
            Logger.info('Desconexão concluída', { info: 'thermalPrintService.desconectar' });
        }
    }

    // MÉTODO PARA TESTAR TUDO
    async testarConexaoCompleta() {
        Logger.info('═══════════════════════════════════════', { info: 'thermalPrintService.testarConexaoCompleta' });
        Logger.info('TESTE COMPLETO DE CONEXÃO E IMPRESSÃO', { info: 'thermalPrintService.testarConexaoCompleta' });
        Logger.info('═══════════════════════════════════════', { info: 'thermalPrintService.testarConexaoCompleta' });

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
                resultado.detalhes.push(`Diagnóstico falhou: ${diagnostico.message}`);
                return resultado;
            }

            resultado.detalhes.push('Diagnóstico passou');
            resultado.detalhes.push(...diagnostico.details);

            // Etapa 2: Conectar
            resultado.etapas.push('Tentando conectar...');
            const conectado = await this.conectar();

            if (!conectado) {
                resultado.detalhes.push('Falha na conexão');
                return resultado;
            }

            resultado.detalhes.push('Conexão estabelecida');

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
                resultado.detalhes.push('Teste de impressão enviado com sucesso');
                resultado.success = true;
            } else {
                resultado.detalhes.push('Falha no teste de impressão');
            }

            return resultado;

        } catch (error) {
            resultado.detalhes.push(`Erro durante teste: ${error.message}`);
            return resultado;
        }
    }

    // OBTER STATUS DETALHADO
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