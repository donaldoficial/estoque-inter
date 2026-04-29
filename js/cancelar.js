async function carregarCancelar() {
    const main = document.getElementById('conteudo-principal');
    
    main.innerHTML = `
        <style>
            .cancelar-container { padding: 20px; }
            .tipo-cancelamento { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
            .cancelar-box { background: #f8f9fa; padding: 25px; border-radius: 12px; border: 2px solid #e0e0e0; transition: all 0.3s; }
            .cancelar-box:hover { border-color: #dc3545; box-shadow: 0 5px 15px rgba(220,53,69,0.1); }
            .cancelar-box h3 { margin-bottom: 20px; color: #dc3545; display: flex; align-items: center; gap: 10px; }
            .input-group { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
            .input-group input { flex: 2; padding: 12px; border: 2px solid #ced4da; border-radius: 6px; font-size: 16px; }
            .input-group button { flex: 1; padding: 12px 20px; font-size: 16px; }
            .btn-buscar-nota { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border: none; border-radius: 6px; cursor: pointer; }
            .btn-buscar-romaneio { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; }
            .btn-cancelar-confirm { background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; }
            .btn-cancelar-confirm:hover { background: #c82333; }
            .info-documento { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; border: 1px solid #dee2e6; }
            .info-documento table { width: 100%; font-size: 14px; }
            .info-documento th, .info-documento td { padding: 8px; }
            .documento-cancelado { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 8px; margin-top: 15px; }
            .atencao { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
            .modal-cancelar { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; justify-content: center; align-items: center; }
            .modal-content { background: white; border-radius: 12px; max-width: 500px; width: 90%; padding: 25px; }
            .modal-header { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #dc3545; }
            .modal-body { margin-bottom: 20px; }
            .modal-footer { display: flex; gap: 10px; justify-content: flex-end; }
            .btn-cancelar-modal { background: #6c757d; color: white; padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; }
            .btn-confirmar-modal { background: #dc3545; color: white; padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; }
            .documentos-cancelados { margin-top: 30px; }
            .badge-cancelado { background: #dc3545; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            .badge-ativo { background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            @media (max-width: 768px) { .tipo-cancelamento { grid-template-columns: 1fr; } }
        </style>
        
        <div class="cancelar-container">
            <h1 style="margin-bottom: 20px;">🗑️ Cancelar Documentos</h1>
            
            <div class="atencao">
                <strong>⚠️ ATENÇÃO:</strong> O cancelamento de uma nota fiscal ou romaneio irá:
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li>🔴 Reverter todas as movimentações de estoque</li>
                    <li>📦 Devolver os produtos ao estoque (no caso de saídas)</li>
                    <li>📝 Registrar o cancelamento no histórico</li>
                    <li>❌ Não será possível desfazer esta ação</li>
                </ul>
            </div>
            
            <div class="tipo-cancelamento">
                <!-- Cancelar Nota Fiscal -->
                <div class="cancelar-box">
                    <h3>📄 Cancelar Nota Fiscal</h3>
                    <div class="input-group">
                        <input type="text" id="cancelar-nota-numero" placeholder="Digite o número da Nota Fiscal" autocomplete="off">
                        <button onclick="buscarNotaParaCancelar()" class="btn-buscar-nota">🔍 Buscar Nota</button>
                    </div>
                    <div id="info-nota-cancelar"></div>
                </div>
                
                <!-- Cancelar Romaneio -->
                <div class="cancelar-box">
                    <h3>📦 Cancelar Romaneio</h3>
                    <div class="input-group">
                        <input type="text" id="cancelar-romaneio-numero" placeholder="Digite o número do Romaneio" autocomplete="off">
                        <button onclick="buscarRomaneioParaCancelar()" class="btn-buscar-romaneio">🔍 Buscar Romaneio</button>
                    </div>
                    <div id="info-romaneio-cancelar"></div>
                </div>
            </div>
            
            <div class="card documentos-cancelados">
                <div class="card-header">📋 Documentos Cancelados Recentemente</div>
                <div id="cancelados-recentes" class="table-wrapper">Carregando...</div>
            </div>
        </div>
    `;
    
    await carregarDocumentosCancelados();
}

