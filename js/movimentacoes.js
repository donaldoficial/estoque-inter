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
            }
            .btn-relatorio:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(40,167,69,0.3);
            }
            .filtros-relatorio {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .filtros-relatorio h3 {
                margin-bottom: 15px;
                color: #333;
            }
            .btn-filtrar {
                background: #667eea;
                margin-top: 10px;
            }
            .saldo-positivo {
                color: #28a745;
                font-weight: bold;
            }
            .saldo-negativo {
                color: #dc3545;
                font-weight: bold;
            }
            .documento-link {
                color: #667eea;
                text-decoration: none;
                font-weight: bold;
            }
            .documento-link:hover {
                text-decoration: underline;
            }
        </style>
        
        <div class="header-acoes">
            <h1 style="margin: 0;">📊 Movimentações</h1>
        </div>
        
        <!-- Filtros para o relatório -->
        <div class="filtros-relatorio">
            <h3>🎯 Gerar Relatório Específico</h3>
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
                    <input type="date" id="filtro-relatorio-data-inicio" placeholder="Data inicial">
                    <small>até</small>
                    <input type="date" id="filtro-relatorio-data-fim" placeholder="Data final" style="margin-top: 5px;">
                </div>
            </div>
            <button onclick="gerarRelatorioHTML()" class="btn-relatorio" style="width: 100%; justify-content: center; margin-top: 10px;">
                📄 Gerar Relatório com os Filtros Selecionados
            </button>
        </div>
        
        <div class="card">
            <div class="card-header">🔍 Filtros da Tabela</div>
            <div class="grid-2">
                <div class="form-group">
                    <label>Produto</label>
                    <select id="filtro-produto" onchange="filtrarMovimentacoes()">
                        <option value="">Todos os Produtos</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Fornecedor</label>
                    <select id="filtro-fornecedor" onchange="filtrarMovimentacoes()">
                        <option value="">Todos os Fornecedores</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Tipo</label>
                    <select id="filtro-tipo" onchange="filtrarMovimentacoes()">
                        <option value="">Todos</option>
                        <option value="entrada">📥 Entradas</option>
                        <option value="saida">📤 Saídas</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Período</label>
                    <select id="filtro-periodo" onchange="filtrarMovimentacoes()">
                        <option value="">Todos</option>
                        <option value="7">Últimos 7 dias</option>
                        <option value="30">Últimos 30 dias</option>
                        <option value="90">Últimos 90 dias</option>
                    </select>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">📋 Histórico de Movimentações</div>
            <div class="table-wrapper">
                <div id="lista-movimentacoes">Carregando...</div>
            </div>
        </div>
    `;
    
    await carregarFiltros();
    await carregarFiltrosRelatorio();
    await listarMovimentacoes();
}

async function carregarFiltros() {
    try {
        // Carregar produtos
        const { data: produtos, error: prodError } = await window.supabaseClient
            .from('produtos')
            .select('id, nome, codigo_interno')
            .order('nome');
        
        if (!prodError && produtos) {
            const selectProduto = document.getElementById('filtro-produto');
            if (selectProduto) {
                produtos.forEach(p => {
                    selectProduto.innerHTML += `<option value="${p.id}">${p.codigo_interno} - ${p.nome}</option>`;
                });
            }
        }
        
        // Carregar fornecedores
        const { data: fornecedores, error: fornError } = await window.supabaseClient
            .from('fornecedores')
            .select('id, nome')
            .order('nome');
        
        if (!fornError && fornecedores) {
            const selectFornecedor = document.getElementById('filtro-fornecedor');
            if (selectFornecedor) {
                fornecedores.forEach(f => {
                    selectFornecedor.innerHTML += `<option value="${f.id}">${f.nome}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
    }
}

