async function carregarSaida() {
    const main = document.getElementById('conteudo-principal');
    
    main.innerHTML = `
        <style>
            .item-linha {
                background: #f8f9fa;
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 8px;
                border: 1px solid #dee2e6;
            }
            .linha-inputs {
                display: flex;
                gap: 10px;
                align-items: flex-start;
                flex-wrap: wrap;
            }
            .campo-codigo {
                flex: 2;
                min-width: 200px;
            }
            .campo-codigo input {
                width: 100%;
                padding: 10px;
                border: 2px solid #667eea;
                border-radius: 4px;
                font-size: 14px;
            }
            .campo-qtd, .campo-preco {
                flex: 1;
                min-width: 100px;
            }
            .campo-qtd input, .campo-preco input {
                width: 100%;
                padding: 10px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-size: 14px;
            }
            .total {
                min-width: 100px;
                text-align: center;
                font-weight: bold;
                padding: 10px;
                background: #e9ecef;
                border-radius: 4px;
            }
            .info-produto {
                font-size: 12px;
                margin-top: 8px;
                padding: 8px;
                border-radius: 4px;
            }
            .info-sucesso {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .info-erro {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            .info-alerta {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeeba;
            }
            .info-buscando {
                background: #e7f3ff;
                color: #004085;
                border: 1px solid #b8daff;
            }
            .btn-remover {
                background: #dc3545;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 4px;
                cursor: pointer;
            }
            .btn-adicionar {
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            }
            .instrucao {
                background: #e7f3ff;
                border-left: 4px solid #2196F3;
                padding: 10px 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }
        </style>
        
        <h1 style="margin-bottom: 20px;">📤 Saída de Romaneio</h1>
        
        <div class="instrucao">
            💡 <strong>Como usar:</strong> Digite o CÓDIGO INTERNO do produto e pressione ENTER.<br>
            O preço será preenchido automaticamente. Digite a quantidade desejada.
        </div>
        
        <div class="card">
            <div class="card-header">📄 Dados do Romaneio</div>
            <form id="form-romaneio">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div>
                        <label style="font-weight: bold;">Número do Romaneio *</label>
                        <input type="text" id="romaneio-numero" required style="width: 100%; padding: 10px;">
                    </div>
                    <div>
                        <label style="font-weight: bold;">Motorista *</label>
                        <input type="text" id="romaneio-motorista" required style="width: 100%; padding: 10px;">
                    </div>
                    <div>
                        <label>Observação</label>
                        <textarea id="romaneio-obs" rows="2" style="width: 100%; padding: 10px;"></textarea>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h3 style="margin-bottom: 15px;">🛒 Itens do Romaneio</h3>
                    <div id="itens-romaneio"></div>
                    <button type="button" onclick="adicionarItemRomaneio()" class="btn-adicionar">+ Adicionar Item</button>
                </div>
                
                <div style="margin-top: 20px; text-align: right;">
                    <button type="submit" style="padding: 12px 30px; font-size: 16px;">Registrar Saída</button>
                </div>
            </form>
        </div>
        <div id="mensagem"></div>
    `;
    
    adicionarItemRomaneio();
    
    document.getElementById('form-romaneio').addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarRomaneio();
    });
}

