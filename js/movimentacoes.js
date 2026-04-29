async function carregarMovimentacoes() {
    const main = document.getElementById('conteudo-principal');
    
    main.innerHTML = `
        <style>
            .header-acoes {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                flex-wrap: wrap;
                gap: 15px;
            }
            .btn-relatorio {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                padding: 12px 25px;
                font-size: 16px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }
            .btn-relatorio:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(40,167,69,0.3);
            }
            .filtros-relatorio {
                background: #f8f9fa;
                padding: 25px;
                border-radius: 12px;
                margin-bottom: 20px;
            }
            .filtros-relatorio h3 {
                margin-bottom: 20px;
                color: #333;
                font-size: 18px;
            }
            .btn-gerar {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                width: 100%;
                justify-content: center;
                margin-top: 15px;
                padding: 12px;
            }
            .grid-2 {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
            }
            .form-group {
                margin-bottom: 15px;
            }
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #333;
            }
            .form-group input, .form-group select {
                width: 100%;
                padding: 10px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 14px;
            }
            .form-group input:focus, .form-group select:focus {
                outline: none;
                border-color: #667eea;
            }
            .data-range {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            .data-range input {
                flex: 1;
            }
            .data-range span {
                color: #666;
            }
            @media (max-width: 768px) {
                .grid-2 {
                    grid-template-columns: 1fr;
                }
                .data-range {
                    flex-direction: column;
                }
                .data-range span {
                    display: none;
                }
            }
        </style>
        
        <div class="header-acoes">
            <h1 style="margin: 0;">📊 Movimentações</h1>
        </div>
        
        <div class="filtros-relatorio">
            <h3>🎯 Gerar Relatório de Movimentações</h3>
            <div class="grid-2">
                <div class="form-group">
                    <label>Filtrar por Produto (Código Interno)</label>
                    <input type="text" id="filtro-relatorio-produto" placeholder="Digite o código interno do produto">
                    <small style="color: #666;">Ex: 2100, PROD-001</small>
                </div>
                <div class="form-group">
                    <label>Filtrar por Fornecedor</label>
                    <select id="filtro-relatorio-fornecedor">
                        <option value="">Todos os fornecedores</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Período do Relatório</label>
                    <select id="filtro-relatorio-periodo">
                        <option value="">Todo período</option>
                        <option value="7">Últimos 7 dias</option>
                        <option value="15">Últimos 15 dias</option>
                        <option value="30">Últimos 30 dias</option>
                        <option value="60">Últimos 60 dias</option>
                        <option value="90">Últimos 90 dias</option>
                        <option value="180">Últimos 6 meses</option>
                        <option value="365">Último ano</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Data específica (opcional)</label>
                    <div class="data-range">
                        <input type="date" id="filtro-relatorio-data-inicio" placeholder="Data inicial">
                        <span>até</span>
                        <input type="date" id="filtro-relatorio-data-fim" placeholder="Data final">
                    </div>
                </div>
            </div>
            <button onclick="gerarRelatorioHTML()" class="btn-relatorio btn-gerar">
                📄 Gerar Relatório com os Filtros Selecionados
            </button>
        </div>
    `;
    
    await carregarFornecedoresRelatorio();
}

