async function carregarFIFO() {
    const main = document.getElementById('conteudo-principal');
    if (!main) return;
    
    main.innerHTML = `
        <style>
            .fifo-container { padding: 20px; }
            .fifo-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
            .fifo-busca { flex: 1; min-width: 250px; }
            .fifo-busca input { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; }
            .fifo-tabela { margin-top: 20px; }
            .lote-card { margin-bottom: 25px; border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; background: #f8f9fa; }
            .lote-card h3 { margin: 0 0 5px 0; color: #333; }
            .lote-card p { margin: 0; color: #666; font-size: 14px; }
            .badge-1 { background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            .badge-2 { background: #ffc107; color: #333; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            .badge-3 { background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        </style>
        
        <div class="fifo-container">
            <div class="fifo-header">
                <h1 style="margin: 0;">📦 Relatório FIFO</h1>
                <div class="fifo-busca">
                    <input type="text" id="fifo-busca-input" placeholder="🔍 Buscar por código interno do produto...">
                </div>
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
        let query = window.supabaseClient
            .from('lotes_estoque')
            .select('*, produtos(id, nome, codigo_interno, unidade_medida)')
            .gt('quantidade_atual', 0);
        
        if (busca) {
            query = query.ilike('produtos.codigo_interno', `%${busca}%`);
        }
        
        const { data: lotes, error } = await query.order('data_validade', { ascending: true });
        
        if (error) throw error;
        
        if (!lotes || lotes.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:40px;">📭 Nenhum lote encontrado.</p>';
            return;
        }
        
        // Agrupar por produto
        const produtosMap = new Map();
        for (const lote of lotes) {
            if (!produtosMap.has(lote.produto_id)) {
                produtosMap.set(lote.produto_id, []);
            }
            produtosMap.get(lote.produto_id).push(lote);
        }
        
        let html = '';
        for (const [produtoId, lotesProduto] of produtosMap) {
            const produto = lotesProduto[0].produtos;
            const totalEstoque = lotesProduto.reduce((s, l) => s + l.quantidade_atual, 0);
            
            html += `
                <div class="lote-card">
                    <h3>📦 ${produto.codigo_interno} - ${produto.nome}</h3>
                    <p>Estoque total: <strong>${totalEstoque}</strong> ${produto.unidade_medida || 'UN'}</p>
                    <div class="table-wrapper" style="margin-top: 15px;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Ordem</th>
                                    <th>Lote</th>
                                    <th>Fabricação</th>
                                    <th>Validade</th>
                                    <th>Quantidade</th>
                                    <th>Preço Custo</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${lotesProduto.map((l, idx) => {
                                    const hoje = new Date();
                                    const val = new Date(l.data_validade);
                                    const diasRest = Math.ceil((val - hoje) / (1000 * 60 * 60 * 24));
                                    let badgeClass = '';
                                    if (l.terco_recebimento === 1) badgeClass = 'badge-1';
                                    else if (l.terco_recebimento === 2) badgeClass = 'badge-2';
                                    else badgeClass = 'badge-3';
                                    
                                    let statusText = '';
                                    if (l.terco_recebimento === 1) statusText = '1º Terço - OK';
                                    else if (l.terco_recebimento === 2) statusText = '2º Terço - Alerta';
                                    else statusText = '3º Terço - Crítico';
                                    
                                    return `
                                    <tr>
                                        <td><strong>${idx + 1}º</strong></td>
                                        <td>${l.lote || '-'}</td>
                                        <td>${formatDate(l.data_fabricacao)}</td>
                                        <td><strong>${formatDate(l.data_validade)}</strong> (${diasRest} dias)</td>
                                        <td>${l.quantidade_atual}</td>
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
        container.innerHTML = `<p style="color:red;text-align:center;padding:40px;">❌ Erro ao carregar: ${error.message}</p>`;
    }
}