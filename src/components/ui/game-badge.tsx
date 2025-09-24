import { Badge, BadgeProps } from "./badge";

interface GameBadgeProps extends Omit<BadgeProps, "variant"> {
	type: "role" | "status" | "special";
	value: string;
}

export function GameBadge({
	type,
	value,
	className,
	...props
}: GameBadgeProps) {
	const getVariant = (type: string, value: string) => {
		if (type === "role") {
			switch (value) {
				case "mafia":
					return "mafia" as const;
				case "detective":
					return "detective" as const;
				case "doctor":
					return "doctor" as const;
				case "citizen":
					return "citizen" as const;
				default:
					return "secondary" as const;
			}
		}

		if (type === "status") {
			switch (value) {
				case "alive":
				case "Alive":
				case "Survived":
					return "alive" as const;
				case "dead":
				case "Dead":
				case "Eliminated":
					return "dead" as const;
				case "Day Vote":
				case "Mafia Vote":
					return "default" as const;
				default:
					return "secondary" as const;
			}
		}

		if (type === "special") {
			switch (value) {
				case "leader":
				case "Leader":
					return "leader" as const;
				case "you":
				case "You":
					return "you" as const;
				case "narrator":
				case "Narrator":
					return "leader" as const; // Use leader variant for narrator
				default:
					return "default" as const;
			}
		}

		return "default" as const;
	};

	const getDisplayValue = (type: string, value: string) => {
		if (type === "role") {
			switch (value) {
				case "mafia":
					return "🔪 Mafia";
				case "detective":
					return "🔍 Detective";
				case "doctor":
					return "⚕️ Doctor";
				case "citizen":
					return "👥 Citizen";
				default:
					return value;
			}
		}

		if (type === "status") {
			switch (value) {
				case "alive":
				case "Alive":
					return "✅ Alive";
				case "dead":
				case "Dead":
					return "💀 Dead";
				case "Survived":
					return "✅ Survived";
				case "Eliminated":
					return "💀 Eliminated";
				default:
					return value;
			}
		}

		return value;
	};

	return (
		<Badge variant={getVariant(type, value)} className={className} {...props}>
			{getDisplayValue(type, value)}
		</Badge>
	);
}
