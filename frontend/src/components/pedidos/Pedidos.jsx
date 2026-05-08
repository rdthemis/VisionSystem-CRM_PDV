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
import contasReceberService from '../../services/contasReceberService';
import printService from '../../services/printService';
import configService from '../../services/ConfigService';
import ModalEntrega from './components/ModalEntrega';
import zonasEntregaService from '../../services/zonasEntregaService';
import ComandaPreview from '../../components/ComandaPreview';
import { usePrintComanda } from '../../hooks/usePrintComanda';
import Logger from '../../utils/Logger';

// CSS
import './Pedidos.css';

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
  

  //Show Comandas - Preview
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
    incrementarQuantidade,      // ADICIONAR
    decrementarQuantidade,      // ADICIONAR
    limparCarrinho,
    calcularTotais,
    iniciarEdicao,
    cancelarEdicao,
    getItemEditando,
    itemEditando,
    carregarDePedido
  } = useCarrinho();

  // ========================================
  // EFEITOS
  // ========================================

  useEffect(() => {
  if (dadosComanda && dadosComanda.itens?.length > 0) {
    Logger.debug('dadosComanda atualizado:', { debug: dadosComanda });
    setShowComanda(true); // Mostrar preview quando dadosComanda for atualizado
  }
}, [dadosComanda]);
  
  useEffect(() => {
    carregarDados();
  }, []);

  // AUTO-SAVE: Salva automaticamente quando carrinho muda
  useEffect(() => {
    // Só salva se:
    // 1. Já existe um pedido criado
    // 2. Não está salvando no momento
    // 3. Tem pelo menos um cliente
    if (pedidoAtual?.id && !salvandoAutomaticamente && (clientePedido || clienteCadastrado)) {
      Logger.debug('Auto-save disparado após mudança no carrinho');
      Logger.debug('   - Pedido ID:', { debug: pedidoAtual.id });
      Logger.debug('   - Cliente do pedido:', { debug: pedidoAtual.cliente_nome });
      Logger.debug('   - Itens no carrinho:', { debug: carrinho.length });

      const timer = setTimeout(() => {
        salvarAutomaticamente();
      }, 1000); // Aguarda 1 segundo após última mudança
      
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
  
  /**
   * Carrega produtos e pedidos do backend
   */
  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const [pedidosData, produtosData] = await Promise.all([
        pedidoService.buscarTodos('aberto'),
        produtoService.buscarTodos()
      ]);

      setPedidos(pedidosData);
      setProdutos(produtosData);
      
      // Extrair categorias únicas
      const categoriasUnicas = [...new Set(produtosData.map(p => p.categoria_nome))];
      setCategorias(categoriasUnicas);
      
    } catch (error) {
      Logger.error('Erro ao carregar dados:', { erro: error });
      mostrarMensagem('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * CRIAR PEDIDO VAZIO (só com cliente)
   * Chamado automaticamente ao selecionar cliente
   */
  const criarPedidoVazio = async (cliente) => {
    try {
      setSalvandoAutomaticamente(true);
      
      // LOG DETALHADO para debug
      Logger.debug('Criando pedido vazio');
      Logger.debug('Cliente recebido:', { debug: cliente });
      Logger.debug('   - ID:', { debug: cliente.id });
      Logger.debug('   - Nome:', { debug: cliente.nome });
      
      const dadosPedido = {
        total: 0,
        numero_pedido: `Pedido ${Date.now()}`,
        status: 'aberto',
        
        // 🔧 CORRIGIDO: Garantir que usa os dados corretos
        ...(cliente.id 
          ? { 
              cliente_id: parseInt(cliente.id), 
              cliente_nome: cliente.nome 
            }
          : { 
              cliente_id: null,
              cliente_nome: cliente.nome || 'Balcão' 
            }
        ),
        
        // Sem itens ainda
        itens: []
      };

      Logger.debug('Enviando para API:', { debug: dadosPedido });

      const resultado = await pedidoService.criar(dadosPedido);

      if (resultado?.success) {
        Logger.debug('Pedido criado:', { debug: resultado.data });
        
        // 🔧 IMPORTANTE: Armazenar os dados do cliente no pedidoAtual
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

  /**
   * SALVAR AUTOMATICAMENTE
   * Atualiza o pedido com os itens atuais do carrinho
   */
  const salvarAutomaticamente = async () => {
    if (!pedidoAtual?.id) return;
    
    try {
      setSalvandoAutomaticamente(true);
      Logger.info('Salvando automaticamente...', {info: { pedidoId: pedidoAtual.id, clienteId: clienteCadastrado?.id, clienteNome: clientePedido } });
      
      const totais = calcularTotais();
      
      // 🔧 CORRIGIDO: Usar dados do pedidoAtual que já tem o cliente correto
      const dadosAtualizacao = {
        id: pedidoAtual.id,
        total: totais.totalPagar,
        status: 'aberto',
        
        // 🔧 IMPORTANTE: Usar os dados do pedidoAtual (que foi criado com cliente correto)
        // Só sobrescrever se mudou manualmente
        cliente_id: clienteCadastrado?.id || pedidoAtual.cliente_id || null,
        cliente_nome: clientePedido || pedidoAtual.cliente_nome || 'Balcão',
        
        // Itens
        itens: carrinho.map(item => ({
          produto_id: parseInt(item.produto_id),
          quantidade: parseFloat(item.quantidade),
          preco_unitario: parseFloat(item.preco_unitario),
          preco_produto: parseFloat(item.preco_produto),
          adicionais: item?.adicionais || [],
          observacoes: item?.observacoes || ''
        }))
      };

      Logger.info('Auto-save - Cliente ID:', { info: dadosAtualizacao.cliente_id });
      Logger.info('Auto-save - Cliente Nome:', { info: dadosAtualizacao.cliente_nome });
      Logger.info('Auto-save - Valor item:', { info: dadosAtualizacao.preco_produto });

      const resultado = await pedidoService.atualizar(dadosAtualizacao);

      if (resultado?.success) {
        Logger.info('Salvo automaticamente', { info: { pedidoId: pedidoAtual.id, clienteId: dadosAtualizacao.cliente_id, clienteNome: dadosAtualizacao.cliente_nome } });
        setUltimoSalvamento(new Date());
      }
      
    } catch (error) {
      Logger.error('Erro no auto-save:', { erro: error });
    } finally {
      setSalvandoAutomaticamente(false);
    }
  };

  /**
   * Processa pagamento do pedido
   */
  // MODIFICAR: processarPagamento (incluir dados de entrega)
  // Dentro da função processarPagamento, onde monta dadosPedido, adicionar:
  const processarPagamento = async (dadosPagamento) => {
    try {
      const totais = calcularTotais();
      const dados_pagamento = {
        id_venda: pedidoAtual.numero_pedido,
        valorPago: dadosPagamento.valorPago,
        valorTroco: dadosPagamento.valorTroco,
        formaPagamento: dadosPagamento.formaPagamento
      };

      // Calcular total final (com taxa de entrega se houver)
      const totalFinal = totais.totalPagar + (dadosEntrega?.taxa_entrega || 0);
      
      const dadosPedido = {
        id: pedidoAtual.id,
        id_venda: pedidoAtual.numero_pedido,
        total: totalFinal, // Total com taxa de entrega
        status: 'finalizado',
        forma_pagamento: dadosPagamento.formaPagamento,
        
        cliente_id: pedidoAtual.cliente_id || clienteCadastrado?.id || null,
        cliente_nome: pedidoAtual.cliente_nome || clientePedido || 'Balcão',
        
        // DADOS DE ENTREGA (se houver)
        tipo_pedido: dadosEntrega?.tipo_pedido || 'balcao',
        endereco_entrega: dadosEntrega?.endereco_entrega || null,
        taxa_entrega: dadosEntrega?.taxa_entrega || 0,
        zona_entrega_id: dadosEntrega?.zona_entrega_id || null,
        
        itens: carrinho.map(item => ({
          produto_id: item.produto_id,
          produto_nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: parseFloat(item.preco),
          preco_produto: parseFloat(item.preco_produto),
          adicionais: item?.adicionais || [],
          observacoes: item?.observacoes || '' 
        })),
        
        observacoes_pagamento: dadosPagamento.observacoes,
        dados_pagamento // Incluir dados de pagamento para registro no caixa e impressão
      };

      // Salvar ou atualizar pedido
      let resultado;
      if (pedidoAtual?.id) {
        dadosPedido.id = pedidoAtual.id;
        resultado = await pedidoService.atualizar(dadosPedido);
      } else {
        resultado = await pedidoService.criar(dadosPedido);
      }

      Logger.debug('resultado.data completo:', { info: resultado.data });

      if (!resultado?.success) {
        throw new Error(resultado?.message || 'Erro ao processar');
      }

      // Registrar no caixa (se não for a prazo)
      if (dados_pagamento.formaPagamento !== 'prazo') {
        Logger.info("Valor Venda: ", { info: resultado.valor });
        await registrarNoCaixa(resultado.data, dados_pagamento, totalFinal);
      }

      // Criar conta a receber (se for a prazo)
      if (dados_pagamento.formaPagamento === 'prazo' && clienteCadastrado?.id) {
        await criarContaReceber(resultado.data, dados_pagamento);
      }

      // Impressão automática
      await verificarImpressaoReciboAuto(resultado.data, dados_pagamento);

      mostrarMensagem('Pagamento processado com sucesso!', 'success');
      fecharModalPagamento();
      limparFormulario();
      await carregarDados();
      setView('comandas');
      
    } catch (error) {
      Logger.error('Erro no pagamento:', { erro: error });
      throw error; // Repassar erro para o modal
    }
  };

  /**
   * Registra venda no caixa
   */
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

  /**
   * Cria conta a receber para pagamento a prazo
   */
  const criarContaReceber = async (pedido, dadosPagamento) => {
    try {
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + 30);

      const dadosConta = {
        cliente_id: clienteCadastrado.id,
        descricao: `Pedido ${pedido.numero_pedido}`,
        numero_documento: pedido.numero_pedido,
        valor_original: pedido.total,
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        data_emissao: new Date().toISOString().split('T')[0],
        observacoes: dadosPagamento.observacoes,
        forma_pagamento: 'Outros'
      };

      await contasReceberService.criar(dadosConta);
    } catch (error) {
      Logger.warn('Aviso: erro ao criar conta a receber:', { erro: error });
    }
  };

  /**
   * Verifica e executa impressão automática de comanda
   */
  const verificarImpressaoAutomatica = async (pedido) => {
    const autoImprimir = configService.autoImprimirComanda();
    
    if (autoImprimir) {
      try {
        const dadosComanda = {
          numero: pedido.numero_pedido,
          cliente: clientePedido || clienteCadastrado?.nome || 'Balcão',
          mesa: pedido.mesa || '',
          itens: carrinho.map(item => ({
            quantidade: item.quantidade,
            nome: item.produto_nome,
            observacoes: item.observacoes || '',
            adicionais: item.adicionais || []
          })),
          observacoes: pedido.observacoes || '',
          data: new Date()
        };
        setDadosComanda(dadosComanda); // Armazenar dados para preview
        Logger.info('Impressão automática de comanda...', { info: dadosComanda });
        await printService.imprimirComanda(dadosComanda);
      } catch (error) {
        Logger.warn('Erro na impressão automática:', { erro: error });
      }
    }
  };

  /**
   * Verifica e executa impressão automática de recibo
   */
  const verificarImpressaoReciboAuto = async (pedido, dadosPagamento) => {
    Logger.info('Pedido enviado para impressão:', { info: pedido });
    Logger.info('Dados de pagamento para impressão:', { info: dadosPagamento });
    const autoImprimir = configService.autoImprimirRecibo();
    
    if (!autoImprimir) {
      try {
        const dadosRecibo = {
          numero: dadosPagamento.id_venda || pedido.numero_pedido,
          id: pedido.id,
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
   * Vincular Comanda a uma mesa.
   */

  const handleContaConsumoFake = () => {

  setShowComanda(true);
  Logger.info('handleContaConsumoFake EXECUTOU', { info: { showComanda: true } });
};

  const handleContaConsumo = async () => {
    if (carrinho.length === 0) {
      alert('Adicione pelo menos um item antes de imprimir!');
      return;
    }

    // SE NÃO TEM ENTREGA CONFIGURADA, ABRIR MODAL
    if (!dadosEntrega) {
      const desejaConfigurarEntrega = window.confirm(
        'Esta comanda ainda não tem entrega configurada.\n\n' +
        'Deseja configurar entrega agora?\n\n' +
        'Clique em OK para configurar ou Cancelar para imprimir sem entrega.'
      );

      if (desejaConfigurarEntrega) {
        abrirModalEntrega();
        return; // Interrompe impressão até configurar entrega
      }
    }

    try {
        const pedido = ({
        numero: pedidoAtual?.id || `Comanda-${Date.now()}`,
        cliente: clientePedido || clienteCadastrado?.nome || 'Balcão',
        telefone: clienteCadastrado?.telefone || '',
        mesa: pedidoAtual?.mesa || '',
        
        //DADOS DE ENTREGA (se houver)
        tipo_entrega: dadosEntrega?.tipo_pedido || 'Local',
        endereco_entrega: dadosEntrega?.endereco_entrega || null,
        zona_entrega: dadosEntrega?.zona_nome || null,
        taxa_entrega: dadosEntrega?.taxa_entrega || 0,
        
        
        itens: carrinho.map(item => ({
          quantidade: item.quantidade,
          nome: item.produto_nome,
          preco: item.preco_produto,
          total: item.quantidade * item.preco_produto,
          observacoes: item.observacoes || '',
          adicionais: item.adicionais || []
        })),
        observacoes: pedidoAtual.observacoes || '',
        data: new Date()
        });
      
      setDadosComanda(pedido); // Atualiza estado para preview
      
      Logger.info('Imprimindo conta da comanda:', { info: pedido });
      setShowComanda(true); // Mostrar preview antes de imprimir
      mostrarMensagem('Conta da comanda impressa com sucesso!', 'success');

    } catch (error) {
      Logger.error('Erro ao conta comanda:', { erro: error });
      mostrarMensagem(`Erro ao imprimir conta comanda: ${error.message}`, 'error');
    }
  };

    /**
   * HANDLER: Processa transferência de itens entre comandas
   */
  const handleTransferir = async (dadosTransferencia) => {
    try {
      Logger.info('Iniciando transferência:', { info: dadosTransferencia });

      // Preparar dados para o backend
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

      Logger.info('Enviando para API:', { info: payload });

      // Chamar API de transferência
      const resultado = await pedidoService.transferir(payload);

      if (resultado?.success) {
        Logger.info('Transferência concluída:', { info: resultado.data });

        mostrarMensagem(
          `${resultado.data.itensTransferidos} item(ns) transferido(s) com sucesso!`, 
          'success'
        );

        // Recarregar dados e voltar para lista
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

  /**
   * Imprime comanda de um pedido já salvo
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
  
  /**
   * MODIFICADO: Inicia novo pedido
   */
  const iniciarNovoPedido = () => {
    Logger.info('Iniciando novo pedido', { info: 'Abrindo seleção de cliente' });
    limparFormulario();
    setAguardandoCliente(true);
    abrirModalCliente();
  };

  /**
   * Carrega pedido existente para edição
   */
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
        nome: pedidoCompleto.cliente_nome
      });
    }

    // LIMPAR CARRINHO ANTES DE CARREGAR NOVOS ITENS!
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

  /**
   * MODIFICADO: Não é mais necessário - auto-save cuida disso
   */
  const finalizarPedido = async () => {
    // Apenas fecha e volta - o pedido já está salvo
    mostrarMensagem('Pedido salvo!', 'success');
    limparFormulario();
    await carregarDados();
    setView('comandas');
  };

  /**
   * Volta para lista de comandas
   */
  const voltarParaComandas = async () => {
    await carregarDados();
    // Não precisa mais perguntar - está tudo salvo automaticamente
    limparFormulario();
    setView('comandas');
  };

  /**
   * Cancela comanda atual
   */
  const cancelarComanda = async () => {
    const confirmar = window.confirm('Deseja cancelar esta comanda?');
    if (!confirmar) return;
    
    try {
      const totais = calcularTotais();
      
      // 🔧 USAR DADOS DO PEDIDO ATUAL (que já tem cliente correto)
      const dadosPedido = {
        id: pedidoAtual.id, // Usar pedido já existente
        total: totais.totalPagar,
        status: 'cancelado',
        
        // 🔧 PRIORIDADE: pedidoAtual > clienteCadastrado > clientePedido
        cliente_id: pedidoAtual.cliente_id || clienteCadastrado?.id || null,
        cliente_nome: pedidoAtual.cliente_nome || clientePedido || 'Balcão',
        
        // Itens
        itens: carrinho.map(item => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: parseFloat(item.preco_unitario),
          adicionais: item?.adicionais || [],
          observacoes: item?.observacoes || '' 
        })),
      };

      // Atualizar pedido para finalizado
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

  /**
   * Limpa formulário
   */
  const limparFormulario = () => {
    setClientePedido('');
    setClienteCadastrado(null);
    setPedidoAtual(null);
    limparCarrinho();
    setCategoriaAtiva('');
    setBusca('');
    setCodigoBusca('');
    setUltimoSalvamento(null);
    limparDadosEntrega(); // ADICIONAR ESTA LINHA
  };

  // ========================================
  // HANDLERS DO CARRINHO
  // ========================================
  
  /**
   * Abre modal de produto
   */
  const abrirModalProduto = (produto) => {
    setProdutoSelecionado(produto);
    setModalProdutoAberto(true);
  };

  /**
   * Fecha modal de produto
   */
  const fecharModalProduto = () => {
    setModalProdutoAberto(false);
    setProdutoSelecionado(null);
    Logger.info('Modal de produto fechado', { info: { itemEditando } });
    if (itemEditando !== null) {
      Logger.info('Edição cancelada', { info: { itemEditando } });
      cancelarEdicao();
    }
  };

  /**
   * Confirma adição de produto
   */
  const handleConfirmarProduto = (itemCompleto) => {
    if (itemEditando !== null) {
      Logger.info('Atualizando item no índice:', { info: itemEditando });
      atualizarItem(itemEditando, itemCompleto);
      cancelarEdicao();
      mostrarMensagem('Item atualizado!', 'success');
    } else {
      Logger.info('Adicionando novo item', { info: itemCompleto });
      adicionarItem(itemCompleto);
      mostrarMensagem('Item adicionado!', 'success');
    }
    
    fecharModalProduto();
  };

  // FUNÇÃO: Abrir modal de entrega
  const abrirModalEntrega = () => {
    setModalEntregaAberto(true);
  };

  // FUNÇÃO: Fechar modal de entrega
  const fecharModalEntrega = () => {
    setModalEntregaAberto(false);
  };

  // FUNÇÃO: Confirmar entrega
  const handleConfirmarEntrega = async (dados) => {
    Logger.info('Dados de entrega:', { info: dados });
    
    // Armazenar dados de entrega
    setDadosEntrega({
      zona_entrega_id: dados.zonaId,
      zona_nome: dados.zonaNome,
      taxa_entrega: dados.taxa,
      endereco_entrega: dados.endereco,
      tipo_pedido: dados.zonaNome !== null ? dados.zonaNome : 'local' // Definir tipo de pedido com base na presença de zona de entrega
    });

    // Se já existe pedido, atualizar com dados de entrega
    if (pedidoAtual?.id) {
      try {
        const totais = calcularTotais();
        
        const dadosAtualizacao = {
          id: pedidoAtual.id,
          tipo_pedido: 'entrega',
          endereco_entrega: dados.endereco,
          taxa_entrega: dados.taxa,
          zona_entrega_id: dados.zonaId,
          total: totais.totalPagar + dados.taxa, // Adiciona taxa ao total
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

  // FUNÇÃO: Limpar dados de entrega
  const limparDadosEntrega = () => {
    setDadosEntrega(null);
  };


  /**
   * Busca produto por código
   */
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
  
  /**
   * Muda nome do cliente
   */
  const handleClienteChange = (novoValor) => {
    setClientePedido(novoValor);
    
    if (clienteCadastrado?.nome !== novoValor.trim()) {
      setClienteCadastrado(null);
    }
  };

  /**
   * Abre modal de busca de cliente
   */
  const abrirModalCliente = () => {
    setModalClienteAberto(true);
  };

  /**
   * Fecha modal de cliente
   */
  const fecharModalCliente = () => {
    setModalClienteAberto(false);

    if (aguardandoCliente) {
      Logger.info('Seleção de cliente cancelada', { info: "Seleção Cancelada" });
      setAguardandoCliente(false);
    }
  };

  /**
   * MODIFICADO: Seleciona cliente e cria pedido automaticamente
   */
  const selecionarClienteModal = async (cliente) => {
    Logger.info('Cliente selecionado do modal:', { info: cliente });
    Logger.info('   - ID:', { info: cliente.id });
    Logger.info('   - Nome:', { info: cliente.nome });
    
    // 🔧 IMPORTANTE: Atualizar states ANTES de criar pedido
    const clienteData = cliente.id ? {
      id: cliente.id,
      nome: cliente.nome
    } : null;
    
    setClienteCadastrado(clienteData);
    setClientePedido(cliente.nome);
    
    fecharModalCliente();
  
    mostrarMensagem(`Cliente ${cliente.nome} selecionado!`, 'success');
  
    // CRIAR PEDIDO AUTOMATICAMENTE
    if (aguardandoCliente) {
      limparCarrinho(); //Garantir carrinho vazio     
      // 🔧 Passar o cliente completo para a função
      const pedidoCriado = await criarPedidoVazio(cliente);
      try {
        if (pedidoCriado) {
        Logger.info('✅ Pedido criado com sucesso', { info: { id: pedidoCriado.id, cliente_id: pedidoCriado.cliente_id, cliente_nome: pedidoCriado.cliente_nome } });
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

  /**
   * MODIFICADO: Pula cliente e cria pedido "Balcão"
   */
  const pularSelecaoCliente = async () => {
    Logger.info('Pulando seleção de cliente - criando pedido Balcão', { info: { cliente: 'Balcão' } });
    
    const clienteBalcao = {
      id: null,
      nome: 'Balcão'
    };
    
    setClientePedido('Balcão');
    setClienteCadastrado(null);
    fecharModalCliente();
    
    if (aguardandoCliente) {
      limparCarrinho(); // Garantir carrinho vazio
      
      // Criar pedido com cliente "Balcão"
      const pedidoCriado = await criarPedidoVazio(clienteBalcao);
      
      try {

        if (pedidoCriado) {
        Logger.info('Pedido Balcão criado', { info: { id: pedidoCriado.id, cliente_nome: pedidoCriado.cliente_nome } });
        
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
  
  /**
   * Abre modal de pagamento
   */
  const abrirModalPagamento = () => {
    if (carrinho.length === 0) {
      alert('Adicione pelo menos um item!');
      return;
    }

    setModalPagamentoAberto(true);
  };

  /**
   * Fecha modal de pagamento
   */
  const fecharModalPagamento = () => {
    setModalPagamentoAberto(false);
  };

  // Handler de impressão
  const handleImprimirComanda = async () => {
  
    if (carrinho.length === 0) {
      alert('Adicione pelo menos um item antes de imprimir!');
      return;
    }

    //SE NÃO TEM ENTREGA CONFIGURADA, ABRIR MODAL
    if (!dadosEntrega) {
      const desejaConfigurarEntrega = window.confirm(
        'Esta comanda ainda não tem entrega configurada.\n\n' +
        'Deseja configurar entrega agora?\n\n' +
        'Clique em OK para configurar ou Cancelar para imprimir sem entrega.'
      );

      if (desejaConfigurarEntrega) {
        abrirModalEntrega();
        return; // Interrompe impressão até configurar entrega
      }
    }

    try {
  // Monta os dados da comanda igual você faz no preview
  const dadosComandaAtual = {
    numero: pedidoAtual?.id || `Comanda-${Date.now()}`,
    cliente: clientePedido || 'Balcão',
    mesa: pedidoAtual?.mesa || '',
    tipo_pedido: dadosEntrega?.tipo_pedido || 'balcao',
    endereco_entrega: dadosEntrega?.endereco_entrega || null,
    taxa_entrega: dadosEntrega?.taxa_entrega || 0,
    itens: carrinho.map(item => ({
      qtd: item.quantidade,
      descricao: item.produto_nome,
      valor_unit: item.preco_unitario,
      observacao: item.observacoes || '',
      adicionais: item.adicionais || []
    })),
    observacao: pedidoAtual?.observacoes || '',
    tipo_impressao: 'producao',
  };

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

      {/*Indicador de auto-save */}
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
            onRemoverItem={removerItem}
            onAlterarQuantidade={atualizarQuantidade}
            onIncrementarQuantidade={incrementarQuantidade}    // ADICIONAR
            onDecrementarQuantidade={decrementarQuantidade}    // ADICIONAR
            onVoltar={voltarParaComandas}
            onCancelar={cancelarComanda}
            onImprimir={handleImprimirComanda} // ADICIONAR HANDLER DE IMPRESSÃO
            onContaConsumo={handleContaConsumo} // ADICIONAR HANDLER DE CONTA CONSUMO
            onFinalizar={finalizarPedido}
            onPagar={abrirModalPagamento}
            //onVincular={handleVincular}
            buscarPedidos={() => pedidoService.buscarTodos('aberto')}  // ✅ ADICIONAR
            onTransferir={handleTransferir}
            dadosEntrega={dadosEntrega}              // ADICIONAR
            onAbrirEntrega={abrirModalEntrega}       // ADICIONAR
            onLimparEntrega={limparDadosEntrega}     // ADICIONAR
          />
        )}
      </div>



      {/* Modais */}

      <div>
      {showComanda && (
          <ComandaPreview
            pedido = {dadosComanda}
                    onPrint={ (pedido) => {
                      Logger.info('Comanda impressa:', { info: { numero: pedido.numero } });
                      // Aqui você pode salvar no banco, atualizar status, etc.
                      mostrarMensagem('Comanda impressa com sucesso!', 'success');
                    }}
                    onClose={() => setShowComanda(false)}
                    config={{
                        nome_empresa: 'SORVETES GELATTO MANNIA',
                        endereco: 'Rua Guarani 191, Corumbataí do Sul - PR',
                        telefone: '(44) 9.9826-4006',
                    }}
                />
        )}
        </div>

      <ModalProduto
        isOpen={modalProdutoAberto}
        onClose={fecharModalProduto}
        produto={produtoSelecionado}
        onConfirmar={handleConfirmarProduto}
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
        totalPedido={calcularTotais().totalPagar + (dadosEntrega?.taxa_entrega || 0)} // Incluir taxa de entrega no total
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

      {/* MODAL DE ENTREGA - ADICIONAR AQUI */}
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