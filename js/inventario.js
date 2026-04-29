async function carregarInventario() {
    const main = document.getElementById('conteudo-principal');
    if (!main) return;
    
    main.innerHTML = `
        <style>
            .inventario-container { padding: 20px; }
            .inventario-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
            .btn-inventario { padding: 12px 25px; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: 8px; cursor: pointer; transition: transform 0.2s; }
            .btn-inventario:hover { transform: translateY(-2px); }
            .btn-pdf { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; }
            .btn-ajustar { background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%); color: #333; }
            .btn-relatorio { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; }
            .btn-contagem { background: linear-gradient(135deg, #6f42c1 0%, #5538a0 100%); color: white; }
            .filtros-inventario { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
            .filtros-inventario select, .filtros-inventario input { padding: 10px; border: 2px solid #ddd; border-radius: 8px; }
            .modal-ajuste { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center; }
            .modal-content { background: white; border-radius: 12px; max-width: 500px; width: 90%; padding: 25px; }
            .modal-header { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
            .form-group { margin-bottom: 15px; }
            .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
            .form-group input, .form-group select { width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 6px; }
            .botoes-modal { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }
            .btn-cancelar { background: #6c757d; color: white; padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; }
            .btn-confirmar { background: #28a745; color: white; padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; }
            .badge-1 { background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
            .badge-2 { background: #ffc107; color: #333; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
            .badge-3 { background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; }
            @media (max-width: 768px) { .filtros-inventario { grid-template-columns: 1fr; } }
        </style>
        
        <div class="inventario-container">
            <div class="inventario-header">
                <h1 style="margin: 0;">📊 Inventário de Estoque</h1>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="gerarPDFContagemFisica()" class="btn-inventario btn-contagem">📋 PDF para Contagem Física</button>
                    <button onclick="gerarRelatorioInventarioPDF()" class="btn-inventario btn-pdf">📄 Exportar PDF do Estoque</button>
                    <button onclick="abrirModalFiltrosRelatorio()" class="btn-inventario btn-relatorio">📑 Relatório por Fornecedor</button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">🔍 Filtros do Inventário</div>
                <div class="filtros-inventario">
                    <select id="filtro-fornecedor-inventario" onchange="carregarInventarioLista()">
                        <option value="">Todos os Fornecedores</option>
                    </select>
                    <input type="text" id="filtro-busca-inventario" placeholder="Buscar por código ou nome..." oninput="carregarInventarioLista()">
                    <select id="filtro-terco-inventario" onchange="carregarInventarioLista()">
                        <option value="">Todos os Terços</option>
                        <option value="1">1º Terço - OK</option>
                        <option value="2">2º Terço - Alerta</option>
                        <option value="3">3º Terço - Crítico</option>
                    </select>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">📋 Estoque Atual por Produto</div>
                <div id="inventario-lista" style="margin-top: 20px;">Carregando...</div>
            </div>
        </div>
    `;
    
    await carregarFornecedoresInventario();
    await carregarInventarioLista();
}

// Função global para fechar modais
function fecharModalAjuste() {
    const modal = document.getElementById('modal-ajuste');
    if (modal) modal.remove();
}

function fecharModalDetalhes() {
    const modal = document.getElementById('modal-detalhes');
    if (modal) modal.remove();
}

function fecharModalRelatorio() {
    const modal = document.getElementById('modal-relatorio');
    if (modal) modal.remove();
}

