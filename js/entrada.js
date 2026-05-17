let itensNota = [];

async function carregarEntrada() {
    const main = document.getElementById('conteudo-principal');
    
    main.innerHTML = `
        <style>
            .item-entrada {
                background: #f8f9fa;
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 8px;
                border: 1px solid #dee2e6;
            }
            .row-itens {
                display: grid;
                grid-template-columns: 1.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.5fr;
                gap: 10px;
                align-items: center;
            }
            .campo-codigo input, .campo-qtd input, .campo-preco input, 
            .campo-fab input, .campo-val input {
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
            .btn-remover { background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
            .btn-adicionar { background: #28a745; color: white; border: none; padding: 8px 15px; cursor: pointer; margin-top: 10px; border-radius: 4px; }
            .terco-1 { border-left: 4px solid #28a745; }
            .terco-2 { border-left: 4px solid #ffc107; }
            .terco-3 { border-left: 4px solid #dc3545; }
            .instrucao { background: #e7f3ff; padding: 10px; margin-bottom: 20px; border-radius: 4px; font-size: 13px; }
            .botoes-acao { display: flex; justify-content: flex-end; gap: 15px; margin-top: 20px; }
            .btn-limpar { background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
            .btn-registrar { background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
            .validacao-nota { font-size: 12px; margin-top: 5px; }
            @media (max-width: 900px) {
                .row-itens { grid-template-columns: 1fr; gap: 8px; }
            }
        </style>
        
        <h1 style="margin-bottom: 20px;">📥 Entrada de Nota Fiscal</h1>
        
        <div class="instrucao">
            💡 <strong>Controle de Validade:</strong> Preencha a data de FABRICAÇÃO e VALIDADE para ativar o controle de 3 Terços.<br>
            • 🟢 1º Terço: Produto dentro da validade - PODE RECEBER<br>
            • 🟡 2º Terço: Produto com alerta - PODE RECEBER COM ATENÇÃO<br>
            • 🔴 3º Terço: Produto NÃO PODE SER RECEBIDO (bloqueado)
        </div>
        
        <div class="card">
            <div class="card-header">📄 Dados da Nota Fiscal</div>
            <form id="form-nota">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><label>Número da Nota *</label><input type="text" id="nota-numero" required style="width:100%;padding:8px;"><div id="nota-validacao" class="validacao-nota"></div></div>
                    <div><label>Data de Emissão *</label><input type="date" id="nota-data" required style="width:100%;padding:8px;"></div>
                    <div><label>Transportadora</label><input type="text" id="nota-transportadora" style="width:100%;padding:8px;"></div>
                    <div><label>Observação</label><textarea id="nota-obs" rows="2" style="width:100%;padding:8px;"></textarea></div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h3>🛒 Itens da Nota</h3>
                    <div id="itens-nota"></div>
                    <button type="button" onclick="adicionarItemNota()" class="btn-adicionar">+ Adicionar Item</button>
                </div>
                
                <div class="botoes-acao">
                    <button type="button" onclick="limparFormulario()" class="btn-limpar">Limpar</button>
                    <button type="submit" class="btn-registrar">Registrar Entrada</button>
                </div>
            </form>
        </div>
        <div id="mensagem"></div>
    `;
    
    adicionarItemNota();
    
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
                divValidacao.innerHTML = '<span style="color: #dc3545;">⚠️ Número já utilizado!</span>';
            } else {
                divValidacao.innerHTML = '<span style="color: #28a745;">✅ Número disponível</span>';
            }
        }
    });
    
    document.getElementById('form-nota').addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarNotaFiscal();
    });
}

