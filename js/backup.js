// Função para abrir o modal de backup
function abrirModalBackup() {
    const modal = document.getElementById('modal-backup');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        criarModalBackup();
    }
}

function fecharModalBackup() {
    const modal = document.getElementById('modal-backup');
    if (modal) {
        modal.style.display = 'none';
    }
}

function criarModalBackup() {
    const modalHTML = `
        <div id="modal-backup" class="modal-backup" style="display: none;">
            <div class="modal-backup-content">
                <div class="modal-header">
                    💾 Backup e Restauração de Dados
                    <span onclick="fecharModalBackup()" style="float: right; cursor: pointer; font-size: 24px;">&times;</span>
                </div>
                <div class="opcoes-backup">
                    <div class="btn-opcao" onclick="fazerBackupCompleto()">
                        <div class="titulo">📤 Exportar Backup Completo</div>
                        <div class="descricao">Exporta todos os dados do sistema em um arquivo JSON</div>
                    </div>
                    <div class="btn-opcao" onclick="abrirModalRestaurar()">
                        <div class="titulo">📥 Importar Backup (Restaurar)</div>
                        <div class="descricao">Restaura os dados a partir de um arquivo JSON (substitui todos os dados)</div>
                    </div>
                    <div class="btn-opcao" onclick="fazerBackupTabelaEspecifica()">
                        <div class="titulo">📋 Backup de Tabela Específica</div>
                        <div class="descricao">Exporta apenas uma tabela específica</div>
                    </div>
                </div>
                <div id="backup-status" style="margin-top: 20px; font-size: 14px;"></div>
            </div>
        </div>
    `;
    
    // Adicionar modal ao body
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);
    
    // Adicionar estilos do modal
    const style = document.createElement('style');
    style.textContent = `
        .modal-backup {
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
        .modal-backup-content {
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        .modal-header {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
        }
        .opcoes-backup {
            display: grid;
            gap: 15px;
            margin: 20px 0;
        }
        .btn-opcao {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            padding: 15px;
            text-align: left;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.3s;
        }
        .btn-opcao:hover {
            border-color: #17a2b8;
            background: #e7f3ff;
        }
        .btn-opcao .titulo {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
        }
        .btn-opcao .descricao {
            font-size: 12px;
            color: #666;
        }
        .loading-backup {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #17a2b8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .progresso-backup {
            margin-top: 15px;
            padding: 10px;
            background: #e9ecef;
            border-radius: 8px;
        }
        .progresso-bar {
            height: 20px;
            background: #28a745;
            border-radius: 10px;
            transition: width 0.3s;
        }
    `;
    document.head.appendChild(style);
}

async function fazerBackupCompleto() {
    const statusDiv = document.getElementById('backup-status');
    statusDiv.innerHTML = '<div class="loading-backup"></div> Buscando dados do banco...';
    
    try {
        // Lista de todas as tabelas
        const tabelas = [
            { nome: 'fornecedores', ordem: 1 },
            { nome: 'produtos', ordem: 2 },
            { nome: 'notas_fiscais', ordem: 3 },
            { nome: 'nota_itens', ordem: 4 },
            { nome: 'romaneios', ordem: 5 },
            { nome: 'romaneio_itens', ordem: 6 },
            { nome: 'movimentacoes', ordem: 7 }
        ];
        
        const backup = {
            data_backup: new Date().toISOString(),
            versao_sistema: '1.0',
            tipo: 'backup_completo',
            dados: {}
        };
        
        let totalItens = 0;
        
        for (const tabela of tabelas) {
            statusDiv.innerHTML = `<div class="loading-backup"></div> Exportando ${tabela.nome}...`;
            
            const { data, error } = await window.supabaseClient
                .from(tabela.nome)
                .select('*')
                .order('id', { ascending: true });
            
            if (error) throw error;
            
            backup.dados[tabela.nome] = data || [];
            totalItens += (data?.length || 0);
        }
        
        // Adicionar informações de resumo
        backup.resumo = {
            total_registros: totalItens,
            data_backup: new Date().toISOString(),
            tabelas_exportadas: tabelas.map(t => t.nome)
        };
        
        // Criar arquivo para download
        const dataStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_completo_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        statusDiv.innerHTML = `
            <div style="color: green; padding: 10px; background: #d4edda; border-radius: 8px;">
                ✅ Backup concluído com sucesso!<br>
                📊 Total de registros: ${totalItens}<br>
                📁 Arquivo baixado automaticamente
            </div>
        `;
        
        setTimeout(() => {
            statusDiv.innerHTML = '';
            fecharModalBackup();
        }, 3000);
        
    } catch (error) {
        console.error('Erro no backup:', error);
        statusDiv.innerHTML = `
            <div style="color: red; padding: 10px; background: #f8d7da; border-radius: 8px;">
                ❌ Erro ao fazer backup: ${error.message}
            </div>
        `;
    }
}

