let itensNota = [];

async function carregarEntrada() {
    const main = document.getElementById('conteudo-principal');
    
    main.innerHTML = `
        <style>
            .item-entrada {
                background: #f8f9fa;
                padding: 20px;
                margin-bottom: 15px;
                border-radius: 8px;
                border: 1px solid #dee2e6;
            }
            .row-itens {
                display: grid;
                grid-template-columns: 1.5fr 1fr 1fr 1fr 0.8fr 0.5fr;
                gap: 10px;
                align-items: center;
            }
            .campo-codigo input, .campo-qtd input, .campo-preco input, 
            .campo-fab input, .campo-val input, .campo-lote input {
                width: 100%;
                padding: 8px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 13px;
            }
            .info-produto {
                font-size: 11px;
                margin-top: 5px;
                padding: 5px;
                border-radius: 4px;
            }
            .info-sucesso { background: #d4edda; color: #155724; }
            .info-alerta { background: #fff3cd; color: #856404; }
            .info-critico { background: #f8d7da; color: #721c24; }
            .info-buscando { background: #e7f3ff; color: #004085; }
            .btn-remover { background: #dc3545; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
            .btn-adicionar { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 10px; }
            .terco-1 { border-left: 4px solid #28a745; }
            .terco-2 { border-left: 4px solid #ffc107; }
            .terco-3 { border-left: 4px solid #dc3545; }
            .instrucao { background: #e7f3ff; border-left: 4px solid #2196F3; padding: 10px 15px; margin-bottom: 20px; border-radius: 4px; }
            .validacao-nota { font-size: 12px; margin-top: 5px; }
            .validacao-sucesso { color: #28a745; }
            .validacao-erro { color: #dc3545; }
            .botoes-acao {
                display: flex;
                justify-content: flex-end;
                gap: 15px;
                margin-top: 30px;
            }
            .btn-limpar {
                background: #6c757d;
                color: white;
                padding: 12px 30px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
            }
            .btn-limpar:hover {
                background: #5a6268;
            }
            .btn-registrar {
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                padding: 12px 30px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 16px;
            }
            .btn-registrar:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(40,167,69,0.3);
            }
            .modal-confirmacao {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                justify-content: center;
                align-items: center;
            }
            .modal-confirmacao-content {
                background: white;
                border-radius: 12px;
                max-width: 450px;
                width: 90%;
                padding: 25px;
                text-align: center;
            }
            .modal-confirmacao-header {
                font-size: 22px;
                font-weight: bold;
                margin-bottom: 20px;
                color: #28a745;
            }
            .modal-confirmacao-body {
                margin-bottom: 25px;
                color: #333;
                line-height: 1.5;
            }
            .modal-confirmacao-footer {
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            .btn-cancelar-modal {
                background: #6c757d;
                color: white;
                padding: 10px 25px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
            }
            .btn-confirmar-modal {
                background: #28a745;
                color: white;
                padding: 10px 25px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
            }
            @media (max-width: 1000px) {
                .row-itens { grid-template-columns: 1fr; gap: 8px; }
            }
        </style>
        
        <h1 style="margin-bottom: 20px;">📥 Entrada de Nota Fiscal</h1>
        
        <div class="instrucao">
            💡 <strong>Controle de Validade e 3 Terços:</strong><br>
            • 🟢 1º Terço: Produto dentro da validade - PODE RECEBER<br>
            • 🟡 2º Terço: Produto com alerta - PODE RECEBER COM ATENÇÃO<br>
            • 🔴 3º Terço: Produto NÃO PODE SER RECEBIDO (bloqueado)
        </div>
        
        <div class="card">
            <div class="card-header">📄 Dados da Nota Fiscal</div>
            <form id="form-nota">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <label style="font-weight: bold;">Número da Nota *</label>
                        <input type="text" id="nota-numero" required style="width:100%;padding:10px;">
                        <div id="nota-validacao" class="validacao-nota"></div>
                    </div>
                    <div>
                        <label style="font-weight: bold;">Data de Emissão *</label>
                        <input type="date" id="nota-data" required style="width:100%;padding:10px;">
                    </div>
                    <div>
                        <label>Transportadora</label>
                        <input type="text" id="nota-transportadora" style="width:100%;padding:10px;">
                    </div>
                    <div>
                        <label>Observação</label>
                        <textarea id="nota-obs" rows="2" style="width:100%;padding:10px;"></textarea>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin:0;">🛒 Itens da Nota</h3>
                        <button type="button" onclick="adicionarItemNota()" class="btn-adicionar">+ Adicionar Item</button>
                    </div>
                    <div id="itens-nota"></div>
                </div>
                
                <div class="botoes-acao">
                    <button type="button" onclick="limparFormularioEntrada()" class="btn-limpar">🧹 Limpar</button>
                    <button type="button" onclick="abrirModalConfirmacao()" class="btn-registrar">✅ Confirmar Entrada</button>
                </div>
            </form>
        </div>
        <div id="mensagem"></div>
    `;
    
    adicionarItemNota();
    
    // Verificar se o número da nota já existe
    const inputNumero = document.getElementById('nota-numero');
    inputNumero.addEventListener('blur', async () => {
        const numero = inputNumero.value;
        if (numero) {
            const { data: existente } = await window.supabaseClient
                .from('notas_fiscais')
                .select('id')
                .eq('numero_nota', numero)
                .maybeSingle();
            
            const divValidacao = document.getElementById('nota-validacao');
            if (existente) {
                divValidacao.innerHTML = '<span style="color: #dc3545;">⚠️ Este número de nota fiscal já foi utilizado!</span>';
            } else {
                divValidacao.innerHTML = '<span style="color: #28a745;">✅ Número disponível</span>';
            }
        }
    });
}

