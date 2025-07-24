// Variáveis globais
let carrinho = [];
let totalCarrinho = 0;
let subtotalCarrinho = 0;
let taxaEntrega = 5.00;

// Variáveis do sistema de pedidos
let pedidos = [];
let proximoIdPedido = 1;
let isAdminLoggedIn = false;
const senhaAdmin = 'geladao2024'; // Senha do administrador

// Variáveis para gerenciamento de produtos
let produtosCadastrados = [];
let proximoIdProduto = 1;

// Variáveis para filtros de data
let filtroDataAtivo = false;
let dataInicioFiltro = null;
let dataFimFiltro = null;

// Aguarda o carregamento da página
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupBannerAnimation();
});

// Função para animar o banner promocional ao rolar a página
function setupBannerAnimation() {
    const banner = document.querySelector('.banner-promocional');
    if (!banner) return;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        // Move o banner para cima suavemente ao rolar a página
        banner.style.transform = `translateY(${scrollY * 0.5}px)`;
    });
}

// Inicializa a aplicação
function initializeApp() {
    setupEventListeners();
    setupSmoothScroll();
    setupFilterButtons();
    setupCarrinhoModal();
    setupPagamentoEntrega();
}

// Configura os event listeners
function setupEventListeners() {
    // Botões de adicionar ao carrinho
    const botoesComprar = document.querySelectorAll('.btn-comprar');
    botoesComprar.forEach(botao => {
        botao.addEventListener('click', adicionarAoCarrinho);
    });

    // Botão do carrinho no header
    const carrinhoIcon = document.querySelector('.carrinho');
    carrinhoIcon.addEventListener('click', abrirCarrinho);

    // Botão "Ver Produtos" no hero
    const btnVerProdutos = document.querySelector('.btn-primary');
    if (btnVerProdutos) {
        btnVerProdutos.addEventListener('click', function() {
            document.getElementById('produtos').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }

    // Formulário de contato
    const formContato = document.getElementById('form-contato');
    if (formContato) {
        formContato.addEventListener('submit', enviarMensagem);
    }

    // Botão finalizar pedido
    const btnFinalizar = document.getElementById('finalizar-pedido');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', finalizarPedido);
    }
}

// Configura scroll suave para navegação
function setupSmoothScroll() {
    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Configura os botões de filtro
function setupFilterButtons() {
    const filtros = document.querySelectorAll('.filtro-btn');
    const produtos = document.querySelectorAll('.produto-card');

    filtros.forEach(filtro => {
        filtro.addEventListener('click', function() {
            // Remove classe active de todos os filtros
            filtros.forEach(f => f.classList.remove('active'));
            // Adiciona classe active ao filtro clicado
            this.classList.add('active');

            const categoria = this.getAttribute('data-categoria');
            
            produtos.forEach(produto => {
                if (categoria === 'todos' || produto.getAttribute('data-categoria') === categoria) {
                    produto.style.display = 'block';
                    produto.classList.add('show');
                } else {
                    produto.style.display = 'none';
                    produto.classList.remove('show');
                }
            });
        });
    });
}

function setupCarrinhoModal() {
    const modal = document.getElementById('carrinho-modal');
    const closeBtn = modal.querySelector('.close');

    // Fechar modal ao clicar no X
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Fechar modal ao clicar fora dele
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Adiciona produto ao carrinho
function adicionarAoCarrinho(event) {
    const botao = event.target.closest('.btn-comprar');
    const produto = botao.getAttribute('data-produto');

    // Find the product card element
    const produtoCard = botao.closest('.produto-card');

    // Default to unidade
    let tipoSelecionado = 'unidade';
    let preco = parseFloat(botao.getAttribute('data-preco'));
    let quantidade = 1;

    if (produtoCard) {
        // Check if there are radio buttons for tipo
        const radios = produtoCard.querySelectorAll('.opcao-tipo input[type="radio"]');
        if (radios.length > 0) {
            radios.forEach(radio => {
                if (radio.checked) {
                    tipoSelecionado = radio.value;
                }
            });

            if (tipoSelecionado === 'fardo') {
                // Use fardo price and quantity
                const precoFardo = botao.getAttribute('data-fardo-preco');
                const qtdFardo = botao.getAttribute('data-fardo-qtd');
                if (precoFardo) {
                    preco = parseFloat(precoFardo);
                }
                if (qtdFardo) {
                    quantidade = parseInt(qtdFardo);
                }
            }
        }
    }

    // Compose name with type for clarity in cart
    const nomeCompleto = tipoSelecionado === 'fardo' ? `${produto} (Fardo)` : produto;

    // Verifica se o produto já existe no carrinho com the same type
    const produtoExistente = carrinho.find(item => item.nome === nomeCompleto);

    if (produtoExistente) {
        produtoExistente.quantidade += quantidade;
    } else {
        carrinho.push({
            nome: nomeCompleto,
            preco: preco,
            quantidade: quantidade,
            tipo: tipoSelecionado
        });
    }

    atualizarCarrinho();
    mostrarNotificacao(`${nomeCompleto} adicionado ao carrinho!`);
    
    // Animação no botão
    botao.style.transform = 'scale(0.95)';
    setTimeout(() => {
        botao.style.transform = 'scale(1)';
    }, 150);
}

// Atualiza o carrinho
function atualizarCarrinho() {
    const carrinhoCount = document.querySelector('.carrinho-count');
    const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    
    carrinhoCount.textContent = totalItens;
    
    // Calcula o total
    totalCarrinho = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    
    // Atualiza o display do carrinho
    atualizarDisplayCarrinho();
}

// Atualiza o display do carrinho no modal
function atualizarDisplayCarrinho() {
    const carrinhoItems = document.getElementById('carrinho-items');

    carrinhoItems.innerHTML = '';

    if (carrinho.length === 0) {
        carrinhoItems.innerHTML = '<p style="text-align: center; color: #666;">Seu carrinho está vazio</p>';
    } else {
        carrinho.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'carrinho-item';
            itemDiv.innerHTML = `
                <div>
                    <strong>${item.nome}</strong><br>
                    <small>Quantidade: ${item.quantidade} (${item.tipo === 'fardo' ? 'Fardo' : 'Unidade'})</small>
                </div>
                <div>
                    <strong>R$ ${(item.preco * item.quantidade).toFixed(2)}</strong>
                    <button onclick="removerDoCarrinho(${index})" style="margin-left: 10px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">×</button>
                </div>
            `;
            carrinhoItems.appendChild(itemDiv);
        });
    }

    atualizarTotais();
}

// Remove item do carrinho
function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarCarrinho();
}

