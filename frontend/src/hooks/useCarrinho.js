import { useState, useEffect } from 'react';
import Logger from '../utils/Logger';

/**
 * Hook customizado para gerenciar carrinho de pedidos
 * Centraliza toda a lógica de adição, edição, remoção e cálculos
 * 
 * @returns {Object} Métodos e estados do carrinho
 */
const useCarrinho = () => {
    // ========================================
    // ESTADOS
    // ========================================

    const [carrinho, setCarrinho] = useState([]);
    const [itemEditando, setItemEditando] = useState(null);

    // ========================================
    // PERSISTÊNCIA NO LOCALSTORAGE
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
                Logger.info('Carrinho carregado do localStorage', { info: dadosCarrinho.length });
            } catch (error) {
                Logger.error('Erro ao carregar carrinho:', { erro: error });
            }
        }
    }, []);

    /**
     * Salva carrinho sempre que ele muda
     */
    useEffect(() => {
        if (carrinho?.length > 0) {
            localStorage.setItem('carrinho_temp', JSON.stringify(carrinho));
            Logger.info('Carrinho salvo no localStorage', { info: carrinho.length });
        } else {
            localStorage.removeItem('carrinho_temp');
        }
    }, [carrinho]);

    // ========================================
    // FUNÇÕES DO CARRINHO
    // ========================================

    /**
     * Adiciona um novo item ao carrinho
     * Se item já existe com mesmos adicionais, incrementa quantidade
     * 
     * @param {Object} item - Item a ser adicionado
     */
    const adicionarItem = (item) => {
        Logger.info('Adicionando item ao carrinho', {info: item });

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

        Logger.info('Quantidade do item existente incrementada', { info: itemExistente });
        } else {
            // 🔧 ADICIONA NOVO ITEM COM ID ÚNICO
            const novoItem = {
                ...item,
                _id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // ID único
            };

            setCarrinho(prev => [...prev, novoItem]);
            Logger.info('Novo item adicionado ao carrinho', { info: novoItem });
        }
    };

    /**
     * Atualiza um item específico do carrinho por índice
     * 
     * @param {number} index - Índice do item no array
     * @param {Object} itemAtualizado - Dados atualizados do item
     */
    const atualizarItem = (index, itemAtualizado) => {
        Logger.info(`Atualizando item no índice ${index}`, { info: itemAtualizado });
        Logger.info('Dados novos:', { info: itemAtualizado });
        Logger.info('Adicionais novos:', { info: itemAtualizado.adicionais });

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

            Logger.info('Carrinho após atualização:', { info: novoCarrinho });
            Logger.info('Item atualizado:', { info: novoCarrinho[index] });

            return novoCarrinho;
        });

        setItemEditando(null);
        Logger.info('Item atualizado com sucesso', { info: itemAtualizado });
    };

    /**
     * Remove um item do carrinho por índice
     * 
     * @param {number} index - Índice do item a ser removido
     */
    const removerItem = (index) => {
        Logger.info(`Removendo item no índice ${index}`, { info: carrinho[index] });

        setCarrinho(prev => prev.filter((_, i) => i !== index));

        Logger.info('Item removido do carrinho', { info: carrinho[index] });
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
 * Incrementa a quantidade de um item em 1
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
     * Decrementa a quantidade de um item em 1
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
        Logger.info('Limpando carrinho...', { info: carrinho.length });
        setCarrinho([]);
        setItemEditando(null);
        localStorage.removeItem('carrinho_temp');
        Logger.info('Carrinho limpo', { info: carrinho.length });
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
    // CÁLCULOS
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
    // CARREGAR CARRINHO DE PEDIDO EXISTENTE
    // ========================================

    /**
     * Carrega itens de um pedido existente no carrinho
     * Usado ao editar pedidos
     * 
     * @param {Array} itens - Array de itens do pedido
     */
    const carregarDePedido = (itens) => {
        Logger.info('Carregando itens de pedido existente...', { info: itens.length });
        Logger.info('Itens recebidos:', { info: itens });

        if (!Array.isArray(itens) || itens.length === 0) {
            Logger.warn('Nenhum item para carregar', { info: itens });
            return;
        }

        // Formatar itens para o padrão do carrinho
        const itensFormatados = itens.map((item, index) => {
            Logger.info(`Item ${index}:`, { info: item });

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

            Logger.info(`Item ${index} formatado:`, { info: itemFormatado }); // ← ADICIONAR

            return itemFormatado;
        });

        setCarrinho(itensFormatados);
        Logger.info(`${itensFormatados?.length} itens carregados no carrinho`, { info: itensFormatados.length });
    };

    // ========================================
    // RETORNO DO HOOK
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
        incrementarQuantidade,    // ADICIONAR
        decrementarQuantidade,    // ADICIONAR
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