function criarConjuntoDomino() {
  const pecas = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      pecas.push([i, j]);
    }
  }
  return pecas;
}

function embaralhar(lista) {
  const copia = lista.map((p) => [...p]);
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function criarJogoDomino({ jogadores = ['Jogador 1', 'Jogador 2'], pecasPorJogador = 7 } = {}) {
  if (!Array.isArray(jogadores) || jogadores.length < 2) {
    throw new Error('É necessário informar pelo menos 2 jogadores.');
  }

  const baralho = embaralhar(criarConjuntoDomino());
  const maos = {};

  for (const jogador of jogadores) {
    maos[jogador] = baralho.splice(0, pecasPorJogador);
  }

  return {
    jogadores: [...jogadores],
    maos,
    monte: baralho,
    mesa: [],
    turnoAtual: 0,
    passesConsecutivos: 0,
    status: 'em_andamento',
    vencedor: null,
  };
}

function obterPontasMesa(mesa) {
  if (!Array.isArray(mesa) || mesa.length === 0) {
    return { esquerda: null, direita: null };
  }
  return {
    esquerda: mesa[0][0],
    direita: mesa[mesa.length - 1][1],
  };
}

function podeEncaixarPeca(peca, mesa) {
  if (!Array.isArray(peca) || peca.length !== 2) {
    return false;
  }
  if (!Array.isArray(mesa) || mesa.length === 0) {
    return true;
  }

  const [a, b] = peca;
  const { esquerda, direita } = obterPontasMesa(mesa);

  return a === esquerda || b === esquerda || a === direita || b === direita;
}

function orientarPecaParaLado(peca, lado, mesa) {
  const [a, b] = peca;

  if (mesa.length === 0) {
    return [a, b];
  }

  const { esquerda, direita } = obterPontasMesa(mesa);

  if (lado === 'esquerda') {
    if (b === esquerda) return [a, b];
    if (a === esquerda) return [b, a];
    throw new Error(`Peça [${a}, ${b}] não encaixa na ponta esquerda (${esquerda}).`);
  }

  if (lado === 'direita') {
    if (a === direita) return [a, b];
    if (b === direita) return [b, a];
    throw new Error(`Peça [${a}, ${b}] não encaixa na ponta direita (${direita}).`);
  }

  throw new Error(`Lado inválido: ${lado}. Use 'esquerda' ou 'direita'.`);
}

function calcularPontosMao(mao) {
  return mao.reduce((soma, [a, b]) => soma + a + b, 0);
}

function determinarVencedorPorPontos(estado) {
  let menorPontuacao = Infinity;
  let vencedor = null;
  let empate = false;

  for (const jogador of estado.jogadores) {
    const pontos = calcularPontosMao(estado.maos[jogador]);
    if (pontos < menorPontuacao) {
      menorPontuacao = pontos;
      vencedor = jogador;
      empate = false;
    } else if (pontos === menorPontuacao) {
      empate = true;
    }
  }

  return empate ? { status: 'empate', vencedor: null } : { status: 'finalizado', vencedor };
}

function jogarPeca(estado, jogador, peca, lado = 'direita') {
  if (estado.status !== 'em_andamento') {
    throw new Error('O jogo já foi encerrado.');
  }

  const jogadorDaVez = estado.jogadores[estado.turnoAtual];
  if (jogador !== jogadorDaVez) {
    throw new Error(`Não é a vez de ${jogador}. Vez de ${jogadorDaVez}.`);
  }

  const maoAtual = estado.maos[jogador];
  const indicePeca = maoAtual.findIndex(
    ([x, y]) => (x === peca[0] && y === peca[1]) || (x === peca[1] && y === peca[0])
  );

  if (indicePeca === -1) {
    throw new Error(`O jogador ${jogador} não possui a peça [${peca[0]}, ${peca[1]}].`);
  }

  const pecaSelecionada = maoAtual[indicePeca];
  const pecaOrientada = orientarPecaParaLado(pecaSelecionada, lado, estado.mesa);

  const novaMesa =
    lado === 'esquerda' ? [pecaOrientada, ...estado.mesa] : [...estado.mesa, pecaOrientada];

  const novaMao = maoAtual.filter((_, idx) => idx !== indicePeca);
  const novasMaos = {
    ...estado.maos,
    [jogador]: novaMao,
  };

  if (novaMao.length === 0) {
    return {
      ...estado,
      maos: novasMaos,
      mesa: novaMesa,
      passesConsecutivos: 0,
      status: 'finalizado',
      vencedor: jogador,
    };
  }

  return {
    ...estado,
    maos: novasMaos,
    mesa: novaMesa,
    turnoAtual: (estado.turnoAtual + 1) % estado.jogadores.length,
    passesConsecutivos: 0,
  };
}

function comprarPeca(estado, jogador) {
  if (estado.status !== 'em_andamento') {
    throw new Error('O jogo já foi encerrado.');
  }

  const jogadorDaVez = estado.jogadores[estado.turnoAtual];
  if (jogador !== jogadorDaVez) {
    throw new Error(`Não é a vez de ${jogador}. Vez de ${jogadorDaVez}.`);
  }

  if (estado.monte.length === 0) {
    throw new Error('O monte está vazio.');
  }

  const novoMonte = [...estado.monte];
  const pecaComprada = novoMonte.pop();

  return {
    ...estado,
    maos: {
      ...estado.maos,
      [jogador]: [...estado.maos[jogador], pecaComprada],
    },
    monte: novoMonte,
  };
}

function passarVez(estado, jogador) {
  if (estado.status !== 'em_andamento') {
    throw new Error('O jogo já foi encerrado.');
  }

  const jogadorDaVez = estado.jogadores[estado.turnoAtual];
  if (jogador !== jogadorDaVez) {
    throw new Error(`Não é a vez de ${jogador}. Vez de ${jogadorDaVez}.`);
  }

  const temJogadaValida = estado.maos[jogador].some((p) => podeEncaixarPeca(p, estado.mesa));
  if (temJogadaValida) {
    throw new Error(`O jogador ${jogador} possui jogada válida e não pode passar.`);
  }

  const novosPasses = estado.passesConsecutivos + 1;
  const proximoTurno = (estado.turnoAtual + 1) % estado.jogadores.length;

  const proximoEstadoBase = {
    ...estado,
    turnoAtual: proximoTurno,
    passesConsecutivos: novosPasses,
  };

  if (estado.monte.length === 0 && novosPasses >= estado.jogadores.length) {
    const resultado = determinarVencedorPorPontos(proximoEstadoBase);
    return {
      ...proximoEstadoBase,
      status: resultado.status,
      vencedor: resultado.vencedor,
    };
  }

  return proximoEstadoBase;
}

module.exports = {
  criarConjuntoDomino,
  criarJogoDomino,
  obterPontasMesa,
  podeEncaixarPeca,
  jogarPeca,
  comprarPeca,
  passarVez,
  calcularPontosMao,
};