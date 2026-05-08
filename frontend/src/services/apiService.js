// frontend/src/services/apiService.js
import Logger from '../utils/Logger';

const API_BASE_URL = 'http://localhost:8000';

class ApiService {
    constructor() {
        this.authToken = null;
    }

    /**
     * Configurar token de autenticação
     */
    setAuthToken(token) {
        this.authToken = token;
        if (token) {
            Logger.info('Token configurado', {info: "Token configurado"});
        } else {
            Logger.info('Token removido', {info: "Token removido"});
        }
    }

    /**
     * Obter headers com autenticação
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        const token = this.authToken || localStorage.getItem('token');
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Requisição genérica
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;

        const config = {
            method: options.method || 'GET',
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
            mode: 'cors',
                credentials: 'include',
            };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            Logger.info('  Requisição:', { info: config.method, url });

            const response = await fetch(url, config);
            const contentType = response.headers.get('content-type');

            // Verificar se é JSON
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                Logger.error('Resposta não é JSON:', { erro: text.substring(0, 200) });
                throw new Error(`Resposta não é JSON`);
            }

            const data = await response.json();

            // Se 401 e TOKEN_EXPIRED, tentar renovar (implementar depois)
            if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
                Logger.info('Token expirado, precisa renovar...', {info: "Token expirado, precisa renovar..."});
                // TODO: Implementar renovação automática
            }

            if (!response.ok && !data.success) {
                throw new Error(data.message || `Erro HTTP: ${response.status}`);
            }

            return data;

        } catch (error) {
            Logger.error(' Erro na requisição:', { erro: error });
            throw error;
        }
    }

    /**
     * GET
     */
    async get(endpoint, params = {}) {
        let url = endpoint;

        if (Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams();
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    searchParams.append(key, params[key]);
                }
            });

            if (searchParams.toString()) {
                url += '?' + searchParams.toString();
            }
        }

        return this.request(url, { method: 'GET' });
    }

    /**
     * POST
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data,
        });
    }

    /**
     * PUT
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data,
        });
    }

    /**
     * DELETE
     */
    async delete(endpoint, data = null) {
        return this.request(endpoint, {
            method: 'DELETE',
            body: data,
        });
    }

    /**
     * LOGIN
     */
    async login(email, senha) {
        try {
            Logger.info('Tentando login:', { info: email });

            const resultado = await this.post('/auth/login', { email, senha });

            if (resultado.success && resultado.data) {
                // Extrair tokens
                const { accessToken, refreshToken, user } = resultado.data;

                if (accessToken) {
                    // Salvar no localStorage
                    localStorage.setItem('token', accessToken);
                    localStorage.setItem('refreshToken', refreshToken);
                    localStorage.setItem('user', JSON.stringify(user));

                    // Configurar token na classe
                    this.setAuthToken(accessToken);

                    Logger.info('Login bem-sucedido', { info: resultado.data });

                    return {
                        success: true,
                        message: 'Login realizado com sucesso',
                        data: { token: accessToken, usuario: user }
                    };
                }
            }

            return resultado;

        } catch (error) {
            Logger.error('❌Erro no login:', { erro: error });
            return {
                success: false,
                message: error.message || 'Erro ao fazer login'
            };
        }
    }

    /**
     * LOGOUT
     */
    async logout() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (refreshToken) {
                await this.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            Logger.error('Erro no logout:', { erro: error });
        } finally {
            // Limpar dados locais
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            this.setAuthToken(null);

            // Redirecionar
            window.location.href = '/login';
        }
    }

    /**
     * VERIFICAR TOKEN
     */
    async verifyToken() {
        try {
            const resultado = await this.get('/auth/me');
            return resultado;
        } catch (error) {
            Logger.error('Token inválido:', { erro: error });
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return { success: false, message: 'Token inválido' };
        }
    }

    /**
     * REFRESH TOKEN
     */
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (!refreshToken) {
                throw new Error('Refresh token não encontrado');
            }

            const resultado = await this.post('/auth/refresh', { refreshToken });

            if (resultado.success && resultado.data.accessToken) {
                const newToken = resultado.data.accessToken;
                localStorage.setItem('token', newToken);
                this.setAuthToken(newToken);
                
                Logger.info('Token renovado', { info: "Token renovado" });
                return newToken;
            }

            throw new Error('Erro ao renovar token');

        } catch (error) {
            Logger.error('Erro ao renovar token:', { erro: error }   );
            this.logout();
            throw error;
        }
    }
}

// Criar instância única
const apiService = new ApiService();

// Exportar
export { apiService };
export default apiService;