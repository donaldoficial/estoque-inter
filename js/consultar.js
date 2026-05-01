async function carregarConsultar() {
    const main = document.getElementById('conteudo-principal');
    
    main.innerHTML = `
        <style>
            .consulta-container { padding: 20px; }
            .card-consulta { background: white; border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .tipo-consulta { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            .consulta-box { background: #f8f9fa; padding: 25px; border-radius: 12px; border: 2px solid #e0e0e0; transition: all 0.3s; }
            .consulta-box:hover { border-color: #667eea; box-shadow: 0 5px 15px rgba(102,126,234,0.1); }
            .consulta-box h3 { margin-bottom: 20px; color: #667eea; }
            .input-group { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
            .input-group input { flex: 2; padding: 12px; border: 2px solid #ced4da; border-radius: 6px; font-size: 16px; }
            .input-group button { flex: 1; padding: 12px 20px; font-size: 16px; }
            .btn-romaneio { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; }
            .btn-nota { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 6px; cursor: pointer; }
            .resultado-consulta { margin-top: 20px; padding: 15px; border-radius: 8px; display: none; }
            .resultado-consulta.show { display: block; }
            .resultado-sucesso { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 8px; }
            .resultado-erro { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 8px; }
            .documentos-recentes { margin-top: 30px; }
            .saldo-positivo { color: #28a745; font-weight: bold; }
            .saldo-negativo { color: #dc3545; font-weight: bold; }
            @media (max-width: 768px) { .tipo-consulta { grid-template-columns: 1fr; } }
        </style>
        
        <div class="consulta-container">
            <h1 style="margin-bottom: 25px;">🔍 Consultar Documentos</h1>
            
            <div class="tipo-consulta">
                <div class="consulta-box">
                    <h3>📦 Consultar Romaneio</h3>
                    <div class="input-group">
                        <input type="text" id="consulta-romaneio-numero" placeholder="Digite o número do Romaneio" autocomplete="off">
                        <button onclick="consultarRomaneio()" class="btn-romaneio">🔍 Consultar</button>
                    </div>
                    <div id="resultado-romaneio" class="resultado-consulta"></div>
                </div>
                
                <div class="consulta-box">
                    <h3>📄 Consultar Nota Fiscal</h3>
                    <div class="input-group">
                        <input type="text" id="consulta-nota-numero" placeholder="Digite o número da Nota Fiscal" autocomplete="off">
                        <button onclick="consultarNotaFiscal()" class="btn-nota">🔍 Consultar</button>
                    </div>
                    <div id="resultado-nota" class="resultado-consulta"></div>
                </div>
            </div>
            
            <div class="card-consulta documentos-recentes">
                <h2>📋 Documentos Recentes</h2>
                <div id="documentos-recentes" style="overflow-x: auto;">Carregando...</div>
            </div>
        </div>
    `;
    
    await carregarDocumentosRecentes();
}

