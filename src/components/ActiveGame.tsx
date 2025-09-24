import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { getUserId } from "~/utils/user";
import { api } from "../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { GameBadge } from "~/components/ui/game-badge";

interface Player {
	id: string;
	name: string;
	role?: "mafia" | "citizen" | "detective" | "doctor";
	isAlive?: boolean;
}

interface Room {
	_id: string;
	code: string;
	leaderId: string;
	status: "waiting" | "active" | "finished";
	gamePhase?: "day" | "night";
	phaseTransitionMessage?: string;
	gameHistory?: Array<{
		timestamp: number;
		event: string;
		description: string;
	}>;
	players: Player[];
	currentVotes?: Array<{
		voterId: string;
		targetId: string | "ABSTAIN";
		voteType: "day" | "mafia";
	}>;
	nightActions?: Array<{
		playerId: string;
		action: "investigate" | "protect";
		targetId: string | "ABSTAIN";
		isLocked?: boolean;
	}>;
	lastEliminationResult?: string;
}

interface ActiveGameProps {
	room: Room;
}

export function ActiveGame({ room }: ActiveGameProps) {
	const userId = getUserId();
	const currentPlayer = room.players.find((p) => p.id === userId);
	const isNarrator = room.leaderId === userId;
	const isPlayerInGame = !!currentPlayer;

	if (isNarrator) {
		return <NarratorView room={room} />;
	}

	if (!isPlayerInGame) {
		return <SpectatorView room={room} />;
	}

	return <PlayerView room={room} currentPlayer={currentPlayer} />;
}

