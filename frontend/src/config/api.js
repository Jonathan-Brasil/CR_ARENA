// Configuração da API
// Usa a variável de ambiente VITE_API_URL definida no .env
// Em produção (Vercel), configure a variável nas settings do projeto
// Em desenvolvimento, usa localhost:3001 como fallback

const API_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '') // Remove barra final se existir
    : 'http://localhost:3001';

export default API_URL;