async function carregarFornecedoresRelatorio() {
    try {
        const { data: fornecedores, error } = await window.supabaseClient
            .from('fornecedores')
            .select('id, nome')
            .order('nome');
        
        if (!error && fornecedores) {
            const selectFornecedor = document.getElementById('filtro-relatorio-fornecedor');
            if (selectFornecedor) {
                fornecedores.forEach(f => {
                    selectFornecedor.innerHTML += `<option value="${f.id}">${f.nome}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function gerarRelatorioHTML() {
    try {
        const filtroProdutoCodigo = document.getElementById('filtro-relatorio-produto')?.value;
        const filtroFornecedorId = document.getElementById('filtro-relatorio-fornecedor')?.value;
        const filtroPeriodo = document.getElementById('filtro-relatorio-periodo')?.value;
        const filtroDataInicio = document.getElementById('filtro-relatorio-data-inicio')?.value;
        const filtroDataFim = document.getElementById('filtro-relatorio-data-fim')?.value;
        
        let query = window.supabaseClient
            .from('movimentacoes')
            .select(`
                *,
                produtos (
                    id,
                    nome,
                    codigo_interno,
                    categoria,
                    preco_venda,
                    fornecedor_id,
                    fornecedores (id, nome)
                )
            `)
            .order('data_movimento', { ascending: false });
        
        let produtoInfo = null;
        let fornecedorInfo = null;
        
        if (filtroProdutoCodigo && filtroProdutoCodigo.trim() !== '') {
            const { data: produto } = await window.supabaseClient
                .from('produtos')
                .select('id, nome, codigo_interno')
                .eq('codigo_interno', filtroProdutoCodigo.toUpperCase().trim())
                .maybeSingle();
            
            if (produto) {
                query = query.eq('produto_id', produto.id);
                produtoInfo = produto;
            } else {
                showMessage(`Produto com código "${filtroProdutoCodigo}" não encontrado!`, 'error');
                return;
            }
        }
        
        if (filtroFornecedorId && filtroFornecedorId !== '') {
            query = query.eq('produtos.fornecedor_id', filtroFornecedorId);
            const { data: fornecedor } = await window.supabaseClient
                .from('fornecedores')
                .select('nome')
                .eq('id', filtroFornecedorId)
                .maybeSingle();
            if (fornecedor) fornecedorInfo = fornecedor;
        }
        
        if (filtroPeriodo && filtroPeriodo !== '') {
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - parseInt(filtroPeriodo));
            query = query.gte('data_movimento', dataLimite.toISOString());
        }
        
        if (filtroDataInicio && filtroDataInicio !== '') {
            query = query.gte('data_movimento', new Date(filtroDataInicio).toISOString());
        }
        if (filtroDataFim && filtroDataFim !== '') {
            const dataFim = new Date(filtroDataFim);
            dataFim.setHours(23, 59, 59);
            query = query.lte('data_movimento', dataFim.toISOString());
        }
        
        const { data: movimentacoes, error } = await query;
        
        if (error) throw error;
        
        const movimentacoesEnriquecidas = [];
        for (const m of movimentacoes || []) {
            let numeroDocumento = '-';
            let documentoNome = '';
            
            if (m.documento_tipo === 'nota_fiscal') {
                documentoNome = 'Nota Fiscal';
                const { data: nota } = await window.supabaseClient
                    .from('notas_fiscais')
                    .select('numero_nota')
                    .eq('id', m.documento_id)
                    .maybeSingle();
                if (nota) numeroDocumento = nota.numero_nota;
            } else if (m.documento_tipo === 'romaneio') {
                documentoNome = 'Romaneio';
                const { data: romaneio } = await window.supabaseClient
                    .from('romaneios')
                    .select('numero_romaneio')
                    .eq('id', m.documento_id)
                    .maybeSingle();
                if (romaneio) numeroDocumento = romaneio.numero_romaneio;
            } else if (m.documento_tipo === 'inventario') {
                documentoNome = 'Inventário';
                numeroDocumento = m.observacao || 'Ajuste de estoque';
            }
            
            movimentacoesEnriquecidas.push({ ...m, numero_documento: numeroDocumento, documento_nome: documentoNome });
        }
        
        const totalEntradas = movimentacoes?.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.quantidade, 0) || 0;
        const totalSaidas = movimentacoes?.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.quantidade, 0) || 0;
        const totalInventario = movimentacoes?.filter(m => m.tipo === 'inventario').reduce((sum, m) => sum + m.quantidade, 0) || 0;
        
        const relatorioHTML = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Movimentações</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; padding: 40px; }
        .relatorio { max-width: 1200px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 5px; }
        .info-section { padding: 20px 30px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px; }
        .info-card { text-align: center; flex: 1; min-width: 100px; }
        .info-card .numero { font-size: 24px; font-weight: bold; color: #667eea; }
        .info-card .label { font-size: 12px; color: #666; margin-top: 5px; }
        .tabela-container { padding: 30px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #667eea; color: white; padding: 12px; text-align: left; }
        td { padding: 10px 12px; border-bottom: 1px solid #e0e0e0; }
        tr:hover { background: #f8f9fa; }
        .footer { padding: 20px 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0; }
        .btn-print { position: fixed; bottom: 30px; right: 30px; background: #28a745; color: white; border: none; padding: 15px 30px; border-radius: 50px; cursor: pointer; font-weight: bold; }
        .badge-entrada { background: #d4edda; color: #155724; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
        .badge-saida { background: #f8d7da; color: #721c24; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
        .badge-inventario { background: #fff3cd; color: #856404; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
        .saldo-positivo { color: #28a745; font-weight: bold; }
        .saldo-negativo { color: #dc3545; font-weight: bold; }
        @media print { body { padding: 0; background: white; } .btn-print { display: none; } }
    </style>
</head>
<body>
    <div class="relatorio">
        <div class="header">
            <h1>📊 RELATÓRIO DE MOVIMENTAÇÕES</h1>
            ${produtoInfo ? `<div>Produto filtrado: ${produtoInfo.nome} (${produtoInfo.codigo_interno})</div>` : ''}
            ${fornecedorInfo ? `<div>Fornecedor filtrado: ${fornecedorInfo.nome}</div>` : ''}
            <div>Gerado em: ${formatDateTime(new Date())}</div>
        </div>
        
        <div class="info-section">
            <div class="info-card"><div class="numero">${movimentacoes?.length || 0}</div><div class="label">Total Movimentações</div></div>
            <div class="info-card"><div class="numero">${totalEntradas}</div><div class="label">Total Entradas</div></div>
            <div class="info-card"><div class="numero">${totalSaidas}</div><div class="label">Total Saídas</div></div>
            <div class="info-card"><div class="numero">${totalInventario}</div><div class="label">Total Inventário</div></div>
        </div>
        
        <div class="tabela-container">
            <h3 style="margin-bottom: 15px;">📋 Histórico de Movimentações</h3>
            <table>
                <thead>
                    <tr>
                        <th>Data/Hora</th>
                        <th>Código</th>
                        <th>Produto</th>
                        <th>Fornecedor</th>
                        <th>Tipo</th>
                        <th>Entrada</th>
                        <th>Saída</th>
                        <th>Saldo</th>
                        <th>Documento</th>
                        <th>Nº Documento</th>
                    </tr>
                </thead>
                <tbody>
                    ${movimentacoesEnriquecidas.map(m => {
                        let badgeClass = '';
                        let badgeIcon = '';
                        if (m.tipo === 'entrada') { badgeClass = 'badge-entrada'; badgeIcon = '📥'; }
                        else if (m.tipo === 'saida') { badgeClass = 'badge-saida'; badgeIcon = '📤'; }
                        else { badgeClass = 'badge-inventario'; badgeIcon = '✏️'; }
                        
                        let entradaQtd = '-';
                        let saidaQtd = '-';
                        if (m.tipo === 'entrada') entradaQtd = m.quantidade || 0;
                        if (m.tipo === 'saida') saidaQtd = m.quantidade || 0;
                        
                        return `<tr>
                            <td>${formatDateTime(m.data_movimento)}</td>
                            <td>${m.produtos?.codigo_interno || '-'}</td>
                            <td>${m.produtos?.nome || '-'}</td>
                            <td>${m.produtos?.fornecedores?.nome || '-'}</td>
                            <td><span class="${badgeClass}">${badgeIcon} ${m.tipo === 'entrada' ? 'Entrada' : m.tipo === 'saida' ? 'Saída' : 'Inventário'}</span></td>
                            <td>${entradaQtd}</td>
                            <td>${saidaQtd}</td>
                            <td class="${(m.saldo_apos || 0) > 0 ? 'saldo-positivo' : 'saldo-negativo'}">${m.saldo_apos || 0}</td>
                            <td>${m.documento_nome}</td>
                            <td><small>${m.numero_documento}</small></td>
                        </tr>`;
                    }).join('') || '<tr><td colspan="10" style="text-align: center; padding: 40px;">📭 Nenhuma movimentação encontrada com os filtros selecionados.</td></tr>'}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Relatório gerado pelo Sistema de Controle de Estoque - DNLSOFT</p>
            <p>📞 (81) 97316-2509</p>
            <p>${formatDateTime(new Date())}</p>
        </div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
</body>
</html>
        `;
        
        const novaJanela = window.open();
        novaJanela.document.write(relatorioHTML);
        novaJanela.document.close();
        
        showMessage('✅ Relatório gerado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showMessage('❌ Erro ao gerar relatório: ' + error.message, 'error');
    }
}