function limparFormularioEntrada() {
    if (confirm('Tem certeza que deseja limpar todos os campos?')) {
        document.getElementById('form-nota').reset();
        document.getElementById('itens-nota').innerHTML = '';
        adicionarItemNota();
        document.getElementById('nota-validacao').innerHTML = '';
    }
}

function abrirModalConfirmacao() {
    // Coletar resumo dos itens para mostrar na confirmação
    const numeroNota = document.getElementById('nota-numero').value;
    const itensDiv = document.querySelectorAll('.item-entrada');
    let totalItens = 0;
    let totalQuantidade = 0;
    let valorTotal = 0;
    
    for (const item of itensDiv) {
        const qtdInput = item.querySelector('[id^="qtd-"]');
        const precoInput = item.querySelector('[id^="preco-"]');
        const produtoId = item.querySelector('[id^="prod-id-"]').value;
        
        if (produtoId && qtdInput) {
            const qtd = parseFloat(qtdInput.value) || 0;
            const preco = parseFloat(precoInput?.value) || 0;
            if (qtd > 0) {
                totalItens++;
                totalQuantidade += qtd;
                valorTotal += qtd * preco;
            }
        }
    }
    
    if (totalItens === 0) {
        showMessage('Adicione pelo menos um item antes de confirmar!', 'error');
        return;
    }
    
    if (!numeroNota) {
        showMessage('Digite o número da nota fiscal!', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'modal-confirmacao';
    modal.className = 'modal-confirmacao';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-confirmacao-content">
            <div class="modal-confirmacao-header">
                ✅ Confirmar Entrada
            </div>
            <div class="modal-confirmacao-body">
                <p><strong>Número da Nota:</strong> ${numeroNota}</p>
                <p><strong>Total de Itens:</strong> ${totalItens}</p>
                <p><strong>Quantidade Total:</strong> ${totalQuantidade} unidades</p>
                <p><strong>Valor Total:</strong> ${formatMoney(valorTotal)}</p>
                <hr style="margin: 15px 0;">
                <p style="color: #666;">Confirma o registro desta entrada?</p>
            </div>
            <div class="modal-confirmacao-footer">
                <button onclick="fecharModalConfirmacao()" class="btn-cancelar-modal">Cancelar</button>
                <button onclick="confirmarRegistroEntrada()" class="btn-confirmar-modal">Confirmar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function fecharModalConfirmacao() {
    const modal = document.getElementById('modal-confirmacao');
    if (modal) modal.remove();
}

async function confirmarRegistroEntrada() {
    fecharModalConfirmacao();
    await salvarNotaFiscal();
}

function adicionarItemNota() {
    const container = document.getElementById('itens-nota');
    const itemId = Date.now();
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-entrada';
    itemDiv.id = `item-${itemId}`;
    itemDiv.innerHTML = `
        <div class="row-itens">
            <div>
                <input type="text" id="codigo-${itemId}" placeholder="Código interno" autocomplete="off" style="width:100%;">
                <input type="hidden" id="prod-id-${itemId}">
                <div id="info-${itemId}" class="info-produto"></div>
            </div>
            <div><input type="number" id="qtd-${itemId}" placeholder="Qtd" step="1" value="1"></div>
            <div><input type="number" step="0.01" id="preco-${itemId}" placeholder="Preço" readonly style="background:#e9ecef;"></div>
            <div><input type="date" id="fab-${itemId}" placeholder="Fabricação" onchange="validarValidade(${itemId})"></div>
            <div><input type="date" id="val-${itemId}" placeholder="Validade" onchange="validarValidade(${itemId})"></div>
            <div><input type="text" id="lote-${itemId}" placeholder="Lote"></div>
            <div><button type="button" onclick="removerItemNota(${itemId})" class="btn-remover">Remover</button></div>
        </div>
    `;
    
    container.appendChild(itemDiv);
    
    const inputCodigo = document.getElementById(`codigo-${itemId}`);
    inputCodigo.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarProdutoEntrada(this.value, itemId);
        }
    });
    
    const inputQtd = document.getElementById(`qtd-${itemId}`);
    inputQtd.addEventListener('input', () => calcularSubtotalEntrada(itemId));
    inputQtd.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') adicionarItemNota();
    });
}

