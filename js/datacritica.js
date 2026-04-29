async function carregarDataCritica() {
    const main = document.getElementById('conteudo-principal');
    if (!main) return;
    
    main.innerHTML = `
        <style>
            .critica-container { padding: 20px; }
            .critica-header { margin-bottom: 20px; }
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
            .previsao-container { margin-top: 10px; font-size: 12px; }
            .btn-atualizar { background: #17a2b8; color: white; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; margin-bottom: 20px; }
            .sem-resultados { text-align: center; padding: 40px; color: #666; }
            .info-ferramenta { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 10px 15px; margin-bottom: 20px; border-radius: 4px; font-size: 13px; }
            .btn-atualizar:hover { transform: translateY(-2px); }
        </style>
        
        <div class="critica-container">
            <div class="critica-header">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                    <h1 style="margin: 0;">⚠️ Data Crítica - Controle de Validade</h1>
                    <button onclick="carregarDataCriticaLista()" class="btn-atualizar">🔄 Atualizar Dados</button>
                </div>
                <p style="margin-top: 10px;">Produtos organizados por seus 3 terços de validade</p>
            </div>
            
            <div class="info-ferramenta">
                💡 <strong>Como funciona:</strong> O sistema calcula em qual terço cada produto está baseado na data de fabricação e validade.<br>
                • <strong>2º Terço:</strong> Mostra quando cada produto vai entrar no 3º Terço (data crítica).<br>
                • <strong>3º Terço:</strong> Produtos que NÃO devem ser recebidos em novas notas fiscais.
            </div>
            
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
    try {
        // Buscar lotes com quantidade atual > 0
        const { data: lotes, error } = await window.supabaseClient
            .from('lotes_estoque')
            .select('*, produtos(id, nome, codigo_interno, unidade_medida)')
            .gt('quantidade_atual', 0);
        
        if (error) throw error;
        
        console.log('Lotes encontrados:', lotes?.length || 0); // Debug
        
        if (!lotes || lotes.length === 0) {
            document.getElementById('critica-terco1').innerHTML = '<div class="sem-resultados">📭 Nenhum lote encontrado. Cadastre produtos com data de validade na entrada.</div>';
            document.getElementById('critica-terco2').innerHTML = '<div class="sem-resultados">📭 Nenhum lote encontrado</div>';
            document.getElementById('critica-terco3').innerHTML = '<div class="sem-resultados">📭 Nenhum lote encontrado</div>';
            return;
        }
        
        // Filtrar lotes que têm produto associado
        const lotesValidos = lotes.filter(l => l.produtos !== null);
        
        if (lotesValidos.length === 0) {
            document.getElementById('critica-terco1').innerHTML = '<div class="sem-resultados">📭 Nenhum produto válido encontrado.</div>';
            return;
        }
        
        const hoje = new Date();
        const terco1 = [];
        const terco2 = [];
        const terco3 = [];
        
        for (const lote of lotesValidos) {
            const produto = lote.produtos;
            if (!produto) continue;
            
            // Se não tem data de validade, considerar como 1º terço
            if (!lote.data_validade || !lote.data_fabricacao) {
                terco1.push({ 
                    ...lote, 
                    produto, 
                    terco: 1, 
                    diasRestantes: 999, 
                    status: 'Sem data de validade',
                    dataEntrada3Terco: null
                });
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
            
            // Calcular quando vai entrar no 3º terço
            let dataEntrada3Terco = null;
            let diasPara3Terco = null;
            
            if (vidaTotal > 0 && terco === 2) {
                const diasParaInicio3Terco = (vidaTotal * 2/3) - diasPassados;
                if (diasParaInicio3Terco > 0) {
                    dataEntrada3Terco = new Date(hoje.getTime() + (diasParaInicio3Terco * 24 * 60 * 60 * 1000));
                    diasPara3Terco = Math.ceil(diasParaInicio3Terco);
                }
            }
            
            const loteCompleto = { 
                ...lote, 
                produto, 
                terco, 
                diasRestantes,
                dataEntrada3Terco,
                diasPara3Terco,
                vidaTotal
            };
            
            if (terco === 1) terco1.push(loteCompleto);
            else if (terco === 2) terco2.push(loteCompleto);
            else terco3.push(loteCompleto);
        }
        
        // Ordenar por dias restantes
        terco1.sort((a, b) => a.diasRestantes - b.diasRestantes);
        terco2.sort((a, b) => a.diasRestantes - b.diasRestantes);
        terco3.sort((a, b) => a.diasRestantes - b.diasRestantes);
        
        // Calcular resumo
        const totalLotes = lotesValidos.length;
        const totalEstoque = lotesValidos.reduce((sum, l) => sum + (l.quantidade_atual || 0), 0);
        
        const resumoDiv = document.getElementById('critica-resumo');
        if (resumoDiv) {
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
        }
        
        const renderTabelaTerco2 = (dados) => {
            if (dados.length === 0) return `<p class="sem-resultados">✅ Nenhum produto no 2º terço</p>`;
            return `
                <div class="table-wrapper">
                    <table class="table">
                        <thead><tr><th>Código</th><th>Produto</th><th>Lote</th><th>Fabricação</th><th>Validade</th><th>Estoque</th><th>Dias Rest.</th><th>Previsão 3º Terço</th></tr></thead>
                        <tbody>
                            ${dados.map(l => {
                                const produto = l.produto;
                                let diasColor = '';
                                if (l.diasRestantes < 0) diasColor = '#dc3545';
                                else if (l.diasRestantes < 30) diasColor = '#ffc107';
                                else diasColor = '#28a745';
                                
                                let previsaoHtml = '';
                                if (l.diasPara3Terco !== null && l.diasPara3Terco > 0) {
                                    if (l.diasPara3Terco <= 7) {
                                        previsaoHtml = `<span style="background:#dc3545; color:white; padding:4px 8px; border-radius:12px; font-size:11px;">🔴 URGENTE! ${l.diasPara3Terco} dias</span><br><small>${formatDate(l.dataEntrada3Terco)}</small>`;
                                    } else if (l.diasPara3Terco <= 15) {
                                        previsaoHtml = `<span style="background:#ffc107; color:#333; padding:4px 8px; border-radius:12px; font-size:11px;">⚠️ ${l.diasPara3Terco} dias</span><br><small>${formatDate(l.dataEntrada3Terco)}</small>`;
                                    } else {
                                        previsaoHtml = `<span style="background:#17a2b8; color:white; padding:4px 8px; border-radius:12px; font-size:11px;">📅 ${l.diasPara3Terco} dias</span><br><small>${formatDate(l.dataEntrada3Terco)}</small>`;
                                    }
                                } else {
                                    previsaoHtml = `<span style="color:#666;">-</span>`;
                                }
                                
                                return `<tr>
                                    <td><strong>${produto?.codigo_interno || '-'}</strong></td>
                                    <td>${produto?.nome || '-'}</td>
                                    <td>${l.lote || '-'}</td>
                                    <td>${l.data_fabricacao ? formatDate(l.data_fabricacao) : '-'}</td>
                                    <td><strong style="color:${diasColor}">${l.data_validade ? formatDate(l.data_validade) : '-'}</strong></td>
                                    <td>${l.quantidade_atual || 0} ${produto?.unidade_medida || 'UN'}</td>
                                    <td style="color:${diasColor};font-weight:bold;">${l.diasRestantes} dias</td>
                                    <td>${previsaoHtml}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        };
        
        const renderTabelaTerco3 = (dados) => {
            if (dados.length === 0) return `<p class="sem-resultados">✅ Nenhum produto no 3º terço</p>`;
            return `
                <div class="table-wrapper">
                    <table class="table">
                        <thead><tr><th>Código</th><th>Produto</th><th>Lote</th><th>Fabricação</th><th>Validade</th><th>Estoque</th><th>Dias Rest.</th><th>Situação</th></tr></thead>
                        <tbody>
                            ${dados.map(l => {
                                const produto = l.produto;
                                let diasColor = '';
                                if (l.diasRestantes < 0) diasColor = '#dc3545';
                                else if (l.diasRestantes < 30) diasColor = '#ffc107';
                                else diasColor = '#28a745';
                                
                                return `<tr>
                                    <td><strong>${produto?.codigo_interno || '-'}</strong></td>
                                    <td>${produto?.nome || '-'}</td>
                                    <td>${l.lote || '-'}</td>
                                    <td>${l.data_fabricacao ? formatDate(l.data_fabricacao) : '-'}</td>
                                    <td><strong style="color:${diasColor}">${l.data_validade ? formatDate(l.data_validade) : '-'}</strong></td>
                                    <td>${l.quantidade_atual || 0} ${produto?.unidade_medida || 'UN'}</td>
                                    <td style="color:${diasColor};font-weight:bold;">${l.diasRestantes} dias</td>
                                    <td><span style="color:#dc3545; font-weight:bold;">🚫 NÃO RECEBER MAIS</span></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        };
        
        const renderTabelaTerco1 = (dados) => {
            if (dados.length === 0) return `<p class="sem-resultados">✅ Nenhum produto no 1º terço</p>`;
            return `
                <div class="table-wrapper">
                    <table class="table">
                        <thead><tr><th>Código</th><th>Produto</th><th>Lote</th><th>Fabricação</th><th>Validade</th><th>Estoque</th><th>Dias Rest.</th></tr></thead>
                        <tbody>
                            ${dados.map(l => {
                                const produto = l.produto;
                                let diasColor = '#28a745';
                                
                                return `<tr>
                                    <td><strong>${produto?.codigo_interno || '-'}</strong></td>
                                    <td>${produto?.nome || '-'}</td>
                                    <td>${l.lote || '-'}</td>
                                    <td>${l.data_fabricacao ? formatDate(l.data_fabricacao) : '-'}</td>
                                    <td><strong style="color:${diasColor}">${l.data_validade ? formatDate(l.data_validade) : '-'}</strong></td>
                                    <td>${l.quantidade_atual || 0} ${produto?.unidade_medida || 'UN'}</td>
                                    <td style="color:${diasColor};font-weight:bold;">${l.diasRestantes} dias</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        };
        
        const terco1Div = document.getElementById('critica-terco1');
        const terco2Div = document.getElementById('critica-terco2');
        const terco3Div = document.getElementById('critica-terco3');
        
        if (terco1Div) terco1Div.innerHTML = renderTabelaTerco1(terco1);
        if (terco2Div) terco2Div.innerHTML = renderTabelaTerco2(terco2);
        if (terco3Div) terco3Div.innerHTML = renderTabelaTerco3(terco3);
        
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('critica-terco1').innerHTML = `<div class="sem-resultados" style="color:red;">❌ Erro ao carregar: ${error.message}</div>`;
    }
}