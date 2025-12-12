// Configuração da API
// Em produção (Vercel), usa a URL do backend no Vercel
// Em desenvolvimento, usa localhost

const API_URL = import.meta.env.PROD
    ? 'https://projeto-cr.vercel.app'
    : 'http://localhost:3001';

export default API_URL;