async function buscarProdutoEntrada(codigo, itemId) {
    if (!codigo || codigo.trim() === '') return;
    
    const infoDiv = document.getElementById(`info-${itemId}`);
    infoDiv.innerHTML = '🔍 Buscando...';
    infoDiv.className = 'info-produto info-buscando';
    
    try {
        const { data: produto, error } = await window.supabaseClient
            .from('produtos')
            .select('id, nome, codigo_interno, preco_compra, unidade_medida, estoque_atual, controla_validade, dias_vida_util')
            .eq('codigo_interno', codigo.toUpperCase().trim())
            .maybeSingle();
        
        if (error) throw error;
        
        if (!produto) {
            infoDiv.innerHTML = `❌ Produto "${codigo}" não encontrado!`;
            infoDiv.className = 'info-produto';
            return;
        }
        
        document.getElementById(`prod-id-${itemId}`).value = produto.id;
        document.getElementById(`preco-${itemId}`).value = produto.preco_compra || 0;
        
        infoDiv.innerHTML = `✅ ${produto.nome} | Preço: ${formatMoney(produto.preco_compra)}`;
        infoDiv.className = 'info-produto info-sucesso';
        
        if (produto.controla_validade) {
            document.getElementById(`fab-${itemId}`).style.border = '2px solid #ffc107';
            document.getElementById(`val-${itemId}`).style.border = '2px solid #ffc107';
        }
        
    } catch (error) {
        infoDiv.innerHTML = '❌ Erro na busca';
        infoDiv.className = 'info-produto';
    }
}

