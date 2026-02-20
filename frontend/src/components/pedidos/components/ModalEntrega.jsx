// src/components/Pedidos/components/ModalEntrega.jsx
// 🚚 MODAL: Configurar entrega (zona + endereço)

import React, { useState, useEffect } from 'react';

/**
 * Modal para configurar entrega com seleção de zona e endereço
 * 
 * @param {boolean} visible - Controla exibição
 * @param {Function} onFechar - Callback ao fechar
 * @param {Function} onConfirmar - Callback ao confirmar (recebe {zonaId, zonaNome, taxa, endereco})
 * @param {Function} buscarZonas - Função para buscar zonas ativas
 * @param {Object} dadosIniciais - Dados de entrega já existentes (para edição)
 */
const ModalEntrega = ({
  visible,
  onFechar,
  onConfirmar,
  buscarZonas,
  dadosIniciais = null
}) => {

  // Estados
  const [zonas, setZonas] = useState([]);
  const [zonaSelecionada, setZonaSelecionada] = useState('');
  const [endereco, setEndereco] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Carregar zonas ao abrir modal
  useEffect(() => {
    if (visible) {
      carregarZonas();
      
      // Preencher com dados iniciais se houver
      if (dadosIniciais) {
        setZonaSelecionada(dadosIniciais.zona_entrega_id || '');
        setEndereco(dadosIniciais.endereco_entrega || '');
      } else {
        setZonaSelecionada('');
        setEndereco('');
      }
    }
  }, [visible, dadosIniciais]);

  const carregarZonas = async () => {
    try {
      setLoading(true);
      const resultado = await buscarZonas(true); // true = apenas ativas
      setZonas(resultado || []);
    } catch (err) {
      console.error('Erro ao carregar zonas:', err);
      setErro('Erro ao carregar zonas de entrega');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = () => {
    // Validações
    if (!zonaSelecionada) {
      setErro('Selecione uma zona de entrega');
      return;
    }

    if (!endereco.trim()) {
      setErro('Informe o endereço de entrega');
      return;
    }

    // Buscar dados da zona selecionada
    const zona = zonas.find(z => z.id === parseInt(zonaSelecionada));

    if (!zona) {
      setErro('Zona inválida');
      return;
    }

    // Enviar dados para o pai
    onConfirmar({
      zonaId: zona.id,
      zonaNome: zona.nome,
      taxa: parseFloat(zona.valor),
      endereco: endereco.trim()
    });

    // Fechar modal
    onFechar();
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal-container modal-entrega" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="modal-header">
          <h2>
            <i className="fas fa-truck"></i>
            Configurar Entrega
          </h2>
          <button className="modal-fechar" onClick={onFechar} title="Fechar">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body">

          {loading ? (
            <div className="entrega-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Carregando zonas...</p>
            </div>
          ) : zonas.length === 0 ? (
            <div className="entrega-aviso">
              <i className="fas fa-exclamation-circle"></i>
              <p>Nenhuma zona de entrega cadastrada.</p>
              <small>Cadastre zonas no menu Configurações.</small>
            </div>
          ) : (
            <>
              {/* ZONA DE ENTREGA */}
              <div className="entrega-campo">
                <label className="entrega-label">
                  <i className="fas fa-map-marked-alt"></i>
                  Zona de Entrega *
                </label>
                <select
                  className="entrega-select"
                  value={zonaSelecionada}
                  onChange={(e) => setZonaSelecionada(e.target.value)}
                  autoFocus
                >
                  <option value="">-- Selecione a zona --</option>
                  {zonas.map((zona) => (
                    <option key={zona.id} value={zona.id}>
                      {zona.nome} - R$ {parseFloat(zona.valor).toFixed(2)}
                      {zona.descricao && ` (${zona.descricao})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* ENDEREÇO */}
              <div className="entrega-campo">
                <label className="entrega-label">
                  <i className="fas fa-map-marker-alt"></i>
                  Endereço Completo *
                </label>
                <textarea
                  className="entrega-textarea"
                  placeholder="Ex: Rua das Flores, 123, Apto 45, Bairro Centro"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  rows={3}
                />
              </div>

              {/* RESUMO DA TAXA */}
              {zonaSelecionada && (
                <div className="entrega-resumo">
                  <i className="fas fa-info-circle"></i>
                  <span>
                    Taxa de entrega: <strong>R$ {
                      parseFloat(zonas.find(z => z.id === parseInt(zonaSelecionada))?.valor || 0).toFixed(2)
                    }</strong>
                  </span>
                </div>
              )}

              {/* ERRO */}
              {erro && (
                <div className="entrega-erro">
                  <i className="fas fa-exclamation-triangle"></i>
                  {erro}
                </div>
              )}
            </>
          )}

        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button
            className="btn-modal-secundario"
            onClick={onFechar}
          >
            <i className="fas fa-times"></i>
            Cancelar
          </button>
          <button
            className="btn-modal-primario"
            onClick={handleConfirmar}
            disabled={loading || zonas.length === 0}
          >
            <i className="fas fa-check"></i>
            Confirmar Entrega
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalEntrega;
