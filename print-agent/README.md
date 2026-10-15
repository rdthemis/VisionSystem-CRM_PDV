# Agente de Impressão Local — Gelatto Mannia PDV

Programa Python que roda no PC da loja (o mesmo que tem a impressora
Bematech instalada) e fica consultando o backend no Railway a cada poucos
segundos perguntando "tem comanda pra imprimir?". Existe porque, com o
backend na nuvem, não tem mais nenhum jeito de o servidor "empurrar" a
impressão direto pra impressora — ela só é alcançável de dentro da loja.

```
Cardápio digital (Vercel) → Backend (Railway) → fila no banco (status_impressao)
                                                        ↑
                                      agente.py consulta a cada N segundos
                                                        ↓
                                              Impressora Bematech (USB, na loja)
```

## 1. Pré-requisitos

- Python 3.10+ instalado no PC da loja (https://www.python.org/downloads/ — marque "Add python.exe to PATH" no instalador).
- A impressora Bematech já instalada no Windows (Painel de Controle → Dispositivos e Impressoras), como você já usa hoje.
- NSSM (para rodar como serviço do Windows) — mesmo que já foi usado pro `PhpServer` no deploy local antigo. Se ainda não tiver: https://nssm.cc/download

## 2. Instalação

Abra o PowerShell **como Administrador** e rode:

```powershell
cd C:\projetos\VisionSystem-CRM_PDV\print-agent

# Cria um ambiente virtual isolado (não mexe no Python do sistema)
python -m venv venv
venv\Scripts\pip install -r requirements.txt
```

## 3. Configuração

```powershell
copy config.example.ini config.ini
notepad config.ini
```

No arquivo que abrir, ajuste:

- `agent_token` → o mesmo valor que você vai colocar na variável `PRINT_AGENT_TOKEN` no Railway (veja a mensagem do Claude com o token gerado).
- `nome` (seção `[impressora]`) → o nome **exato** da sua impressora. Para descobrir, rode:

```powershell
venv\Scripts\python agent.py --listar-impressoras
```

Copie o nome exatamente como aparece na lista e cole em `nome = ...` no `config.ini`.

## 4. Testar manualmente (antes de instalar como serviço)

```powershell
venv\Scripts\python agent.py --uma-vez
```

- Se não houver pedido pendente, não imprime nada e termina — normal.
- Para testar de ponta a ponta: faça um pedido de teste no cardápio digital e rode o comando de novo dentro de alguns segundos; a comanda deve sair na Bematech.
- Os logs ficam em `print-agent\logs\agente_impressao.log` — qualquer erro de conexão ou de impressão aparece ali com detalhes.

Se der tudo certo, rode sem `--uma-vez` por um minuto (`venv\Scripts\python agent.py`) pra ver o loop funcionando contínuo, depois `Ctrl+C` pra parar.

## 5. Instalar como serviço do Windows (inicia sozinho, reinicia se cair)

Ainda no PowerShell como Administrador (ajuste o caminho do NSSM se for diferente):

```powershell
C:\Apache24\bin\nssm.exe install AgenteImpressaoPDV "C:\projetos\VisionSystem-CRM_PDV\print-agent\venv\Scripts\python.exe" "agent.py"
C:\Apache24\bin\nssm.exe set AgenteImpressaoPDV AppDirectory "C:\projetos\VisionSystem-CRM_PDV\print-agent"
C:\Apache24\bin\nssm.exe set AgenteImpressaoPDV AppExit Default Restart
C:\Apache24\bin\nssm.exe set AgenteImpressaoPDV Start SERVICE_AUTO_START

net start AgenteImpressaoPDV
```

Verificar se está rodando:

```powershell
sc.exe query AgenteImpressaoPDV
```

Deve retornar `ESTADO: 4 RUNNING`. Dali em diante o Windows cuida de iniciar o
agente sozinho a cada boot, e reinicia ele automaticamente se cair por
qualquer motivo.

## 6. Comandos do dia a dia

```powershell
# Parar / iniciar / reiniciar
net stop AgenteImpressaoPDV
net start AgenteImpressaoPDV
net stop AgenteImpressaoPDV && net start AgenteImpressaoPDV

# Ver o log em tempo real (últimas linhas)
Get-Content C:\projetos\VisionSystem-CRM_PDV\print-agent\logs\agente_impressao.log -Tail 30 -Wait
```

## 7. Troubleshooting

| Sintoma | Causa provável | Solução |
|---|---|---|
| `Não foi possível abrir a impressora 'X'` no log | Nome em `config.ini` não é exatamente igual ao do Windows | Rode `agent.py --listar-impressoras` de novo e copie o nome exato (atenção a espaços) |
| Log mostra `401` ou "Token do agente de impressão inválido" | `agent_token` no `config.ini` não é igual ao `PRINT_AGENT_TOKEN` do Railway | Confirme que são EXATAMENTE o mesmo valor nos dois lados |
| Log mostra erro de conexão (timeout, DNS etc.) | Internet da loja caiu, ou `base_url` errado | Confira `config.ini` → `base_url` e a conexão do PC |
| Serviço não inicia (`sc.exe query` não mostra RUNNING) | Caminho errado no `nssm.exe install`, ou erro de config.ini | Rode `venv\Scripts\python agent.py` manualmente no PowerShell pra ver o erro na tela |
| Pedido fica "travado" sem imprimir e sem erro | Agente parado/computador desligado | O backend detecta jobs travados (`processando` por mais de 3 min) e devolve pra fila automaticamente — assim que o agente voltar, ele pega de novo |

## 8. Como funciona por dentro (resumo)

1. Cliente faz um pedido no cardápio digital → backend grava o pedido com `status_impressao = 'pendente'`.
2. `agent.py` chama `GET /impressao/pendentes` a cada poucos segundos (header `X-Agent-Token`) — o backend marca os pedidos retornados como `processando` pra não mandar o mesmo pedido duas vezes.
3. Pro cada pedido, `comanda.py` monta os bytes ESC/POS (mesmo layout que o sistema já usava localmente) e `printer_windows.py` envia direto pro spooler do Windows em modo `RAW`.
4. Se imprimiu: `POST /impressao/{id}/concluir`. Se deu erro: `POST /impressao/{id}/erro` — depois de 5 falhas seguidas pro mesmo pedido, o backend para de tentar automaticamente (precisa de ação manual).
