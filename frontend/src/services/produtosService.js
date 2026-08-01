// frontend/src/services/produtosService.js

import axios from 'axios';
import Logger from '../utils/Logger';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        Logger.error('Erro na API:', { erro: error });
        return Promise.reject(error);
    }
);

const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, config);

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
            return null;
        }

        const text = await response.text();
        if (!text) return { success: true, data: null };

        try {
            return JSON.parse(text);
        } catch {
            return { success: true, data: text };
        }

    } catch (error) {
        Logger.error('Erro na requisição:', { erro: error });
        throw error;
    }
};

const produtosService = {

    // ══════════════════════════════════════════════════════════════
    // CRUD DE PRODUTOS
    // ══════════════════════════════════════════════════════════════

    buscarTodos: async () => {
        try {
            const response = await fetchWithAuth('/produtos');

            if (response && response.success && Array.isArray(response.data)) {
                return response.data;
            } else if (Array.isArray(response)) {
                return response;
            } else {
                Logger.error('Resposta inesperada da API:', { erro: response });
                return [];
            }
        } catch (error) {
            Logger.error("Erro ao buscar todos os produtos:", { erro: error });
            throw new Error("Erro ao buscar todos os produtos");
        }
    },

    buscarPorId: async (id) => {
        try {
            const response = await fetchWithAuth(`/produtos?id=${id}`);

            if (response && response.success) {
                return response.data;
            } else {
                Logger.error('Resposta inesperada da API:', { erro: response });
                return null;
            }
        } catch (error) {
            Logger.error("Erro ao buscar produto por ID:", { erro: error });
            throw new Error("Erro ao buscar produto por ID");
        }
    },

    buscarPorCategoria: async (categoriaId) => {
        try {
            const data = await fetchWithAuth(`/produtos?categoria_id=${categoriaId}`);

            if (data && data.success) {
                return data.data;
            } else if (Array.isArray(data)) {
                return data;
            } else {
                Logger.error('Resposta inesperada da API:', { erro: data });
                return [];
            }
        } catch (error) {
            Logger.error("Erro ao buscar produtos por categoria:", { erro: error });
            throw new Error("Erro ao buscar produtos por categoria");
        }
    },

    criar: async (produto) => {
        try {
            const response = await fetchWithAuth('/produtos', {
                method: 'POST',
                body: JSON.stringify(produto)
            });

            if (response && response.success) {
                return response;
            } else {
                Logger.error('Resposta inesperada da API:', { erro: response });
                return response || { success: false };
            }
        } catch (error) {
            Logger.error("Erro ao criar novo produto:", { erro: error });
            throw new Error("Erro ao criar novo produto");
        }
    },

    atualizar: async (produto) => {
        Logger.info("Atualizando produto:", { info: 'produtosService.atualizar', produto });
        try {
            const response = await fetchWithAuth('/produtos', {
                method: 'PUT',
                body: JSON.stringify(produto)
            });

            if (response && response.success) {
                return response;
            } else {
                Logger.error('Resposta inesperada da API:', { erro: response });
                return response || { success: false };
            }
        } catch (error) {
            Logger.error('Erro ao atualizar produto:', { erro: error });
            throw new Error('Erro ao atualizar produto');
        }
    },

    deletar: async (id) => {
         try {
            const response = await fetchWithAuth('/produtos', {
                method: 'DELETE',
                body: JSON.stringify({ id })
            });

            if (response && response.success) {
                return response;
            } else {
                Logger.error('Resposta inesperada da API:', { erro: response });
                return response || { success: false };
            }
        } catch (error) {
            Logger.error('Erro ao deletar produto:', { erro: error });
            throw new Error('Erro ao deletar produto');
        }
    },

    buscarMaisVendidos: async (limite = 10) => {
        try {
            const response = await api.get(`/produtos?mais_vendidos=1&limite=${limite}`);
            return response.data;
        } catch (error) {
            throw new Error('Erro ao buscar produtos mais vendidos');
        }
    },

    // ══════════════════════════════════════════════════════════════
    // 📸 IMAGENS DE PRODUTOS
    // ══════════════════════════════════════════════════════════════

    /**
     * Upload de imagem para um produto existente
     * @param {number} produtoId
     * @param {File} arquivo - do input[type="file"]
     */
    uploadImagem: async (produtoId, arquivo) => {
        try {
            const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
            if (!tiposPermitidos.includes(arquivo.type)) {
                return { success: false, message: 'Use JPG, PNG ou WebP.' };
            }

            if (arquivo.size > 5 * 1024 * 1024) {
                return { success: false, message: 'Máximo 5MB.' };
            }

            const base64 = await produtosService._fileToBase64(arquivo);

            return await fetchWithAuth('/produtos/imagem', {
                method: 'POST',
                body: JSON.stringify({
                    produto_id: produtoId,
                    imagem_base64: base64,
                }),
            });

        } catch (error) {
            Logger.error('Erro no upload de imagem:', { erro: error });
            return { success: false, message: `Erro: ${error.message}` };
        }
    },

    /**
     * Remove imagem do produto (sem deletar o produto)
     * @param {number} produtoId
     */
    async remover(produtoId) {
        try {
            return await fetchWithAuth('/produtos/imagem', {
                method: 'DELETE',
                body: JSON.stringify({
                    produto_id: produtoId
                }),
            });

        } catch (error) {
            console.error('Erro ao remover imagem:', error);
            return { success: false, message: `Erro: ${error.message}` };
        }
    },

    /**
     * URL do thumbnail (200x200) - para grid de produtos
     * @param {string|null} nomeArquivo - campo "imagem" do produto
     */
    getThumbUrl(nomeArquivo) {
        if (!nomeArquivo) return null;
        return `${API_BASE_URL}/uploads/produtos/thumbs/${nomeArquivo}`;
    },

    /**
     * URL da imagem principal (600px)
     * @param {string|null} nomeArquivo
     */
    getImagemUrl(nomeArquivo) {
        if (!nomeArquivo) return null;return `${API_BASE_URL}/uploads/produtos/${nomeArquivo}`;
    },

    /**
     * Converte File para base64
     * @param {File} file
     */
    /** @private */
    _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    },

    // ══════════════════════════════════════════════════════════════
    // UTILITÁRIOS
    // ══════════════════════════════════════════════════════════════

    formatarMoeda(valor) {
        if (!valor) return 'R$ 0,00';
        const numero = parseFloat(valor);
        return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },

    limparNumeros(texto) {
        return texto.replace(/\D/g, '');
    },

    formatarData(data) {
        if (!data) return '-';
        return new Date(data).toLocaleDateString('pt-BR');
    },

    formatarDataHora(data) {
        if (!data) return '-';
        return new Date(data).toLocaleString('pt-BR');
    }
};

export { produtosService };
export default produtosService;