async function fazerBackupTabelaEspecifica() {
    const tabelas = ['fornecedores', 'produtos', 'notas_fiscais', 'nota_itens', 'romaneios', 'romaneio_itens', 'movimentacoes'];
    
    const selecao = prompt(`Selecione a tabela para backup:\n${tabelas.map((t, i) => `${i+1} - ${t}`).join('\n')}\n\nDigite o número da tabela:`);
    
    if (!selecao) return;
    
    const index = parseInt(selecao) - 1;
    if (index < 0 || index >= tabelas.length) {
        alert('Opção inválida!');
        return;
    }
    
    const tabelaNome = tabelas[index];
    const statusDiv = document.getElementById('backup-status');
    statusDiv.innerHTML = `<div class="loading-backup"></div> Exportando ${tabelaNome}...`;
    
    try {
        const { data, error } = await window.supabaseClient
            .from(tabelaNome)
            .select('*');
        
        if (error) throw error;
        
        const backup = {
            data_backup: new Date().toISOString(),
            tabela: tabelaNome,
            dados: data || []
        };
        
        const dataStr = JSON.stringify(backup, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${tabelaNome}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        statusDiv.innerHTML = `
            <div style="color: green; padding: 10px; background: #d4edda; border-radius: 8px;">
                ✅ Backup da tabela ${tabelaNome} concluído!<br>
                📊 Total de registros: ${data?.length || 0}
            </div>
        `;
        
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
        
    } catch (error) {
        statusDiv.innerHTML = `
            <div style="color: red; padding: 10px; background: #f8d7da; border-radius: 8px;">
                ❌ Erro: ${error.message}
            </div>
        `;
    }
}

function abrirModalRestaurar() {
    const modal = document.getElementById('modal-backup');
    if (modal) modal.style.display = 'none';
    
    // Criar input de arquivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => restaurarBackup(e.target.files[0]);
    input.click();
}

async function restaurarBackup(arquivo) {
    if (!arquivo) return;
    
    const confirmar = confirm(
        '⚠️ ATENÇÃO! ⚠️\n\n' +
        'Isso irá SUBSTITUIR COMPLETAMENTE todos os dados atuais!\n\n' +
        'Todas as informações existentes serão REMOVIDAS e substituídas pelos dados do backup.\n\n' +
        'Tem certeza que deseja continuar?\n\n' +
        'Recomendamos fazer um backup atual antes de restaurar.'
    );
    
    if (!confirmar) return;
    
    // Mostrar modal de progresso
    const progressModal = document.createElement('div');
    progressModal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10001; display: flex; justify-content: center; align-items: center;">
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; text-align: center;">
                <div class="loading-backup" style="width: 40px; height: 40px;"></div>
                <h3 style="margin-top: 20px;">Restaurando dados...</h3>
                <div id="progresso-restauracao" style="margin-top: 20px;">Aguarde, isso pode levar alguns segundos...</div>
                <div style="width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; margin-top: 20px; overflow: hidden;">
                    <div id="barra-progresso" style="width: 0%; height: 100%; background: #28a745; transition: width 0.3s;"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(progressModal);
    
    try {
        const fileContent = await lerArquivo(arquivo);
        const backup = JSON.parse(fileContent);
        
        // Verificar se é um backup válido
        if (!backup.dados && !backup.tabela) {
            throw new Error('Arquivo de backup inválido!');
        }
        
        // Se for backup de tabela específica
        if (backup.tabela) {
            await restaurarTabelaEspecifica(backup.tabela, backup.dados, progressModal);
        } 
        // Se for backup completo
        else if (backup.dados) {
            await restaurarBackupCompleto(backup.dados, progressModal);
        } else {
            throw new Error('Formato de backup inválido!');
        }
        
    } catch (error) {
        document.body.removeChild(progressModal);
        alert('❌ Erro ao restaurar backup: ' + error.message);
    }
}

function lerArquivo(arquivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(arquivo);
    });
}

