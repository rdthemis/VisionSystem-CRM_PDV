// frontend/src/services/relatoriosService.js
import Logger from "../utils/Logger";

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
        Logger.error('Erro na requisição:', { erro: error });
        throw error;
    }
};

export const relatoriosService = {

    // Relatório de clientes
    async relatorioClientes(filtros = {}) {
        const params = new URLSearchParams();

        // Adiciona todos os filtros que não estão vazios
        Object.keys(filtros).forEach(key => {
            if (filtros[key] !== '' && filtros[key] !== null && filtros[key] !== undefined) {
                params.append(key, filtros[key]);
            }
        });

        const url = `/relatorios/clientes${params.toString() ? `?${params.toString()}` : ''}`;
        return await fetchWithAuth(url);
    },

    // Relatório financeiro
    async relatorioFinanceiro(dataInicio, dataFim) {
        const params = new URLSearchParams({
            data_inicio: dataInicio,
            data_fim: dataFim
        });

        const url = `/relatorios/financeiro?${params.toString()}`;
        return await fetchWithAuth(url);
    },

    // Relatório de inadimplência
    async relatorioInadimplencia(diasAtraso = 30) {
        const params = new URLSearchParams({
            dias_atraso: diasAtraso.toString()
        });

        const url = `/relatorios/inadimplencia?${params.toString()}`;
        return await fetchWithAuth(url);
    },

    // Relatório de fluxo de caixa
    async relatorioFluxoCaixa(dataInicio, dataFim) {
        const params = new URLSearchParams({
            data_inicio: dataInicio,
            data_fim: dataFim
        });

        const url = `/relatorios/fluxo-caixa?${params.toString()}`;
        return await fetchWithAuth(url);
    },

    // Relatório de recibos
    async relatorioRecibos(dataInicio, dataFim) {
        const params = new URLSearchParams({
            data_inicio: dataInicio,
            data_fim: dataFim
        });

        const url = `/relatorios/recibos?${params.toString()}`;
        return await fetchWithAuth(url);
    },

    // Relatório de vendas por período (dia/semana/mês/ano)
    async relatorioVendasPeriodo(dataInicio, dataFim, granularidade = 'dia') {
        const params = new URLSearchParams({
            data_inicio: dataInicio,
            data_fim: dataFim,
            granularidade
        });

        const url = `/relatorios/vendas-periodo?${params.toString()}`;
        return await fetchWithAuth(url);
    },

    // Relatório de vendas por cliente
    async relatorioVendasCliente(dataInicio, dataFim) {
        const params = new URLSearchParams({
            data_inicio: dataInicio,
            data_fim: dataFim
        });

        const url = `/relatorios/vendas-cliente?${params.toString()}`;
        return await fetchWithAuth(url);
    },

    // Relatório de fechamento de caixa (conferência por forma de pagamento)
    async relatorioFechamentoCaixa(dataInicio, dataFim) {
        const params = new URLSearchParams({
            data_inicio: dataInicio,
            data_fim: dataFim
        });

        const url = `/relatorios/fechamento-caixa?${params.toString()}`;
        return await fetchWithAuth(url);
    },

    // Função para exportar dados como CSV
    exportarCSV(dados, tipoRelatorio) {
        let csvContent = '';
        let filename = '';

        switch (tipoRelatorio) {
            case 'clientes':
                csvContent = this.gerarCSVClientes(dados);
                filename = 'relatorio_clientes.csv';
                break;
            case 'financeiro':
                csvContent = this.gerarCSVFinanceiro(dados);
                filename = 'relatorio_financeiro.csv';
                break;
            case 'inadimplencia':
                csvContent = this.gerarCSVInadimplencia(dados);
                filename = 'relatorio_inadimplencia.csv';
                break;
            case 'fluxo_caixa':
                csvContent = this.gerarCSVFluxoCaixa(dados);
                filename = 'relatorio_fluxo_caixa.csv';
                break;
            case 'recibos':
                csvContent = this.gerarCSVRecibos(dados);
                filename = 'relatorio_recibos.csv';
                break;
            case 'vendas_periodo':
                csvContent = this.gerarCSVVendasPeriodo(dados);
                filename = 'relatorio_vendas_periodo.csv';
                break;
            case 'vendas_cliente':
                csvContent = this.gerarCSVVendasCliente(dados);
                filename = 'relatorio_vendas_cliente.csv';
                break;
            case 'fechamento_caixa':
                csvContent = this.gerarCSVFechamentoCaixa(dados);
                filename = 'relatorio_fechamento_caixa.csv';
                break;
            default:
                throw new Error('Tipo de relatório não suportado para exportação');
        }

        // Criar e baixar o arquivo
        this.baixarCSV(csvContent, filename);
    },

    // Gerar CSV para relatório de clientes
    gerarCSVClientes(dados) {
        let csv = 'Nome,Tipo,Documento,Cidade,UF,Total Contas,Valor Pendente\n';

        dados.clientes?.forEach(cliente => {
            const linha = [
                this.escaparCSV(cliente.nome || ''),
                this.escaparCSV(cliente.tipo_pessoa_texto || ''),
                this.escaparCSV(cliente.cpf_cnpj || ''),
                this.escaparCSV(cliente.cidade || ''),
                this.escaparCSV(cliente.uf || ''),
                cliente.total_contas || 0,
                cliente.valor_pendente || 0
            ].join(',');
            csv += linha + '\n';
        });

        return csv;
    },

    // Gerar CSV para relatório financeiro
    gerarCSVFinanceiro(dados) {
        let csv = 'Forma de Pagamento,Quantidade,Valor Total\n';

        dados.resumo?.por_forma_pagamento?.forEach(forma => {
            const linha = [
                this.escaparCSV(forma.forma_pagamento || ''),
                forma.quantidade || 0,
                forma.valor_total || 0
            ].join(',');
            csv += linha + '\n';
        });

        return csv;
    },

    // Gerar CSV para relatório de inadimplência
    gerarCSVInadimplencia(dados) {
        let csv = 'Cliente,Documento,Descrição,Vencimento,Dias Atraso,Valor Pendente\n';

        dados.inadimplentes?.forEach(conta => {
            const linha = [
                this.escaparCSV(conta.cliente_nome || ''),
                this.escaparCSV(conta.cliente_documento || ''),
                this.escaparCSV(conta.conta_descricao || ''),
                conta.data_vencimento || '',
                conta.dias_atraso || 0,
                conta.valor_pendente || 0
            ].join(',');
            csv += linha + '\n';
        });

        return csv;
    },

    // Gerar CSV para fluxo de caixa
    gerarCSVFluxoCaixa(dados) {
        let csv = 'Data,Entradas,Saldo Diário\n';

        dados.por_data?.forEach(dia => {
            const linha = [
                dia.data || '',
                dia.entradas || 0,
                dia.saldo || 0
            ].join(',');
            csv += linha + '\n';
        });

        return csv;
    },

    // Gerar CSV para recibos
    gerarCSVRecibos(dados) {
        let csv = 'Número,Data,Cliente,Valor,Forma Pagamento\n';

        dados.recibos?.forEach(recibo => {
            const linha = [
                this.escaparCSV(recibo.numero || ''),
                recibo.data || '',
                this.escaparCSV(recibo.cliente_nome || ''),
                recibo.valor || 0,
                this.escaparCSV(recibo.forma_pagamento || '')
            ].join(',');
            csv += linha + '\n';
        });

        return csv;
    },

    // Gerar CSV para vendas por período
    gerarCSVVendasPeriodo(dados) {
        let csv = 'Período,Total Pedidos,Valor Total,Ticket Médio\n';

        dados.serie?.forEach(linha => {
            const csvLinha = [
                this.escaparCSV(linha.periodo_label || ''),
                linha.total_pedidos || 0,
                linha.valor_total || 0,
                linha.ticket_medio || 0
            ].join(',');
            csv += csvLinha + '\n';
        });

        return csv;
    },

    // Gerar CSV para vendas por cliente
    gerarCSVVendasCliente(dados) {
        let csv = 'Cliente,Tipo,Total Pedidos,Valor Total,Ticket Médio\n';

        dados.clientes?.forEach(cliente => {
            const linha = [
                this.escaparCSV(cliente.cliente_nome || ''),
                this.escaparCSV(cliente.tipo_cliente || ''),
                cliente.total_pedidos || 0,
                cliente.valor_total || 0,
                cliente.ticket_medio || 0
            ].join(',');
            csv += linha + '\n';
        });

        return csv;
    },

    // Gerar CSV para fechamento de caixa
    gerarCSVFechamentoCaixa(dados) {
        let csv = 'Forma de Pagamento,Quantidade,Valor Total\n';

        dados.por_forma_pagamento?.forEach(forma => {
            const linha = [
                this.escaparCSV(forma.forma_pagamento || ''),
                forma.quantidade || 0,
                forma.valor_total || 0
            ].join(',');
            csv += linha + '\n';
        });

        return csv;
    },

    // Função auxiliar para escapar valores no CSV
    escaparCSV(valor) {
        if (valor === null || valor === undefined) {
            return '';
        }

        const texto = valor.toString();

        // Se contém vírgula, aspas ou quebra de linha, precisa ser envolvido em aspas
        if (texto.includes(',') || texto.includes('"') || texto.includes('\n')) {
            // Escapar aspas duplicando elas
            return `"${texto.replace(/"/g, '""')}"`;
        }

        return texto;
    },

    // Função para baixar o arquivo CSV
    baixarCSV(csvContent, filename) {
        // Adicionar BOM para suporte a caracteres especiais
        const BOM = '\uFEFF';
        const csvComBOM = BOM + csvContent;

        // Criar blob
        const blob = new Blob([csvComBOM], { type: 'text/csv;charset=utf-8;' });

        // Criar link para download
        const link = document.createElement('a');

        if (link.download !== undefined) {
            // Navegadores modernos
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }
};