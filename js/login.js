// Estado da sessão
let usuarioLogado = null;

// Verificar se já está logado
async function verificarSessao() {
    const sessao = localStorage.getItem('usuario_estoque');
    if (sessao) {
        try {
            const usuario = JSON.parse(sessao);
            const agora = new Date().getTime();
            const loginTime = usuario.login_time || 0;
            const diffHoras = (agora - loginTime) / (1000 * 60 * 60);
            
            if (diffHoras < 24) {
                usuarioLogado = usuario;
                return true;
            } else {
                localStorage.removeItem('usuario_estoque');
                return false;
            }
        } catch (e) {
            localStorage.removeItem('usuario_estoque');
            return false;
        }
    }
    return false;
}

// Mostrar mensagem de login
function mostrarMensagemLogin(mensagem, tipo) {
    const div = document.getElementById('login-mensagem');
    if (div) {
        div.innerHTML = `<div class="${tipo === 'success' ? 'mensagem-sucesso' : 'mensagem-erro'}">${mensagem}</div>`;
        setTimeout(() => {
            if (div) div.innerHTML = '';
        }, 3000);
    } else {
        alert(mensagem);
    }
}

// Carregar tela de login
function carregarLogin() {
    const main = document.getElementById('conteudo-principal');
    if (!main) return;
    
    main.innerHTML = `
        <style>
            .login-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 80vh;
                padding: 20px;
            }
            .login-card {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 450px;
                width: 100%;
                overflow: hidden;
            }
            .login-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .login-header h1 { font-size: 28px; margin-bottom: 5px; }
            .login-header p { opacity: 0.9; font-size: 14px; }
            .login-body { padding: 30px; }
            .form-group { margin-bottom: 20px; }
            .form-group label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
            .form-group input {
                width: 100%;
                padding: 12px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 14px;
            }
            .form-group input:focus { border-color: #667eea; outline: none; }
            .btn-login {
                width: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
            }
            .btn-login:hover { transform: translateY(-2px); }
            .link-cadastro {
                text-align: center;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
            }
            .link-cadastro a { color: #667eea; text-decoration: none; cursor: pointer; }
            .mensagem-erro { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 8px; margin-bottom: 20px; }
            .mensagem-sucesso { background: #d4edda; color: #155724; padding: 10px; border-radius: 8px; margin-bottom: 20px; }
            .g-recaptcha { margin-bottom: 10px; }
        </style>
        
        <div class="login-container">
            <div class="login-card">
                <div class="login-header">
                    <h1>📦 Sistema de Estoque</h1>
                    <p>Faça login para continuar</p>
                </div>
                <div class="login-body">
                    <div id="login-mensagem"></div>
                    <form id="form-login">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="login-email" required placeholder="seu@email.com">
                        </div>
                        <div class="form-group">
                            <label>Senha</label>
                            <input type="password" id="login-senha" required placeholder="********">
                        </div>
                        <div id="captcha-container" class="form-group"></div>
                        <button type="submit" class="btn-login">Entrar</button>
                    </form>
                    <div class="link-cadastro">
                        <a onclick="carregarCadastro()">🔑 Não tem uma conta? Cadastre-se</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar captcha se disponível
    if (typeof adicionarCaptcha === 'function') {
        adicionarCaptcha();
    } else {
        console.log('Captcha não disponível');
    }
    
    const form = document.getElementById('form-login');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await fazerLogin();
        });
    }
}

// Fazer login com segurança
async function fazerLogin() {
    const email = document.getElementById('login-email')?.value;
    const senha = document.getElementById('login-senha')?.value;
    
    if (!email || !senha) {
        mostrarMensagemLogin('Preencha email e senha!', 'error');
        return;
    }
    
    // 1. VERIFICAR CAPTCHA
    let captchaValido = true;
    if (typeof verificarCaptcha === 'function') {
        captchaValido = await verificarCaptcha();
        if (!captchaValido) {
            mostrarMensagemLogin('❌ Verificação de segurança falhou!', 'error');
            if (typeof resetarCaptcha === 'function') resetarCaptcha();
            return;
        }
    }
    
    // 2. VERIFICAR BLOQUEIO POR TENTATIVAS
    if (typeof verificarBloqueio === 'function') {
        const bloqueio = await verificarBloqueio(email);
        if (bloqueio && bloqueio.bloqueado) {
            const msg = `🔒 Conta temporariamente bloqueada!\n\nMuitas tentativas incorretas (${bloqueio.tentativas} tentativas).\nAguarde ${bloqueio.tempoRestante} minutos para tentar novamente.`;
            alert(msg);
            mostrarMensagemLogin(`Conta bloqueada! Aguarde ${bloqueio.tempoRestante} minutos.`, 'error');
            return;
        }
    }
    
    try {
        const { data: usuario, error } = await window.supabaseClient
            .from('usuarios')
            .select('id, nome, email, tipo, nivel, ativo')
            .eq('email', email)
            .eq('senha', senha)
            .eq('ativo', true)
            .maybeSingle();
        
        if (error) {
            // Registrar tentativa com erro
            if (typeof registrarTentativaLogin === 'function') {
                await registrarTentativaLogin(email, false, 'Erro no sistema: ' + error.message);
            }
            mostrarMensagemLogin('Erro ao fazer login. Tente novamente.', 'error');
            if (typeof resetarCaptcha === 'function') resetarCaptcha();
            return;
        }
        
        if (!usuario) {
            // Registrar tentativa FALHA (senha incorreta)
            if (typeof registrarTentativaLogin === 'function') {
                await registrarTentativaLogin(email, false, 'Senha incorreta');
            }
            mostrarMensagemLogin('Email ou senha incorretos!', 'error');
            if (typeof resetarCaptcha === 'function') resetarCaptcha();
            return;
        }
        
        // Registrar tentativa BEM SUCEDIDA
        if (typeof registrarTentativaLogin === 'function') {
            await registrarTentativaLogin(email, true, 'Login bem sucedido');
        }
        
        // Registrar log de acesso básico
        try {
            await window.supabaseClient
                .from('logs_acesso')
                .insert([{ usuario_id: usuario.id, acao: 'login', ip: 'web' }]);
        } catch (logError) { console.warn(logError); }
        
        await window.supabaseClient
            .from('usuarios')
            .update({ ultimo_acesso: new Date().toISOString() })
            .eq('id', usuario.id);
        
        // Salvar sessão
        usuarioLogado = { 
            ...usuario, 
            login_time: new Date().getTime(),
            isAdmin: usuario.email === '11@1' || usuario.nivel === 'admin'
        };
        localStorage.setItem('usuario_estoque', JSON.stringify(usuarioLogado));
        
        // SALVAR LOG DETALHADO (GEOLOCALIZAÇÃO)
        try {
            if (typeof salvarLogAcesso === 'function') {
                await salvarLogAcesso(usuario.id, usuario.email, usuario.nome);
                console.log('✅ Log detalhado salvo com sucesso');
            }
        } catch (logDetailError) {
            console.error('Erro ao salvar log detalhado:', logDetailError);
        }
        
        mostrarMensagemLogin(`✅ Bem-vindo, ${usuario.nome}!`, 'success');
        
        // Resetar captcha
        if (typeof resetarCaptcha === 'function') resetarCaptcha();
        
        setTimeout(() => {
            const navButtons = document.querySelector('.nav-buttons');
            if (navButtons) navButtons.style.display = 'flex';
            if (typeof carregarPagina === 'function') carregarPagina('dashboard');
            atualizarNomeUsuario(usuario.nome);
            
            // Iniciar monitor de inatividade
            if (typeof iniciarMonitorInatividade === 'function') {
                iniciarMonitorInatividade();
            }
            
            if (usuarioLogado.isAdmin) {
                mostrarBotaoAdmin();
            }
        }, 1000);
        
    } catch (error) {
        console.error('Erro:', error);
        // Registrar erro de tentativa
        if (typeof registrarTentativaLogin === 'function') {
            await registrarTentativaLogin(email, false, 'Erro no sistema: ' + error.message);
        }
        mostrarMensagemLogin('Erro ao fazer login: ' + error.message, 'error');
        if (typeof resetarCaptcha === 'function') resetarCaptcha();
    }
}

function mostrarBotaoAdmin() {
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons && !document.querySelector('.nav-btn[data-page="usuarios"]')) {
        const btnAdmin = document.createElement('button');
        btnAdmin.className = 'nav-btn';
        btnAdmin.setAttribute('data-page', 'usuarios');
        btnAdmin.innerHTML = '<span class="icon">👥</span> Usuários';
        btnAdmin.onclick = () => carregarPagina('usuarios');
        navButtons.appendChild(btnAdmin);
    }
}

// Carregar cadastro
function carregarCadastro() {
    const main = document.getElementById('conteudo-principal');
    if (!main) return;
    
    main.innerHTML = `
        <style>
            .cadastro-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 80vh;
                padding: 20px;
            }
            .cadastro-card {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 500px;
                width: 100%;
                overflow: hidden;
            }
            .cadastro-header {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .cadastro-header h1 { font-size: 28px; margin-bottom: 5px; }
            .cadastro-body { padding: 30px; }
            .btn-cadastrar {
                width: 100%;
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                padding: 12px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
            }
            .btn-cadastrar:hover { transform: translateY(-2px); }
            .link-login {
                text-align: center;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
            }
            .link-login a { color: #28a745; text-decoration: none; cursor: pointer; }
            .mensagem-erro { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 8px; margin-bottom: 20px; }
            .mensagem-sucesso { background: #d4edda; color: #155724; padding: 10px; border-radius: 8px; margin-bottom: 20px; }
        </style>
        
        <div class="cadastro-container">
            <div class="cadastro-card">
                <div class="cadastro-header">
                    <h1>📝 Criar Conta</h1>
                    <p>Cadastre-se para acessar o sistema</p>
                </div>
                <div class="cadastro-body">
                    <div id="cadastro-mensagem"></div>
                    <form id="form-cadastro">
                        <div class="form-group">
                            <label>Nome Completo *</label>
                            <input type="text" id="cadastro-nome" required placeholder="Seu nome completo">
                        </div>
                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" id="cadastro-email" required placeholder="seu@email.com">
                        </div>
                        <div class="form-group">
                            <label>Senha *</label>
                            <input type="password" id="cadastro-senha" required placeholder="Mínimo 6 caracteres">
                        </div>
                        <div class="form-group">
                            <label>Confirmar Senha *</label>
                            <input type="password" id="cadastro-confirmar-senha" required placeholder="Digite a senha novamente">
                        </div>
                        <button type="submit" class="btn-cadastrar">Cadastrar</button>
                    </form>
                    <div class="link-login">
                        <a onclick="carregarLogin()">🔙 Já tenho uma conta? Faça login</a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const form = document.getElementById('form-cadastro');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await fazerCadastro();
        });
    }
}

