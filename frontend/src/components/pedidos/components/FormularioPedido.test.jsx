import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FormularioPedido from './FormularioPedido';
jest.mock('./GridProdutos', () => () => <div>Catálogo de teste</div>);
jest.mock('./PainelCarrinho', () => () => <div>Resumo de teste</div>);
test('alterna painéis mantendo a comanda e total com entrega, e oferece retorno', () => {
 const onVoltar=jest.fn();
 const {container}=render(<FormularioPedido carrinho={[{quantidade:1}]} totais={{totalPagar:12}} dadosEntrega={{taxa_entrega:3}} pedidoAtual={{id:9}} clientePedido="Ana" onVoltar={onVoltar} />);
 expect(screen.getByRole('button',{name:/Ver comanda/})).toHaveTextContent('15,00');
 fireEvent.click(screen.getByRole('button',{name:/Ver comanda/}));
 expect(container.querySelector('.pdv-venda')).toHaveClass('painel-comanda');
 expect(screen.getByRole('button',{name:'Comanda (1)'})).toHaveAttribute('aria-pressed','true');
 fireEvent.click(screen.getByRole('button',{name:'Produtos'}));
 expect(container.querySelector('.pdv-venda')).toHaveClass('painel-produtos');
 expect(screen.getByText('Resumo de teste')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Comandas'}));
 expect(onVoltar).toHaveBeenCalledTimes(1);
});