async function buscarProdutoSaida(codigo, itemId) {
    if (!codigo || codigo.trim() === '') return;
    
    const infoDiv = document.getElementById(`info-${itemId}`);
    infoDiv.innerHTML = '🔍 Buscando...';
    infoDiv.className = 'info-produto info-buscando';
    
    try {
        const { data: produto, error } = await window.supabaseClient
            .from('produtos')
            .select('id, nome, codigo_interno, preco_venda, unidade_medida, estoque_atual')
            .eq('codigo_interno', codigo.toUpperCase().trim())
            .maybeSingle();
        
        if (error) throw error;
        
        if (!produto) {
            infoDiv.innerHTML = `❌ Produto "${codigo}" não encontrado!`;
            infoDiv.className = 'info-produto info-erro';
            document.getElementById(`prod-id-${itemId}`).value = '';
            return;
        }
        
        if (!produto.preco_venda || produto.preco_venda <= 0) {
            infoDiv.innerHTML = `⚠️ ${produto.nome} - SEM PREÇO DE VENDA!<br><small>Cadastre o preço de venda no produto.</small>`;
            infoDiv.className = 'info-produto info-alerta';
            document.getElementById(`prod-id-${itemId}`).value = produto.id;
            document.getElementById(`preco-${itemId}`).value = '';
            return;
        }
        
        if (produto.estoque_atual <= 0) {
            infoDiv.innerHTML = `⚠️ ${produto.nome} - SEM ESTOQUE!`;
            infoDiv.className = 'info-produto info-alerta';
            document.getElementById(`prod-id-${itemId}`).value = produto.id;
            document.getElementById(`preco-${itemId}`).value = produto.preco_venda;
            return;
        }
        
        infoDiv.innerHTML = `✅ ${produto.nome} | Estoque: ${produto.estoque_atual} ${produto.unidade_medida} | Preço: ${formatMoney(produto.preco_venda)}`;
        infoDiv.className = 'info-produto info-sucesso';
        
        document.getElementById(`prod-id-${itemId}`).value = produto.id;
        document.getElementById(`preco-${itemId}`).value = produto.preco_venda;
        document.getElementById(`qtd-${itemId}`).value = '';
        document.getElementById(`qtd-${itemId}`).disabled = false;
        document.getElementById(`qtd-${itemId}`).focus();
        
    } catch (error) {
        infoDiv.innerHTML = '❌ Erro na busca';
        infoDiv.className = 'info-produto info-erro';
    }
}

function adicionarItemRomaneio() {
    const container = document.getElementById('itens-romaneio');
    const itemId = Date.now();
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-linha';
    itemDiv.id = `item-${itemId}`;
    itemDiv.innerHTML = `
        <div class="linha-inputs">
            <div class="campo-codigo">
                <input type="text" id="codigo-${itemId}" placeholder="Código interno" autocomplete="off">
                <input type="hidden" id="prod-id-${itemId}">
                <div id="info-${itemId}" class="info-produto"></div>
            </div>
            <div class="campo-qtd">
                <input type="number" id="qtd-${itemId}" placeholder="Quantidade" step="1" min="1" oninput="validarQuantidadeSaida(${itemId})">
                <div id="qtd-msg-${itemId}" style="font-size: 11px; color: red;"></div>
            </div>
            <div class="campo-preco">
                <input type="number" step="0.01" id="preco-${itemId}" placeholder="Preço" readonly style="background: #e9ecef;">
            </div>
            <div class="total">
                <span id="subtotal-${itemId}">R$ 0,00</span>
            </div>
            <button type="button" onclick="removerItemSaida(${itemId})" class="btn-remover">Remover</button>
        </div>
    `;
    
    container.appendChild(itemDiv);
    
    const inputCodigo = document.getElementById(`codigo-${itemId}`);
    inputCodigo.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarProdutoSaida(this.value, itemId);
        }
    });
    
    const inputQtd = document.getElementById(`qtd-${itemId}`);
    inputQtd.addEventListener('input', () => calcularSubtotalSaida(itemId));
}

function calcularSubtotalSaida(itemId) {
    const qtd = parseFloat(document.getElementById(`qtd-${itemId}`).value) || 0;
    const preco = parseFloat(document.getElementById(`preco-${itemId}`).value) || 0;
    document.getElementById(`subtotal-${itemId}`).innerHTML = formatMoney(qtd * preco);
}