async function buscarNotaParaCancelar() {
    const numero = document.getElementById('cancelar-nota-numero')?.value;
    if (!numero) {
        showMessage('Digite o número da nota fiscal!', 'error');
        return;
    }
    
    const infoDiv = document.getElementById('info-nota-cancelar');
    infoDiv.innerHTML = '<div class="info-documento">🔍 Buscando... <div class="loading"></div></div>';
    
    try {
        const { data: nota, error } = await window.supabaseClient
            .from('notas_fiscais')
            .select('*')
            .eq('numero_nota', numero)
            .maybeSingle();
        
        if (error) throw error;
        
        if (!nota) {
            infoDiv.innerHTML = `<div class="info-documento" style="color:red;">❌ Nota Fiscal ${numero} não encontrada!</div>`;
            return;
        }
        
        if (nota.status === 'cancelada') {
            infoDiv.innerHTML = `
                <div class="documento-cancelado">
                    <strong>⚠️ NOTA FISCAL JÁ FOI CANCELADA!</strong><br>
                    Cancelada em: ${formatDateTime(nota.cancelado_em)}<br>
                    Motivo: ${nota.motivo_cancelamento || '-'}<br>
                    Cancelado por: ${nota.cancelado_por || '-'}
                </div>
            `;
            return;
        }
        
        // Buscar itens da nota
        const { data: itens } = await window.supabaseClient
            .from('nota_itens')
            .select('*, produtos(nome, codigo_interno, unidade_medida)')
            .eq('nota_id', nota.id);
        
        infoDiv.innerHTML = `
            <div class="info-documento">
                <h4 style="margin-bottom: 15px;">✅ Nota Fiscal Encontrada</h4>
                <p><strong>Número:</strong> ${nota.numero_nota}</p>
                <p><strong>Data de Emissão:</strong> ${formatDate(nota.data_emissao)}</p>
                <p><strong>Transportadora:</strong> ${nota.transportadora || '-'}</p>
                <p><strong>Valor Total:</strong> ${formatMoney(nota.valor_total)}</p>
                <p><strong>Status:</strong> <span class="badge-ativo">ATIVA</span></p>
                <hr>
                <strong>Itens da Nota (${itens?.length || 0} itens):</strong>
                <div class="table-wrapper" style="margin-top: 10px;">
                    <table class="table">
                        <thead><tr><th>Código</th><th>Produto</th><th>Quantidade</th></tr></thead>
                        <tbody>
                            ${itens?.map(item => `
                                <tr>
                                    <td>${item.produtos?.codigo_interno || '-'}</td>
                                    <td>${item.produtos?.nome || '-'}</td>
                                    <td>${item.quantidade} ${item.produtos?.unidade_medida || 'UN'}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="3">Nenhum item encontrado</td></tr>'}
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 15px;">
                    <button onclick="abrirModalCancelamentoNota(${nota.id})" class="btn-cancelar-confirm" style="width: 100%; padding: 12px;">
                        🗑️ CANCELAR NOTA FISCAL
                    </button>
                </div>
            </div>
        `;
        
    } catch (error) {
        infoDiv.innerHTML = `<div class="info-documento" style="color:red;">❌ Erro: ${error.message}</div>`;
    }
}

async function buscarRomaneioParaCancelar() {
    const numero = document.getElementById('cancelar-romaneio-numero')?.value;
    if (!numero) {
        showMessage('Digite o número do romaneio!', 'error');
        return;
    }
    
    const infoDiv = document.getElementById('info-romaneio-cancelar');
    infoDiv.innerHTML = '<div class="info-documento">🔍 Buscando... <div class="loading"></div></div>';
    
    try {
        const { data: romaneio, error } = await window.supabaseClient
            .from('romaneios')
            .select('*')
            .eq('numero_romaneio', numero)
            .maybeSingle();
        
        if (error) throw error;
        
        if (!romaneio) {
            infoDiv.innerHTML = `<div class="info-documento" style="color:red;">❌ Romaneio ${numero} não encontrado!</div>`;
            return;
        }
        
        if (romaneio.status === 'cancelada') {
            infoDiv.innerHTML = `
                <div class="documento-cancelado">
                    <strong>⚠️ ROMANEIO JÁ FOI CANCELADO!</strong><br>
                    Cancelado em: ${formatDateTime(romaneio.cancelado_em)}<br>
                    Motivo: ${romaneio.motivo_cancelamento || '-'}<br>
                    Cancelado por: ${romaneio.cancelado_por || '-'}
                </div>
            `;
            return;
        }
        
        // Buscar itens do romaneio
        const { data: itens } = await window.supabaseClient
            .from('romaneio_itens')
            .select('*, produtos(nome, codigo_interno, unidade_medida)')
            .eq('romaneio_id', romaneio.id);
        
        infoDiv.innerHTML = `
            <div class="info-documento">
                <h4 style="margin-bottom: 15px;">✅ Romaneio Encontrado</h4>
                <p><strong>Número:</strong> ${romaneio.numero_romaneio}</p>
                <p><strong>Motorista:</strong> ${romaneio.motorista || '-'}</p>
                <p><strong>Data de Saída:</strong> ${formatDate(romaneio.data_saida)}</p>
                <p><strong>Valor Total:</strong> ${formatMoney(romaneio.valor_total)}</p>
                <p><strong>Status:</strong> <span class="badge-ativo">ATIVO</span></p>
                <hr>
                <strong>Itens do Romaneio (${itens?.length || 0} itens):</strong>
                <div class="table-wrapper" style="margin-top: 10px;">
                    <table class="table">
                        <thead><tr><th>Código</th><th>Produto</th><th>Quantidade</th></td></thead>
                        <tbody>
                            ${itens?.map(item => `
                                <tr>
                                    <td>${item.produtos?.codigo_interno || '-'}</td>
                                    <td>${item.produtos?.nome || '-'}</td>
                                    <td>${item.quantidade} ${item.produtos?.unidade_medida || 'UN'}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="3">Nenhum item encontrado</td></tr>'}
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 15px;">
                    <button onclick="abrirModalCancelamentoRomaneio(${romaneio.id})" class="btn-cancelar-confirm" style="width: 100%; padding: 12px;">
                        🗑️ CANCELAR ROMANEIO
                    </button>
                </div>
            </div>
        `;
        
    } catch (error) {
        infoDiv.innerHTML = `<div class="info-documento" style="color:red;">❌ Erro: ${error.message}</div>`;
    }
}

function abrirModalCancelamentoNota(notaId) {
    const modal = document.createElement('div');
    modal.id = 'modal-cancelar';
    modal.className = 'modal-cancelar';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">🗑️ Confirmar Cancelamento - Nota Fiscal</div>
            <div class="modal-body">
                <p><strong>⚠️ Atenção!</strong> Esta ação irá:</p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li>Remover os produtos do estoque (entrada será revertida)</li>
                    <li>Marcar a nota como cancelada</li>
                    <li>Registrar o cancelamento no histórico</li>
                </ul>
                <div class="form-group" style="margin-top: 20px;">
                    <label>Motivo do Cancelamento *</label>
                    <textarea id="motivo-cancelamento" rows="3" placeholder="Descreva o motivo do cancelamento..." required style="width:100%; padding:10px; border:2px solid #ddd; border-radius:6px;"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="fecharModalCancelar()" class="btn-cancelar-modal">Cancelar</button>
                <button onclick="confirmarCancelamentoNota(${notaId})" class="btn-confirmar-modal">Confirmar Cancelamento</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function abrirModalCancelamentoRomaneio(romaneioId) {
    const modal = document.createElement('div');
    modal.id = 'modal-cancelar';
    modal.className = 'modal-cancelar';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">🗑️ Confirmar Cancelamento - Romaneio</div>
            <div class="modal-body">
                <p><strong>⚠️ Atenção!</strong> Esta ação irá:</p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li>Devolver os produtos ao estoque (saída será revertida)</li>
                    <li>Marcar o romaneio como cancelado</li>
                    <li>Registrar o cancelamento no histórico</li>
                </ul>
                <div class="form-group" style="margin-top: 20px;">
                    <label>Motivo do Cancelamento *</label>
                    <textarea id="motivo-cancelamento" rows="3" placeholder="Descreva o motivo do cancelamento..." required style="width:100%; padding:10px; border:2px solid #ddd; border-radius:6px;"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="fecharModalCancelar()" class="btn-cancelar-modal">Cancelar</button>
                <button onclick="confirmarCancelamentoRomaneio(${romaneioId})" class="btn-confirmar-modal">Confirmar Cancelamento</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function fecharModalCancelar() {
    const modal = document.getElementById('modal-cancelar');
    if (modal) modal.remove();
}

async function confirmarCancelamentoNota(notaId) {
    const motivo = document.getElementById('motivo-cancelamento')?.value;
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_estoque') || '{}');
    const nomeUsuario = usuarioLogado.nome || 'Sistema';
    
    if (!motivo) {
        showMessage('Informe o motivo do cancelamento!', 'error');
        return;
    }
    
    try {
        // Buscar itens da nota
        const { data: itens } = await window.supabaseClient
            .from('nota_itens')
            .select('*')
            .eq('nota_id', notaId);
        
        // Para cada item, reverter o estoque (remover a entrada)
        for (const item of itens || []) {
            // Buscar o lote correspondente
            const { data: lote } = await window.supabaseClient
                .from('lotes_estoque')
                .select('*')
                .eq('produto_id', item.produto_id)
                .eq('lote', item.lote)
                .maybeSingle();
            
            if (lote) {
                // Remover o lote ou reduzir quantidade
                const novaQuantidade = lote.quantidade_atual - item.quantidade;
                if (novaQuantidade <= 0) {
                    await window.supabaseClient
                        .from('lotes_estoque')
                        .delete()
                        .eq('id', lote.id);
                } else {
                    await window.supabaseClient
                        .from('lotes_estoque')
                        .update({ quantidade_atual: novaQuantidade })
                        .eq('id', lote.id);
                }
            }
            
            // Atualizar estoque do produto
            const { data: produto } = await window.supabaseClient
                .from('produtos')
                .select('estoque_atual')
                .eq('id', item.produto_id)
                .single();
            
            const novoEstoque = (produto.estoque_atual || 0) - item.quantidade;
            await window.supabaseClient
                .from('produtos')
                .update({ estoque_atual: novoEstoque })
                .eq('id', item.produto_id);
        }
        
        // Marcar nota como cancelada
        await window.supabaseClient
            .from('notas_fiscais')
            .update({
                status: 'cancelada',
                cancelado_em: new Date().toISOString(),
                cancelado_por: nomeUsuario,
                motivo_cancelamento: motivo
            })
            .eq('id', notaId);
        
        // Registrar movimentação de cancelamento
        for (const item of itens || []) {
            await window.supabaseClient
                .from('movimentacoes')
                .insert({
                    produto_id: item.produto_id,
                    tipo: 'inventario',
                    documento_tipo: 'cancelamento',
                    documento_id: notaId,
                    quantidade: item.quantidade,
                    observacao: `Cancelamento de Nota Fiscal - ${motivo}`
                });
        }
        
        showMessage('✅ Nota Fiscal cancelada com sucesso! Estoque revertido.', 'success');
        fecharModalCancelar();
        
        // Limpar e recarregar
        document.getElementById('cancelar-nota-numero').value = '';
        document.getElementById('info-nota-cancelar').innerHTML = '';
        await carregarDocumentosCancelados();
        
    } catch (error) {
        showMessage('Erro ao cancelar: ' + error.message, 'error');
    }
}

async function confirmarCancelamentoRomaneio(romaneioId) {
    const motivo = document.getElementById('motivo-cancelamento')?.value;
    const usuarioLogado = JSON.parse(localStorage.getItem('usuario_estoque') || '{}');
    const nomeUsuario = usuarioLogado.nome || 'Sistema';
    
    if (!motivo) {
        showMessage('Informe o motivo do cancelamento!', 'error');
        return;
    }
    
    try {
        // Buscar itens do romaneio
        const { data: itens } = await window.supabaseClient
            .from('romaneio_itens')
            .select('*')
            .eq('romaneio_id', romaneioId);
        
        // Para cada item, reverter o estoque (devolver a saída)
        for (const item of itens || []) {
            // Criar um novo lote ou adicionar ao lote original
            const hoje = new Date();
            const dataValidade = new Date();
            dataValidade.setFullYear(hoje.getFullYear() + 1);
            
            await window.supabaseClient
                .from('lotes_estoque')
                .insert({
                    produto_id: item.produto_id,
                    lote: `CANCEL-${Date.now()}`,
                    data_fabricacao: hoje.toISOString().split('T')[0],
                    data_validade: dataValidade.toISOString().split('T')[0],
                    quantidade: item.quantidade,
                    quantidade_atual: item.quantidade,
                    preco_custo: item.preco_unitario,
                    terco_recebimento: 1
                });
            
            // Atualizar estoque do produto
            const { data: produto } = await window.supabaseClient
                .from('produtos')
                .select('estoque_atual')
                .eq('id', item.produto_id)
                .single();
            
            const novoEstoque = (produto.estoque_atual || 0) + item.quantidade;
            await window.supabaseClient
                .from('produtos')
                .update({ estoque_atual: novoEstoque })
                .eq('id', item.produto_id);
        }
        
        // Marcar romaneio como cancelado
        await window.supabaseClient
            .from('romaneios')
            .update({
                status: 'cancelada',
                cancelado_em: new Date().toISOString(),
                cancelado_por: nomeUsuario,
                motivo_cancelamento: motivo
            })
            .eq('id', romaneioId);
        
        // Registrar movimentação de cancelamento
        for (const item of itens || []) {
            await window.supabaseClient
                .from('movimentacoes')
                .insert({
                    produto_id: item.produto_id,
                    tipo: 'inventario',
                    documento_tipo: 'cancelamento',
                    documento_id: romaneioId,
                    quantidade: item.quantidade,
                    observacao: `Cancelamento de Romaneio - ${motivo}`
                });
        }
        
        showMessage('✅ Romaneio cancelado com sucesso! Estoque revertido.', 'success');
        fecharModalCancelar();
        
        // Limpar e recarregar
        document.getElementById('cancelar-romaneio-numero').value = '';
        document.getElementById('info-romaneio-cancelar').innerHTML = '';
        await carregarDocumentosCancelados();
        
    } catch (error) {
        showMessage('Erro ao cancelar: ' + error.message, 'error');
    }
}

async function carregarDocumentosCancelados() {
    try {
        // Buscar notas canceladas
        const { data: notasCanceladas } = await window.supabaseClient
            .from('notas_fiscais')
            .select('*')
            .eq('status', 'cancelada')
            .order('cancelado_em', { ascending: false })
            .limit(5);
        
        // Buscar romaneios cancelados
        const { data: romaneiosCancelados } = await window.supabaseClient
            .from('romaneios')
            .select('*')
            .eq('status', 'cancelada')
            .order('cancelado_em', { ascending: false })
            .limit(5);
        
        const container = document.getElementById('cancelados-recentes');
        if (!container) return;
        
        let html = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
        
        html += '<div><h4 style="margin-bottom: 15px; color: #dc3545;">📄 Notas Fiscais Canceladas</h4>';
        if (notasCanceladas && notasCanceladas.length > 0) {
            html += `<div class="table-wrapper"><table class="table"><thead><tr><th>Número</th><th>Cancelado em</th><th>Motivo</th><th>Por</th></tr></thead><tbody>`;
            notasCanceladas.forEach(n => {
                html += `<tr>
                    <td><strong>${n.numero_nota}</strong></td>
                    <td>${formatDateTime(n.cancelado_em)}</td>
                    <td>${n.motivo_cancelamento?.substring(0, 50) || '-'}${n.motivo_cancelamento?.length > 50 ? '...' : ''}</td>
                    <td>${n.cancelado_por || '-'}</td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
        } else {
            html += '<p>Nenhuma nota cancelada.</p>';
        }
        html += '</div>';
        
        html += '<div><h4 style="margin-bottom: 15px; color: #dc3545;">📦 Romaneios Cancelados</h4>';
        if (romaneiosCancelados && romaneiosCancelados.length > 0) {
            html += `<div class="table-wrapper"><table class="table"><thead><td><th>Número</th><th>Cancelado em</th><th>Motivo</th><th>Por</th></tr></thead><tbody>`;
            romaneiosCancelados.forEach(r => {
                html += `<tr>
                    <td><strong>${r.numero_romaneio}</strong></td>
                    <td>${formatDateTime(r.cancelado_em)}</td>
                    <td>${r.motivo_cancelamento?.substring(0, 50) || '-'}${r.motivo_cancelamento?.length > 50 ? '...' : ''}</td>
                    <td>${r.cancelado_por || '-'}</td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
        } else {
            html += '<p>Nenhum romaneio cancelado.</p>';
        }
        html += '</div></div>';
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro:', error);
        const container = document.getElementById('cancelados-recentes');
        if (container) container.innerHTML = '<p>Erro ao carregar documentos cancelados.</p>';
    }
}