function NarratorView({ room }: { room: Room }) {
	const userId = getUserId();
	const [isAdvancing, setIsAdvancing] = useState(false);
	const [isEnding, setIsEnding] = useState(false);

	const advancePhaseMutation = useConvexMutation(api.rooms.advancePhase);
	const endGameMutation = useConvexMutation(api.rooms.endGame);
	const executeVotesMutation = useConvexMutation(api.rooms.executeVotes);
	const removePlayerMutation = useConvexMutation(api.rooms.removePlayer);

	const handleAdvancePhase = async () => {
		setIsAdvancing(true);
		try {
			await advancePhaseMutation({
				code: room.code,
				narratorId: userId,
			});
			const nextPhase = room.gamePhase === "day" ? "night" : "day";
			toast.success(`Advanced to ${nextPhase} phase`);
		} catch (error) {
			toast.error("Failed to advance phase");
			console.error("Error advancing phase:", error);
		} finally {
			setIsAdvancing(false);
		}
	};

	const handleEndGame = async () => {
		setIsEnding(true);
		try {
			await endGameMutation({
				code: room.code,
				narratorId: userId,
			});
			toast.success("Game ended");
		} catch (error) {
			toast.error("Failed to end game");
			console.error("Error ending game:", error);
		} finally {
			setIsEnding(false);
		}
	};

	const handleExecuteVotes = async (voteType: "day" | "mafia") => {
		try {
			await executeVotesMutation({
				code: room.code,
				narratorId: userId,
				voteType,
			});
			toast.success(`${voteType === "day" ? "Day" : "Mafia"} votes executed`);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to execute votes";
			toast.error(errorMessage);
			console.error("Error executing votes:", error);
		}
	};

	const handleRemovePlayerActive = async (
		playerIdToRemove: string,
		playerName: string,
		playerRole?: string,
	) => {
		if (!userId) return;

		let roleWarning = "";
		let balanceImpact = "";

		switch (playerRole) {
			case "mafia":
				roleWarning =
					"⚠️ Removing a Mafia member will help the townspeople win.";
				balanceImpact = "This significantly favors the townspeople.";
				break;
			case "detective":
				roleWarning =
					"⚠️ Removing the Detective eliminates the townspeople's investigation ability.";
				balanceImpact = "This significantly favors the Mafia.";
				break;
			case "doctor":
				roleWarning =
					"⚠️ Removing the Doctor eliminates the townspeople's protection ability.";
				balanceImpact = "This significantly favors the Mafia.";
				break;
			case "citizen":
				roleWarning = "Removing a Citizen reduces townspeople numbers.";
				balanceImpact = "This may slightly favor the Mafia.";
				break;
		}

		const confirmed = confirm(
			`Are you sure you want to remove ${playerName} (${playerRole}) from the active game?\n\n${roleWarning}\n${balanceImpact}\n\nThis action cannot be undone.`,
		);

		if (!confirmed) return;

		try {
			await removePlayerMutation({
				code: room.code,
				leaderId: userId,
				playerIdToRemove,
			});
			toast.success(`${playerName} has been removed from the game`);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to remove player";
			toast.error(errorMessage);
			console.error("Error removing player:", error);
		}
	};

	// Helper function to get night actions status
	const getNightActionsStatus = () => {
		if (room.gamePhase !== "night") return { complete: true, pending: [] };

		const pending: string[] = [];
		const actualPlayers = room.players.filter((p) => p.id !== room.leaderId);
		const aliveMafia = actualPlayers.filter(
			(p) => p.isAlive && p.role === "mafia",
		);
		const aliveDoctor = actualPlayers.find(
			(p) => p.isAlive && p.role === "doctor",
		);
		const aliveDetective = actualPlayers.find(
			(p) => p.isAlive && p.role === "detective",
		);

		const currentVotes = room.currentVotes || [];
		const nightActions = room.nightActions || [];

		// Check mafia votes
		for (const mafiaPlayer of aliveMafia) {
			const hasVoted = currentVotes.some(
				(vote) => vote.voterId === mafiaPlayer.id && vote.voteType === "mafia",
			);
			if (!hasVoted) {
				pending.push(`${mafiaPlayer.name} (Mafia Vote)`);
			}
		}

		// Check doctor action
		if (aliveDoctor) {
			const hasActed = nightActions.some(
				(action) =>
					action.playerId === aliveDoctor.id && action.action === "protect",
			);
			if (!hasActed) {
				pending.push(`${aliveDoctor.name} (Doctor Action)`);
			}
		}

		// Check detective action
		if (aliveDetective) {
			const hasActed = nightActions.some(
				(action) =>
					action.playerId === aliveDetective.id &&
					action.action === "investigate",
			);
			if (!hasActed) {
				pending.push(`${aliveDetective.name} (Detective Action)`);
			}
		}

		return { complete: pending.length === 0, pending };
	};

	return (
		<div className="space-y-6">
			<Card className="bg-purple-50 border-purple-200">
				<CardHeader>
					<CardTitle className="text-purple-800">🎭 Narrator View</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-sm">
						<span className="font-medium">Phase:</span>
						<span className="ml-2 px-2 py-1 bg-purple-100 rounded capitalize text-purple-800">
							{room.gamePhase}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* All Players with Roles */}
			<Card>
				<CardHeader>
					<CardTitle>👥 All Players & Roles</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-2">
						{room.players
							.filter((player) => player.id !== room.leaderId) // Exclude narrator
							.map((player) => (
								<div
									key={player.id}
									className={`p-3 rounded-lg border ${
										player.isAlive ? "bg-white" : "bg-gray-100 opacity-60"
									}`}
								>
									<div className="flex items-center justify-between">
										<span className="font-medium">{player.name}</span>
										<div className="flex gap-2">
											<GameBadge type="role" value={player.role || "citizen"} />
											<GameBadge
												type="status"
												value={player.isAlive ? "Alive" : "Dead"}
											/>
										</div>
									</div>
								</div>
							))}
					</div>
				</CardContent>
			</Card>

			{/* Phase Transition Message */}
			{room.phaseTransitionMessage && (
				<div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-4 rounded-lg border-2 border-purple-200 shadow-lg animate-pulse">
					<div className="text-center">
						<p className="text-lg font-medium text-purple-800 leading-relaxed">
							{room.phaseTransitionMessage}
						</p>
					</div>
				</div>
			)}

			{/* Last Elimination Result */}
			{room.lastEliminationResult && (
				<Card className="bg-orange-50 border-orange-200">
					<CardHeader>
						<CardTitle className="text-orange-800">📰 Latest Result</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-orange-700">
							{room.lastEliminationResult}
						</p>
					</CardContent>
				</Card>
			)}

			{/* Current Votes */}
			{room.currentVotes && room.currentVotes.length > 0 && (
				<Card className="bg-blue-50 border-blue-200">
					<CardHeader>
						<CardTitle className="text-blue-800">🗳️ Current Votes</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{room.currentVotes.map((vote, index) => {
								const voter = room.players.find((p) => p.id === vote.voterId);
								const target = room.players.find((p) => p.id === vote.targetId);
								return (
									<div key={index} className="text-sm">
										<span className="font-medium">{voter?.name}</span>
										{vote.targetId === "ABSTAIN" ? (
											<span className="text-gray-600">
												{" "}
												abstained from voting
											</span>
										) : (
											<>
												<span className="text-blue-600">
													{" "}
													voted to eliminate{" "}
												</span>
												<span className="font-medium">{target?.name}</span>
											</>
										)}
										<GameBadge
											type="status"
											value={
												vote.voteType === "day" ? "Day Vote" : "Mafia Vote"
											}
											className="ml-2"
										/>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Night Actions Status */}
			{room.gamePhase === "night" &&
				(() => {
					const nightStatus = getNightActionsStatus();
					return (
						<Card
							className={
								nightStatus.complete
									? "bg-green-50 border-green-200"
									: "bg-yellow-50 border-yellow-200"
							}
						>
							<CardHeader>
								<CardTitle
									className={
										nightStatus.complete ? "text-green-800" : "text-yellow-800"
									}
								>
									🌙 Night Actions Status
								</CardTitle>
							</CardHeader>
							<CardContent>
								{nightStatus.complete ? (
									<p className="text-sm text-green-600">
										✅ All night actions complete - Ready to execute votes
									</p>
								) : (
									<div>
										<p className="text-sm text-yellow-600 mb-2">
											⏳ Waiting for:
										</p>
										<ul className="text-sm text-yellow-700 ml-4">
											{nightStatus.pending.map((pending, index) => (
												<li key={index}>• {pending}</li>
											))}
										</ul>
									</div>
								)}
							</CardContent>
						</Card>
					);
				})()}

			{/* Narrator Guidance */}
			<Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						🎭 Narrator Controls
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-3 p-3 bg-white rounded border border-purple-100">
						<p className="text-sm text-gray-700 leading-relaxed">
							<strong>Current Phase:</strong>{" "}
							{room.gamePhase === "day" ? "🌞 Day Phase" : "🌙 Night Phase"}
						</p>
						<p className="text-sm text-gray-600 mt-1">
							{room.gamePhase === "day"
								? "Players discuss and vote to eliminate suspects. Execute votes when ready, then advance to night."
								: "Special roles act in secret. Wait for all actions to complete, then execute night votes and advance to day."}
						</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							onClick={handleAdvancePhase}
							disabled={isAdvancing}
							title={`Advance to ${room.gamePhase === "day" ? "Night" : "Day"} phase`}
							className="transition-all transform hover:scale-105"
						>
							{room.gamePhase === "day" ? "🌙" : "🌞"}
							{isAdvancing
								? "Advancing..."
								: `Start ${room.gamePhase === "day" ? "Night" : "Day"} Phase`}
						</Button>
						{room.gamePhase === "day" &&
							room.currentVotes?.some((v) => v.voteType === "day") && (
								<Button
									onClick={() => handleExecuteVotes("day")}
									title="Execute the current day votes and eliminate the selected player"
									variant="secondary"
									className="bg-yellow-500 hover:bg-yellow-600 text-white transition-all transform hover:scale-105"
								>
									⚖️ Execute Day Votes
								</Button>
							)}
						{room.gamePhase === "night" &&
							room.currentVotes?.some((v) => v.voteType === "mafia") &&
							(() => {
								const nightStatus = getNightActionsStatus();
								return (
									<Button
										onClick={() => handleExecuteVotes("mafia")}
										disabled={!nightStatus.complete}
										className={`transition-all transform hover:scale-105 text-white ${
											nightStatus.complete
												? "bg-red-500 hover:bg-red-600"
												: "bg-gray-400 cursor-not-allowed"
										}`}
										title={
											nightStatus.complete
												? "Execute mafia votes and reveal night results"
												: `Waiting for: ${nightStatus.pending.join(", ")}`
										}
									>
										🔪{" "}
										{nightStatus.complete
											? "Execute Mafia Votes"
											: "Waiting for Actions..."}
									</Button>
								);
							})()}
						<Button
							onClick={handleEndGame}
							disabled={isEnding}
							title="End the current game (emergency use only)"
							variant="destructive"
							className="transition-all transform hover:scale-105"
						>
							🏁 {isEnding ? "Ending..." : "End Game"}
						</Button>
					</div>

					{/* Game Status Summary */}
					<div className="mt-3 p-3 bg-white rounded border border-purple-100">
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
							<div className="text-center">
								<div className="font-semibold text-green-600">
									{
										room.players.filter(
											(p) => p.id !== room.leaderId && p.isAlive,
										).length
									}
								</div>
								<div className="text-gray-600">Players Alive</div>
							</div>
							<div className="text-center">
								<div className="font-semibold text-red-600">
									{
										room.players.filter(
											(p) =>
												p.id !== room.leaderId &&
												p.role === "mafia" &&
												p.isAlive,
										).length
									}
								</div>
								<div className="text-gray-600">Mafia Alive</div>
							</div>
							<div className="text-center">
								<div className="font-semibold text-blue-600">
									{room.currentVotes?.length || 0}
								</div>
								<div className="text-gray-600">Current Votes</div>
							</div>
							<div className="text-center">
								<div className="font-semibold text-purple-600">
									{room.nightActions?.filter((a) => a.isLocked).length || 0}
								</div>
								<div className="text-gray-600">Night Actions</div>
							</div>
						</div>
					</div>

					{/* Game History - Collapsible */}
					{room.gameHistory && room.gameHistory.length > 0 && (
						<details className="mt-3">
							<summary className="cursor-pointer text-sm font-medium text-purple-800 hover:text-purple-600 p-2 bg-white rounded border border-purple-100">
								📜 Game History ({room.gameHistory.length} events)
							</summary>
							<div className="mt-2 p-3 bg-white rounded border border-purple-100 max-h-32 overflow-y-auto">
								<div className="space-y-1 text-xs">
									{room.gameHistory
										.slice(-10) // Show last 10 events
										.reverse()
										.map((event, index) => (
											<div
												key={index}
												className="flex justify-between items-center text-gray-600"
											>
												<span>{event.description}</span>
												<span className="text-gray-400">
													{new Date(event.timestamp).toLocaleTimeString()}
												</span>
											</div>
										))}
								</div>
							</div>
						</details>
					)}

					{/* Emergency Player Removal */}
					<details className="mt-3">
						<summary className="cursor-pointer text-sm font-medium text-red-800 hover:text-red-600 p-2 bg-white rounded border border-red-100">
							🚨 Emergency Player Removal
						</summary>
						<div className="mt-2 p-3 bg-white rounded border border-red-100">
							<p className="text-xs text-gray-600 mb-3">
								⚠️ Only use if a player needs to leave unexpectedly. This may
								affect game balance.
							</p>
							<div className="space-y-2">
								{room.players
									.filter((p) => p.id !== room.leaderId && p.isAlive)
									.map((player) => (
										<div
											key={player.id}
											className="flex items-center justify-between p-2 bg-gray-50 rounded"
										>
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium">
													{player.name}
												</span>
												<GameBadge
													type="role"
													value={player.role || "citizen"}
												/>
											</div>
											<Button
												onClick={() =>
													handleRemovePlayerActive(
														player.id,
														player.name,
														player.role,
													)
												}
												variant="destructive"
												size="sm"
												className="text-xs px-2 py-1 h-auto"
											>
												Remove
											</Button>
										</div>
									))}
							</div>
						</div>
					</details>
				</CardContent>
			</Card>
		</div>
	);
}

function PlayerView({
	room,
	currentPlayer,
}: {
	room: Room;
	currentPlayer: Player;
}) {
	const [selectedTarget, setSelectedTarget] = useState<string>("");
	const [selectedVoteTarget, setSelectedVoteTarget] = useState<string>("");
	const [isVoting, setIsVoting] = useState(false);

	const castVoteMutation = useConvexMutation(api.rooms.castVote);
	const performNightActionMutation = useConvexMutation(
		api.rooms.performNightAction,
	);
	const nightActionResult = useConvexQuery(api.rooms.getNightActionResult, {
		code: room.code,
		playerId: currentPlayer.id,
	});

	// Show mafia members to mafia during night phase
	const canSeeMafia =
		currentPlayer.role === "mafia" && room.gamePhase === "night";
	const mafiaMembers = room.players.filter(
		(p) => p.role === "mafia" && p.isAlive,
	);

	// Check current player's vote
	const currentVote = room.currentVotes?.find(
		(v) =>
			v.voterId === currentPlayer.id &&
			v.voteType === (room.gamePhase === "day" ? "day" : "mafia"),
	);

	const handleVote = async (voteType: "day" | "mafia") => {
		if (!selectedVoteTarget) {
			toast.error("Please select a player to vote for");
			return;
		}

		setIsVoting(true);
		try {
			await castVoteMutation({
				code: room.code,
				voterId: currentPlayer.id,
				targetId: selectedVoteTarget,
				voteType,
			});
			toast.success(
				`Vote cast for ${room.players.find((p) => p.id === selectedVoteTarget)?.name}`,
			);
			setSelectedVoteTarget("");
		} catch (error) {
			toast.error("Failed to cast vote");
			console.error("Error casting vote:", error);
		} finally {
			setIsVoting(false);
		}
	};

	const handleVoteAbstain = async (voteType: "day" | "mafia") => {
		setIsVoting(true);
		try {
			await castVoteMutation({
				code: room.code,
				voterId: currentPlayer.id,
				targetId: "ABSTAIN",
				voteType,
			});
			toast.success("Abstained from voting");
			setSelectedVoteTarget("");
		} catch (error) {
			toast.error("Failed to abstain");
			console.error("Error abstaining from vote:", error);
		} finally {
			setIsVoting(false);
		}
	};

	const handleNightAction = async (action: "investigate" | "protect") => {
		if (!selectedTarget) {
			toast.error("Please select a target");
			return;
		}

		try {
			await performNightActionMutation({
				code: room.code,
				playerId: currentPlayer.id,
				action,
				targetId: selectedTarget,
			});
			toast.success(
				`${action === "investigate" ? "Investigation" : "Protection"} performed`,
			);
			setSelectedTarget("");
		} catch (error) {
			toast.error(`Failed to ${action}`);
			console.error(`Error performing ${action}:`, error);
		}
	};

	const handleNightActionAbstain = async (
		action: "investigate" | "protect",
	) => {
		try {
			await performNightActionMutation({
				code: room.code,
				playerId: currentPlayer.id,
				action,
				targetId: "ABSTAIN",
			});
			toast.success(`Chose not to ${action} anyone this night`);
			setSelectedTarget("");
		} catch (error) {
			toast.error(`Failed to abstain from ${action}`);
			console.error(`Error abstaining from ${action}:`, error);
		}
	};

	return (
		<div className="space-y-6">
			{/* Your Role */}
			<div className="bg-gray-50 p-4 rounded-lg">
				<h2 className="text-xl font-bold mb-2">Your Role</h2>
				<div className="flex items-center gap-3">
					<GameBadge
						type="role"
						value={currentPlayer.role || "citizen"}
						className="px-3 py-2 font-medium"
					/>
					<span className="text-gray-600">
						{getRoleDescription(currentPlayer.role)}
					</span>
				</div>
			</div>

			{/* Game Phase */}
			<div className="text-center mb-6">
				<div
					className={`inline-block px-6 py-3 rounded-xl font-bold text-lg ${
						room.gamePhase === "day"
							? "bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-900 border-2 border-yellow-300"
							: "bg-gradient-to-r from-blue-200 to-purple-200 text-blue-900 border-2 border-blue-300"
					}`}
				>
					{room.gamePhase === "day" ? "☀️ Day Phase" : "🌙 Night Phase"}
				</div>
				<p className="text-sm text-gray-600 mt-2">
					{room.gamePhase === "day"
						? "Discuss and vote to eliminate a suspected mafia member"
						: "Special roles take their actions in secret"}
				</p>
			</div>

			{/* Mafia Members (visible to mafia during night) */}
			{canSeeMafia && (
				<div className="bg-red-50 p-4 rounded-lg border border-red-200">
					<h3 className="text-lg font-semibold text-red-800 mb-2">
						Your Mafia Team
					</h3>
					<div className="space-y-2">
						{mafiaMembers.map((member) => (
							<div key={member.id} className="flex items-center gap-2">
								<span className="font-medium">{member.name}</span>
								{member.id === currentPlayer.id && (
									<GameBadge type="special" value="You" />
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Day Phase Voting */}
			{room.gamePhase === "day" && (
				<div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
					<h3 className="text-lg font-semibold text-yellow-800 mb-3">
						Day Phase Voting
					</h3>
					{currentVote ? (
						<div className="bg-yellow-100 p-3 rounded border border-yellow-300">
							<p className="text-sm">
								You voted to eliminate:{" "}
								<span className="font-medium">
									{
										room.players.find((p) => p.id === currentVote.targetId)
											?.name
									}
								</span>
							</p>
							<p className="text-xs text-yellow-600 mt-1">
								You can change your vote by selecting a different player below.
							</p>
						</div>
					) : (
						<p className="text-sm text-yellow-600 mb-3">
							Vote to eliminate a player you suspect is mafia:
						</p>
					)}
					<div className="space-y-2 mt-3">
						{room.players
							.filter(
								(p) =>
									p.isAlive &&
									p.id !== currentPlayer.id &&
									p.id !== room.leaderId,
							)
							.map((player) => (
								<button
									key={player.id}
									onClick={() => setSelectedVoteTarget(player.id)}
									className={`w-full text-left p-2 rounded border transition-colors ${
										selectedVoteTarget === player.id
											? "bg-yellow-100 border-yellow-300"
											: "bg-white hover:bg-gray-50"
									}`}
								>
									{player.name}
								</button>
							))}
					</div>
					<div className="mt-3 space-y-2">
						{selectedVoteTarget && (
							<Button
								onClick={() => handleVote("day")}
								disabled={isVoting}
								className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white"
							>
								{isVoting ? "Casting Vote..." : "Vote to Eliminate"}
							</Button>
						)}
						<Button
							onClick={() => handleVoteAbstain("day")}
							disabled={isVoting}
							variant="secondary"
							className="w-full"
						>
							{isVoting ? "Abstaining..." : "Abstain from Voting"}
						</Button>
					</div>
				</div>
			)}

			{/* Mafia Night Voting */}
			{room.gamePhase === "night" && currentPlayer.role === "mafia" && (
				<div className="bg-red-50 p-4 rounded-lg border border-red-200">
					<h3 className="text-lg font-semibold text-red-800 mb-3">
						Mafia Elimination
					</h3>
					{currentVote ? (
						<div className="bg-red-100 p-3 rounded border border-red-300">
							<p className="text-sm">
								You voted to eliminate:{" "}
								<span className="font-medium">
									{
										room.players.find((p) => p.id === currentVote.targetId)
											?.name
									}
								</span>
							</p>
							<p className="text-xs text-red-600 mt-1">
								You can change your vote by selecting a different player below.
							</p>
						</div>
					) : (
						<p className="text-sm text-red-600 mb-3">
							Choose a townsperson to eliminate:
						</p>
					)}
					<div className="space-y-2 mt-3">
						{room.players
							.filter(
								(p) =>
									p.isAlive && p.role !== "mafia" && p.id !== room.leaderId,
							)
							.map((player) => (
								<button
									key={player.id}
									onClick={() => setSelectedVoteTarget(player.id)}
									className={`w-full text-left p-2 rounded border transition-colors ${
										selectedVoteTarget === player.id
											? "bg-red-100 border-red-300"
											: "bg-white hover:bg-gray-50"
									}`}
								>
									{player.name}
								</button>
							))}
					</div>
					<div className="mt-3 space-y-2">
						{selectedVoteTarget && (
							<Button
								onClick={() => handleVote("mafia")}
								disabled={isVoting}
								variant="destructive"
								className="w-full"
							>
								{isVoting ? "Casting Vote..." : "Vote to Eliminate"}
							</Button>
						)}
						<Button
							onClick={() => handleVoteAbstain("mafia")}
							disabled={isVoting}
							variant="secondary"
							className="w-full"
						>
							{isVoting ? "Abstaining..." : "Abstain from Voting"}
						</Button>
					</div>
				</div>
			)}

			{/* Morning Announcement */}
			{room.gamePhase === "day" && room.lastEliminationResult && (
				<div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
					<h3 className="text-lg font-semibold text-orange-800 mb-2">
						🌅 Morning Report
					</h3>
					<p className="text-sm text-orange-700">
						{room.lastEliminationResult}
					</p>
				</div>
			)}

			{/* Investigation Results (Detective) */}
			{currentPlayer.role === "detective" && nightActionResult && (
				<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
					<h3 className="text-lg font-semibold text-blue-800 mb-3">
						Investigation Result
					</h3>
					<div className="bg-blue-100 p-3 rounded border border-blue-300">
						<p className="text-sm">
							<span className="font-medium">
								{nightActionResult.targetName}
							</span>{" "}
							is a{" "}
							<span
								className={`font-bold ${
									nightActionResult.targetRole === "mafia"
										? "text-red-600"
										: "text-green-600"
								}`}
							>
								{nightActionResult.targetRole?.toUpperCase()}
							</span>
						</p>
					</div>
				</div>
			)}

			{/* Night Actions */}
			{room.gamePhase === "night" &&
				(currentPlayer.role === "detective" ||
					currentPlayer.role === "doctor") && (
					<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
						<h3 className="text-lg font-semibold text-blue-800 mb-3">
							{currentPlayer.role === "detective"
								? "Investigation"
								: "Protection"}
						</h3>

						{/* Show current action if any */}
						{(() => {
							const currentAction = room.nightActions?.find(
								(a) => a.playerId === currentPlayer.id,
							);
							return currentAction ? (
								<div
									className={`p-3 rounded border mb-3 ${
										currentAction.isLocked
											? "bg-green-100 border-green-300"
											: "bg-blue-100 border-blue-300"
									}`}
								>
									<p className="text-sm">
										You chose to {currentAction.action}:{" "}
										<span className="font-medium">
											{
												room.players.find(
													(p) => p.id === currentAction.targetId,
												)?.name
											}
										</span>
									</p>
									<p
										className={`text-xs mt-1 ${
											currentAction.isLocked
												? "text-green-600"
												: "text-blue-600"
										}`}
									>
										{currentAction.isLocked
											? `✓ ${currentAction.action === "investigate" ? "Investigation" : "Protection"} confirmed for this night`
											: "You can change your action by selecting a different player below."}
									</p>
								</div>
							) : (
								<p className="text-sm text-blue-600 mb-3">
									{currentPlayer.role === "detective"
										? "Choose a player to investigate their role:"
										: "Choose a player to protect from elimination:"}
								</p>
							);
						})()}

						{(() => {
							const currentAction = room.nightActions?.find(
								(a) => a.playerId === currentPlayer.id,
							);
							const isActionLocked = currentAction?.isLocked;

							return !isActionLocked ? (
								<>
									<div className="space-y-2">
										{room.players
											.filter(
												(p) =>
													p.isAlive &&
													p.id !== room.leaderId &&
													(currentPlayer.role === "doctor" ||
														p.id !== currentPlayer.id),
											)
											.map((player) => (
												<button
													key={player.id}
													onClick={() => setSelectedTarget(player.id)}
													className={`w-full text-left p-2 rounded border transition-colors ${
														selectedTarget === player.id
															? "bg-blue-100 border-blue-300"
															: "bg-white hover:bg-gray-50"
													}`}
												>
													{player.name}
													{player.id === currentPlayer.id &&
														currentPlayer.role === "doctor" && (
															<span className="text-xs text-blue-600 ml-2">
																(yourself)
															</span>
														)}
												</button>
											))}
									</div>
									<div className="mt-3 space-y-2">
										{selectedTarget && (
											<Button
												onClick={() =>
													handleNightAction(
														currentPlayer.role === "detective"
															? "investigate"
															: "protect",
													)
												}
												className="w-full"
											>
												{currentPlayer.role === "detective"
													? "Investigate"
													: "Protect"}{" "}
												Player
											</Button>
										)}
										<Button
											onClick={() =>
												handleNightActionAbstain(
													currentPlayer.role === "detective"
														? "investigate"
														: "protect",
												)
											}
											variant="secondary"
											className="w-full"
										>
											{currentPlayer.role === "detective"
												? "Don't Investigate Anyone"
												: "Don't Protect Anyone"}
										</Button>
									</div>
								</>
							) : (
								<div className="text-center p-4 bg-gray-100 rounded">
									<p className="text-sm text-gray-600">
										Your {currentAction.action} has been confirmed for this
										night phase.
									</p>
								</div>
							);
						})()}
					</div>
				)}

			{/* All Players */}
			<div>
				<h3 className="text-lg font-semibold mb-3">All Players</h3>
				<div className="grid gap-2">
					{room.players
						.filter((player) => player.id !== room.leaderId) // Exclude narrator
						.map((player) => (
							<div
								key={player.id}
								className={`p-3 rounded-lg border ${
									player.isAlive ? "bg-white" : "bg-gray-100 opacity-60"
								} ${player.id === currentPlayer.id ? "border-blue-300 bg-blue-50" : ""}`}
							>
								<div className="flex items-center justify-between">
									<span className="font-medium">{player.name}</span>
									<div className="flex gap-2">
										{player.id === currentPlayer.id && (
											<GameBadge type="special" value="You" />
										)}
										<GameBadge
											type="status"
											value={player.isAlive ? "Alive" : "Dead"}
										/>
									</div>
								</div>
							</div>
						))}
				</div>
			</div>
		</div>
	);
}

function SpectatorView({ room }: { room: Room }) {
	return (
		<div className="space-y-6">
			<div className="bg-gray-50 p-4 rounded-lg text-center">
				<h2 className="text-xl font-bold mb-2">Spectating Game</h2>
				<p className="text-gray-600">
					You are watching this game as a spectator.
				</p>
			</div>

			{/* Game Phase */}
			<div className="text-center mb-6">
				<div
					className={`inline-block px-6 py-3 rounded-xl font-bold text-lg ${
						room.gamePhase === "day"
							? "bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-900 border-2 border-yellow-300"
							: "bg-gradient-to-r from-blue-200 to-purple-200 text-blue-900 border-2 border-blue-300"
					}`}
				>
					{room.gamePhase === "day" ? "☀️ Day Phase" : "🌙 Night Phase"}
				</div>
				<p className="text-sm text-gray-600 mt-2">
					{room.gamePhase === "day"
						? "Players are discussing and voting"
						: "Special roles are taking their actions"}
				</p>
			</div>

			{/* Morning Announcement */}
			{room.gamePhase === "day" && room.lastEliminationResult && (
				<div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
					<h3 className="text-lg font-semibold text-orange-800 mb-2">
						🌅 Morning Report
					</h3>
					<p className="text-sm text-orange-700">
						{room.lastEliminationResult}
					</p>
				</div>
			)}

			{/* All Players */}
			<div>
				<h3 className="text-lg font-semibold mb-3">Players</h3>
				<div className="grid gap-2">
					{room.players
						.filter((player) => player.id !== room.leaderId) // Exclude narrator
						.map((player) => (
							<div
								key={player.id}
								className={`p-3 rounded-lg border ${
									player.isAlive ? "bg-white" : "bg-gray-100 opacity-60"
								}`}
							>
								<div className="flex items-center justify-between">
									<span className="font-medium">{player.name}</span>
									<GameBadge
										type="status"
										value={player.isAlive ? "Alive" : "Dead"}
									/>
								</div>
							</div>
						))}
				</div>
			</div>
		</div>
	);
}

function getRoleColor(role?: string): string {
	switch (role) {
		case "mafia":
			return "bg-red-100 text-red-800";
		case "detective":
			return "bg-blue-100 text-blue-800";
		case "doctor":
			return "bg-green-100 text-green-800";
		case "citizen":
			return "bg-gray-100 text-gray-800";
		default:
			return "bg-gray-100 text-gray-800";
	}
}

function getRoleDescription(role?: string): string {
	switch (role) {
		case "mafia":
			return "Eliminate townspeople to win";
		case "detective":
			return "Investigate players to find mafia";
		case "doctor":
			return "Protect players from elimination";
		case "citizen":
			return "Vote to eliminate mafia members";
		default:
			return "Unknown role";
	}
}
