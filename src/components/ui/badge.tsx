import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
				secondary:
					"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
				destructive:
					"border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
				outline: "text-foreground",
				// Game-specific role variants
				mafia:
					"border-transparent bg-red-100 text-red-800 shadow hover:bg-red-200",
				detective:
					"border-transparent bg-blue-100 text-blue-800 shadow hover:bg-blue-200",
				doctor:
					"border-transparent bg-emerald-100 text-emerald-800 shadow hover:bg-emerald-200",
				citizen:
					"border-transparent bg-gray-100 text-gray-800 shadow hover:bg-gray-200",
				// Status variants
				leader:
					"border-transparent bg-yellow-100 text-yellow-800 shadow hover:bg-yellow-200",
				alive:
					"border-transparent bg-green-100 text-green-800 shadow hover:bg-green-200",
				dead: "border-transparent bg-gray-100 text-gray-600 shadow hover:bg-gray-200",
				you: "border-transparent bg-blue-100 text-blue-800 shadow hover:bg-blue-200",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
