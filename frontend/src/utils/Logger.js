// src/utils/Logger.js
// 📝 HELPER: Sistema de log inteligente para o frontend

const isDev = process.env.NODE_ENV === 'development';

const Logger = {
  /**
   * Debug - SÓ aparece em desenvolvimento
   */
  debug: (message, context = {}) => {
    if (!isDev) return;
    console.log(`[DEBUG] ${message}`, context);
  },

  /**
   * Info - eventos importantes do sistema
   */
  info: (message, context = {}) => {
    if (!isDev) return;
    console.info(`[INFO] ${message}`, context);
  },

  /**
   * Warn - situações estranhas mas não críticas
   */
  warn: (message, context = {}) => {
    console.warn(`[WARN] ${message}`, context);
  },

  /**
   * Error - erros reais (sempre aparece)
   */
  error: (message, context = {}) => {
    console.error(`[ERROR] ${message}`, context);
  },
};

export default Logger;