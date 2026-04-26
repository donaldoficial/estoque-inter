async function carregarDashboard() {
    const main = document.getElementById('conteudo-principal');
    
    main.innerHTML = `
        <style>
            .header-dashboard {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                flex-wrap: wrap;
                gap: 15px;
            }
            .btn-backup {
                background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                padding: 12px 25px;
                font-size: 16px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }
            .btn-backup:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(23,162,184,0.3);
            }
        </style>
        
        <div class="header-dashboard">
            <h1 style="margin: 0;">📊 Dashboard</h1>
            <button onclick="abrirModalBackup()" class="btn-backup">
                💾 Backup / Restaurar
            </button>
        </div>
        
        <div class="grid-2">
            <div class="card">
                <div class="card-header">📈 Resumo do Estoque</div>
                <div id="resumo-estoque">Carregando...</div>
            </div>
            <div class="card">
                <div class="card-header">⚠️ Produtos com Estoque Baixo</div>
                <div id="estoque-baixo" class="table-wrapper">Carregando...</div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">📊 Últimas Movimentações</div>
            <div class="table-wrapper">
                <div id="ultimas-movimentacoes">Carregando...</div>
            </div>
        </div>
    `;
    
    await carregarResumoEstoque();
    await carregarEstoqueBaixo();
    await carregarUltimasMovimentacoes();
    
    // Inicializar modal de backup
    if (typeof criarModalBackup === 'function') {
        criarModalBackup();
    }
}

async function carregarResumoEstoque() {
    try {
        const { data: produtos, error } = await window.supabaseClient
            .from('produtos')
            .select('*');
        
        if (error) throw error;
        
        const resumoDiv = document.getElementById('resumo-estoque');
        if (!resumoDiv) return;
        
        if (produtos && produtos.length > 0) {
            const totalProdutos = produtos.length;
            const totalEstoque = produtos.reduce((sum, p) => sum + (p.estoque_atual || 0), 0);
            const valorTotalEstoque = produtos.reduce((sum, p) => sum + ((p.estoque_atual || 0) * (p.preco_venda || 0)), 0);
            
            resumoDiv.innerHTML = `
                <p><strong>📦 Total de Produtos:</strong> ${totalProdutos}</p>
                <p><strong>📊 Total em Estoque:</strong> ${totalEstoque} unidades</p>
                <p><strong>💰 Valor Total do Estoque:</strong> ${formatMoney(valorTotalEstoque)}</p>
            `;
        } else {
            resumoDiv.innerHTML = '<p>Nenhum produto cadastrado.</p>';
        }
    } catch (error) {
        console.error('Erro:', error);
        const resumoDiv = document.getElementById('resumo-estoque');
        if (resumoDiv) resumoDiv.innerHTML = '<p>Erro ao carregar dados.</p>';
    }
}

async function carregarEstoqueBaixo() {
    try {
        const { data: produtos, error } = await window.supabaseClient
            .from('produtos')
            .select('*');
        
        if (error) throw error;
        
        const estoqueDiv = document.getElementById('estoque-baixo');
        if (!estoqueDiv) return;
        
        const baixoEstoque = produtos?.filter(p => p.estoque_atual <= p.estoque_minimo) || [];
        
        if (baixoEstoque.length > 0) {
            let html = `<table>`;
            html += `<thead><tr><th>Código</th><th>Produto</th><th>Estoque</th><th>Mínimo</th></tr></thead><tbody>`;
            baixoEstoque.forEach(p => {
                html += `<tr>
                            <td>${p.codigo_interno || '-'}</td>
                            <td>${p.nome}</td>
                            <td class="alert-warning">${p.estoque_atual}</td>
                            <td>${p.estoque_minimo}</td>
                          </tr>`;
            });
            html += `</tbody></table>`;
            estoqueDiv.innerHTML = html;
        } else {
            estoqueDiv.innerHTML = '<p>✅ Nenhum produto com estoque baixo!</p>';
        }
    } catch (error) {
        console.error('Erro:', error);
        const estoqueDiv = document.getElementById('estoque-baixo');
        if (estoqueDiv) estoqueDiv.innerHTML = '<p>Erro ao carregar dados.</p>';
    }
}

async function carregarUltimasMovimentacoes() {
    try {
        const { data: movimentacoes, error } = await window.supabaseClient
            .from('movimentacoes')
            .select('*, produtos(nome, codigo_interno)')
            .order('data_movimento', { ascending: false })
            .limit(10);
        
        if (error) throw error;
        
        const movDiv = document.getElementById('ultimas-movimentacoes');
        if (!movDiv) return;
        
        if (movimentacoes && movimentacoes.length > 0) {
            let html = `</table>`;
            html += `<thead><tr><th>Data</th><th>Código</th><th>Produto</th><th>Tipo</th><th>Qtd</th><th>Documento</th></tr></thead><tbody>`;
            movimentacoes.forEach(m => {
                html += `<tr>
                            <td>${formatDateTime(m.data_movimento)}</td>
                            <td>${m.produtos?.codigo_interno || '-'}</td>
                            <td>${m.produtos?.nome || '-'}</td>
                            <td>${m.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}</td>
                            <td>${m.quantidade}</td>
                            <td>${m.documento_tipo === 'nota_fiscal' ? 'Nota Fiscal' : 'Romaneio'}</td>
                          </tr>`;
            });
            html += `</tbody></table>`;
            movDiv.innerHTML = html;
        } else {
            movDiv.innerHTML = '<p>Nenhuma movimentação registrada.</p>';
        }
    } catch (error) {
        console.error('Erro:', error);
        const movDiv = document.getElementById('ultimas-movimentacoes');
        if (movDiv) movDiv.innerHTML = '<p>Erro ao carregar dados.</p>';
    }
}