// Fazer cadastro
async function fazerCadastro() {
    const nome = document.getElementById('cadastro-nome')?.value;
    const email = document.getElementById('cadastro-email')?.value;
    const senha = document.getElementById('cadastro-senha')?.value;
    const confirmarSenha = document.getElementById('cadastro-confirmar-senha')?.value;
    
    if (!nome || !email || !senha) {
        mostrarMensagemCadastro('Preencha todos os campos!', 'error');
        return;
    }
    
    if (senha !== confirmarSenha) {
        mostrarMensagemCadastro('As senhas não conferem!', 'error');
        return;
    }
    
    if (senha.length < 6) {
        mostrarMensagemCadastro('A senha deve ter pelo menos 6 caracteres!', 'error');
        return;
    }
    
    try {
        const { data: existente } = await window.supabaseClient
            .from('usuarios')
            .select('id')
            .eq('email', email)
            .maybeSingle();
        
        if (existente) {
            mostrarMensagemCadastro('Este email já está cadastrado!', 'error');
            return;
        }
        
        const { error } = await window.supabaseClient
            .from('usuarios')
            .insert([{ nome, email, senha, tipo: 'usuario', nivel: 'usuario', ativo: true }]);
        
        if (error) throw error;
        
        mostrarMensagemCadastro('✅ Cadastro realizado com sucesso! Redirecionando...', 'success');
        
        setTimeout(() => carregarLogin(), 2000);
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagemCadastro('Erro ao cadastrar: ' + error.message, 'error');
    }
}

