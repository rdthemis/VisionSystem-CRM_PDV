// src/services/ConfigService.js
// 🎯 Serviço centralizado de configurações do sistema de impressão

class ConfigService {
    constructor() {
        this.CONFIG_PREFIX = 'print_';
        this.defaults = {
            // Configurações do Estabelecimento
            estabelecimento_nome: 'Gelatto Mannia - Lanchonete e Sorveteria',
            estabelecimento_endereco: 'Rua Guarani, 191',
            estabelecimento_cidade: 'Corumbataí do Sul - PR',
            estabelecimento_telefone: '(44) 99826-4006',
            estabelecimento_cnpj: '23.544.846/0001-98',
            estabelecimento_email: 'gelattomannia@gmail.com',

            // Configurações da Impressora
            impressora_tipo: 'comum', // 'comum' ou 'termica'
            impressora_largura: '80mm',
            impressora_margens: '5mm',
            impressora_fonte: 'monospace',
            impressora_conectar_auto: false,
            impressora_cortar_papel: true,

            // Configurações de Impressão Automática
            imprimir_comanda_auto: false,
            imprimir_recibo_auto: false,

            // Configurações Térmicas
            thermal_densidade: 'normal', // 'clara', 'normal', 'escura'
            thermal_tamanho_fonte: 'normal', // 'pequena', 'normal', 'grande'
            thermal_corte_automatico: true,
            thermal_linhas_avanco: 3,
            thermal_largura_linha: 32
        };
    }

    /**
     * Obter valor de configuração
     */
    get(key) {
        const fullKey = this.CONFIG_PREFIX + key;
        const stored = localStorage.getItem(fullKey);
        
        if (stored !== null) {
            // Tentar converter para boolean ou número
            if (stored === 'true') return true;
            if (stored === 'false') return false;
            if (!isNaN(stored) && stored !== '') return Number(stored);
            return stored;
        }
        
        return this.defaults[key] || null;
    }

    /**
     * Definir valor de configuração
     */
    set(key, value) {
        const fullKey = this.CONFIG_PREFIX + key;
        localStorage.setItem(fullKey, value);
        console.log(`✅ Config salva: ${key} = ${value}`);
        
        // Disparar evento de mudança
        this.dispatchConfigChange(key, value);
    }

    /**
     * Definir múltiplas configurações
     */
    setMultiple(configs) {
        Object.entries(configs).forEach(([key, value]) => {
            this.set(key, value);
        });
    }

    /**
     * Obter todas as configurações de um grupo
     */
    getGroup(groupName) {
        const result = {};
        const prefix = `${groupName}_`;
        
        Object.keys(this.defaults).forEach(key => {
            if (key.startsWith(prefix)) {
                const simplifiedKey = key.replace(prefix, '');
                result[simplifiedKey] = this.get(key);
            }
        });
        
        return result;
    }

    /**
     * Obter configurações do estabelecimento
     */
    getEstabelecimento() {
        return this.getGroup('estabelecimento');
    }

    /**
     * Obter configurações da impressora
     */
    getImpressora() {
        return this.getGroup('impressora');
    }

    /**
     * Obter configurações térmicas
     */
    getThermal() {
        return this.getGroup('thermal');
    }

    /**
     * Resetar configuração para o padrão
     */
    reset(key) {
        const fullKey = this.CONFIG_PREFIX + key;
        localStorage.removeItem(fullKey);
        console.log(`🔄 Config resetada: ${key}`);
        this.dispatchConfigChange(key, this.defaults[key]);
    }

    /**
     * Resetar todas as configurações
     */
    resetAll() {
        Object.keys(this.defaults).forEach(key => {
            this.reset(key);
        });
        console.log('🔄 Todas as configurações foram resetadas');
    }

    /**
     * Exportar todas as configurações
     */
    export() {
        const config = {};
        Object.keys(this.defaults).forEach(key => {
            config[key] = this.get(key);
        });
        return config;
    }

    /**
     * Importar configurações
     */
    import(configs) {
        Object.entries(configs).forEach(([key, value]) => {
            if (key in this.defaults) {
                this.set(key, value);
            }
        });
        console.log('✅ Configurações importadas');
    }

    /**
     * Verificar se está configurado para impressão térmica
     */
    isTermica() {
        return this.get('impressora_tipo') === 'termica';
    }

    /**
     * Verificar se deve imprimir comanda automaticamente
     */
    autoImprimirComanda() {
        return this.get('imprimir_comanda_auto') === true;
    }

    /**
     * Verificar se deve imprimir recibo automaticamente
     */
    autoImprimirRecibo() {
        return this.get('imprimir_recibo_auto') === true;
    }

    /**
     * Disparar evento de mudança de configuração
     */
    dispatchConfigChange(key, value) {
        window.dispatchEvent(new CustomEvent('config-changed', {
            detail: { key, value }
        }));
    }

    /**
     * Escutar mudanças de configuração
     */
    onChange(callback) {
        window.addEventListener('config-changed', (event) => {
            callback(event.detail.key, event.detail.value);
        });
    }
}

// Criar instância única (singleton)
const configService = new ConfigService();

export default configService;