async function restaurarTabelaEspecifica(tabelaNome, dados, progressModal) {
    const barra = document.getElementById('barra-progresso');
    const progressText = document.getElementById('progresso-restauracao');
    
    progressText.innerHTML = `Restaurando tabela ${tabelaNome}...`;
    barra.style.width = '30%';
    
    // Primeiro, deletar todos os registros da tabela
    const { error: deleteError } = await window.supabaseClient
        .from(tabelaNome)
        .delete()
        .neq('id', 0);
    
    if (deleteError) throw deleteError;
    
    barra.style.width = '60%';
    progressText.innerHTML = `Inserindo ${dados.length} registros em ${tabelaNome}...`;
    
    // Inserir novos registros em lotes
    const batchSize = 50;
    for (let i = 0; i < dados.length; i += batchSize) {
        const batch = dados.slice(i, i + batchSize);
        const { error: insertError } = await window.supabaseClient
            .from(tabelaNome)
            .insert(batch);
        
        if (insertError) throw insertError;
        
        const percent = 60 + ((i + batch.length) / dados.length) * 40;
        barra.style.width = `${percent}%`;
    }
    
    barra.style.width = '100%';
    progressText.innerHTML = '✅ Restauração concluída!';
    
    setTimeout(() => {
        document.body.removeChild(progressModal);
        alert(`✅ Tabela ${tabelaNome} restaurada com sucesso!\n📊 ${dados.length} registros inseridos.`);
        location.reload(); // Recarregar a página
    }, 1500);
}

async function restaurarBackupCompleto(dadosBackup, progressModal) {
    const barra = document.getElementById('barra-progresso');
    const progressText = document.getElementById('progresso-restauracao');
    
    const tabelas = [
        'movimentacoes',
        'nota_itens', 
        'romaneio_itens',
        'notas_fiscais',
        'romaneios',
        'produtos',
        'fornecedores'
    ];
    
    let passo = 0;
    const totalPassos = tabelas.length;
    
    for (const tabela of tabelas) {
        passo++;
        const percent = (passo / totalPassos) * 100;
        barra.style.width = `${percent}%`;
        progressText.innerHTML = `Processando tabela: ${tabela}...`;
        
        if (dadosBackup[tabela] && dadosBackup[tabela].length > 0) {
            // Deletar registros existentes
            const { error: deleteError } = await window.supabaseClient
                .from(tabela)
                .delete()
                .neq('id', 0);
            
            if (deleteError && deleteError.code !== 'PGRST116') {
                console.warn(`Erro ao limpar ${tabela}:`, deleteError);
            }
            
            // Inserir novos registros em lotes
            const batchSize = 50;
            for (let i = 0; i < dadosBackup[tabela].length; i += batchSize) {
                const batch = dadosBackup[tabela].slice(i, i + batchSize);
                const { error: insertError } = await window.supabaseClient
                    .from(tabela)
                    .insert(batch);
                
                if (insertError) {
                    console.warn(`Erro ao inserir em ${tabela}:`, insertError);
                }
            }
        }
    }
    
    barra.style.width = '100%';
    progressText.innerHTML = '✅ Restauração completa!';
    
    setTimeout(() => {
        document.body.removeChild(progressModal);
        alert('✅ Backup restaurado com sucesso!\n\nO sistema será recarregado.');
        location.reload();
    }, 2000);
}