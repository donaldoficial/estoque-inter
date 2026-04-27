async function carregarFornecedores() {
    const main = document.getElementById('conteudo-principal');
    
    main.innerHTML = `
        <h1>🏢 Cadastro de Fornecedores</h1>
        <div class="card">
            <div class="card-header">➕ Novo Fornecedor</div>
            <form id="form-fornecedor">
                <div class="grid-2">
                    <div class="form-group">
                        <label>Nome do Fornecedor *</label>
                        <input type="text" id="forn-nome" required>
                    </div>
                    <div class="form-group">
                        <label>CNPJ</label>
                        <input type="text" id="forn-cnpj">
                    </div>
                    <div class="form-group">
                        <label>Telefone</label>
                        <input type="text" id="forn-telefone">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="forn-email">
                    </div>
                    <div class="form-group">
                        <label>Endereço</label>
                        <textarea id="forn-endereco" rows="3"></textarea>
                    </div>
                </div>
                <button type="submit">Cadastrar Fornecedor</button>
            </form>
        </div>
        <div class="card">
            <div class="card-header">📋 Lista de Fornecedores</div>
            <div id="lista-fornecedores">Carregando...</div>
        </div>
        <div id="mensagem"></div>
    `;
    
    await listarFornecedores();
    
    document.getElementById('form-fornecedor').addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarFornecedor();
    });
}

async function salvarFornecedor() {
    const fornecedor = {
        nome: document.getElementById('forn-nome').value,
        cnpj: document.getElementById('forn-cnpj').value,
        telefone: document.getElementById('forn-telefone').value,
        email: document.getElementById('forn-email').value,
        endereco: document.getElementById('forn-endereco').value
    };
    
    const { error } = await window.supabaseClient.from('fornecedores').insert([fornecedor]);
    
    if (error) {
        showMessage('mensagem', 'Erro ao cadastrar fornecedor: ' + error.message, 'error');
    } else {
        showMessage('mensagem', 'Fornecedor cadastrado com sucesso!', 'success');
        document.getElementById('form-fornecedor').reset();
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
        
        if (fornecedores && fornecedores.length > 0) {
            let html = `<table>`;
            html += `<thead><tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>CNPJ</th>
                        <th>Telefone</th>
                        <th>Email</th>
                        <th>Ações</th>
                     </tr></thead><tbody>`;
            
            fornecedores.forEach(f => {
                html += `<tr>
                            <td>${f.id}</td>
                            <td>${f.nome}</td>
                            <td>${f.cnpj || '-'}</td>
                            <td>${f.telefone || '-'}<tr>
                            <td>${f.email || '-'}</td>
                            <td>
                                <button onclick="editarFornecedor(${f.id})">✏️</button>
                                <button onclick="excluirFornecedor(${f.id})" style="background:#dc3545">🗑️</button>
                            </td>
                         </tr>`;
            });
            html += `</tbody></table>`;
            document.getElementById('lista-fornecedores').innerHTML = html;
        } else {
            document.getElementById('lista-fornecedores').innerHTML = '<p>Nenhum fornecedor cadastrado.</p>';
        }
    } catch (error) {
        console.error('Erro ao listar fornecedores:', error);
        document.getElementById('lista-fornecedores').innerHTML = '<p>Erro ao carregar fornecedores. Verifique se a tabela foi criada no Supabase.</p>';
    }
}

async function excluirFornecedor(id) {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
        const { error } = await window.supabaseClient.from('fornecedores').delete().eq('id', id);
        if (error) {
            showMessage('mensagem', 'Erro ao excluir fornecedor', 'error');
        } else {
            showMessage('mensagem', 'Fornecedor excluído com sucesso!', 'success');
            await listarFornecedores();
        }
    }
}

function editarFornecedor(id) {
    alert('Funcionalidade em desenvolvimento');
}