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

// CSS
import './Pedidos.css';

const Pedidos = ({ onRefresh }) => {
  
  // ========================================
  // 📦 ESTADOS PRINCIPAIS
  // ========================================
  
  const [view, setView] = useState('comandas');
  
  // Dados
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  // Estados de busca/filtro
  const [categoriaAtiva, setCategoriaAtiva] = useState('');
  const [busca, setBusca] = useState('');
  const [codigoBusca, setCodigoBusca] = useState('');
  
  // Cliente
  const [clientePedido, setClientePedido] = useState('');
  const [clienteCadastrado, setClienteCadastrado] = useState(null);
  
  // Pedido atual
  const [pedidoAtual, setPedidoAtual] = useState(null);
  
  // 🆕 CONTROLE DE AUTO-SAVE
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
    incrementarQuantidade,      // 🆕 ADICIONAR
    decrementarQuantidade,      // 🆕 ADICIONAR
    limparCarrinho,
    calcularTotais,
    iniciarEdicao,
    cancelarEdicao,
    getItemEditando,
    itemEditando,
    carregarDePedido
  } = useCarrinho();

  // ========================================
  // 🔄 EFEITOS
  // ========================================
  
  useEffect(() => {
    carregarDados();
  }, []);

  // 🆕 AUTO-SAVE: Salva automaticamente quando carrinho muda
  useEffect(() => {
    // Só salva se:
    // 1. Já existe um pedido criado
    // 2. Não está salvando no momento
    // 3. Tem pelo menos um cliente
    if (pedidoAtual?.id && !salvandoAutomaticamente && (clientePedido || clienteCadastrado)) {
      console.log('⏰ Auto-save disparado após mudança no carrinho');
      console.log('   - Pedido ID:', pedidoAtual.id);
      console.log('   - Cliente do pedido:', pedidoAtual.cliente_nome);
      console.log('   - Itens no carrinho:', carrinho.length);
      
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
        console.log('🔧 Abrindo modal para editar item:', itemEmEdicao);
        setProdutoSelecionado(produto);
        setModalProdutoAberto(true);
      }
    }
  }, [itemEditando, produtos]);

  // ========================================
  // 📡 FUNÇÕES DE API
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
      console.error('Erro ao carregar dados:', error);
      mostrarMensagem('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 🆕 CRIAR PEDIDO VAZIO (só com cliente)
   * Chamado automaticamente ao selecionar cliente
   */
  const criarPedidoVazio = async (cliente) => {
    try {
      setSalvandoAutomaticamente(true);
      
      // 🔧 LOG DETALHADO para debug
      console.log('💾 Criando pedido vazio');
      console.log('👤 Cliente recebido:', JSON.stringify(cliente));
      console.log('   - ID:', cliente.id);
      console.log('   - Nome:', cliente.nome);
      
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

      console.log('📤 Enviando para API:', JSON.stringify(dadosPedido));

      const resultado = await pedidoService.criar(dadosPedido);

      if (resultado?.success) {
        console.log('✅ Pedido criado:', resultado.data);
        
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
      console.error('❌ Erro ao criar pedido vazio:', error);
      mostrarMensagem(`Erro: ${error.message}`, 'error');
      return null;
    } finally {
      setSalvandoAutomaticamente(false);
    }
  };

  /**
   * 🆕 SALVAR AUTOMATICAMENTE
   * Atualiza o pedido com os itens atuais do carrinho
   */
  const salvarAutomaticamente = async () => {
    if (!pedidoAtual?.id) return;
    
    try {
      setSalvandoAutomaticamente(true);
      console.log('💾 Salvando automaticamente...');
      
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

      console.log('📤 Auto-save - Cliente ID:', dadosAtualizacao.cliente_id);
      console.log('📤 Auto-save - Cliente Nome:', dadosAtualizacao.cliente_nome);
      console.log('📤 Auto-save - Valor item:', dadosAtualizacao.preco_produto);

      const resultado = await pedidoService.atualizar(dadosAtualizacao);

      if (resultado?.success) {
        console.log('✅ Salvo automaticamente');
        setUltimoSalvamento(new Date());
      }
      
    } catch (error) {
      console.error('⚠️ Erro no auto-save:', error);
    } finally {
      setSalvandoAutomaticamente(false);
    }
  };

  /**
   * Processa pagamento do pedido
   */
  // 9️⃣ MODIFICAR: processarPagamento (incluir dados de entrega)
  // Dentro da função processarPagamento, onde monta dadosPedido, adicionar:
  const processarPagamento = async (dadosPagamento) => {
    try {
      const totais = calcularTotais();
      
      // Calcular total final (com taxa de entrega se houver)
      const totalFinal = totais.totalPagar + (dadosEntrega?.taxa_entrega || 0);
      
      const dadosPedido = {
        id: pedidoAtual.id,
        id_venda: pedidoAtual.numero_pedido,
        total: totalFinal, // ✅ Total com taxa de entrega
        status: 'finalizado',
        forma_pagamento: dadosPagamento.formaPagamento,
        
        cliente_id: pedidoAtual.cliente_id || clienteCadastrado?.id || null,
        cliente_nome: pedidoAtual.cliente_nome || clientePedido || 'Balcão',
        
        // 🚚 DADOS DE ENTREGA (se houver)
        tipo_pedido: dadosEntrega?.tipo_pedido || 'balcao',
        endereco_entrega: dadosEntrega?.endereco_entrega || null,
        taxa_entrega: dadosEntrega?.taxa_entrega || 0,
        zona_entrega_id: dadosEntrega?.zona_entrega_id || null,
        
        itens: carrinho.map(item => ({
          produto_id: item.produto_id,
          produto_nome: item.nome,
          quantidade: item.quantidade,
          preco_unitario: parseFloat(item.preco),
          preco_produto: parseFloat(pedidoAtual.preco_produto),
          adicionais: item?.adicionais || [],
          observacoes: item?.observacoes || '' 
        })),
        
        observacoes_pagamento: dadosPagamento.observacoes,
        dados_pagamento: dadosPagamento
      };

      // Salvar ou atualizar pedido
      let resultado;
      if (pedidoAtual?.id) {
        dadosPedido.id = pedidoAtual.id;
        resultado = await pedidoService.atualizar(dadosPedido);
      } else {
        resultado = await pedidoService.criar(dadosPedido);
      }

      if (!resultado?.success) {
        throw new Error(resultado?.message || 'Erro ao processar');
      }

      // Registrar no caixa (se não for a prazo)
      if (dadosPagamento.formaPagamento !== 'prazo') {
        console.log("Valor Venda: ", resultado.valor)
        await registrarNoCaixa(resultado.data, dadosPagamento);
      }

      // Criar conta a receber (se for a prazo)
      if (dadosPagamento.formaPagamento === 'prazo' && clienteCadastrado?.id) {
        await criarContaReceber(resultado.data, dadosPagamento);
      }

      // Impressão automática
      await verificarImpressaoReciboAuto(resultado.data, dadosPagamento);

      mostrarMensagem('Pagamento processado com sucesso!', 'success');
      fecharModalPagamento();
      limparFormulario();
      await carregarDados();
      setView('comandas');
      
    } catch (error) {
      console.error('Erro no pagamento:', error);
      throw error; // Repassar erro para o modal
    }
  };

  /**
   * Registra venda no caixa
   */
  const registrarNoCaixa = async (pedido, dadosPagamento) => {
    try {
      await caixaService.registrarVendaComCaixa({
        valor: pedido.total,
        numero_pedido: pedido.numero_pedido,
        pedido_id: pedido.id,
        forma_pagamento: dadosPagamento.formaPagamento
      });
    } catch (error) {
      console.warn('Aviso: erro ao registrar no caixa:', error);
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
      console.warn('Aviso: erro ao criar conta a receber:', error);
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
        
        console.log('🖨️ Impressão automática de comanda...');
        await printService.imprimirComanda(dadosComanda);
      } catch (error) {
        console.warn('⚠️ Erro na impressão automática:', error);
      }
    }
  };

  /**
   * Verifica e executa impressão automática de recibo
   */
  const verificarImpressaoReciboAuto = async (pedido, dadosPagamento) => {
    console.log(pedido)
    const autoImprimir = configService.autoImprimirRecibo();
    
    if (!autoImprimir) {
      try {
        const dadosRecibo = {
          numero: pedido.id_venda,
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
          total: pedido.total,
          forma_pagamento: dadosPagamento.formaPagamento,
          valor_pago: dadosPagamento.valorPago,
          troco: dadosPagamento.valorTroco,
          data: new Date()
        };
        
        console.log('🖨️ Impressão automática de recibo...', dadosRecibo);
        await printService.imprimirReciboVenda(dadosRecibo);
      } catch (error) {
        console.warn('⚠️ Erro na impressão do recibo:', error);
      }
    }
  };

  /**
   * Vincular Comanda a uma mesa.
   */
 // const handleVincular = () => {
   // alert('Modulo em desenvolvimento.');
   // return;
  //}

  /**
   * Imprime comanda atual
   * Verifica se entrega foi configurada antes de imprimir
   */
  const handleImprimir = async () => {
    if (carrinho.length === 0) {
      alert('Adicione pelo menos um item antes de imprimir!');
      return;
    }

    // 🚚 SE NÃO TEM ENTREGA CONFIGURADA, ABRIR MODAL
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
      const dadosComanda = {
        numero: pedidoAtual?.id || `Comanda-${Date.now()}`,
        cliente: clientePedido || clienteCadastrado?.nome || 'Balcão',
        mesa: pedidoAtual?.mesa || '',
        
        // 🚚 DADOS DE ENTREGA (se houver)
        tipo_pedido: dadosEntrega?.tipo_pedido || 'balcao',
        endereco_entrega: dadosEntrega?.endereco_entrega || null,
        zona_entrega: dadosEntrega?.zona_nome || null,
        taxa_entrega: dadosEntrega?.taxa_entrega || 0,
        
        itens: carrinho.map(item => ({
          quantidade: item.quantidade,
          nome: item.produto_nome,
          preco: '',
          total: item.quantidade * item.preco_unitario,
          observacoes: item.observacoes || '',
          adicionais: item.adicionais || []
        })),
        observacoes: pedidoAtual?.observacoes || '',
        data: new Date()
      };

      console.log('🖨️ Imprimindo comanda:', dadosComanda);
      await printService.imprimirComanda(dadosComanda);
      mostrarMensagem('Comanda impressa com sucesso!', 'success');

    } catch (error) {
      console.error('❌ Erro ao imprimir comanda:', error);
      mostrarMensagem(`Erro ao imprimir: ${error.message}`, 'error');
    }
  };

    /**
   * 🔄 HANDLER: Processa transferência de itens entre comandas
   */
  const handleTransferir = async (dadosTransferencia) => {
    try {
      console.log('🔄 Iniciando transferência:', dadosTransferencia);

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

      console.log('📤 Enviando para API:', payload);

      // Chamar API de transferência
      const resultado = await pedidoService.transferir(payload);

      if (resultado?.success) {
        console.log('✅ Transferência concluída:', resultado.data);
        
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
      console.error('❌ Erro na transferência:', error);
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
      console.error('❌ Erro ao imprimir:', error);
      mostrarMensagem(`Erro: ${error.message}`, 'error');
    }
  }; 
  
  /**
   * 🆕 MODIFICADO: Inicia novo pedido
   */
  const iniciarNovoPedido = () => {
    console.log('🆕 Iniciando novo pedido - abrindo seleção de cliente');
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

    // ✅ LIMPAR CARRINHO ANTES DE CARREGAR NOVOS ITENS!
    limparCarrinho();
    
    if (pedidoCompleto.itens?.length > 0) {
      carregarDePedido(pedidoCompleto.itens);
    }

    setView('novo-pedido');
    
  } catch (error) {
    console.error('Erro ao carregar pedido:', error);
    mostrarMensagem('Erro ao carregar pedido', 'error');
  } finally {
    setLoadingPedido(false);
  }
};

  /**
   * 🆕 MODIFICADO: Não é mais necessário - auto-save cuida disso
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
      console.error('Erro ao cancelar:', error);
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
    limparDadosEntrega(); // ✅ ADICIONAR ESTA LINHA
  };

  // ========================================
  // 🛒 HANDLERS DO CARRINHO
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
    
    if (itemEditando !== null) {
      console.log('❌ Edição cancelada');
      cancelarEdicao();
    }
  };

  /**
   * Confirma adição de produto
   */
  const handleConfirmarProduto = (itemCompleto) => {
    if (itemEditando !== null) {
      console.log('✏️ Atualizando item no índice:', itemEditando);
      atualizarItem(itemEditando, itemCompleto);
      cancelarEdicao();
      mostrarMensagem('Item atualizado!', 'success');
    } else {
      console.log('➕ Adicionando novo item');
      adicionarItem(itemCompleto);
      mostrarMensagem('Item adicionado!', 'success');
    }
    
    fecharModalProduto();
  };

  // 3️⃣ FUNÇÃO: Abrir modal de entrega
  const abrirModalEntrega = () => {
    setModalEntregaAberto(true);
  };

  // 4️⃣ FUNÇÃO: Fechar modal de entrega
  const fecharModalEntrega = () => {
    setModalEntregaAberto(false);
  };

  // 5️⃣ FUNÇÃO: Confirmar entrega
  const handleConfirmarEntrega = async (dados) => {
    console.log('🚚 Dados de entrega:', dados);
    
    // Armazenar dados de entrega
    setDadosEntrega({
      zona_entrega_id: dados.zonaId,
      zona_nome: dados.zonaNome,
      taxa_entrega: dados.taxa,
      endereco_entrega: dados.endereco,
      tipo_pedido: 'entrega'
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
        console.error('Erro ao configurar entrega:', error);
        mostrarMensagem('Erro ao configurar entrega', 'error');
      }
    } else {
      mostrarMensagem(
        `Entrega configurada! Taxa: R$ ${dados.taxa.toFixed(2)}`,
        'success'
      );
    }
  };

  // 6️⃣ FUNÇÃO: Limpar dados de entrega
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
  // 👤 HANDLERS DE CLIENTE
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
      console.log('❌ Seleção de cliente cancelada');
      setAguardandoCliente(false);
    }
  };

  /**
   * 🆕 MODIFICADO: Seleciona cliente e cria pedido automaticamente
   */
  const selecionarClienteModal = async (cliente) => {
    console.log('👤 Cliente selecionado do modal:', cliente);
    console.log('   - ID:', cliente.id);
    console.log('   - Nome:', cliente.nome);
    
    // 🔧 IMPORTANTE: Atualizar states ANTES de criar pedido
    const clienteData = cliente.id ? {
      id: cliente.id,
      nome: cliente.nome
    } : null;
    
    setClienteCadastrado(clienteData);
    setClientePedido(cliente.nome);
    
    fecharModalCliente();
  
    mostrarMensagem(`Cliente ${cliente.nome} selecionado!`, 'success');
  
    // 🆕 CRIAR PEDIDO AUTOMATICAMENTE
    if (aguardandoCliente) {
      limparCarrinho(); //✅ Garantir carrinho vazio     
      // 🔧 Passar o cliente completo para a função
      const pedidoCriado = await criarPedidoVazio(cliente);
      
      if (pedidoCriado) {
        console.log('✅ Pedido criado com sucesso');
        console.log('   - ID do pedido:', pedidoCriado.id);
        console.log('   - Cliente ID:', pedidoCriado.cliente_id);
        console.log('   - Cliente Nome:', pedidoCriado.cliente_nome);
        
        setAguardandoCliente(false);
        setView('novo-pedido');
        mostrarMensagem('Comanda aberta! Adicione os itens.', 'success');
      } else {
        console.error('❌ Falha ao criar pedido');
        setAguardandoCliente(false);
      }
    }
  };

  /**
   * 🆕 MODIFICADO: Pula cliente e cria pedido "Balcão"
   */
  const pularSelecaoCliente = async () => {
    console.log('⏭️ Pulando seleção de cliente - criando pedido Balcão');
    
    const clienteBalcao = {
      id: null,
      nome: 'Balcão'
    };
    
    setClientePedido('Balcão');
    setClienteCadastrado(null);
    fecharModalCliente();
    
    if (aguardandoCliente) {
      limparCarrinho(); // ✅ Garantir carrinho vazio
      
      // Criar pedido com cliente "Balcão"
      const pedidoCriado = await criarPedidoVazio(clienteBalcao);
      
      if (pedidoCriado) {
        console.log('✅ Pedido Balcão criado');
        console.log('   - ID do pedido:', pedidoCriado.id);
        console.log('   - Cliente Nome:', pedidoCriado.cliente_nome);
        
        setAguardandoCliente(false);
        setView('novo-pedido');
        mostrarMensagem('Comanda aberta para Balcão!', 'success');
      } else {
        console.error('❌ Falha ao criar pedido Balcão');
        setAguardandoCliente(false);
      }
    }
  };

  // ========================================
  // 💳 HANDLERS DE PAGAMENTO
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

  // ========================================
  // 💬 MENSAGENS
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
  // 🎨 RENDERIZAÇÃO
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

      {/* 🆕 Indicador de auto-save */}
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
            onIncrementarQuantidade={incrementarQuantidade}    // 🆕 ADICIONAR
            onDecrementarQuantidade={decrementarQuantidade}    // 🆕 ADICIONAR
            onVoltar={voltarParaComandas}
            onCancelar={cancelarComanda}
            onImprimir={handleImprimir}
            onFinalizar={finalizarPedido}
            onPagar={abrirModalPagamento}
            //onVincular={handleVincular}
            buscarPedidos={() => pedidoService.buscarTodos('aberto')}  // ✅ ADICIONAR
            onTransferir={handleTransferir}
            dadosEntrega={dadosEntrega}              // ✅ ADICIONAR
            onAbrirEntrega={abrirModalEntrega}       // ✅ ADICIONAR
            onLimparEntrega={limparDadosEntrega}     // ✅ ADICIONAR
          />
        )}
      </div>

      {/* Modais */}
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
        totalPedido={calcularTotais().totalPagar}
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

      {/* 🚚 MODAL DE ENTREGA - ADICIONAR AQUI */}
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