async function carregarDocumentosRecentes() {
    try {
        const { data: romaneios } = await window.supabaseClient
            .from('romaneios')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        const { data: notas } = await window.supabaseClient
            .from('notas_fiscais')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        
        const container = document.getElementById('documentos-recentes');
        if (!container) return;
        
        let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
        
        html += '<div><h4 style="margin-bottom: 15px; color: #667eea;">📦 Últimos Romaneios</h4>';
        if (romaneios && romaneios.length > 0) {
            html += `<div class="table-wrapper"><table class="table"><thead><tr><th>Número</th><th>Motorista</th><th>Data</th><th>Valor</th><th>Ação</th></tr></thead><tbody>`;
            romaneios.forEach(r => {
                html += `<tr>
                    <td><strong>${r.numero_romaneio}</strong></td>
                    <td>${r.motorista || '-'}</td>
                    <td>${formatDate(r.data_saida)}</td>
                    <td>${formatMoney(r.valor_total)}</td>
                    <td><button onclick="consultarRomaneioNumero('${r.numero_romaneio}')" style="padding: 5px 10px; font-size: 12px;">Ver</button></td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
        } else {
            html += '<p>Nenhum romaneio encontrado.</p>';
        }
        html += '</div>';
        
        html += '<div><h4 style="margin-bottom: 15px; color: #28a745;">📄 Últimas Notas Fiscais</h4>';
        if (notas && notas.length > 0) {
            html += `<div class="table-wrapper"><table class="table"><thead><tr><th>Número</th><th>Transportadora</th><th>Data</th><th>Valor</th><th>Ação</th></tr></thead><tbody>`;
            notas.forEach(n => {
                html += `<tr>
                    <td><strong>${n.numero_nota}</strong></td>
                    <td>${n.transportadora || '-'}</td>
                    <td>${formatDate(n.data_emissao)}</td>
                    <td>${formatMoney(n.valor_total)}</td>
                    <td><button onclick="consultarNotaFiscalNumero('${n.numero_nota}')" style="padding: 5px 10px; font-size: 12px;">Ver</button></td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
        } else {
            html += '<p>Nenhuma nota fiscal encontrada.</p>';
        }
        html += '</div></div>';
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro:', error);
        const container = document.getElementById('documentos-recentes');
        if (container) container.innerHTML = '<p>Erro ao carregar documentos recentes.</p>';
    }
}

async function consultarRomaneio() {
    const numero = document.getElementById('consulta-romaneio-numero')?.value;
    if (!numero) {
        showMessage('Digite o número do romaneio!', 'error');
        return;
    }
    await consultarRomaneioNumero(numero);
}

async function consultarRomaneioNumero(numero) {
    const resultadoDiv = document.getElementById('resultado-romaneio');
    if (!resultadoDiv) return;
    
    resultadoDiv.innerHTML = '<div class="resultado-erro">🔍 Buscando...</div>';
    resultadoDiv.classList.add('show');
    
    try {
        const { data: romaneio, error } = await window.supabaseClient
            .from('romaneios')
            .select('*')
            .eq('numero_romaneio', numero)
            .maybeSingle();
        
        if (error) throw error;
        
        if (!romaneio) {
            resultadoDiv.innerHTML = `<div class="resultado-erro">❌ Romaneio ${numero} não encontrado!</div>`;
            return;
        }
        
        const { data: itens } = await window.supabaseClient
            .from('romaneio_itens')
            .select('*, produtos(*)')
            .eq('romaneio_id', romaneio.id);
        
        resultadoDiv.innerHTML = `
            <div class="resultado-sucesso">
                <h4>✅ Romaneio Encontrado!</h4>
                <p><strong>Número:</strong> ${romaneio.numero_romaneio}</p>
                <p><strong>Motorista:</strong> ${romaneio.motorista || '-'}</p>
                <p><strong>Data de Saída:</strong> ${formatDate(romaneio.data_saida)}</p>
                <p><strong>Valor Total:</strong> ${formatMoney(romaneio.valor_total)}</p>
                ${romaneio.observacao ? `<p><strong>Observação:</strong> ${romaneio.observacao}</p>` : ''}
                <hr>
                <strong>Itens do Romaneio (${itens?.length || 0} itens):</strong>
                <div class="table-wrapper" style="margin-top: 10px;">
                    <table class="table">
                        <thead><tr><th>Código</th><th>Produto</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr></thead>
                        <tbody>
                            ${itens?.map(item => `
                                <tr>
                                    <td>${item.produtos?.codigo_interno || '-'}</td>
                                    <td>${item.produtos?.nome || '-'}</td>
                                    <td>${item.quantidade}</td>
                                    <td>${formatMoney(item.preco_unitario)}</td>
                                    <td>${formatMoney(item.subtotal)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="5">Nenhum item encontrado</td></tr>'}
                        </tbody>
                    </table>
                </div>
                <button onclick="gerarRelatorioRomaneioCompleto(${romaneio.id})" style="margin-top: 15px; background: #17a2b8; padding: 8px 20px;">📄 Gerar Relatório Completo (PDF)</button>
            </div>
        `;
        
    } catch (error) {
        console.error('Erro:', error);
        resultadoDiv.innerHTML = `<div class="resultado-erro">❌ Erro ao consultar: ${error.message}</div>`;
    }
}

async function consultarNotaFiscal() {
    const numero = document.getElementById('consulta-nota-numero')?.value;
    if (!numero) {
        showMessage('Digite o número da nota fiscal!', 'error');
        return;
    }
    await consultarNotaFiscalNumero(numero);
}

async function consultarNotaFiscalNumero(numero) {
    const resultadoDiv = document.getElementById('resultado-nota');
    if (!resultadoDiv) return;
    
    resultadoDiv.innerHTML = '<div class="resultado-erro">🔍 Buscando...</div>';
    resultadoDiv.classList.add('show');
    
    try {
        const { data: nota, error } = await window.supabaseClient
            .from('notas_fiscais')
            .select('*')
            .eq('numero_nota', numero)
            .maybeSingle();
        
        if (error) throw error;
        
        if (!nota) {
            resultadoDiv.innerHTML = `<div class="resultado-erro">❌ Nota Fiscal ${numero} não encontrada!</div>`;
            return;
        }
        
        const { data: itens } = await window.supabaseClient
            .from('nota_itens')
            .select('*, produtos(*)')
            .eq('nota_id', nota.id);
        
        resultadoDiv.innerHTML = `
            <div class="resultado-sucesso">
                <h4>✅ Nota Fiscal Encontrada!</h4>
                <p><strong>Número:</strong> ${nota.numero_nota}</p>
                <p><strong>Transportadora:</strong> ${nota.transportadora || '-'}</p>
                <p><strong>Data de Emissão:</strong> ${formatDate(nota.data_emissao)}</p>
                <p><strong>Data de Entrada:</strong> ${formatDate(nota.data_entrada)}</p>
                <p><strong>Valor Total:</strong> ${formatMoney(nota.valor_total)}</p>
                ${nota.observacao ? `<p><strong>Observação:</strong> ${nota.observacao}</p>` : ''}
                <hr>
                <strong>Itens da Nota (${itens?.length || 0} itens):</strong>
                <div class="table-wrapper" style="margin-top: 10px;">
                    <table class="table">
                        <thead><tr><th>Código</th><th>Produto</th><th>Qtd</th><th>Preço</th><th>Subtotal</th></tr></thead>
                        <tbody>
                            ${itens?.map(item => `
                                <tr>
                                    <td>${item.produtos?.codigo_interno || '-'}</td>
                                    <td>${item.produtos?.nome || '-'}</td>
                                    <td>${item.quantidade}</td>
                                    <td>${formatMoney(item.preco_unitario)}</td>
                                    <td>${formatMoney(item.subtotal)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="5">Nenhum item encontrado</td></tr>'}
                        </tbody>
                    </table>
                </div>
                <button onclick="gerarRelatorioNotaFiscalCompleto(${nota.id})" style="margin-top: 15px; background: #17a2b8; padding: 8px 20px;">📄 Gerar Relatório Completo (PDF)</button>
            </div>
        `;
        
    } catch (error) {
        console.error('Erro:', error);
        resultadoDiv.innerHTML = `<div class="resultado-erro">❌ Erro ao consultar: ${error.message}</div>`;
    }
}

async function gerarRelatorioRomaneioCompleto(romaneioId) {
    try {
        const { data: romaneio } = await window.supabaseClient
            .from('romaneios')
            .select('*')
            .eq('id', romaneioId)
            .single();
        
        const { data: itens } = await window.supabaseClient
            .from('romaneio_itens')
            .select('*, produtos(*)')
            .eq('romaneio_id', romaneioId);
        
        const dataAtual = new Date();
        
        const relatorioHTML = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Romaneio - ${romaneio.numero_romaneio}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; padding: 40px; }
        .documento { max-width: 1000px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 5px; }
        .info-section { padding: 30px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .info-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
        .info-value { font-size: 16px; color: #333; margin-top: 5px; }
        .tabela-container { padding: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #667eea; color: white; padding: 12px; text-align: left; }
        td { padding: 10px 12px; border-bottom: 1px solid #e0e0e0; }
        .total-geral { text-align: right; padding: 20px 30px; background: #f8f9fa; font-size: 20px; font-weight: bold; }
        .footer { padding: 20px 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0; }
        .btn-print { position: fixed; bottom: 30px; right: 30px; background: #28a745; color: white; border: none; padding: 15px 30px; border-radius: 50px; cursor: pointer; font-weight: bold; }
        @media print { body { padding: 0; background: white; } .btn-print { display: none; } .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
</head>
<body>
    <div class="documento">
        <div class="header">
            <h1>📦 ROMANEIO DE ENTREGA</h1>
            <div>Nº ${romaneio.numero_romaneio}</div>
            <div>Emitido em: ${formatDateTime(dataAtual)}</div>
        </div>
        <div class="info-section">
            <div class="info-grid">
                <div><div class="info-label">MOTORISTA</div><div class="info-value">${romaneio.motorista || '-'}</div></div>
                <div><div class="info-label">DATA DE SAÍDA</div><div class="info-value">${formatDate(romaneio.data_saida)}</div></div>
            </div>
            ${romaneio.observacao ? `<div style="margin-top:15px;"><div class="info-label">OBSERVAÇÃO</div><div class="info-value">${romaneio.observacao}</div></div>` : ''}
        </div>
        <div class="tabela-container">
            <h3>ITENS DO ROMANEIO</h3>
            <table>
                <thead><tr><th>Código</th><th>Produto</th><th>Unidade</th><th>Quantidade</th><th>Preço Unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                    ${itens.map(item => `<tr>
                        <td>${item.produtos?.codigo_interno || '-'}</td>
                        <td>${item.produtos?.nome || '-'}</td>
                        <td>${item.produtos?.unidade_medida || 'UN'}</td>
                        <td>${item.quantidade}</td>
                        <td>${formatMoney(item.preco_unitario)}</td>
                        <td>${formatMoney(item.subtotal)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
        <div class="total-geral">TOTAL: ${formatMoney(romaneio.valor_total)}</div>
        <div class="footer"><p>Documento emitido pelo Sistema de Controle de Estoque - DNLSOFT</p><p>${formatDateTime(dataAtual)}</p></div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
</body>
</html>
        `;
        
        const novaJanela = window.open();
        novaJanela.document.write(relatorioHTML);
        novaJanela.document.close();
        
    } catch (error) {
        showMessage('Erro ao gerar relatório: ' + error.message, 'error');
    }
}

async function gerarRelatorioNotaFiscalCompleto(notaId) {
    try {
        const { data: nota } = await window.supabaseClient
            .from('notas_fiscais')
            .select('*')
            .eq('id', notaId)
            .single();
        
        const { data: itens } = await window.supabaseClient
            .from('nota_itens')
            .select('*, produtos(*)')
            .eq('nota_id', notaId);
        
        const dataAtual = new Date();
        
        const relatorioHTML = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nota Fiscal - ${nota.numero_nota}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; padding: 40px; }
        .documento { max-width: 1000px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 28px; margin-bottom: 5px; }
        .info-section { padding: 30px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .info-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
        .info-value { font-size: 16px; color: #333; margin-top: 5px; }
        .tabela-container { padding: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #28a745; color: white; padding: 12px; text-align: left; }
        td { padding: 10px 12px; border-bottom: 1px solid #e0e0e0; }
        .total-geral { text-align: right; padding: 20px 30px; background: #f8f9fa; font-size: 20px; font-weight: bold; }
        .footer { padding: 20px 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0; }
        .btn-print { position: fixed; bottom: 30px; right: 30px; background: #28a745; color: white; border: none; padding: 15px 30px; border-radius: 50px; cursor: pointer; font-weight: bold; }
        @media print { body { padding: 0; background: white; } .btn-print { display: none; } .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
</head>
<body>
    <div class="documento">
        <div class="header">
            <h1>📄 NOTA FISCAL DE ENTRADA</h1>
            <div>Nº ${nota.numero_nota}</div>
            <div>Emitido em: ${formatDateTime(dataAtual)}</div>
        </div>
        <div class="info-section">
            <div class="info-grid">
                <div><div class="info-label">DATA DE EMISSÃO</div><div class="info-value">${formatDate(nota.data_emissao)}</div></div>
                <div><div class="info-label">DATA DE ENTRADA</div><div class="info-value">${formatDate(nota.data_entrada)}</div></div>
            </div>
            <div><div class="info-label">TRANSPORTADORA</div><div class="info-value">${nota.transportadora || '-'}</div></div>
            ${nota.observacao ? `<div style="margin-top:15px;"><div class="info-label">OBSERVAÇÃO</div><div class="info-value">${nota.observacao}</div></div>` : ''}
        </div>
        <div class="tabela-container">
            <h3>ITENS DA NOTA FISCAL</h3>
            <table>
                <thead><tr><th>Código</th><th>Produto</th><th>Unidade</th><th>Quantidade</th><th>Preço Unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                    ${itens.map(item => `<tr>
                        <td>${item.produtos?.codigo_interno || '-'}</td>
                        <td>${item.produtos?.nome || '-'}</td>
                        <td>${item.produtos?.unidade_medida || 'UN'}</td>
                        <td>${item.quantidade}</td>
                        <td>${formatMoney(item.preco_unitario)}</td>
                        <td>${formatMoney(item.subtotal)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
        <div class="total-geral">TOTAL: ${formatMoney(nota.valor_total)}</div>
        <div class="footer"><p>Documento emitido pelo Sistema de Controle de Estoque - DNLSOFT</p><p>${formatDateTime(dataAtual)}</p></div>
    </div>
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
</body>
</html>
        `;
        
        const novaJanela = window.open();
        novaJanela.document.write(relatorioHTML);
        novaJanela.document.close();
        
    } catch (error) {
        showMessage('Erro ao gerar relatório: ' + error.message, 'error');
    }
}