import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import '@fortawesome/fontawesome-free/css/all.min.css';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
// Verificar se está em produção sem HTTPS
if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
  console.warn('⚠️ AVISO: Site não está usando HTTPS!');
  // Em produção real, forçar redirect:
  // window.location.href = 'https://' + window.location.hostname + window.location.pathname;
}
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
