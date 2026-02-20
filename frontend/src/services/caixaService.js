// caixaService.js - Versão usando fetchWithAuth igual ao pedidoService

import axios from 'axios';

// Configuração da API (igual ao seu pedidoService)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Criar instância do axios com configurações padrão
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para tratar erros
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Erro na API:', error);
        return Promise.reject(error);
    }
);

// Função para fazer requisições autenticadas (igual ao seu pedidoService)
const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);

        // Se token expirou, redirecionar para login
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
            return null;
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
};

const caixaService = {
    // 🆕 Verificar se existe caixa aberto
    verificarCaixaAberto: async () => {
        try {
            console.log('🔍 Debug - Verificando status do caixa...');
            const response = await fetchWithAuth('/caixa?status=1');
            console.log('✅ Debug - Status do caixa:', response);
            return response;
        } catch (error) {
            console.error('❌ Erro ao verificar status do caixa:', error);
            return { success: false, data: { caixa_aberto: false } };
        }
    },

    // 🆕 Abrir caixa
    abrirCaixa: async (saldoInicial = 0, observacoes = '') => {
        try {
            console.log('🔍 Debug - Iniciando abertura de caixa:', {
                saldoInicial,
                observacoes
            });

            // Validar dados antes de enviar
            const saldoNumerico = typeof saldoInicial === 'string' ?
                parseFloat(saldoInicial) || 0 :
                saldoInicial || 0;

            const dadosAbertura = {
                saldo_inicial: saldoNumerico,
                observacoes_abertura: observacoes || 'Caixa aberto pelo sistema'
            };

            console.log('🔍 Debug - Dados que serão enviados:', dadosAbertura);

            const response = await fetchWithAuth('/caixa', {
                method: 'POST',
                body: JSON.stringify(dadosAbertura)
            });

            console.log('✅ Debug - Resposta da abertura de caixa:', response);
            return response;
        } catch (error) {
            console.error('❌ Erro ao abrir caixa:', error);
            return {
                success: false,
                message: `Erro ao abrir caixa: ${error.message}`,
                debug: error.toString()
            };
        }
    },

    // Adicionar movimento ao caixa
    adicionarMovimento: async (movimento) => {
        try {
            console.log('🔍 Debug - Adicionando movimento:', movimento);

            const response = await fetchWithAuth('/caixa/movimento', {
                method: 'POST',
                body: JSON.stringify(movimento)
            });

            console.log('✅ Debug - Movimento adicionado:', response);
            return response;
        } catch (error) {
            console.error('❌ Erro ao adicionar movimento:', error);
            return { success: false, message: error.message };
        }
    },

    // Buscar movimentos
    buscarMovimentos: async (filtros = {}) => {
        try {
            const params = new URLSearchParams({ movimentos: '1' });

            if (filtros.caixa_id) params.append('caixa_id', filtros.caixa_id);
            if (filtros.tipo) params.append('tipo', filtros.tipo);
            if (filtros.categoria) params.append('categoria', filtros.categoria);
            if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
            if (filtros.data_fim) params.append('data_fim', filtros.data_fim);

            const response = await fetchWithAuth(`/caixa?${params.toString()}`);

            // 🔧 CORREÇÃO: Garantir que sempre retorna array
            const data = response;

            if (Array.isArray(data)) {
                return data;
            } else if (data && Array.isArray(data.data)) {
                return data.data;
            } else if (data && data.success && Array.isArray(data.data)) {
                return data.data;
            } else {
                console.warn('Resposta inesperada da API de movimentos:', data);
                return [];
            }
        } catch (error) {
            console.error('Erro ao buscar movimentos:', error);
            return []; // 🔧 Retornar array vazio em caso de erro
        }
    },

    // 🔧 MÉTODO ESPECÍFICO: Registrar venda (versão simples)
    registrarVenda: async (dadosVenda) => {
        try {
            const movimento = {
                tipo: 'entrada',
                valor: dadosVenda.valor,
                descricao: `Venda - ${dadosVenda.numero_pedido || 'Pedido'}`,
                categoria: 'Vendas',
                pedido_id: dadosVenda.pedido_id || null
            };

            return await caixaService.adicionarMovimento(movimento);
        } catch (error) {
            console.error('Erro ao registrar venda no caixa:', error);
            // Não quebrar o fluxo de pagamento se falhar
            return { success: false, message: error.message };
        }
    },

    // 🆕 VERSÃO MELHORADA: Registrar venda com verificação e abertura automática
    registrarVendaComCaixa: async (dadosVenda) => {
        try {
            // Primeiro, verificar se existe caixa aberto
            const statusCaixa = await caixaService.verificarCaixaAberto();

            if (!statusCaixa.success || !statusCaixa.data.caixa_aberto) {
                console.log("📦 Nenhum caixa aberto, abrindo automaticamente...");

                // Tentar abrir caixa automaticamente
                const resultadoAbertura = await caixaService.abrirCaixa(0, 'Caixa aberto automaticamente para processar venda');

                if (!resultadoAbertura.success) {
                    console.warn("⚠️ Falha ao abrir caixa automaticamente");
                    return { success: false, message: "Não foi possível abrir caixa para registrar a venda" };
                }

                console.log("✅ Caixa aberto automaticamente");
            }

            // Agora registrar a venda
            const movimento = {
                tipo: 'entrada',
                valor: dadosVenda.valor,
                descricao: `Venda - ${dadosVenda.numero_pedido || 'Pedido'}`,
                categoria: 'Vendas',
                pedido_id: dadosVenda.pedido_id || null
            };

            return await caixaService.adicionarMovimento(movimento);
        } catch (error) {
            console.error('Erro ao registrar venda no caixa:', error);
            return { success: false, message: error.message };
        }
    },

    // Obter resumo do caixa
    obterResumo: async (caixaId = null) => {
        try {
            const params = new URLSearchParams({ resumo: '1' });
            if (caixaId) params.append('caixa_id', caixaId);

            const response = await fetchWithAuth(`/caixa?${params.toString()}`);
            console.log("Resposta do resumo do caixa: " + JSON.stringify(response.data));
            return response;
        } catch (error) {
            console.error('Erro ao obter resumo do caixa:', error);
            return { success: false, message: error.message };
        }
    },

    // 🆕 Fechar caixa
    fecharCaixa: async (observacoes = '') => {
        try {
            const dadosFechamento = {
                observacoes_fechamento: observacoes || 'Caixa fechado'
            };

            const response = await fetchWithAuth('/caixa/fechar', {
                method: 'PUT',
                body: JSON.stringify(dadosFechamento)
            });

            return response;
        } catch (error) {
            console.error('Erro ao fechar caixa:', error);
            return { success: false, message: error.message };
        }
    },

    // 🆕 Buscar histórico de caixas
    buscarHistoricoCaixas: async (filtros = {}) => {
        try {
            const params = new URLSearchParams({ historico: '1' });

            if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
            if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
            if (filtros.usuario_id) params.append('usuario_id', filtros.usuario_id);
            if (filtros.status) params.append('status', filtros.status);

            const response = await fetchWithAuth(`/caixa?${params.toString()}`);
            return response;
        } catch (error) {
            console.error('Erro ao buscar histórico de caixas:', error);
            return { success: false, data: [], message: error.message };
        }
    },

    // Formatar moeda brasileira
    formatarMoeda(valor) {
        if (!valor) return 'R$ 0,00';

        const numero = parseFloat(valor);
        return numero.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    },

    // Limpar formatação e manter apenas números
    limparNumeros(texto) {
        return texto.replace(/\D/g, '');
    },

    // Formatar data para exibição
    formatarData(data) {
        if (!data) return '-';

        const dataObj = new Date(data);
        return dataObj.toLocaleDateString('pt-BR');
    },

    // Formatar data e hora para exibição
    formatarDataHora(data) {
        if (!data) return '-';

        const dataObj = new Date(data);
        return dataObj.toLocaleString('pt-BR');
    },

    // 🆕 CATEGORIAS DETALHADAS PARA OS MOVIMENTOS
    categorias: {
        entrada: [
            'Vendas - Dinheiro',
            'Vendas - PIX',
            'Vendas - Cartão Débito',
            'Vendas - Cartão Crédito',
            'Recebimento de Clientes',
            'Dinheiro Inicial do Caixa',
            'Transferência Recebida',
            'Juros e Rendimentos',
            'Desconto Comercial Obtido',
            'Devolução de Fornecedor',
            'Reembolso',
            'Outros Recebimentos'
        ],
        saida: [
            'Compra de Mercadorias',
            'Compra de Materiais',
            'Pagamento a Fornecedores',
            'Salários e Encargos',
            'Aluguel',
            'Energia Elétrica',
            'Água e Esgoto',
            'Internet e Telefone',
            'Combustível',
            'Manutenção e Reparos',
            'Material de Limpeza',
            'Material de Escritório',
            'Impostos e Taxas',
            'Taxas Bancárias',
            'Transferência Enviada',
            'Troco para Cliente',
            'Vale Transporte',
            'Vale Refeição',
            'Outros Pagamentos'
        ]
    },

};

// Export default para usar como import padrão
export default caixaService;

// Também disponível como named export
export { caixaService };