async function carregarFornecedoresInventario() {
    try {
        const { data: fornecedores } = await window.supabaseClient
            .from('fornecedores')
            .select('id, nome')
            .order('nome');
        
        const select = document.getElementById('filtro-fornecedor-inventario');
        if (select && fornecedores) {
            select.innerHTML = '<option value="">Todos os Fornecedores</option>';
            fornecedores.forEach(f => {
                select.innerHTML += `<option value="${f.id}">${f.nome}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

let produtosInventario = [];

async function carregarInventarioLista() {
    const container = document.getElementById('inventario-lista');
    if (!container) return;
    
    const fornecedorId = document.getElementById('filtro-fornecedor-inventario')?.value || '';
    const busca = document.getElementById('filtro-busca-inventario')?.value || '';
    const tercoFiltro = document.getElementById('filtro-terco-inventario')?.value || '';
    
    try {
        const { data: produtos, error } = await window.supabaseClient
            .from('produtos')
            .select('*, fornecedores(nome), lotes_estoque(*)');
        
        if (error) throw error;
        
        if (!produtos || produtos.length === 0) {
            container.innerHTML = '<p class="sem-resultados">📭 Nenhum produto encontrado.</p>';
            return;
        }
        
        const hoje = new Date();
        const produtosComEstoque = [];
        
        for (const produto of produtos) {
            if (fornecedorId && produto.fornecedor_id != fornecedorId) continue;
            if (busca && !produto.codigo_interno?.toLowerCase().includes(busca.toLowerCase()) && 
                !produto.nome?.toLowerCase().includes(busca.toLowerCase())) continue;
            
            const lotes = produto.lotes_estoque || [];
            const estoqueTotal = lotes.reduce((sum, l) => sum + (l.quantidade_atual || 0), 0);
            const valorTotalEstoque = lotes.reduce((sum, l) => sum + ((l.quantidade_atual || 0) * (l.preco_custo || 0)), 0);
            
            let tercoProduto = 1;
            let validadeMaisProxima = null;
            
            for (const lote of lotes) {
                if (lote.data_validade && lote.data_fabricacao && lote.quantidade_atual > 0) {
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
                    if (terco > tercoProduto) tercoProduto = terco;
                    if (!validadeMaisProxima || val < validadeMaisProxima) validadeMaisProxima = val;
                }
            }
            
            if (tercoFiltro && tercoProduto != tercoFiltro) continue;
            
            produtosComEstoque.push({
                ...produto,
                estoque_total: estoqueTotal,
                valor_total_estoque: valorTotalEstoque,
                terco: tercoProduto,
                validade_proxima: validadeMaisProxima,
                lotes: lotes.filter(l => l.quantidade_atual > 0)
            });
        }
        
        produtosComEstoque.sort((a, b) => (a.codigo_interno || '').localeCompare(b.codigo_interno || ''));
        produtosInventario = produtosComEstoque;
        
        if (produtosComEstoque.length === 0) {
            container.innerHTML = '<p class="sem-resultados">📭 Nenhum produto encontrado com os filtros selecionados.</p>';
            return;
        }
        
        let html = `<div class="table-wrapper"><table class="table"><thead><tr>
            <th>Código</th><th>Produto</th><th>Fornecedor</th><th>Unidade</th><th>Estoque</th><th>Valor Total</th><th>Status</th><th>Ações</th>
        </tr></thead><tbody>`;
        
        for (const p of produtosComEstoque) {
            let statusClass = '';
            let statusText = '';
            if (p.terco === 1) { statusClass = 'badge-1'; statusText = '🟢 OK'; }
            else if (p.terco === 2) { statusClass = 'badge-2'; statusText = '🟡 Alerta'; }
            else { statusClass = 'badge-3'; statusText = '🔴 Crítico'; }
            
            html += `<tr>
                <td><strong>${p.codigo_interno || '-'}</strong></td>
                <td>${p.nome}</td>
                <td>${p.fornecedores?.nome || '-'}</td>
                <td>${p.unidade_medida || 'UN'}</td>
                <td style="font-weight: bold;">${p.estoque_total}</td>
                <td>${formatMoney(p.valor_total_estoque)}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <button onclick="abrirModalAjuste(${p.id}, '${p.nome.replace(/'/g, "\\'")}', ${p.estoque_total})" style="background: #ffc107; color:#333; padding:5px 10px; margin-right:5px;">✏️ Ajustar</button>
                    <button onclick="verDetalhesProduto(${p.id})" style="background: #17a2b8; padding:5px 10px;">📋 Detalhes</button>
                </td>
            </tr>`;
        }
        
        html += `</tbody></table></div>
        <div style="margin-top:15px; padding:10px; background:#f8f9fa; border-radius:8px; text-align:right;">
            <strong>Total de Produtos: ${produtosComEstoque.length}</strong> | 
            Estoque Total: ${produtosComEstoque.reduce((s, p) => s + p.estoque_total, 0)} unidades |
            Valor Total: ${formatMoney(produtosComEstoque.reduce((s, p) => s + (p.valor_total_estoque || 0), 0))}
        </div>`;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `<p style="color:red;">❌ Erro ao carregar inventário: ${error.message}</p>`;
    }
}

function abrirModalAjuste(produtoId, produtoNome, estoqueAtual) {
    const modalExistente = document.getElementById('modal-ajuste');
    if (modalExistente) modalExistente.remove();
    
    const modal = document.createElement('div');
    modal.id = 'modal-ajuste';
    modal.className = 'modal-ajuste';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">✏️ Ajuste de Estoque</div>
            <div class="modal-body">
                <p><strong>Produto:</strong> ${produtoNome}</p>
                <p><strong>Estoque Atual:</strong> ${estoqueAtual} unidades</p>
                <form id="form-ajuste">
                    <div class="form-group">
                        <label>Tipo de Ajuste *</label>
                        <select id="ajuste-tipo" required>
                            <option value="">Selecione...</option>
                            <option value="entrada">📥 Entrada (aumentar estoque)</option>
                            <option value="saida">📤 Saída (diminuir estoque)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Quantidade *</label>
                        <input type="number" id="ajuste-quantidade" step="1" min="1" required>
                    </div>
                    <div class="form-group">
                        <label>Motivo do Ajuste *</label>
                        <input type="text" id="ajuste-motivo" placeholder="Ex: Contagem física, quebra, devolução..." required>
                    </div>
                    <div class="form-group">
                        <label>Observação (opcional)</label>
                        <textarea id="ajuste-obs" rows="3" placeholder="Informações adicionais..."></textarea>
                    </div>
                </form>
            </div>
            <div class="botoes-modal">
                <button onclick="fecharModalAjuste()" class="btn-cancelar">Cancelar</button>
                <button onclick="confirmarAjuste(${produtoId}, ${estoqueAtual})" class="btn-confirmar">Confirmar Ajuste</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function verDetalhesProduto(produtoId) {
    const modalExistente = document.getElementById('modal-detalhes');
    if (modalExistente) modalExistente.remove();
    
    const produto = produtosInventario.find(p => p.id === produtoId);
    if (!produto) return;
    
    const modal = document.createElement('div');
    modal.id = 'modal-detalhes';
    modal.className = 'modal-ajuste';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">📋 Detalhes do Produto</div>
            <div class="modal-body">
                <p><strong>Código Interno:</strong> ${produto.codigo_interno || '-'}</p>
                <p><strong>Nome:</strong> ${produto.nome}</p>
                <p><strong>Fornecedor:</strong> ${produto.fornecedores?.nome || '-'}</p>
                <p><strong>Unidade:</strong> ${produto.unidade_medida || 'UN'}</p>
                <p><strong>Preço Compra:</strong> ${formatMoney(produto.preco_compra)}</p>
                <p><strong>Preço Venda:</strong> ${formatMoney(produto.preco_venda)}</p>
                <p><strong>Estoque Mínimo:</strong> ${produto.estoque_minimo}</p>
                <p><strong>Estoque Atual:</strong> ${produto.estoque_total}</p>
                <p><strong>Valor Total Estoque:</strong> ${formatMoney(produto.valor_total_estoque)}</p>
                <p><strong>Status:</strong> ${produto.terco === 1 ? '🟢 OK' : produto.terco === 2 ? '🟡 Alerta' : '🔴 Crítico'}</p>
                <hr>
                <strong>📦 Lotes em Estoque:</strong>
                <div class="table-wrapper" style="margin-top: 10px;">
                    <table style="width:100%; font-size:12px;">
                        <thead><tr><th>Lote</th><th>Fabricação</th><th>Validade</th><th>Quantidade</th><th>Preço</th></tr></thead>
                        <tbody>
                            ${produto.lotes.map(l => `
                                <tr>
                                    <td>${l.lote || '-'}</td>
                                    <td>${formatDate(l.data_fabricacao)}</td>
                                    <td>${formatDate(l.data_validade)}</td>
                                    <td>${l.quantidade_atual}</td>
                                    <td>${formatMoney(l.preco_custo)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="5">Nenhum lote cadastrado</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="botoes-modal">
                <button onclick="fecharModalDetalhes()" class="btn-cancelar">Fechar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function confirmarAjuste(produtoId, estoqueAtual) {
    const tipo = document.getElementById('ajuste-tipo')?.value;
    const quantidade = parseInt(document.getElementById('ajuste-quantidade')?.value);
    const motivo = document.getElementById('ajuste-motivo')?.value;
    const observacao = document.getElementById('ajuste-obs')?.value;
    
    if (!tipo || !quantidade || !motivo) {
        showMessage('Preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    if (quantidade <= 0) {
        showMessage('Quantidade deve ser maior que zero!', 'error');
        return;
    }
    
    // Buscar o estoque REAL dos lotes
    const { data: lotesAtuais } = await window.supabaseClient
        .from('lotes_estoque')
        .select('*')
        .eq('produto_id', produtoId);
    
    const estoqueReal = lotesAtuais?.reduce((sum, l) => sum + (l.quantidade_atual || 0), 0) || 0;
    
    let novaQuantidade = estoqueReal;
    let quantidadeMovimento = quantidade;
    
    if (tipo === 'entrada') {
        novaQuantidade = estoqueReal + quantidade;
    } else {
        if (quantidade > estoqueReal) {
            showMessage(`Estoque insuficiente! Disponível: ${estoqueReal}`, 'error');
            return;
        }
        novaQuantidade = estoqueReal - quantidade;
    }
    
    try {
        // 1. Se for SAÍDA, dar baixa nos lotes (FIFO)
        if (tipo === 'saida') {
            let quantidadeRestante = quantidade;
            const lotesOrdenados = [...(lotesAtuais || [])].filter(l => l.quantidade_atual > 0)
                .sort((a, b) => new Date(a.data_validade) - new Date(b.data_validade));
            
            for (const lote of lotesOrdenados) {
                if (quantidadeRestante <= 0) break;
                
                const quantidadeLote = lote.quantidade_atual;
                let novaQuantidadeLote;
                
                if (quantidadeLote >= quantidadeRestante) {
                    novaQuantidadeLote = quantidadeLote - quantidadeRestante;
                    quantidadeRestante = 0;
                } else {
                    novaQuantidadeLote = 0;
                    quantidadeRestante -= quantidadeLote;
                }
                
                await window.supabaseClient
                    .from('lotes_estoque')
                    .update({ quantidade_atual: novaQuantidadeLote })
                    .eq('id', lote.id);
            }
        }
        
        // 2. Se for ENTRADA, criar um novo lote
        if (tipo === 'entrada') {
            const hoje = new Date();
            const dataValidade = new Date();
            dataValidade.setFullYear(hoje.getFullYear() + 1);
            
            await window.supabaseClient
                .from('lotes_estoque')
                .insert({
                    produto_id: produtoId,
                    lote: `AJUSTE-${Date.now()}`,
                    data_fabricacao: hoje.toISOString().split('T')[0],
                    data_validade: dataValidade.toISOString().split('T')[0],
                    quantidade: quantidade,
                    quantidade_atual: quantidade,
                    preco_custo: 0,
                    terco_recebimento: 1,
                    status: 'normal'
                });
        }
        
        // 3. Recalcular o estoque total do produto baseado nos lotes
        const { data: lotesAtualizados } = await window.supabaseClient
            .from('lotes_estoque')
            .select('*')
            .eq('produto_id', produtoId);
        
        const novoEstoqueTotal = lotesAtualizados?.reduce((sum, l) => sum + (l.quantidade_atual || 0), 0) || 0;
        
        // 4. Atualizar o produto com o estoque correto
        await window.supabaseClient
            .from('produtos')
            .update({ estoque_atual: novoEstoqueTotal })
            .eq('id', produtoId);
        
        // 5. Registrar movimentação
        await window.supabaseClient
            .from('movimentacoes')
            .insert({
                produto_id: produtoId,
                tipo: 'inventario',
                documento_tipo: 'inventario',
                documento_id: 0,
                quantidade: quantidadeMovimento,
                saldo_apos: novoEstoqueTotal,
                observacao: `Ajuste por inventário - ${motivo}${observacao ? ' - ' + observacao : ''}`
            });
        
        showMessage(`✅ Ajuste realizado! Novo estoque: ${novoEstoqueTotal} unidades`, 'success');
        fecharModalAjuste();
        await carregarInventarioLista();
        
    } catch (error) {
        console.error('Erro detalhado:', error);
        showMessage('Erro ao realizar ajuste: ' + error.message, 'error');
    }
}

function abrirModalFiltrosRelatorio() {
    const modalExistente = document.getElementById('modal-relatorio');
    if (modalExistente) modalExistente.remove();
    
    const modal = document.createElement('div');
    modal.id = 'modal-relatorio';
    modal.className = 'modal-ajuste';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">📑 Relatório por Fornecedor</div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Selecione o Fornecedor</label>
                    <select id="relatorio-fornecedor" style="width:100%; padding:10px;">
                        <option value="">Todos os Fornecedores</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Incluir produtos com estoque zero?</label>
                    <select id="relatorio-zero" style="width:100%; padding:10px;">
                        <option value="nao">Não (apenas com estoque)</option>
                        <option value="sim">Sim (todos os produtos)</option>
                    </select>
                </div>
            </div>
            <div class="botoes-modal">
                <button onclick="fecharModalRelatorio()" class="btn-cancelar">Cancelar</button>
                <button onclick="gerarRelatorioPorFornecedor()" class="btn-confirmar">Gerar Relatório</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    carregarFornecedoresSelectRelatorio();
}

async function carregarFornecedoresSelectRelatorio() {
    try {
        const { data: fornecedores } = await window.supabaseClient
            .from('fornecedores')
            .select('id, nome')
            .order('nome');
        
        const select = document.getElementById('relatorio-fornecedor');
        if (select && fornecedores) {
            select.innerHTML = '<option value="">Todos os Fornecedores</option>';
            fornecedores.forEach(f => {
                select.innerHTML += `<option value="${f.id}">${f.nome}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro:', error);
    }
}

async function gerarRelatorioPorFornecedor() {
    const fornecedorId = document.getElementById('relatorio-fornecedor')?.value || '';
    const incluirZero = document.getElementById('relatorio-zero')?.value === 'sim';
    
    fecharModalRelatorio();
    
    try {
        const { data: produtos, error } = await window.supabaseClient
            .from('produtos')
            .select('*, fornecedores(nome), lotes_estoque(*)');
        
        if (error) throw error;
        
        let produtosFiltrados = produtos;
        
        if (fornecedorId) {
            produtosFiltrados = produtosFiltrados.filter(p => p.fornecedor_id == fornecedorId);
        }
        
        const produtosComEstoque = [];
        for (const produto of produtosFiltrados) {
            const lotes = produto.lotes_estoque || [];
            const estoqueTotal = lotes.reduce((sum, l) => sum + (l.quantidade_atual || 0), 0);
            
            if (!incluirZero && estoqueTotal === 0) continue;
            
            const valorTotal = lotes.reduce((sum, l) => sum + ((l.quantidade_atual || 0) * (l.preco_custo || 0)), 0);
            
            produtosComEstoque.push({
                ...produto,
                estoque_total: estoqueTotal,
                valor_total_estoque: valorTotal
            });
        }
        
        const fornecedorNome = produtosComEstoque[0]?.fornecedores?.nome || 'Todos os Fornecedores';
        const relatorioHTML = gerarHTMLRelatorio(produtosComEstoque, fornecedorNome, incluirZero);
        
        const novaJanela = window.open();
        novaJanela.document.write(relatorioHTML);
        novaJanela.document.close();
        
    } catch (error) {
        showMessage('Erro ao gerar relatório: ' + error.message, 'error');
    }
}

function gerarHTMLRelatorio(produtos, fornecedorNome, incluirZero) {
    const dataAtual = new Date();
    const totalEstoque = produtos.reduce((s, p) => s + p.estoque_total, 0);
    const totalValor = produtos.reduce((s, p) => s + (p.valor_total_estoque || 0), 0);
    
    return `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Inventário - ${fornecedorNome}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; padding: 40px; }
        .relatorio { max-width: 1200px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 5px; }
        .info-section { padding: 20px 30px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; flex-wrap: wrap; }
        .info-card { text-align: center; }
        .info-card .numero { font-size: 24px; font-weight: bold; color: #17a2b8; }
        .info-card .label { font-size: 12px; color: #666; }
        .tabela-container { padding: 30px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #17a2b8; color: white; padding: 12px; text-align: left; }
        td { padding: 10px 12px; border-bottom: 1px solid #e0e0e0; }
        tr:hover { background: #f8f9fa; }
        .footer { padding: 20px 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0; }
        .btn-print { position: fixed; bottom: 30px; right: 30px; background: #28a745; color: white; border: none; padding: 15px 30px; border-radius: 50px; cursor: pointer; font-weight: bold; }
        .estoque-zero { color: #dc3545; }
        @media print { body { padding: 0; background: white; } .btn-print { display: none; } }
    </style>
</head>
<body>
    <div class="relatorio">
        <div class="header">
            <h1>📊 RELATÓRIO DE INVENTÁRIO</h1>
            <div>Fornecedor: ${fornecedorNome}</div>
            <div>Emitido em: ${formatDateTime(dataAtual)}</div>
        </div>
        
        <div class="info-section">
            <div class="info-card"><div class="numero">${produtos.length}</div><div class="label">Produtos</div></div>
            <div class="info-card"><div class="numero">${totalEstoque}</div><div class="label">Unidades em Estoque</div></div>
            <div class="info-card"><div class="numero">${formatMoney(totalValor)}</div><div class="label">Valor Total</div></div>
        </div>
        
        <div class="tabela-container">
            <table>
                <thead><tr><th>Código</th><th>Produto</th><th>Fornecedor</th><th>Unidade</th><th>Estoque</th><th>Preço Compra</th><th>Preço Venda</th><th>Valor Total</th></tr></thead>
                <tbody>
                    ${produtos.map(p => `<tr>
                        <td><strong>${p.codigo_interno || '-'}</strong></td>
                        <td>${p.nome}</td>
                        <td>${p.fornecedores?.nome || '-'}</td>
                        <td>${p.unidade_medida || 'UN'}</td>
                        <td class="${p.estoque_total === 0 ? 'estoque-zero' : ''}">${p.estoque_total}</td>
                        <td>${formatMoney(p.preco_compra)}</td>
                        <td>${formatMoney(p.preco_venda)}</td>
                        <td>${formatMoney(p.valor_total_estoque)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Relatório gerado pelo Sistema de Controle de Estoque - DNLSOFT</p>
            <p>${formatDateTime(dataAtual)}</p>
        </div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
</body>
</html>
    `;
}

// PDF para CONTAGEM FÍSICA (com linhas para preencher)
async function gerarPDFContagemFisica() {
    const dataAtual = new Date();
    
    const { data: produtos, error } = await window.supabaseClient
        .from('produtos')
        .select('*, fornecedores(nome)')
        .order('codigo_interno');
    
    if (error) {
        showMessage('Erro ao buscar produtos: ' + error.message, 'error');
        return;
    }
    
    if (!produtos || produtos.length === 0) {
        showMessage('Nenhum produto cadastrado!', 'error');
        return;
    }
    
    const produtosPorFornecedor = {};
    for (const produto of produtos) {
        const fornecedorNome = produto.fornecedores?.nome || 'Sem Fornecedor';
        if (!produtosPorFornecedor[fornecedorNome]) {
            produtosPorFornecedor[fornecedorNome] = [];
        }
        produtosPorFornecedor[fornecedorNome].push(produto);
    }
    
    const relatorioHTML = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventário Físico - Folha de Contagem</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: white; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 24px; margin-bottom: 5px; }
        .header p { color: #666; font-size: 14px; }
        .fornecedor-section { margin-bottom: 30px; page-break-inside: avoid; }
        .fornecedor-title { background: #667eea; color: white; padding: 10px 15px; margin-bottom: 15px; border-radius: 8px; font-size: 18px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #f8f9fa; padding: 12px; text-align: left; border: 1px solid #ddd; font-weight: bold; }
        td { padding: 12px; border: 1px solid #ddd; vertical-align: top; }
        .linha-contagem { background: #fff9e6; }
        .linha-contagem td { background: #fff9e6; }
        input { border: none; background: transparent; width: 100%; font-size: 14px; }
        input:focus { outline: none; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        .assinatura { margin-top: 40px; display: flex; justify-content: space-between; }
        .assinatura div { text-align: center; }
        .assinatura hr { width: 200px; margin-top: 30px; }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
            .fornecedor-section { page-break-inside: avoid; }
        }
        .instrucoes { background: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 INVENTÁRIO FÍSICO - FOLHA DE CONTAGEM</h1>
        <p>Data da contagem: ________/________/________ | Responsável: ____________________</p>
        <p>Gerado em: ${formatDateTime(dataAtual)}</p>
    </div>
    
    <div class="instrucoes">
        <strong>📌 INSTRUÇÕES:</strong><br>
        1. Imprima este documento e leve até o estoque.<br>
        2. Conte fisicamente cada produto e anote na coluna "QUANTIDADE CONTADA".<br>
        3. Na coluna "DIVERGÊNCIA", calcule a diferença entre o sistema e a contagem física.<br>
        4. Ao final, assine e leve ao responsável pelo ajuste no sistema.
    </div>
    
    ${Object.entries(produtosPorFornecedor).map(([fornecedor, prods]) => `
        <div class="fornecedor-section">
            <div class="fornecedor-title">🏢 FORNECEDOR: ${fornecedor}</div>
            <table>
                <thead>
                    <tr>
                        <th style="width:40px;">#</th>
                        <th>Código Interno</th>
                        <th>Produto</th>
                        <th>Unidade</th>
                        <th style="width:100px;">Estoque Sistema</th>
                        <th style="width:100px;">Quantidade Contada</th>
                        <th style="width:100px;">Divergência</th>
                        <th style="width:150px;">Observações</th>
                    </tr>
                </thead>
                <tbody>
                    ${prods.map((p, idx) => `
                        <tr class="linha-contagem">
                            <td>${idx + 1}</td>
                            <td>${p.codigo_interno || '-'}</td>
                            <td>${p.nome}</td>
                            <td>${p.unidade_medida || 'UN'}</td>
                            <td style="text-align:center;">${p.estoque_atual || 0}</td>
                            <td style="background:#fff9e6;"><input type="text" placeholder="_________" style="text-align:center;"></td>
                            <td style="background:#fff9e6;"><input type="text" placeholder="_________" style="text-align:center;"></td>
                            <td style="background:#fff9e6;"><input type="text" placeholder="Anotar divergências..."></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `).join('')}
    
    <div class="assinatura">
        <div>
            <hr>
            <p>Conferente</p>
            <p>Nome: ____________________</p>
            <p>Assinatura: ______________</p>
        </div>
        <div>
            <hr>
            <p>Aprovador</p>
            <p>Nome: ____________________</p>
            <p>Assinatura: ______________</p>
        </div>
        <div>
            <hr>
            <p>Responsável pelo Ajuste</p>
            <p>Nome: ____________________</p>
            <p>Assinatura: ______________</p>
        </div>
    </div>
    
    <div class="footer">
        <p>Sistema de Controle de Estoque - DNLSOFT | (81) 97316-2509</p>
        <p>Após a contagem, leve este documento ao responsável para realizar os ajustes no sistema.</p>
    </div>
    
    <div class="no-print" style="text-align:center; margin-top:20px;">
        <button onclick="window.print()" style="background:#28a745; color:white; padding:12px 30px; border:none; border-radius:8px; cursor:pointer;">🖨️ Imprimir para Contagem</button>
    </div>
</body>
</html>
    `;
    
    const novaJanela = window.open();
    novaJanela.document.write(relatorioHTML);
    novaJanela.document.close();
}

async function gerarRelatorioInventarioPDF() {
    const produtos = produtosInventario;
    
    if (!produtos || produtos.length === 0) {
        showMessage('Nenhum produto para gerar relatório!', 'error');
        return;
    }
    
    const dataAtual = new Date();
    const totalEstoque = produtos.reduce((s, p) => s + p.estoque_total, 0);
    const totalValor = produtos.reduce((s, p) => s + (p.valor_total_estoque || 0), 0);
    
    const relatorioHTML = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventário Geral - Estoque</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; padding: 40px; }
        .relatorio { max-width: 1200px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 5px; }
        .info-section { padding: 20px 30px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; flex-wrap: wrap; }
        .info-card { text-align: center; }
        .info-card .numero { font-size: 24px; font-weight: bold; color: #28a745; }
        .info-card .label { font-size: 12px; color: #666; }
        .tabela-container { padding: 30px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #28a745; color: white; padding: 12px; text-align: left; }
        td { padding: 10px 12px; border-bottom: 1px solid #e0e0e0; }
        tr:hover { background: #f8f9fa; }
        .footer { padding: 20px 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0; }
        .btn-print { position: fixed; bottom: 30px; right: 30px; background: #28a745; color: white; border: none; padding: 15px 30px; border-radius: 50px; cursor: pointer; font-weight: bold; }
        .badge-1 { background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; display: inline-block; }
        .badge-2 { background: #ffc107; color: #333; padding: 2px 8px; border-radius: 12px; font-size: 11px; display: inline-block; }
        .badge-3 { background: #dc3545; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; display: inline-block; }
        @media print { body { padding: 0; background: white; } .btn-print { display: none; } }
    </style>
</head>
<body>
    <div class="relatorio">
        <div class="header">
            <h1>📊 INVENTÁRIO GERAL DE ESTOQUE</h1>
            <div>Relatório completo de todos os produtos</div>
            <div>Emitido em: ${formatDateTime(dataAtual)}</div>
        </div>
        
        <div class="info-section">
            <div class="info-card"><div class="numero">${produtos.length}</div><div class="label">Produtos</div></div>
            <div class="info-card"><div class="numero">${totalEstoque}</div><div class="label">Unidades em Estoque</div></div>
            <div class="info-card"><div class="numero">${formatMoney(totalValor)}</div><div class="label">Valor Total</div></div>
        </div>
        
        <div class="tabela-container">
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Produto</th>
                        <th>Fornecedor</th>
                        <th>Unidade</th>
                        <th>Estoque</th>
                        <th>Preço Compra</th>
                        <th>Preço Venda</th>
                        <th>Valor Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${produtos.map(p => {
                        let statusClass = '';
                        let statusText = '';
                        if (p.terco === 1) { statusClass = 'badge-1'; statusText = 'OK'; }
                        else if (p.terco === 2) { statusClass = 'badge-2'; statusText = 'Alerta'; }
                        else { statusClass = 'badge-3'; statusText = 'Crítico'; }
                        return `<tr>
                            <td><strong>${p.codigo_interno || '-'}</strong></td>
                            <td>${p.nome}</td>
                            <td>${p.fornecedores?.nome || '-'}</td>
                            <td>${p.unidade_medida || 'UN'}</td>
                            <td style="font-weight: bold;">${p.estoque_total}</td>
                            <td>${formatMoney(p.preco_compra)}</td>
                            <td>${formatMoney(p.preco_venda)}</td>
                            <td>${formatMoney(p.valor_total_estoque)}</td>
                            <td><span class="${statusClass}">${statusText}</span></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Relatório gerado pelo Sistema de Controle de Estoque - DNLSOFT</p>
            <p>${formatDateTime(dataAtual)}</p>
        </div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
</body>
</html>
    `;
    
    const novaJanela = window.open();
    novaJanela.document.write(relatorioHTML);
    novaJanela.document.close();
}