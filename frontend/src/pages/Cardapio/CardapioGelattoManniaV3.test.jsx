import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import Cardapio from "./CardapioGelattoManniaV3";

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(2026, 9, 19, 14));
  global.fetch = jest.fn(() => new Promise(() => {}));
  window.scrollTo = jest.fn();
});
afterEach(() => { cleanup(); jest.useRealTimers(); jest.restoreAllMocks(); });

test("opens a category, switches categories and returns to the menu", () => {
  render(<Cardapio />);
  fireEvent.click(screen.getByRole("button", { name: /Açaí.*opções/ }));
  expect(screen.getByRole("button", { name: /Açaí 300ml/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Bebidas.*opções/ }));
  expect(screen.getByRole("button", { name: /Suco natural/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Açaí 300ml/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Voltar ao cardápio/ }));
  expect(screen.getByText("Uma pausa com sabor.")).toBeInTheDocument();
  expect(screen.queryByRole("main")).not.toBeInTheDocument();
});

test("searches all categories without accents and keeps the cart while navigating", () => {
  render(<Cardapio />);
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "acai" } });
  fireEvent.click(screen.getByRole("button", { name: /Açaí 300ml/ }));
  const modal = screen.getByRole("dialog");
  fireEvent.click(within(modal).getByRole("button", { name: /Adicionar ·/ }));
  expect(screen.getByRole("button", { name: /Ver pedido/ })).toHaveTextContent("12,00");
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "inexistente" } });
  expect(screen.getByText("Nenhum produto encontrado")).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: /Limpar busca/ })[0]);
  expect(screen.getByRole("button", { name: /Ver pedido/ })).toBeInTheDocument();
});

test("allows browsing while closed and prevents sending an order", () => {
  jest.setSystemTime(new Date(2026, 9, 19, 3));
  render(<Cardapio />);
  expect(screen.getByText(/Estamos fechados/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Bebidas.*opções/ }));
  fireEvent.click(screen.getByRole("button", { name: /Suco natural/ }));
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /Adicionar ·/ }));
  fireEvent.click(screen.getByRole("button", { name: /Ver pedido/ }));
  fireEvent.click(screen.getByRole("button", { name: /Finalizar|Continuar/ }));
  expect(screen.getByRole("button", { name: "Pedidos indisponíveis no momento" })).toBeDisabled();
});

