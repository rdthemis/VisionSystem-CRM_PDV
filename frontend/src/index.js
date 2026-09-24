import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CardapioDigital from './pages/Cardapio/CardapioGelattoMannia';
import '@fortawesome/fontawesome-free/css/all.min.css';
import reportWebVitals from './reportWebVitals';
import Logger from './utils/Logger';
const root = ReactDOM.createRoot(document.getElementById('root'));

// Verificar se está em produção sem HTTPS
if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
  Logger.warn('AVISO: Site não está usando HTTPS!', {warn: true});
  window.location.href = 'https://' + window.location.hostname + window.location.pathname;
}

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Rota Raiz (/) -> Agora abre direto o Cardápio do Cliente */}
        <Route path="/" element={<CardapioDigital />} />
        
        {/* Rota do PDV -> Protegida em um caminho específico */}
        <Route path="/pdv" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(Logger.info))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