// Abre o modal do carrinho
function abrirCarrinho() {
    const modal = document.getElementById('carrinho-modal');
    modal.style.display = 'block';
    atualizarDisplayCarrinho();
}


// Mostra notificação
function mostrarNotificacao(mensagem, tipo = 'success') {
    // Remove notificação existente
    const notificacaoExistente = document.querySelector('.notificacao');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }

    // Cria nova notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;
    
    // Estilos da notificação
    notificacao.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${tipo === 'error' ? '#e74c3c' : '#00b894'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 3000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(notificacao);

    // Animação de entrada
    setTimeout(() => {
        notificacao.style.transform = 'translateX(0)';
    }, 100);

    // Remove após 3 segundos
    setTimeout(() => {
        notificacao.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notificacao.parentNode) {
                notificacao.remove();
            }
        }, 300);
    }, 3000);
}

// Animação de scroll para revelar elementos
function revelarElementos() {
    const elementos = document.querySelectorAll('.produto-card, .sobre-text, .info-item');
    
    elementos.forEach(elemento => {
        const elementoTop = elemento.getBoundingClientRect().top;
        const elementoVisivel = elementoTop < window.innerHeight - 100;
        
        if (elementoVisivel) {
            elemento.style.opacity = '1';
            elemento.style.transform = 'translateY(0)';
        }
    });
}

// Event listener para scroll
window.addEventListener('scroll', revelarElementos);