function mostrarMensagemCadastro(mensagem, tipo) {
    const div = document.getElementById('cadastro-mensagem');
    if (div) {
        div.innerHTML = `<div class="${tipo === 'success' ? 'mensagem-sucesso' : 'mensagem-erro'}">${mensagem}</div>`;
        setTimeout(() => { if (div) div.innerHTML = ''; }, 3000);
    }
}

// Logout
function fazerLogout() {
    // Atualizar tempo de permanência antes de sair
    if (usuarioLogado && usuarioLogado.id && typeof atualizarTempoPermanencia === 'function') {
        atualizarTempoPermanencia(usuarioLogado.id);
    }
    
    localStorage.removeItem('usuario_estoque');
    usuarioLogado = null;
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons) navButtons.style.display = 'none';
    const userInfo = document.getElementById('usuario-info');
    if (userInfo) userInfo.remove();
    carregarLogin();
}

// Atualizar nome do usuário
function atualizarNomeUsuario(nome) {
    let userInfo = document.getElementById('usuario-info');
    const header = document.querySelector('header');
    if (!header) return;
    
    if (userInfo) {
        const nomeSpan = document.getElementById('usuario-nome');
        if (nomeSpan) nomeSpan.textContent = nome;
    } else {
        userInfo = document.createElement('div');
        userInfo.id = 'usuario-info';
        userInfo.style.cssText = 'position: absolute; top: 20px; right: 30px; color: white; text-align: right;';
        userInfo.innerHTML = `
            <div style="font-size: 14px; opacity: 0.9;">Bem-vindo,</div>
            <div id="usuario-nome" style="font-weight: bold; font-size: 16px;">${nome}</div>
            <button onclick="fazerLogout()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 5px; margin-top: 5px; cursor: pointer; font-size: 12px;">🚪 Sair</button>
        `;
        header.style.position = 'relative';
        header.appendChild(userInfo);
        
        if (usuarioLogado && usuarioLogado.isAdmin) {
            const badge = document.createElement('div');
            badge.style.cssText = 'background: #ffc107; color: #333; font-size: 10px; padding: 2px 8px; border-radius: 12px; margin-top: 5px; text-align: center;';
            badge.innerHTML = '👑 ADMIN';
            userInfo.appendChild(badge);
        }
    }
}

// Verificar autenticação
async function verificarAutenticacao() {
    const estaLogado = await verificarSessao();
    
    if (estaLogado && usuarioLogado) {
        const navButtons = document.querySelector('.nav-buttons');
        if (navButtons) navButtons.style.display = 'flex';
        atualizarNomeUsuario(usuarioLogado.nome);
        
        if (usuarioLogado.isAdmin) {
            mostrarBotaoAdmin();
        }
        
        // Iniciar monitor de inatividade
        if (typeof iniciarMonitorInatividade === 'function') {
            iniciarMonitorInatividade();
        }
        
        if (typeof carregarPagina === 'function') carregarPagina('dashboard');
        return true;
    } else {
        const navButtons = document.querySelector('.nav-buttons');
        if (navButtons) navButtons.style.display = 'none';
        carregarLogin();
        return false;
    }
}