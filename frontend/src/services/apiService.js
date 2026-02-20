// frontend/src/services/apiService.js
const API_BASE_URL = 'http://localhost:8000';

class ApiService {
    // Fazer requisição genérica
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;

        // Headers padrão
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        // Adicionar token se existir
        const token = localStorage.getItem('token');
        if (token) {
            console.log('🔑 Token encontrado:', token.substring(0, 30) + '...');
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            console.log('❌ Nenhum token encontrado no localStorage');
        }

        // Configurações da requisição
        const config = {
            method: options.method || 'GET',
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            mode: 'cors', // ✅ ADICIONAR EXPLICITAMENTE
            credentials: 'include', // ✅ ADICIONAR PARA COOKIES/CREDENCIAIS
            ...options,
        };

        // Adicionar body se for POST/PUT
        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            console.log('🔗 Fazendo requisição:', url, config);

            const response = await fetch(url, config);

            console.log('📡 Resposta recebida:', response.status, response.statusText);

            // Verificar se a resposta é JSON
            const contentType = response.headers.get('content-type');
            const responseText = await response.text();

            console.log('📄 Resposta em texto:', responseText.substring(0, 500));
            console.log('📋 Content-Type:', contentType);

            if (!contentType || !contentType.includes('application/json')) {
                console.error('❌ Resposta não é JSON:', responseText.substring(0, 200));
                throw new Error(`Resposta não é JSON. Content-Type: ${contentType}. Resposta: ${responseText.substring(0, 100)}`);
            }

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ Erro ao fazer parse do JSON:', parseError);
                console.error('📄 Conteúdo que causou erro:', responseText);
                throw new Error(`Erro ao interpretar JSON: ${parseError.message}`);
            }

            console.log('📦 Dados recebidos:', data);

            // Se a resposta não for ok, mas tiver dados, retornar os dados (pode ter erro personalizado)
            if (!response.ok && !data.success) {
                throw new Error(data.message || `Erro HTTP: ${response.status}`);
            }

            return data;

        } catch (error) {
            console.error('❌ Erro na requisição:', error);
            throw error;
        }
    }

    // Métodos de conveniência
    async get(endpoint, params = {}) {
        let url = endpoint;

        // Adicionar parâmetros de query se existirem
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

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data,
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data,
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Métodos específicos de autenticação
    async login(email, senha) {
        try {
            console.log('🔐 Enviando dados de login:', { email, senha: '***' });

            const resultado = await this.post('/auth/login', { email, senha });

            console.log('📋 Resposta completa do login:', resultado);

            if (resultado.success) {
                // Verificar diferentes estruturas de resposta
                let token = null;
                let usuario = null;

                // Formato 1: resultado.data.token
                if (resultado.data && resultado.data.token) {
                    token = resultado.data.token;
                    usuario = resultado.data.usuario || resultado.data.user;
                }
                // Formato 2: resultado.token (direto no resultado)
                else if (resultado.token) {
                    token = resultado.token;
                    usuario = resultado.usuario || resultado.user;
                }
                // Formato 3: resultado.data é o token
                else if (resultado.data && typeof resultado.data === 'string') {
                    token = resultado.data;
                }

                console.log('🔑 Token extraído:', token ? token.substring(0, 20) + '...' : 'NENHUM');
                console.log('👤 Usuário extraído:', usuario);

                if (token) {
                    // Salvar token e dados do usuário
                    localStorage.setItem('token', token);

                    if (usuario) {
                        localStorage.setItem('user', JSON.stringify(usuario));
                    }

                    console.log('✅ Dados salvos no localStorage');

                    // Retornar estrutura padronizada
                    return {
                        success: true,
                        message: 'Login realizado com sucesso',
                        data: {
                            token: token,
                            usuario: usuario
                        }
                    };
                } else {
                    console.error('❌ Token não encontrado na resposta');
                    return {
                        success: false,
                        message: 'Token não encontrado na resposta do servidor'
                    };
                }
            } else {
                console.error('❌ Login não foi bem-sucedido:', resultado.message);
                return resultado;
            }

        } catch (error) {
            console.error('❌ Erro no processo de login:', error);
            return {
                success: false,
                message: error.message || 'Erro ao fazer login'
            };
        }
    }

    async logout1() {
        try {
            await this.post('/auth/logout');
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            // Sempre limpar dados locais
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }

        return { success: true, message: 'Logout realizado com sucesso' };
    }

    async logout() {
        try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });

            // Limpar qualquer dado local
            localStorage.clear();
            sessionStorage.clear();

            // Redirecionar para login
            window.location.href = '/login';
        } catch (error) {
            console.error('Erro no logout:', error);
            // Mesmo com erro, redirecionar
            window.location.href = '/login';
        }
    }

    async verifyToken() {
        try {
            const resultado = await this.get('/auth/me');
            return resultado;
        } catch (error) {
            console.error('❌ Token inválido:', error);
            // Se o token for inválido, limpar dados locais
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return { success: false, message: 'Token inválido' };
        }
    }

    async forgotPassword(email) {
        return this.post('/auth/forgot-password', { email });
    }

    async resetPassword(token, nova_senha) {
        return this.post('/auth/reset-password', { token, nova_senha });
    }
}

// Criar instância e exportar tanto como default quanto como nomeado
const apiService = new ApiService();

// Exportar ambos os formatos para compatibilidade
export { apiService };
export default apiService;