// Inicializa elementos com animação
document.addEventListener('DOMContentLoaded', function() {
    const elementos = document.querySelectorAll('.produto-card, .sobre-text, .info-item');
    elementos.forEach(elemento => {
        elemento.style.opacity = '0';
        elemento.style.transform = 'translateY(30px)';
        elemento.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
});

// Função para destacar navegação ativa
function destacarNavegacaoAtiva() {
    const secoes = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav a');
    
    let secaoAtual = '';
    
    secoes.forEach(secao => {
        const secaoTop = secao.getBoundingClientRect().top;
        if (secaoTop <= 100) {
            secaoAtual = secao.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${secaoAtual}`) {
            link.classList.add('active');
        }
    });
}

// Event listener para scroll da navegação
window.addEventListener('scroll', destacarNavegacaoAtiva);

// Configura funcionalidades de pagamento e entrega
function setupPagamentoEntrega() {
    // Event listeners para opções de entrega
    const entregaRadios = document.querySelectorAll('input[name="entrega"]');
    entregaRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const enderecoSection = document.getElementById('endereco-section');
            const taxaEntregaLinha = document.getElementById('taxa-entrega-linha');
            
            if (this.value === 'entrega') {
                enderecoSection.style.display = 'block';
                taxaEntregaLinha.style.display = 'flex';
            } else {
                enderecoSection.style.display = 'none';
                taxaEntregaLinha.style.display = 'none';
            }
            
            atualizarTotais();
        });
    });

    // Event listeners para opções de pagamento
    const pagamentoRadios = document.querySelectorAll('input[name="pagamento"]');
    pagamentoRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const trocoSection = document.getElementById('troco-section');
            
            if (this.value === 'dinheiro') {
                trocoSection.style.display = 'block';
            } else {
                trocoSection.style.display = 'none';
            }
        });
    });
}

// Atualiza os totais do carrinho
function atualizarTotais() {
    subtotalCarrinho = carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
    
    const entregaSelecionada = document.querySelector('input[name="entrega"]:checked');
    const isEntrega = entregaSelecionada && entregaSelecionada.value === 'entrega';
    
    totalCarrinho = subtotalCarrinho + (isEntrega ? taxaEntrega : 0);
    
    // Atualiza elementos do DOM
    const subtotalElement = document.getElementById('subtotal-preco');
    const totalElement = document.getElementById('total-preco');
    
    if (subtotalElement) subtotalElement.textContent = subtotalCarrinho.toFixed(2);
    if (totalElement) totalElement.textContent = totalCarrinho.toFixed(2);
}

// Atualiza a função atualizarDisplayCarrinho para usar os novos totais
function atualizarDisplayCarrinho() {
    const carrinhoItems = document.getElementById('carrinho-items');

    carrinhoItems.innerHTML = '';

    if (carrinho.length === 0) {
        carrinhoItems.innerHTML = '<p style="text-align: center; color: #666;">Seu carrinho está vazio</p>';
    } else {
        carrinho.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'carrinho-item';
            itemDiv.innerHTML = `
                <div>
                    <strong>${item.nome}</strong><br>
                    <small>Quantidade: ${item.quantidade}</small>
                </div>
                <div>
                    <strong>R$ ${(item.preco * item.quantidade).toFixed(2)}</strong>
                    <button onclick="removerDoCarrinho(${index})" style="margin-left: 10px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer;">×</button>
                </div>
            `;
            carrinhoItems.appendChild(itemDiv);
        });
    }

    atualizarTotais();
}

// Atualiza a função finalizarPedido para incluir informações de entrega e pagamento
function finalizarPedido() {
    if (carrinho.length === 0) {
        mostrarNotificacao('Seu carrinho está vazio!', 'error');
        return;
    }

    // Coleta informações de entrega
    const entregaSelecionada = document.querySelector('input[name="entrega"]:checked');
    const isEntrega = entregaSelecionada && entregaSelecionada.value === 'entrega';
    
    // Coleta informações de pagamento
    const pagamentoSelecionado = document.querySelector('input[name="pagamento"]:checked');
    const formaPagamento = pagamentoSelecionado ? pagamentoSelecionado.value : 'dinheiro';
    
    // Validações
    if (isEntrega) {
        const endereco = document.getElementById('endereco-input').value.trim();
        if (!endereco) {
            mostrarNotificacao('Por favor, informe o endereço para entrega!', 'error');
            return;
        }
    }

    // Cria mensagem do pedido
    let mensagem = '🛒 *NOVO PEDIDO - FJ GELADÃO*\n\n';
    
    // Itens do pedido
    mensagem += '📋 *ITENS:*\n';
    carrinho.forEach(item => {
        mensagem += `• ${item.nome}\n`;
        mensagem += `  Qtd: ${item.quantidade} | Valor: R$ ${(item.preco * item.quantidade).toFixed(2)}\n\n`;
    });
    
    // Informações de entrega
    mensagem += '🚚 *ENTREGA:*\n';
    if (isEntrega) {
        const endereco = document.getElementById('endereco-input').value;
        mensagem += `📍 Entrega em domicílio\n`;
        mensagem += `📍 Endereço: ${endereco}\n`;
        mensagem += `💰 Taxa de entrega: R$ ${taxaEntrega.toFixed(2)}\n\n`;
    } else {
        mensagem += `🏪 Retirar no local\n`;
        mensagem += `📍 Rua Porto Príncipe, 817 - Prq Santa Rosa\n\n`;
    }
    
    // Informações de pagamento
    mensagem += '💳 *PAGAMENTO:*\n';
    switch(formaPagamento) {
        case 'dinheiro':
            mensagem += '💵 Dinheiro\n';
            const troco = document.getElementById('troco-input').value;
            if (troco && parseFloat(troco) > 0) {
                mensagem += `💰 Troco para: R$ ${parseFloat(troco).toFixed(2)}\n`;
            }
            break;
        case 'pix':
            mensagem += '📱 PIX\n';
            break;
        case 'cartao':
            mensagem += '💳 Cartão (débito/crédito)\n';
            break;
    }
    
    // Totais
    mensagem += '\n💰 *RESUMO:*\n';
    mensagem += `Subtotal: R$ ${subtotalCarrinho.toFixed(2)}\n`;
    if (isEntrega) {
        mensagem += `Taxa de entrega: R$ ${taxaEntrega.toFixed(2)}\n`;
    }
    mensagem += `*TOTAL: R$ ${totalCarrinho.toFixed(2)}*\n\n`;
    
    mensagem += '✅ Confirme seu pedido para prosseguir!';

    // Abre WhatsApp
    const numeroWhatsApp = '5585996421255'; // Número real do FJ Geladão
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(urlWhatsApp, '_blank');
    
    // Limpa o carrinho
    carrinho = [];
    atualizarCarrinho();
    
    // Fecha o modal
    document.getElementById('carrinho-modal').style.display = 'none';
    
    mostrarNotificacao('Redirecionando para WhatsApp...', 'success');
}

// Atualiza a função enviarMensagem para usar o número correto
function enviarMensagem(event) {
    event.preventDefault();
    
    const form = event.target;
    const nome = form.querySelector('input[type="text"]').value;
    const telefone = form.querySelector('input[type="tel"]').value;
    const mensagem = form.querySelector('textarea').value;

    // Cria mensagem para WhatsApp
    const mensagemWhatsApp = `📞 *CONTATO - FJ GELADÃO*\n\n👤 Nome: ${nome}\n📱 Telefone: ${telefone}\n\n💬 Mensagem:\n${mensagem}`;
    
    // Abre WhatsApp
    const numeroWhatsApp = '5585996421255'; // Número real do FJ Geladão
    const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagemWhatsApp)}`;
    
    window.open(urlWhatsApp, '_blank');
    
    // Limpa o formulário
    form.reset();
    
    mostrarNotificacao('Redirecionando para WhatsApp...', 'success');
}

// Adiciona CSS para link ativo da navegação
const style = document.createElement('style');
style.textContent = `
    .nav a.active {
        color: #74b9ff !important;
        font-weight: bold;
    }
`;
document.head.appendChild(style);

// ===== SISTEMA DE CONTROLE DE PEDIDOS =====

// Inicializa o sistema de pedidos
document.addEventListener('DOMContentLoaded', function() {
    setupAdminSystem();
    carregarPedidosDoStorage();
});

// Configura o sistema administrativo
function setupAdminSystem() {
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    
    if (btnLogin) {
        btnLogin.addEventListener('click', fazerLogin);
    }
    
    if (btnLogout) {
        btnLogout.addEventListener('click', fazerLogout);
    }
    
    // Event listener para Enter no campo de senha
    const senhaInput = document.getElementById('admin-password');
    if (senhaInput) {
        senhaInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                fazerLogin();
            }
        });
    }
    
    // Configura filtros de pedidos
    setupFiltrosPedidos();
}

// Função de login do administrador
function fazerLogin() {
    const senhaInput = document.getElementById('admin-password');
    const senha = senhaInput.value;
    
    if (senha === senhaAdmin) {
        isAdminLoggedIn = true;
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        
        // Adiciona classe para mostrar o link de pedidos no menu
        document.body.classList.add('admin-logged-in');
        
        atualizarEstatisticas();
        exibirPedidos();
        mostrarNotificacao('Login realizado com sucesso!', 'success');
        
        // Limpa o campo de senha
        senhaInput.value = '';
    } else {
        mostrarNotificacao('Senha incorreta!', 'error');
        senhaInput.value = '';
    }
}

// Função de logout do administrador
function fazerLogout() {
    isAdminLoggedIn = false;
    document.getElementById('admin-login').style.display = 'block';
    document.getElementById('admin-panel').style.display = 'none';
    
    // Remove classe para ocultar o link de pedidos no menu
    document.body.classList.remove('admin-logged-in');
    
    mostrarNotificacao('Logout realizado com sucesso!', 'success');
}

// Configura os filtros de pedidos
function setupFiltrosPedidos() {
    const filtrosPedidos = document.querySelectorAll('.filtro-pedido-btn');
    
    filtrosPedidos.forEach(filtro => {
        filtro.addEventListener('click', function() {
            // Remove classe active de todos os filtros
            filtrosPedidos.forEach(f => f.classList.remove('active'));
            // Adiciona classe active ao filtro clicado
            this.classList.add('active');
            
            const status = this.getAttribute('data-status');
            filtrarPedidos(status);
        });
    });
}

// Filtra pedidos por status
function filtrarPedidos(status) {
    const pedidosCards = document.querySelectorAll('.pedido-card');
    
    pedidosCards.forEach(card => {
        const pedidoStatus = card.getAttribute('data-status');
        
        if (status === 'todos' || pedidoStatus === status) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Atualiza as estatísticas do painel
function atualizarEstatisticas() {
    const totalPedidos = pedidos.length;
    const pedidosPendentes = pedidos.filter(p => p.status === 'pendente').length;
    const pedidosConcluidos = pedidos.filter(p => p.status === 'entregue').length;
    
    // Calcula faturamento do dia
    const hoje = new Date().toDateString();
    const faturamentoHoje = pedidos
        .filter(p => new Date(p.dataHora).toDateString() === hoje && p.status === 'entregue')
        .reduce((total, p) => total + p.total, 0);
    
    // Atualiza elementos do DOM
    document.getElementById('total-pedidos').textContent = totalPedidos;
    document.getElementById('pedidos-pendentes').textContent = pedidosPendentes;
    document.getElementById('pedidos-concluidos').textContent = pedidosConcluidos;
    document.getElementById('faturamento-hoje').textContent = `R$ ${faturamentoHoje.toFixed(2)}`;
}

// Exibe a lista de pedidos
function exibirPedidos() {
    const listaPedidos = document.getElementById('pedidos-lista');
    
    if (pedidos.length === 0) {
        listaPedidos.innerHTML = `
            <div class="pedido-vazio">
                <i class="fas fa-inbox"></i>
                <p>Nenhum pedido encontrado</p>
            </div>
        `;
        return;
    }
    
    // Ordena pedidos por data (mais recentes primeiro)
    const pedidosOrdenados = pedidos.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
    
    listaPedidos.innerHTML = '';
    
    pedidosOrdenados.forEach(pedido => {
        const pedidoCard = criarCardPedido(pedido);
        listaPedidos.appendChild(pedidoCard);
    });
}

// Cria um card de pedido
function criarCardPedido(pedido) {
    const card = document.createElement('div');
    card.className = 'pedido-card';
    card.setAttribute('data-status', pedido.status);
    
    const statusClass = `status-${pedido.status}`;
    const statusText = {
        'pendente': 'Pendente',
        'preparando': 'Preparando',
        'pronto': 'Pronto',
        'entregue': 'Entregue'
    };
    
    card.innerHTML = `
        <div class="pedido-header">
            <input type="checkbox" class="pedido-checkbox" data-pedido-id="${pedido.id}" style="margin-right: 10px;">
            <span class="pedido-id">Pedido #${pedido.id}</span>
            <span class="pedido-status ${statusClass}">${statusText[pedido.status]}</span>
        </div>
        
        <div class="pedido-info">
            <div class="pedido-cliente">
                <i class="fas fa-user"></i>
                <span>${pedido.cliente || 'Cliente não informado'}</span>
            </div>
            <div class="pedido-total">
                <i class="fas fa-dollar-sign"></i>
                <span>R$ ${pedido.total.toFixed(2)}</span>
            </div>
        </div>
        
        <div class="pedido-itens">
            <h5>Itens do pedido:</h5>
            ${pedido.itens.map(item => `
                <div class="item-pedido">
                    <span>${item.nome} (${item.quantidade}x)</span>
                    <span>R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
        
        <div class="pedido-actions">
            ${gerarBotoesAcao(pedido)}
        </div>
        
        <small style="color: #666; margin-top: 1rem; display: block;">
            ${new Date(pedido.dataHora).toLocaleString('pt-BR')}
        </small>
    `;
    
    return card;
}

// Gera botões de ação baseado no status do pedido
function gerarBotoesAcao(pedido) {
    let botoes = '';
    
    switch(pedido.status) {
        case 'pendente':
            botoes = `
                <button class="btn-action btn-preparar" onclick="alterarStatusPedido(${pedido.id}, 'preparando')">
                    Iniciar Preparo
                </button>
                <button class="btn-action btn-cancelar" onclick="alterarStatusPedido(${pedido.id}, 'cancelado')">
                    Cancelar
                </button>
            `;
            break;
        case 'preparando':
            botoes = `
                <button class="btn-action btn-pronto" onclick="alterarStatusPedido(${pedido.id}, 'pronto')">
                    Marcar como Pronto
                </button>
                <button class="btn-action btn-cancelar" onclick="alterarStatusPedido(${pedido.id}, 'cancelado')">
                    Cancelar
                </button>
            `;
            break;
        case 'pronto':
            botoes = `
                <button class="btn-action btn-entregar" onclick="alterarStatusPedido(${pedido.id}, 'entregue')">
                    Marcar como Entregue
                </button>
            `;
            break;
        case 'entregue':
            botoes = '<span style="color: #28a745; font-weight: bold;">✓ Pedido Concluído</span>';
            break;
    }
    
    return botoes;
}

// Altera o status de um pedido
function alterarStatusPedido(pedidoId, novoStatus) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    
    if (pedido) {
        pedido.status = novoStatus;
        salvarPedidosNoStorage();
        atualizarEstatisticas();
        exibirPedidos();
        
        const statusTexto = {
            'preparando': 'em preparo',
            'pronto': 'como pronto',
            'entregue': 'como entregue',
            'cancelado': 'como cancelado'
        };
        
        mostrarNotificacao(`Pedido #${pedidoId} marcado ${statusTexto[novoStatus]}!`, 'success');
    }
}

// Modifica a função finalizarPedido para salvar no sistema
const finalizarPedidoOriginal = finalizarPedido;
finalizarPedido = function() {
    if (carrinho.length === 0) {
        mostrarNotificacao('Seu carrinho está vazio!', 'error');
        return;
    }

    // Coleta informações de entrega
    const entregaSelecionada = document.querySelector('input[name="entrega"]:checked');
    const isEntrega = entregaSelecionada && entregaSelecionada.value === 'entrega';
    
    // Coleta informações de pagamento
    const pagamentoSelecionado = document.querySelector('input[name="pagamento"]:checked');
    const formaPagamento = pagamentoSelecionado ? pagamentoSelecionado.value : 'dinheiro';
    
    // Validações
    if (isEntrega) {
        const endereco = document.getElementById('endereco-input').value.trim();
        if (!endereco) {
            mostrarNotificacao('Por favor, informe o endereço para entrega!', 'error');
            return;
        }
    }

    // Cria o pedido no sistema
    const novoPedido = {
        id: proximoIdPedido++,
        dataHora: new Date().toISOString(),
        status: 'pendente',
        cliente: 'Cliente via Site',
        itens: [...carrinho],
        total: totalCarrinho,
        tipoEntrega: isEntrega ? 'entrega' : 'retirada',
        endereco: isEntrega ? document.getElementById('endereco-input').value : null,
        formaPagamento: formaPagamento,
        troco: formaPagamento === 'dinheiro' ? document.getElementById('troco-input').value : null
    };
    
    // Adiciona o pedido à lista
    pedidos.push(novoPedido);
    salvarPedidosNoStorage();
    
    // Chama a função original para enviar WhatsApp
    finalizarPedidoOriginal();
    
    // Atualiza estatísticas se admin estiver logado
    if (isAdminLoggedIn) {
        atualizarEstatisticas();
        exibirPedidos();
    }
};

// Salva pedidos no localStorage
function salvarPedidosNoStorage() {
    localStorage.setItem('fjgeladao_pedidos', JSON.stringify(pedidos));
    localStorage.setItem('fjgeladao_proximo_id', proximoIdPedido.toString());
}

// Carrega pedidos do localStorage
function carregarPedidosDoStorage() {
    const pedidosSalvos = localStorage.getItem('fjgeladao_pedidos');
    const proximoIdSalvo = localStorage.getItem('fjgeladao_proximo_id');
    
    if (pedidosSalvos) {
        pedidos = JSON.parse(pedidosSalvos);
    }
    
    if (proximoIdSalvo) {
        proximoIdPedido = parseInt(proximoIdSalvo);
    }
}

// ===== NOVAS FUNCIONALIDADES ADMINISTRATIVAS =====

// Inicializa as novas funcionalidades quando o admin faz login
document.addEventListener('DOMContentLoaded', function() {
    setupNovasFuncionalidades();
    carregarProdutosCadastrados();
});

// Configura as novas funcionalidades administrativas
function setupNovasFuncionalidades() {
    // Filtros de data
    setupFiltrosData();
    
    // Gerenciamento de produtos
    setupGerenciamentoProdutos();
    
    // Exportação CSV
    setupExportacaoCSV();

    // Botão adicionar pedido zerado
    const btnZerarPedido = document.getElementById('btn-zerar-pedido');
    if (btnZerarPedido) {
        btnZerarPedido.addEventListener('click', adicionarPedidoZerado);
    }

    // Botão limpar pedidos selecionados
    const btnLimparPedidos = document.getElementById('btn-limpar-pedidos');
    if (btnLimparPedidos) {
        btnLimparPedidos.addEventListener('click', limparPedidosSelecionados);
    }

    // Checkbox marcar todos
    const checkboxMarcarTodos = document.getElementById('checkbox-marcar-todos');
    if (checkboxMarcarTodos) {
        checkboxMarcarTodos.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.pedido-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = this.checked;
            });
        });
    }
}

