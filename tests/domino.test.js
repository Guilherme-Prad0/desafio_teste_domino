const {
  criarConjuntoDomino,
  criarJogoDomino,
  obterPontasMesa,
  podeEncaixarPeca,
  jogarPeca,
  comprarPeca,
  passarVez,
  calcularPontosMao,
} = require('../src/domino');

describe('Dominó', () => {
  test('deve criar um conjunto duplo-6 completo com 28 peças únicas', () => {
    const pecas = criarConjuntoDomino();

    expect(pecas).toHaveLength(28);

    const chavesUnicas = new Set(
      pecas.map(([a, b]) => [Math.min(a, b), Math.max(a, b)].join('-'))
    );
    expect(chavesUnicas.size).toBe(28);
  });

  test('deve iniciar partida distribuindo peças aos jogadores e mantendo o restante no monte', () => {
    const jogo = criarJogoDomino({ jogadores: ['Ana', 'Bruno'], pecasPorJogador: 7 });

    expect(jogo.jogadores).toEqual(['Ana', 'Bruno']);
    expect(jogo.maos.Ana).toHaveLength(7);
    expect(jogo.maos.Bruno).toHaveLength(7);
    expect(jogo.monte).toHaveLength(14);
    expect(jogo.mesa).toEqual([]);
    expect(jogo.status).toBe('em_andamento');
  });

  test('deve encaixar peça compatível na mesa rotacionando quando necessário', () => {
      let jogo = criarJogoDomino({ jogadores: ['Ana', 'Bruno'], pecasPorJogador: 0 });
      jogo.maos.Ana = [[6, 2], [1, 1]];
      jogo.maos.Bruno = [[2, 5], [4, 4]];

      jogo = jogarPeca(jogo, 'Ana', [6, 2], 'direita');
      expect(obterPontasMesa(jogo.mesa)).toEqual({ esquerda: 6, direita: 2 });
      expect(jogo.turnoAtual).toBe(1);

      // Bruno tem [2, 5], que já encaixa na ponta direita (2)
      jogo = jogarPeca(jogo, 'Bruno', [2, 5], 'direita');
      expect(obterPontasMesa(jogo.mesa)).toEqual({ esquerda: 6, direita: 5 });
    });

  test('deve rejeitar jogada com peça que não encaixa na ponta escolhida ou fora do turno', () => {
    let jogo = criarJogoDomino({ jogadores: ['Ana', 'Bruno'], pecasPorJogador: 0 });
    jogo.maos.Ana = [[4, 1]];
    jogo.maos.Bruno = [[3, 3]];

    // Jogador errado no turno 0
    expect(() => jogarPeca(jogo, 'Bruno', [3, 3], 'direita')).toThrow();

    jogo = jogarPeca(jogo, 'Ana', [4, 1], 'direita');
    // [3, 3] não encaixa nem na ponta 4 nem na ponta 1
    expect(podeEncaixarPeca([3, 3], jogo.mesa)).toBe(false);
    expect(() => jogarPeca(jogo, 'Bruno', [3, 3], 'direita')).toThrow();
  });

  test('deve permitir comprar peça do monte quando necessário', () => {
    let jogo = criarJogoDomino({ jogadores: ['Ana', 'Bruno'], pecasPorJogador: 0 });
    jogo.maos.Ana = [[1, 1]];
    jogo.monte = [[5, 6]];

    jogo = comprarPeca(jogo, 'Ana');
    expect(jogo.maos.Ana).toHaveLength(2);
    expect(jogo.monte).toHaveLength(0);
  });

  test('deve declarar vencedor ao zerar as peças da mão', () => {
    let jogo = criarJogoDomino({ jogadores: ['Ana', 'Bruno'], pecasPorJogador: 0 });
    jogo.maos.Ana = [[3, 6]];
    jogo.maos.Bruno = [[1, 2]];

    jogo = jogarPeca(jogo, 'Ana', [3, 6], 'direita');

    expect(jogo.status).toBe('finalizado');
    expect(jogo.vencedor).toBe('Ana');
  });

  test('deve encerrar por menor pontuação quando o jogo trava sem peças no monte', () => {
    let jogo = criarJogoDomino({ jogadores: ['Ana', 'Bruno'], pecasPorJogador: 0 });
    jogo.mesa = [[0, 0]];
    jogo.monte = [];
    jogo.maos.Ana = [[1, 2]]; // 3 pontos
    jogo.maos.Bruno = [[6, 6]]; // 12 pontos

    expect(calcularPontosMao(jogo.maos.Ana)).toBe(3);
    expect(calcularPontosMao(jogo.maos.Bruno)).toBe(12);

    jogo = passarVez(jogo, 'Ana');
    expect(jogo.status).toBe('em_andamento');

    jogo = passarVez(jogo, 'Bruno');
    expect(jogo.status).toBe('finalizado');
    expect(jogo.vencedor).toBe('Ana');
  });
});