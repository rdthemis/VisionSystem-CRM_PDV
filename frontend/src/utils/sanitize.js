// frontend/src/utils/sanitize.js

export const sanitize = {

    html(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    url(url) {
        try {
            const parsed = new URL(url);
            // Permitir apenas http e https
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                return '#';
            }
            return url;
        } catch {
            return '#';
        }
    },

    number(value) {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    },

    currency(value) {
        const num = this.number(value);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(num);
    }
};