// Função para limpar pedidos selecionados
function limparPedidosSelecionados() {
    const checkboxes = document.querySelectorAll('.pedido-checkbox:checked');
    if (checkboxes.length === 0) {
        mostrarNotificacao('Nenhum pedido selecionado para limpar.', 'error');
        return;
    }

    if (!confirm(`Tem certeza que deseja limpar os ${checkboxes.length} pedidos selecionados? Esta ação não pode ser desfeita.`)) {
        return;
    }

    const idsParaRemover = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-pedido-id')));
    pedidos = pedidos.filter(pedido => !idsParaRemover.includes(pedido.id));
    salvarPedidosNoStorage();

    if (isAdminLoggedIn) {
        atualizarEstatisticas();
        exibirPedidos();
    }

    mostrarNotificacao(`${idsParaRemover.length} pedidos selecionados foram limpos com sucesso!`, 'success');
}

// Função para adicionar um pedido zerado
function adicionarPedidoZerado() {
    const novoPedido = {
        id: proximoIdPedido++,
        dataHora: new Date().toISOString(),
        status: 'pendente',
        cliente: 'Pedido Zerado',
        itens: [],
        total: 0,
        tipoEntrega: 'retirada',
        endereco: null,
        formaPagamento: null,
        troco: null
    };

    pedidos.push(novoPedido);
    salvarPedidosNoStorage();

    if (isAdminLoggedIn) {
        atualizarEstatisticas();
        exibirPedidos();
    }

    mostrarNotificacao('Pedido zerado adicionado com sucesso!', 'success');
}

