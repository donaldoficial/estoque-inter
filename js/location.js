// =============================================
// COLETA COMPLETA DE INFORMAÇÕES DO USUÁRIO
// =============================================

// Função para obter IP público e localização
async function obterGeolocalizacao() {
    try {
        // Usando API gratuita ipapi.co
        const response = await fetch('https://ipapi.co/json/');
        const dados = await response.json();
        
        return {
            ip_publico: dados.ip || null,
            provedor: dados.org || dados.asn || null,
            pais: dados.country_name || null,
            estado: dados.region || null,
            cidade: dados.city || null,
            latitude: dados.latitude || null,
            longitude: dados.longitude || null,
            cep: dados.postal || null
        };
    } catch (error) {
        console.error('Erro ao obter localização:', error);
        return {
            ip_publico: null,
            provedor: null,
            pais: null,
            estado: null,
            cidade: null,
            latitude: null,
            longitude: null,
            cep: null
        };
    }
}

// Função para obter IP local (WebRTC)
async function obterIpLocal() {
    return new Promise((resolve) => {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
        
        pc.onicecandidate = (ice) => {
            if (!ice || !ice.candidate || !ice.candidate.candidate) return;
            
            const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/;
            const match = ipRegex.exec(ice.candidate.candidate);
            
            if (match) {
                resolve(match[0]);
                pc.close();
            }
        };
        
        setTimeout(() => resolve(null), 2000);
    });
}

// Função para obter informações do navegador
function obterInfoNavegador() {
    const ua = navigator.userAgent;
    
    // Detectar navegador
    let navegador = 'Desconhecido';
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) navegador = 'Chrome';
    else if (ua.indexOf('Firefox') > -1) navegador = 'Firefox';
    else if (ua.indexOf('Safari') > -1) navegador = 'Safari';
    else if (ua.indexOf('Edge') > -1) navegador = 'Edge';
    else if (ua.indexOf('Opera') > -1) navegador = 'Opera';
    else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) navegador = 'Internet Explorer';
    
    // Versão do navegador
    const versaoMatch = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+\.\d+)/);
    if (versaoMatch) navegador += ` ${versaoMatch[2]}`;
    
    return navegador;
}

// Função para obter sistema operacional
function obterSO() {
    const ua = navigator.userAgent;
    
    if (ua.indexOf('Windows NT 10.0') > -1) return 'Windows 10';
    if (ua.indexOf('Windows NT 6.3') > -1) return 'Windows 8.1';
    if (ua.indexOf('Windows NT 6.2') > -1) return 'Windows 8';
    if (ua.indexOf('Windows NT 6.1') > -1) return 'Windows 7';
    if (ua.indexOf('Mac OS X') > -1) return 'macOS';
    if (ua.indexOf('Linux') > -1 && ua.indexOf('Android') === -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('iPhone') > -1) return 'iOS';
    if (ua.indexOf('iPad') > -1) return 'iPadOS';
    
    return 'Desconhecido';
}

// Função para obter tipo de dispositivo
function obterTipoDispositivo() {
    const ua = navigator.userAgent;
    
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
    if (/(mobi|android|touch|kindle|phone|blackberry|series40|nokia|windows\s+phone)/i.test(ua)) return 'Mobile';
    
    return 'Desktop';
}

// Função para coletar todas as informações
async function coletarTodasInformacoes() {
    const localizacao = await obterGeolocalizacao();
    const ipLocal = await obterIpLocal();
    
    return {
        // Geolocalização
        ip_publico: localizacao.ip_publico,
        ip_local: ipLocal,
        provedor: localizacao.provedor,
        pais: localizacao.pais,
        estado: localizacao.estado,
        cidade: localizacao.cidade,
        latitude: localizacao.latitude,
        longitude: localizacao.longitude,
        cep: localizacao.cep,
        
        // Navegador e dispositivo
        navegador: obterInfoNavegador(),
        sistema_operacional: obterSO(),
        tipo_dispositivo: obterTipoDispositivo(),
        fuso_horario: Intl.DateTimeFormat().resolvedOptions().timeZone,
        resolucao_tela: `${screen.width}x${screen.height}`,
        idioma: navigator.language || navigator.userLanguage,
        
        // Página
        pagina_acessada: window.location.pathname,
        url_completa: window.location.href,
        data_hora: new Date().toISOString()
    };
}

// Função para salvar o log no banco
async function salvarLogAcesso(usuarioId, usuarioEmail, usuarioNome) {
    try {
        const info = await coletarTodasInformacoes();
        
        const { error } = await window.supabaseClient
            .from('logs_acesso_completo')
            .insert({
                usuario_id: usuarioId,
                usuario_email: usuarioEmail,
                usuario_nome: usuarioNome,
                ip_publico: info.ip_publico,
                ip_local: info.ip_local,
                provedor: info.provedor,
                pais: info.pais,
                estado: info.estado,
                cidade: info.cidade,
                latitude: info.latitude,
                longitude: info.longitude,
                cep: info.cep,
                navegador: info.navegador,
                sistema_operacional: info.sistema_operacional,
                tipo_dispositivo: info.tipo_dispositivo,
                fuso_horario: info.fuso_horario,
                resolucao_tela: info.resolucao_tela,
                idioma: info.idioma,
                pagina_acessada: info.pagina_acessada,
                url_completa: info.url_completa,
                data_hora: info.data_hora
            });
        
        if (error) {
            console.error('Erro ao salvar log:', error);
        } else {
            console.log('✅ Log de acesso salvo com sucesso');
        }
    } catch (error) {
        console.error('Erro ao coletar informações:', error);
    }
}

// Registrar tempo de início da sessão
let inicioSessao = Date.now();

// Função para atualizar tempo de permanência ao sair
async function atualizarTempoPermanencia(usuarioId) {
    const tempoPermanencia = Math.floor((Date.now() - inicioSessao) / 1000);
    
    // Atualizar o último log do usuário com o tempo de permanência
    const { error } = await window.supabaseClient
        .from('logs_acesso_completo')
        .update({ tempo_permanencia: tempoPermanencia })
        .eq('usuario_id', usuarioId)
        .order('data_hora', { ascending: false })
        .limit(1);
    
    if (error) console.error('Erro ao atualizar tempo:', error);
}

// Evento de saída da página
window.addEventListener('beforeunload', () => {
    if (usuarioLogado && usuarioLogado.id) {
        atualizarTempoPermanencia(usuarioLogado.id);
    }
});