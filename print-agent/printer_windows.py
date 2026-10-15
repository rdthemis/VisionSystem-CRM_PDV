"""
printer_windows.py — envia bytes ESC/POS crus para uma impressora instalada
no Windows (Painel de Controle > Impressoras), usando a API de spooler do
Windows (win32print) com datatype "RAW".

Isso é diferente do que o backend/BematechPrinter.php fazia (copiar um
arquivo pro caminho de compartilhamento \\\\localhost\\NomeDaImpressora).
Os dois métodos conseguem o mesmo resultado — mandar os bytes direto pra
impressora sem o Windows tentar "interpretar" como texto normal — mas a
API do spooler (win32print) é mais confiável quando quem está imprimindo
é um serviço do Windows, sem sessão de desktop interativa, que é como o
agente vai rodar aqui (via NSSM).

Requer: pywin32 (pip install pywin32)
"""

from __future__ import annotations

import win32print


class ImpressoraWindowsError(RuntimeError):
    pass


def listar_impressoras() -> list[str]:
    """Lista os nomes exatos das impressoras instaladas — útil pra descobrir
    o nome certo a colocar no config.ini (PRINTER_NAME)."""
    flags = win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
    return [p[2] for p in win32print.EnumPrinters(flags)]


def imprimir_raw(printer_name: str, dados: bytes, job_name: str = "Comanda") -> None:
    """
    Abre a impressora pelo nome exato (igual aparece em
    Painel de Controle > Dispositivos e Impressoras) e manda os bytes
    crus, sem o driver reformatar nada.
    """
    try:
        handle = win32print.OpenPrinter(printer_name)
    except Exception as e:
        raise ImpressoraWindowsError(
            f"Não foi possível abrir a impressora '{printer_name}': {e}. "
            f"Verifique o nome exato em Painel de Controle > Impressoras."
        ) from e

    try:
        job = win32print.StartDocPrinter(handle, 1, (job_name, None, "RAW"))
        try:
            win32print.StartPagePrinter(handle)
            try:
                win32print.WritePrinter(handle, dados)
            finally:
                win32print.EndPagePrinter(handle)
        finally:
            win32print.EndDocPrinter(handle)
    except Exception as e:
        raise ImpressoraWindowsError(f"Erro ao enviar dados para '{printer_name}': {e}") from e
    finally:
        win32print.ClosePrinter(handle)
