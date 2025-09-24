import { useConvexMutation } from "@convex-dev/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { getUserId } from "~/utils/user";
import { api } from "../../convex/_generated/api";

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
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">🎭 Welcome to Mafia Game!</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Button
						onClick={handleCreateRoom}
						disabled={isCreating}
						className="w-full"
						size="lg"
					>
						{isCreating ? "Creating..." : "🚀 Create New Room"}
					</Button>

					{roomLink && (
						<Card className="mt-4">
							<CardContent className="p-4">
								<p className="text-sm text-muted-foreground mb-2">
									Share this link:
								</p>
								<div className="flex gap-2">
									<Input
										type="text"
										value={roomLink}
										readOnly
										className="flex-1 text-sm"
									/>
									<Button
										onClick={copyToClipboard}
										variant="secondary"
										size="sm"
									>
										📋 Copy
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
