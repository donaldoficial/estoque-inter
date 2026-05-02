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
            .badge-1 { background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            .badge-2 { background: #ffc107; color: #333; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            .badge-3 { background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
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
                <div class="card-header">📋 Controle de Estoque - Ordem de Entrada (FIFO)</div>
                <div id="fifo-lista" style="margin-top: 20px;">Carregando...</div>
            </div>
        </div>
    `;
    
    // Só adicionar o evento após o elemento existir
    const buscaInput = document.getElementById('fifo-busca-input');
    if (buscaInput) {
        buscaInput.addEventListener('input', () => carregarListaFIFO());
    }
    
    // Aguardar um pouco para garantir que o DOM foi renderizado
    setTimeout(() => {
        carregarListaFIFO();
    }, 100);
}

async function carregarListaFIFO() {
    const container = document.getElementById('fifo-lista');
    if (!container) {
        console.error('Elemento fifo-lista não encontrado');
        return;
    }
    
    const busca = document.getElementById('fifo-busca-input')?.value || '';
    
    container.innerHTML = '<div class="sem-resultados">🔍 Carregando dados...</div>';
    
    try {
        // Buscar produtos com estoque > 0
        const { data: produtos, error } = await window.supabaseClient
            .from('produtos')
            .select('*')
            .gt('estoque_atual', 0);
        
        if (error) throw error;
        
        if (!produtos || produtos.length === 0) {
            container.innerHTML = '<div class="sem-resultados">📭 Nenhum produto com estoque encontrado.</div>';
            return;
        }
        
        // Filtrar por busca
        let produtosFiltrados = produtos;
        if (busca) {
            produtosFiltrados = produtos.filter(p => 
                p.codigo_interno?.toLowerCase().includes(busca.toLowerCase())
            );
        }
        
        if (produtosFiltrados.length === 0) {
            container.innerHTML = '<div class="sem-resultados">📭 Nenhum produto encontrado.</div>';
            return;
        }
        
        let html = '';
        
        for (const produto of produtosFiltrados) {
            // Buscar apenas entradas com quantidade > 0
            const { data: entradas, error: err } = await window.supabaseClient
                .from('nota_itens')
                .select('*, notas_fiscais(numero_nota, data_emissao)')
                .eq('produto_id', produto.id)
                .gt('quantidade', 0)
                .order('created_at', { ascending: true });
            
            if (err) continue;
            
            if (!entradas || entradas.length === 0) continue;
            
            const totalEstoque = entradas.reduce((sum, e) => sum + e.quantidade, 0);
            
            html += `
                <div class="lote-card">
                    <h3>📦 ${produto.codigo_interno || '-'} - ${produto.nome}</h3>
                    <p>Estoque total: <strong>${totalEstoque}</strong> ${produto.unidade_medida || 'UN'}</p>
                    <div class="table-wrapper" style="margin-top: 15px;">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Ordem</th>
                                    <th>Nota Fiscal</th>
                                    <th>Data Entrada</th>
                                    <th>Fabricação</th>
                                    <th>Validade</th>
                                    <th>Quantidade</th>
                                    <th>Preço</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${entradas.map((e, idx) => {
                                    const hoje = new Date();
                                    const val = e.data_validade ? new Date(e.data_validade) : null;
                                    const diasRest = val ? Math.ceil((val - hoje) / (1000 * 60 * 60 * 24)) : 0;
                                    
                                    let badgeClass = 'badge-1';
                                    let statusText = 'OK';
                                    if (diasRest < 0) { badgeClass = 'badge-3'; statusText = 'Vencido'; }
                                    else if (diasRest < 30) { badgeClass = 'badge-2'; statusText = 'Alerta'; }
                                    
                                    return `
                                    <tr>
                                        <td><strong>${idx + 1}º</strong></td>
                                        <td>${e.notas_fiscais?.numero_nota || '-'}</td>
                                        <td>${formatDate(e.created_at)}</td>
                                        <td>${e.data_fabricacao ? formatDate(e.data_fabricacao) : '-'}</td>
                                        <td><strong>${e.data_validade ? formatDate(e.data_validade) : '-'}</strong> (${diasRest} dias)</td>
                                        <td>${e.quantidade}</td>
                                        <td>${formatMoney(e.preco_unitario)}</td>
                                        <td><span class="${badgeClass}">${statusText}</span></td>
                                    </tr>
                                `}).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: #666;">
                        💡 <strong>Ordem FIFO:</strong> Os produtos devem sair na ordem acima (1º, 2º, 3º...)
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html || '<div class="sem-resultados">📭 Nenhuma entrada com estoque encontrada.</div>';
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `<div class="sem-resultados" style="color:red;">❌ Erro ao carregar: ${error.message}</div>`;
    }
}