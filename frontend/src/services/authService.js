// frontend/src/services/authService.js
// 🔐 SERVICE DE AUTENTICAÇÃO COM TOKENS SEGUROS

import apiService from './apiService';

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

const authService = {
  /**
   * 🔐 LOGIN
   */
  login: async (email, senha) => {
    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (data.success) {
        // Armazenar tokens
        localStorage.setItem(TOKEN_KEY, data.data.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.data.refreshToken);
        localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));

        // Configurar interceptor para adicionar token
        apiService.setAuthToken(data.data.accessToken);

        // Iniciar renovação automática
        authService.startTokenRefresh();

        return data;
      }

      throw new Error(data.message || 'Erro ao fazer login');
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    }
  },

  /**
   * 🚪 LOGOUT
   */
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken) {
        await fetch('http://localhost:8000/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authService.getToken()}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('❌ Erro no logout:', error);
    } finally {
      // Limpar dados locais
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      // Parar renovação automática
      authService.stopTokenRefresh();

      // Redirecionar para login
      window.location.href = '/login';
    }
  },

  /**
   * 🔄 RENOVAR TOKEN
   */
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await fetch('http://localhost:8000/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (data.success) {
        // Atualizar access token
        localStorage.setItem(TOKEN_KEY, data.data.accessToken);
        apiService.setAuthToken(data.data.accessToken);

        console.log('✅ Token renovado com sucesso');
        return data.data.accessToken;
      }

      throw new Error(data.message || 'Erro ao renovar token');
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);

      // Se falhar, fazer logout
      authService.logout();
      throw error;
    }
  },

  /**
   * ⏰ INICIAR RENOVAÇÃO AUTOMÁTICA DE TOKEN
   */
  startTokenRefresh: () => {
    // Limpar intervalo anterior se existir
    authService.stopTokenRefresh();

    // Renovar a cada 10 minutos (token expira em 15 minutos)
    const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutos

    authService.refreshInterval = setInterval(() => {
      console.log('🔄 Renovando token automaticamente...');
      authService.refreshToken();
    }, REFRESH_INTERVAL);
  },

  /**
   * ⏹️ PARAR RENOVAÇÃO AUTOMÁTICA
   */
  stopTokenRefresh: () => {
    if (authService.refreshInterval) {
      clearInterval(authService.refreshInterval);
      authService.refreshInterval = null;
    }
  },

  /**
   * 🔐 ALTERAR SENHA
   */
  alterarSenha: async (senhaAtual, senhaNova) => {
    try {
      const response = await apiService.put('/auth/alterar-senha', {
        senhaAtual,
        senhaNova,
      });

      return response;
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      throw error;
    }
  },

  /**
   * 👤 OBTER DADOS DO USUÁRIO AUTENTICADO
   */
  getMe: async () => {
    try {
      const response = await apiService.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter dados do usuário:', error);
      throw error;
    }
  },

  /**
   * 📊 LISTAR SESSÕES ATIVAS
   */
  getSessoes: async () => {
    try {
      const response = await apiService.get('/auth/sessoes');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar sessões:', error);
      throw error;
    }
  },

  /**
   * 🗑️ REVOGAR TODAS AS SESSÕES (EXCETO ATUAL)
   */
  revogarSessoes: async () => {
    try {
      const response = await apiService.delete('/auth/sessoes');
      return response;
    } catch (error) {
      console.error('❌ Erro ao revogar sessões:', error);
      throw error;
    }
  },

  /**
   * 🎫 OBTER TOKEN ATUAL
   */
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * 🔄 OBTER REFRESH TOKEN
   */
  getRefreshToken: () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * 👤 OBTER USUÁRIO ATUAL
   */
  getUser: () => {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  },

  /**
   * ✅ VERIFICAR SE ESTÁ AUTENTICADO
   */
  isAuthenticated: () => {
    const token = authService.getToken();
    const refreshToken = authService.getRefreshToken();
    return !!(token && refreshToken);
  },

  /**
   * 🔍 VERIFICAR SE TOKEN ESTÁ EXPIRADO
   */
  isTokenExpired: (token) => {
    try {
      // Decodificar payload do JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;

      return payload.exp < now;
    } catch (error) {
      return true;
    }
  },

  /**
   * 🚀 INICIALIZAR (chamar ao carregar app)
   */
  initialize: () => {
    const token = authService.getToken();

    if (token) {
      // Configurar token no apiService
      apiService.setAuthToken(token);

      // Iniciar renovação automática
      authService.startTokenRefresh();

      // Verificar se token está expirado
      if (authService.isTokenExpired(token)) {
        console.log('⚠️ Token expirado, tentando renovar...');
        authService.refreshToken();
      }
    }
  },
};

// Inicializar ao importar
authService.initialize();

export default authService;
