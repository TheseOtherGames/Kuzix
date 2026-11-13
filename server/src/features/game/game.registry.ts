import type { Game, GamePlayer } from './game';

// In-memory games, a server restart drops live games (runs stay open in DB and restart from the lobby).
// Keyed by quiz id: the code changes (regenerated at each session end or on demand), the id never does.
export const games = new Map<number, Game>();

export const abortGame = (quizId: number): void => {
	games.get(quizId)?.abort();
	games.delete(quizId);
};

export const findPlayerByToken = (token: string): { game: Game; player: GamePlayer } | null => {
	for (const game of games.values()) {
		const player = [...game.players.values()].find((candidate) => candidate.token === token);
		if (player) {
			return { game, player };
		}
	}

	return null;
};
