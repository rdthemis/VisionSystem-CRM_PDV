// ExemploUsoAdicionais.jsx
// Exemplo de como usar o componente AdicionaisGrid no seu sistema PDV

import React, { useState, useEffect } from 'react';
import AdicionaisGrid from './AdicionaisGrid';

const ExemploModalProduto = () => {
    // Estado dos adicionais disponíveis (virá do backend)
    const [adicionaisDisponiveis, setAdicionaisDisponiveis] = useState([]);
    
    // Estado dos adicionais selecionados
    const [adicionaisSelecionados, setAdicionaisSelecionados] = useState([]);
    
    // Estado das observações
    const [observacoes, setObservacoes] = useState('');

    // Carregar adicionais do backend
    useEffect(() => {
        carregarAdicionais();
    }, []);

    const carregarAdicionais = async () => {
        try {
            const response = await fetch('http://localhost/seu-backend/api/adicionais.php');
            const data = await response.json();
            
            if (data.success) {
                setAdicionaisDisponiveis(data.adicionais);
            }
        } catch (error) {
            console.error('Erro ao carregar adicionais:', error);
        }
    };

    // Handler para quando os adicionais mudarem
    const handleAdicionaisChange = (novosAdicionais) => {
        setAdicionaisSelecionados(novosAdicionais);
        console.log('Adicionais selecionados:', novosAdicionais);
    };

    // Handler para quando as observações mudarem
    const handleObservacoesChange = (novasObservacoes) => {
        setObservacoes(novasObservacoes);
        console.log('Observações:', novasObservacoes);
    };

    // Calcular total dos adicionais
    const calcularTotalAdicionais = () => {
        return adicionaisSelecionados.reduce(
            (total, item) => total + (item.preco * item.quantidade),
            0
        );
    };

    // Função para adicionar produto ao pedido
    const adicionarAoPedido = () => {
        const item = {
            produto_id: 123, // ID do produto selecionado
            quantidade: 1,
            adicionais: adicionaisSelecionados,
            observacoes: observacoes,
            total_adicionais: calcularTotalAdicionais()
        };

        console.log('Item para adicionar ao pedido:', item);
        
        // Aqui você faria a chamada para adicionar ao pedido
        // Ex: adicionarItemAoPedido(item);
        
        // Limpar após adicionar
        setAdicionaisSelecionados([]);
        setObservacoes('');
    };

    return (
        <div className="modal-produto">
            <div className="modal-header">
                <h2>Adicionar Produto</h2>
            </div>

            <div className="modal-body">
                {/* Informações do Produto */}
                <div className="produto-info">
                    <h3>Pastel de Chocolate</h3>
                    <p className="produto-preco">R$ 13,00</p>
                </div>

                {/* Componente de Adicionais */}
                <AdicionaisGrid
                    adicionaisDisponiveis={adicionaisDisponiveis}
                    adicionaisSelecionados={adicionaisSelecionados}
                    onAdicionaisChange={handleAdicionaisChange}
                    observacoes={observacoes}
                    onObservacoesChange={handleObservacoesChange}
                />
            </div>

            <div className="modal-footer">
                <button className="btn-cancelar" onClick={() => console.log('Cancelar')}>
                    Cancelar
                </button>
                <button className="btn-adicionar" onClick={adicionarAoPedido}>
                    Adicionar ao Pedido
                </button>
            </div>
        </div>
    );
};

// ===== EXEMPLO 2: Uso no Sistema PDV =====
const ExemploSistemaPDV = () => {
    const [pedidoAtual, setPedidoAtual] = useState([]);
    
    const adicionarItemComAdicionais = (produto, adicionais, observacoes) => {
        const novoItem = {
            id: Date.now(),
            produto: produto,
            adicionais: adicionais,
            observacoes: observacoes,
            subtotal: produto.preco,
            total_adicionais: adicionais.reduce(
                (sum, ad) => sum + (ad.preco * ad.quantidade), 
                0
            ),
            total: produto.preco + adicionais.reduce(
                (sum, ad) => sum + (ad.preco * ad.quantidade), 
                0
            )
        };

        setPedidoAtual([...pedidoAtual, novoItem]);
    };

    return (
        <div className="sistema-pdv">
            {/* Seu sistema PDV aqui */}
        </div>
    );
};

// ===== FORMATO DOS DADOS =====
/* 
Exemplo de estrutura de dados esperada:

ADICIONAIS DISPONÍVEIS (do backend):
[
    {
        id: 1,
        nome: "Cheddar",
        preco: 3.00
    },
    {
        id: 2,
        nome: "Presunto",
        preco: 2.00
    },
    {
        id: 3,
        nome: "Queijo Mussarela",
        preco: 2.00
    }
]

ADICIONAIS SELECIONADOS (formato de saída):
[
    {
        id: 1,
        nome: "Cheddar",
        preco: 3.00,
        quantidade: 2  // Usuário selecionou 2x
    },
    {
        id: 3,
        nome: "Queijo Mussarela",
        preco: 2.00,
        quantidade: 1
    }
]

ITEM COMPLETO PARA SALVAR NO PEDIDO:
{
    produto_id: 123,
    produto_nome: "Pastel de Chocolate",
    produto_preco: 13.00,
    quantidade: 1,
    adicionais: [
        { id: 1, nome: "Cheddar", preco: 3.00, quantidade: 2 },
        { id: 3, nome: "Queijo Mussarela", preco: 2.00, quantidade: 1 }
    ],
    observacoes: "Sem cebola",
    subtotal: 13.00,
    total_adicionais: 8.00,  // (3.00 * 2) + (2.00 * 1)
    total: 21.00  // 13.00 + 8.00
}
*/

export default ExemploModalProduto;
