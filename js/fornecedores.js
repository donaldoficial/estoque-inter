async function carregarFornecedores() {
    const main = document.getElementById('conteudo-principal');
    
    main.innerHTML = `
        <style>
            .form-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
            }
            .botoes-acoes {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            @media (max-width: 768px) {
                .form-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
        
        <h1 style="margin-bottom: 25px;">🏢 Cadastro de Fornecedores</h1>
        
        <div class="card">
            <div class="card-header">➕ Novo Fornecedor</div>
            <form id="form-fornecedor">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Nome do Fornecedor *</label>
                        <input type="text" id="forn-nome" required placeholder="Nome completo do fornecedor">
                    </div>
                    <div class="form-group">
                        <label>CNPJ</label>
                        <input type="text" id="forn-cnpj" placeholder="00.000.000/0001-00">
                        <small style="color: #666;">Opcional, mas não pode repetir</small>
                    </div>
                    <div class="form-group">
                        <label>Telefone</label>
                        <input type="text" id="forn-telefone" placeholder="(00) 00000-0000">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="forn-email" placeholder="contato@fornecedor.com">
                    </div>
                    <div class="form-group">
                        <label>Endereço</label>
                        <textarea id="forn-endereco" rows="3" placeholder="Rua, número, bairro, cidade - UF"></textarea>
                    </div>
                </div>
                <div class="botoes-acoes">
                    <button type="submit">Cadastrar Fornecedor</button>
                    <button type="button" onclick="limparFormularioFornecedor()" style="background: #6c757d;">Limpar</button>
                </div>
            </form>
        </div>
        
        <div class="card">
            <div class="card-header">📋 Lista de Fornecedores</div>
            <div class="table-wrapper">
                <div id="lista-fornecedores">Carregando...</div>
            </div>
        </div>
        <div id="mensagem"></div>
    `;
    
    await listarFornecedores();
    
    document.getElementById('form-fornecedor').addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarFornecedor();
    });
}

function limparFormularioFornecedor() {
    document.getElementById('forn-nome').value = '';
    document.getElementById('forn-cnpj').value = '';
    document.getElementById('forn-telefone').value = '';
    document.getElementById('forn-email').value = '';
    document.getElementById('forn-endereco').value = '';
    document.getElementById('forn-nome').focus();
}

async function salvarFornecedor() {
    const nome = document.getElementById('forn-nome').value.trim();
    const cnpj = document.getElementById('forn-cnpj').value.trim();
    const telefone = document.getElementById('forn-telefone').value.trim();
    const email = document.getElementById('forn-email').value.trim();
    const endereco = document.getElementById('forn-endereco').value.trim();
    
    if (!nome) {
        showMessage('O nome do fornecedor é obrigatório!', 'error');
        return;
    }
    
    // Se CNPJ foi informado, verificar se já existe
    if (cnpj) {
        const { data: existente } = await window.supabaseClient
            .from('fornecedores')
            .select('id')
            .eq('cnpj', cnpj)
            .maybeSingle();
        
        if (existente) {
            showMessage(`❌ CNPJ ${cnpj} já está cadastrado para outro fornecedor!`, 'error');
            return;
        }
    }
    
    const fornecedor = {
        nome: nome,
        cnpj: cnpj || null,
        telefone: telefone || null,
        email: email || null,
        endereco: endereco || null
    };
    
    const { error } = await window.supabaseClient.from('fornecedores').insert([fornecedor]);
    
    if (error) {
        if (error.code === '23505') {
            showMessage('❌ Este CNPJ já está cadastrado! Por favor, use um CNPJ diferente.', 'error');
        } else {
            showMessage('Erro ao cadastrar fornecedor: ' + error.message, 'error');
        }
    } else {
        showMessage('✅ Fornecedor cadastrado com sucesso!', 'success');
        limparFormularioFornecedor();
        await listarFornecedores();
    }
}

async function listarFornecedores() {
    try {
        const { data: fornecedores, error } = await window.supabaseClient
            .from('fornecedores')
            .select('*')
            .order('nome');
        
        if (error) throw error;
        
        const listaDiv = document.getElementById('lista-fornecedores');
        if (!listaDiv) return;
        
        if (fornecedores && fornecedores.length > 0) {
            let html = `<div class="table-wrapper"><table class="table"><thead><tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>CNPJ</th>
                        <th>Telefone</th>
                        <th>Email</th>
                        <th>Endereço</th>
                        <th>Ações</th>
                    </tr></thead><tbody>`;
            
            fornecedores.forEach(f => {
                html += `<tr>
                            <td>${f.id}</td>
                            <td><strong>${f.nome}</strong></td>
                            <td>${f.cnpj || '-'}</td>
                            <td>${f.telefone || '-'}</td>
                            <td>${f.email || '-'}</td>
                            <td>${f.endereco ? f.endereco.substring(0, 50) + (f.endereco.length > 50 ? '...' : '') : '-'}</td>
                            <td>
                                <button onclick="editarFornecedor(${f.id})" style="background: #ffc107; color: #333; padding: 5px 10px; margin-right: 5px;">✏️ Editar</button>
                                <button onclick="excluirFornecedor(${f.id})" style="background: #dc3545; padding: 5px 10px;">🗑️ Excluir</button>
                            </td>
                          </tr>`;
            });
            html += `</tbody></table></div>`;
            listaDiv.innerHTML = html;
        } else {
            listaDiv.innerHTML = '<p style="text-align: center; padding: 40px;">📭 Nenhum fornecedor cadastrado.</p>';
        }
    } catch (error) {
        console.error('Erro ao listar fornecedores:', error);
        const listaDiv = document.getElementById('lista-fornecedores');
        if (listaDiv) {
            listaDiv.innerHTML = '<p style="text-align: center; padding: 40px; color: red;">❌ Erro ao carregar fornecedores.</p>';
        }
    }
}