function limparPedidos() {
    if (!confirm('Tem certeza que deseja limpar todos os pedidos? Esta ação não pode ser desfeita.')) {
        return;
    }

    pedidos = [];
    proximoIdPedido = 1;
    salvarPedidosNoStorage();

    // Limpa o carrinho também
    carrinho = [];
    atualizarCarrinho();

    if (isAdminLoggedIn) {
        atualizarEstatisticas();
        exibirPedidos();
    }

    mostrarNotificacao('Todos os pedidos foram limpos com sucesso!', 'success');
}

// ===== FILTROS DE DATA =====

function setupFiltrosData() {
    // Botão filtrar data
    const btnFiltrarData = document.getElementById('btn-filtrar-data');
    if (btnFiltrarData) {
        btnFiltrarData.addEventListener('click', aplicarFiltroData);
    }
    
    // Botão limpar filtro
    const btnLimparFiltro = document.getElementById('btn-limpar-filtro');
    if (btnLimparFiltro) {
        btnLimparFiltro.addEventListener('click', limparFiltroData);
    }
    
    // Filtros rápidos
    const quickFilters = document.querySelectorAll('.quick-filter-btn');
    quickFilters.forEach(btn => {
        btn.addEventListener('click', function() {
            const period = this.getAttribute('data-period');
            aplicarFiltroRapido(period);
        });
    });
}

function aplicarFiltroData() {
    const dataInicio = document.getElementById('data-inicio').value;
    const dataFim = document.getElementById('data-fim').value;
    
    if (!dataInicio || !dataFim) {
        mostrarNotificacao('Por favor, selecione as datas de início e fim!', 'error');
        return;
    }
    
    if (new Date(dataInicio) > new Date(dataFim)) {
        mostrarNotificacao('A data de início deve ser anterior à data fim!', 'error');
        return;
    }
    
    filtroDataAtivo = true;
    dataInicioFiltro = new Date(dataInicio);
    dataFimFiltro = new Date(dataFim);
    dataFimFiltro.setHours(23, 59, 59, 999); // Inclui o dia inteiro
    
    // Adiciona indicador visual
    adicionarIndicadorFiltro(`${dataInicio} até ${dataFim}`);
    
    // Aplica o filtro
    exibirPedidos();
    atualizarEstatisticas();
    
    mostrarNotificacao('Filtro de data aplicado!', 'success');
}

function limparFiltroData() {
    filtroDataAtivo = false;
    dataInicioFiltro = null;
    dataFimFiltro = null;
    
    // Remove campos de data
    document.getElementById('data-inicio').value = '';
    document.getElementById('data-fim').value = '';
    
    // Remove indicador visual
    removerIndicadorFiltro();
    
    // Remove classe ativa dos filtros rápidos
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Reaplica a exibição
    exibirPedidos();
    atualizarEstatisticas();
    
    mostrarNotificacao('Filtro de data removido!', 'success');
}