async function validarValidade(itemId) {
    const dataFab = document.getElementById(`fab-${itemId}`).value;
    const dataVal = document.getElementById(`val-${itemId}`).value;
    const produtoId = document.getElementById(`prod-id-${itemId}`).value;
    const infoDiv = document.getElementById(`info-${itemId}`);
    const itemDiv = document.getElementById(`item-${itemId}`);
    
    if (!dataFab || !dataVal || !produtoId) return;
    
    const fab = new Date(dataFab);
    const val = new Date(dataVal);
    const hoje = new Date();
    
    if (fab >= val) {
        infoDiv.innerHTML = '❌ Data de fabricação deve ser anterior à validade!';
        infoDiv.className = 'info-produto';
        return;
    }
    
    if (val < hoje) {
        infoDiv.innerHTML = '❌ Produto VENCIDO! Não pode ser recebido.';
        infoDiv.className = 'info-produto';
        itemDiv.classList.add('terco-3');
        document.getElementById(`qtd-${itemId}`).disabled = true;
        return;
    }
    
    const { data: produto } = await window.supabaseClient
        .from('produtos')
        .select('dias_vida_util')
        .eq('id', produtoId)
        .single();
    
    const vidaTotal = produto?.dias_vida_util || (val - fab) / (1000 * 60 * 60 * 24);
    const diasPassados = (hoje - fab) / (1000 * 60 * 60 * 24);
    const terco = Math.ceil((diasPassados / vidaTotal) * 3);
    
    itemDiv.classList.remove('terco-1', 'terco-2', 'terco-3');
    
    if (terco === 1) {
        itemDiv.classList.add('terco-1');
        infoDiv.innerHTML = `🟢 1º TERÇO - Produto dentro da validade. PODE RECEBER. Dias restantes: ${Math.ceil((val - hoje) / (1000 * 60 * 60 * 24))}`;
        infoDiv.className = 'info-produto info-sucesso';
        document.getElementById(`qtd-${itemId}`).disabled = false;
    } else if (terco === 2) {
        itemDiv.classList.add('terco-2');
        infoDiv.innerHTML = `🟡 2º TERÇO - ALERTA! Produto com validade próxima. PODE RECEBER COM ATENÇÃO. Dias restantes: ${Math.ceil((val - hoje) / (1000 * 60 * 60 * 24))}`;
        infoDiv.className = 'info-produto info-alerta';
        document.getElementById(`qtd-${itemId}`).disabled = false;
    } else {
        itemDiv.classList.add('terco-3');
        infoDiv.innerHTML = `🔴 3º TERÇO - DATA CRÍTICA! Produto NÃO PODE SER RECEBIDO! Dias restantes: ${Math.ceil((val - hoje) / (1000 * 60 * 60 * 24))}`;
        infoDiv.className = 'info-produto info-critico';
        document.getElementById(`qtd-${itemId}`).disabled = true;
        document.getElementById(`qtd-${itemId}`).value = 0;
    }
}

function calcularSubtotalEntrada(itemId) {
    const qtd = parseFloat(document.getElementById(`qtd-${itemId}`).value) || 0;
    const preco = parseFloat(document.getElementById(`preco-${itemId}`).value) || 0;
    const subtotal = qtd * preco;
    const subtotalSpan = document.getElementById(`subtotal-${itemId}`);
    if (subtotalSpan) subtotalSpan.innerHTML = formatMoney(subtotal);
}

function removerItemNota(itemId) {
    const item = document.getElementById(`item-${itemId}`);
    if (item) item.remove();
    if (document.querySelectorAll('.item-entrada').length === 0) adicionarItemNota();
}

