// useCaixa.js - Hook customizado para lógica do Caixa
import { useState, useEffect, useCallback } from 'react';
import caixaService from '../../../services/caixaService';
import pedidoService from '../../../services/pedidosService';

export const useCaixa = (onCaixaFechado, onVoltarDashboard) => {
    // Estados principais
    const [caixaData, setCaixaData] = useState({
        caixa_aberto: false,
        saldo_inicial: 0,
        total_entradas: 0,
        total_saidas: 0,
        saldo_atual: 0,
        data_abertura: null,
        status: 'fechado',
        total_movimentos: 0
    });

    const [movimentosCaixa, setMovimentosCaixa] = useState([]);
    const [loadingCaixa, setLoadingCaixa] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [tipoMensagem, setTipoMensagem] = useState('');
    
    // Estados de filtros
    const [filtroData, setFiltroData] = useState('hoje');
    const [periodoCustom, setPeriodoCustom] = useState({
        inicio: '',
        fim: ''
    });

    // Obter filtros de data
    const obterFiltrosData = useCallback(() => {
        const hoje = new Date();

        switch (filtroData) {
            case 'hoje':
                return {
                    data_inicio: hoje.toISOString().split('T')[0],
                    data_fim: hoje.toISOString().split('T')[0]
                };
            case 'semana':
                const inicioSemana = new Date(hoje);
                inicioSemana.setDate(hoje.getDate() - hoje.getDay());
                return {
                    data_inicio: inicioSemana.toISOString().split('T')[0],
                    data_fim: hoje.toISOString().split('T')[0]
                };
            case 'mes':
                const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                return {
                    data_inicio: inicioMes.toISOString().split('T')[0],
                    data_fim: hoje.toISOString().split('T')[0]
                };
            case 'custom':
                return {
                    data_inicio: periodoCustom.inicio,
                    data_fim: periodoCustom.fim
                };
            default:
                return {};
        }
    }, [filtroData, periodoCustom]);

    // Carregar dados do caixa
    const carregarDadosCaixa = useCallback(async () => {
        try {
            setLoadingCaixa(true);

            // Buscar resumo do caixa
            const resumo = await caixaService.obterResumo();
            setCaixaData(resumo.data);

            // Buscar movimentos baseado no filtro
            const filtros = obterFiltrosData();
            const movimentos = await caixaService.buscarMovimentos(filtros);

            // Garantir que movimentos é sempre um array
            if (Array.isArray(movimentos)) {
                setMovimentosCaixa(movimentos);
            } else if (movimentos && Array.isArray(movimentos.data)) {
                setMovimentosCaixa(movimentos.data);
            } else if (movimentos && movimentos.success && Array.isArray(movimentos.data)) {
                setMovimentosCaixa(movimentos.data);
            } else {
                console.warn('Movimentos não é um array:', movimentos);
                setMovimentosCaixa([]);
            }

        } catch (error) {
            console.error('Erro ao carregar dados do caixa:', error);
            setMensagem('Erro ao carregar dados do caixa: ' + error.message);
            setTipoMensagem('error');
            setMovimentosCaixa([]);
        } finally {
            setLoadingCaixa(false);
        }
    }, [obterFiltrosData]);

    // Abrir caixa
    const abrirCaixa = async (valorInicial) => {
        try {
            setLoadingCaixa(true);

            const resultado = await caixaService.abrirCaixa(valorInicial, 'Abertura do caixa');

            if (resultado.success) {
                setMensagem('Caixa aberto com sucesso!');
                setTipoMensagem('success');
                await carregarDadosCaixa();
                return { success: true };
            } else {
                throw new Error(resultado.message);
            }

        } catch (error) {
            console.error('Erro ao abrir caixa:', error);
            setMensagem('Erro ao abrir caixa: ' + error.message);
            setTipoMensagem('error');
            return { success: false, error: error.message };
        } finally {
            setLoadingCaixa(false);
        }
    };

    // ✅ VALIDAR comandas em aberto
    const validarFechamentoCaixa = async () => {
        try {
            console.log('🔍 Verificando comandas em aberto...');

            const pedidosAbertos = await pedidoService.buscarTodos('aberto');

            console.log('📋 Pedidos encontrados:', pedidosAbertos);

            if (pedidosAbertos && pedidosAbertos.length > 0) {
                return {
                    permitido: false,
                    quantidade: pedidosAbertos.length,
                    pedidos: pedidosAbertos
                };
            }

            return {
                permitido: true,
                quantidade: 0
            };

        } catch (error) {
            console.error('❌ Erro ao validar:', error);
            return {
                permitido: false,
                erro: error.message
            };
        }
    };

    // 🔧 MÉTODO fecharCaixa atualizado
    const fecharCaixa = async (observacoes = '') => {
        try {
            setLoadingCaixa(true);

            // ✅ VALIDAÇÃO FRONTEND
            console.log('🔒 Validando fechamento de caixa...');
            const validacao = await validarFechamentoCaixa();

            if (!validacao.permitido) {
                setLoadingCaixa(false);

                if (validacao.erro) {
                    setMensagem(`Erro: ${validacao.erro}`);
                    setTipoMensagem('error');
                    return { success: false, error: validacao.erro };
                }

                // Montar lista de comandas
                const lista = validacao.pedidos
                    .slice(0, 5)
                    .map(p => `• Pedido #${p.id} - ${p.cliente_nome || 'Balcão'} - R$ ${parseFloat(p.total).toFixed(2)}`)
                    .join('\n');

                const mensagemLista = validacao.quantidade > 5
                    ? `${lista}\n• ... e mais ${validacao.quantidade - 5} comanda(s)`
                    : lista;

                // Mostrar alert
                alert(
                    `❌ NÃO É POSSÍVEL FECHAR O CAIXA!\n\n` +
                    `Existem ${validacao.quantidade} comanda(s) em aberto:\n\n` +
                    `${mensagemLista}\n\n` +
                    `Finalize ou cancele todas as comandas antes de fechar o caixa.`
                );

                setMensagem(`${validacao.quantidade} comanda(s) em aberto`);
                setTipoMensagem('warning');

                return {
                    success: false,
                    error: 'Comandas em aberto',
                    comandas_abertas: validacao.quantidade
                };
            }

            console.log('✅ Sem comandas abertas. Fechando caixa...');

            // ✅ Fechar caixa no backend
            const response = await caixaService.fecharCaixa(observacoes);

            // ✅ TRATAR possível erro do backend
            if (!response.success) {
                // Se o backend retornar que tem comandas abertas
                if (response.comandas_abertas) {
                    alert(
                        `❌ ERRO DO SERVIDOR\n\n` +
                        `O servidor detectou ${response.comandas_abertas} comanda(s) em aberto.\n\n` +
                        `${response.message}`
                    );

                    setMensagem(response.message);
                    setTipoMensagem('error');

                    return { success: false, error: response.message };
                }

                throw new Error(response.message);
            }

            // ✅ SUCESSO
            setMensagem('Caixa fechado com sucesso!');
            setTipoMensagem('success');

            if (onCaixaFechado) {
                onCaixaFechado();
            }

            setTimeout(() => {
                if (onVoltarDashboard && typeof onVoltarDashboard === 'function') {
                    onVoltarDashboard();
                } else {
                    window.dispatchEvent(new CustomEvent('voltarDashboard', {
                        detail: { origem: 'fechamento_caixa', timestamp: Date.now() }
                    }));
                }
            }, 1500);

            return { success: true, data: response.data };

        } catch (error) {
            console.error('❌ Erro ao fechar caixa:', error);
            setMensagem('Erro ao fechar caixa: ' + error.message);
            setTipoMensagem('error');
            return { success: false, error: error.message };
        } finally {
            setLoadingCaixa(false);
        }
    };


    // Adicionar movimento
    const adicionarMovimento = async (movimento) => {
        try {
            setLoadingCaixa(true);

            const valor = parseFloat(movimento.valor);
            if (isNaN(valor) || valor <= 0) {
                setMensagem('Valor deve ser um número positivo');
                setTipoMensagem('error');
                return { success: false };
            }

            const movimentoData = {
                tipo: movimento.tipo,
                valor: valor,
                descricao: movimento.descricao,
                categoria: movimento.categoria
            };

            const resultado = await caixaService.adicionarMovimento(movimentoData);

            if (resultado.success) {
                setMensagem('Movimento adicionado com sucesso!');
                setTipoMensagem('success');
                await carregarDadosCaixa();
                return { success: true };
            } else {
                throw new Error(resultado.message);
            }

        } catch (error) {
            console.error('Erro ao adicionar movimento:', error);
            setMensagem('Erro ao adicionar movimento: ' + error.message);
            setTipoMensagem('error');
            return { success: false, error: error.message };
        } finally {
            setLoadingCaixa(false);
        }
    };

    // Limpar mensagem após tempo
    useEffect(() => {
        if (mensagem) {
            const timer = setTimeout(() => {
                setMensagem('');
                setTipoMensagem('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [mensagem]);

    // Carregar dados na inicialização
    useEffect(() => {
        carregarDadosCaixa();
    }, [carregarDadosCaixa]);

    return {
        // Estados
        caixaData,
        movimentosCaixa,
        loadingCaixa,
        mensagem,
        tipoMensagem,
        filtroData,
        periodoCustom,
        
        // Actions
        abrirCaixa,
        fecharCaixa,
        adicionarMovimento,
        carregarDadosCaixa,
        setFiltroData,
        setPeriodoCustom,
        setMensagem,
        setTipoMensagem,
        validarFechamentoCaixa
    };
};
