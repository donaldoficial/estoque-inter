async function carregarDataCritica() {
    const main = document.getElementById('conteudo-principal');
    if (!main) return;
    
    main.innerHTML = `
        <style>
            .critica-container { padding: 20px; }
            .critica-header {
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
            .resumo-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 25px; }
            .resumo-card { padding: 20px; border-radius: 12px; text-align: center; }
            .resumo-card .numero { font-size: 32px; font-weight: bold; }
            .resumo-card .label { font-size: 14px; margin-top: 5px; }
            .card-terco1 { border-left: 4px solid #28a745; }
            .card-terco2 { border-left: 4px solid #ffc107; }
            .card-terco3 { border-left: 4px solid #dc3545; }
            .badge-1 { background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
            .badge-2 { background: #ffc107; color: #333; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
            .badge-3 { background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
            .sem-resultados { text-align: center; padding: 40px; color: #666; }
        </style>
        
        <div class="critica-container">
            <div class="critica-header">
                <h1 style="margin: 0;">⚠️ Data Crítica - Controle de Validade</h1>
                <button onclick="carregarDataCriticaLista()" class="btn-atualizar">🔄 Atualizar</button>
            </div>
            <p style="margin-bottom: 20px;">Produtos organizados por seus 3 terços de validade</p>
            
            <div id="critica-resumo" class="resumo-cards"></div>
            
            <div class="card card-terco2">
                <div class="card-header">🟡 2º TERÇO - ALERTA! Produtos com validade próxima</div>
                <div id="critica-terco2" class="table-wrapper">Carregando...</div>
            </div>
            
            <div class="card card-terco3">
                <div class="card-header">🔴 3º TERÇO - DATA CRÍTICA! NÃO RECEBER MAIS</div>
                <div id="critica-terco3" class="table-wrapper">Carregando...</div>
            </div>
            
            <div class="card card-terco1">
                <div class="card-header">🟢 1º TERÇO - Produtos com validade OK</div>
                <div id="critica-terco1" class="table-wrapper">Carregando...</div>
            </div>
        </div>
    `;
    
    await carregarDataCriticaLista();
}