async function salvarNotaFiscal() {
    const numero_nota = document.getElementById('nota-numero').value;
    const data_emissao = document.getElementById('nota-data').value;
    const transportadora = document.getElementById('nota-transportadora').value;
    const observacao = document.getElementById('nota-obs').value;
    
    if (!numero_nota || !data_emissao) {
        showMessage('Preencha número da nota e data de emissão!', 'error');
        return;
    }
    
    // Verificar se a nota já existe
    const { data: existente } = await window.supabaseClient
        .from('notas_fiscais')
        .select('id')
        .eq('numero_nota', numero_nota)
        .maybeSingle();
    
    if (existente) {
        showMessage(`❌ Nota Fiscal número ${numero_nota} já existe! Não é possível registrar duplicado.`, 'error');
        return;
    }
    
    const itens = [];
    let valorTotal = 0;
    let temItemBloqueado = false;
    let temItemValido = false;
    
    for (const item of document.querySelectorAll('.item-entrada')) {
        const produtoId = item.querySelector('[id^="prod-id-"]').value;
        const qtdInput = item.querySelector('[id^="qtd-"]');
        const precoInput = item.querySelector('[id^="preco-"]');
        const fabInput = item.querySelector('[id^="fab-"]');
        const valInput = item.querySelector('[id^="val-"]');
        const loteInput = item.querySelector('[id^="lote-"]');
        
        if (!produtoId) continue;
        
        const quantidade = parseFloat(qtdInput?.value) || 0;
        const preco = parseFloat(precoInput?.value) || 0;
        
        if (quantidade <= 0) continue;
        
        temItemValido = true;
        
        if (preco <= 0) {
            showMessage('Produto sem preço de compra cadastrado!', 'error');
            return;
        }
        
        let terco = 1;
        let dataFab = null;
        let dataVal = null;
        let statusValidade = 'normal';
        
        if (fabInput?.value && valInput?.value) {
            dataFab = fabInput.value;
            dataVal = valInput.value;
            const fab = new Date(dataFab);
            const val = new Date(dataVal);
            const hoje = new Date();
            const vidaTotal = (val - fab) / (1000 * 60 * 60 * 24);
            const diasPassados = (hoje - fab) / (1000 * 60 * 60 * 24);
            terco = Math.ceil((diasPassados / vidaTotal) * 3);
            
            if (terco === 3) {
                temItemBloqueado = true;
                showMessage(`🔴 Produto em DATA CRÍTICA (3º Terço)! Não pode ser recebido.`, 'error');
                return;
            }
            statusValidade = terco === 1 ? 'bom' : terco === 2 ? 'alerta' : 'critico';
        }
        
        const subtotal = quantidade * preco;
        valorTotal += subtotal;
        itens.push({
            produto_id: parseInt(produtoId),
            quantidade: quantidade,
            preco_unitario: preco,
            subtotal: subtotal,
            data_fabricacao: dataFab,
            data_validade: dataVal,
            lote: loteInput?.value || null,
            terco_recebimento: terco,
            status_validade: statusValidade
        });
    }
    
    if (temItemBloqueado) return;
    
    if (!temItemValido || itens.length === 0) {
        showMessage('Adicione pelo menos um item válido!', 'error');
        return;
    }
    
    try {
        const { data: nota, error: notaError } = await window.supabaseClient
            .from('notas_fiscais')
            .insert([{ 
                numero_nota, 
                data_emissao, 
                transportadora: transportadora || null, 
                observacao, 
                valor_total: valorTotal 
            }])
            .select();
        
        if (notaError) {
            if (notaError.code === '23505') {
                showMessage(`❌ Nota Fiscal número ${numero_nota} já existe! Não é possível registrar duplicado.`, 'error');
            } else {
                throw notaError;
            }
            return;
        }
        
        const notaId = nota[0].id;
        
        for (const item of itens) {
            await window.supabaseClient
                .from('nota_itens')
                .insert([{
                    nota_id: notaId,
                    produto_id: item.produto_id,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco_unitario,
                    subtotal: item.subtotal,
                    data_fabricacao: item.data_fabricacao,
                    data_validade: item.data_validade,
                    lote: item.lote,
                    terco_recebimento: item.terco_recebimento
                }]);
            
            await window.supabaseClient
                .from('lotes_estoque')
                .insert([{
                    produto_id: item.produto_id,
                    lote: item.lote || `LOTE-${Date.now()}`,
                    data_fabricacao: item.data_fabricacao,
                    data_validade: item.data_validade,
                    quantidade: item.quantidade,
                    quantidade_atual: item.quantidade,
                    preco_custo: item.preco_unitario,
                    terco_recebimento: item.terco_recebimento
                }]);
        }
        
        showMessage('✅ Nota fiscal registrada com sucesso!', 'success');
        document.getElementById('form-nota').reset();
        document.getElementById('itens-nota').innerHTML = '';
        adicionarItemNota();
        
    } catch (error) {
        showMessage('Erro: ' + error.message, 'error');
    }
}