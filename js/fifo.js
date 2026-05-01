async function carregarFIFO() {
    const main = document.getElementById('conteudo-principal');
    if (!main) return;
    
    main.innerHTML = `
        <style>
            .fifo-container { padding: 20px; }
            .fifo-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                flex-wrap: wrap;
                gap: 15px;
            }
            .btn-atualizar {
                background: #17a2b8;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
            }
            .btn-atualizar:hover { transform: translateY(-2px); }
            .fifo-busca { margin-bottom: 20px; }
            .fifo-busca input {
                width: 100%;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
            }
            .lote-card {
                margin-bottom: 25px;
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                padding: 20px;
                background: #f8f9fa;
            }
            .lote-card h3 { margin: 0 0 5px 0; color: #333; }
            .lote-card p { margin: 0; color: #666; font-size: 14px; }
            .badge-1 { background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
            .badge-2 { background: #ffc107; color: #333; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
            .badge-3 { background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
            .sem-resultados { text-align: center; padding: 40px; color: #666; }
        </style>
        
        <div class="fifo-container">
            <div class="fifo-header">
                <h1 style="margin: 0;">📦 Relatório FIFO</h1>
                <button onclick="carregarListaFIFO()" class="btn-atualizar">🔄 Atualizar</button>
            </div>
            <div class="fifo-busca">
                <input type="text" id="fifo-busca-input" placeholder="🔍 Buscar por código interno do produto...">
            </div>
            <div class="card">
                <div class="card-header">📋 Controle de Lotes - Ordem de Saída (Mais antigo primeiro)</div>
                <div id="fifo-lista" style="margin-top: 20px;">Carregando...</div>
            </div>
        </div>
    `;
    
    document.getElementById('fifo-busca-input').addEventListener('input', () => carregarListaFIFO());
    await carregarListaFIFO();
}

async function carregarListaFIFO() {
    const busca = document.getElementById('fifo-busca-input')?.value || '';
    const container = document.getElementById('fifo-lista');
    if (!container) return;
    
    try {
        // Buscar todos os lotes com quantidade > 0
        const { data: lotes, error } = await window.supabaseClient
            .from('lotes_estoque')
            .select('*, produtos(id, nome, codigo_interno, unidade_medida)')
            .gt('quantidade_atual', 0);
        
        if (error) throw error;
        
        let lotesFiltrados = lotes || [];
        if (busca) {
            lotesFiltrados = lotesFiltrados.filter(l => 
                l.produtos?.codigo_interno?.toLowerCase().includes(busca.toLowerCase())
            );
        }
        
        if (lotesFiltrados.length === 0) {
            container.innerHTML = '<div class="sem-resultados">📭 Nenhum lote encontrado.</div>';
            return;
        }
        
        // Agrupar por produto
        const produtosMap = new Map();
        for (const lote of lotesFiltrados) {
            if (!lote.produtos) continue;
            if (!produtosMap.has(lote.produto_id)) {
                produtosMap.set(lote.produto_id, []);
            }
            produtosMap.get(lote.produto_id).push(lote);
        }
        
        let html = '';
        for (const [produtoId, lotesProduto] of produtosMap) {
            const produto = lotesProduto[0].produtos;
            if (!produto) continue;
            
            const totalEstoque = lotesProduto.reduce((s, l) => s + (l.quantidade_atual || 0), 0);
            
            // Ordenar por data de validade (mais antigo primeiro)
            lotesProduto.sort((a, b) => new Date(a.data_validade) - new Date(b.data_validade));
            
            html += `
                <div class="lote-card">
                    <h3>📦 ${produto.codigo_interno || 'SEM CÓDIGO'} - ${produto.nome || 'SEM NOME'}</h3>
                    <p>Estoque total: <strong>${totalEstoque}</strong> ${produto.unidade_medida || 'UN'}</p>
                    <div class="table-wrapper" style="margin-top: 15px;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Ordem</th>
                                    <th>Nº Documento</th>
                                    <th>Fabricação</th>
                                    <th>Validade</th>
                                    <th>Quantidade</th>
                                    <th>Preço Custo</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${lotesProduto.map((l, idx) => {
                                    // Calcular dias restantes de forma correta
                                    const hoje = new Date();
                                    const val = new Date(l.data_validade);
                                    // Zerar horas para comparar só as datas
                                    hoje.setHours(0, 0, 0, 0);
                                    val.setHours(0, 0, 0, 0);
                                    const diasRest = Math.ceil((val - hoje) / (1000 * 60 * 60 * 24));
                                    
                                    let badgeClass = 'badge-1';
                                    let statusText = '1º Terço - OK';
                                    
                                    if (l.terco_recebimento === 2) {
                                        badgeClass = 'badge-2';
                                        statusText = '2º Terço - Alerta';
                                    } else if (l.terco_recebimento === 3) {
                                        badgeClass = 'badge-3';
                                        statusText = '3º Terço - Crítico';
                                    }
                                    
                                    // Buscar o número do documento que originou este lote
                                    let numeroDocumento = l.lote || 'N/A';
                                    if (l.lote && l.lote.startsWith('NF-')) {
                                        numeroDocumento = l.lote.replace('NF-', 'Nota: ');
                                    }
                                    
                                    return `
                                    <tr>
                                        <td><strong>${idx + 1}º</strong></td>
                                        <td>${numeroDocumento}</td>
                                        <td>${l.data_fabricacao ? formatDate(l.data_fabricacao) : '-'}</td>
                                        <td><strong>${formatDate(l.data_validade)}</strong> (${diasRest} dias)</td>
                                        <td>${l.quantidade_atual || 0}</td>
                                        <td>${formatMoney(l.preco_custo)}</td>
                                        <td><span class="${badgeClass}">${statusText}</span></td>
                                    </tr>
                                `}).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: #666;">
                        💡 <strong>Ordem de saída FIFO:</strong> Os produtos devem sair na ordem acima (1º, 2º, 3º...)
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `<div class="sem-resultados" style="color:red;">❌ Erro ao carregar: ${error.message}</div>`;
    }
}