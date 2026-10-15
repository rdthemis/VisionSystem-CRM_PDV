"""
agent.py — agente de impressão local do PDV (Gelatto Mannia).

Roda no PC da loja, onde a impressora Bematech está instalada. A cada
X segundos, consulta o backend no Railway (GET /impressao/pendentes),
imprime cada comanda pendente na impressora local e confirma de volta
pro backend (POST /impressao/{id}/concluir ou /erro).

Esse modelo de "polling" (o agente busca, em vez de o backend empurrar)
existe porque o backend roda na nuvem e não tem nenhum jeito de alcançar
um PC dentro da rede da loja sem IP público — mas o PC da loja consegue
perfeitamente alcançar a internet para perguntar "tem comanda pra
imprimir?". Ver backend/controllers/ImpressaoController.php para o lado
do servidor.

Uso:
    python agent.py                      → roda o loop (uso normal / serviço)
    python agent.py --uma-vez             → processa a fila uma vez só e sai (teste)
    python agent.py --listar-impressoras  → mostra os nomes exatos das impressoras instaladas
"""

from __future__ import annotations

import argparse
import configparser
import logging
import signal
import sys
import time
from logging.handlers import RotatingFileHandler
from pathlib import Path

import requests

from comanda import EmpresaConfig, montar_comanda

PASTA_AGENTE = Path(__file__).resolve().parent

log = logging.getLogger("agente_impressao")

_parar = False


def _tratar_sinal_parada(signum, frame):
    global _parar
    log.info("Sinal de parada recebido (%s). Encerrando após o ciclo atual...", signum)
    _parar = True


def carregar_config() -> configparser.ConfigParser:
    caminho = PASTA_AGENTE / "config.ini"
    if not caminho.exists():
        print(
            f"ERRO: não encontrei {caminho}.\n"
            f"Copie config.example.ini para config.ini e ajuste os valores antes de rodar o agente."
        )
        sys.exit(1)

    cfg = configparser.ConfigParser()
    cfg.read(caminho, encoding="utf-8")
    return cfg


def configurar_log(cfg: configparser.ConfigParser) -> None:
    caminho_log = PASTA_AGENTE / cfg.get("log", "arquivo", fallback="logs/agente_impressao.log")
    caminho_log.parent.mkdir(parents=True, exist_ok=True)
    nivel = getattr(logging, cfg.get("log", "nivel", fallback="INFO").upper(), logging.INFO)

    log.setLevel(nivel)
    formato = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")

    arquivo_handler = RotatingFileHandler(caminho_log, maxBytes=2_000_000, backupCount=5, encoding="utf-8")
    arquivo_handler.setFormatter(formato)
    log.addHandler(arquivo_handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formato)
    log.addHandler(console_handler)


class ClienteApi:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip("/")
        self.sessao = requests.Session()
        self.sessao.headers.update({"X-Agent-Token": token})

    def buscar_pendentes(self) -> list[dict]:
        resp = self.sessao.get(f"{self.base_url}/impressao/pendentes", timeout=15)
        resp.raise_for_status()
        dados = resp.json()
        if not dados.get("success"):
            raise RuntimeError(dados.get("message", "resposta sem success=true"))
        return dados.get("pedidos", [])

    def confirmar(self, pedido_id: int) -> None:
        resp = self.sessao.post(f"{self.base_url}/impressao/{pedido_id}/concluir", timeout=15)
        resp.raise_for_status()

    def reportar_erro(self, pedido_id: int, mensagem: str) -> None:
        resp = self.sessao.post(
            f"{self.base_url}/impressao/{pedido_id}/erro",
            json={"mensagem": mensagem[:255]},
            timeout=15,
        )
        resp.raise_for_status()


def processar_um_ciclo(api: ClienteApi, empresa: EmpresaConfig, printer_name: str) -> int:
    """Busca os pendentes, imprime cada um, confirma/reporta erro. Retorna quantos pedidos processou."""
    # Import local: só falha aqui (e só em quem realmente for imprimir) se
    # pywin32 não estiver instalado — assim --listar-impressoras/testes
    # continuam dando uma mensagem clara em vez de travar no import do módulo.
    from printer_windows import ImpressoraWindowsError, imprimir_raw

    pedidos = api.buscar_pendentes()
    if not pedidos:
        return 0

    log.info("Encontrei %d pedido(s) pendente(s) de impressão.", len(pedidos))

    for pedido in pedidos:
        pedido_id = pedido["id"]
        numero = pedido.get("numero", pedido_id)
        try:
            dados = montar_comanda(pedido, empresa)
            imprimir_raw(printer_name, dados, job_name=f"Comanda {numero}")
            api.confirmar(pedido_id)
            log.info("Pedido %s (id=%s) impresso e confirmado.", numero, pedido_id)
        except ImpressoraWindowsError as e:
            log.error("Falha ao imprimir pedido %s (id=%s): %s", numero, pedido_id, e)
            _tentar_reportar_erro(api, pedido_id, str(e))
        except Exception as e:  # nunca deixa um pedido com problema derrubar o agente
            log.exception("Erro inesperado processando pedido %s (id=%s)", numero, pedido_id)
            _tentar_reportar_erro(api, pedido_id, str(e))

    return len(pedidos)


def _tentar_reportar_erro(api: ClienteApi, pedido_id: int, mensagem: str) -> None:
    try:
        api.reportar_erro(pedido_id, mensagem)
    except Exception:
        log.exception("Além de falhar a impressão do pedido %s, falhei ao reportar o erro pro backend", pedido_id)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--uma-vez", action="store_true", help="processa a fila uma vez e sai (teste)")
    parser.add_argument("--listar-impressoras", action="store_true", help="lista impressoras instaladas e sai")
    args = parser.parse_args()

    if args.listar_impressoras:
        from printer_windows import listar_impressoras

        print("Impressoras instaladas neste PC:")
        for nome in listar_impressoras():
            print(f"  - {nome}")
        return

    cfg = carregar_config()
    configurar_log(cfg)

    base_url = cfg.get("api", "base_url")
    token = cfg.get("api", "agent_token")
    intervalo = cfg.getint("api", "poll_interval_segundos", fallback=10)
    printer_name = cfg.get("impressora", "nome")
    empresa = EmpresaConfig(
        nome=cfg.get("empresa", "nome"),
        endereco=cfg.get("empresa", "endereco"),
        telefone=cfg.get("empresa", "telefone"),
        colunas=cfg.getint("impressora", "colunas", fallback=41),
    )

    if "COLOQUE_AQUI" in token:
        log.error("Edite config.ini: agent_token ainda está com o valor de exemplo.")
        sys.exit(1)

    api = ClienteApi(base_url, token)

    log.info("Agente de impressão iniciado. API=%s impressora=%r intervalo=%ss", base_url, printer_name, intervalo)

    signal.signal(signal.SIGINT, _tratar_sinal_parada)
    try:
        signal.signal(signal.SIGTERM, _tratar_sinal_parada)
    except (AttributeError, ValueError):
        pass  # SIGTERM pode não existir/ser tratável em todo ambiente Windows

    if args.uma_vez:
        processar_um_ciclo(api, empresa, printer_name)
        return

    while not _parar:
        try:
            processar_um_ciclo(api, empresa, printer_name)
        except requests.RequestException as e:
            log.warning("Falha ao falar com o backend (tentarei de novo no próximo ciclo): %s", e)
        except Exception:
            log.exception("Erro inesperado no ciclo do agente (continuando)")

        for _ in range(intervalo):
            if _parar:
                break
            time.sleep(1)

    log.info("Agente de impressão encerrado.")


if __name__ == "__main__":
    main()
