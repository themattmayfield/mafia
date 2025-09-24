import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
	rooms: defineTable({
		code: v.string(),
		leaderId: v.string(),
		status: v.union(
			v.literal("waiting"),
			v.literal("active"),
			v.literal("finished"),
		),
		gamePhase: v.optional(v.union(v.literal("day"), v.literal("night"))),
		phaseTransitionMessage: v.optional(v.string()),
		gameHistory: v.optional(
			v.array(
				v.object({
					timestamp: v.number(),
					event: v.string(),
					description: v.string(),
				}),
			),
		),
		players: v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				role: v.optional(
					v.union(
						v.literal("mafia"),
						v.literal("citizen"),
						v.literal("detective"),
						v.literal("doctor"),
					),
				),
				isAlive: v.optional(v.boolean()),
			}),
		),
		currentVotes: v.optional(
			v.array(
				v.object({
					voterId: v.string(),
					targetId: v.union(v.string(), v.literal("ABSTAIN")),
					voteType: v.union(v.literal("day"), v.literal("mafia")),
				}),
			),
		),
		nightActions: v.optional(
			v.array(
				v.object({
					playerId: v.string(),
					action: v.union(v.literal("investigate"), v.literal("protect")),
					targetId: v.union(v.string(), v.literal("ABSTAIN")),
					isLocked: v.optional(v.boolean()),
				}),
			),
		),
		lastEliminationResult: v.optional(v.string()),
	}).index("by_code", ["code"]),
});

export default schema;
