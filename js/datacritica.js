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
            .resumo-cards {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin-bottom: 25px;
            }
            .resumo-card {
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                transition: transform 0.2s;
            }
            .resumo-card:hover { transform: translateY(-3px); }
            .resumo-card .numero { font-size: 32px; font-weight: bold; }
            .resumo-card .label { font-size: 14px; margin-top: 5px; }
            .resumo-card .unidades { font-size: 12px; margin-top: 5px; opacity: 0.8; }
            .card-terco1 { border-left: 4px solid #28a745; }
            .card-terco2 { border-left: 4px solid #ffc107; }
            .card-terco3 { border-left: 4px solid #dc3545; }
            .badge-1 { background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; }
            .badge-2 { background: #ffc107; color: #333; padding: 4px 12px; border-radius: 20px; font-size: 11px; }
            .badge-3 { background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; }
            .previsao-urgente { background: #dc3545; color: white; padding: 6px 10px; border-radius: 8px; font-size: 12px; text-align: center; }
            .previsao-atencao { background: #ffc107; color: #333; padding: 6px 10px; border-radius: 8px; font-size: 12px; text-align: center; }
            .previsao-normal { background: #17a2b8; color: white; padding: 6px 10px; border-radius: 8px; font-size: 12px; text-align: center; }
            .sem-resultados { text-align: center; padding: 40px; color: #666; }
            .table-wrapper { overflow-x: auto; }
            .table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
            }
            .table th {
                background: #f8f9fa;
                padding: 12px;
                text-align: left;
                font-weight: 600;
                border-bottom: 2px solid #dee2e6;
            }
            .table td {
                padding: 10px 12px;
                border-bottom: 1px solid #e0e0e0;
                vertical-align: middle;
            }
            .table tr:hover { background: #f8f9fa; }
            .status-badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: bold;
            }
            .status-ok { background: #d4edda; color: #155724; }
            .status-alerta { background: #fff3cd; color: #856404; }
            .status-critico { background: #f8d7da; color: #721c24; }
            @media (max-width: 768px) {
                .resumo-cards { grid-template-columns: repeat(2, 1fr); }
                .table { font-size: 11px; }
                .table th, .table td { padding: 6px 8px; }
            }
        </style>
        
        <div class="critica-container">
            <div class="critica-header">
                <h1 style="margin: 0;">⚠️ Data Crítica - Controle de Validade</h1>
                <button onclick="carregarDataCriticaLista()" class="btn-atualizar">🔄 Atualizar</button>
            </div>
            <p style="margin-bottom: 20px; color: #666;">Produtos organizados por seus 3 terços de validade - Emitido em: ${formatDateTime(new Date())}</p>
            
            <div id="critica-resumo" class="resumo-cards"></div>
            
            <!-- 1º TERÇO - OK -->
            <div class="card card-terco1" style="margin-bottom: 25px;">
                <div class="card-header" style="background: #d4edda; color: #155724;">
                    🟢 1º TERÇO - Produtos dentro da validade (PODE RECEBER)
                </div>
                <div id="critica-terco1" class="table-wrapper" style="padding: 15px;">Carregando...</div>
            </div>
            
            <!-- 2º TERÇO - ALERTA -->
            <div class="card card-terco2" style="margin-bottom: 25px;">
                <div class="card-header" style="background: #fff3cd; color: #856404;">
                    🟡 2º TERÇO - ALERTA! Produtos com validade próxima (PODE RECEBER COM ATENÇÃO)
                </div>
                <div id="critica-terco2" class="table-wrapper" style="padding: 15px;">Carregando...</div>
            </div>
            
            <!-- 3º TERÇO - CRÍTICO -->
            <div class="card card-terco3" style="margin-bottom: 25px;">
                <div class="card-header" style="background: #f8d7da; color: #721c24;">
                    🔴 3º TERÇO - DATA CRÍTICA! NÃO RECEBER MAIS ESTES PRODUTOS
                </div>
                <div id="critica-terco3" class="table-wrapper" style="padding: 15px;">Carregando...</div>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        carregarDataCriticaLista();
    }, 100);
}

async function carregarDataCriticaLista() {
    const terco1Div = document.getElementById('critica-terco1');
    const terco2Div = document.getElementById('critica-terco2');
    const terco3Div = document.getElementById('critica-terco3');
    const resumoDiv = document.getElementById('critica-resumo');
    
    if (!terco1Div) return;
    
    terco1Div.innerHTML = '<div class="sem-resultados">🔍 Carregando dados...</div>';
    
    try {
        const { data: itens, error } = await window.supabaseClient
            .from('nota_itens')
            .select('*, produtos(*), notas_fiscais(numero_nota, data_emissao)')
            .gt('quantidade', 0)
            .not('data_validade', 'is', null)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!itens || itens.length === 0) {
            terco1Div.innerHTML = '<div class="sem-resultados">📭 Nenhum produto com estoque e validade encontrado.</div>';
            return;
        }
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const terco1 = [];
        const terco2 = [];
        const terco3 = [];
        let totalUnidades1 = 0, totalUnidades2 = 0, totalUnidades3 = 0;
        
        for (const item of itens) {
            const produto = item.produtos;
            if (!produto) continue;
            
            const fab = item.data_fabricacao ? new Date(item.data_fabricacao) : new Date(item.created_at);
            const val = new Date(item.data_validade);
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
            const quantidade = item.quantidade;
            
            // Calcular data prevista para entrar no 3º terço
            let dataPrevista3Terco = null;
            let diasPara3Terco = null;
            let previsaoHtml = '';
            
            if (vidaTotal > 0 && terco === 2) {
                const diasParaInicio3Terco = (vidaTotal * 2/3) - diasPassados;
                if (diasParaInicio3Terco > 0) {
                    dataPrevista3Terco = new Date(hoje.getTime() + (diasParaInicio3Terco * 24 * 60 * 60 * 1000));
                    diasPara3Terco = Math.ceil(diasParaInicio3Terco);
                    
                    if (diasPara3Terco <= 7) {
                        previsaoHtml = `<div class="previsao-urgente">🔴 URGENTE! ${diasPara3Terco} dias<br><small>${formatDate(dataPrevista3Terco)}</small></div>`;
                    } else if (diasPara3Terco <= 15) {
                        previsaoHtml = `<div class="previsao-atencao">⚠️ ATENÇÃO! ${diasPara3Terco} dias<br><small>${formatDate(dataPrevista3Terco)}</small></div>`;
                    } else {
                        previsaoHtml = `<div class="previsao-normal">📅 ${diasPara3Terco} dias<br><small>${formatDate(dataPrevista3Terco)}</small></div>`;
                    }
                } else {
                    previsaoHtml = `<span style="color:#666;">-</span>`;
                }
            }
            
            const itemData = {
                codigo: produto.codigo_interno || '-',
                produto: produto.nome,
                nota: item.notas_fiscais?.numero_nota || '-',
                fabricacao: item.data_fabricacao ? formatDate(item.data_fabricacao) : '-',
                validade: formatDate(item.data_validade),
                quantidade: quantidade,
                unidade: produto.unidade_medida || 'UN',
                diasRestantes: diasRestantes,
                terco: terco,
                previsao: previsaoHtml
            };
            
            if (terco === 1) {
                terco1.push(itemData);
                totalUnidades1 += quantidade;
            } else if (terco === 2) {
                terco2.push(itemData);
                totalUnidades2 += quantidade;
            } else {
                terco3.push(itemData);
                totalUnidades3 += quantidade;
            }
        }
        
        // Ordenar por dias restantes (mais urgentes primeiro)
        terco1.sort((a, b) => a.diasRestantes - b.diasRestantes);
        terco2.sort((a, b) => a.diasRestantes - b.diasRestantes);
        terco3.sort((a, b) => a.diasRestantes - b.diasRestantes);
        
        // Renderizar tabela do 1º Terço
        const renderTabela = (dados, tipo) => {
            if (dados.length === 0) {
                return `<div class="sem-resultados">✅ Nenhum produto neste terço</div>`;
            }
            
            let html = `<div class="table-wrapper">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Produto</th>
                            <th>Nota Fiscal</th>
                            <th>Fabricação</th>
                            <th>Validade</th>
                            <th>Qtd</th>
                            <th>Dias Rest.</th>
                            ${tipo === 'terco2' ? '<th>Previsão 3º Terço</th>' : ''}
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>`;
            
            for (const item of dados) {
                let statusClass = '';
                let statusText = '';
                if (item.diasRestantes < 0) {
                    statusClass = 'status-critico';
                    statusText = 'VENCIDO';
                } else if (item.diasRestantes < 30) {
                    statusClass = 'status-alerta';
                    statusText = '⚠️ ALERTA';
                } else {
                    statusClass = 'status-ok';
                    statusText = '✓ OK';
                }
                
                let badgeTerco = '';
                if (item.terco === 1) badgeTerco = '<span class="badge-1">1º Terço</span>';
                else if (item.terco === 2) badgeTerco = '<span class="badge-2">2º Terço</span>';
                else badgeTerco = '<span class="badge-3">3º Terço</span>';
                
                let diasColor = '';
                if (item.diasRestantes < 0) diasColor = '#dc3545';
                else if (item.diasRestantes < 30) diasColor = '#ffc107';
                else diasColor = '#28a745';
                
                html += `<tr>
                    <td><strong>${item.codigo}</strong></td>
                    <td>${item.produto}</td>
                    <td>${item.nota}</td>
                    <td>${item.fabricacao}</td>
                    <td><strong>${item.validade}</strong></td>
                    <td>${item.quantidade} ${item.unidade}</td>
                    <td style="color:${diasColor}; font-weight:bold;">${item.diasRestantes} dias</td>
                    ${tipo === 'terco2' ? `<td>${item.previsao || '-'}</td>` : ''}
                    <td><span class="status-badge ${statusClass}">${statusText}</span><br>${badgeTerco}</td>
                </tr>`;
            }
            
            html += `</tbody></table></div>`;
            return html;
        };
        
        // Atualizar resumo
        if (resumoDiv) {
            resumoDiv.innerHTML = `
                <div class="resumo-card" style="background:#d4edda;">
                    <div class="numero">${terco1.length}</div>
                    <div class="label">🟢 Produtos OK</div>
                    <div class="unidades">${totalUnidades1} unidades</div>
                </div>
                <div class="resumo-card" style="background:#fff3cd;">
                    <div class="numero">${terco2.length}</div>
                    <div class="label">🟡 Em Alerta</div>
                    <div class="unidades">${totalUnidades2} unidades</div>
                </div>
                <div class="resumo-card" style="background:#f8d7da;">
                    <div class="numero">${terco3.length}</div>
                    <div class="label">🔴 Data Crítica</div>
                    <div class="unidades">${totalUnidades3} unidades</div>
                </div>
                <div class="resumo-card" style="background:#e7f3ff;">
                    <div class="numero">${itens.length}</div>
                    <div class="label">📦 Total Itens</div>
                    <div class="unidades">${totalUnidades1 + totalUnidades2 + totalUnidades3} unidades</div>
                </div>
            `;
        }
        
        terco1Div.innerHTML = renderTabela(terco1, 'terco1');
        terco2Div.innerHTML = renderTabela(terco2, 'terco2');
        terco3Div.innerHTML = renderTabela(terco3, 'terco3');
        
    } catch (error) {
        console.error('Erro:', error);
        terco1Div.innerHTML = `<div class="sem-resultados" style="color:red;">❌ Erro ao carregar: ${error.message}</div>`;
    }
}