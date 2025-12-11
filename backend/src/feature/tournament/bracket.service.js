import { Match } from '../../config/associations.js';

/**
 * Gera o chaveamento completo de Dupla Eliminação
 * 
 * Estrutura para 4 jogadores:
 * - Upper Round 1: 2 partidas
 * - Upper Final: 1 partida
 * - Lower Round 1: 1 partida (perdedores do upper round 1)
 * - Lower Final: 1 partida (vencedor lower round 1 vs perdedor upper final)
 * - Grand Final: 1 partida
 * 
 * @param {number} tournamentId - ID do torneio
 * @param {number[]} playerIds - Array de IDs dos jogadores (já embaralhados)
 */
export async function generateDoubleEliminationBracket(tournamentId, playerIds) {
    const numPlayers = playerIds.length;
    const numRoundsUpper = Math.log2(numPlayers);

    // Armazenar referências das partidas criadas
    const allMatches = []; // Array de todas as partidas para referência
    const upperMatches = {}; // { round: [matches] }
    const lowerMatches = {}; // { round: [matches] }
    let grandFinalMatch = null;

    // ================================
    // PARTE 1: CRIAR UPPER BRACKET
    // ================================

    // Round 1 do Upper: jogadores reais se enfrentam
    upperMatches[1] = [];
    const firstRoundMatchCount = numPlayers / 2;

    for (let i = 0; i < firstRoundMatchCount; i++) {
        const match = await Match.create({
            tournamentId,
            bracketType: 'upper',
            round: 1,
            position: i + 1,
            player1Id: playerIds[i * 2],
            player2Id: playerIds[i * 2 + 1]
        });
        upperMatches[1].push(match);
        allMatches.push(match);
    }

    // Rounds subsequentes do Upper (2, 3, ... até a final)
    for (let round = 2; round <= numRoundsUpper; round++) {
        upperMatches[round] = [];
        const matchesInRound = numPlayers / Math.pow(2, round);

        for (let i = 0; i < matchesInRound; i++) {
            const match = await Match.create({
                tournamentId,
                bracketType: 'upper',
                round,
                position: i + 1,
                player1Id: null,
                player2Id: null
            });
            upperMatches[round].push(match);
            allMatches.push(match);
        }
    }

    // ================================
    // PARTE 2: CRIAR LOWER BRACKET
    // ================================

    // Lower bracket structure depends on number of players
    // Para 4 jogadores: 2 rounds no lower
    // Para 8 jogadores: 4 rounds no lower
    // Para 16 jogadores: 6 rounds no lower
    const numLowerRounds = (numRoundsUpper - 1) * 2;

    let currentLowerMatchCount = numPlayers / 4; // Primeira rodada do lower

    for (let round = 1; round <= numLowerRounds; round++) {
        lowerMatches[round] = [];

        // Número de partidas varia: rounds ímpares recebem perdedores do upper
        // rounds pares são consolidação do lower
        let matchCount;
        if (round === 1) {
            matchCount = numPlayers / 4;
        } else if (round % 2 === 0) {
            // Round par: mesma quantidade que round anterior (consolidação)
            matchCount = lowerMatches[round - 1]?.length || 1;
        } else {
            // Round ímpar: metade do anterior
            matchCount = Math.max(1, Math.floor((lowerMatches[round - 1]?.length || 2) / 2));
        }

        // Garantir pelo menos 1 partida no lower final
        if (round === numLowerRounds) {
            matchCount = 1;
        }

        for (let i = 0; i < matchCount; i++) {
            const match = await Match.create({
                tournamentId,
                bracketType: 'lower',
                round,
                position: i + 1,
                player1Id: null,
                player2Id: null
            });
            lowerMatches[round].push(match);
            allMatches.push(match);
        }
    }

    // ================================
    // PARTE 3: CRIAR GRAND FINAL
    // ================================

    grandFinalMatch = await Match.create({
        tournamentId,
        bracketType: 'grand_final',
        round: 1,
        position: 1,
        player1Id: null,
        player2Id: null
    });
    allMatches.push(grandFinalMatch);

    // ================================
    // PARTE 4: CONFIGURAR PROGRESSÕES
    // ================================

    // 4.1 Upper Bracket: vencedor vai pro próximo round
    for (let round = 1; round < numRoundsUpper; round++) {
        const currentRound = upperMatches[round];
        const nextRound = upperMatches[round + 1];

        if (!currentRound || !nextRound) continue;

        for (let i = 0; i < currentRound.length; i++) {
            const currentMatch = currentRound[i];
            const nextMatchIndex = Math.floor(i / 2);
            const nextMatch = nextRound[nextMatchIndex];

            if (currentMatch && nextMatch) {
                await Match.update(
                    { nextMatchId: nextMatch.id },
                    { where: { id: currentMatch.id } }
                );
            }
        }
    }

    // 4.2 Upper Final vai para Grand Final
    const upperFinal = upperMatches[numRoundsUpper]?.[0];
    if (upperFinal && grandFinalMatch) {
        await Match.update(
            { nextMatchId: grandFinalMatch.id },
            { where: { id: upperFinal.id } }
        );
    }

    // 4.3 Lower Bracket progressions
    const lowerRoundNumbers = Object.keys(lowerMatches).map(Number).sort((a, b) => a - b);

    for (let i = 0; i < lowerRoundNumbers.length - 1; i++) {
        const currentRoundNum = lowerRoundNumbers[i];
        const nextRoundNum = lowerRoundNumbers[i + 1];
        const currentRound = lowerMatches[currentRoundNum];
        const nextRound = lowerMatches[nextRoundNum];

        if (!currentRound || !nextRound) continue;

        for (let j = 0; j < currentRound.length; j++) {
            const currentMatch = currentRound[j];
            let nextMatch;

            if (nextRound.length >= currentRound.length) {
                nextMatch = nextRound[j] || nextRound[0];
            } else {
                nextMatch = nextRound[Math.floor(j / 2)] || nextRound[0];
            }

            if (currentMatch && nextMatch) {
                await Match.update(
                    { nextMatchId: nextMatch.id },
                    { where: { id: currentMatch.id } }
                );
            }
        }
    }

    // 4.4 Lower Final vai para Grand Final
    const lastLowerRound = lowerRoundNumbers[lowerRoundNumbers.length - 1];
    const lowerFinal = lowerMatches[lastLowerRound]?.[0];

    if (lowerFinal && grandFinalMatch) {
        await Match.update(
            { nextMatchId: grandFinalMatch.id },
            { where: { id: lowerFinal.id } }
        );
    }

    // 4.5 Configurar loserNextMatchId para Upper Rounds
    // Perdedores do Upper Round 1 vão para Lower Round 1
    if (upperMatches[1] && lowerMatches[1]) {
        for (let i = 0; i < upperMatches[1].length; i++) {
            const upperMatch = upperMatches[1][i];
            const loserMatchIndex = Math.floor(i / 2);
            const lowerMatch = lowerMatches[1][loserMatchIndex];

            if (upperMatch && lowerMatch) {
                await Match.update(
                    { loserNextMatchId: lowerMatch.id },
                    { where: { id: upperMatch.id } }
                );
            }
        }
    }

    // Perdedores de Upper Rounds posteriores também vão para Lower
    for (let round = 2; round <= numRoundsUpper; round++) {
        const upperRound = upperMatches[round];
        // Perdedores vão para rounds específicos do lower
        const targetLowerRound = (round - 1) * 2;
        const lowerRound = lowerMatches[targetLowerRound];

        if (!upperRound || !lowerRound) continue;

        for (let i = 0; i < upperRound.length; i++) {
            const upperMatch = upperRound[i];
            const lowerMatch = lowerRound[i] || lowerRound[0];

            if (upperMatch && lowerMatch) {
                await Match.update(
                    { loserNextMatchId: lowerMatch.id },
                    { where: { id: upperMatch.id } }
                );
            }
        }
    }

    // Retornar IDs para referência
    const result = {
        upperMatches: {},
        lowerMatches: {},
        grandFinalId: grandFinalMatch.id
    };

    for (const round in upperMatches) {
        result.upperMatches[round] = upperMatches[round].map(m => m.id);
    }

    for (const round in lowerMatches) {
        result.lowerMatches[round] = lowerMatches[round].map(m => m.id);
    }

    return result;
}