let fornecedorEditandoId = null;

function editarFornecedor(id) {
    // Buscar dados do fornecedor
    const fornecedor = fornecedoresLista.find(f => f.id === id);
    if (!fornecedor) return;
    
    fornecedorEditandoId = id;
    document.getElementById('forn-nome').value = fornecedor.nome || '';
    document.getElementById('forn-cnpj').value = fornecedor.cnpj || '';
    document.getElementById('forn-telefone').value = fornecedor.telefone || '';
    document.getElementById('forn-email').value = fornecedor.email || '';
    document.getElementById('forn-endereco').value = fornecedor.endereco || '';
    
    const btnSubmit = document.querySelector('#form-fornecedor button[type="submit"]');
    btnSubmit.textContent = 'Atualizar Fornecedor';
    
    // Adicionar botão cancelar edição se não existir
    let btnCancelar = document.getElementById('btn-cancelar-edicao');
    if (!btnCancelar) {
        btnCancelar = document.createElement('button');
        btnCancelar.id = 'btn-cancelar-edicao';
        btnCancelar.type = 'button';
        btnCancelar.textContent = 'Cancelar Edição';
        btnCancelar.style.background = '#6c757d';
        btnCancelar.onclick = () => {
            limparFormularioFornecedor();
            fornecedorEditandoId = null;
            btnSubmit.textContent = 'Cadastrar Fornecedor';
            btnCancelar.remove();
        };
        document.querySelector('.botoes-acoes').appendChild(btnCancelar);
    }
    
    document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
}

function limparFormularioFornecedor() {
    document.getElementById('forn-nome').value = '';
    document.getElementById('forn-cnpj').value = '';
    document.getElementById('forn-telefone').value = '';
    document.getElementById('forn-email').value = '';
    document.getElementById('forn-endereco').value = '';
    fornecedorEditandoId = null;
    const btnSubmit = document.querySelector('#form-fornecedor button[type="submit"]');
    if (btnSubmit) btnSubmit.textContent = 'Cadastrar Fornecedor';
    const btnCancelar = document.getElementById('btn-cancelar-edicao');
    if (btnCancelar) btnCancelar.remove();
}

let fornecedoresLista = [];

async function listarFornecedores() {
    try {
        const { data: fornecedores, error } = await window.supabaseClient
            .from('fornecedores')
            .select('*')
            .order('nome');
        
        if (error) throw error;
        
        fornecedoresLista = fornecedores || [];
        
        const listaDiv = document.getElementById('lista-fornecedores');
        if (!listaDiv) return;
        
        if (fornecedoresLista.length > 0) {
            let html = `<div class="table-wrapper"><table class="table"><thead><tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>CNPJ</th>
                        <th>Telefone</th>
                        <th>Email</th>
                        <th>Endereço</th>
                        <th>Ações</th>
                    </tr></thead><tbody>`;
            
            fornecedoresLista.forEach(f => {
                html += `<td>
                            <td>${f.id}</td>
                            <td><strong>${f.nome}</strong></td>
                            <td>${f.cnpj || '-'}</td>
                            <td>${f.telefone || '-'}</td>
                            <td>${f.email || '-'}</td>
                            <td>${f.endereco ? f.endereco.substring(0, 50) + (f.endereco.length > 50 ? '...' : '') : '-'}</td>
                            <td>
                                <button onclick="editarFornecedor(${f.id})" style="background: #ffc107; color: #333; padding: 5px 10px; margin-right: 5px;">✏️ Editar</button>
                                <button onclick="excluirFornecedor(${f.id})" style="background: #dc3545; padding: 5px 10px;">🗑️ Excluir</button>
                            </td>
                          </tr>`;
            });
            html += `</tbody></table></div>`;
            listaDiv.innerHTML = html;
        } else {
            listaDiv.innerHTML = '<p style="text-align: center; padding: 40px;">📭 Nenhum fornecedor cadastrado.</p>';
        }
    } catch (error) {
        console.error('Erro ao listar fornecedores:', error);
        const listaDiv = document.getElementById('lista-fornecedores');
        if (listaDiv) {
            listaDiv.innerHTML = '<p style="text-align: center; padding: 40px; color: red;">❌ Erro ao carregar fornecedores.</p>';
        }
    }
}

async function excluirFornecedor(id) {
    // Verificar se o fornecedor tem produtos vinculados
    const { data: produtos, error: prodError } = await window.supabaseClient
        .from('produtos')
        .select('id')
        .eq('fornecedor_id', id)
        .limit(1);
    
    if (prodError) {
        showMessage('Erro ao verificar produtos vinculados!', 'error');
        return;
    }
    
    if (produtos && produtos.length > 0) {
        showMessage('❌ Não é possível excluir! Este fornecedor possui produtos cadastrados.', 'error');
        return;
    }
    
    const confirmar = confirm('Tem certeza que deseja excluir este fornecedor?');
    if (!confirmar) return;
    
    const { error } = await window.supabaseClient.from('fornecedores').delete().eq('id', id);
    
    if (error) {
        showMessage('Erro ao excluir fornecedor: ' + error.message, 'error');
    } else {
        showMessage('✅ Fornecedor excluído com sucesso!', 'success');
        await listarFornecedores();
        if (fornecedorEditandoId === id) {
            limparFormularioFornecedor();
        }
    }
}