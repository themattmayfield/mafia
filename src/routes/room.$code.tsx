import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ActiveGame } from "~/components/ActiveGame";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { GameBadge } from "~/components/ui/game-badge";
import { Input } from "~/components/ui/input";
import { getUserId } from "~/utils/user";
import { api } from "../../convex/_generated/api";

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
	const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);

	const userId = getUserId();

	const room = useConvexQuery(api.rooms.getRoomByCode, { code });
	const joinRoomMutation = useConvexMutation(api.rooms.joinRoom);
	const startGameMutation = useConvexMutation(api.rooms.startGame);
	const transferLeadershipMutation = useConvexMutation(
		api.rooms.transferLeadership,
	);
	const removePlayerMutation = useConvexMutation(api.rooms.removePlayer);

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

	const handleRemovePlayer = async (
		playerIdToRemove: string,
		playerName: string,
	) => {
		if (!userId || !isLeader) return;

		const confirmed = confirm(
			`Are you sure you want to remove ${playerName} from the game?`,
		);

		if (!confirmed) return;

		try {
			setRemovingPlayerId(playerIdToRemove);
			await removePlayerMutation({
				code,
				leaderId: userId,
				playerIdToRemove,
			});
		} catch (error) {
			console.error("Failed to remove player:", error);
			alert(
				"Failed to remove player: " +
					(error instanceof Error ? error.message : "Unknown error"),
			);
		} finally {
			setRemovingPlayerId(null);
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
					{/* Victory Animation */}
					<div className="relative">
						<h2 className="text-4xl font-bold mb-4 animate-pulse">
							🏆 Game Over! 🏆
						</h2>
						<div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-2xl animate-bounce">
							✨
						</div>
					</div>

					{(() => {
						// Exclude narrator from win condition display
						const actualPlayers = room.players.filter(
							(p) => p.id !== room.leaderId,
						);
						const allPlayers = actualPlayers;
						const alivePlayers = actualPlayers.filter((p) => p.isAlive);
						const eliminatedPlayers = actualPlayers.filter((p) => !p.isAlive);
						const aliveMafia = alivePlayers.filter((p) => p.role === "mafia");
						const aliveTownspeople = alivePlayers.filter(
							(p) => p.role !== "mafia",
						);
						const totalMafia = allPlayers.filter((p) => p.role === "mafia");
						const eliminatedMafia = eliminatedPlayers.filter(
							(p) => p.role === "mafia",
						);

						let winner = "";
						let winnerColor = "";
						let winnerBg = "";
						let explanation = "";
						let emoji = "";

						if (
							aliveMafia.length >= aliveTownspeople.length &&
							aliveMafia.length > 0
						) {
							winner = "🌙 Mafia Victory! 🌙";
							winnerColor = "text-red-100";
							winnerBg = "bg-gradient-to-r from-red-600 to-red-800";
							explanation = `The Mafia have taken control! With ${aliveMafia.length} Mafia members still alive and only ${aliveTownspeople.length} townspeople remaining, the town has fallen to darkness.`;
							emoji = "🔥";
						} else if (aliveMafia.length === 0) {
							winner = "🌅 Townspeople Victory! 🌅";
							winnerColor = "text-green-100";
							winnerBg = "bg-gradient-to-r from-green-600 to-green-800";
							explanation = `Justice prevails! The brave townspeople have successfully eliminated all ${totalMafia.length} Mafia member${totalMafia.length > 1 ? "s" : ""} and saved their community.`;
							emoji = "🎉";
						} else {
							winner = "Game Ended";
							winnerColor = "text-gray-100";
							winnerBg = "bg-gradient-to-r from-gray-600 to-gray-800";
							explanation = "The game has ended.";
							emoji = "🏁";
						}

						return (
							<div className="space-y-4">
								<div
									className={`${winnerBg} rounded-2xl p-6 shadow-2xl border border-opacity-30`}
								>
									<div className={`text-3xl font-bold ${winnerColor} mb-3`}>
										{winner}
									</div>
									<p
										className={`text-lg ${winnerColor.replace("100", "200")} leading-relaxed`}
									>
										{explanation}
									</p>
								</div>

								{/* Game Statistics */}
								<div className="bg-gray-50 rounded-xl p-4 border shadow-sm">
									<h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
										📊 Game Statistics
									</h4>
									<div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
										<div className="text-center p-2 bg-white rounded border">
											<div className="font-semibold text-gray-800">
												{allPlayers.length}
											</div>
											<div className="text-gray-600">Total Players</div>
										</div>
										<div className="text-center p-2 bg-white rounded border">
											<div className="font-semibold text-red-600">
												{totalMafia.length}
											</div>
											<div className="text-gray-600">Mafia Members</div>
										</div>
										<div className="text-center p-2 bg-white rounded border">
											<div className="font-semibold text-orange-600">
												{eliminatedPlayers.length}
											</div>
											<div className="text-gray-600">Total Eliminated</div>
										</div>
										<div className="text-center p-2 bg-white rounded border">
											<div className="font-semibold text-green-600">
												{alivePlayers.length}
											</div>
											<div className="text-gray-600">Survivors</div>
										</div>
										<div className="text-center p-2 bg-white rounded border">
											<div className="font-semibold text-red-800">
												{eliminatedMafia.length}
											</div>
											<div className="text-gray-600">Mafia Eliminated</div>
										</div>
										<div className="text-center p-2 bg-white rounded border">
											<div className="font-semibold text-blue-600">
												{allPlayers.filter((p) => p.role === "detective")
													.length > 0
													? "✓"
													: "✗"}
											</div>
											<div className="text-gray-600">Detective Present</div>
										</div>
									</div>
								</div>
							</div>
						);
					})()}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								🎭 Final Player Results
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid gap-3">
								{room.players
									.filter((player) => player.id !== room.leaderId) // Exclude narrator
									.sort((a, b) => {
										// Sort: Survivors first, then by role (mafia first, then special roles)
										if (a.isAlive !== b.isAlive) return b.isAlive ? 1 : -1;
										const roleOrder: Record<string, number> = {
											mafia: 0,
											detective: 1,
											doctor: 2,
											citizen: 3,
										};
										return (
											(roleOrder[a.role || ""] || 3) -
											(roleOrder[b.role || ""] || 3)
										);
									})
									.map((player) => (
										<Card
											key={player.id}
											className={`transition-all ${
												player.isAlive
													? "bg-gradient-to-r from-green-50 to-green-100 border-green-300"
													: "bg-gradient-to-r from-red-50 to-red-100 border-red-300"
											}`}
										>
											<CardContent className="p-4">
												<div className="flex items-center justify-between">
													<div className="flex items-center gap-3">
														<div
															className={`w-3 h-3 rounded-full ${player.isAlive ? "bg-green-500" : "bg-red-500"}`}
														/>
														<span className="font-semibold text-gray-800">
															{player.name}
														</span>
													</div>
													<div className="flex gap-2 items-center">
														<GameBadge
															type="role"
															value={player.role || "citizen"}
														/>
														<GameBadge
															type="status"
															value={player.isAlive ? "Survived" : "Eliminated"}
														/>
													</div>
												</div>
											</CardContent>
										</Card>
									))}
							</div>
						</CardContent>
					</Card>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Button
							onClick={() => {
								// Reset the room to waiting state with same players
								const restartGame = async () => {
									try {
										const response = await fetch("/api/rooms/restart", {
											method: "POST",
											headers: { "Content-Type": "application/json" },
											body: JSON.stringify({
												code: room.code,
												leaderId: room.leaderId,
											}),
										});
										if (response.ok) {
											window.location.reload();
										}
									} catch (error) {
										console.error("Failed to restart game:", error);
									}
								};
								restartGame();
							}}
							variant="default"
							size="lg"
							className="shadow-lg"
						>
							🎮 Play Again with Same Players
						</Button>
						<Button
							onClick={() => (window.location.href = "/")}
							variant="secondary"
							size="lg"
							className="shadow-lg"
						>
							🏠 Create New Game
						</Button>
						<Button
							onClick={() => {
								const gameData = {
									winner:
										room.status === "finished" ? "game completed" : "unknown",
									players: room.players
										.filter((p) => p.id !== room.leaderId)
										.map((p) => ({
											name: p.name,
											role: p.role,
											survived: p.isAlive,
										})),
									code: room.code,
								};
								navigator.clipboard.writeText(
									JSON.stringify(gameData, null, 2),
								);
								alert("Game results copied to clipboard!");
							}}
							variant="outline"
							size="lg"
							className="shadow-lg"
						>
							📋 Copy Results
						</Button>
					</div>
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
						<GameBadge type="special" value="Narrator" className="ml-2" />
						{room.leaderId === userId && (
							<GameBadge type="special" value="You" className="ml-2" />
						)}
					</div>
					{isLeader && room.status === "waiting" && room.players.length > 0 && (
						<Button
							onClick={() => setShowTransferModal(true)}
							variant="outline"
							size="sm"
						>
							Transfer Leadership
						</Button>
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
						<Input
							id="playerName"
							type="text"
							value={playerName}
							onChange={(e) => setPlayerName(e.target.value)}
							placeholder="Your name"
							onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
						/>
					</div>
					<Button
						onClick={handleJoinRoom}
						disabled={isJoining || !playerName.trim()}
						className="w-full"
						variant="default"
					>
						{isJoining ? "Joining..." : "Join Room"}
					</Button>
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
								className={`p-2 rounded flex items-center justify-between ${
									player.id === room.leaderId
										? "bg-yellow-100 border-yellow-300 border"
										: "bg-gray-100"
								}`}
							>
								<div className="flex items-center gap-2">
									<span className="font-medium">{player.name}</span>
									{player.id === room.leaderId && (
										<GameBadge type="special" value="Leader" />
									)}
									{player.id === userId && (
										<GameBadge type="special" value="You" />
									)}
								</div>
								{isLeader &&
									player.id !== room.leaderId &&
									player.id !== userId && (
										<Button
											onClick={() => handleRemovePlayer(player.id, player.name)}
											disabled={removingPlayerId === player.id}
											variant="ghost"
											size="sm"
											className="text-red-500 hover:text-red-700 hover:bg-red-50"
											title={`Remove ${player.name} from game`}
										>
											{removingPlayerId === player.id ? "..." : "✕"}
										</Button>
									)}
							</div>
						))}
					</div>
				</div>

				{isLeader && room.status === "waiting" && (
					<Button
						onClick={handleStartGame}
						disabled={isStarting || room.players.length < 3}
						className="w-full"
						variant="default"
						size="lg"
					>
						{isStarting
							? "Starting..."
							: room.players.length < 3
								? `Need ${3 - room.players.length} more players`
								: "Start Game"}
					</Button>
				)}

				{room.status === "active" && (
					<Card className="text-center bg-green-50 border-green-200">
						<CardContent className="p-4">
							<h3 className="text-lg font-bold text-green-800">Game Active!</h3>
							<p className="text-green-600">
								The mafia game is now in progress.
							</p>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Transfer Leadership Modal */}
			<AlertDialog open={showTransferModal} onOpenChange={setShowTransferModal}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Transfer Leadership</AlertDialogTitle>
						<AlertDialogDescription>
							Select a player to become the new leader and narrator:
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="space-y-2 my-4">
						{room.players.map((player) => (
							<Button
								key={player.id}
								onClick={() => handleTransferLeadership(player.id)}
								disabled={isTransferring}
								variant="outline"
								className="w-full justify-start"
							>
								<span className="font-medium">{player.name}</span>
							</Button>
						))}
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isTransferring}>
							Cancel
						</AlertDialogCancel>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
