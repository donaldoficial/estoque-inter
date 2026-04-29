async function carregarProdutos() {
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
            .btn-editar {
                background: #ffc107;
                color: #333;
            }
            .btn-editar:hover {
                background: #e0a800;
            }
            .btn-excluir {
                background: #dc3545;
            }
            .btn-excluir:hover {
                background: #c82333;
            }
            .codigo-obrigatorio {
                border-color: #28a745 !important;
                background-color: #f8fff8;
            }
        </style>
        
        <h1 style="margin-bottom: 25px;">📦 Cadastro de Produtos</h1>
        
        <div class="card">
            <div class="card-header">➕ Novo Produto</div>
            <form id="form-produto">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Código Interno *</label>
                        <input type="text" id="prod-codigo-interno" required placeholder="Ex: 2100 ou PROD-001" class="codigo-obrigatorio">
                        <small style="color: #28a745;">Código único para identificar o produto</small>
                    </div>
                    <div class="form-group">
                        <label>Nome do Produto *</label>
                        <input type="text" id="prod-nome" required>
                    </div>
                    <div class="form-group">
                        <label>Código de Barras</label>
                        <input type="text" id="prod-codigo-barras" placeholder="Código de barras do produto (opcional)">
                        <small style="color: #666;">Não é obrigatório - pode deixar em branco</small>
                    </div>
                    <div class="form-group">
                        <label>Unidade de Medida</label>
                        <select id="prod-unidade">
                            <option value="UN">Unidade (UN)</option>
                            <option value="KG">Quilograma (KG)</option>
                            <option value="CX">Caixa (CX)</option>
                            <option value="PC">Peça (PC)</option>
                            <option value="LT">Litro (LT)</option>
                            <option value="MT">Metro (MT)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Preço de Compra</label>
                        <input type="number" step="0.01" id="prod-preco-compra" placeholder="R$ 0,00">
                    </div>
                    <div class="form-group">
                        <label>Preço de Venda *</label>
                        <input type="number" step="0.01" id="prod-preco-venda" required placeholder="R$ 0,00">
                    </div>
                    <div class="form-group">
                        <label>Estoque Mínimo</label>
                        <input type="number" id="prod-estoque-min" value="5">
                    </div>
                    <div class="form-group">
                        <label>Fornecedor</label>
                        <select id="prod-fornecedor"></select>
                    </div>
                </div>
                <div class="botoes-acoes">
                    <button type="submit">Cadastrar Produto</button>
                    <button type="button" onclick="limparFormulario()" style="background: #6c757d;">Limpar</button>
                </div>
            </form>
        </div>
        
        <div class="card">
            <div class="card-header">📋 Lista de Produtos</div>
            <div class="table-wrapper">
                <div id="lista-produtos">Carregando...</div>
            </div>
        </div>
        <div id="mensagem"></div>
    `;
    
    await carregarFornecedoresSelect();
    await listarProdutos();
    
    document.getElementById('form-produto').addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarProduto();
    });
}

async function carregarFornecedoresSelect() {
    const { data: fornecedores } = await window.supabaseClient.from('fornecedores').select('id, nome').order('nome');
    const select = document.getElementById('prod-fornecedor');
    
    if (fornecedores && fornecedores.length > 0) {
        select.innerHTML = '<option value="">Selecione um fornecedor</option>';
        fornecedores.forEach(f => {
            select.innerHTML += `<option value="${f.id}">${f.nome}</option>`;
        });
    } else {
        select.innerHTML = '<option value="">Nenhum fornecedor cadastrado</option>';
    }
}

let produtoEditandoId = null;

async function salvarProduto() {
    const codigoInterno = document.getElementById('prod-codigo-interno').value.toUpperCase().trim();
    const nome = document.getElementById('prod-nome').value.trim();
    const precoVenda = parseFloat(document.getElementById('prod-preco-venda').value);
    const codigoBarras = document.getElementById('prod-codigo-barras').value.trim();
    
    if (!codigoInterno) {
        showMessage('Código Interno é obrigatório!', 'error');
        return;
    }
    
    if (!nome) {
        showMessage('Nome do produto é obrigatório!', 'error');
        return;
    }
    
    if (!precoVenda || precoVenda <= 0) {
        showMessage('Preço de Venda é obrigatório e deve ser maior que zero!', 'error');
        return;
    }
    
    // Se código de barras estiver vazio, enviar como null
    const codigoBarrasFinal = codigoBarras === '' ? null : codigoBarras;
    
    const produto = {
        codigo_interno: codigoInterno,
        nome: nome,
        codigo_barras: codigoBarrasFinal,
        unidade_medida: document.getElementById('prod-unidade').value,
        preco_compra: parseFloat(document.getElementById('prod-preco-compra').value) || 0,
        preco_venda: precoVenda,
        estoque_minimo: parseInt(document.getElementById('prod-estoque-min').value) || 5,
        fornecedor_id: document.getElementById('prod-fornecedor').value || null
    };
    
    // Se estiver editando
    if (produtoEditandoId) {
        // Verificar se código interno já existe (exceto o próprio)
        const { data: existente, error: checkError } = await window.supabaseClient
            .from('produtos')
            .select('id')
            .eq('codigo_interno', codigoInterno)
            .neq('id', produtoEditandoId)
            .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
            showMessage('Erro ao verificar código: ' + checkError.message, 'error');
            return;
        }
        
        if (existente) {
            showMessage(`Código interno "${codigoInterno}" já existe em outro produto!`, 'error');
            return;
        }
        
        const { error } = await window.supabaseClient
            .from('produtos')
            .update(produto)
            .eq('id', produtoEditandoId);
        
        if (error) {
            if (error.code === '23505') {
                showMessage('Erro: Código interno ou código de barras já existe!', 'error');
            } else {
                showMessage('Erro ao atualizar: ' + error.message, 'error');
            }
        } else {
            showMessage('✅ Produto atualizado com sucesso!', 'success');
            limparFormulario();
            await listarProdutos();
        }
    } else {
        // Verificar se código interno já existe
        const { data: existente, error: checkError } = await window.supabaseClient
            .from('produtos')
            .select('id')
            .eq('codigo_interno', codigoInterno)
            .maybeSingle();
        
        if (checkError && checkError.code !== 'PGRST116') {
            showMessage('Erro ao verificar código: ' + checkError.message, 'error');
            return;
        }
        
        if (existente) {
            showMessage(`Código interno "${codigoInterno}" já existe!`, 'error');
            return;
        }
        
        const { error } = await window.supabaseClient.from('produtos').insert([produto]);
        
        if (error) {
            if (error.code === '23505') {
                // Verificar qual constraint foi violada
                if (error.message.includes('codigo_interno')) {
                    showMessage(`Código interno "${codigoInterno}" já existe!`, 'error');
                } else if (error.message.includes('codigo_barras')) {
                    showMessage(`Código de barras "${codigoBarras}" já existe em outro produto!`, 'error');
                } else {
                    showMessage('Erro: Dados duplicados! Verifique código interno e código de barras.', 'error');
                }
            } else {
                showMessage('Erro ao cadastrar: ' + error.message, 'error');
            }
        } else {
            showMessage('✅ Produto cadastrado com sucesso!', 'success');
            limparFormulario();
            await listarProdutos();
        }
    }
}

function limparFormulario() {
    produtoEditandoId = null;
    document.getElementById('form-produto').reset();
    document.getElementById('prod-codigo-interno').disabled = false;
    const btnSubmit = document.querySelector('#form-produto button[type="submit"]');
    btnSubmit.textContent = 'Cadastrar Produto';
    document.getElementById('prod-preco-venda').required = true;
    // Resetar campos opcionais
    document.getElementById('prod-codigo-barras').value = '';
}

function editarProduto(produto) {
    produtoEditandoId = produto.id;
    document.getElementById('prod-codigo-interno').value = produto.codigo_interno || '';
    document.getElementById('prod-nome').value = produto.nome || '';
    document.getElementById('prod-codigo-barras').value = produto.codigo_barras || '';
    document.getElementById('prod-unidade').value = produto.unidade_medida || 'UN';
    document.getElementById('prod-preco-compra').value = produto.preco_compra || '';
    document.getElementById('prod-preco-venda').value = produto.preco_venda || '';
    document.getElementById('prod-estoque-min').value = produto.estoque_minimo || 5;
    document.getElementById('prod-fornecedor').value = produto.fornecedor_id || '';
    
    const btnSubmit = document.querySelector('#form-produto button[type="submit"]');
    btnSubmit.textContent = 'Atualizar Produto';
    
    // Rolar para o formulário
    document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
}

async function listarProdutos() {
    try {
        const { data: produtos, error } = await window.supabaseClient
            .from('produtos')
            .select('*, fornecedores(nome)')
            .order('codigo_interno');
        
        if (error) throw error;
        
        const listaDiv = document.getElementById('lista-produtos');
        if (!listaDiv) return;
        
        if (produtos && produtos.length > 0) {
            let html = `<table>`;
            html += `<thead><tr>
                        <th>Código Interno</th>
                        <th>Nome</th>
                        <th>Unidade</th>
                        <th>Estoque</th>
                        <th>Preço Compra</th>
                        <th>Preço Venda</th>
                        <th>Fornecedor</th>
                        <th>Ações</th>
                     </tr></thead><tbody>`;
            
            produtos.forEach(p => {
                const estoqueClass = p.estoque_atual <= p.estoque_minimo ? 'alert-warning' : '';
                html += `<tr>
                            <td><strong>${p.codigo_interno || '-'}</strong></td>
                            <td>${p.nome}</td>
                            <td>${p.unidade_medida || 'UN'}</td>
                            <td class="${estoqueClass}">${p.estoque_atual || 0}</td>
                            <td>${formatMoney(p.preco_compra)}</td>
                            <td>${formatMoney(p.preco_venda)}</td>
                            <td>${p.fornecedores?.nome || '-'}</td>
                            <td style="white-space: nowrap;">
                                <button onclick='editarProduto(${JSON.stringify(p)})' style="background: #ffc107; color: #333; padding: 5px 10px; margin-right: 5px;">✏️ Editar</button>
                                <button onclick="excluirProduto(${p.id})" style="background: #dc3545; padding: 5px 10px;">🗑️ Excluir</button>
                            </td>
                          </tr>`;
            });
            html += `</tbody></tr>`;
            listaDiv.innerHTML = html;
        } else {
            listaDiv.innerHTML = '<p>Nenhum produto cadastrado. Cadastre um produto primeiro!</p>';
        }
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('lista-produtos').innerHTML = '<p>Erro ao carregar produtos.</p>';
    }
}

async function excluirProduto(id) {
    // Primeiro verificar se o produto tem movimentações
    const { data: movimentacoes, error: movError } = await window.supabaseClient
        .from('movimentacoes')
        .select('id')
        .eq('produto_id', id)
        .limit(1);
    
    if (movError) {
        showMessage('Erro ao verificar movimentações: ' + movError.message, 'error');
        return;
    }
    
    if (movimentacoes && movimentacoes.length > 0) {
        // Produto tem movimentações, perguntar se quer desativar ou excluir tudo
        const confirmar = confirm(
            '⚠️ ATENÇÃO! Este produto possui movimentações registradas!\n\n' +
            'Deseja EXCLUIR TODAS as movimentações e o produto?\n' +
            '(Isso removerá TODO o histórico deste produto)\n\n' +
            'Clique em OK para excluir tudo, ou CANCELAR para manter.'
        );
        
        if (!confirmar) return;
        
        // Excluir movimentações primeiro
        const { error: delMovError } = await window.supabaseClient
            .from('movimentacoes')
            .delete()
            .eq('produto_id', id);
        
        if (delMovError) {
            showMessage('Erro ao excluir movimentações: ' + delMovError.message, 'error');
            return;
        }
        
        // Excluir itens de nota fiscal
        const { error: delNotaItensError } = await window.supabaseClient
            .from('nota_itens')
            .delete()
            .eq('produto_id', id);
        
        if (delNotaItensError) {
            console.warn('Erro ao excluir nota_itens:', delNotaItensError);
        }
        
        // Excluir itens de romaneio
        const { error: delRomaneioItensError } = await window.supabaseClient
            .from('romaneio_itens')
            .delete()
            .eq('produto_id', id);
        
        if (delRomaneioItensError) {
            console.warn('Erro ao excluir romaneio_itens:', delRomaneioItensError);
        }
    } else {
        // Produto sem movimentações, confirmar exclusão simples
        const confirmar = confirm('Tem certeza que deseja excluir este produto?');
        if (!confirmar) return;
    }
    
    // Finalmente excluir o produto
    const { error: delError } = await window.supabaseClient
        .from('produtos')
        .delete()
        .eq('id', id);
    
    if (delError) {
        if (delError.code === '23503') {
            showMessage('Não é possível excluir: Produto possui registros relacionados em notas ou romaneios!', 'error');
        } else {
            showMessage('Erro ao excluir produto: ' + delError.message, 'error');
        }
    } else {
        showMessage('✅ Produto excluído com sucesso!', 'success');
        await listarProdutos();
        if (produtoEditandoId === id) {
            limparFormulario();
        }
    }
}