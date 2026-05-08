/**
 * usePrintComanda - Hook para comunicação com a API de impressão
 * 
 * Gerencia o envio do pedido para impressão e feedback de status.
 * 
 * @example
 * const { imprimir, imprimindo, erro, sucesso } = usePrintComanda();
 * 
 * const handlePrint = async () => {
 *   await imprimir(dadosPedido);
 * };
 */

import { useState, useCallback } from 'react';

// Ajuste a URL base conforme seu ambiente
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost/api';

/**
 * @typedef {Object} ItemAdicional
 * @property {string} descricao
 * @property {number} valor
 */

/**
 * @typedef {Object} ItemPedido
 * @property {number} qtd
 * @property {string} descricao
 * @property {number} valor_unit
 * @property {ItemAdicional[]} [adicionais]
 * @property {string} [observacao]
 */

/**
 * @typedef {Object} DadosPedido
 * @property {number} numero
 * @property {number|null} [mesa]
 * @property {'delivery'|'drive_thru'|'local'|'mesa'} tipo
 * @property {string} cliente
 * @property {string} [telefone]
 * @property {string} [endereco]
 * @property {ItemPedido[]} itens
 * @property {number} [valor_entrega]
 * @property {number} [desconto]
 * @property {string} pagamento
 * @property {number|null} [troco_para]
 * @property {string} [observacao]
 * @property {number} [copias]
 */

export function usePrintComanda() {
    const [imprimindo, setImprimindo] = useState(false);
    const [erro, setErro]             = useState(null);
    const [sucesso, setSucesso]       = useState(false);

    /**
     * Envia o pedido para a impressora térmica
     * @param {DadosPedido} pedido 
     * @returns {Promise<{success: boolean, message: string}>}
     */
    const imprimir = useCallback(async (pedido) => {
        setImprimindo(true);
        setErro(null);
        setSucesso(false);

        try {
            const response = await fetch(`${API_BASE_URL}/print_comanda.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pedido),
            });

            const data = await response.json();

            if (data.success) {
                setSucesso(true);
                // Reseta o sucesso depois de 3s
                setTimeout(() => setSucesso(false), 3000);
            } else {
                setErro(data.message || 'Erro ao imprimir comanda');
            }

            return data;

        } catch (err) {
            const message = err.message === 'Failed to fetch'
                ? 'Não foi possível conectar ao servidor de impressão. Verifique se o servidor está rodando.'
                : `Erro de conexão: ${err.message}`;
            
            setErro(message);
            return { success: false, message };

        } finally {
            setImprimindo(false);
        }
    }, []);

    /**
     * Limpa estados de erro/sucesso
     */
    const limpar = useCallback(() => {
        setErro(null);
        setSucesso(false);
    }, []);

    return {
        imprimir,
        imprimindo,
        erro,
        sucesso,
        limpar,
    };
}

export default usePrintComanda;