async function carregarDataCriticaLista() {
    // Verificar se os elementos existem antes de tentar modificar
    const terco1Div = document.getElementById('critica-terco1');
    const terco2Div = document.getElementById('critica-terco2');
    const terco3Div = document.getElementById('critica-terco3');
    const resumoDiv = document.getElementById('critica-resumo');
    
    if (!terco1Div || !terco2Div || !terco3Div || !resumoDiv) {
        console.log('Elementos da Data Crítica não encontrados (página não está aberta)');
        return;
    }
    
    try {
        const { data: lotes, error } = await window.supabaseClient
            .from('lotes_estoque')
            .select('*, produtos(id, nome, codigo_interno, unidade_medida)')
            .gt('quantidade_atual', 0);
        
        if (error) throw error;
        
        if (!lotes || lotes.length === 0) {
            terco1Div.innerHTML = '<div class="sem-resultados">📭 Nenhum lote encontrado.</div>';
            terco2Div.innerHTML = '<div class="sem-resultados">📭 Nenhum lote encontrado</div>';
            terco3Div.innerHTML = '<div class="sem-resultados">📭 Nenhum lote encontrado</div>';
            return;
        }
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const terco1 = [];
        const terco2 = [];
        const terco3 = [];
        
        for (const lote of lotes) {
            const produto = lote.produtos;
            if (!produto) continue;
            
            if (!lote.data_validade || !lote.data_fabricacao) {
                terco1.push({ ...lote, produto, terco: 1, diasRestantes: 999 });
                continue;
            }
            
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
            
            const diasRestantes = Math.ceil((val - hoje) / (1000 * 60 * 60 * 24));
            
            const loteCompleto = { ...lote, produto, terco, diasRestantes };
            
            if (terco === 1) terco1.push(loteCompleto);
            else if (terco === 2) terco2.push(loteCompleto);
            else terco3.push(loteCompleto);
        }
        
        // Ordenar por validade (mais próxima primeiro)
        terco1.sort((a, b) => a.diasRestantes - b.diasRestantes);
        terco2.sort((a, b) => a.diasRestantes - b.diasRestantes);
        terco3.sort((a, b) => a.diasRestantes - b.diasRestantes);
        
        const totalLotes = lotes.length;
        const totalEstoque = lotes.reduce((sum, l) => sum + (l.quantidade_atual || 0), 0);
        
        resumoDiv.innerHTML = `
            <div class="resumo-card" style="background:#d4edda;">
                <div class="numero">${terco1.length}</div>
                <div class="label">🟢 Lotes OK</div>
                <div style="font-size:12px;">${terco1.reduce((s, l) => s + l.quantidade_atual, 0)} unidades</div>
            </div>
            <div class="resumo-card" style="background:#fff3cd;">
                <div class="numero">${terco2.length}</div>
                <div class="label">🟡 Lotes em Alerta</div>
                <div style="font-size:12px;">${terco2.reduce((s, l) => s + l.quantidade_atual, 0)} unidades</div>
            </div>
            <div class="resumo-card" style="background:#f8d7da;">
                <div class="numero">${terco3.length}</div>
                <div class="label">🔴 Lotes em Data Crítica</div>
                <div style="font-size:12px;">${terco3.reduce((s, l) => s + l.quantidade_atual, 0)} unidades</div>
            </div>
            <div class="resumo-card" style="background:#e7f3ff;">
                <div class="numero">${totalLotes}</div>
                <div class="label">📦 Total de Lotes</div>
                <div style="font-size:12px;">${totalEstoque} unidades</div>
            </div>
        `;
        
        const renderTabela = (dados) => {
            if (dados.length === 0) return `<p class="sem-resultados">✅ Nenhum produto encontrado</p>`;
            return `
                <div class="table-wrapper">
                    <table class="table">
                        <thead><tr>
                            <th>Código</th>
                            <th>Produto</th>
                            <th>Nº Documento</th>
                            <th>Fabricação</th>
                            <th>Validade</th>
                            <th>Estoque</th>
                            <th>Dias Rest.</th>
                            <th>Status</th>
                        </tr></thead>
                        <tbody>
                            ${dados.map(l => {
                                const produto = l.produtos;
                                let diasColor = '';
                                if (l.diasRestantes < 0) diasColor = '#dc3545';
                                else if (l.diasRestantes < 30) diasColor = '#ffc107';
                                else diasColor = '#28a745';
                                
                                let numeroDocumento = l.lote || 'N/A';
                                if (l.lote && l.lote.startsWith('NF-')) {
                                    numeroDocumento = l.lote.replace('NF-', 'Nota: ');
                                }
                                
                                return `<tr>
                                    <td><strong>${produto?.codigo_interno || '-'}</strong></td>
                                    <td>${produto?.nome || '-'}</td>
                                    <td>${numeroDocumento}</td>
                                    <td>${l.data_fabricacao ? formatDate(l.data_fabricacao) : '-'}</td>
                                    <td><strong style="color:${diasColor}">${l.data_validade ? formatDate(l.data_validade) : '-'}</strong></td>
                                    <td>${l.quantidade_atual || 0} ${produto?.unidade_medida || 'UN'}</td>
                                    <td style="color:${diasColor};font-weight:bold;">${l.diasRestantes} dias</span></td>
                                    <td><span class="badge-${l.terco}">${l.terco}º Terço</span></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        };
        
        terco1Div.innerHTML = renderTabela(terco1);
        terco2Div.innerHTML = renderTabela(terco2);
        terco3Div.innerHTML = renderTabela(terco3);
        
    } catch (error) {
        console.error('Erro:', error);
        terco1Div.innerHTML = `<div class="sem-resultados" style="color:red;">❌ Erro ao carregar: ${error.message}</div>`;
    }
}