function aplicarFiltroRapido(period) {
    const hoje = new Date();
    let dataInicio, dataFim;
    
    // Remove classe ativa de todos os botões
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adiciona classe ativa ao botão clicado
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    switch(period) {
        case 'hoje':
            dataInicio = new Date(hoje);
            dataFim = new Date(hoje);
            break;
        case 'semana':
            dataInicio = new Date(hoje);
            dataInicio.setDate(hoje.getDate() - hoje.getDay()); // Domingo da semana atual
            dataFim = new Date(dataInicio);
            dataFim.setDate(dataInicio.getDate() + 6); // Sábado da semana atual
            break;
        case 'mes':
            dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            break;
    }
    
    // Define os campos de data
    document.getElementById('data-inicio').value = dataInicio.toISOString().split('T')[0];
    document.getElementById('data-fim').value = dataFim.toISOString().split('T')[0];
    
    // Aplica o filtro
    aplicarFiltroData();
}

function adicionarIndicadorFiltro(texto) {
    removerIndicadorFiltro(); // Remove indicador existente
    
    const header = document.querySelector('.panel-header h3');
    const indicator = document.createElement('span');
    indicator.className = 'filter-indicator';
    indicator.textContent = texto;
    header.appendChild(indicator);
}

function removerIndicadorFiltro() {
    const indicator = document.querySelector('.filter-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Modifica a função exibirPedidos para considerar o filtro de data
const exibirPedidosOriginal = exibirPedidos;
exibirPedidos = function() {
    let pedidosFiltrados = pedidos;
    
    // Aplica filtro de data se ativo
    if (filtroDataAtivo && dataInicioFiltro && dataFimFiltro) {
        pedidosFiltrados = pedidos.filter(pedido => {
            const dataPedido = new Date(pedido.dataHora);
            return dataPedido >= dataInicioFiltro && dataPedido <= dataFimFiltro;
        });
    }
    
    const listaPedidos = document.getElementById('pedidos-lista');
    
    if (pedidosFiltrados.length === 0) {
        listaPedidos.innerHTML = `
            <div class="pedido-vazio">
                <i class="fas fa-inbox"></i>
                <p>Nenhum pedido encontrado</p>
            </div>
        `;
        return;
    }
    
    // Ordena pedidos por data (mais recentes primeiro)
    const pedidosOrdenados = pedidosFiltrados.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
    
    listaPedidos.innerHTML = '';
    
    pedidosOrdenados.forEach(pedido => {
        const pedidoCard = criarCardPedido(pedido);
        listaPedidos.appendChild(pedidoCard);
    });
};

// Modifica a função atualizarEstatisticas para considerar o filtro de data
const atualizarEstatisticasOriginal = atualizarEstatisticas;
atualizarEstatisticas = function() {
    let pedidosFiltrados = pedidos;
    
    // Aplica filtro de data se ativo
    if (filtroDataAtivo && dataInicioFiltro && dataFimFiltro) {
        pedidosFiltrados = pedidos.filter(pedido => {
            const dataPedido = new Date(pedido.dataHora);
            return dataPedido >= dataInicioFiltro && dataPedido <= dataFimFiltro;
        });
    }
    
    const totalPedidos = pedidosFiltrados.length;
    const pedidosPendentes = pedidosFiltrados.filter(p => p.status === 'pendente').length;
    const pedidosConcluidos = pedidosFiltrados.filter(p => p.status === 'entregue').length;
    
    // Calcula faturamento baseado no filtro
    let faturamento;
    if (filtroDataAtivo) {
        faturamento = pedidosFiltrados
            .filter(p => p.status === 'entregue')
            .reduce((total, p) => total + p.total, 0);
    } else {
        // Faturamento do dia se não há filtro ativo
        const hoje = new Date().toDateString();
        faturamento = pedidos
            .filter(p => new Date(p.dataHora).toDateString() === hoje && p.status === 'entregue')
            .reduce((total, p) => total + p.total, 0);
    }
    
    // Atualiza elementos do DOM
    document.getElementById('total-pedidos').textContent = totalPedidos;
    document.getElementById('pedidos-pendentes').textContent = pedidosPendentes;
    document.getElementById('pedidos-concluidos').textContent = pedidosConcluidos;
    document.getElementById('faturamento-hoje').textContent = `R$ ${faturamento.toFixed(2)}`;
};

// ===== GERENCIAMENTO DE PRODUTOS =====

function setupGerenciamentoProdutos() {
    // Botão gerenciar produtos
    const btnGerenciarProdutos = document.getElementById('btn-gerenciar-produtos');
    if (btnGerenciarProdutos) {
        btnGerenciarProdutos.addEventListener('click', abrirModalProdutos);
    }
    
    // Modal de produtos
    setupModalProdutos();
    
    // Formulário adicionar produto
    const formAdicionar = document.getElementById('form-adicionar-produto');
    if (formAdicionar) {
        formAdicionar.addEventListener('submit', adicionarProduto);
    }
    
    // Busca de produtos
    const searchInput = document.getElementById('search-produto');
    if (searchInput) {
        searchInput.addEventListener('input', buscarProdutos);
    }
}

function setupModalProdutos() {
    const modal = document.getElementById('produtos-modal');
    const closeBtn = document.getElementById('close-produtos-modal');
    
    // Fechar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Fechar ao clicar fora
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });
}

function switchTab(activeTab) {
    // Remove classe ativa de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Remove classe ativa de todos os conteúdos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Adiciona classe ativa ao botão e conteúdo corretos
    document.querySelector(`[data-tab="${activeTab}"]`).classList.add('active');
    document.getElementById(`tab-${activeTab}`).classList.add('active');
    
    // Carrega lista de produtos se for a tab de editar
    if (activeTab === 'editar') {
        carregarListaProdutosEdit();
    }
}

function abrirModalProdutos() {
    const modal = document.getElementById('produtos-modal');
    modal.style.display = 'block';
    
    // Carrega lista de produtos para edição
    carregarListaProdutosEdit();
}

