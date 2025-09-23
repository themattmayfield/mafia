import { useState } from "react";
import { useConvexQuery } from "@convex-dev/react-query";
import { api } from "../../../convex/_generated/api";
import { getUserId, setUserId } from "~/utils/user";
import { useRouter } from "@tanstack/react-router";
import toast from "react-hot-toast";

export function PlayerSwitcherPlugin() {
	const router = useRouter();
	const currentUserId = getUserId();
	const [selectedRoomCode, setSelectedRoomCode] = useState("");
	
	// Get current route params to detect if we're in a room
	const currentLocation = router.state.location;
	const roomCodeFromUrl = currentLocation.pathname.startsWith('/room/') 
		? currentLocation.pathname.split('/room/')[1] 
		: '';

	// Use room code from URL if available, otherwise use selected room
	const roomCode = roomCodeFromUrl || selectedRoomCode;
	
	// Query room data if we have a room code
	const room = useConvexQuery(
		api.rooms.getRoomByCode, 
		roomCode ? { code: roomCode } : "skip"
	);

	const handlePlayerSwitch = (playerId: string, playerName: string) => {
		setUserId(playerId);
		toast.success(`Switched to player: ${playerName}`);
		// Refresh the page to update the UI with new user ID
		window.location.reload();
	};

	const currentPlayer = room?.players.find(p => p.id === currentUserId);

	return (
		<div className="p-4 space-y-4 text-sm">
			<div className="border-b pb-2">
				<h3 className="font-bold text-lg text-gray-800">Player Switcher</h3>
				<p className="text-gray-600 text-xs">Switch between players in the current room</p>
			</div>

			{/* Room Code Input (if not in a room) */}
			{!roomCodeFromUrl && (
				<div>
					<label className="block text-xs font-medium text-gray-700 mb-1">
						Room Code:
					</label>
					<input
						type="text"
						value={selectedRoomCode}
						onChange={(e) => setSelectedRoomCode(e.target.value.toUpperCase())}
						placeholder="Enter room code..."
						className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
					/>
				</div>
			)}

			{/* Current Room Info */}
			{roomCode && (
				<div className="bg-gray-50 p-2 rounded">
					<div className="text-xs text-gray-600">
						<strong>Room:</strong> {roomCode}
					</div>
					{room && (
						<div className="text-xs text-gray-600">
							<strong>Status:</strong> <span className="capitalize">{room.status}</span>
						</div>
					)}
				</div>
			)}

			{/* Current User Info */}
			<div className="bg-blue-50 p-2 rounded">
				<div className="text-xs text-gray-600">
					<strong>Current User ID:</strong>
				</div>
				<div className="font-mono text-xs break-all text-blue-800">
					{currentUserId}
				</div>
				{currentPlayer && (
					<div className="text-xs text-blue-600 mt-1">
						Playing as: <strong>{currentPlayer.name}</strong>
						{currentPlayer.role && (
							<span className="ml-1">({currentPlayer.role})</span>
						)}
					</div>
				)}
			</div>

			{/* Players List */}
			{room && room.players && room.players.length > 0 ? (
				<div>
					<h4 className="font-medium text-gray-700 mb-2">
						Active Players ({room.players.length}):
					</h4>
					<div className="space-y-1 max-h-64 overflow-y-auto">
						{room.players.map((player) => (
							<div
								key={player.id}
								className={`flex items-center justify-between p-2 rounded border ${
									player.id === currentUserId
										? "bg-blue-100 border-blue-300"
										: "bg-white border-gray-200 hover:bg-gray-50"
								}`}
							>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-xs truncate">
										{player.name}
										{player.id === currentUserId && (
											<span className="ml-1 text-blue-600">(current)</span>
										)}
									</div>
									<div className="font-mono text-xs text-gray-500 truncate">
										{player.id}
									</div>
									{player.role && (
										<div className="text-xs text-gray-600">
											Role: {player.role}
										</div>
									)}
									{player.isAlive !== undefined && (
										<div className={`text-xs ${player.isAlive ? 'text-green-600' : 'text-red-600'}`}>
											{player.isAlive ? 'Alive' : 'Dead'}
										</div>
									)}
								</div>
								{player.id !== currentUserId && (
									<button
										onClick={() => handlePlayerSwitch(player.id, player.name)}
										className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
									>
										Switch
									</button>
								)}
							</div>
						))}
					</div>
				</div>
			) : roomCode && room ? (
				<div className="text-center text-gray-500 py-4">
					<p className="text-xs">No players in this room yet</p>
				</div>
			) : roomCode ? (
				<div className="text-center text-gray-500 py-4">
					<p className="text-xs">Room not found or loading...</p>
				</div>
			) : (
				<div className="text-center text-gray-500 py-4">
					<p className="text-xs">Enter a room code to see players</p>
				</div>
			)}

			{/* Instructions */}
			<div className="border-t pt-2 text-xs text-gray-500">
				<p><strong>How to use:</strong></p>
				<ul className="list-disc list-inside space-y-1 mt-1">
					<li>Navigate to a room to automatically load players</li>
					<li>Or enter a room code manually above</li>
					<li>Click "Switch" to become that player</li>
					<li>Your user ID is stored in localStorage as "mafia_userId"</li>
				</ul>
			</div>
		</div>
	);
}