function limparFormulario() {
    document.getElementById('form-nota').reset();
    const container = document.getElementById('itens-nota');
    if (container) {
        container.innerHTML = '';
        adicionarItemNota();
    }
    const validacao = document.getElementById('nota-validacao');
    if (validacao) validacao.innerHTML = '';
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
            <div><input type="number" id="qtd-${itemId}" placeholder="Qtd" step="0.001" value="1" min="0" style="width:100%;"></div>
            <div><input type="number" step="0.01" id="preco-${itemId}" placeholder="Preço" readonly style="background:#e9ecef;width:100%;"></div>
            <div><input type="date" id="fab-${itemId}" placeholder="Fabricação" onchange="validarValidade(${itemId})" style="width:100%;"></div>
            <div><input type="date" id="val-${itemId}" placeholder="Validade" onchange="validarValidade(${itemId})" style="width:100%;"></div>
            <div><button type="button" onclick="removerItemNota(${itemId})" class="btn-remover">Remover</button></div>
        </div>
    `;
    
    container.appendChild(itemDiv);
    
    const inputCodigo = document.getElementById(`codigo-${itemId}`);
    inputCodigo.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            await buscarProduto(itemId);
        }
    });
}

async function buscarProduto(itemId) {
    const codigo = document.getElementById(`codigo-${itemId}`).value;
    if (!codigo) return;
    
    const infoDiv = document.getElementById(`info-${itemId}`);
    infoDiv.innerHTML = '🔍 Buscando...';
    infoDiv.className = 'info-produto info-buscando';
    
    try {
        const { data: produto, error } = await window.supabaseClient
            .from('produtos')
            .select('id, nome, preco_compra, controla_validade')
            .eq('codigo_interno', codigo.toUpperCase().trim())
            .maybeSingle();
        
        if (error) throw error;
        
        if (!produto) {
            infoDiv.innerHTML = '❌ Produto não encontrado!';
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
        
        document.getElementById(`qtd-${itemId}`).focus();
        
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
        infoDiv.innerHTML = '❌ Fabricação deve ser anterior à validade!';
        infoDiv.className = 'info-produto';
        return;
    }
    
    if (val < hoje) {
        infoDiv.innerHTML = '❌ Produto VENCIDO! Não pode ser recebido.';
        infoDiv.className = 'info-produto';
        itemDiv.classList.add('terco-3');
        document.getElementById(`qtd-${itemId}`).disabled = true;
        document.getElementById(`qtd-${itemId}`).value = 0;
        return;
    }
    
    const vidaTotal = (val - fab) / (1000 * 60 * 60 * 24);
    const diasPassados = (hoje - fab) / (1000 * 60 * 60 * 24);
    const terco = Math.ceil((diasPassados / vidaTotal) * 3);
    const diasRestantes = Math.ceil((val - hoje) / (1000 * 60 * 60 * 24));
    
    itemDiv.classList.remove('terco-1', 'terco-2', 'terco-3');
    
    if (terco === 1) {
        itemDiv.classList.add('terco-1');
        infoDiv.innerHTML = `🟢 1º TERÇO - Produto dentro da validade. PODE RECEBER. Dias restantes: ${diasRestantes}`;
        infoDiv.className = 'info-produto info-sucesso';
        document.getElementById(`qtd-${itemId}`).disabled = false;
    } else if (terco === 2) {
        itemDiv.classList.add('terco-2');
        infoDiv.innerHTML = `🟡 2º TERÇO - ALERTA! Produto com validade próxima. PODE RECEBER COM ATENÇÃO. Dias restantes: ${diasRestantes}`;
        infoDiv.className = 'info-produto info-alerta';
        document.getElementById(`qtd-${itemId}`).disabled = false;
    } else {
        itemDiv.classList.add('terco-3');
        infoDiv.innerHTML = `🔴 3º TERÇO - DATA CRÍTICA! Produto NÃO PODE SER RECEBIDO! Dias restantes: ${diasRestantes}`;
        infoDiv.className = 'info-produto info-critico';
        document.getElementById(`qtd-${itemId}`).disabled = true;
        document.getElementById(`qtd-${itemId}`).value = 0;
    }
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
    
    // Verificar duplicidade
    const { data: existente } = await window.supabaseClient
        .from('notas_fiscais')
        .select('id')
        .eq('numero_nota', numero_nota)
        .maybeSingle();
    
    if (existente) {
        showMessage(`❌ Nota Fiscal ${numero_nota} já existe!`, 'error');
        return;
    }
    
    // Coletar itens válidos
    const itens = [];
    let valorTotal = 0;
    let temItemBloqueado = false;
    
    for (const item of document.querySelectorAll('.item-entrada')) {
        const produtoId = item.querySelector('[id^="prod-id-"]').value;
        const qtdInput = item.querySelector('[id^="qtd-"]');
        const precoInput = item.querySelector('[id^="preco-"]');
        const fabInput = item.querySelector('[id^="fab-"]');
        const valInput = item.querySelector('[id^="val-"]');
        
        if (!produtoId) continue;
        
        const quantidade = parseFloat(qtdInput?.value) || 0;
        const preco = parseFloat(precoInput?.value) || 0;
        
        if (quantidade <= 0) continue;
        
        if (preco <= 0) {
            showMessage('Produto sem preço de compra cadastrado!', 'error');
            return;
        }
        
        let dataFab = null;
        let dataVal = null;
        let terco = 1;
        
        if (fabInput?.value && valInput?.value) {
            dataFab = fabInput.value;
            dataVal = valInput.value;
            const fab = new Date(dataFab);
            const val = new Date(dataVal);
            const hoje = new Date();
            
            if (val < hoje) {
                showMessage(`❌ Produto VENCIDO! Não pode ser recebido.`, 'error');
                return;
            }
            
            const vidaTotal = (val - fab) / (1000 * 60 * 60 * 24);
            const diasPassados = (hoje - fab) / (1000 * 60 * 60 * 24);
            terco = Math.ceil((diasPassados / vidaTotal) * 3);
            
            if (terco === 3) {
                temItemBloqueado = true;
                showMessage(`🔴 Produto em DATA CRÍTICA (3º Terço)! Não pode ser recebido.`, 'error');
                return;
            }
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
            terco_recebimento: terco
        });
    }
    
    if (temItemBloqueado) return;
    
    if (itens.length === 0) {
        showMessage('Adicione pelo menos um item válido!', 'error');
        return;
    }
    
    try {
        // Salvar nota fiscal
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
        
        if (notaError) throw notaError;
        
        const notaId = nota[0].id;
        
        // Processar cada item
        for (const item of itens) {
            // Inserir item da nota
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
                    terco_recebimento: item.terco_recebimento
                }]);
            
            // Buscar o ÚLTIMO SALDO (estoque atual real)
            const { data: ultimaMov } = await window.supabaseClient
                .from('movimentacoes')
                .select('saldo_apos')
                .eq('produto_id', item.produto_id)
                .order('data_movimento', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            const ultimoSaldo = ultimaMov?.saldo_apos || 0;
            const novoEstoque = ultimoSaldo + item.quantidade;
            
            // Atualizar estoque do produto
            await window.supabaseClient
                .from('produtos')
                .update({ estoque_atual: novoEstoque })
                .eq('id', item.produto_id);
            
            // Registrar movimentação
            await window.supabaseClient
                .from('movimentacoes')
                .insert({
                    produto_id: item.produto_id,
                    tipo: 'entrada',
                    documento_tipo: 'nota_fiscal',
                    documento_id: notaId,
                    quantidade: item.quantidade,
                    saldo_apos: novoEstoque,
                    observacao: `Entrada NF ${numero_nota}`
                });
        }
        
        showMessage('✅ Nota fiscal registrada com sucesso!', 'success');
        
        // Limpar formulário
        document.getElementById('form-nota').reset();
        document.getElementById('itens-nota').innerHTML = '';
        adicionarItemNota();
        
    } catch (error) {
        console.error('Erro:', error);
        showMessage('Erro ao salvar: ' + error.message, 'error');
    }
}
