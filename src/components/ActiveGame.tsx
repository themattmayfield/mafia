import { useState } from "react";
import { getUserId } from "~/utils/user";
import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query";
import { api } from "../../convex/_generated/api";
import toast from "react-hot-toast";

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
	players: Player[];
	currentVotes?: Array<{
		voterId: string;
		targetId: string;
		voteType: "day" | "mafia";
	}>;
	nightActions?: Array<{
		playerId: string;
		action: "investigate" | "protect";
		targetId: string;
	}>;
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
			toast.error("Failed to execute votes");
			console.error("Error executing votes:", error);
		}
	};

	return (
		<div className="space-y-6">
			<div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
				<h2 className="text-xl font-bold text-purple-800 mb-2">
					Narrator View
				</h2>
				<div className="text-sm">
					<span className="font-medium">Phase:</span>
					<span className="ml-2 px-2 py-1 bg-purple-100 rounded capitalize">
						{room.gamePhase}
					</span>
				</div>
			</div>

			{/* All Players with Roles */}
			<div>
				<h3 className="text-lg font-semibold mb-3">All Players & Roles</h3>
				<div className="grid gap-2">
					{room.players.map((player) => (
						<div
							key={player.id}
							className={`p-3 rounded-lg border ${
								player.isAlive ? "bg-white" : "bg-gray-100 opacity-60"
							}`}
						>
							<div className="flex items-center justify-between">
								<span className="font-medium">{player.name}</span>
								<div className="flex gap-2">
									<span
										className={`text-xs px-2 py-1 rounded ${getRoleColor(player.role)}`}
									>
										{player.role}
									</span>
									<span
										className={`text-xs px-2 py-1 rounded ${
											player.isAlive
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{player.isAlive ? "Alive" : "Dead"}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Current Votes */}
			{room.currentVotes && room.currentVotes.length > 0 && (
				<div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
					<h3 className="text-lg font-semibold text-blue-800 mb-3">
						Current Votes
					</h3>
					<div className="space-y-2">
						{room.currentVotes.map((vote, index) => {
							const voter = room.players.find((p) => p.id === vote.voterId);
							const target = room.players.find((p) => p.id === vote.targetId);
							return (
								<div key={index} className="text-sm">
									<span className="font-medium">{voter?.name}</span>
									<span className="text-blue-600"> voted to eliminate </span>
									<span className="font-medium">{target?.name}</span>
									<span className="text-xs ml-2 px-2 py-1 bg-blue-100 rounded">
										{vote.voteType}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Phase Controls */}
			<div className="bg-gray-50 p-4 rounded-lg">
				<h3 className="text-lg font-semibold mb-3">Game Controls</h3>
				<div className="flex flex-wrap gap-2">
					<button
						onClick={handleAdvancePhase}
						disabled={isAdvancing}
						className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded transition-colors"
					>
						{isAdvancing
							? "Advancing..."
							: `Start ${room.gamePhase === "day" ? "Night" : "Day"} Phase`}
					</button>
					{room.gamePhase === "day" &&
						room.currentVotes?.some((v) => v.voteType === "day") && (
							<button
								onClick={() => handleExecuteVotes("day")}
								className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-colors"
							>
								Execute Day Votes
							</button>
						)}
					{room.gamePhase === "night" &&
						room.currentVotes?.some((v) => v.voteType === "mafia") && (
							<button
								onClick={() => handleExecuteVotes("mafia")}
								className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
							>
								Execute Mafia Votes
							</button>
						)}
					<button
						onClick={handleEndGame}
						disabled={isEnding}
						className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded transition-colors"
					>
						{isEnding ? "Ending..." : "End Game"}
					</button>
				</div>
				<p className="text-sm text-gray-600 mt-2">
					Current phase:{" "}
					<span className="font-medium capitalize">{room.gamePhase}</span>
				</p>
			</div>
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

	return (
		<div className="space-y-6">
			{/* Your Role */}
			<div className="bg-gray-50 p-4 rounded-lg">
				<h2 className="text-xl font-bold mb-2">Your Role</h2>
				<div className="flex items-center gap-3">
					<span
						className={`px-3 py-2 rounded-lg font-medium ${getRoleColor(currentPlayer.role)}`}
					>
						{currentPlayer.role?.toUpperCase()}
					</span>
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
									<span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
										You
									</span>
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
							.filter((p) => p.isAlive && p.id !== currentPlayer.id)
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
					{selectedVoteTarget && (
						<button
							onClick={() => handleVote("day")}
							disabled={isVoting}
							className="w-full mt-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white py-2 px-4 rounded transition-colors"
						>
							{isVoting ? "Casting Vote..." : "Vote to Eliminate"}
						</button>
					)}
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
							.filter((p) => p.isAlive && p.role !== "mafia")
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
					{selectedVoteTarget && (
						<button
							onClick={() => handleVote("mafia")}
							disabled={isVoting}
							className="w-full mt-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-2 px-4 rounded transition-colors"
						>
							{isVoting ? "Casting Vote..." : "Vote to Eliminate"}
						</button>
					)}
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
								<div className="bg-blue-100 p-3 rounded border border-blue-300 mb-3">
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
									<p className="text-xs text-blue-600 mt-1">
										You can change your action by selecting a different player
										below.
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

						<div className="space-y-2">
							{room.players
								.filter(
									(p) =>
										p.isAlive &&
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
						{selectedTarget && (
							<button
								onClick={() =>
									handleNightAction(
										currentPlayer.role === "detective"
											? "investigate"
											: "protect",
									)
								}
								className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
							>
								{currentPlayer.role === "detective" ? "Investigate" : "Protect"}{" "}
								Player
							</button>
						)}
					</div>
				)}

			{/* All Players */}
			<div>
				<h3 className="text-lg font-semibold mb-3">All Players</h3>
				<div className="grid gap-2">
					{room.players.map((player) => (
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
										<span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
											You
										</span>
									)}
									<span
										className={`text-xs px-2 py-1 rounded ${
											player.isAlive
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{player.isAlive ? "Alive" : "Dead"}
									</span>
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

			{/* All Players */}
			<div>
				<h3 className="text-lg font-semibold mb-3">Players</h3>
				<div className="grid gap-2">
					{room.players.map((player) => (
						<div
							key={player.id}
							className={`p-3 rounded-lg border ${
								player.isAlive ? "bg-white" : "bg-gray-100 opacity-60"
							}`}
						>
							<div className="flex items-center justify-between">
								<span className="font-medium">{player.name}</span>
								<span
									className={`text-xs px-2 py-1 rounded ${
										player.isAlive
											? "bg-green-100 text-green-800"
											: "bg-red-100 text-red-800"
									}`}
								>
									{player.isAlive ? "Alive" : "Dead"}
								</span>
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
