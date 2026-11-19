import React, { useState } from 'react';
import { relatoriosService } from '../services/relatorioService';

const formatarDataLocal = (data) => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
};

const formatarDataCalendario = (data) => {
    if (!data) return '-';
    const [ano, mes, dia] = String(data).slice(0, 10).split('-');
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
};

const Relatorios = () => {
    const [tipoRelatorio, setTipoRelatorio] = useState('');
    const [dadosRelatorio, setDadosRelatorio] = useState(null);
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [filtros, setFiltros] = useState(() => {
        const hoje = new Date();
        const hojeLocal = formatarDataLocal(hoje);
        return {
            data_inicio: `${hojeLocal.slice(0, 7)}-01`,
            data_fim: hojeLocal,
            tipo_pessoa: '',
            cidade: '',
            uf: '',
            dias_atraso: 30,
            granularidade: 'mes',
            ano: hoje.getFullYear()
        };
    });

    const tiposRelatorio = [
        { value: '', label: 'Selecione um relatório' },
        { value: 'clientes', label: '👥 Relatório de Clientes' },
        { value: 'financeiro', label: '💰 Relatório Financeiro' },
        { value: 'inadimplencia', label: '⚠️ Relatório de Inadimplência' },
        { value: 'fluxo_caixa', label: '📊 Fluxo de Caixa' },
        { value: 'recibos', label: '🧾 Relatório de Recibos' },
        { value: 'vendas_periodo', label: '📈 Vendas por Mês e Ano' },
        { value: 'faturamento_anual', label: '📅 Faturamento Anual (mês a mês)' },
        { value: 'vendas_cliente', label: '🧑‍🤝‍🧑 Vendas por Cliente' },
        { value: 'fechamento_caixa', label: '🧮 Fechamento de Caixa' }
    ];

    const ufs = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];

    const gerarRelatorio = async (event) => {
        event.preventDefault();

        if (!tipoRelatorio) {
            setErro('Selecione um tipo de relatório');
            return;
        }

        if (tipoRelatorio !== 'faturamento_anual' && filtros.data_inicio > filtros.data_fim) {
            setErro('A data inicial deve ser anterior ou igual à data final.');
            setSucesso('');
            return;
        }

        setLoading(true);
        setErro('');
        setSucesso('');

        try {
            let resultado;

            switch (tipoRelatorio) {
                case 'clientes':
                    resultado = await relatoriosService.relatorioClientes(filtros);
                    break;
                case 'financeiro':
                    resultado = await relatoriosService.relatorioFinanceiro(
                        filtros.data_inicio,
                        filtros.data_fim
                    );
                    break;
                case 'inadimplencia':
                    resultado = await relatoriosService.relatorioInadimplencia(filtros.dias_atraso);
                    break;
                case 'fluxo_caixa':
                    resultado = await relatoriosService.relatorioFluxoCaixa(
                        filtros.data_inicio,
                        filtros.data_fim
                    );
                    break;
                case 'recibos':
                    resultado = await relatoriosService.relatorioRecibos(
                        filtros.data_inicio,
                        filtros.data_fim
                    );
                    break;
                case 'vendas_periodo':
                    resultado = await relatoriosService.relatorioVendasPeriodo(
                        filtros.data_inicio,
                        filtros.data_fim,
                        filtros.granularidade
                    );
                    break;
                case 'faturamento_anual':
                    resultado = await relatoriosService.relatorioFaturamentoAnual(filtros.ano);
                    break;
                case 'vendas_cliente':
                    resultado = await relatoriosService.relatorioVendasCliente(
                        filtros.data_inicio,
                        filtros.data_fim
                    );
                    break;
                case 'fechamento_caixa':
                    resultado = await relatoriosService.relatorioFechamentoCaixa(
                        filtros.data_inicio,
                        filtros.data_fim
                    );
                    break;
                default:
                    throw new Error('Tipo de relatório não implementado');
            }

            if (resultado.success) {
                setDadosRelatorio(resultado.data);
                setSucesso('Relatório gerado com sucesso!');
            } else {
                setErro(resultado.message || 'Erro ao gerar relatório');
            }
        } catch (error) {
            setErro('Erro de conexão ao gerar relatório');
        } finally {
            setLoading(false);
        }
    };

    const limparRelatorio = () => {
        setDadosRelatorio(null);
        setTipoRelatorio('');
        setErro('');
        setSucesso('');
    };

    const exportarCSV = () => {
        if (!dadosRelatorio) return;

        try {
            relatoriosService.exportarCSV(dadosRelatorio, tipoRelatorio);
            setSucesso('Relatório exportado com sucesso!');
        } catch (error) {
            setErro('Erro ao exportar relatório');
        }
    };

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };

    const handleTipoRelatorioChange = (event) => {
        const novoTipo = event.target.value;
        setTipoRelatorio(novoTipo);

        if (novoTipo === 'vendas_periodo' && tipoRelatorio !== 'vendas_periodo') {
            const hoje = new Date();
            const hojeLocal = formatarDataLocal(hoje);
            setFiltros(prev => ({
                ...prev,
                data_inicio: `${hoje.getFullYear()}-01-01`,
                data_fim: hojeLocal,
                granularidade: 'mes'
            }));
        }
    };

    const renderFiltrosEspecificos = () => {
        switch (tipoRelatorio) {
            case 'clientes':
                return (
                    <div className="filtros-especificos">
                        <div className="campo">
                            <label>Tipo de Pessoa:</label>
                            <select
                                value={filtros.tipo_pessoa}
                                onChange={(e) => setFiltros(prev => ({ ...prev, tipo_pessoa: e.target.value }))}
                            >
                                <option value="">Todos</option>
                                <option value="fisica">Pessoa Física</option>
                                <option value="juridica">Pessoa Jurídica</option>
                            </select>
                        </div>

                        <div className="campo">
                            <label>Cidade:</label>
                            <input
                                type="text"
                                value={filtros.cidade}
                                onChange={(e) => setFiltros(prev => ({ ...prev, cidade: e.target.value }))}
                                placeholder="Digite a cidade..."
                            />
                        </div>

                        <div className="campo">
                            <label>UF:</label>
                            <select
                                value={filtros.uf}
                                onChange={(e) => setFiltros(prev => ({ ...prev, uf: e.target.value }))}
                            >
                                <option value="">Todos</option>
                                {ufs.map(uf => (
                                    <option key={uf} value={uf}>{uf}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );

            case 'inadimplencia':
                return (
                    <div className="filtros-especificos">
                        <div className="campo">
                            <label>Dias em Atraso (mínimo):</label>
                            <input
                                type="number"
                                value={filtros.dias_atraso}
                                onChange={(e) => setFiltros(prev => ({ ...prev, dias_atraso: parseInt(e.target.value) }))}
                                min="1"
                                placeholder="30"
                            />
                        </div>
                    </div>
                );

            case 'vendas_periodo':
                return (
                    <div className="filtros-especificos">
                        <div className="campo">
                            <label htmlFor="relatorio-granularidade">Agrupar por:</label>
                            <select
                                id="relatorio-granularidade"
                                name="granularidade"
                                value={filtros.granularidade}
                                onChange={(e) => setFiltros(prev => ({ ...prev, granularidade: e.target.value }))}
                            >
                                <option value="dia">Dia</option>
                                <option value="semana">Semana</option>
                                <option value="mes">Mês</option>
                                <option value="ano">Ano</option>
                            </select>
                        </div>
                    </div>
                );

            case 'faturamento_anual': {
                const anoAtual = new Date().getFullYear();
                const anosParaExibir = dadosRelatorio?.anos_disponiveis?.length
                    ? dadosRelatorio.anos_disponiveis
                    : [anoAtual - 2, anoAtual - 1, anoAtual];

                return (
                    <div className="filtros-especificos">
                        <div className="campo">
                            <label htmlFor="relatorio-ano">Ano:</label>
                            <select
                                id="relatorio-ano"
                                name="ano"
                                value={filtros.ano}
                                onChange={(e) => setFiltros(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                            >
                                {anosParaExibir.map(ano => (
                                    <option key={ano} value={ano}>{ano}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );
            }

            default:
                return null;
        }
    };

    const renderResultados = () => {
        if (!dadosRelatorio) return null;

        switch (tipoRelatorio) {
            case 'clientes':
                return <RelatorioClientes dados={dadosRelatorio} />;
            case 'financeiro':
                return <RelatorioFinanceiro dados={dadosRelatorio} />;
            case 'inadimplencia':
                return <RelatorioInadimplencia dados={dadosRelatorio} />;
            case 'fluxo_caixa':
                return <RelatorioFluxoCaixa dados={dadosRelatorio} />;
            case 'recibos':
                return <RelatorioRecibos dados={dadosRelatorio} />;
            case 'vendas_periodo':
                return <RelatorioVendasPeriodo dados={dadosRelatorio} />;
            case 'faturamento_anual':
                return <RelatorioFaturamentoAnual dados={dadosRelatorio} />;
            case 'vendas_cliente':
                return <RelatorioVendasCliente dados={dadosRelatorio} />;
            case 'fechamento_caixa':
                return <RelatorioFechamentoCaixa dados={dadosRelatorio} />;
            default:
                return null;
        }
    };

    return (
        <div className="relatorios-container">
            <div className="relatorios-header">
                <h1>📊 Relatórios</h1>
                <div className="header-actions">
                    {dadosRelatorio && (
                        <>
                            <button onClick={exportarCSV} className="btn-secondary">
                                📄 Exportar CSV
                            </button>
                            <button onClick={() => window.print()} className="btn-secondary">
                                🖨️ Imprimir
                            </button>
                        </>
                    )}
                    <button onClick={limparRelatorio} className="btn-outline">
                        🗑️ Limpar
                    </button>
                </div>
            </div>

            {/* Mensagens */}
            {erro && (
                <div className="alert alert-error" role="alert">
                    ⚠️ {erro}
                </div>
            )}

            {sucesso && (
                <div className="alert alert-success" role="status">
                    ✅ {sucesso}
                </div>
            )}

            {/* Configuração do Relatório */}
            <form className="config-relatorio" onSubmit={gerarRelatorio} aria-labelledby="config-relatorio-heading">
                <h3 id="config-relatorio-heading">⚙️ Configuração do Relatório</h3>

                <div className="config-grid">
                    <div className="campo">
                        <label htmlFor="relatorio-tipo">Tipo de Relatório: *</label>
                        <select
                            id="relatorio-tipo"
                            name="tipo_relatorio"
                            value={tipoRelatorio}
                            onChange={handleTipoRelatorioChange}
                        >
                            {tiposRelatorio.map(tipo => (
                                <option key={tipo.value} value={tipo.value}>
                                    {tipo.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {(tipoRelatorio === 'financeiro' || tipoRelatorio === 'fluxo_caixa' || tipoRelatorio === 'recibos' ||
                      tipoRelatorio === 'vendas_periodo' || tipoRelatorio === 'vendas_cliente' || tipoRelatorio === 'fechamento_caixa') && (
                        <>
                            <div className="campo">
                                <label htmlFor="relatorio-data-inicio">Data Início:</label>
                                <input
                                    id="relatorio-data-inicio"
                                    name="data_inicio"
                                    type="date"
                                    required
                                    max={filtros.data_fim}
                                    value={filtros.data_inicio}
                                    onChange={(e) => setFiltros(prev => ({ ...prev, data_inicio: e.target.value }))}
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="relatorio-data-fim">Data Fim:</label>
                                <input
                                    id="relatorio-data-fim"
                                    name="data_fim"
                                    type="date"
                                    required
                                    min={filtros.data_inicio}
                                    value={filtros.data_fim}
                                    onChange={(e) => setFiltros(prev => ({ ...prev, data_fim: e.target.value }))}
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Filtros específicos */}
                {renderFiltrosEspecificos()}

                <div className="config-actions">
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || !tipoRelatorio}
                    >
                        {loading ? '🔄 Gerando...' : '📊 Gerar Relatório'}
                    </button>
                </div>
            </form>

            {/* Resultados */}
            {renderResultados()}

            <style jsx>{`
                .relatorios-container {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }

                .relatorios-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .relatorios-header h1 {
                    margin: 0;
                    color: #333;
                }

                .header-actions {
                    display: flex;
                    gap: 12px;
                }

                .alert {
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }

                .alert-error {
                    background: #fee;
                    color: #c53030;
                    border: 1px solid #fed7d7;
                }

                .alert-success {
                    background: #f0fff4;
                    color: #276749;
                    border: 1px solid #9ae6b4;
                }

                .config-relatorio {
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                }

                .config-relatorio h3 {
                    margin: 0 0 16px 0;
                    color: #333;
                }

                .config-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 16px;
                    margin-bottom: 16px;
                }

                .filtros-especificos {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid #e2e8f0;
                }

                .campo {
                    display: flex;
                    flex-direction: column;
                }

                .campo label {
                    font-weight: 500;
                    margin-bottom: 4px;
                    color: #555;
                }

                .campo input,
                .campo select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }

                .campo input:focus,
                .campo select:focus {
                    outline: none;
                    border-color: #3182ce;
                    box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
                }

                .config-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 20px;
                }

                .relatorio-tabela-scroll {
                    max-inline-size: 100%;
                    overflow-x: auto;
                    container-type: inline-size;
                }

                .relatorio-tabela-scroll:focus-visible {
                    outline: 3px solid #3182ce;
                    outline-offset: 2px;
                }

                .relatorio-tabela-scroll .tabela-relatorio {
                    inline-size: 100%;
                    min-inline-size: 34rem;
                }

                @container (width < 600px) {
                    .relatorio-tabela-scroll .tabela-relatorio th,
                    .relatorio-tabela-scroll .tabela-relatorio td {
                        padding-inline: 8px;
                        white-space: nowrap;
                    }
                }

                .tabela-relatorio caption {
                    padding: 0 0 10px;
                    color: #2d3748;
                    font-weight: 600;
                    text-align: left;
                }

                .relatorio-observacao {
                    color: #4a5568;
                    font-size: 0.9rem;
                    line-height: 1.45;
                }

                .btn-primary {
                    background: #3182ce;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .btn-primary:hover {
                    background: #2c5aa0;
                }

                .btn-primary:disabled {
                    background: #a0aec0;
                    cursor: not-allowed;
                }

                .btn-secondary {
                    background: #4a5568;
                    color: white;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .btn-secondary:hover {
                    background: #2d3748;
                }

                .btn-outline {
                    background: transparent;
                    color: #4a5568;
                    border: 1px solid #cbd5e0;
                    padding: 10px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                }

                .btn-outline:hover {
                    background: #f7fafc;
                }

                @media (max-width: 768px) {
                    .relatorios-container {
                        padding: 10px;
                    }

                    .relatorios-header {
                        flex-direction: column;
                        gap: 16px;
                        align-items: stretch;
                    }

                    .config-grid {
                        grid-template-columns: 1fr;
                    }

                    .filtros-especificos {
                        grid-template-columns: 1fr;
                    }

                    .config-actions {
                        flex-direction: column;
                    }

                    .header-actions {
                        flex-direction: column;
                        gap: 8px;
                    }
                }

                @media print {
                    .relatorios-header .header-actions,
                    .config-relatorio {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
};

// Componente para Relatório de Clientes
const RelatorioClientes = ({ dados }) => {
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };

    return (
        <div className="resultado-relatorio">
            <h3>👥 Relatório de Clientes</h3>

            {/* Resumo */}
            <div className="resumo-cards">
                <div className="resumo-card">
                    <div className="card-value">{dados.totais?.total_clientes || 0}</div>
                    <div className="card-label">Total de Clientes</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{dados.totais?.pessoa_fisica || 0}</div>
                    <div className="card-label">Pessoa Física</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{dados.totais?.pessoa_juridica || 0}</div>
                    <div className="card-label">Pessoa Jurídica</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.totais?.valor_total_contas)}</div>
                    <div className="card-label">Valor Total em Contas</div>
                </div>
            </div>

            {/* Lista de Clientes */}
            <div className="tabela-container">
                <table className="tabela-relatorio">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Tipo</th>
                            <th>Documento</th>
                            <th>Cidade/UF</th>
                            <th>Total Contas</th>
                            <th>Valor Pendente</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dados.clientes?.map(cliente => (
                            <tr key={cliente.id}>
                                <td>{cliente.nome}</td>
                                <td>{cliente.tipo_pessoa_texto}</td>
                                <td>{cliente.cpf_cnpj || '-'}</td>
                                <td>{cliente.cidade ? `${cliente.cidade}/${cliente.uf}` : '-'}</td>
                                <td>{cliente.total_contas || 0}</td>
                                <td>{formatarMoeda(cliente.valor_pendente)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Componente para Relatório Financeiro
const RelatorioFinanceiro = ({ dados }) => {
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };

    return (
        <div className="resultado-relatorio">
            <h3>💰 Relatório Financeiro</h3>
            <p>Período: {dados.periodo?.inicio} a {dados.periodo?.fim}</p>

            <div className="resumo-cards">
                <div className="resumo-card">
                    <div className="card-value">{dados.resumo?.contas_receber?.total_contas || 0}</div>
                    <div className="card-label">Contas no Período</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.recibos?.valor_liquido)}</div>
                    <div className="card-label">Recebido no Período</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{dados.resumo?.recibos?.total_recibos || 0}</div>
                    <div className="card-label">Recibos Emitidos</div>
                </div>
            </div>

            {/* Formas de Pagamento */}
            {dados.resumo?.por_forma_pagamento && (
                <div className="secao-relatorio">
                    <h4>💳 Por Forma de Pagamento</h4>
                    <table className="tabela-relatorio">
                        <thead>
                            <tr>
                                <th>Forma de Pagamento</th>
                                <th>Quantidade</th>
                                <th>Valor Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dados.resumo.por_forma_pagamento.map((forma, index) => (
                                <tr key={index}>
                                    <td>{forma.forma_pagamento}</td>
                                    <td>{forma.quantidade}</td>
                                    <td>{formatarMoeda(forma.valor_total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Componente para Relatório de Inadimplência
const RelatorioInadimplencia = ({ dados }) => {
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };

    return (
        <div className="resultado-relatorio">
            <h3>⚠️ Relatório de Inadimplência</h3>

            <div className="resumo-cards">
                <div className="resumo-card">
                    <div className="card-value">{dados.resumo?.total_contas || 0}</div>
                    <div className="card-label">Contas em Atraso</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.valor_total)}</div>
                    <div className="card-label">Valor Total em Atraso</div>
                </div>
            </div>

            {/* Por Faixa de Atraso */}
            <div className="secao-relatorio">
                <h4>📊 Por Faixa de Atraso</h4>
                <table className="tabela-relatorio">
                    <thead>
                        <tr>
                            <th>Faixa de Atraso</th>
                            <th>Quantidade</th>
                            <th>Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(dados.por_faixa || {}).map(([faixa, info]) => (
                            <tr key={faixa}>
                                <td>{faixa}</td>
                                <td>{info.quantidade}</td>
                                <td>{formatarMoeda(info.valor_total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Lista de Inadimplentes */}
            <div className="secao-relatorio">
                <h4>📋 Contas em Atraso</h4>
                <table className="tabela-relatorio">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Documento</th>
                            <th>Descrição</th>
                            <th>Vencimento</th>
                            <th>Dias Atraso</th>
                            <th>Valor Pendente</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dados.inadimplentes?.map(conta => (
                            <tr key={conta.conta_id}>
                                <td>{conta.cliente_nome}</td>
                                <td>{conta.cliente_documento}</td>
                                <td>{conta.conta_descricao}</td>
                                <td>{new Date(conta.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                <td style={{ color: '#e53e3e', fontWeight: 'bold' }}>{conta.dias_atraso} dias</td>
                                <td>{formatarMoeda(conta.valor_pendente)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Componente para Fluxo de Caixa
const RelatorioFluxoCaixa = ({ dados }) => {
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };

    return (
        <div className="resultado-relatorio">
            <h3>📊 Fluxo de Caixa</h3>
            <p>Período: {dados.periodo?.inicio} a {dados.periodo?.fim}</p>

            <div className="resumo-cards">
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.total_entradas)}</div>
                    <div className="card-label">Total de Entradas</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.saldo_periodo)}</div>
                    <div className="card-label">Saldo do Período</div>
                </div>
            </div>

            {/* Movimentações por Data */}
            <div className="secao-relatorio">
                <h4>📅 Movimentações por Data</h4>
                <table className="tabela-relatorio">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Entradas</th>
                            <th>Saldo Diário</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dados.por_data?.map(dia => (
                            <tr key={dia.data}>
                                <td>{new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                <td style={{ color: '#38a169' }}>{formatarMoeda(dia.entradas)}</td>
                                <td style={{ color: dia.saldo >= 0 ? '#38a169' : '#e53e3e' }}>
                                    {formatarMoeda(dia.saldo)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Componente para Relatório de Recibos
const RelatorioRecibos = ({ dados }) => {
    return (
        <div className="resultado-relatorio">
            <h3>🧾 Relatório de Recibos</h3>
            {/* Implementação específica para recibos */}
        </div>
    );
};

// Componente para Relatório de Vendas por Período
const RelatorioVendasPeriodo = ({ dados }) => {
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };
    const granularidadeLabel = {
        dia: 'dia',
        semana: 'semana',
        mes: 'mês',
        ano: 'ano'
    }[dados.periodo?.granularidade] || 'período';

    return (
        <div className="resultado-relatorio">
            <h3>📈 Vendas por Mês e Ano</h3>
            <p>Período: {formatarDataCalendario(dados.periodo?.inicio)} a {formatarDataCalendario(dados.periodo?.fim)}</p>
            <p className="relatorio-observacao">
                Totais calculados somente com pedidos finalizados registrados no MySQL. Os resumos das planilhas não estão incluídos.
            </p>

            <div className="resumo-cards">
                <div className="resumo-card">
                    <div className="card-value">{dados.resumo?.total_pedidos || 0}</div>
                    <div className="card-label">Total de Pedidos</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.valor_total)}</div>
                    <div className="card-label">Valor Total</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.ticket_medio)}</div>
                    <div className="card-label">Ticket Médio</div>
                </div>
            </div>

            {dados.periodo?.granularidade !== 'ano' && (
                <>
                    <h4>Totais por ano no período</h4>
                    <div
                        className="tabela-container relatorio-tabela-scroll"
                        tabIndex={0}
                        role="region"
                        aria-label="Resumo anual de vendas"
                    >
                        <table className="tabela-relatorio">
                            <caption>Vendas por ano no período selecionado</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Ano</th>
                                    <th scope="col">Total de Pedidos</th>
                                    <th scope="col">Valor Total</th>
                                    <th scope="col">Ticket Médio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dados.serie_anual?.map((linha) => (
                                    <tr key={linha.periodo}>
                                        <th scope="row">{linha.periodo_label}</th>
                                        <td>{linha.total_pedidos}</td>
                                        <td>{formatarMoeda(linha.valor_total)}</td>
                                        <td>{formatarMoeda(linha.ticket_medio)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <h4>{dados.periodo?.granularidade === 'mes' ? 'Detalhamento mensal' : `Detalhamento por ${granularidadeLabel}`}</h4>
            <div
                className="tabela-container relatorio-tabela-scroll"
                tabIndex={0}
                role="region"
                aria-label="Detalhamento de vendas por período"
            >
                <table className="tabela-relatorio">
                    <caption>Vendas agrupadas por {granularidadeLabel}</caption>
                    <thead>
                        <tr>
                            <th scope="col">Período</th>
                            <th scope="col">Total de Pedidos</th>
                            <th scope="col">Valor Total</th>
                            <th scope="col">Ticket Médio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dados.serie?.map((linha) => (
                            <tr key={linha.periodo}>
                                <th scope="row">{linha.periodo_label}</th>
                                <td>{linha.total_pedidos}</td>
                                <td>{formatarMoeda(linha.valor_total)}</td>
                                <td>{formatarMoeda(linha.ticket_medio)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Componente para Relatório de Faturamento Anual (mês a mês)
const RelatorioFaturamentoAnual = ({ dados }) => {
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };

    return (
        <div className="resultado-relatorio">
            <h3>📅 Faturamento Anual — {dados.ano}</h3>
            <p className="relatorio-observacao">
                Inclui o histórico importado das planilhas e os pedidos finalizados registrados no sistema.
            </p>

            <div className="resumo-cards">
                <div className="resumo-card">
                    <div className="card-value">{dados.resumo?.quantidade_total || 0}</div>
                    <div className="card-label">Total de Vendas no Ano</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.valor_total)}</div>
                    <div className="card-label">Faturamento Total</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.ticket_medio)}</div>
                    <div className="card-label">Ticket Médio</div>
                </div>
            </div>

            <h4>Detalhamento mensal</h4>
            <div
                className="tabela-container relatorio-tabela-scroll"
                tabIndex={0}
                role="region"
                aria-label="Faturamento mês a mês"
            >
                <table className="tabela-relatorio">
                    <caption>Faturamento de {dados.ano}, mês a mês</caption>
                    <thead>
                        <tr>
                            <th scope="col">Mês</th>
                            <th scope="col">Quantidade</th>
                            <th scope="col">Valor Total</th>
                            <th scope="col">Ticket Médio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dados.serie?.map((linha) => (
                            <tr key={linha.mes}>
                                <th scope="row">{linha.mes_label}</th>
                                <td>{linha.quantidade}</td>
                                <td>{formatarMoeda(linha.valor_total)}</td>
                                <td>{formatarMoeda(linha.ticket_medio)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th scope="row">Total do ano</th>
                            <td>{dados.resumo?.quantidade_total || 0}</td>
                            <td>{formatarMoeda(dados.resumo?.valor_total)}</td>
                            <td>{formatarMoeda(dados.resumo?.ticket_medio)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

// Componente para Relatório de Vendas por Cliente
const RelatorioVendasCliente = ({ dados }) => {
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };

    return (
        <div className="resultado-relatorio">
            <h3>🧑‍🤝‍🧑 Vendas por Cliente</h3>
            <p>Período: {dados.periodo?.inicio} a {dados.periodo?.fim}</p>

            <div className="resumo-cards">
                <div className="resumo-card">
                    <div className="card-value">{dados.resumo?.total_clientes || 0}</div>
                    <div className="card-label">Total de Clientes</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{dados.resumo?.total_pedidos || 0}</div>
                    <div className="card-label">Total de Pedidos</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.valor_total)}</div>
                    <div className="card-label">Valor Total</div>
                </div>
            </div>

            <div className="tabela-container">
                <table className="tabela-relatorio">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Tipo</th>
                            <th>Total de Pedidos</th>
                            <th>Valor Total</th>
                            <th>Ticket Médio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dados.clientes?.map((cliente) => (
                            <tr key={cliente.cliente_id ?? cliente.cliente_nome}>
                                <td>{cliente.cliente_nome}</td>
                                <td>{cliente.tipo_cliente === 'cadastrado' ? 'Cadastrado' : 'Avulso'}</td>
                                <td>{cliente.total_pedidos}</td>
                                <td>{formatarMoeda(cliente.valor_total)}</td>
                                <td>{formatarMoeda(cliente.ticket_medio)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Rótulos das formas de pagamento (mesma nomenclatura usada no PDV, em ModalPagamento.jsx)
const ROTULOS_FORMA_PAGAMENTO = {
    dinheiro: 'Dinheiro',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    pix: 'PIX',
    prazo: 'A Prazo'
};

// Componente para Relatório de Fechamento de Caixa
const RelatorioFechamentoCaixa = ({ dados }) => {
    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    };

    return (
        <div className="resultado-relatorio">
            <h3>🧮 Fechamento de Caixa</h3>
            <p>Período: {dados.periodo?.inicio} a {dados.periodo?.fim}</p>

            <div className="resumo-cards">
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.total_geral)}</div>
                    <div className="card-label">Total Geral</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.total_avista)}</div>
                    <div className="card-label">Total à Vista</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.total_aprazo)}</div>
                    <div className="card-label">Total a Prazo</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{formatarMoeda(dados.resumo?.total_saidas)}</div>
                    <div className="card-label">Total de Saídas</div>
                </div>
                <div className="resumo-card">
                    <div className="card-value">{dados.resumo?.quantidade_total || 0}</div>
                    <div className="card-label">Quantidade de Pedidos</div>
                </div>
            </div>

            <div className="tabela-container">
                <table className="tabela-relatorio">
                    <thead>
                        <tr>
                            <th>Forma de Pagamento</th>
                            <th>Quantidade</th>
                            <th>Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dados.por_forma_pagamento?.map((forma) => (
                            <tr key={forma.forma_pagamento}>
                                <td>{ROTULOS_FORMA_PAGAMENTO[forma.forma_pagamento] || forma.forma_pagamento}</td>
                                <td>{forma.quantidade}</td>
                                <td>{formatarMoeda(forma.valor_total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h4>Saídas do Caixa</h4>
            <div className="tabela-container">
                <table className="tabela-relatorio">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Usuário</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dados.saidas?.length ? dados.saidas.map((saida) => (
                            <tr key={saida.id}>
                                <td>{saida.created_at ? new Date(saida.created_at).toLocaleString('pt-BR') : '-'}</td>
                                <td>{saida.descricao}</td>
                                <td>{saida.categoria}</td>
                                <td>{saida.usuario_nome || '-'}</td>
                                <td>{formatarMoeda(saida.valor)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5">Nenhuma saída registrada no período</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Relatorios;
