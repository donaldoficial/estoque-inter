// Função para arredondar decimais
function arredondar(valor) {
    return Math.round(valor * 1000) / 1000;
}

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
                flex-wrap: wrap;
                align-items: flex-start;
            }
            .campo-codigo { flex: 2; min-width: 180px; }
            .campo-qtd { flex: 1; min-width: 100px; }
            .campo-preco { flex: 1; min-width: 100px; }
            .info-produto {
                font-size: 11px;
                margin-top: 5px;
                padding: 5px;
                border-radius: 4px;
            }
            .info-sucesso { background: #d4edda; color: #155724; }
            .info-alerta { background: #fff3cd; color: #856404; }
            .info-erro { background: #f8d7da; color: #721c24; }
            .btn-remover { background: #dc3545; color: white; border: none; cursor: pointer; padding: 8px 15px; border-radius: 4px; }
            .btn-adicionar { background: #28a745; color: white; border: none; cursor: pointer; margin-top: 10px; padding: 8px 15px; border-radius: 4px; }
            .botoes-acao { display: flex; justify-content: flex-end; gap: 15px; margin-top: 20px; }
            .btn-limpar { background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
            .btn-registrar { background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
            .instrucao { background: #e7f3ff; padding: 10px; margin-bottom: 20px; border-radius: 4px; }
        </style>
        
        <h1 style="margin-bottom: 20px;">📤 Saída de Romaneio</h1>
        
        <div class="instrucao">
            💡 Digite o código do produto e pressione ENTER. O sistema mostra o estoque atual.<br>
            📦 <strong>Para KG (peso):</strong> Use decimais (1.5, 2.58)<br>
            📦 <strong>Para UN (unidade):</strong> Use números inteiros (1, 2, 3)
        </div>
        
        <div class="card">
            <div class="card-header">📄 Dados do Romaneio</div>
            <form id="form-romaneio">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                    <div><label>Número do Romaneio *</label><input type="text" id="romaneio-numero" required style="width:100%;padding:8px;"></div>
                    <div><label>Motorista *</label><input type="text" id="romaneio-motorista" required style="width:100%;padding:8px;"></div>
                    <div><label>Observação</label><textarea id="romaneio-obs" rows="2" style="width:100%;padding:8px;"></textarea></div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h3>🛒 Itens do Romaneio</h3>
                    <div id="itens-romaneio"></div>
                    <button type="button" onclick="adicionarItemRomaneio()" class="btn-adicionar">+ Adicionar Item</button>
                </div>
                
                <div class="botoes-acao">
                    <button type="button" onclick="limparFormularioSaida()" class="btn-limpar">Limpar</button>
                    <button type="submit" class="btn-registrar">Registrar Saída</button>
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

function limparFormularioSaida() {
    if (confirm('Limpar todos os campos?')) {
        document.getElementById('form-romaneio').reset();
        document.getElementById('itens-romaneio').innerHTML = '';
        adicionarItemRomaneio();
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
                <input type="text" id="codigo-${itemId}" placeholder="Código interno" autocomplete="off" style="width:100%;padding:8px;">
                <input type="hidden" id="prod-id-${itemId}">
                <div id="info-${itemId}" class="info-produto"></div>
            </div>
            <div class="campo-qtd"><input type="number" id="qtd-${itemId}" placeholder="Quantidade" step="0.001" value="1" min="0" style="width:100%;padding:8px;"></div>
            <div class="campo-preco"><input type="number" step="0.01" id="preco-${itemId}" placeholder="Preço" readonly style="background:#e9ecef;width:100%;padding:8px;"></div>
            <button type="button" onclick="removerItemSaida(${itemId})" class="btn-remover">Remover</button>
        </div>
    `;
    
    container.appendChild(itemDiv);
    
    const inputCodigo = document.getElementById(`codigo-${itemId}`);
    inputCodigo.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            await buscarProdutoSaida(itemId);
        }
    });
}

async function buscarProdutoSaida(itemId) {
    const codigo = document.getElementById(`codigo-${itemId}`).value;
    if (!codigo) return;
    
    const infoDiv = document.getElementById(`info-${itemId}`);
    infoDiv.innerHTML = '🔍 Buscando...';
    infoDiv.className = 'info-produto';
    
    try {
        const { data: produto } = await window.supabaseClient
            .from('produtos')
            .select('id, nome, preco_venda, unidade_medida')
            .eq('codigo_interno', codigo.toUpperCase().trim())
            .maybeSingle();
        
        if (!produto) {
            infoDiv.innerHTML = '❌ Produto não encontrado!';
            infoDiv.className = 'info-produto info-erro';
            return;
        }
        
        const { data: ultimaMov } = await window.supabaseClient
            .from('movimentacoes')
            .select('saldo_apos')
            .eq('produto_id', produto.id)
            .order('data_movimento', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        const estoqueAtual = ultimaMov?.saldo_apos || 0;
        
        document.getElementById(`prod-id-${itemId}`).value = produto.id;
        document.getElementById(`preco-${itemId}`).value = produto.preco_venda || 0;
        
        let unidadeTexto = produto.unidade_medida || 'UN';
        let tipoTexto = unidadeTexto === 'KG' ? ' (use decimais)' : ' (use números inteiros)';
        
        if (estoqueAtual <= 0) {
            infoDiv.innerHTML = `⚠️ ${produto.nome} - SEM ESTOQUE! (0 ${unidadeTexto} disponível)`;
            infoDiv.className = 'info-produto info-alerta';
        } else {
            infoDiv.innerHTML = `✅ ${produto.nome} | Estoque: ${estoqueAtual} ${unidadeTexto} | Preço: ${formatMoney(produto.preco_venda)}${tipoTexto}`;
            infoDiv.className = 'info-produto info-sucesso';
            document.getElementById(`qtd-${itemId}`).focus();
        }
        
    } catch (error) {
        console.error('Erro:', error);
        infoDiv.innerHTML = '❌ Erro na busca';
        infoDiv.className = 'info-produto info-erro';
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
    
    const { data: existente } = await window.supabaseClient
        .from('romaneios')
        .select('id')
        .eq('numero_romaneio', numero_romaneio)
        .maybeSingle();
    
    if (existente) {
        showMessage(`❌ Romaneio ${numero_romaneio} já existe!`, 'error');
        return;
    }
    
    const itens = [];
    let valorTotal = 0;
    
    for (const item of document.querySelectorAll('.item-linha')) {
        const produtoId = item.querySelector('[id^="prod-id-"]').value;
        const qtdInput = item.querySelector('[id^="qtd-"]');
        const precoInput = item.querySelector('[id^="preco-"]');
        
        if (!produtoId) continue;
        
        // Buscar unidade do produto
        const { data: produtoInfo } = await window.supabaseClient
            .from('produtos')
            .select('unidade_medida, nome')
            .eq('id', parseInt(produtoId))
            .single();
        
        let quantidadeStr = qtdInput?.value;
        if (quantidadeStr) {
            quantidadeStr = quantidadeStr.toString().replace(',', '.');
        }
        let quantidade = parseFloat(quantidadeStr) || 0;
        
        // SE FOR UNIDADE (UN), FORÇA NÚMERO INTEIRO
        if (produtoInfo && produtoInfo.unidade_medida === 'UN') {
            quantidade = Math.round(quantidade);
            if (quantidade <= 0) continue;
        } else {
            // Para KG, LT, MT - mantém decimal
            if (quantidade <= 0) continue;
        }
        
        const preco = parseFloat(precoInput?.value) || 0;
        
        if (preco <= 0) {
            showMessage(`Produto ${produtoInfo?.nome || ''} sem preço de venda!`, 'error');
            return;
        }
        
        const { data: ultimaMov } = await window.supabaseClient
            .from('movimentacoes')
            .select('saldo_apos')
            .eq('produto_id', parseInt(produtoId))
            .order('data_movimento', { ascending: false })
            .limit(1)
            .maybeSingle();
        
        const estoqueAtual = ultimaMov?.saldo_apos || 0;
        const nomeProduto = produtoInfo?.nome || 'Produto';
        
        if (quantidade > estoqueAtual) {
            showMessage(`❌ Estoque insuficiente para ${nomeProduto}! Disponível: ${estoqueAtual}`, 'error');
            return;
        }
        
        itens.push({
            produto_id: parseInt(produtoId),
            quantidade: quantidade,
            preco_unitario: preco,
            subtotal: quantidade * preco,
            estoque_atual: estoqueAtual
        });
        valorTotal += quantidade * preco;
    }
    
    if (itens.length === 0) {
        showMessage('Adicione pelo menos um item válido!', 'error');
        return;
    }
    
    try {
        const { data: romaneio, error: romaneioError } = await window.supabaseClient
            .from('romaneios')
            .insert([{ numero_romaneio, motorista, observacao, valor_total: valorTotal }])
            .select();
        
        if (romaneioError) throw romaneioError;
        
        const romaneioId = romaneio[0].id;
        
        for (const item of itens) {
            await window.supabaseClient
                .from('romaneio_itens')
                .insert([{
                    romaneio_id: romaneioId,
                    produto_id: item.produto_id,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco_unitario,
                    subtotal: item.subtotal
                }]);
            
            let quantidadeRestante = item.quantidade;
            
            const { data: entradas } = await window.supabaseClient
                .from('nota_itens')
                .select('*')
                .eq('produto_id', item.produto_id)
                .gt('quantidade', 0)
                .order('created_at', { ascending: true });
            
            for (const entrada of entradas || []) {
                if (quantidadeRestante <= 0) break;
                
                const quantidadeEntrada = entrada.quantidade;
                let novaQuantidadeEntrada;
                
                if (quantidadeEntrada >= quantidadeRestante) {
                    novaQuantidadeEntrada = quantidadeEntrada - quantidadeRestante;
                    quantidadeRestante = 0;
                } else {
                    novaQuantidadeEntrada = 0;
                    quantidadeRestante -= quantidadeEntrada;
                }
                
                await window.supabaseClient
                    .from('nota_itens')
                    .update({ quantidade: novaQuantidadeEntrada })
                    .eq('id', entrada.id);
            }
            
            const novoEstoque = item.estoque_atual - item.quantidade;
            
            await window.supabaseClient
                .from('produtos')
                .update({ estoque_atual: novoEstoque })
                .eq('id', item.produto_id);
            
            await window.supabaseClient
                .from('movimentacoes')
                .insert({
                    produto_id: item.produto_id,
                    tipo: 'saida',
                    documento_tipo: 'romaneio',
                    documento_id: romaneioId,
                    quantidade: item.quantidade,
                    saldo_apos: novoEstoque,
                    observacao: `Saída Romaneio ${numero_romaneio}`
                });
        }
        
        showMessage('✅ Romaneio registrado com sucesso!', 'success');
        document.getElementById('form-romaneio').reset();
        document.getElementById('itens-romaneio').innerHTML = '';
        adicionarItemRomaneio();
        
    } catch (error) {
        console.error('Erro:', error);
        showMessage('Erro: ' + error.message, 'error');
    }
}
