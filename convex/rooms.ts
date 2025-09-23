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

function checkWinCondition(players: any[]): {
	winner: string | null;
	gameEnded: boolean;
} {
	const alivePlayers = players.filter((p) => p.isAlive);
	const aliveMafia = alivePlayers.filter((p) => p.role === "mafia");
	const aliveTownspeople = alivePlayers.filter((p) => p.role !== "mafia");

	// Mafia wins if they equal or outnumber townspeople
	if (aliveMafia.length >= aliveTownspeople.length && aliveMafia.length > 0) {
		return { winner: "mafia", gameEnded: true };
	}

	// Townspeople win if all mafia are eliminated
	if (aliveMafia.length === 0) {
		return { winner: "townspeople", gameEnded: true };
	}

	// Game continues
	return { winner: null, gameEnded: false };
}

function assignRolesToPlayers(players: any[]): any[] {
	const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
	const playerCount = shuffledPlayers.length;

	// Calculate role distribution
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

	// Assign roles to players
	return shuffledPlayers.map((player, index) => ({
		...player,
		role: roles[index],
		isAlive: true,
	}));
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

		// Count actual players (excluding narrator if they're not also a player)
		const playerCount = room.players.length;

		// Need at least 3 players to play, narrator doesn't count unless they're also playing
		if (playerCount < 3) {
			throw new Error("Need at least 3 players to start the game");
		}

		// Assign roles to players
		const playersWithRoles = assignRolesToPlayers(room.players);

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

		await ctx.db.patch(room._id, {
			gamePhase: nextPhase,
		});

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
		targetId: v.string(),
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

		// Validate target is alive and in the game
		const target = room.players.find((p) => p.id === args.targetId);
		if (!target || !target.isAlive) {
			throw new Error("Can only vote for alive players");
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

		// Eliminate the player with the most votes
		const updatedPlayers = room.players.map((player) =>
			player.id === eliminatedPlayerId ? { ...player, isAlive: false } : player,
		);

		// Clear votes of the executed type
		const remainingVotes = currentVotes.filter(
			(vote) => vote.voteType !== args.voteType,
		);

		// Check win condition
		const winCondition = checkWinCondition(updatedPlayers);

		const updateData: any = {
			players: updatedPlayers,
			currentVotes: remainingVotes,
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
		targetId: v.string(),
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

		// Validate target is alive and in the game
		const target = room.players.find((p) => p.id === args.targetId);
		if (!target || !target.isAlive) {
			throw new Error("Can only target alive players");
		}

		// Detectives can't investigate themselves, doctors can protect themselves
		if (args.action === "investigate" && args.playerId === args.targetId) {
			throw new Error("Detectives cannot investigate themselves");
		}

		const currentActions = room.nightActions || [];

		// Remove any existing action from this player
		const filteredActions = currentActions.filter(
			(action) => action.playerId !== args.playerId,
		);

		// Add the new action
		const newActions = [
			...filteredActions,
			{
				playerId: args.playerId,
				action: args.action,
				targetId: args.targetId,
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
