async function carregarDataCritica() {
    const main = document.getElementById('conteudo-principal');
    if (!main) return;
    
    main.innerHTML = `
        <style>
            .critica-container { padding: 20px; }
            .critica-header { margin-bottom: 20px; }
            .resumo-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 25px; }
            .resumo-card { padding: 20px; border-radius: 12px; text-align: center; }
            .resumo-card .numero { font-size: 32px; font-weight: bold; }
            .resumo-card .label { font-size: 14px; margin-top: 5px; }
            .card-terco1 { border-left: 4px solid #28a745; }
            .card-terco2 { border-left: 4px solid #ffc107; }
            .card-terco3 { border-left: 4px solid #dc3545; }
            .badge-1 { background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            .badge-2 { background: #ffc107; color: #333; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            .badge-3 { background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
        </style>
        
        <div class="critica-container">
            <div class="critica-header">
                <h1 style="margin-bottom: 10px;">⚠️ Data Crítica - Controle de Validade</h1>
                <p>Produtos organizados por seus 3 terços de validade</p>
            </div>
            
            <div id="critica-resumo" class="resumo-cards"></div>
            
            <div class="card card-terco1">
                <div class="card-header">🟢 1º TERÇO - Produtos com validade OK</div>
                <div id="critica-terco1" class="table-wrapper">Carregando...</div>
            </div>
            
            <div class="card card-terco2">
                <div class="card-header">🟡 2º TERÇO - ALERTA! Produtos com validade próxima</div>
                <div id="critica-terco2" class="table-wrapper">Carregando...</div>
            </div>
            
            <div class="card card-terco3">
                <div class="card-header">🔴 3º TERÇO - DATA CRÍTICA! NÃO RECEBER MAIS</div>
                <div id="critica-terco3" class="table-wrapper">Carregando...</div>
            </div>
        </div>
    `;
    
    await carregarDataCriticaLista();
}

async function carregarDataCriticaLista() {
    try {
        const { data: lotes, error } = await window.supabaseClient
            .from('lotes_estoque')
            .select('*, produtos(id, nome, codigo_interno, unidade_medida)')
            .gt('quantidade_atual', 0);
        
        if (error) throw error;
        
        if (!lotes || lotes.length === 0) {
            document.getElementById('critica-terco1').innerHTML = '<p>Nenhum lote encontrado.</p>';
            return;
        }
        
        const hoje = new Date();
        const terco1 = [];
        const terco2 = [];
        const terco3 = [];
        
        for (const lote of lotes) {
            if (!lote.data_validade || !lote.data_fabricacao) {
                terco1.push({ ...lote, terco: 1, diasRestantes: 999, status: 'Sem data de validade' });
                continue;
            }
            
            const fab = new Date(lote.data_fabricacao);
            const val = new Date(lote.data_validade);
            const vidaTotal = (val - fab) / (1000 * 60 * 60 * 24);
            const diasPassados = (hoje - fab) / (1000 * 60 * 60 * 24);
            let terco = 1;
            
            if (vidaTotal > 0) {
                terco = Math.ceil((diasPassados / vidaTotal) * 3);
                if (terco < 1) terco = 1;
                if (terco > 3) terco = 3;
            }
            
            const diasRestantes = Math.ceil((val - hoje) / (1000 * 60 * 60 * 24));
            
            if (terco === 1) terco1.push({ ...lote, terco, diasRestantes });
            else if (terco === 2) terco2.push({ ...lote, terco, diasRestantes });
            else terco3.push({ ...lote, terco, diasRestantes });
        }
        
        // Atualizar resumo
        const resumoDiv = document.getElementById('critica-resumo');
        if (resumoDiv) {
            resumoDiv.innerHTML = `
                <div class="resumo-card" style="background:#d4edda;">
                    <div class="numero">${terco1.length}</div>
                    <div class="label">🟢 Produtos OK</div>
                </div>
                <div class="resumo-card" style="background:#fff3cd;">
                    <div class="numero">${terco2.length}</div>
                    <div class="label">🟡 Produtos em Alerta</div>
                </div>
                <div class="resumo-card" style="background:#f8d7da;">
                    <div class="numero">${terco3.length}</div>
                    <div class="label">🔴 Produtos em Data Crítica</div>
                </div>
            `;
        }
        
        const renderTabela = (dados) => {
            if (dados.length === 0) return `<p>✅ Nenhum produto encontrado</p>`;
            return `
                <table class="table">
                    <thead>
                        <tr>
                            <th>Código</th><th>Produto</th><th>Lote</th><th>Fabricação</th><th>Validade</th><th>Estoque</th><th>Dias Rest.</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dados.map(l => {
                            let diasColor = '';
                            if (l.diasRestantes < 0) diasColor = '#dc3545';
                            else if (l.diasRestantes < 30) diasColor = '#ffc107';
                            else diasColor = '#28a745';
                            return `<tr>
                                <td><strong>${l.produtos?.codigo_interno || '-'}</strong></td>
                                <td>${l.produtos?.nome || '-'}</td>
                                <td>${l.lote || '-'}</td>
                                <td>${formatDate(l.data_fabricacao)}</td>
                                <td><strong style="color:${diasColor}">${formatDate(l.data_validade)}</strong></td>
                                <td>${l.quantidade_atual} ${l.produtos?.unidade_medida || 'UN'}</td>
                                <td style="color:${diasColor};font-weight:bold;">${l.diasRestantes} dias</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            `;
        };
        
        document.getElementById('critica-terco1').innerHTML = renderTabela(terco1);
        document.getElementById('critica-terco2').innerHTML = renderTabela(terco2);
        document.getElementById('critica-terco3').innerHTML = renderTabela(terco3);
        
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('critica-terco1').innerHTML = `<p>Erro ao carregar: ${error.message}</p>`;
    }
}