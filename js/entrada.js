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
                display: flex;
                gap: 15px;
                align-items: flex-start;
                flex-wrap: wrap;
            }
            .campo-codigo {
                flex: 2;
                min-width: 200px;
            }
            .campo-codigo input {
                width: 100%;
                padding: 12px;
                border: 2px solid #667eea;
                border-radius: 6px;
                font-size: 14px;
            }
            .campo-qtd, .campo-preco {
                flex: 1;
                min-width: 120px;
            }
            .campo-qtd input, .campo-preco input {
                width: 100%;
                padding: 12px;
                border: 1px solid #ced4da;
                border-radius: 6px;
                font-size: 14px;
            }
            .total {
                min-width: 120px;
                text-align: center;
                font-weight: bold;
                padding: 12px;
                background: #e9ecef;
                border-radius: 6px;
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
            .info-buscando {
                background: #e7f3ff;
                color: #004085;
                border: 1px solid #b8daff;
            }
            .btn-remover {
                background: #dc3545;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 6px;
                cursor: pointer;
            }
            .btn-adicionar {
                background: #28a745;
                color: white;
                border: none;
                padding: 12px 25px;
                border-radius: 6px;
                cursor: pointer;
                margin-top: 10px;
            }
            .instrucao {
                background: #e7f3ff;
                border-left: 4px solid #2196F3;
                padding: 12px 18px;
                margin-bottom: 20px;
                border-radius: 4px;
                font-size: 14px;
            }
        </style>
        
        <h1 style="margin-bottom: 25px;">📥 Entrada de Nota Fiscal</h1>
        
        <div class="instrucao">
            💡 <strong>Como usar:</strong> Digite o CÓDIGO INTERNO do produto e pressione ENTER.<br>
            O nome do produto e o preço serão preenchidos automaticamente.
        </div>
        
        <div class="card">
            <div class="card-header">📄 Dados da Nota Fiscal</div>
            <form id="form-nota">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <div>
                        <label style="font-weight: bold;">Número da Nota *</label>
                        <input type="text" id="nota-numero" required style="width: 100%; padding: 12px; font-size: 14px; border: 2px solid #ced4da; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="font-weight: bold;">Data de Emissão *</label>
                        <input type="date" id="nota-data" required style="width: 100%; padding: 12px; font-size: 14px; border: 2px solid #ced4da; border-radius: 6px;">
                    </div>
                    <div>
                        <label style="font-weight: bold;">Transportadora</label>
                        <input type="text" id="nota-transportadora" placeholder="Nome da transportadora" style="width: 100%; padding: 12px; font-size: 14px; border: 2px solid #ced4da; border-radius: 6px;">
                    </div>
                    <div>
                        <label>Observação</label>
                        <textarea id="nota-obs" rows="2" style="width: 100%; padding: 12px; font-size: 14px; border: 2px solid #ced4da; border-radius: 6px;"></textarea>
                    </div>
                </div>
                
                <div style="margin-top: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin: 0;">🛒 Itens da Nota</h3>
                        <button type="button" onclick="adicionarItemNota()" class="btn-adicionar">
                            + Adicionar Item
                        </button>
                    </div>
                    <div id="itens-nota"></div>
                </div>
                
                <div style="margin-top: 30px; text-align: right;">
                    <button type="submit" style="padding: 14px 35px; font-size: 16px;">Registrar Entrada</button>
                </div>
            </form>
        </div>
        <div id="mensagem"></div>
    `;
    
    adicionarItemNota(); // Adiciona um item vazio inicial
    
    document.getElementById('form-nota').addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarNotaFiscal();
    });
}

async function buscarProdutoPorCodigo(codigo, itemId) {
    if (!codigo || codigo.trim() === '') {
        return;
    }
    
    const infoDiv = document.getElementById(`info-${itemId}`);
    infoDiv.innerHTML = '🔍 Buscando produto...';
    infoDiv.className = 'info-produto info-buscando';
    
    try {
        // Buscar produto pelo código interno
        const { data: produto, error } = await window.supabaseClient
            .from('produtos')
            .select('id, nome, codigo_interno, preco_compra, unidade_medida, estoque_atual')
            .eq('codigo_interno', codigo.toUpperCase().trim())
            .maybeSingle();
        
        if (error) {
            console.error('Erro na busca:', error);
            infoDiv.innerHTML = '❌ Erro ao buscar produto!';
            infoDiv.className = 'info-produto info-erro';
            document.getElementById(`prod-id-${itemId}`).value = '';
            return;
        }
        
        if (!produto) {
            infoDiv.innerHTML = `❌ Produto com código "${codigo}" não encontrado!<br>
                                  <small>Verifique se o produto está cadastrado.</small>`;
            infoDiv.className = 'info-produto info-erro';
            document.getElementById(`prod-id-${itemId}`).value = '';
            document.getElementById(`preco-${itemId}`).value = '';
            return;
        }
        
        // Verificar se o produto tem preço de compra
        if (!produto.preco_compra || produto.preco_compra <= 0) {
            infoDiv.innerHTML = `⚠️ <strong>${produto.nome}</strong><br>
                                  ⚠️ Produto sem preço de compra cadastrado!<br>
                                  <small>Cadastre o preço de compra no produto.</small>`;
            infoDiv.className = 'info-produto info-erro';
            document.getElementById(`prod-id-${itemId}`).value = produto.id;
            document.getElementById(`preco-${itemId}`).value = '';
            return;
        }
        
        // Produto encontrado - preencher automaticamente
        infoDiv.innerHTML = `✅ <strong>${produto.nome}</strong><br>
                              📦 Estoque atual: ${produto.estoque_atual || 0} ${produto.unidade_medida}<br>
                              💰 Preço de compra: ${formatMoney(produto.preco_compra)}`;
        infoDiv.className = 'info-produto info-sucesso';
        
        document.getElementById(`prod-id-${itemId}`).value = produto.id;
        document.getElementById(`preco-${itemId}`).value = produto.preco_compra;
        document.getElementById(`preco-${itemId}`).readOnly = true;
        document.getElementById(`qtd-${itemId}`).value = 1;
        document.getElementById(`qtd-${itemId}`).focus();
        
        calcularSubtotal(itemId);
        
    } catch (error) {
        console.error('Erro:', error);
        infoDiv.innerHTML = '❌ Erro ao buscar produto';
        infoDiv.className = 'info-produto info-erro';
        document.getElementById(`prod-id-${itemId}`).value = '';
    }
}

function adicionarItemNota() {
    const container = document.getElementById('itens-nota');
    const itemId = Date.now();
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-entrada';
    itemDiv.id = `item-${itemId}`;
    itemDiv.innerHTML = `
        <div class="row-itens">
            <div class="campo-codigo">
                <input type="text" 
                       id="codigo-${itemId}" 
                       placeholder="Digite o código interno e pressione ENTER" 
                       autocomplete="off">
                <input type="hidden" id="prod-id-${itemId}">
                <div id="info-${itemId}" class="info-produto"></div>
            </div>
            <div class="campo-qtd">
                <input type="number" 
                       id="qtd-${itemId}" 
                       placeholder="Quantidade" 
                       step="1" 
                       value="1"
                       oninput="calcularSubtotal(${itemId})">
            </div>
            <div class="campo-preco">
                <input type="number" 
                       step="0.01" 
                       id="preco-${itemId}" 
                       placeholder="Preço"
                       readonly
                       style="background: #e9ecef;">
            </div>
            <div class="total">
                <span id="subtotal-${itemId}" style="font-size: 16px;">R$ 0,00</span>
            </div>
            <button type="button" onclick="removerItemNota(${itemId})" class="btn-remover">Remover</button>
        </div>
    `;
    
    container.appendChild(itemDiv);
    
    // Configurar evento do campo código
    const inputCodigo = document.getElementById(`codigo-${itemId}`);
    inputCodigo.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarProdutoPorCodigo(this.value, itemId);
        }
    });
    
    // Configurar evento da quantidade
    const inputQtd = document.getElementById(`qtd-${itemId}`);
    inputQtd.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            adicionarItemNota(); // Adicionar novo item ao pressionar Enter
        }
    });
    
    calcularSubtotal(itemId);
}

function calcularSubtotal(itemId) {
    const qtd = parseFloat(document.getElementById(`qtd-${itemId}`).value) || 0;
    const preco = parseFloat(document.getElementById(`preco-${itemId}`).value) || 0;
    const subtotal = qtd * preco;
    document.getElementById(`subtotal-${itemId}`).innerHTML = formatMoney(subtotal);
}

function removerItemNota(itemId) {
    const item = document.getElementById(`item-${itemId}`);
    if (item) item.remove();
    
    // Se não tiver itens, adiciona um vazio
    if (document.querySelectorAll('.item-entrada').length === 0) {
        adicionarItemNota();
    }
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
    
    // Coletar itens
    const itens = [];
    let valorTotal = 0;
    
    const itensDiv = document.querySelectorAll('.item-entrada');
    for (const item of itensDiv) {
        const produtoId = item.querySelector('[id^="prod-id-"]').value;
        const qtdInput = item.querySelector('[id^="qtd-"]');
        const precoInput = item.querySelector('[id^="preco-"]');
        
        const produto_id = produtoId;
        const quantidade = qtdInput ? parseFloat(qtdInput.value) : 0;
        const preco_unitario = precoInput ? parseFloat(precoInput.value) : 0;
        
        if (produto_id && quantidade > 0 && preco_unitario > 0) {
            const subtotal = quantidade * preco_unitario;
            valorTotal += subtotal;
            itens.push({ 
                produto_id: parseInt(produto_id), 
                quantidade: quantidade, 
                preco_unitario: preco_unitario, 
                subtotal: subtotal 
            });
        }
    }
    
    if (itens.length === 0) {
        showMessage('Adicione pelo menos um item válido à nota!', 'error');
        return;
    }
    
    // Salvar nota fiscal (sem fornecedor, com transportadora)
    const { data: nota, error: notaError } = await window.supabaseClient
        .from('notas_fiscais')
        .insert([{
            numero_nota: numero_nota,
            data_emissao: data_emissao,
            transportadora: transportadora || null,
            observacao: observacao,
            valor_total: valorTotal
        }])
        .select();
    
    if (notaError) {
        showMessage('Erro ao salvar nota: ' + notaError.message, 'error');
        return;
    }
    
    // Salvar itens da nota
    const notaId = nota[0].id;
    const itensComNota = itens.map(item => ({ ...item, nota_id: notaId }));
    
    const { error: itensError } = await window.supabaseClient
        .from('nota_itens')
        .insert(itensComNota);
    
    if (itensError) {
        showMessage('Erro ao salvar itens: ' + itensError.message, 'error');
    } else {
        showMessage('✅ Nota fiscal registrada com sucesso!', 'success');
        // Limpar formulário
        document.getElementById('form-nota').reset();
        document.getElementById('itens-nota').innerHTML = '';
        adicionarItemNota();
    }
}