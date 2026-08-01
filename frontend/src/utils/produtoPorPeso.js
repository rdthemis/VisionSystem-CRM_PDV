// src/utils/produtoPorPeso.js
// Identifica produtos vendidos por peso (ex: sorvetes), que aceitam quantidade
// fracionada em kg com até 3 casas decimais (gramas).

const CATEGORIAS_POR_PESO = ['sorvetes'];

/**
 * Verifica se uma categoria de produto é vendida por peso (kg)
 * @param {string} categoriaNome
 * @returns {boolean}
 */
export const ehProdutoPorPeso = (categoriaNome) => {
    const categoria = (categoriaNome || '').toLowerCase();
    return CATEGORIAS_POR_PESO.some(cat => categoria.includes(cat));
};

/**
 * Arredonda uma quantidade para até 3 casas decimais (gramas)
 * @param {number} valor
 * @returns {number}
 */
export const arredondarQuantidadePeso = (valor) => Math.round(valor * 1000) / 1000;
