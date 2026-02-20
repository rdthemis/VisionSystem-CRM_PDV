// frontend/src/services/contasReceberService.js

// Configuração da API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Função para fazer requisições autenticadas
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

class ContasReceberService {

    // Listar contas com filtros e paginação
    async listar(filtros = {}) {
        const params = new URLSearchParams();

        Object.keys(filtros).forEach(key => {
            if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
                params.append(key, filtros[key]);
            }
        });

        const queryString = params.toString();
        const url = `/contas-receber${queryString ? `?${queryString}` : ''}`;

        return await fetchWithAuth(url);
    }

    // Buscar conta por ID
    async buscarPorId(id) {
        return await fetchWithAuth(`/contas-receber/${id}`);
    }

    // Criar nova conta
    async criar(dadosConta) {
        return await fetchWithAuth('/contas-receber', {
            method: 'POST',
            body: JSON.stringify(dadosConta)
        });
    }

    // Atualizar conta
    async atualizar(id, dadosConta) {
        return await fetchWithAuth(`/contas-receber/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dadosConta)
        });
    }

    // Cancelar conta
    async cancelar(id) {
        return await fetchWithAuth(`/contas-receber/${id}/cancelar`, {
            method: 'DELETE'
        });
    }

    // Adicionar pagamento
    async adicionarPagamento(contaId, dadosPagamento) {
        return await fetchWithAuth(`/contas-receber/${contaId}/pagamentos`, {
            method: 'POST',
            body: JSON.stringify(dadosPagamento),
        });
    }

    // Obter resumo financeiro
    async obterResumo() {
        return await fetchWithAuth('/contas-receber/resumo');
    }

    // Buscar contas por cliente
    async buscarPorCliente(clienteId, limite = 10) {
        const params = new URLSearchParams();
        if (limite) params.append('limite', limite);

        const queryString = params.toString();
        const url = `/contas-receber/cliente/${clienteId}${queryString ? `?${queryString}` : ''}`;

        return await fetchWithAuth(url);
    }

    // Gerar relatório
    async relatorio(dataInicio, dataFim, tipo = 'vencimento') {
        const params = new URLSearchParams();
        if (dataInicio) params.append('data_inicio', dataInicio);
        if (dataFim) params.append('data_fim', dataFim);
        if (tipo) params.append('tipo', tipo);

        const queryString = params.toString();
        const url = `/contas-receber/relatorio${queryString ? `?${queryString}` : ''}`;

        return await fetchWithAuth(url);
    }

    // Atualizar status das contas vencidas
    async atualizarStatusVencidas() {
        return await fetchWithAuth('/contas-receber/atualizar-status', {
            method: 'POST'
        });
    }

    // Funções utilitárias

    // Formatar moeda brasileira
    formatarMoeda(valor) {
        if (!valor) return 'R$ 0,00';

        const numero = parseFloat(valor);
        return numero.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    // Formatar data para exibição
    formatarData(data) {
        if (!data) return '-';

        const dataObj = new Date(data + 'T00:00:00');
        return dataObj.toLocaleDateString('pt-BR');
    }

    // Formatar data e hora para exibição
    formatarDataHora(data) {
        if (!data) return '-';

        const dataObj = new Date(data);
        return dataObj.toLocaleString('pt-BR');
    }

    // Calcular dias para vencimento
    calcularDiasVencimento(dataVencimento) {
        const hoje = new Date();
        const vencimento = new Date(dataVencimento + 'T00:00:00');
        const diferenca = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));

        if (diferenca < 0) {
            return {
                dias: Math.abs(diferenca),
                status: 'vencido',
                texto: `${Math.abs(diferenca)} dias em atraso`,
                cor: '#dc3545'
            };
        } else if (diferenca === 0) {
            return {
                dias: 0,
                status: 'hoje',
                texto: 'Vence hoje',
                cor: '#ffc107'
            };
        } else if (diferenca <= 7) {
            return {
                dias: diferenca,
                status: 'proximo',
                texto: `Vence em ${diferenca} dias`,
                cor: '#fd7e14'
            };
        } else {
            return {
                dias: diferenca,
                status: 'futuro',
                texto: `Vence em ${diferenca} dias`,
                cor: '#28a745'
            };
        }
    }

    // Obter cor do status
    getStatusColor(status) {
        const cores = {
            'pendente': '#007bff',
            'pago': '#28a745',
            'vencido': '#dc3545',
            'cancelado': '#6c757d'
        };
        return cores[status] || '#333';
    }

    // Obter texto do status
    getStatusTexto(status) {
        const textos = {
            'pendente': 'Pendente',
            'pago': 'Pago',
            'vencido': 'Vencido',
            'cancelado': 'Cancelado'
        };
        return textos[status] || status;
    }

    // Validar formulário de conta
    validarConta(dados) {
        const erros = [];

        if (!dados.cliente_id) {
            erros.push('Cliente é obrigatório');
        }

        if (!dados.descricao || dados.descricao.trim() === '') {
            erros.push('Descrição é obrigatória');
        }

        if (!dados.valor_original || parseFloat(dados.valor_original) <= 0) {
            erros.push('Valor deve ser maior que zero');
        }

        if (!dados.data_vencimento) {
            erros.push('Data de vencimento é obrigatória');
        }

        return erros;
    }

    // Validar formulário de pagamento
    validarPagamento(dados, valorPendente) {
        const erros = [];

        if (!dados.valor_pago || parseFloat(dados.valor_pago) <= 0) {
            erros.push('Valor pago deve ser maior que zero');
        }

        if (parseFloat(dados.valor_pago) > valorPendente) {
            erros.push('Valor pago não pode ser maior que o valor pendente');
        }

        if (!dados.data_pagamento) {
            erros.push('Data do pagamento é obrigatória');
        }

        if (!dados.forma_pagamento) {
            erros.push('Forma de pagamento é obrigatória');
        }

        return erros;
    }

    // Calcular totais de um array de contas
    calcularTotais(contas) {
        return contas.reduce((totais, conta) => {
            totais.quantidade += 1;
            totais.valorOriginal += parseFloat(conta.valor_original || 0);
            totais.valorRecebido += parseFloat(conta.valor_recebido || 0);
            totais.valorPendente += parseFloat(conta.valor_pendente || 0);

            // Contadores por status
            if (!totais.porStatus[conta.status]) {
                totais.porStatus[conta.status] = {
                    quantidade: 0,
                    valor: 0
                };
            }
            totais.porStatus[conta.status].quantidade += 1;
            totais.porStatus[conta.status].valor += parseFloat(conta.valor_original || 0);

            return totais;
        }, {
            quantidade: 0,
            valorOriginal: 0,
            valorRecebido: 0,
            valorPendente: 0,
            porStatus: {}
        });
    }

    // Filtrar contas por período
    filtrarPorPeriodo(contas, dataInicio, dataFim, campo = 'data_vencimento') {
        if (!dataInicio && !dataFim) return contas;

        return contas.filter(conta => {
            const dataConta = new Date(conta[campo] + 'T00:00:00');

            if (dataInicio && dataFim) {
                const inicio = new Date(dataInicio + 'T00:00:00');
                const fim = new Date(dataFim + 'T23:59:59');
                return dataConta >= inicio && dataConta <= fim;
            } else if (dataInicio) {
                const inicio = new Date(dataInicio + 'T00:00:00');
                return dataConta >= inicio;
            } else if (dataFim) {
                const fim = new Date(dataFim + 'T23:59:59');
                return dataConta <= fim;
            }

            return true;
        });
    }

    // Agrupar contas por período (mensal)
    agruparPorMes(contas, campo = 'data_vencimento') {
        const grupos = {};

        contas.forEach(conta => {
            const data = new Date(conta[campo] + 'T00:00:00');
            const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;

            if (!grupos[chave]) {
                grupos[chave] = {
                    periodo: data.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' }),
                    contas: [],
                    totais: {
                        quantidade: 0,
                        valorOriginal: 0,
                        valorRecebido: 0,
                        valorPendente: 0
                    }
                };
            }

            grupos[chave].contas.push(conta);
            grupos[chave].totais.quantidade += 1;
            grupos[chave].totais.valorOriginal += parseFloat(conta.valor_original || 0);
            grupos[chave].totais.valorRecebido += parseFloat(conta.valor_recebido || 0);
            grupos[chave].totais.valorPendente += parseFloat(conta.valor_pendente || 0);
        });

        return Object.values(grupos).sort((a, b) => a.periodo.localeCompare(b.periodo));
    }

    // Exportar dados para CSV
    exportarCSV(contas) {
        const headers = [
            'ID', 'Cliente', 'Descrição', 'Valor Original', 'Valor Recebido',
            'Valor Pendente', 'Data Vencimento', 'Data Emissão', 'Status'
        ];

        const rows = contas.map(conta => [
            conta.id,
            conta.cliente_nome,
            conta.descricao,
            conta.valor_original,
            conta.valor_recebido,
            conta.valor_pendente,
            conta.data_vencimento,
            conta.data_emissao,
            conta.status
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `contas-receber-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Criar uma instância da classe para exportar
const contasReceberService = new ContasReceberService();

// Exportar tanto a instância quanto a classe
export { contasReceberService, ContasReceberService };
export default contasReceberService;