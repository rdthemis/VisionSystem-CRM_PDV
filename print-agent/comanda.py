"""
comanda.py — monta o buffer ESC/POS da comanda, no mesmo layout que o
backend/ComandaBuilder.php e backend/BematechPrinter.php já usavam quando
o backend rodava localmente na loja.

Isso é uma reimplementação em Python (não importa PHP nenhum) porque o
agente roda sozinho no PC da loja, sem depender do backend na nuvem para
nada além de buscar os pedidos pendentes em /impressao/pendentes.

Compatível com: Bematech MP-4200 TH, MP-100S TH, MP-2800 TH, MP-2500 TH e
similares (comandos ESC/POS padrão).
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


# ── Comandos ESC/POS (idênticos aos de BematechPrinter.php) ────────────
ESC = "\x1B"
GS = "\x1D"
LF = "\x0A"

INIT = ESC + "@"

ALIGN_LEFT = ESC + "\x61\x00"
ALIGN_CENTER = ESC + "\x61\x01"
ALIGN_RIGHT = ESC + "\x61\x02"

BOLD_ON = ESC + "\x45\x01"
BOLD_OFF = ESC + "\x45\x00"
NORMAL = ESC + "\x21\x00"
# Negrito + altura dupla num único comando (ver nota em BematechPrinter.php:
# dois comandos separados fazia o negrito "vazar" pro texto seguinte).
BOLD_DOUBLE_H_ON = ESC + "\x21\x18"

UNDERLINE_ON = ESC + "\x2D\x01"
UNDERLINE_OFF = ESC + "\x2D\x00"
INVERT_ON = GS + "\x42\x01"
INVERT_OFF = GS + "\x42\x00"

LINE_SPACING_TIGHT = ESC + "\x33\x10"
LINE_SPACING_DEFAULT = ESC + "\x32"

CUT_PARTIAL = GS + "\x56\x01"
CUT_FULL = GS + "\x56\x00"

BEEP = ESC + "\x28\x41\x04\x00\x01\x64\x03\x0A"

# Codepage padrão da Bematech (mesmo valor usado no PHP: mb_convert_encoding(..., 'CP850'))
CODEPAGE = "cp850"


def _encode(text: str) -> bytes:
    """Codifica para CP850; caracteres sem equivalente viram '?' em vez de quebrar a impressão."""
    return text.encode(CODEPAGE, errors="replace")


class ComandaPrinterBuffer:
    """Monta o buffer de bytes ESC/POS. Equivalente a BematechPrinter.php."""

    def __init__(self, columns: int = 41):
        self.columns = columns
        self.buffer = bytearray()
        self._align = ALIGN_LEFT

    # -- formatação ------------------------------------------------------
    def raw(self, cmd: str) -> "ComandaPrinterBuffer":
        self.buffer += cmd.encode("latin-1")
        return self

    def initialize(self):
        return self.raw(INIT)

    def feed(self, lines: int = 1):
        self.buffer += (LF * lines).encode("latin-1")
        return self

    def align_left(self):
        self._align = ALIGN_LEFT
        return self.raw(ALIGN_LEFT)

    def align_center(self):
        self._align = ALIGN_CENTER
        return self.raw(ALIGN_CENTER)

    def bold(self, on: bool = True):
        return self.raw(BOLD_ON if on else BOLD_OFF)

    def bold_double_height(self):
        return self.raw(BOLD_DOUBLE_H_ON)

    def normal(self):
        return self.raw(NORMAL)

    def tight_spacing(self):
        return self.raw(LINE_SPACING_TIGHT)

    def default_spacing(self):
        return self.raw(LINE_SPACING_DEFAULT)

    def cut(self, partial: bool = True):
        self.feed(2)
        return self.raw(CUT_PARTIAL if partial else CUT_FULL)

    # -- conteúdo ---------------------------------------------------------
    def text(self, value: str):
        self.buffer += _encode(value)
        return self

    def line(self, value: str = ""):
        self.buffer += _encode(value)
        self.buffer += LF.encode("latin-1")
        self.buffer += self._align.encode("latin-1")
        return self

    def separator(self, char: str = "-"):
        return self.line(char * self.columns)

    def double_separator(self):
        return self.separator("=")

    def two_columns(self, left: str, right: str, fill: str = " "):
        space = self.columns - len(left) - len(right)
        if space < 1:
            self.line(left)
            self.line(right)
        else:
            self.line(left + (fill * space) + right)
        return self

    def three_columns(self, col1: str, col2: str, col3: str):
        col1_w, col3_w = 5, 10
        col2_w = self.columns - col1_w - col3_w
        col1p = col1.ljust(col1_w)
        col2p = (col2[:col2_w]) if len(col2) > col2_w else col2.ljust(col2_w)
        col3p = col3.rjust(col3_w)
        return self.line(col1p + col2p + col3p)

    def get_bytes(self) -> bytes:
        return bytes(self.buffer)


@dataclass
class EmpresaConfig:
    nome: str = "SORVETES GELATTO MANNIA"
    endereco: str = "Rua Guarani, 191 - Corumbataí do Sul - PR"
    telefone: str = "(44) 9.9826-4006"
    colunas: int = 41


def formatar_valor(v: float) -> str:
    # R$ 1.234,56 (separador de milhar '.', decimal ',')
    s = f"{v:,.2f}"
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"R$ {s}"


def montar_comanda(pedido: dict, empresa: EmpresaConfig) -> bytes:
    """
    Monta a comanda de PRODUÇÃO (sem valores, pro pessoal da cozinha/montagem)
    a partir do payload devolvido por GET /impressao/pendentes
    (ver backend/controllers/ImpressaoController.php::montarPedido()).
    """
    p = ComandaPrinterBuffer(columns=empresa.colunas)
    p.initialize()

    # Cabeçalho
    p.align_center()
    p.bold(True)
    p.line(empresa.nome)
    p.bold(False)
    p.normal()
    if empresa.endereco:
        p.line(empresa.endereco)
    if empresa.telefone:
        p.line(f"Fone: {empresa.telefone}")
    p.double_separator()

    p.bold(True)
    numero = pedido.get("numero") or "---"
    origem = pedido.get("origem_pedido") or "cardapio_digital"
    p.line(f"COMANDA {numero}")
    p.line(f"Origem: {origem}")
    p.bold(False)
    p.normal()

    data_hora = pedido.get("data") or datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    p.line(f"Data/Hora: {data_hora}")
    p.line()
    p.align_left()

    # Tipo de pedido / endereço
    tipo = (pedido.get("tipo_pedido") or "entrega").lower()
    p.feed(1)
    p.align_center()
    if tipo in ("local", "mesa"):
        p.bold(True)
        p.line("*** CONSUMO LOCAL ***")
        p.bold(False)
    elif tipo in ("drive_thru", "retirada", "balcao"):
        p.bold(True)
        p.line("*** RETIRADA ***")
        p.bold(False)
    else:
        p.line(f"Tipo Pedido: {tipo.upper()}")
        p.line(f"Endereço: {pedido.get('endereco') or '---'}")
    p.align_left()

    # Cliente
    p.separator()
    cliente = pedido.get("cliente")
    if cliente:
        p.align_center()
        p.bold(True)
        p.line(f"Cliente: {cliente}")
        p.bold(False)
        p.normal()
        p.align_left()
    if pedido.get("telefone"):
        p.line(f"Fone: {pedido['telefone']}")
    if tipo == "entrega" and pedido.get("endereco"):
        p.line(f"Entrega: {pedido['endereco']}")
    p.separator()

    # Itens
    itens = pedido.get("itens") or []
    p.bold(True)
    p.line("QTD     DESCRICAO")
    p.bold(False)
    p.separator()

    total_itens = len(itens)
    for i, item in enumerate(itens):
        qtd = item.get("qtd", 1)
        descricao = str(item.get("descricao", "Item")).upper()

        p.bold_double_height()
        p.line(f"{qtd} x {descricao}")
        p.bold(False)
        p.normal()

        for ad in item.get("adicionais") or []:
            desc_ad = str(ad.get("descricao", "")).upper()
            if not desc_ad:
                continue
            p.two_columns(f"      - {desc_ad}", "")

        obs = item.get("observacao")
        if obs:
            p.tight_spacing()
            p.line(f"      OBS: {obs}")
            p.default_spacing()

        if i < total_itens - 1:
            p.feed(1)

    p.separator()

    # Pagamento (sem valores — comanda de produção não mostra preço)
    pagamento = pedido.get("pagamento")
    if pagamento:
        p.feed(1)
        p.bold(True)
        p.two_columns("PAGAMENTO:", str(pagamento).upper())
        p.bold(False)
        troco_para = pedido.get("troco_para")
        if str(pagamento).lower() == "dinheiro" and troco_para:
            p.line(f"Troco para: {formatar_valor(float(troco_para))}")

    # Rodapé
    p.feed(1)
    p.align_center()
    p.line("Obrigado pela preferencia!")
    p.line(empresa.nome)
    p.feed(1)
    p.align_left()
    p.cut(partial=True)

    return p.get_bytes()