async function carregarFiltrosRelatorio() {
    try {
        // Carregar fornecedores para o filtro do relatório
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

async function listarMovimentacoes() {
    try {
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
        
        // Aplicar filtros
        const produtoId = document.getElementById('filtro-produto')?.value;
        const fornecedorId = document.getElementById('filtro-fornecedor')?.value;
        const tipo = document.getElementById('filtro-tipo')?.value;
        const periodo = document.getElementById('filtro-periodo')?.value;
        
        if (produtoId && produtoId !== '') {
            query = query.eq('produto_id', produtoId);
        }
        
        if (fornecedorId && fornecedorId !== '') {
            query = query.eq('produtos.fornecedor_id', fornecedorId);
        }
        
        if (tipo && tipo !== '') {
            query = query.eq('tipo', tipo);
        }
        
        if (periodo && periodo !== '') {
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - parseInt(periodo));
            query = query.gte('data_movimento', dataLimite.toISOString());
        }
        
        const { data: movimentacoes, error } = await query;
        
        if (error) throw error;
        
        const listaDiv = document.getElementById('lista-movimentacoes');
        if (!listaDiv) return;
        
        if (movimentacoes && movimentacoes.length > 0) {
            let html = `<table>`;
            html += `<thead><tr>
                        <th>Data/Hora</th>
                        <th>Código</th>
                        <th>Produto</th>
                        <th>Fornecedor</th>
                        <th>Tipo</th>
                        <th>Entrada</th>
                        <th>Saída</th>
                        <th>Saldo Após</th>
                        <th>Documento</th>
                        <th>Nº Documento</th>
                      </tr></thead><tbody>`;
            
            for (const m of movimentacoes) {
                const tipoClass = m.tipo === 'entrada' ? 'alert-success' : 'alert-warning';
                const tipoIcon = m.tipo === 'entrada' ? '📥' : '📤';
                
                let numeroDocumento = '-';
                let documentoLink = '';
                
                // Buscar número do documento (nota fiscal ou romaneio)
                if (m.documento_tipo === 'nota_fiscal') {
                    const { data: nota } = await window.supabaseClient
                        .from('notas_fiscais')
                        .select('numero_nota')
                        .eq('id', m.documento_id)
                        .maybeSingle();
                    if (nota) {
                        numeroDocumento = nota.numero_nota;
                        documentoLink = `📄 NF: ${numeroDocumento}`;
                    }
                } else if (m.documento_tipo === 'romaneio') {
                    const { data: romaneio } = await window.supabaseClient
                        .from('romaneios')
                        .select('numero_romaneio')
                        .eq('id', m.documento_id)
                        .maybeSingle();
                    if (romaneio) {
                        numeroDocumento = romaneio.numero_romaneio;
                        documentoLink = `📦 ROM: ${numeroDocumento}`;
                    }
                }
                
                html += `<tr>
                            <td>${formatDateTime(m.data_movimento)}</td>
                            <td>${m.produtos?.codigo_interno || '-'}</td>
                            <td>${m.produtos?.nome || '-'}</td>
                            <td>${m.produtos?.fornecedores?.nome || '-'}</td>
                            <td class="${tipoClass}">${tipoIcon} ${m.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
                            <td>${m.tipo === 'entrada' ? m.quantidade : '-'}</td>
                            <td>${m.tipo === 'saida' ? m.quantidade : '-'}</td>
                            <td class="${m.saldo_apos > 0 ? 'saldo-positivo' : 'saldo-negativo'}">${m.saldo_apos || 0}</td>
                            <td>${m.documento_tipo === 'nota_fiscal' ? 'Nota Fiscal' : 'Romaneio'}</td>
                            <td><strong>${documentoLink}</strong></td>
                          </tr>`;
            }
            
            html += `</tbody></table>`;
            listaDiv.innerHTML = html;
        } else {
            listaDiv.innerHTML = '<p style="text-align: center; padding: 40px;">📭 Nenhuma movimentação encontrada.</p>';
        }
    } catch (error) {
        console.error('Erro:', error);
        const listaDiv = document.getElementById('lista-movimentacoes');
        if (listaDiv) {
            listaDiv.innerHTML = '<p style="text-align: center; padding: 40px; color: red;">❌ Erro ao carregar movimentações</p>';
        }
    }
}

function filtrarMovimentacoes() {
    listarMovimentacoes();
}

// Função para gerar relatório HTML com filtros
async function gerarRelatorioHTML() {
    try {
        // Pegar filtros do relatório
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
        
        // Aplicar filtro por código interno do produto
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
        
        // Aplicar filtro por fornecedor
        if (filtroFornecedorId && filtroFornecedorId !== '') {
            query = query.eq('produtos.fornecedor_id', filtroFornecedorId);
            
            const { data: fornecedor } = await window.supabaseClient
                .from('fornecedores')
                .select('nome')
                .eq('id', filtroFornecedorId)
                .maybeSingle();
            
            if (fornecedor) {
                fornecedorInfo = fornecedor;
            }
        }
        
        // Aplicar filtro de período
        if (filtroPeriodo && filtroPeriodo !== '') {
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - parseInt(filtroPeriodo));
            query = query.gte('data_movimento', dataLimite.toISOString());
        }
        
        // Aplicar filtro de data específica
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
        
        // Buscar resumo do estoque
        let produtosQuery = window.supabaseClient.from('produtos').select('*');
        
        if (produtoInfo) {
            produtosQuery = produtosQuery.eq('id', produtoInfo.id);
        } else if (filtroFornecedorId && filtroFornecedorId !== '') {
            produtosQuery = produtosQuery.eq('fornecedor_id', filtroFornecedorId);
        }
        
        const { data: produtos } = await produtosQuery;
        
        const totalProdutos = produtos?.length || 0;
        const totalEstoque = produtos?.reduce((sum, p) => sum + (p.estoque_atual || 0), 0) || 0;
        const valorTotal = produtos?.reduce((sum, p) => sum + ((p.estoque_atual || 0) * (p.preco_venda || 0)), 0) || 0;
        
        // Calcular totais das movimentações filtradas
        const totalEntradas = movimentacoes?.filter(m => m.tipo === 'entrada').reduce((sum, m) => sum + m.quantidade, 0) || 0;
        const totalSaidas = movimentacoes?.filter(m => m.tipo === 'saida').reduce((sum, m) => sum + m.quantidade, 0) || 0;
        
        // Criar título do relatório
        let tituloRelatorio = 'Relatório de Movimentações de Estoque';
        let subtituloRelatorio = '';
        let periodoTexto = '';
        
        // Texto do período
        if (filtroPeriodo && filtroPeriodo !== '') {
            periodoTexto = ` | Período: Últimos ${filtroPeriodo} dias`;
        } else if (filtroDataInicio && filtroDataFim) {
            periodoTexto = ` | Período: ${formatDate(filtroDataInicio)} até ${formatDate(filtroDataFim)}`;
        } else if (filtroDataInicio) {
            periodoTexto = ` | A partir de: ${formatDate(filtroDataInicio)}`;
        } else if (filtroDataFim) {
            periodoTexto = ` | Até: ${formatDate(filtroDataFim)}`;
        }
        
        if (produtoInfo) {
            tituloRelatorio = `Relatório do Produto: ${produtoInfo.nome} (${produtoInfo.codigo_interno})${periodoTexto}`;
            subtituloRelatorio = `Movimentações específicas do produto ${produtoInfo.nome}`;
        } else if (fornecedorInfo) {
            tituloRelatorio = `Relatório de Movimentações - Fornecedor: ${fornecedorInfo.nome}${periodoTexto}`;
            subtituloRelatorio = `Todas as movimentações dos produtos do fornecedor ${fornecedorInfo.nome}`;
        } else {
            tituloRelatorio = `Relatório de Movimentações de Estoque${periodoTexto}`;
            subtituloRelatorio = 'Relatório completo com todas as movimentações do sistema';
        }
        
        // Criar array com as movimentações enriquecidas com número do documento
        const movimentacoesEnriquecidas = [];
        for (const m of movimentacoes || []) {
            let numeroDocumento = '-';
            if (m.documento_tipo === 'nota_fiscal') {
                const { data: nota } = await window.supabaseClient
                    .from('notas_fiscais')
                    .select('numero_nota')
                    .eq('id', m.documento_id)
                    .maybeSingle();
                if (nota) numeroDocumento = nota.numero_nota;
            } else if (m.documento_tipo === 'romaneio') {
                const { data: romaneio } = await window.supabaseClient
                    .from('romaneios')
                    .select('numero_romaneio')
                    .eq('id', m.documento_id)
                    .maybeSingle();
                if (romaneio) numeroDocumento = romaneio.numero_romaneio;
            }
            movimentacoesEnriquecidas.push({ ...m, numero_documento: numeroDocumento });
        }
        
        // Criar o HTML do relatório
        const relatorioHTML = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tituloRelatorio} - ${formatDate(new Date())}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f2f5;
            padding: 40px;
        }
        
        .relatorio-container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 40px;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 14px;
        }
        
        .info-filtro {
            background: rgba(255,255,255,0.2);
            padding: 10px 15px;
            border-radius: 8px;
            margin-top: 15px;
            font-size: 13px;
        }
        
        .info-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            padding: 30px 40px;
            background: #f8f9fa;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .card-info {
            background: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .card-info .icon {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .card-info .label {
            font-size: 13px;
            color: #666;
            margin-bottom: 8px;
        }
        
        .card-info .value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        
        .card-info .value.positivo {
            color: #28a745;
        }
        
        .card-info .value.negativo {
            color: #dc3545;
        }
        
        .tabela-container {
            padding: 30px 40px;
        }
        
        .tabela-container h2 {
            margin-bottom: 20px;
            color: #333;
            font-size: 22px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            font-size: 13px;
        }
        
        th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .badge-entrada {
            background: #d4edda;
            color: #155724;
            padding: 4px 10px;
            border-radius: 20px;
            display: inline-block;
            font-size: 11px;
            font-weight: bold;
        }
        
        .badge-saida {
            background: #f8d7da;
            color: #721c24;
            padding: 4px 10px;
            border-radius: 20px;
            display: inline-block;
            font-size: 11px;
            font-weight: bold;
        }
        
        .saldo-positivo {
            color: #28a745;
            font-weight: bold;
        }
        
        .saldo-negativo {
            color: #dc3545;
            font-weight: bold;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px 40px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
        }
        
        .btn-print {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            transition: transform 0.2s;
        }
        
        .btn-print:hover {
            transform: translateY(-2px);
        }
        
        @media print {
            body {
                padding: 0;
                background: white;
            }
            .btn-print {
                display: none;
            }
            .header {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            th {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
        
        @media (max-width: 768px) {
            body {
                padding: 20px;
            }
            .info-cards {
                grid-template-columns: repeat(2, 1fr);
                padding: 20px;
            }
            .tabela-container {
                padding: 20px;
                overflow-x: auto;
            }
            table {
                min-width: 1000px;
            }
        }
    </style>
</head>
<body>
    <div class="relatorio-container">
        <div class="header">
            <h1>📊 ${tituloRelatorio}</h1>
            <p>Gerado em: ${formatDateTime(new Date())}</p>
            ${produtoInfo ? `<div class="info-filtro">🎯 Produto filtrado: ${produtoInfo.nome} (Código: ${produtoInfo.codigo_interno})</div>` : ''}
            ${fornecedorInfo ? `<div class="info-filtro">🏢 Fornecedor filtrado: ${fornecedorInfo.nome}</div>` : ''}
            ${(filtroPeriodo && !produtoInfo && !fornecedorInfo) ? `<div class="info-filtro">📅 ${filtroPeriodo === '7' ? 'Últimos 7 dias' : filtroPeriodo === '15' ? 'Últimos 15 dias' : filtroPeriodo === '30' ? 'Últimos 30 dias' : filtroPeriodo === '60' ? 'Últimos 60 dias' : filtroPeriodo === '90' ? 'Últimos 90 dias' : filtroPeriodo === '180' ? 'Últimos 6 meses' : 'Último ano'}</div>` : ''}
        </div>
        
        <div class="info-cards">
            <div class="card-info">
                <div class="icon">📦</div>
                <div class="label">Produtos no Filtro</div>
                <div class="value">${totalProdutos}</div>
            </div>
            <div class="card-info">
                <div class="icon">📊</div>
                <div class="label">Total em Estoque</div>
                <div class="value">${totalEstoque}</div>
            </div>
            <div class="card-info">
                <div class="icon">💰</div>
                <div class="label">Valor Total</div>
                <div class="value">${formatMoney(valorTotal)}</div>
            </div>
            <div class="card-info">
                <div class="icon">📈</div>
                <div class="label">Valor Médio</div>
                <div class="value">${formatMoney(totalProdutos > 0 ? valorTotal / totalProdutos : 0)}</div>
            </div>
        </div>
        
        <div class="info-cards" style="background: white; padding-top: 0;">
            <div class="card-info">
                <div class="icon">📥</div>
                <div class="label">Total Entradas</div>
                <div class="value positivo">${totalEntradas}</div>
            </div>
            <div class="card-info">
                <div class="icon">📤</div>
                <div class="label">Total Saídas</div>
                <div class="value negativo">${totalSaidas}</div>
            </div>
            <div class="card-info">
                <div class="icon">📋</div>
                <div class="label">Movimentações</div>
                <div class="value">${movimentacoesEnriquecidas.length}</div>
            </div>
            <div class="card-info">
                <div class="icon">🔄</div>
                <div class="label">Giro Estoque</div>
                <div class="value">${totalEstoque > 0 ? ((totalSaidas / totalEstoque) * 100).toFixed(1) : 0}%</div>
            </div>
        </div>
        
        <div class="tabela-container">
            <h2>📋 Histórico de Movimentações</h2>
            <div style="overflow-x: auto;">
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
                        ${movimentacoesEnriquecidas.map(m => `
                            <tr>
                                <td>${formatDateTime(m.data_movimento)}</td>
                                <td>${m.produtos?.codigo_interno || '-'}</td>
                                <td>${m.produtos?.nome || '-'}</td>
                                <td>${m.produtos?.fornecedores?.nome || '-'}</td>
                                <td>
                                    <span class="${m.tipo === 'entrada' ? 'badge-entrada' : 'badge-saida'}">
                                        ${m.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}
                                    </span>
                                 </td>
                                <td>${m.tipo === 'entrada' ? m.quantidade : '-'}</td>
                                <td>${m.tipo === 'saida' ? m.quantidade : '-'}</td>
                                <td class="${m.saldo_apos > 0 ? 'saldo-positivo' : 'saldo-negativo'}">${m.saldo_apos || 0}</td>
                                <td>${m.documento_tipo === 'nota_fiscal' ? 'Nota Fiscal' : 'Romaneio'}</td>
                                <td><strong>${m.numero_documento}</strong></td>
                            </tr>
                        `).join('') || '<tr><td colspan="10" style="text-align: center;">Nenhuma movimentação encontrada</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema de Controle de Estoque</p>
            <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
        </div>
    </div>
    
    <button class="btn-print" onclick="window.print()">
        🖨️ Imprimir / Salvar como PDF
    </button>
</body>
</html>
        `;
        
        // Abrir o relatório em uma nova janela
        const novaJanela = window.open();
        novaJanela.document.write(relatorioHTML);
        novaJanela.document.close();
        
        showMessage('✅ Relatório gerado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        showMessage('❌ Erro ao gerar relatório: ' + error.message, 'error');
    }
}