function adicionarProduto(event) {
    event.preventDefault();
    
    const nome = document.getElementById('produto-nome').value.trim();
    const preco = parseFloat(document.getElementById('produto-preco').value);
    const categoria = document.getElementById('produto-categoria').value;
    const imagem = document.getElementById('produto-imagem').value.trim();
    
    if (!nome || !preco || !categoria) {
        mostrarNotificacao('Por favor, preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    const novoProduto = {
        id: proximoIdProduto++,
        nome: nome,
        preco: preco,
        categoria: categoria,
        imagem: imagem || null,
        ativo: true
    };
    
    produtosCadastrados.push(novoProduto);
    salvarProdutosCadastrados();
    
    // Adiciona o produto ao DOM
    adicionarProdutoAoDOM(novoProduto);
    
    // Limpa o formulário
    document.getElementById('form-adicionar-produto').reset();
    
    mostrarNotificacao('Produto adicionado com sucesso!', 'success');
}

function adicionarProdutoAoDOM(produto) {
    const produtosGrid = document.querySelector('.produtos-grid');
    
    const produtoCard = document.createElement('div');
    produtoCard.className = 'produto-card';
    produtoCard.setAttribute('data-categoria', produto.categoria);
    produtoCard.setAttribute('data-produto-id', produto.id);
    
    produtoCard.innerHTML = `
        <div class="produto-image">
            ${produto.imagem ? 
                `<img src="${produto.imagem}" alt="${produto.nome}">` : 
                `<i class="fas fa-box" style="font-size: 4rem; color: #74b9ff;"></i>`
            }
        </div>
        <h3>${produto.nome}</h3>
        <p class="preco">R$ ${produto.preco.toFixed(2)}</p>
        <button class="btn-comprar" data-produto="${produto.nome}" data-preco="${produto.preco}">
            <i class="fas fa-cart-plus"></i> Adicionar
        </button>
    `;
    
    // Adiciona event listener ao botão
    const btnComprar = produtoCard.querySelector('.btn-comprar');
    btnComprar.addEventListener('click', adicionarAoCarrinho);
    
    produtosGrid.appendChild(produtoCard);
}

function carregarListaProdutosEdit() {
    const lista = document.getElementById('lista-produtos-edit');
    
    // Combina produtos do HTML e produtos cadastrados
    const todosProdutos = obterTodosProdutos();
    
    lista.innerHTML = '';
    
    todosProdutos.forEach(produto => {
        const item = document.createElement('div');
        item.className = 'produto-edit-item';
        
        item.innerHTML = `
            <div class="produto-edit-info">
                <h5>${produto.nome}</h5>
                <small>${produto.categoria}</small>
            </div>
            <div class="produto-edit-preco">
                <input type="number" step="0.01" min="0" value="${produto.preco}" 
                       data-produto-id="${produto.id}" data-produto-nome="${produto.nome}">
                <button class="btn-save-preco" onclick="salvarPreco('${produto.id}', '${produto.nome}')">
                    <i class="fas fa-save"></i>
                </button>
                <button class="btn-delete-produto" onclick="excluirProduto('${produto.id}', '${produto.nome}', ${produto.isDynamic})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        lista.appendChild(item);
    });
}

function obterTodosProdutos() {
    const produtos = [];
    
    // Produtos do HTML
    const produtosHTML = document.querySelectorAll('.produto-card');
    produtosHTML.forEach((card, index) => {
        const nome = card.querySelector('h3').textContent;
        const precoText = card.querySelector('.preco').textContent;
        const preco = parseFloat(precoText.replace('R$ ', '').replace(',', '.'));
        const categoria = card.getAttribute('data-categoria');
        
        produtos.push({
            id: `html-${index}`,
            nome: nome,
            preco: preco,
            categoria: categoria,
            isDynamic: false
        });
    });
    
    // Produtos cadastrados dinamicamente
    produtosCadastrados.forEach(produto => {
        if (produto.ativo) {
            produtos.push({
                ...produto,
                isDynamic: true
            });
        }
    });
    
    return produtos.sort((a, b) => a.nome.localeCompare(b.nome));
}

function salvarPreco(produtoId, produtoNome) {
    const input = document.querySelector(`input[data-produto-id="${produtoId}"]`);
    const novoPreco = parseFloat(input.value);
    
    if (isNaN(novoPreco) || novoPreco < 0) {
        mostrarNotificacao('Preço inválido!', 'error');
        return;
    }
    
    try {
        console.log('Tentando salvar preço para:', produtoNome, 'ID:', produtoId, 'Novo preço:', novoPreco);
        
        // Se é produto do HTML
        if (produtoId.startsWith('html-')) {
            // Busca o produto pelo nome usando múltiplas estratégias
            const produtoCards = document.querySelectorAll('.produto-card');
            let produtoCard = null;
            
            // Primeira tentativa: busca exata
            produtoCards.forEach(card => {
                const nomeCard = card.querySelector('h3').textContent.trim();
                if (nomeCard === produtoNome) {
                    produtoCard = card;
                }
            });
            
            // Segunda tentativa: busca por similaridade (remove acentos e caracteres especiais)
            if (!produtoCard) {
                const nomeLimpo = produtoNome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                produtoCards.forEach(card => {
                    const nomeCard = card.querySelector('h3').textContent.trim();
                    const nomeCardLimpo = nomeCard.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                    if (nomeCardLimpo === nomeLimpo) {
                        produtoCard = card;
                    }
                });
            }
            
            // Terceira tentativa: busca por data-produto no botão
            if (!produtoCard) {
                produtoCards.forEach(card => {
                    const btnComprar = card.querySelector('.btn-comprar');
                    if (btnComprar) {
                        const dataProduto = btnComprar.getAttribute('data-produto');
                        if (dataProduto === produtoNome) {
                            produtoCard = card;
                        }
                    }
                });
            }
            
            // Quarta tentativa: busca parcial (contém o nome)
            if (!produtoCard) {
                produtoCards.forEach(card => {
                    const nomeCard = card.querySelector('h3').textContent.trim();
                    if (nomeCard.includes(produtoNome) || produtoNome.includes(nomeCard)) {
                        produtoCard = card;
                    }
                });
            }
            
            console.log('Produto encontrado:', produtoCard ? 'SIM' : 'NÃO');
            
            if (produtoCard) {
                const precoElement = produtoCard.querySelector('.preco');
                const btnComprar = produtoCard.querySelector('.btn-comprar');
                
                if (precoElement && btnComprar) {
                    precoElement.textContent = `R$ ${novoPreco.toFixed(2)}`;
                    btnComprar.setAttribute('data-preco', novoPreco.toString());
                    btnComprar.setAttribute('data-produto', produtoNome);
                    console.log('Preço atualizado no DOM');
                } else {
                    console.error('Elementos preço ou botão não encontrados');
                }
            } else {
                console.error('Produto não encontrado no DOM:', produtoNome);
                // Lista todos os produtos disponíveis para debug
                console.log('Produtos disponíveis:');
                produtoCards.forEach((card, index) => {
                    const nome = card.querySelector('h3').textContent.trim();
                    console.log(`${index}: "${nome}"`);
                });
            }
        } else {
            // Se é produto cadastrado dinamicamente
            const produto = produtosCadastrados.find(p => p.id == produtoId);
            if (produto) {
                produto.preco = novoPreco;
                salvarProdutosCadastrados();
                
                // Atualiza no DOM
                const produtoCard = document.querySelector(`[data-produto-id="${produtoId}"]`);
                if (produtoCard) {
                    const precoElement = produtoCard.querySelector('.preco');
                    const btnComprar = produtoCard.querySelector('.btn-comprar');
                    
                    if (precoElement && btnComprar) {
                        precoElement.textContent = `R$ ${novoPreco.toFixed(2)}`;
                        btnComprar.setAttribute('data-preco', novoPreco.toString());
                    }
                }
            }
        }
        
        mostrarNotificacao('Preço atualizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao salvar preço:', error);
        mostrarNotificacao('Erro ao atualizar preço. Tente novamente.', 'error');
    }
}

function excluirProduto(produtoId, produtoNome, isDynamic) {
    if (!confirm(`Tem certeza que deseja excluir o produto "${produtoNome}"?`)) {
        return;
    }
    
    try {
        if (isDynamic) {
            // Produto cadastrado dinamicamente
            const produto = produtosCadastrados.find(p => p.id == produtoId);
            if (produto) {
                produto.ativo = false;
                salvarProdutosCadastrados();
                
                // Remove do DOM
                const produtoCard = document.querySelector(`[data-produto-id="${produtoId}"]`);
                if (produtoCard) {
                    produtoCard.remove();
                }
                
                mostrarNotificacao('Produto excluído com sucesso!', 'success');
            }
        } else {
            // Produto do HTML - apenas oculta
            const produtoCards = document.querySelectorAll('.produto-card');
            let produtoCard = null;
            
            // Busca o produto usando as mesmas estratégias da função salvarPreco
            produtoCards.forEach(card => {
                const nomeCard = card.querySelector('h3').textContent.trim();
                if (nomeCard === produtoNome) {
                    produtoCard = card;
                }
            });
            
            // Busca por similaridade se não encontrou
            if (!produtoCard) {
                const nomeLimpo = produtoNome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                produtoCards.forEach(card => {
                    const nomeCard = card.querySelector('h3').textContent.trim();
                    const nomeCardLimpo = nomeCard.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
                    if (nomeCardLimpo === nomeLimpo) {
                        produtoCard = card;
                    }
                });
            }
            
            if (produtoCard) {
                // Adiciona classe para ocultar o produto
                produtoCard.style.display = 'none';
                produtoCard.setAttribute('data-produto-oculto', 'true');
                
                mostrarNotificacao('Produto ocultado com sucesso!', 'success');
            } else {
                mostrarNotificacao('Produto não encontrado!', 'error');
            }
        }
        
        // Recarrega lista de edição
        carregarListaProdutosEdit();
        
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        mostrarNotificacao('Erro ao excluir produto. Tente novamente.', 'error');
    }
}

function buscarProdutos() {
    const termo = document.getElementById('search-produto').value.toLowerCase();
    const items = document.querySelectorAll('.produto-edit-item');
    
    items.forEach(item => {
        const nome = item.querySelector('h5').textContent.toLowerCase();
        const categoria = item.querySelector('small').textContent.toLowerCase();
        
        if (nome.includes(termo) || categoria.includes(termo)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function salvarProdutosCadastrados() {
    localStorage.setItem('fjgeladao_produtos', JSON.stringify(produtosCadastrados));
    localStorage.setItem('fjgeladao_proximo_produto_id', proximoIdProduto.toString());
}

function carregarProdutosCadastrados() {
    const produtosSalvos = localStorage.getItem('fjgeladao_produtos');
    const proximoIdSalvo = localStorage.getItem('fjgeladao_proximo_produto_id');
    
    if (produtosSalvos) {
        produtosCadastrados = JSON.parse(produtosSalvos);
        
        // Adiciona produtos salvos ao DOM
        produtosCadastrados.forEach(produto => {
            if (produto.ativo) {
                adicionarProdutoAoDOM(produto);
            }
        });
    }
    
    if (proximoIdSalvo) {
        proximoIdProduto = parseInt(proximoIdSalvo);
    }
}

// ===== EXPORTAÇÃO CSV =====

function setupExportacaoCSV() {
    const btnExportar = document.getElementById('btn-exportar-csv');
    if (btnExportar) {
        btnExportar.addEventListener('click', exportarCSV);
    }
}

function exportarCSV() {
    let pedidosParaExportar = pedidos;
    
    // Aplica filtro de data se ativo
    if (filtroDataAtivo && dataInicioFiltro && dataFimFiltro) {
        pedidosParaExportar = pedidos.filter(pedido => {
            const dataPedido = new Date(pedido.dataHora);
            return dataPedido >= dataInicioFiltro && dataPedido <= dataFimFiltro;
        });
    }
    
    if (pedidosParaExportar.length === 0) {
        mostrarNotificacao('Nenhum pedido encontrado para exportar!', 'error');
        return;
    }
    
    // Cabeçalho do CSV
    let csvContent = 'ID,Data/Hora,Status,Cliente,Itens,Quantidade Total,Valor Total,Tipo Entrega,Forma Pagamento\n';
    
    // Dados dos pedidos
    pedidosParaExportar.forEach(pedido => {
        const dataFormatada = new Date(pedido.dataHora).toLocaleString('pt-BR');
        const itensTexto = pedido.itens.map(item => `${item.nome} (${item.quantidade}x)`).join('; ');
        const quantidadeTotal = pedido.itens.reduce((total, item) => total + item.quantidade, 0);
        
        csvContent += `${pedido.id},"${dataFormatada}","${pedido.status}","${pedido.cliente}","${itensTexto}",${quantidadeTotal},${pedido.total.toFixed(2)},"${pedido.tipoEntrega}","${pedido.formaPagamento}"\n`;
    });
    
    // Cria e baixa o arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        // Nome do arquivo com data
        const hoje = new Date();
        const dataArquivo = hoje.toISOString().split('T')[0];
        let nomeArquivo = `pedidos_fjgeladao_${dataArquivo}`;
        
        if (filtroDataAtivo) {
            const inicioFormatado = dataInicioFiltro.toISOString().split('T')[0];
            const fimFormatado = dataFimFiltro.toISOString().split('T')[0];
            nomeArquivo = `pedidos_fjgeladao_${inicioFormatado}_a_${fimFormatado}`;
        }
        
        link.setAttribute('download', `${nomeArquivo}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        mostrarNotificacao(`${pedidosParaExportar.length} pedidos exportados com sucesso!`, 'success');
    } else {
        mostrarNotificacao('Seu navegador não suporta download de arquivos!', 'error');
    }
}
