import React, { useState, useEffect } from 'react';

// Hooks customizados
import useCarrinho from '../../hooks/useCarrinho';

// Componentes
import ListaPedidos from './components/ListaPedidos';
import FormularioPedido from './components/FormularioPedido';
import ModalProduto from './ModalProduto';
import ModalPagamento from './components/ModalPagamento';
import ModalCliente from './components/ModalCliente';

// Services
import pedidoService from '../../services/pedidosService';
import produtoService from '../../services/produtosService';
import clienteService from '../../services/clientesService';
import caixaService from '../../services/caixaService';
import printService from '../../services/printService';
import configService from '../../services/ConfigService';
import ModalEntrega from './components/ModalEntrega';
import zonasEntregaService from '../../services/zonasEntregaService';
import ComandaPreview from '../../components/ComandaPreview';
import { usePrintComanda } from '../../hooks/usePrintComanda';
import Logger from '../../utils/Logger';

// Vision UI + compatibilidade visual do PDV
import '../../styles/vision/vision-tokens.css';
import '../../styles/vision/vision-primitives.css';
import '../../styles/vision/vision-patterns.css';
import './PedidosDesign.css';
import './Pdv-completo.css';

// ══════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO CENTRALIZADA DA EMPRESA
// Ideal: futuramente ler do .env ou de um endpoint /config
// ══════════════════════════════════════════════════════════════════
const EMPRESA_CONFIG = {
  nome_empresa: 'SORVETES GELATTO MANNIA',
  endereco: 'Rua Guarani 191, Corumbataí do Sul - PR',
  telefone: '(44) 9.9826-4006',
};

