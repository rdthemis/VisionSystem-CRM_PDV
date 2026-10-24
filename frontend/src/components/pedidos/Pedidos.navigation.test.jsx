import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Pedidos from './Pedidos';
import pedidoService from '../../services/pedidosService';
jest.mock('../../services/pedidosService', () => ({__esModule:true, default:{buscarTodos:jest.fn(), buscarPorId:jest.fn(), atualizar:jest.fn()}}));
jest.mock('../../services/produtosService', () => ({__esModule:true, default:{buscarTodos:jest.fn().mockResolvedValue([])}}));
jest.mock('../../services/clientesService', () => ({}));
jest.mock('../../services/caixaService', () => ({}));
jest.mock('../../services/printService', () => ({}));
jest.mock('../../services/ConfigService', () => ({}));
jest.mock('../../services/zonasEntregaService', () => ({}));
jest.mock('../../utils/Logger', () => ({info:jest.fn(),debug:jest.fn(),error:jest.fn(),warn:jest.fn()}));
jest.mock('./ModalProduto', () => () => null);
jest.mock('./components/ModalPagamento', () => () => null);
jest.mock('./components/ModalCliente', () => () => null);
jest.mock('./components/ModalEntrega', () => () => null);
jest.mock('../ComandaPreview', () => () => null);
jest.mock('./components/ListaPedidos', () => ({onEditar}) => <button onClick={() => onEditar({id:1})}>Abrir teste</button>);
jest.mock('./components/FormularioPedido', () => ({onVoltar}) => <button onClick={onVoltar}>Voltar teste</button>);
jest.mock('../../hooks/useCarrinho', () => {
 const valor={carrinho:[], limparCarrinho:jest.fn(), carregarDePedido:jest.fn(), getItemEditando:()=>null, calcularTotais:()=>({totalPagar:0}), itemEditando:null};
 return {__esModule:true,default:()=>valor};
});
beforeEach(() => {
 pedidoService.buscarTodos.mockResolvedValue([{id:1}]);
 pedidoService.buscarPorId.mockResolvedValue({id:1,cliente_nome:'Ana',status:'aberto',itens:[]});
 pedidoService.atualizar.mockReset();
});
test('mantém a comanda aberta se o salvamento ao voltar falhar', async () => {
 pedidoService.atualizar.mockResolvedValue({success:false});
 render(<Pedidos />);
 fireEvent.click(await screen.findByText('Abrir teste'));
 fireEvent.click(await screen.findByText('Voltar teste'));
 await screen.findByText(/Não foi possível salvar/);
 expect(screen.getByText('Voltar teste')).toBeInTheDocument();
 expect(pedidoService.atualizar).toHaveBeenCalledWith(expect.objectContaining({id:1,cliente_nome:'Ana'}));
});
test('só retorna à lista após salvar com sucesso', async () => {
 pedidoService.atualizar.mockResolvedValue({success:true});
 render(<Pedidos />);
 fireEvent.click(await screen.findByText('Abrir teste'));
 fireEvent.click(await screen.findByText('Voltar teste'));
 await screen.findByText('Abrir teste');
 expect(pedidoService.atualizar).toHaveBeenCalledTimes(1);
});
test('retorna de comanda parcial sem alterar seu pagamento ou status', async () => {
 pedidoService.buscarPorId.mockResolvedValue({id:1,cliente_nome:'Ana',status:'parcial',valor_pago:10,itens:[]});
 render(<Pedidos />);
 fireEvent.click(await screen.findByText('Abrir teste'));
 fireEvent.click(await screen.findByText('Voltar teste'));
 await waitFor(() => expect(screen.getByText('Abrir teste')).toBeInTheDocument());
 expect(pedidoService.atualizar).not.toHaveBeenCalled();
});
