import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateRoomCode(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let result = "";
	for (let i = 0; i < 6; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

function areAllNightActionsComplete(room: any): {
	complete: boolean;
	pending: string[];
} {
	const pending: string[] = [];

	// Only check during night phase
	if (room.gamePhase !== "night") {
		return { complete: true, pending: [] };
	}

	// Get all alive players with roles (excluding narrator)
	const actualPlayers = room.players.filter((p: any) => p.id !== room.leaderId);
	const aliveMafia = actualPlayers.filter(
		(p: any) => p.isAlive && p.role === "mafia",
	);
	const aliveDoctor = actualPlayers.find(
		(p: any) => p.isAlive && p.role === "doctor",
	);
	const aliveDetective = actualPlayers.find(
		(p: any) => p.isAlive && p.role === "detective",
	);

	const currentVotes = room.currentVotes || [];
	const nightActions = room.nightActions || [];

	// Check if all alive mafia have voted or abstained
	for (const mafiaPlayer of aliveMafia) {
		const hasVoted = currentVotes.some(
			(vote: any) =>
				vote.voterId === mafiaPlayer.id && vote.voteType === "mafia",
		);
		if (!hasVoted) {
			pending.push(`${mafiaPlayer.name} (Mafia Vote)`);
		}
	}

	// Check if alive doctor has acted or abstained
	if (aliveDoctor) {
		const hasActed = nightActions.some(
			(action: any) =>
				action.playerId === aliveDoctor.id && action.action === "protect",
		);
		if (!hasActed) {
			pending.push(`${aliveDoctor.name} (Doctor Action)`);
		}
	}

	// Check if alive detective has acted or abstained
	if (aliveDetective) {
		const hasActed = nightActions.some(
			(action: any) =>
				action.playerId === aliveDetective.id &&
				action.action === "investigate",
		);
		if (!hasActed) {
			pending.push(`${aliveDetective.name} (Detective Action)`);
		}
	}

	return { complete: pending.length === 0, pending };
}

function checkWinCondition(
	players: any[],
	narratorId: string,
): {
	winner: string | null;
	gameEnded: boolean;
} {
	// Only count actual players (exclude narrator from win condition calculations)
	const actualPlayers = players.filter((p) => p.id !== narratorId);
	const alivePlayers = actualPlayers.filter((p) => p.isAlive);
	const aliveMafia = alivePlayers.filter((p) => p.role === "mafia");
	const aliveTownspeople = alivePlayers.filter(
		(p) => p.role !== "mafia" && p.role,
	); // Has a role (not narrator)

	// Mafia wins if they equal or outnumber townspeople
	if (aliveMafia.length >= aliveTownspeople.length && aliveMafia.length > 0) {
		return { winner: "mafia", gameEnded: true };
	}

	// Townspeople win if all mafia are eliminated
	if (aliveMafia.length === 0 && aliveTownspeople.length > 0) {
		return { winner: "townspeople", gameEnded: true };
	}

	// Game continues
	return { winner: null, gameEnded: false };
}

function assignRolesToPlayers(players: any[], narratorId: string): any[] {
	// Separate narrator from actual players
	const actualPlayers = players.filter((p) => p.id !== narratorId);
	const narrator = players.find((p) => p.id === narratorId);

	const shuffledPlayers = [...actualPlayers].sort(() => Math.random() - 0.5);
	const playerCount = shuffledPlayers.length;

	// Calculate role distribution (only for non-narrator players)
	const mafiaCount = Math.max(1, Math.floor(playerCount / 4));
	const hasDetective = playerCount >= 4;
	const hasDoctor = playerCount >= 5;

	const roles: string[] = [];

	// Add mafia roles
	for (let i = 0; i < mafiaCount; i++) {
		roles.push("mafia");
	}

	// Add special roles
	if (hasDetective) roles.push("detective");
	if (hasDoctor) roles.push("doctor");

	// Fill remaining with citizens
	while (roles.length < playerCount) {
		roles.push("citizen");
	}

	// Assign roles to players (excluding narrator)
	const playersWithRoles = shuffledPlayers.map((player, index) => ({
		...player,
		role: roles[index],
		isAlive: true,
	}));

	// Add narrator back without role (they don't play)
	if (narrator) {
		playersWithRoles.push({
			...narrator,
			// Narrator gets no role and is not "alive" in game terms
		});
	}

	return playersWithRoles;
}

export const createRoom = mutation({
	args: {
		leaderId: v.string(),
	},
	handler: async (ctx, args) => {
		let code: string;
		let attempts = 0;
		const maxAttempts = 10;

		do {
			code = generateRoomCode();
			const existingRoom = await ctx.db
				.query("rooms")
				.withIndex("by_code", (q) => q.eq("code", code))
				.first();

			if (!existingRoom) {
				break;
			}
			attempts++;
		} while (attempts < maxAttempts);

		if (attempts >= maxAttempts) {
			throw new Error("Failed to generate unique room code");
		}

		const roomId = await ctx.db.insert("rooms", {
			code,
			leaderId: args.leaderId,
			status: "waiting",
			players: [],
		});

		return { id: roomId, code, leaderId: args.leaderId };
	},
});

export const getRoomByCode = query({
	args: { code: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("rooms")
			.withIndex("by_code", (q) => q.eq("code", args.code))
			.first();
	},
});

export const joinRoom = mutation({
	args: {
		code: v.string(),
		playerId: v.string(),
		playerName: v.string(),
	},
	handler: async (ctx, args) => {
		const room = await ctx.db
			.query("rooms")
			.withIndex("by_code", (q) => q.eq("code", args.code))
			.first();

		if (!room) {
			throw new Error("Room not found");
		}

		if (room.status !== "waiting") {
			throw new Error("Room is not accepting new players");
		}

		// Check if player already exists (reconnection)
		const existingPlayerIndex = room.players.findIndex(
			(p) => p.id === args.playerId,
		);

		if (existingPlayerIndex >= 0) {
			// Player reconnecting - update name if changed
			const updatedPlayers = [...room.players];
			updatedPlayers[existingPlayerIndex].name = args.playerName;
			await ctx.db.patch(room._id, { players: updatedPlayers });
		} else {
			// New player joining
			const updatedPlayers = [
				...room.players,
				{
					id: args.playerId,
					name: args.playerName,
				},
			];
			await ctx.db.patch(room._id, { players: updatedPlayers });
		}

		return await ctx.db.get(room._id);
	},
});

export const startGame = mutation({
	args: {
		code: v.string(),
		leaderId: v.string(),
	},
	handler: async (ctx, args) => {
		const room = await ctx.db
			.query("rooms")
			.withIndex("by_code", (q) => q.eq("code", args.code))
			.first();

		if (!room) {
			throw new Error("Room not found");
		}

		if (room.leaderId !== args.leaderId) {
			throw new Error("Only the room leader can start the game");
		}

		if (room.status !== "waiting") {
			throw new Error("Game cannot be started");
		}

		// Count actual players (excluding narrator)
		const actualPlayers = room.players.filter((p) => p.id !== room.leaderId);
		const playerCount = actualPlayers.length;

		// Need at least 3 actual players to play (narrator doesn't count)
		if (playerCount < 3) {
			throw new Error("Need at least 3 players to start the game");
		}

		// Assign roles to players (excluding narrator)
		const playersWithRoles = assignRolesToPlayers(room.players, room.leaderId);

		await ctx.db.patch(room._id, {
			status: "active",
			gamePhase: "day",
			players: playersWithRoles,
		});

		return await ctx.db.get(room._id);
	},
});

export const transferLeadership = mutation({
	args: {
		code: v.string(),
		currentLeaderId: v.string(),
		newLeaderId: v.string(),
	},
	handler: async (ctx, args) => {
		const room = await ctx.db
			.query("rooms")
			.withIndex("by_code", (q) => q.eq("code", args.code))
			.first();

		if (!room) {
			throw new Error("Room not found");
		}

		if (room.leaderId !== args.currentLeaderId) {
			throw new Error("Only the current leader can transfer leadership");
		}

		if (room.status !== "waiting") {
			throw new Error(
				"Leadership can only be transferred before the game starts",
			);
		}

		// Verify new leader is in the players list
		const newLeader = room.players.find((p) => p.id === args.newLeaderId);
		if (!newLeader) {
			throw new Error("New leader must be a player in the room");
		}

		await ctx.db.patch(room._id, {
			leaderId: args.newLeaderId,
		});

		return await ctx.db.get(room._id);
	},
});

export const advancePhase = mutation({
	args: {
		code: v.string(),
		narratorId: v.string(),
	},
	handler: async (ctx, args) => {
		const room = await ctx.db
			.query("rooms")
			.withIndex("by_code", (q) => q.eq("code", args.code))
			.first();

		if (!room) {
			throw new Error("Room not found");
		}

		if (room.leaderId !== args.narratorId) {
			throw new Error("Only the narrator can advance phases");
		}

		if (room.status !== "active") {
			throw new Error("Game must be active to advance phases");
		}

		const currentPhase = room.gamePhase || "day";
		const nextPhase = currentPhase === "day" ? "night" : "day";

		// Generate atmospheric phase transition messages
		const transitionMessages = {
			toNight: [
				"🌙 Night falls over the town... The streets grow quiet as shadows begin to move.",
				"🌃 Darkness descends upon the village. The Mafia emerges from hiding.",
				"🌌 The town sleeps, but evil never rests. Night has begun.",
				"🌙 Under the cover of darkness, the Mafia begins their hunt.",
			],
			toDay: [
				"🌅 Dawn breaks over the town. What secrets did the night reveal?",
				"☀️ Morning light exposes the night's events. The town gathers to learn their fate.",
				"🌄 A new day begins. The townspeople emerge to discover what happened in the darkness.",
				"🌞 The sun rises, bringing truth and consequence to light.",
			],
		};

		const randomMessage =
			nextPhase === "night"
				? transitionMessages.toNight[
						Math.floor(Math.random() * transitionMessages.toNight.length)
					]
				: transitionMessages.toDay[
						Math.floor(Math.random() * transitionMessages.toDay.length)
					];

		const updateData: any = {
			gamePhase: nextPhase,
			phaseTransitionMessage: randomMessage,
		};

		// Clear night actions when transitioning from night to day
		// This resets the locks for the next night phase
		if (currentPhase === "night" && nextPhase === "day") {
			updateData.nightActions = [];
		}

		// Clear elimination result when transitioning from day to night
		// So it only shows the most recent elimination
		if (currentPhase === "day" && nextPhase === "night") {
			updateData.lastEliminationResult = "";
		}

		// Add to game history
		const gameHistory = room.gameHistory || [];
		gameHistory.push({
			timestamp: Date.now(),
			event: nextPhase === "night" ? "phase_night" : "phase_day",
			description:
				nextPhase === "night" ? "Night phase began" : "Day phase began",
		});
		updateData.gameHistory = gameHistory;

		await ctx.db.patch(room._id, updateData);

		return await ctx.db.get(room._id);
	},
});

export const endGame = mutation({
	args: {
		code: v.string(),
		narratorId: v.string(),
		winningTeam: v.optional(
			v.union(v.literal("mafia"), v.literal("townspeople")),
		),
	},
	handler: async (ctx, args) => {
		const room = await ctx.db
			.query("rooms")
			.withIndex("by_code", (q) => q.eq("code", args.code))
			.first();

		if (!room) {
			throw new Error("Room not found");
		}

		if (room.leaderId !== args.narratorId) {
			throw new Error("Only the narrator can end the game");
		}

		if (room.status !== "active") {
			throw new Error("Game must be active to end it");
		}

		await ctx.db.patch(room._id, {
			status: "finished",
		});

		return await ctx.db.get(room._id);
	},
});

export const castVote = mutation({
	args: {
		code: v.string(),
		voterId: v.string(),
		targetId: v.union(v.string(), v.literal("ABSTAIN")),
		voteType: v.union(v.literal("day"), v.literal("mafia")),
	},
	handler: async (ctx, args) => {
		const room = await ctx.db
			.query("rooms")
			.withIndex("by_code", (q) => q.eq("code", args.code))
			.first();

		if (!room) {
			throw new Error("Room not found");
		}

		if (room.status !== "active") {
			throw new Error("Game must be active to vote");
		}

		// Validate voter is alive and in the game
		const voter = room.players.find((p) => p.id === args.voterId);
		if (!voter || !voter.isAlive) {
			throw new Error("Only alive players can vote");
		}

		// Validate target (allow ABSTAIN or alive players)
		if (args.targetId !== "ABSTAIN") {
			const target = room.players.find((p) => p.id === args.targetId);
			if (!target || !target.isAlive) {
				throw new Error("Can only vote for alive players");
			}

			// Cannot vote for the narrator
			if (args.targetId === room.leaderId) {
				throw new Error("Cannot vote against the narrator");
			}
		}

		// Validate vote type matches current phase
		if (args.voteType === "day" && room.gamePhase !== "day") {
			throw new Error("Day votes can only be cast during day phase");
		}
		if (args.voteType === "mafia" && room.gamePhase !== "night") {
			throw new Error("Mafia votes can only be cast during night phase");
		}

		// Validate mafia voting permissions
		if (args.voteType === "mafia" && voter.role !== "mafia") {
			throw new Error("Only mafia members can cast mafia votes");
		}

		const currentVotes = room.currentVotes || [];

		// Remove any existing vote from this voter of the same type
		const filteredVotes = currentVotes.filter(
			(vote) =>
				!(vote.voterId === args.voterId && vote.voteType === args.voteType),
		);

		// Add the new vote
		const newVotes = [
			...filteredVotes,
			{
				voterId: args.voterId,
				targetId: args.targetId,
				voteType: args.voteType,
			},
		];

		await ctx.db.patch(room._id, {
			currentVotes: newVotes,
		});

		return await ctx.db.get(room._id);
	},
});

export const executeVotes = mutation({
	args: {
		code: v.string(),
		narratorId: v.string(),
		voteType: v.union(v.literal("day"), v.literal("mafia")),
	},
	handler: async (ctx, args) => {
		const room = await ctx.db
			.query("rooms")
			.withIndex("by_code", (q) => q.eq("code", args.code))
			.first();

		if (!room) {
			throw new Error("Room not found");
		}

		if (room.leaderId !== args.narratorId) {
			throw new Error("Only the narrator can execute votes");
		}

		if (room.status !== "active") {
			throw new Error("Game must be active to execute votes");
		}

		// Check if all night actions are complete (only for mafia votes)
		if (args.voteType === "mafia") {
			const actionStatus = areAllNightActionsComplete(room);
			if (!actionStatus.complete) {
				throw new Error(
					`Cannot execute mafia votes. Still waiting for: ${actionStatus.pending.join(", ")}`,
				);
			}
		}

		const currentVotes = room.currentVotes || [];
		const relevantVotes = currentVotes.filter(
			(vote) => vote.voteType === args.voteType,
		);

		if (relevantVotes.length === 0) {
			throw new Error("No votes to execute");
		}

		// Count votes for each target
		const voteCounts: { [targetId: string]: number } = {};
		for (const vote of relevantVotes) {
			voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
		}

		// Find the target with the most votes
		let maxVotes = 0;
		let eliminatedPlayerId = "";
		for (const [targetId, count] of Object.entries(voteCounts)) {
			if (count > maxVotes) {
				maxVotes = count;
				eliminatedPlayerId = targetId;
			}
		}

		// Check for doctor protection (only applies to mafia eliminations)
		let actualEliminatedPlayerId = eliminatedPlayerId;
		let eliminationResult = "";

		if (args.voteType === "mafia" && eliminatedPlayerId) {
			// Find doctor protection for this night
			const doctorProtection = room.nightActions?.find(
				(action) => action.action === "protect" && action.isLocked,
			);

			// Check if the doctor protected the mafia's target
			if (
				doctorProtection &&
				doctorProtection.targetId === eliminatedPlayerId
			) {
				actualEliminatedPlayerId = ""; // No elimination due to protection
				const protectedPlayer = room.players.find(
					(p) => p.id === eliminatedPlayerId,
				);
				const doctor = room.players.find(
					(p) => p.id === doctorProtection.playerId,
				);
				const protectionStories = [
					`🛡️ The town awakens to a miracle! ${protectedPlayer?.name} was marked for death, but the doctor's watchful eyes and steady hands saved them from the shadows.`,
					`✨ Fortune smiled upon ${protectedPlayer?.name}! The doctor's intervention turned what should have been a tragedy into hope.`,
					`⚕️ The Mafia crept through the darkness toward ${protectedPlayer?.name}, but found only empty air—the doctor had spirited them away to safety.`,
					`🙏 ${protectedPlayer?.name} draws breath this morning only by grace of the doctor's protection. The town has been spared a loss.`,
				];
				eliminationResult =
					protectionStories[
						Math.floor(Math.random() * protectionStories.length)
					];
			} else {
				const eliminatedPlayer = room.players.find(
					(p) => p.id === eliminatedPlayerId,
				);
				const mafiaEliminationStories = [
					`💀 The town wakes to find ${eliminatedPlayer?.name} cold and still. The Mafia's work is done.`,
					`⚰️ ${eliminatedPlayer?.name} did not survive the night. Their silence will haunt the town forever.`,
					`🕯️ The morning reveals tragedy: ${eliminatedPlayer?.name} has been claimed by the darkness.`,
					`💔 ${eliminatedPlayer?.name}'s house stands empty this morning. The Mafia has struck again.`,
				];
				eliminationResult =
					mafiaEliminationStories[
						Math.floor(Math.random() * mafiaEliminationStories.length)
					];
			}
		} else if (args.voteType === "day" && eliminatedPlayerId) {
			const eliminatedPlayer = room.players.find(
				(p) => p.id === eliminatedPlayerId,
			);
			const dayEliminationStories = [
				`⚖️ The town has spoken! ${eliminatedPlayer?.name} was cast out by majority decision.`,
				`🗳️ After heated debate, the townspeople chose ${eliminatedPlayer?.name}'s fate. Justice... or mistake?`,
				`👥 The voices of the town rang as one: ${eliminatedPlayer?.name} must go. Let history judge this decision.`,
				`🏛️ Democracy has decided: ${eliminatedPlayer?.name} was eliminated by the will of the people.`,
			];
			eliminationResult =
				dayEliminationStories[
					Math.floor(Math.random() * dayEliminationStories.length)
				];
		}

		// Eliminate the player (if not protected)
		const updatedPlayers = room.players.map((player) =>
			actualEliminatedPlayerId && player.id === actualEliminatedPlayerId
				? { ...player, isAlive: false }
				: player,
		);

		// Clear votes of the executed type
		const remainingVotes = currentVotes.filter(
			(vote) => vote.voteType !== args.voteType,
		);

		// Check win condition
		const winCondition = checkWinCondition(updatedPlayers, room.leaderId);

		// Add elimination to game history
		const gameHistory = room.gameHistory || [];
		if (actualEliminatedPlayerId) {
			const eliminatedPlayerName = room.players.find(
				(p) => p.id === actualEliminatedPlayerId,
			)?.name;
			gameHistory.push({
				timestamp: Date.now(),
				event:
					args.voteType === "day" ? "day_elimination" : "mafia_elimination",
				description: `${eliminatedPlayerName} was eliminated during ${args.voteType} phase`,
			});
		}

		const updateData: any = {
			players: updatedPlayers,
			currentVotes: remainingVotes,
			lastEliminationResult: eliminationResult,
			gameHistory: gameHistory,
		};

		// End game if win condition is met
		if (winCondition.gameEnded) {
			updateData.status = "finished";
		}

		await ctx.db.patch(room._id, updateData);

		return await ctx.db.get(room._id);
	},
});

export const performNightAction = mutation({
	args: {
		code: v.string(),
		playerId: v.string(),
		action: v.union(v.literal("investigate"), v.literal("protect")),
		targetId: v.union(v.string(), v.literal("ABSTAIN")),
	},
	handler: async (ctx, args) => {
		const room = await ctx.db
			.query("rooms")
			.withIndex("by_code", (q) => q.eq("code", args.code))
			.first();

		if (!room) {
			throw new Error("Room not found");
		}

		if (room.status !== "active") {
			throw new Error("Game must be active to perform actions");
		}

		if (room.gamePhase !== "night") {
			throw new Error("Night actions can only be performed during night phase");
		}

		// Validate player is alive and has the correct role
		const player = room.players.find((p) => p.id === args.playerId);
		if (!player || !player.isAlive) {
			throw new Error("Only alive players can perform actions");
		}

		if (args.action === "investigate" && player.role !== "detective") {
			throw new Error("Only detectives can investigate");
		}
		if (args.action === "protect" && player.role !== "doctor") {
			throw new Error("Only doctors can protect");
		}

		// Validate target (allow ABSTAIN or alive players)
		if (args.targetId !== "ABSTAIN") {
			const target = room.players.find((p) => p.id === args.targetId);
			if (!target || !target.isAlive) {
				throw new Error("Can only target alive players");
			}

			// Cannot target the narrator
			if (args.targetId === room.leaderId) {
				throw new Error("Cannot target the narrator");
			}

			// Detectives can't investigate themselves, doctors can protect themselves
			if (args.action === "investigate" && args.playerId === args.targetId) {
				throw new Error("Detectives cannot investigate themselves");
			}
		}

		const currentActions = room.nightActions || [];

		// Check if player already has a locked action
		const existingAction = currentActions.find(
			(action) =>
				action.playerId === args.playerId && action.action === args.action,
		);

		if (existingAction && existingAction.isLocked) {
			throw new Error(
				`${args.action === "investigate" ? "Detective" : "Doctor"} has already performed their ${args.action} for this night`,
			);
		}

		// Remove any existing action from this player
		const filteredActions = currentActions.filter(
			(action) => action.playerId !== args.playerId,
		);

		// Add the new action and lock it immediately
		const newActions = [
			...filteredActions,
			{
				playerId: args.playerId,
				action: args.action,
				targetId: args.targetId,
				isLocked: true, // Lock the action immediately
			},
		];

		await ctx.db.patch(room._id, {
			nightActions: newActions,
		});

		return await ctx.db.get(room._id);
	},
});

export const getNightActionResult = query({
	args: {
		code: v.string(),
		playerId: v.string(),
	},
	handler: async (ctx, args) => {
		const room = await ctx.db
			.query("rooms")
			.withIndex("by_code", (q) => q.eq("code", args.code))
			.first();

		if (!room) {
			throw new Error("Room not found");
		}

		const player = room.players.find((p) => p.id === args.playerId);
		if (!player || player.role !== "detective") {
			return null; // Only detectives get investigation results
		}

		// Find the detective's investigation from the previous night
		const investigation = room.nightActions?.find(
			(action) =>
				action.playerId === args.playerId && action.action === "investigate",
		);

		if (!investigation) {
			return null;
		}

		const target = room.players.find((p) => p.id === investigation.targetId);
		if (!target) {
			return null;
		}

		return {
			targetName: target.name,
			targetRole: target.role,
		};
	},
});