const Pedidos = ({ onRefresh }) => {
  
  // ========================================
  // ESTADOS PRINCIPAIS
  // ========================================

  const { imprimir } = usePrintComanda();
  
  const [view, setView] = useState('comandas');
  
  // Dados
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [dadosComanda, setDadosComanda] = useState(null);
  
  // Estados de busca/filtro
  const [categoriaAtiva, setCategoriaAtiva] = useState('');
  const [busca, setBusca] = useState('');
  const [codigoBusca, setCodigoBusca] = useState('');
  
  // Cliente
  const [clientePedido, setClientePedido] = useState('');
  const [clienteCadastrado, setClienteCadastrado] = useState(null);

  // Show Comandas - Preview
  const [showComanda, setShowComanda] = useState(false);
  
  // Pedido atual
  const [pedidoAtual, setPedidoAtual] = useState(null);
  
  // CONTROLE DE AUTO-SAVE
  const [salvandoAutomaticamente, setSalvandoAutomaticamente] = useState(false);
  const [ultimoSalvamento, setUltimoSalvamento] = useState(null);
  
  // Modais
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [aguardandoCliente, setAguardandoCliente] = useState(false);
  const [modalEntregaAberto, setModalEntregaAberto] = useState(false);
  const [dadosEntrega, setDadosEntrega] = useState(null);
  
  // Modal de produto
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  
  // Loading e mensagens
  const [loading, setLoading] = useState(true);
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('');
  
  // Hook do carrinho
  const {
    carrinho,
    adicionarItem,
    removerItem,
    atualizarItem,
    atualizarQuantidade,
    incrementarQuantidade,
    decrementarQuantidade,
    limparCarrinho,
    calcularTotais,
    iniciarEdicao,
    cancelarEdicao,
    getItemEditando,
    itemEditando,
    carregarDePedido
  } = useCarrinho();

  // ========================================
  // HELPER: Monta dados padronizados da comanda
  // Usado tanto no botão "Imprimir" quanto no "Conta"
  // ========================================
  const montarDadosComanda = (tipoImpressao = 'producao') => {
    const totais = calcularTotais();
    
    return {
      numero: pedidoAtual?.id || `Comanda-${Date.now()}`,
      cliente: clientePedido || clienteCadastrado?.nome || 'Balcão',
      telefone: clienteCadastrado?.telefone || '',
      mesa: pedidoAtual?.mesa || '',
      origem: pedidoAtual?.origem || 'PDV',

      // Tipo de pedido / entrega
      tipo_pedido: dadosEntrega?.tipo_pedido || 'local',
      endereco_entrega: dadosEntrega?.endereco_entrega || null,
      zona_entrega: dadosEntrega?.zona_nome || null,
      taxa_entrega: dadosEntrega?.taxa_entrega || 0,

      // Itens (formato padronizado)
      itens: carrinho.map(item => ({
        quantidade: item.quantidade,
        nome: item.produto_nome,
        preco: parseFloat(item.preco_produto),
        observacao: item.observacoes || '',

      //  adicionais: (item.adicionais || []).map(add => ({
        //  descricao: add.nome || add.descricao || '',
          //valor: parseFloat(add.preco || add.valor || 0),
        //})),
      //})),
        adicionais: item.adicionais || []
      })),
      // Totais
      subtotal: totais.totalItens,
      total: totais.totalPagar + (dadosEntrega?.taxa_entrega || 0),

      observacao: pedidoAtual?.observacoes || '',
      tipo_impressao: tipoImpressao,
      data: pedidoAtual.created_at || new Date(),
    };
  };

  // ========================================
  // EFEITOS
  // ========================================

  useEffect(() => {
    if (dadosComanda && dadosComanda.itens?.length > 0) {
      Logger.debug('dadosComanda atualizado:', { debug: dadosComanda });
      setShowComanda(true);
    }
  }, [dadosComanda]);
  
  useEffect(() => {
    carregarDados();
  }, []);

  // AUTO-SAVE: Salva automaticamente quando carrinho muda
  useEffect(() => {
    if (pedidoAtual?.id && !salvandoAutomaticamente && (clientePedido || clienteCadastrado)) {
      Logger.debug('Auto-save disparado após mudança no carrinho');
      Logger.debug('   - Pedido ID:', { debug: pedidoAtual.id });
      Logger.debug('   - Cliente do pedido:', { debug: pedidoAtual.cliente_nome });
      Logger.debug('   - Itens no carrinho:', { debug: carrinho.length });

      const timer = setTimeout(() => {
        salvarAutomaticamente();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [carrinho, clientePedido, clienteCadastrado]);

  // Detectar quando item está sendo editado
  useEffect(() => {
    const itemEmEdicao = getItemEditando();
    
    if (itemEmEdicao && itemEditando !== null) {
      const produto = produtos.find(p => p.id === itemEmEdicao.produto_id);
      
      if (produto) {
        Logger.debug('Abrindo modal para editar item:', { debug: itemEmEdicao });
        setProdutoSelecionado(produto);
        setModalProdutoAberto(true);
      }
    }
  }, [itemEditando, produtos]);

  // ========================================
  // FUNÇÕES DE API
  // ========================================
  
  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const [pedidosData, produtosData] = await Promise.all([
        pedidoService.buscarTodos('aberto'),
        produtoService.buscarTodos()
      ]);

      setPedidos(pedidosData);
      setProdutos(produtosData);
      
      const categoriasUnicas = [...new Set(produtosData.map(p => p.categoria_nome))];
      setCategorias(categoriasUnicas);
      
    } catch (error) {
      Logger.error('Erro ao carregar dados:', { erro: error });
      mostrarMensagem('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const criarPedidoVazio = async (cliente) => {
    try {
      setSalvandoAutomaticamente(true);
      
      Logger.debug('Criando pedido vazio');
      Logger.debug('Cliente recebido:', { debug: cliente });
      
      const dadosPedido = {
        total: 0,
        numero_pedido: `Pedido ${Date.now()}`,
        status: 'aberto',
        ...(cliente.id 
          ? { cliente_id: parseInt(cliente.id), cliente_nome: cliente.nome }
          : { cliente_id: null, cliente_nome: cliente.nome || 'Balcão' }
        ),
        itens: []
      };

      Logger.debug('Enviando para API:', { debug: dadosPedido });

      const resultado = await pedidoService.criar(dadosPedido);

      if (resultado?.success) {
        Logger.debug('Pedido criado:', { debug: resultado.data });
        
        const pedidoCompleto = {
          ...resultado.data,
          cliente_id: cliente.id || null,
          cliente_nome: cliente.nome
        };
        
        setPedidoAtual(pedidoCompleto);
        setUltimoSalvamento(new Date());
        
        return pedidoCompleto;
      } else {
        throw new Error(resultado?.message || 'Erro ao criar pedido');
      }
      
    } catch (error) {
      Logger.error('Erro ao criar pedido vazio:', { erro: error });
      mostrarMensagem(`Erro: ${error.message}`, 'error');
      return null;
    } finally {
      setSalvandoAutomaticamente(false);
    }
  };

  const salvarAutomaticamente = async () => {
    if (!pedidoAtual?.id) return;
    
    try {
      setSalvandoAutomaticamente(true);
      Logger.info('Salvando automaticamente...', { info: { pedidoId: pedidoAtual.id, clienteId: clienteCadastrado?.id, clienteNome: clientePedido } });
      
      const totais = calcularTotais();
      
      const dadosAtualizacao = {
        id: pedidoAtual.id,
        total: totais.totalPagar,
        status: 'aberto',
        cliente_id: clienteCadastrado?.id || pedidoAtual.cliente_id || null,
        cliente_nome: clientePedido || pedidoAtual.cliente_nome || 'Balcão',
        tipo_pedido: dadosEntrega?.tipo_pedido || 'balcao',
        origem: pedidoAtual?.origem || 'PDV',
        endereco_entrega: dadosEntrega?.endereco_entrega || null,
        taxa_entrega: dadosEntrega?.taxa_entrega || 0,
        zona_entrega_id: dadosEntrega?.zona_entrega_id || null,
        itens: carrinho.map(item => ({
          produto_id: parseInt(item.produto_id),
          quantidade: parseFloat(item.quantidade),
          preco_unitario: parseFloat(item.preco_unitario),
          preco_produto: parseFloat(item.preco_produto),
          adicionais: item?.adicionais || [],
          observacoes: item?.observacoes || ''
        }))
      };

      const resultado = await pedidoService.atualizar(dadosAtualizacao);

      if (resultado?.success) {
        Logger.info('Salvo automaticamente', { info: { pedidoId: pedidoAtual.id } });
        setUltimoSalvamento(new Date());
      }
      
    } catch (error) {
      Logger.error('Erro no auto-save:', { erro: error });
    } finally {
      setSalvandoAutomaticamente(false);
    }
  };

  // ========================================
  // PROCESSAMENTO DE PAGAMENTO
  // ========================================

  const processarPagamento = async (dadosPagamento) => {
    try {
      const totais = calcularTotais();
      const totalFinal = totais.totalPagar + (dadosEntrega?.taxa_entrega || 0);

      // 1️⃣ Garantir que a comanda existe e está com itens/total/entrega em dia
      // ANTES de registrar o pagamento (o saldo devedor é calculado no backend
      // a partir de pedidos.total, então precisa estar sincronizado).
      // Uma comanda que já tem pagamento registrado ('parcial'/'finalizado')
      // tem itens/total travados no backend (ver guarda em
      // atualizarPedidoCompleto) — nesse caso só completamos o pagamento
      // sobre o que já está salvo, sem tentar ressincronizar.
      let pedidoId = pedidoAtual?.id;
      let numeroPedido = pedidoAtual?.numero_pedido;
      const comandaJaTemPagamento = ['parcial', 'finalizado'].includes(pedidoAtual?.status);

      if (!comandaJaTemPagamento) {
        const dadosSincronizacao = {
          cliente_id: pedidoAtual?.cliente_id || clienteCadastrado?.id || null,
          cliente_nome: pedidoAtual?.cliente_nome || clientePedido || 'Balcão',
          tipo_pedido: dadosEntrega?.tipo_pedido || 'balcao',
          endereco_entrega: dadosEntrega?.endereco_entrega || null,
          taxa_entrega: dadosEntrega?.taxa_entrega || 0,
          zona_entrega_id: dadosEntrega?.zona_entrega_id || null,
          total: totalFinal,
          itens: carrinho.map(item => ({
            produto_id: item.produto_id,
            produto_nome: item.produto_nome,
            quantidade: item.quantidade,
            preco_unitario: parseFloat(item.preco_unitario),
            preco_produto: parseFloat(item.preco_produto),
            adicionais: item?.adicionais || [],
            observacoes: item?.observacoes || ''
          }))
        };

        if (pedidoId) {
          const resultadoSync = await pedidoService.atualizar({ id: pedidoId, ...dadosSincronizacao });
          if (!resultadoSync?.success) {
            throw new Error(resultadoSync?.message || 'Erro ao atualizar comanda antes do pagamento');
          }
        } else {
          const resultadoCriar = await pedidoService.criar({ ...dadosSincronizacao, status: 'aberto' });
          if (!resultadoCriar?.success) {
            throw new Error(resultadoCriar?.message || 'Erro ao criar comanda');
          }
          pedidoId = resultadoCriar.data.id;
          numeroPedido = resultadoCriar.data.numero_pedido;
        }
      }

      // 2️⃣ Registrar cada forma de pagamento lançada no modal (uma comanda pode
      // ser paga com mais de uma forma na mesma sessão, ex: parte em dinheiro + parte em PIX)
      const pedidoParaOutrasEtapas = { id: pedidoId, numero_pedido: numeroPedido };
      const pagamentos = dadosPagamento.pagamentos || [dadosPagamento];

      let resultadoFinal = null;
      for (const pagamento of pagamentos) {
        const resultado = await pedidoService.registrarPagamento(pedidoId, {
          valor: pagamento.valorAPagarAgora,
          forma_pagamento: pagamento.formaPagamento,
          valor_recebido: pagamento.formaPagamento === 'dinheiro' ? pagamento.valorPago : null,
          valor_troco: pagamento.valorTroco || null,
          observacoes: pagamento.observacoes
        });

        Logger.debug('resultado do pagamento:', { info: resultado });

        if (!resultado?.success) {
          throw new Error(resultado?.message || 'Erro ao processar pagamento');
        }

        // Registrar no caixa o valor pago agora (se não for a prazo)
        if (pagamento.formaPagamento !== 'prazo') {
          await registrarNoCaixa(pedidoParaOutrasEtapas, pagamento, pagamento.valorAPagarAgora);
        }

        resultadoFinal = resultado;
      }

      const finalizado = resultadoFinal.data?.novo_status === 'finalizado';

      if (finalizado) {
        // 🔧 FIX: Impressão automática de recibo (só faz sentido no fechamento total)
        const totalPago = pagamentos.reduce((s, p) => s + (p.valorPago ?? p.valorAPagarAgora), 0);
        const totalTroco = pagamentos.reduce((s, p) => s + (p.valorTroco || 0), 0);
        const dadosPagamentoParaRecibo = {
          formaPagamento: pagamentos.map(p => p.nome || p.formaPagamento).join(' + '),
          valorPago: totalPago,
          valorTroco: totalTroco
        };
        await verificarImpressaoReciboAuto(pedidoParaOutrasEtapas, dadosPagamentoParaRecibo);

        mostrarMensagem('Pagamento processado com sucesso!', 'success');
        fecharModalPagamento();
        limparFormulario();
        await carregarDados();
        setView('comandas');
      } else {
        mostrarMensagem(
          `Pagamento parcial registrado! Saldo restante: ${pedidoService.formatarMoeda(resultadoFinal.data.saldo_pendente)}`,
          'success'
        );
        fecharModalPagamento();
        await carregarDados();
      }

    } catch (error) {
      Logger.error('Erro no pagamento:', { erro: error });
      throw error;
    }
  };

  const registrarNoCaixa = async (pedido, dadosPagamento, valorTotal) => {
    try {
      const resultado = await caixaService.registrarVendaComCaixa({
        valor: valorTotal,
        numero_pedido: pedido.numero_pedido,
        pedido_id: pedido.id,
        forma_pagamento: dadosPagamento.formaPagamento
      });
      
      if (!resultado?.success) {
        Logger.error('Falha ao registrar no caixa:', { erro: resultado?.message });
        mostrarMensagem(`Aviso: ${resultado?.message}`, 'warning');
      }
    } catch (error) {
      Logger.warn('Aviso: erro ao registrar no caixa:', { erro: error });
    }
  };

  // ========================================
  // IMPRESSÃO
  // ========================================

  /**
   * Impressão automática de comanda (ao criar pedido)
   */
  const verificarImpressaoAutomatica = async (pedido) => {
    const autoImprimir = configService.autoImprimirComanda();
    
    if (autoImprimir) {
      try {
        const dados = montarDadosComanda('producao');
        setDadosComanda(dados);
        Logger.info('Impressão automática de comanda...', { info: dados });
        await printService.imprimirComanda(dados);
      } catch (error) {
        Logger.warn('Erro na impressão automática:', { erro: error });
      }
    }
  };

  /**
   * 🔧 FIX: Lógica corrigida — era `!autoImprimir` (invertida)
   * Impressão automática de recibo (após pagamento)
   */
  const verificarImpressaoReciboAuto = async (pedido, dadosPagamento) => {
    Logger.info('Pedido enviado para impressão:', { info: pedido });
    Logger.info('Dados de pagamento para impressão:', { info: dadosPagamento });
    
    const autoImprimir = configService.autoImprimirRecibo();
    
    // 🔧 FIX: Condição era "!autoImprimir" — imprimia quando desabilitado!
    if (autoImprimir) {
      try {
        const dadosRecibo = {
          numero: dadosPagamento.id_venda || pedido.numero_pedido,
          id: pedido.id,
          origem: pedido.origem || 'PDV',
          cliente: clientePedido || clienteCadastrado?.nome || 'Balcão',
          itens: carrinho.map(item => ({
            quantidade: item.quantidade,
            nome: item.produto_nome,
            preco: item.preco_unitario,
            preco_produto: item.preco_produto,
            totalItem: item.subtotal,
            adicionais: item.adicionais || []
          })),
          total: dadosPagamento.valorPago || pedido.total,
          forma_pagamento: dadosPagamento.formaPagamento,
          valor_pago: dadosPagamento.valorPago,
          troco: dadosPagamento.valorTroco,
          taxa_entrega: dadosEntrega?.taxa_entrega || 0,
          tipo_pedido: dadosEntrega?.tipo_pedido || 'balcao',
          data: new Date()
        };
        
        Logger.info('Impressão automática de recibo...', { info: dadosRecibo });
        await printService.imprimirReciboVenda(dadosRecibo);
      } catch (error) {
        Logger.warn('Erro na impressão do recibo:', { erro: error });
      }
    }
  };

  /**
   * Handler: Botão "Conta" — abre preview da comanda para o cliente
   */
  const handleContaConsumo = async () => {
    if (carrinho.length === 0) {
      alert('Adicione pelo menos um item antes de imprimir!');
      return;
    }

    // Perguntar se quer configurar entrega (se ainda não tem)
    if (!dadosEntrega) {
      const desejaConfigurarEntrega = window.confirm(
        'Esta comanda ainda não tem entrega configurada.\n\n' +
        'Deseja configurar entrega agora?\n\n' +
        'Clique em OK para configurar ou Cancelar para imprimir sem entrega.'
      );

      if (desejaConfigurarEntrega) {
        abrirModalEntrega();
        return;
      }
    }

    try {
      // 🔧 FIX: Usa helper padronizado em vez de montar dados manualmente
      const dados = montarDadosComanda('conta');
      setDadosComanda(dados);

      Logger.info('Imprimindo conta da comanda:', { info: dados });
      setShowComanda(true);
      mostrarMensagem('Conta da comanda gerada!', 'success');

    } catch (error) {
      Logger.error('Erro ao gerar conta comanda:', { erro: error });
      mostrarMensagem(`Erro ao gerar conta: ${error.message}`, 'error');
    }
  };

  /**
   * Handler: Botão "Imprimir" — envia direto para impressora térmica
   */
  const handleImprimirComanda = async () => {
    if (carrinho.length === 0) {
      alert('Adicione pelo menos um item antes de imprimir!');
      return;
    }

    // Perguntar se quer configurar entrega
    if (!dadosEntrega) {
      const desejaConfigurarEntrega = window.confirm(
        'Esta comanda ainda não tem entrega configurada.\n\n' +
        'Deseja configurar entrega agora?\n\n' +
        'Clique em OK para configurar ou Cancelar para imprimir sem entrega.'
      );

      if (desejaConfigurarEntrega) {
        abrirModalEntrega();
        return;
      }
    }

    try {
      // 🔧 FIX: Usa helper padronizado
      const dadosComandaAtual = montarDadosComanda('producao');

      const resultado = await imprimir(dadosComandaAtual);
      if (resultado.success) {
        mostrarMensagem('Comanda impressa com sucesso!', 'success');
      } else {
        mostrarMensagem(resultado.message || 'Erro ao imprimir', 'error');
      }
    } catch (error) {
      Logger.error('Erro ao imprimir comanda:', { erro: error });
      mostrarMensagem(`Erro ao imprimir: ${error.message}`, 'error');
    }
  };

  /**
   * Imprime comanda de um pedido já salvo (da lista)
   */
  const imprimirComandaPedido = async (pedido) => {
    try {
      const dadosComanda = {
        numero: pedido.numero_pedido,
        cliente: pedido.cliente_nome || 'Balcão',
        mesa: pedido.mesa || '',
        itens: pedido.itens?.map(item => ({
          quantidade: item.quantidade,
          nome: item.produto_nome,
          observacoes: item.observacoes || '',
          adicionais: item.adicionais || []
        })) || [],
        observacoes: pedido.observacoes || '',
        data: pedido.created_at ? new Date(pedido.created_at) : new Date()
      };

      await printService.imprimirComanda(dadosComanda);
      mostrarMensagem('Comanda impressa!', 'success');

    } catch (error) {
      Logger.error('Erro ao imprimir:', { erro: error });
      mostrarMensagem(`Erro: ${error.message}`, 'error');
    }
  };

  // ========================================
  // TRANSFERÊNCIA
  // ========================================

  const handleTransferir = async (dadosTransferencia) => {
    try {
      Logger.info('Iniciando transferência:', { info: dadosTransferencia });

      const payload = {
        pedidoOrigemId: dadosTransferencia.pedidoOrigemId,
        tipoDestino: dadosTransferencia.tipoDestino,
        comandaDestinoId: dadosTransferencia.comandaDestinoId,
        nomeNovaComanda: dadosTransferencia.nomeNovaComanda,
        itens: dadosTransferencia.itens.map(item => ({
          produto_id: item.produto_id,
          quantidadeTransferir: item.quantidadeTransferir,
          preco_unitario: item.preco_unitario || item.preco,
          adicionais: item.adicionais || [],
          observacoes: item.observacoes || ''
        }))
      };

      const resultado = await pedidoService.transferir(payload);

      if (resultado?.success) {
        Logger.info('Transferência concluída:', { info: resultado.data });
        mostrarMensagem(
          `${resultado.data.itensTransferidos} item(ns) transferido(s) com sucesso!`, 
          'success'
        );
        await carregarDados();
        limparFormulario();
        setView('comandas');
        return resultado;
      } else {
        throw new Error(resultado?.message || 'Erro ao transferir itens');
      }

    } catch (error) {
      Logger.error('Erro na transferência:', { erro: error });
      mostrarMensagem(`Erro: ${error.message}`, 'error');
      throw error;
    }
  };

  // ========================================
  // NAVEGAÇÃO E FORMULÁRIO
  // ========================================
  
  const iniciarNovoPedido = () => {
    Logger.info('Iniciando novo pedido', { info: 'Abrindo seleção de cliente' });
    limparFormulario();
    setAguardandoCliente(true);
    abrirModalCliente();
  };

  const carregarPedidoParaEdicao = async (pedido) => {
    try {
      setLoadingPedido(true);
      
      const pedidoCompleto = await pedidoService.buscarPorId(pedido.id);
      
      if (!pedidoCompleto) {
        throw new Error('Erro ao carregar pedido');
      }

      setPedidoAtual(pedidoCompleto);
      setClientePedido(pedidoCompleto.cliente_nome || '');
      
      if (pedidoCompleto.cliente_id) {
        setClienteCadastrado({
          id: pedidoCompleto.cliente_id,
          nome: pedidoCompleto.cliente_nome,
        });
      }

      // Restaura a configuração de entrega salva (some ao reabrir se não
      // recarregarmos aqui, já que ela vive só no estado local do formulário)
      if (pedidoCompleto.tipo_pedido === 'entrega' || parseFloat(pedidoCompleto.taxa_entrega) > 0) {
        setDadosEntrega({
          zona_entrega_id: pedidoCompleto.zona_entrega_id || null,
          zona_nome: null,
          taxa_entrega: parseFloat(pedidoCompleto.taxa_entrega) || 0,
          endereco_entrega: pedidoCompleto.endereco_entrega || '',
          tipo_pedido: pedidoCompleto.tipo_pedido || 'entrega'
        });
      } else {
        setDadosEntrega(null);
      }

      limparCarrinho();
      
      if (pedidoCompleto.itens?.length > 0) {
        carregarDePedido(pedidoCompleto.itens);
      }

      setView('novo-pedido');
      
    } catch (error) {
      Logger.error('Erro ao carregar pedido:', { erro: error });
      mostrarMensagem('Erro ao carregar pedido', 'error');
    } finally {
      setLoadingPedido(false);
    }
  };

  const finalizarPedido = async () => {
    mostrarMensagem('Pedido salvo!', 'success');
    limparFormulario();
    await carregarDados();
    setView('comandas');
  };

  const voltarParaComandas = async () => {
    await carregarDados();
    limparFormulario();
    setView('comandas');
  };

  const cancelarComanda = async () => {
    const confirmar = window.confirm('Deseja cancelar esta comanda?');
    if (!confirmar) return;
    
    try {
      const totais = calcularTotais();
      
      const dadosPedido = {
        id: pedidoAtual.id,
        total: totais.totalPagar,
        status: 'cancelado',
        cliente_id: pedidoAtual.cliente_id || clienteCadastrado?.id || null,
        cliente_nome: pedidoAtual.cliente_nome || clientePedido || 'Balcão',
        itens: carrinho.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: parseFloat(item.preco_unitario),
          adicionais: item?.adicionais || [],
          observacoes: item?.observacoes || '' 
        })),
      };

      const resultado = await pedidoService.atualizar(dadosPedido);

      if (!resultado?.success) {
        throw new Error(resultado?.message || 'Erro ao processar cancelamento');
      }

      mostrarMensagem('Comanda cancelada com sucesso!', 'success');
      limparFormulario();
      await carregarDados();
      setView('comandas');
      
    } catch (error) {
      Logger.error('Erro ao cancelar:', { erro: error });
      throw error;
    }
  };

  const limparFormulario = () => {
    setClientePedido('');
    setClienteCadastrado(null);
    setPedidoAtual(null);
    limparCarrinho();
    setCategoriaAtiva('');
    setBusca('');
    setCodigoBusca('');
    setUltimoSalvamento(null);
    limparDadosEntrega();
  };

  // ========================================
  // HANDLERS DO CARRINHO
  // ========================================
  
  const abrirModalProduto = (produto) => {
    setProdutoSelecionado(produto);
    setModalProdutoAberto(true);
  };

  const fecharModalProduto = () => {
    setModalProdutoAberto(false);
    setProdutoSelecionado(null);
    if (itemEditando !== null) {
      cancelarEdicao();
    }
  };

  const handleConfirmarProduto = (itemCompleto) => {
    if (itemEditando !== null) {
      atualizarItem(itemEditando, itemCompleto);
      cancelarEdicao();
      mostrarMensagem('Item atualizado!', 'success');
    } else {
      adicionarItem(itemCompleto);
      mostrarMensagem('Item adicionado!', 'success');
    }
    
    fecharModalProduto();
  };

  const handleExcluirItemEditando = () => {
    if (itemEditando === null) return;

    removerItem(itemEditando);
    cancelarEdicao();
    setModalProdutoAberto(false);
    setProdutoSelecionado(null);
    mostrarMensagem('Item removido!', 'success');
  };

  // ========================================
  // HANDLERS DE ENTREGA
  // ========================================

  const abrirModalEntrega = () => {
    setModalEntregaAberto(true);
  };

  const fecharModalEntrega = () => {
    setModalEntregaAberto(false);
  };

  const handleConfirmarEntrega = async (dados) => {
    Logger.info('Dados de entrega:', { info: dados });
    
    setDadosEntrega({
      zona_entrega_id: dados.zonaId,
      zona_nome: dados.zonaNome,
      taxa_entrega: dados.taxa,
      endereco_entrega: dados.endereco,
      tipo_pedido: dados.zonaNome !== null ? dados.zonaNome : 'local'
    });

    if (pedidoAtual?.id) {
      try {
        const totais = calcularTotais();
        
        const dadosAtualizacao = {
          id: pedidoAtual.id,
          tipo_pedido: 'entrega',
          origem: pedidoAtual.origem || 'PDV',
          endereco_entrega: dados.endereco,
          taxa_entrega: dados.taxa,
          zona_entrega_id: dados.zonaId,
          total: totais.totalPagar + dados.taxa,
          itens: carrinho.map(item => ({
            produto_id: parseInt(item.produto_id),
            quantidade: parseFloat(item.quantidade),
            preco_unitario: parseFloat(item.preco_unitario),
            adicionais: item?.adicionais || [],
            observacoes: item?.observacoes || ''
          }))
        };

        await pedidoService.atualizar(dadosAtualizacao);
        
        mostrarMensagem(
          `Entrega configurada! Taxa: R$ ${dados.taxa.toFixed(2)}`,
          'success'
        );
      } catch (error) {
        Logger.error('Erro ao configurar entrega:', { erro: error });
        mostrarMensagem('Erro ao configurar entrega', 'error');
      }
    } else {
      mostrarMensagem(
        `Entrega configurada! Taxa: R$ ${dados.taxa.toFixed(2)}`,
        'success'
      );
    }
  };

  const limparDadosEntrega = () => {
    setDadosEntrega(null);
  };

  const buscarPorCodigo = () => {
    if (!codigoBusca) return;

    const produto = produtos.find(p => p.id.toString() === codigoBusca);
    
    if (produto) {
      abrirModalProduto(produto);
      setCodigoBusca('');
    } else {
      alert('Produto não encontrado!');
    }
  };

  // ========================================
  // HANDLERS DE CLIENTE
  // ========================================
  
  const handleClienteChange = (novoValor) => {
    setClientePedido(novoValor);
    
    if (clienteCadastrado?.nome !== novoValor.trim()) {
      setClienteCadastrado(null);
    }
  };

  const abrirModalCliente = () => {
    setModalClienteAberto(true);
  };

  const fecharModalCliente = () => {
    setModalClienteAberto(false);

    if (aguardandoCliente) {
      Logger.info('Seleção de cliente cancelada', { info: "Seleção Cancelada" });
      setAguardandoCliente(false);
    }
  };

  const selecionarClienteModal = async (cliente) => {
    Logger.info('Cliente selecionado do modal:', { info: cliente });
    
    const clienteData = cliente.id ? {
      id: cliente.id,
      nome: cliente.nome
    } : null;
    
    setClienteCadastrado(clienteData);
    setClientePedido(cliente.nome);
    
    fecharModalCliente();
    mostrarMensagem(`Cliente ${cliente.nome} selecionado!`, 'success');
  
    if (aguardandoCliente) {
      limparCarrinho();
      const pedidoCriado = await criarPedidoVazio(cliente);
      try {
        if (pedidoCriado) {
          Logger.info('Pedido criado com sucesso', { info: { id: pedidoCriado.id, cliente_nome: pedidoCriado.cliente_nome } });
          setAguardandoCliente(false);
          setView('novo-pedido');
          mostrarMensagem('Comanda aberta! Adicione os itens.', 'success');
        }
      } catch (error) {
        Logger.error('Falha ao criar pedido', { erro: error });
        setAguardandoCliente(false);
      }
    }
  };

  const pularSelecaoCliente = async () => {
    Logger.info('Criando pedido Balcão', { info: { cliente: 'Balcão' } });
    
    const clienteBalcao = { id: null, nome: 'Balcão' };
    
    setClientePedido('Balcão');
    setClienteCadastrado(null);
    fecharModalCliente();
    
    if (aguardandoCliente) {
      limparCarrinho();
      const pedidoCriado = await criarPedidoVazio(clienteBalcao);
      
      try {
        if (pedidoCriado) {
          Logger.info('Pedido Balcão criado', { info: { id: pedidoCriado.id } });
          setAguardandoCliente(false);
          setView('novo-pedido');
          mostrarMensagem('Comanda aberta para Balcão!', 'success');
        }
      } catch (error) {
        Logger.error('Falha ao criar pedido Balcão', { erro: error });
        setAguardandoCliente(false);
      }
    }
  };

  // ========================================
  // HANDLERS DE PAGAMENTO
  // ========================================
  
  const abrirModalPagamento = () => {
    if (carrinho.length === 0) {
      alert('Adicione pelo menos um item!');
      return;
    }
    setModalPagamentoAberto(true);
  };

  const fecharModalPagamento = () => {
    setModalPagamentoAberto(false);
  };

  // ========================================
  // MENSAGENS
  // ========================================
  
  const mostrarMensagem = (texto, tipo = 'info') => {
    setMensagem(texto);
    setTipoMensagem(tipo);
    
    setTimeout(() => {
      setMensagem('');
      setTipoMensagem('');
    }, 3000);
  };

  // ========================================
  // RENDERIZAÇÃO
  // ========================================
  
  if (loading) {
    return (
      <div className="loading-container">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="pdv-container">
      
      {/* Mensagem de feedback */}
      {mensagem && (
        <div className={`mensagem-feedback ${tipoMensagem}`}>
          <i className={`fas fa-${tipoMensagem === 'success' ? 'check' : 'exclamation'}-circle`}></i>
          {mensagem}
        </div>
      )}

      {/* Indicador de auto-save */}
      {salvandoAutomaticamente && (
        <div className="auto-save-indicator">
          <i className="fas fa-spinner fa-spin"></i>
          Salvando automaticamente...
        </div>
      )}
      
      {ultimoSalvamento && view === 'novo-pedido' && (
        <div className="ultimo-salvamento">
          <i className="fas fa-check-circle"></i>
          Salvo às {ultimoSalvamento.toLocaleTimeString('pt-BR')}
        </div>
      )}

      <div className="pdv-main">
        {view === 'comandas' ? (
          <ListaPedidos
            pedidos={pedidos}
            onEditar={carregarPedidoParaEdicao}
            onNovoPedido={iniciarNovoPedido}
          />
        ) : (
          <FormularioPedido
            produtos={produtos}
            categorias={categorias}
            pedidoAtual={pedidoAtual}
            clientePedido={clientePedido}
            carrinho={carrinho}
            totais={calcularTotais()}
            categoriaAtiva={categoriaAtiva}
            busca={busca}
            codigoBusca={codigoBusca}
            loadingPedido={loadingPedido}
            onCategoriaChange={setCategoriaAtiva}
            onBuscaChange={setBusca}
            onCodigoChange={setCodigoBusca}
            onBuscarPorCodigo={buscarPorCodigo}
            onClienteChange={handleClienteChange}
            onBuscarCliente={abrirModalCliente}
            onProdutoClick={abrirModalProduto}
            onEditarItem={iniciarEdicao}
            onAlterarQuantidade={atualizarQuantidade}
            onIncrementarQuantidade={incrementarQuantidade}
            onDecrementarQuantidade={decrementarQuantidade}
            onVoltar={voltarParaComandas}
            onCancelar={cancelarComanda}
            onImprimir={handleImprimirComanda}
            onContaConsumo={handleContaConsumo}
            onFinalizar={finalizarPedido}
            onPagar={abrirModalPagamento}
            buscarPedidos={() => pedidoService.buscarTodos('aberto')}
            onTransferir={handleTransferir}
            dadosEntrega={dadosEntrega}
            onAbrirEntrega={abrirModalEntrega}
            onLimparEntrega={limparDadosEntrega}
          />
        )}
      </div>

      {/* Preview da Comanda */}
      {showComanda && (
        <ComandaPreview
          pedido={dadosComanda}
          onPrint={(pedido) => {
            Logger.info('Comanda impressa:', { info: { numero: pedido.numero } });
            mostrarMensagem('Comanda impressa com sucesso!', 'success');
          }}
          onClose={() => setShowComanda(false)}
          config={EMPRESA_CONFIG}
        />
      )}

      <ModalProduto
        isOpen={modalProdutoAberto}
        onClose={fecharModalProduto}
        produto={produtoSelecionado}
        onConfirmar={handleConfirmarProduto}
        onExcluir={handleExcluirItemEditando}
        modoEdicao={itemEditando !== null}
        dadosIniciais={getItemEditando()}
      />

      <ModalPagamento
        isOpen={modalPagamentoAberto}
        onClose={fecharModalPagamento}
        pedidoAtual={pedidoAtual}
        clientePedido={clientePedido}
        clienteCadastrado={clienteCadastrado}
        carrinho={carrinho}
        totalPedido={calcularTotais().totalPagar + (dadosEntrega?.taxa_entrega || 0)}
        valorJaPago={parseFloat(pedidoAtual?.valor_pago) || 0}
        onProcessar={processarPagamento}
      />

      <ModalCliente
        isOpen={modalClienteAberto}
        onClose={fecharModalCliente}
        onSelecionar={selecionarClienteModal}
        onPular={pularSelecaoCliente}
        aguardandoNovoPedido={aguardandoCliente}
        clienteService={clienteService}
      />

      <ModalEntrega
        visible={modalEntregaAberto}
        onFechar={fecharModalEntrega}
        onConfirmar={handleConfirmarEntrega}
        buscarZonas={zonasEntregaService.buscarTodas}
        dadosIniciais={dadosEntrega}
      />
    </div>
  );
};

export default Pedidos;
