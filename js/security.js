// =============================================
// SISTEMA DE SEGURANÇA DO LOGIN
// =============================================

let tempoInatividade = null;
let tentativasLogin = 0;
const RECAPTCHA_SITE_KEY = '6LfOm9QsAAAAACe63R1zsiyACnHWRf7OmUG0Z2Xl';

// =============================================
// 1. LOGOUT AUTOMÁTICO POR INATIVIDADE (15 MIN)
// =============================================

function iniciarMonitorInatividade() {
    if (!usuarioLogado) return;
    
    const resetTimer = () => {
        if (tempoInatividade) clearTimeout(tempoInatividade);
        tempoInatividade = setTimeout(() => {
            if (usuarioLogado && usuarioLogado.id) {
                alert('⏰ Sessão expirada por inatividade (15 minutos sem ação). Faça login novamente.');
                fazerLogout();
            }
        }, 15 * 60 * 1000);
    };
    
    const eventos = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    eventos.forEach(evento => {
        document.removeEventListener(evento, resetTimer);
        document.addEventListener(evento, resetTimer);
    });
    
    resetTimer();
}

// =============================================
// 2. LIMITE DE TENTATIVAS DE LOGIN
// =============================================

async function registrarTentativaLogin(email, sucesso, motivo = null) {
    try {
        let ip = 'desconhecido';
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const dados = await res.json();
            ip = dados.ip;
        } catch (e) {
            console.warn('Não foi possível obter IP');
        }
        
        await window.supabaseClient
            .from('logs_tentativas')
            .insert([{
                email_tentativa: email,
                ip: ip,
                tipo: sucesso ? 'sucesso' : 'falha',
                detalhes: motivo || (sucesso ? 'Login bem sucedido' : 'Senha incorreta'),
                data_tentativa: new Date().toISOString()
            }]);
    } catch (error) {
        console.error('Erro ao registrar tentativa:', error);
    }
}

async function verificarBloqueio(email) {
    try {
        const quinzeMinAtras = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        
        const { data: tentativas, error } = await window.supabaseClient
            .from('logs_tentativas')
            .select('id')
            .eq('email_tentativa', email)
            .eq('tipo', 'falha')
            .gte('data_tentativa', quinzeMinAtras);
        
        if (error) throw error;
        
        const totalTentativas = tentativas?.length || 0;
        
        if (totalTentativas >= 5) {
            return { bloqueado: true, tentativas: totalTentativas, tempoRestante: 15 };
        }
        
        return { bloqueado: false, tentativas: totalTentativas, tempoRestante: 0 };
    } catch (error) {
        console.error('Erro ao verificar bloqueio:', error);
        return { bloqueado: false, tentativas: 0, tempoRestante: 0 };
    }
}

// =============================================
// 3. CAPTCHA (Google reCAPTCHA)
// =============================================

let captchaCarregado = false;

function carregarScriptCaptcha() {
    if (document.getElementById('recaptcha-script')) return;
    
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
        captchaCarregado = true;
        console.log('✅ Captcha carregado');
    };
    document.head.appendChild(script);
}

function adicionarCaptcha() {
    const container = document.getElementById('captcha-container');
    if (!container) return;
    
    // Se já tem captcha, não recriar
    if (container.querySelector('.g-recaptcha')) return;
    
    carregarScriptCaptcha();
    
    // Aguardar o script carregar
    const tentarAdicionar = () => {
        if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
            container.innerHTML = `
                <div class="g-recaptcha" data-sitekey="${RECAPTCHA_SITE_KEY}"></div>
                <small style="color: #666;">✅ Clique no "Não sou um robô" para verificar</small>
            `;
            // Renderizar o captcha
            grecaptcha.render(container.querySelector('.g-recaptcha'), {
                sitekey: RECAPTCHA_SITE_KEY
            });
        } else {
            setTimeout(tentarAdicionar, 200);
        }
    };
    
    tentarAdicionar();
}

async function verificarCaptcha() {
    const captchaResponse = document.querySelector('#g-recaptcha-response')?.value;
    
    if (!captchaResponse) {
        return false;
    }
    
    return true;
}

function resetarCaptcha() {
    if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) {
        try {
            grecaptcha.reset();
        } catch (e) {
            console.log('Erro ao resetar captcha:', e);
        }
    }
}