async function validarQuantidadeSaida(itemId) {
    let qtd = parseFloat(document.getElementById(`qtd-${itemId}`).value) || 0;
    const produtoId = document.getElementById(`prod-id-${itemId}`).value;
    const msgDiv = document.getElementById(`qtd-msg-${itemId}`);
    
    if (!produtoId) {
        msgDiv.innerHTML = '⚠️ Selecione um produto primeiro!';
        return;
    }
    
    if (isNaN(qtd) || qtd === '') return;
    
    const { data: produto } = await window.supabaseClient
        .from('produtos')
        .select('estoque_atual')
        .eq('id', produtoId)
        .maybeSingle();
    
    if (produto && qtd > produto.estoque_atual) {
        msgDiv.innerHTML = `⚠️ Estoque insuficiente! Máximo: ${produto.estoque_atual}`;
        document.getElementById(`qtd-${itemId}`).value = produto.estoque_atual;
        calcularSubtotalSaida(itemId);
    } else if (qtd < 0) {
        msgDiv.innerHTML = '⚠️ Quantidade não pode ser negativa!';
        document.getElementById(`qtd-${itemId}`).value = 0;
        calcularSubtotalSaida(itemId);
    } else {
        msgDiv.innerHTML = '';
        calcularSubtotalSaida(itemId);
    }
}

function removerItemSaida(itemId) {
    const item = document.getElementById(`item-${itemId}`);
    if (item) item.remove();
    if (document.querySelectorAll('.item-linha').length === 0) adicionarItemRomaneio();
}

async function salvarRomaneio() {
    const numero_romaneio = document.getElementById('romaneio-numero').value;
    const motorista = document.getElementById('romaneio-motorista').value;
    const observacao = document.getElementById('romaneio-obs').value;
    
    if (!numero_romaneio || !motorista) {
        showMessage('Preencha número do romaneio e motorista!', 'error');
        return;
    }
    
    const itens = [];
    let valorTotal = 0;
    
    for (const item of document.querySelectorAll('.item-linha')) {
        const produtoId = item.querySelector('[id^="prod-id-"]').value;
        const qtdInput = item.querySelector('[id^="qtd-"]');
        const precoInput = item.querySelector('[id^="preco-"]');
        
        if (!produtoId) continue;
        
        const quantidade = parseInt(qtdInput?.value) || 0;
        const preco = parseFloat(precoInput?.value) || 0;
        
        if (quantidade <= 0) {
            showMessage('Quantidade deve ser maior que zero!', 'error');
            return;
        }
        
        if (preco <= 0) {
            showMessage('Produto sem preço de venda cadastrado!', 'error');
            return;
        }
        
        const { data: produto } = await window.supabaseClient
            .from('produtos')
            .select('estoque_atual')
            .eq('id', produtoId)
            .single();
        
        if (!produto || quantidade > produto.estoque_atual) {
            showMessage(`Estoque insuficiente! Disponível: ${produto?.estoque_atual || 0}`, 'error');
            return;
        }
        
        const subtotal = quantidade * preco;
        valorTotal += subtotal;
        itens.push({ produto_id: parseInt(produtoId), quantidade, preco_unitario: preco, subtotal });
    }
    
    if (itens.length === 0) {
        showMessage('Adicione pelo menos um item!', 'error');
        return;
    }
    
    try {
        const { data: romaneio, error: romaneioError } = await window.supabaseClient
            .from('romaneios')
            .insert([{ 
                numero_romaneio, 
                motorista, 
                observacao, 
                valor_total: valorTotal 
            }])
            .select();
        
        if (romaneioError) throw romaneioError;
        
        const romaneioId = romaneio[0].id;
        const itensComRomaneio = itens.map(item => ({ 
            romaneio_id: romaneioId,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
            subtotal: item.subtotal
        }));
        
        const { error: itensError } = await window.supabaseClient
            .from('romaneio_itens')
            .insert(itensComRomaneio);
        
        if (itensError) throw itensError;
        
        showMessage('✅ Romaneio registrado com sucesso!', 'success');
        document.getElementById('form-romaneio').reset();
        document.getElementById('itens-romaneio').innerHTML = '';
        adicionarItemRomaneio();
        
    } catch (error) {
        console.error('Erro:', error);
        showMessage('Erro: ' + error.message, 'error');
    }
}