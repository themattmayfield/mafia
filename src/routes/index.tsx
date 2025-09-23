import { createFileRoute } from "@tanstack/react-router";
import { api } from "../../convex/_generated/api";
import { useConvexMutation } from "@convex-dev/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { getUserId } from "~/utils/user";

export const Route = createFileRoute("/")({
	component: Home,
});

function Home() {
	const [roomLink, setRoomLink] = useState<string>("");
	const [isCreating, setIsCreating] = useState(false);

	const createRoomMutation = useConvexMutation(api.rooms.createRoom);

	const handleCreateRoom = async () => {
		setIsCreating(true);
		try {
			const userId = getUserId();
			const result = await createRoomMutation({ leaderId: userId });
			const link = `${window.location.origin}/room/${result.code}`;
			setRoomLink(link);
			toast.success(`Room created! Code: ${result.code}`);
		} catch (error) {
			toast.error("Failed to create room");
			console.error("Error creating room:", error);
		} finally {
			setIsCreating(false);
		}
	};

	const copyToClipboard = async () => {
		if (!roomLink) return;

		try {
			await navigator.clipboard.writeText(roomLink);
			toast.success("Link copied to clipboard!");
		} catch (error) {
			toast.error("Failed to copy to clipboard");
			console.error("Error copying to clipboard:", error);
		}
	};

	return (
		<div className="p-8 max-w-md mx-auto">
			<h3 className="text-2xl font-bold mb-6">Welcome to Mafia Game!</h3>

			<div className="space-y-4">
				<button
					onClick={handleCreateRoom}
					disabled={isCreating}
					className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded transition-colors"
				>
					{isCreating ? "Creating..." : "Create New Room"}
				</button>

				{roomLink && (
					<div className="mt-4 p-4 bg-gray-100 rounded">
						<p className="text-sm text-gray-600 mb-2">Share this link:</p>
						<div className="flex gap-2">
							<input
								type="text"
								value={roomLink}
								readOnly
								className="flex-1 p-2 border rounded text-sm"
							/>
							<button
								onClick={copyToClipboard}
								className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm transition-colors"
							>
								Copy
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
