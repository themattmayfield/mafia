import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getUserId } from "~/utils/user";
import { ActiveGame } from "~/components/ActiveGame";

export const Route = createFileRoute("/room/$code")({
	component: RoomPage,
});

function RoomPage() {
	const { code } = Route.useParams();
	const [playerName, setPlayerName] = useState("");
	const [hasJoined, setHasJoined] = useState(false);
	const [isJoining, setIsJoining] = useState(false);
	const [isStarting, setIsStarting] = useState(false);
	const [showTransferModal, setShowTransferModal] = useState(false);
	const [isTransferring, setIsTransferring] = useState(false);

	const userId = getUserId();

	const room = useConvexQuery(api.rooms.getRoomByCode, { code });
	const joinRoomMutation = useConvexMutation(api.rooms.joinRoom);
	const startGameMutation = useConvexMutation(api.rooms.startGame);
	const transferLeadershipMutation = useConvexMutation(
		api.rooms.transferLeadership,
	);

	const isLeader = room?.leaderId === userId;
	const isInRoom = room?.players.some((p) => p.id === userId) || false;

	useEffect(() => {
		if (room && isInRoom) {
			setHasJoined(true);
		}
	}, [room, isInRoom]);

	const handleJoinRoom = async () => {
		if (!playerName.trim()) {
			toast.error("Please enter your name");
			return;
		}

		setIsJoining(true);
		try {
			await joinRoomMutation({
				code,
				playerId: userId,
				playerName: playerName.trim(),
			});
			setHasJoined(true);
			toast.success("Joined room successfully!");
		} catch (error) {
			toast.error("Failed to join room");
			console.error("Error joining room:", error);
		} finally {
			setIsJoining(false);
		}
	};

	const handleStartGame = async () => {
		setIsStarting(true);
		try {
			await startGameMutation({
				code,
				leaderId: userId,
			});
			toast.success("Game started!");
		} catch (error) {
			toast.error("Failed to start game");
			console.error("Error starting game:", error);
		} finally {
			setIsStarting(false);
		}
	};

	const handleTransferLeadership = async (newLeaderId: string) => {
		setIsTransferring(true);
		try {
			await transferLeadershipMutation({
				code,
				currentLeaderId: userId,
				newLeaderId,
			});
			setShowTransferModal(false);
			toast.success("Leadership transferred successfully!");
		} catch (error) {
			toast.error("Failed to transfer leadership");
			console.error("Error transferring leadership:", error);
		} finally {
			setIsTransferring(false);
		}
	};

	if (!room) {
		return (
			<div className="p-8 max-w-md mx-auto text-center">
				<h2 className="text-xl font-bold text-red-600 mb-4">Room Not Found</h2>
				<p>The room with code "{code}" does not exist.</p>
			</div>
		);
	}

	// Show active game if game is running
	if (room.status === "active") {
		return (
			<div className="p-8 max-w-4xl mx-auto">
				<ActiveGame room={room} />
			</div>
		);
	}

	// Show game finished state
	if (room.status === "finished") {
		return (
			<div className="p-8 max-w-4xl mx-auto">
				<div className="text-center space-y-6">
					<h2 className="text-3xl font-bold">Game Over!</h2>
					{(() => {
						const alivePlayers = room.players.filter((p) => p.isAlive);
						const aliveMafia = alivePlayers.filter((p) => p.role === "mafia");
						const aliveTownspeople = alivePlayers.filter(
							(p) => p.role !== "mafia",
						);

						let winner = "";
						let winnerColor = "";

						if (
							aliveMafia.length >= aliveTownspeople.length &&
							aliveMafia.length > 0
						) {
							winner = "Mafia Wins!";
							winnerColor = "text-red-600";
						} else if (aliveMafia.length === 0) {
							winner = "Townspeople Win!";
							winnerColor = "text-green-600";
						} else {
							winner = "Game Ended";
							winnerColor = "text-gray-600";
						}

						return (
							<div className={`text-2xl font-bold ${winnerColor} mb-4`}>
								{winner}
							</div>
						);
					})()}
					<div className="bg-gray-50 p-6 rounded-lg">
						<h3 className="text-xl font-semibold mb-4">Final Results</h3>
						<div className="grid gap-3">
							{room.players.map((player) => (
								<div
									key={player.id}
									className={`p-3 rounded border ${
										player.isAlive
											? "bg-green-50 border-green-200"
											: "bg-red-50 border-red-200"
									}`}
								>
									<div className="flex items-center justify-between">
										<span className="font-medium">{player.name}</span>
										<div className="flex gap-2">
											<span
												className={`text-xs px-2 py-1 rounded ${
													player.role === "mafia"
														? "bg-red-100 text-red-800"
														: player.role === "detective"
															? "bg-blue-100 text-blue-800"
															: player.role === "doctor"
																? "bg-green-100 text-green-800"
																: "bg-gray-100 text-gray-800"
												}`}
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
												{player.isAlive ? "Survived" : "Eliminated"}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
					<button
						onClick={() => (window.location.href = "/")}
						className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors"
					>
						Create New Game
					</button>
				</div>
			</div>
		);
	}

	// Show waiting room
	return (
		<div className="p-8 max-w-md mx-auto">
			<div className="text-center mb-6">
				<h2 className="text-2xl font-bold mb-2">Room: {code}</h2>
				<div className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm">
					Status: <span className="capitalize">{room.status}</span>
				</div>
			</div>

			{/* Narrator Section */}
			<div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
				<h3 className="text-lg font-semibold mb-2 text-purple-800">
					Game Narrator
				</h3>
				<div className="flex items-center justify-between">
					<div>
						<span className="font-medium">
							{room.players.find((p) => p.id === room.leaderId)?.name ||
								"Room Creator"}
						</span>
						<span className="ml-2 text-xs bg-purple-500 text-white px-2 py-1 rounded">
							Narrator
						</span>
						{room.leaderId === userId && (
							<span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
								You
							</span>
						)}
					</div>
					{isLeader && room.status === "waiting" && room.players.length > 0 && (
						<button
							onClick={() => setShowTransferModal(true)}
							className="text-sm bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded transition-colors"
						>
							Transfer Leadership
						</button>
					)}
				</div>
				<p className="text-sm text-purple-600 mt-1">
					The narrator controls the game flow and can see all player
					information.
				</p>
			</div>

			{!hasJoined && room.status === "waiting" && (
				<div className="space-y-4 mb-6">
					<div>
						<label
							htmlFor="playerName"
							className="block text-sm font-medium mb-2"
						>
							Enter your name:
						</label>
						<input
							id="playerName"
							type="text"
							value={playerName}
							onChange={(e) => setPlayerName(e.target.value)}
							placeholder="Your name"
							className="w-full p-2 border rounded"
							onKeyPress={(e) => e.key === "Enter" && handleJoinRoom()}
						/>
					</div>
					<button
						onClick={handleJoinRoom}
						disabled={isJoining || !playerName.trim()}
						className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded transition-colors"
					>
						{isJoining ? "Joining..." : "Join Room"}
					</button>
				</div>
			)}

			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-semibold mb-3">
						Players ({room.players.length})
						{room.players.length < 3 && (
							<span className="text-sm text-red-600 ml-2">
								(Need {3 - room.players.length} more)
							</span>
						)}
					</h3>
					<div className="space-y-2">
						{room.players.map((player) => (
							<div
								key={player.id}
								className={`p-2 rounded ${
									player.id === room.leaderId
										? "bg-yellow-100 border-yellow-300 border"
										: "bg-gray-100"
								}`}
							>
								<span className="font-medium">{player.name}</span>
								{player.id === room.leaderId && (
									<span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded">
										Leader
									</span>
								)}
								{player.id === userId && (
									<span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded">
										You
									</span>
								)}
							</div>
						))}
					</div>
				</div>

				{isLeader && room.status === "waiting" && (
					<button
						onClick={handleStartGame}
						disabled={isStarting || room.players.length < 3}
						className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-2 px-4 rounded transition-colors"
					>
						{isStarting
							? "Starting..."
							: room.players.length < 3
								? `Need ${3 - room.players.length} more players`
								: "Start Game"}
					</button>
				)}

				{room.status === "active" && (
					<div className="text-center p-4 bg-green-100 rounded">
						<h3 className="text-lg font-bold text-green-800">Game Active!</h3>
						<p className="text-green-600">The mafia game is now in progress.</p>
					</div>
				)}
			</div>

			{/* Transfer Leadership Modal */}
			{showTransferModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
						<h3 className="text-lg font-bold mb-4">Transfer Leadership</h3>
						<p className="text-sm text-gray-600 mb-4">
							Select a player to become the new leader and narrator:
						</p>
						<div className="space-y-2 mb-4">
							{room.players.map((player) => (
								<button
									key={player.id}
									onClick={() => handleTransferLeadership(player.id)}
									disabled={isTransferring}
									className="w-full text-left p-3 border rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
								>
									<span className="font-medium">{player.name}</span>
								</button>
							))}
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => setShowTransferModal(false)}
								disabled={isTransferring}
								className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
