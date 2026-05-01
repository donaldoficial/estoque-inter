async function carregarDashboard() {
    const main = document.getElementById('conteudo-principal');
    
    // Iniciar monitor de inatividade
    if (typeof iniciarMonitorInatividade === 'function') {
        iniciarMonitorInatividade();
    }
    
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
            .btn-acao {
                padding: 12px 25px;
                font-size: 14px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }
            .btn-fifo {
                background: linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%);
                color: white;
            }
            .btn-data-critica {
                background: linear-gradient(135deg, #f59f00 0%, #e67700 100%);
                color: white;
            }
            .btn-backup {
                background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                color: white;
            }
            .botoes-dashboard {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            .card-terco1 { border-left: 4px solid #28a745; }
            .card-terco2 { border-left: 4px solid #ffc107; }
            .card-terco3 { border-left: 4px solid #dc3545; }
            .terco-badge-1 { background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
            .terco-badge-2 { background: #ffc107; color: #333; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
            .terco-badge-3 { background: #dc3545; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; }
            .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
        </style>
        
        <div class="header-dashboard">
            <h1 style="margin: 0;">📊 Dashboard</h1>
            <div class="botoes-dashboard">
                <button onclick="if(typeof abrirModalFIFO === 'function') abrirModalFIFO()" class="btn-acao btn-fifo">📦 Relatório FIFO</button>
                <button onclick="if(typeof abrirModalDataCritica === 'function') abrirModalDataCritica()" class="btn-acao btn-data-critica">⚠️ Data Crítica</button>
            </div>
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
        
        <div class="card card-terco2">
            <div class="card-header">🟡 2º TERÇO - ALERTA DE VALIDADE</div>
            <div id="alerta-terco2" class="table-wrapper">Carregando...</div>
        </div>
        
        <div class="card card-terco3">
            <div class="card-header">🔴 3º TERÇO - DATA CRÍTICA (NÃO RECEBER)</div>
            <div id="alerta-terco3" class="table-wrapper">Carregando...</div>
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
    await carregarAlertasValidade();
    await carregarUltimasMovimentacoes();
}

async function carregarResumoEstoque() {
    try {
        const { data: produtos, error: prodError } = await window.supabaseClient
            .from('produtos')
            .select('*');
        
        const { data: lotes, error: loteError } = await window.supabaseClient
            .from('lotes_estoque')
            .select('*');
        
        if (prodError) console.error('Erro produtos:', prodError);
        if (loteError) console.error('Erro lotes:', loteError);
        
        const totalProdutos = produtos?.length || 0;
        const totalEstoque = lotes?.reduce((sum, l) => sum + (l.quantidade_atual || 0), 0) || 0;
        const valorTotal = lotes?.reduce((sum, l) => sum + ((l.quantidade_atual || 0) * (l.preco_custo || 0)), 0) || 0;
        
        const resumoDiv = document.getElementById('resumo-estoque');
        if (resumoDiv) {
            resumoDiv.innerHTML = `
                <p><strong>📦 Produtos cadastrados:</strong> ${totalProdutos}</p>
                <p><strong>📊 Quantidade em estoque:</strong> ${totalEstoque} unidades</p>
                <p><strong>💰 Valor total em estoque:</strong> ${formatMoney(valorTotal)}</p>
                <p><strong>🏷️ Lotes controlados:</strong> ${lotes?.length || 0}</p>
            `;
        }
    } catch (error) {
        console.error('Erro resumo:', error);
        const resumoDiv = document.getElementById('resumo-estoque');
        if (resumoDiv) resumoDiv.innerHTML = '<p>Erro ao carregar resumo.</p>';
    }
}

async function carregarEstoqueBaixo() {
    try {
        const { data: produtos, error } = await window.supabaseClient
            .from('produtos')
            .select('*');
        
        if (error) throw error;
        
        const produtosBaixo = produtos?.filter(p => (p.estoque_atual || 0) <= (p.estoque_minimo || 0)) || [];
        
        const estoqueDiv = document.getElementById('estoque-baixo');
        if (!estoqueDiv) return;
        
        if (produtosBaixo.length > 0) {
            let html = `<div class="table-wrapper"><table class="table"><thead><tr>
                        <th>Código</th><th>Produto</th><th>Estoque Atual</th><th>Estoque Mínimo</th>
                    </tr></thead><tbody>`;
            produtosBaixo.forEach(p => {
                html += `<tr>
                    <td><strong>${p.codigo_interno || '-'}</strong></td>
                    <td>${p.nome}</td>
                    <td class="alert-warning">${p.estoque_atual || 0}</td>
                    <td>${p.estoque_minimo || 0}</td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
            estoqueDiv.innerHTML = html;
        } else {
            estoqueDiv.innerHTML = '<p>✅ Nenhum produto com estoque baixo.</p>';
        }
    } catch (error) {
        console.error('Erro estoque baixo:', error);
        const estoqueDiv = document.getElementById('estoque-baixo');
        if (estoqueDiv) estoqueDiv.innerHTML = '<p>Erro ao carregar estoque baixo.</p>';
    }
}

async function carregarAlertasValidade() {
    try {
        const { data: lotes, error } = await window.supabaseClient
            .from('lotes_estoque')
            .select('*, produtos(id, nome, codigo_interno, unidade_medida)')
            .gt('quantidade_atual', 0);
        
        if (error) throw error;
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const alertaTerco2 = [];
        const alertaTerco3 = [];
        
        for (const lote of lotes || []) {
            if (!lote.data_validade || !lote.data_fabricacao) continue;
            
            const fab = new Date(lote.data_fabricacao);
            const val = new Date(lote.data_validade);
            fab.setHours(0, 0, 0, 0);
            val.setHours(0, 0, 0, 0);
            
            const vidaTotal = (val - fab) / (1000 * 60 * 60 * 24);
            const diasPassados = (hoje - fab) / (1000 * 60 * 60 * 24);
            let terco = 1;
            if (vidaTotal > 0) {
                terco = Math.ceil((diasPassados / vidaTotal) * 3);
                if (terco < 1) terco = 1;
                if (terco > 3) terco = 3;
            }
            
            if (terco === 2) alertaTerco2.push({ ...lote, terco });
            if (terco === 3) alertaTerco3.push({ ...lote, terco });
        }
        
        const renderTabela = (dados) => {
            if (dados.length === 0) return `<p>✅ Nenhum produto encontrado</p>`;
            return `
                <div class="table-wrapper">
                    <table class="table">
                        <thead><tr><th>Código</th><th>Produto</th><th>Lote</th><th>Validade</th><th>Estoque</th><th>Status</th></tr></thead>
                        <tbody>
                            ${dados.map(l => {
                                const diasRest = Math.ceil((new Date(l.data_validade) - new Date()) / (1000 * 60 * 60 * 24));
                                return `<tr>
                                    <td>${l.produtos?.codigo_interno || '-'}</td>
                                    <td>${l.produtos?.nome || '-'}</td>
                                    <td>${l.lote || '-'}</td>
                                    <td>${formatDate(l.data_validade)}</td>
                                    <td>${l.quantidade_atual}</td>
                                    <td><span class="terco-badge-${l.terco}">${l.terco}º Terço (${diasRest} dias)</span></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        };
        
        const terco2Div = document.getElementById('alerta-terco2');
        const terco3Div = document.getElementById('alerta-terco3');
        if (terco2Div) terco2Div.innerHTML = renderTabela(alertaTerco2);
        if (terco3Div) terco3Div.innerHTML = renderTabela(alertaTerco3);
        
    } catch (error) {
        console.error('Erro alertas:', error);
        const terco2Div = document.getElementById('alerta-terco2');
        const terco3Div = document.getElementById('alerta-terco3');
        if (terco2Div) terco2Div.innerHTML = '<p>Erro ao carregar alertas.</p>';
        if (terco3Div) terco3Div.innerHTML = '<p>Erro ao carregar alertas.</p>';
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
            let html = `<div class="table-wrapper"><table class="table"><thead><tr>
                        <th>Data</th>
                        <th>Código</th>
                        <th>Produto</th>
                        <th>Tipo</th>
                        <th>Quantidade</th>
                    </tr></thead><tbody>`;
            movimentacoes.forEach(m => {
                html += `<tr>
                    <td>${formatDateTime(m.data_movimento)}</td>
                    <td>${m.produtos?.codigo_interno || '-'}</td>
                    <td>${m.produtos?.nome || '-'}</td>
                    <td>${m.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}</td>
                    <td>${m.quantidade}</td>
                </tr>`;
            });
            html += `</tbody></td></div>`;
            movDiv.innerHTML = html;
        } else {
            movDiv.innerHTML = '<p>Nenhuma movimentação registrada.</p>';
        }
    } catch (error) {
        console.error('Erro movimentações:', error);
        const movDiv = document.getElementById('ultimas-movimentacoes');
        if (movDiv) movDiv.innerHTML = '<p>Erro ao carregar movimentações.</p>';
    }
}

// Modal FIFO e Data Crítica
function abrirModalFIFO() {
    if (typeof carregarFIFO === 'function') {
        carregarFIFO();
    } else {
        showMessage('Funcionalidade FIFO não disponível', 'error');
    }
}

function abrirModalDataCritica() {
    if (typeof carregarDataCritica === 'function') {
        carregarDataCritica();
    } else {
        showMessage('Funcionalidade Data Crítica não disponível', 'error');
    }
}