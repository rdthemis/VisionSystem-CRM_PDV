import { useState, useEffect } from 'react';

/**
 * Hook customizado para gerenciar carrinho de pedidos
 * Centraliza toda a lógica de adição, edição, remoção e cálculos
 * 
 * @returns {Object} Métodos e estados do carrinho
 */
const useCarrinho = () => {
    // ========================================
    // 📦 ESTADOS
    // ========================================

    const [carrinho, setCarrinho] = useState([]);
    const [itemEditando, setItemEditando] = useState(null);

    // ========================================
    // 💾 PERSISTÊNCIA NO LOCALSTORAGE
    // ========================================

    /**
     * Carrega carrinho salvo quando o hook é inicializado
     */
    useEffect(() => {
        const carrinhoSalvo = localStorage.getItem('carrinho_temp');
        if (carrinhoSalvo) {
            try {
                const dadosCarrinho = JSON.parse(carrinhoSalvo);
                setCarrinho(dadosCarrinho);
                console.log('📂 Carrinho carregado do localStorage');
            } catch (error) {
                console.error('❌ Erro ao carregar carrinho:', error);
            }
        }
    }, []);

    /**
     * Salva carrinho sempre que ele muda
     */
    useEffect(() => {
        if (carrinho?.length > 0) {
            localStorage.setItem('carrinho_temp', JSON.stringify(carrinho));
            console.log('💾 Carrinho salvo no localStorage');
        } else {
            localStorage.removeItem('carrinho_temp');
        }
    }, [carrinho]);

    // ========================================
    // 🔧 FUNÇÕES DO CARRINHO
    // ========================================

    /**
     * Adiciona um novo item ao carrinho
     * Se item já existe com mesmos adicionais, incrementa quantidade
     * 
     * @param {Object} item - Item a ser adicionado
     */
    const adicionarItem = (item) => {
        console.log('➕ Adicionando item:', item);

        // Verificar se item já existe (mesmo produto e adicionais)
        const itemExistente = carrinho.find(itemCarrinho =>
            itemCarrinho.produto_id === item.produto_id &&
            JSON.stringify(itemCarrinho.adicionais) === JSON.stringify(item.adicionais) &&
            itemCarrinho.observacoes === item.observacoes
        );

        if (itemExistente) {
            // Incrementa quantidade do item existente
            setCarrinho(prev => prev.map(itemCarrinho =>
                itemCarrinho === itemExistente
                    ? {
                        ...itemCarrinho,
                        quantidade: itemCarrinho.quantidade + item.quantidade,
                        subtotal: (itemCarrinho.quantidade + item.quantidade) * itemCarrinho.preco_unitario
                    }
                    : itemCarrinho
            ));

            console.log('✅ Quantidade do item existente incrementada');
        } else {
            // 🔧 ADICIONA NOVO ITEM COM ID ÚNICO
            const novoItem = {
                ...item,
                _id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // ID único
            };

            setCarrinho(prev => [...prev, novoItem]);
            console.log('✅ Novo item adicionado ao carrinho');
        }
    };

    /**
     * Atualiza um item específico do carrinho por índice
     * 
     * @param {number} index - Índice do item no array
     * @param {Object} itemAtualizado - Dados atualizados do item
     */
    const atualizarItem = (index, itemAtualizado) => {
        console.log(`🔄 Atualizando item no índice ${index}`);
        console.log('📦 Dados novos:', itemAtualizado);
        console.log('🏷️ Adicionais novos:', itemAtualizado.adicionais);

        setCarrinho(prev => {
            const novoCarrinho = prev.map((item, i) => {
                if (i === index) {
                    // 🔧 PRESERVA O ID ÚNICO AO ATUALIZAR
                    return {
                        ...itemAtualizado,
                        _id: item._id // Mantém o mesmo ID
                    };
                }
                return item;
            });

            console.log('✅ Carrinho após atualização:', novoCarrinho);
            console.log('✅ Item atualizado:', novoCarrinho[index]);

            return novoCarrinho;
        });

        setItemEditando(null);
        console.log('✅ Item atualizado com sucesso');
    };

    /**
     * Remove um item do carrinho por índice
     * 
     * @param {number} index - Índice do item a ser removido
     */
    const removerItem = (index) => {
        console.log(`🗑️ Removendo item no índice ${index}`);

        setCarrinho(prev => prev.filter((_, i) => i !== index));

        console.log('✅ Item removido do carrinho');
    };

    /**
 * Atualiza apenas a quantidade de um item
 * Se quantidade <= 0, remove o item
 * 
 * @param {number} index - Índice do item
 * @param {number} novaQuantidade - Nova quantidade
 */
    const atualizarQuantidade = (index, novaQuantidade) => {
        // 🔧 SOLUÇÃO: Usar função callback para pegar valor atualizado
        setCarrinho(prev => {
            // Se não tem item nesse índice, retorna sem mudanças
            if (!prev[index]) return prev;

            // Se quantidade <= 0, remove o item
            if (novaQuantidade <= 0) {
                return prev.filter((_, i) => i !== index);
            }

            // Atualiza a quantidade
            return prev.map((item, i) => {
                if (i === index) {
                    return {
                        ...item,
                        quantidade: novaQuantidade,
                        subtotal: novaQuantidade * item.preco_unitario
                    };
                }
                return item;
            });
        });
    };

    /**
 * 🆕 Incrementa a quantidade de um item em 1
 * 
 * @param {number} index - Índice do item
 */
    const incrementarQuantidade = (index) => {
        setCarrinho(prev => {
            if (!prev[index]) return prev;

            const item = prev[index];
            const novaQuantidade = item.quantidade + 1;

            return prev.map((item, i) => {
                if (i === index) {
                    return {
                        ...item,
                        quantidade: novaQuantidade,
                        subtotal: novaQuantidade * item.preco_unitario
                    };
                }
                return item;
            });
        });
    };

    /**
     * 🆕 Decrementa a quantidade de um item em 1
     * Se chegar a 0, remove o item
     * 
     * @param {number} index - Índice do item
     */
    const decrementarQuantidade = (index) => {
        setCarrinho(prev => {
            if (!prev[index]) return prev;

            const item = prev[index];
            const novaQuantidade = item.quantidade - 1;

            // Se quantidade <= 0, remove o item
            if (novaQuantidade <= 0) {
                return prev.filter((_, i) => i !== index);
            }

            return prev.map((item, i) => {
                if (i === index) {
                    return {
                        ...item,
                        quantidade: novaQuantidade,
                        subtotal: novaQuantidade * item.preco_unitario
                    };
                }
                return item;
            });
        });
    };

    /**
     * Limpa todo o carrinho
     */
    const limparCarrinho = () => {
        console.log('🧹 Limpando carrinho...');
        setCarrinho([]);
        setItemEditando(null);
        localStorage.removeItem('carrinho_temp');
        console.log('✅ Carrinho limpo');
    };

    /**
     * Define qual item está sendo editado
     * 
     * @param {number|null} index - Índice do item ou null para cancelar
     */
    const iniciarEdicao = (index) => {
        setItemEditando(index);
    };

    /**
     * Cancela a edição atual
     */
    const cancelarEdicao = () => {
        setItemEditando(null);
    };

    /**
     * Obtém o item que está sendo editado
     * 
     * @returns {Object|null} Item em edição ou null
     */
    const getItemEditando = () => {
        if (itemEditando === null) return null;
        return carrinho[itemEditando] || null;
    };

    // ========================================
    // 📊 CÁLCULOS
    // ========================================

    /**
     * Calcula o total geral do carrinho
     * 
     * @returns {Object} { totalItens, totalPagar }
     */
    const calcularTotais = () => {
        const totalItens = carrinho.reduce((total, item) => {
            return total + item.subtotal;
        }, 0);

        return {
            totalItens,
            totalPagar: totalItens // Pode adicionar taxas, descontos, etc.
        };
    };

    /**
     * Conta quantos itens tem no carrinho
     * 
     * @returns {number} Quantidade total de itens
     */
    const contarItens = () => {
        return carrinho.reduce((total, item) => total + item.quantidade, 0);
    };

    /**
     * Verifica se o carrinho está vazio
     * 
     * @returns {boolean}
     */
    const estaVazio = () => {
        return carrinho.length === 0;
    };

    // ========================================
    // 🔄 CARREGAR CARRINHO DE PEDIDO EXISTENTE
    // ========================================

    /**
     * Carrega itens de um pedido existente no carrinho
     * Usado ao editar pedidos
     * 
     * @param {Array} itens - Array de itens do pedido
     */
    const carregarDePedido = (itens) => {
        console.log('📦 Carregando itens de pedido existente...');
        console.log('🔍 Itens recebidos:', JSON.stringify(itens, null, 2)); // ← ADICIONAR

        if (!Array.isArray(itens) || itens.length === 0) {
            console.warn('⚠️ Nenhum item para carregar');
            return;
        }

        // Formatar itens para o padrão do carrinho
        const itensFormatados = itens.map((item, index) => {
            console.log(`🔍 Item ${index}:`, item); // ← ADICIONAR

            const itemFormatado = {
                _id: item._id || `loaded-${Date.now()}-${index}`,
                produto_id: item.produto_id,
                produto_nome: item.produto_nome || item.nome,
                quantidade: item.quantidade,
                preco_unitario: parseFloat(item.preco_unitario),
                preco_produto: parseFloat(item.preco_produto),
                subtotal: parseFloat(item.quantidade) * parseFloat(item.preco_unitario),
                adicionais: item.adicionais || [],
                observacoes: item.observacoes || ''
            };

            console.log(`✅ Item ${index} formatado:`, itemFormatado); // ← ADICIONAR

            return itemFormatado;
        });

        setCarrinho(itensFormatados);
        console.log(`✅ ${itensFormatados?.length} itens carregados no carrinho`);
    };

    // ========================================
    // 📤 RETORNO DO HOOK
    // ========================================

    return {
        // Estados
        carrinho,
        itemEditando,

        // Métodos de manipulação
        adicionarItem,
        atualizarItem,
        removerItem,
        atualizarQuantidade,
        incrementarQuantidade,    // 🆕 ADICIONAR
        decrementarQuantidade,    // 🆕 ADICIONAR
        limparCarrinho,

        // Métodos de edição
        iniciarEdicao,
        cancelarEdicao,
        getItemEditando,

        // Cálculos
        calcularTotais,
        contarItens,
        estaVazio,

        // Utilitários
        carregarDePedido
    };
};

export default useCarrinho;