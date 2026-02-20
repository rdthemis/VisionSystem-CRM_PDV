// index.js - Export barrel para facilitar importações
export { default } from './Caixa';
export { default as CaixaHeader } from './components/CaixaHeader';
export { default as ResumoFinanceiro } from './components/ResumoFinanceiro';
export { default as FormularioAbertura } from './components/FormularioAbertura';
export { default as FormularioMovimento } from './components/FormularioMovimento';
export { default as ListaMovimentos } from './components/ListaMovimentos';
export { default as FiltrosPeriodo } from './components/FiltrosPeriodo';
export { default as ModalFechamento } from './components/ModalFechamento';
export { useCaixa } from './hooks/useCaixa';
