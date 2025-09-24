import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query";
import * as React from "react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { g as getUserId, a as api, R as Route } from "./router-CzQDN71E.js";
import { d as cn, C as Card, a as CardHeader, b as CardTitle, c as CardContent, B as Button, e as buttonVariants, I as Input } from "./input-DxlSZ6V2.js";
import { cva } from "class-variance-authority";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "@tanstack/react-router-ssr-query";
import "convex/react";
import "@tanstack/react-devtools";
import "@tanstack/react-query-devtools";
import "@tanstack/react-router-devtools";
import "@faker-js/faker";
import "convex/server";
import "./createMiddleware-CRzJRBrm.js";
import "@tanstack/router-core/ssr/client";
import "../server.js";
import "@tanstack/history";
import "@tanstack/router-core";
import "@tanstack/router-core/ssr/server";
import "node:async_hooks";
import "h3";
import "tiny-invariant";
import "seroval";
import "@tanstack/react-router/ssr/server";
import "@radix-ui/react-slot";
import "clsx";
import "tailwind-merge";
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Game-specific role variants
        mafia: "border-transparent bg-red-100 text-red-800 shadow hover:bg-red-200",
        detective: "border-transparent bg-blue-100 text-blue-800 shadow hover:bg-blue-200",
        doctor: "border-transparent bg-emerald-100 text-emerald-800 shadow hover:bg-emerald-200",
        citizen: "border-transparent bg-gray-100 text-gray-800 shadow hover:bg-gray-200",
        // Status variants
        leader: "border-transparent bg-yellow-100 text-yellow-800 shadow hover:bg-yellow-200",
        alive: "border-transparent bg-green-100 text-green-800 shadow hover:bg-green-200",
        dead: "border-transparent bg-gray-100 text-gray-600 shadow hover:bg-gray-200",
        you: "border-transparent bg-blue-100 text-blue-800 shadow hover:bg-blue-200"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
function GameBadge({
  type,
  value,
  className,
  ...props
}) {
  const getVariant = (type2, value2) => {
    if (type2 === "role") {
      switch (value2) {
        case "mafia":
          return "mafia";
        case "detective":
          return "detective";
        case "doctor":
          return "doctor";
        case "citizen":
          return "citizen";
        default:
          return "secondary";
      }
    }
    if (type2 === "status") {
      switch (value2) {
        case "alive":
        case "Alive":
        case "Survived":
          return "alive";
        case "dead":
        case "Dead":
        case "Eliminated":
          return "dead";
        case "Day Vote":
        case "Mafia Vote":
          return "default";
        default:
          return "secondary";
      }
    }
    if (type2 === "special") {
      switch (value2) {
        case "leader":
        case "Leader":
          return "leader";
        case "you":
        case "You":
          return "you";
        case "narrator":
        case "Narrator":
          return "leader";
        // Use leader variant for narrator
        default:
          return "default";
      }
    }
    return "default";
  };
  const getDisplayValue = (type2, value2) => {
    if (type2 === "role") {
      switch (value2) {
        case "mafia":
          return "🔪 Mafia";
        case "detective":
          return "🔍 Detective";
        case "doctor":
          return "⚕️ Doctor";
        case "citizen":
          return "👥 Citizen";
        default:
          return value2;
      }
    }
    if (type2 === "status") {
      switch (value2) {
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
          return value2;
      }
    }
    return value2;
  };
  return /* @__PURE__ */ jsx(Badge, { variant: getVariant(type, value), className, ...props, children: getDisplayValue(type, value) });
}
function ActiveGame({ room }) {
  const userId = getUserId();
  const currentPlayer = room.players.find((p) => p.id === userId);
  const isNarrator = room.leaderId === userId;
  const isPlayerInGame = !!currentPlayer;
  if (isNarrator) {
    return /* @__PURE__ */ jsx(NarratorView, { room });
  }
  if (!isPlayerInGame) {
    return /* @__PURE__ */ jsx(SpectatorView, { room });
  }
  return /* @__PURE__ */ jsx(PlayerView, { room, currentPlayer });
}
function NarratorView({ room }) {
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
        narratorId: userId
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
        narratorId: userId
      });
      toast.success("Game ended");
    } catch (error) {
      toast.error("Failed to end game");
      console.error("Error ending game:", error);
    } finally {
      setIsEnding(false);
    }
  };
  const handleExecuteVotes = async (voteType) => {
    try {
      await executeVotesMutation({
        code: room.code,
        narratorId: userId,
        voteType
      });
      toast.success(`${voteType === "day" ? "Day" : "Mafia"} votes executed`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to execute votes";
      toast.error(errorMessage);
      console.error("Error executing votes:", error);
    }
  };
  const handleRemovePlayerActive = async (playerIdToRemove, playerName, playerRole) => {
    if (!userId) return;
    let roleWarning = "";
    let balanceImpact = "";
    switch (playerRole) {
      case "mafia":
        roleWarning = "⚠️ Removing a Mafia member will help the townspeople win.";
        balanceImpact = "This significantly favors the townspeople.";
        break;
      case "detective":
        roleWarning = "⚠️ Removing the Detective eliminates the townspeople's investigation ability.";
        balanceImpact = "This significantly favors the Mafia.";
        break;
      case "doctor":
        roleWarning = "⚠️ Removing the Doctor eliminates the townspeople's protection ability.";
        balanceImpact = "This significantly favors the Mafia.";
        break;
      case "citizen":
        roleWarning = "Removing a Citizen reduces townspeople numbers.";
        balanceImpact = "This may slightly favor the Mafia.";
        break;
    }
    const confirmed = confirm(
      `Are you sure you want to remove ${playerName} (${playerRole}) from the active game?

${roleWarning}
${balanceImpact}

This action cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await removePlayerMutation({
        code: room.code,
        leaderId: userId,
        playerIdToRemove
      });
      toast.success(`${playerName} has been removed from the game`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove player";
      toast.error(errorMessage);
      console.error("Error removing player:", error);
    }
  };
  const getNightActionsStatus = () => {
    if (room.gamePhase !== "night") return { complete: true, pending: [] };
    const pending = [];
    const actualPlayers = room.players.filter((p) => p.id !== room.leaderId);
    const aliveMafia = actualPlayers.filter(
      (p) => p.isAlive && p.role === "mafia"
    );
    const aliveDoctor = actualPlayers.find(
      (p) => p.isAlive && p.role === "doctor"
    );
    const aliveDetective = actualPlayers.find(
      (p) => p.isAlive && p.role === "detective"
    );
    const currentVotes = room.currentVotes || [];
    const nightActions = room.nightActions || [];
    for (const mafiaPlayer of aliveMafia) {
      const hasVoted = currentVotes.some(
        (vote) => vote.voterId === mafiaPlayer.id && vote.voteType === "mafia"
      );
      if (!hasVoted) {
        pending.push(`${mafiaPlayer.name} (Mafia Vote)`);
      }
    }
    if (aliveDoctor) {
      const hasActed = nightActions.some(
        (action) => action.playerId === aliveDoctor.id && action.action === "protect"
      );
      if (!hasActed) {
        pending.push(`${aliveDoctor.name} (Doctor Action)`);
      }
    }
    if (aliveDetective) {
      const hasActed = nightActions.some(
        (action) => action.playerId === aliveDetective.id && action.action === "investigate"
      );
      if (!hasActed) {
        pending.push(`${aliveDetective.name} (Detective Action)`);
      }
    }
    return { complete: pending.length === 0, pending };
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs(Card, { className: "bg-purple-50 border-purple-200", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-purple-800", children: "🎭 Narrator View" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Phase:" }),
        /* @__PURE__ */ jsx("span", { className: "ml-2 px-2 py-1 bg-purple-100 rounded capitalize text-purple-800", children: room.gamePhase })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "👥 All Players & Roles" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: room.players.filter((player) => player.id !== room.leaderId).map((player) => /* @__PURE__ */ jsx(
        "div",
        {
          className: `p-3 rounded-lg border ${player.isAlive ? "bg-white" : "bg-gray-100 opacity-60"}`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: player.name }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(GameBadge, { type: "role", value: player.role || "citizen" }),
              /* @__PURE__ */ jsx(
                GameBadge,
                {
                  type: "status",
                  value: player.isAlive ? "Alive" : "Dead"
                }
              )
            ] })
          ] })
        },
        player.id
      )) }) })
    ] }),
    room.phaseTransitionMessage && /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-r from-purple-100 to-indigo-100 p-4 rounded-lg border-2 border-purple-200 shadow-lg animate-pulse", children: /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx("p", { className: "text-lg font-medium text-purple-800 leading-relaxed", children: room.phaseTransitionMessage }) }) }),
    room.lastEliminationResult && /* @__PURE__ */ jsxs(Card, { className: "bg-orange-50 border-orange-200", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-orange-800", children: "📰 Latest Result" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("p", { className: "text-sm text-orange-700", children: room.lastEliminationResult }) })
    ] }),
    room.currentVotes && room.currentVotes.length > 0 && /* @__PURE__ */ jsxs(Card, { className: "bg-blue-50 border-blue-200", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-blue-800", children: "🗳️ Current Votes" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-2", children: room.currentVotes.map((vote, index) => {
        const voter = room.players.find((p) => p.id === vote.voterId);
        const target = room.players.find((p) => p.id === vote.targetId);
        return /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: voter?.name }),
          vote.targetId === "ABSTAIN" ? /* @__PURE__ */ jsxs("span", { className: "text-gray-600", children: [
            " ",
            "abstained from voting"
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("span", { className: "text-blue-600", children: [
              " ",
              "voted to eliminate",
              " "
            ] }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: target?.name })
          ] }),
          /* @__PURE__ */ jsx(
            GameBadge,
            {
              type: "status",
              value: vote.voteType === "day" ? "Day Vote" : "Mafia Vote",
              className: "ml-2"
            }
          )
        ] }, index);
      }) }) })
    ] }),
    room.gamePhase === "night" && (() => {
      const nightStatus = getNightActionsStatus();
      return /* @__PURE__ */ jsxs(
        Card,
        {
          className: nightStatus.complete ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200",
          children: [
            /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(
              CardTitle,
              {
                className: nightStatus.complete ? "text-green-800" : "text-yellow-800",
                children: "🌙 Night Actions Status"
              }
            ) }),
            /* @__PURE__ */ jsx(CardContent, { children: nightStatus.complete ? /* @__PURE__ */ jsx("p", { className: "text-sm text-green-600", children: "✅ All night actions complete - Ready to execute votes" }) : /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-yellow-600 mb-2", children: "⏳ Waiting for:" }),
              /* @__PURE__ */ jsx("ul", { className: "text-sm text-yellow-700 ml-4", children: nightStatus.pending.map((pending, index) => /* @__PURE__ */ jsxs("li", { children: [
                "• ",
                pending
              ] }, index)) })
            ] }) })
          ]
        }
      );
    })(),
    /* @__PURE__ */ jsxs(Card, { className: "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200", children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "flex items-center gap-2", children: "🎭 Narrator Controls" }) }),
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-3 p-3 bg-white rounded border border-purple-100", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-700 leading-relaxed", children: [
            /* @__PURE__ */ jsx("strong", { children: "Current Phase:" }),
            " ",
            room.gamePhase === "day" ? "🌞 Day Phase" : "🌙 Night Phase"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-1", children: room.gamePhase === "day" ? "Players discuss and vote to eliminate suspects. Execute votes when ready, then advance to night." : "Special roles act in secret. Wait for all actions to complete, then execute night votes and advance to day." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: handleAdvancePhase,
              disabled: isAdvancing,
              title: `Advance to ${room.gamePhase === "day" ? "Night" : "Day"} phase`,
              className: "transition-all transform hover:scale-105",
              children: [
                room.gamePhase === "day" ? "🌙" : "🌞",
                isAdvancing ? "Advancing..." : `Start ${room.gamePhase === "day" ? "Night" : "Day"} Phase`
              ]
            }
          ),
          room.gamePhase === "day" && room.currentVotes?.some((v) => v.voteType === "day") && /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => handleExecuteVotes("day"),
              title: "Execute the current day votes and eliminate the selected player",
              variant: "secondary",
              className: "bg-yellow-500 hover:bg-yellow-600 text-white transition-all transform hover:scale-105",
              children: "⚖️ Execute Day Votes"
            }
          ),
          room.gamePhase === "night" && room.currentVotes?.some((v) => v.voteType === "mafia") && (() => {
            const nightStatus = getNightActionsStatus();
            return /* @__PURE__ */ jsxs(
              Button,
              {
                onClick: () => handleExecuteVotes("mafia"),
                disabled: !nightStatus.complete,
                className: `transition-all transform hover:scale-105 text-white ${nightStatus.complete ? "bg-red-500 hover:bg-red-600" : "bg-gray-400 cursor-not-allowed"}`,
                title: nightStatus.complete ? "Execute mafia votes and reveal night results" : `Waiting for: ${nightStatus.pending.join(", ")}`,
                children: [
                  "🔪",
                  " ",
                  nightStatus.complete ? "Execute Mafia Votes" : "Waiting for Actions..."
                ]
              }
            );
          })(),
          /* @__PURE__ */ jsxs(
            Button,
            {
              onClick: handleEndGame,
              disabled: isEnding,
              title: "End the current game (emergency use only)",
              variant: "destructive",
              className: "transition-all transform hover:scale-105",
              children: [
                "🏁 ",
                isEnding ? "Ending..." : "End Game"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 p-3 bg-white rounded border border-purple-100", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold text-green-600", children: room.players.filter(
              (p) => p.id !== room.leaderId && p.isAlive
            ).length }),
            /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Players Alive" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold text-red-600", children: room.players.filter(
              (p) => p.id !== room.leaderId && p.role === "mafia" && p.isAlive
            ).length }),
            /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Mafia Alive" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold text-blue-600", children: room.currentVotes?.length || 0 }),
            /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Current Votes" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold text-purple-600", children: room.nightActions?.filter((a) => a.isLocked).length || 0 }),
            /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Night Actions" })
          ] })
        ] }) }),
        room.gameHistory && room.gameHistory.length > 0 && /* @__PURE__ */ jsxs("details", { className: "mt-3", children: [
          /* @__PURE__ */ jsxs("summary", { className: "cursor-pointer text-sm font-medium text-purple-800 hover:text-purple-600 p-2 bg-white rounded border border-purple-100", children: [
            "📜 Game History (",
            room.gameHistory.length,
            " events)"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-2 p-3 bg-white rounded border border-purple-100 max-h-32 overflow-y-auto", children: /* @__PURE__ */ jsx("div", { className: "space-y-1 text-xs", children: room.gameHistory.slice(-10).reverse().map((event, index) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex justify-between items-center text-gray-600",
              children: [
                /* @__PURE__ */ jsx("span", { children: event.description }),
                /* @__PURE__ */ jsx("span", { className: "text-gray-400", children: new Date(event.timestamp).toLocaleTimeString() })
              ]
            },
            index
          )) }) })
        ] }),
        /* @__PURE__ */ jsxs("details", { className: "mt-3", children: [
          /* @__PURE__ */ jsx("summary", { className: "cursor-pointer text-sm font-medium text-red-800 hover:text-red-600 p-2 bg-white rounded border border-red-100", children: "🚨 Emergency Player Removal" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 p-3 bg-white rounded border border-red-100", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-600 mb-3", children: "⚠️ Only use if a player needs to leave unexpectedly. This may affect game balance." }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: room.players.filter((p) => p.id !== room.leaderId && p.isAlive).map((player) => /* @__PURE__ */ jsxs(
              "div",
              {
                className: "flex items-center justify-between p-2 bg-gray-50 rounded",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: player.name }),
                    /* @__PURE__ */ jsx(
                      GameBadge,
                      {
                        type: "role",
                        value: player.role || "citizen"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      onClick: () => handleRemovePlayerActive(
                        player.id,
                        player.name,
                        player.role
                      ),
                      variant: "destructive",
                      size: "sm",
                      className: "text-xs px-2 py-1 h-auto",
                      children: "Remove"
                    }
                  )
                ]
              },
              player.id
            )) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function PlayerView({
  room,
  currentPlayer
}) {
  const [selectedTarget, setSelectedTarget] = useState("");
  const [selectedVoteTarget, setSelectedVoteTarget] = useState("");
  const [isVoting, setIsVoting] = useState(false);
  const castVoteMutation = useConvexMutation(api.rooms.castVote);
  const performNightActionMutation = useConvexMutation(
    api.rooms.performNightAction
  );
  const nightActionResult = useConvexQuery(api.rooms.getNightActionResult, {
    code: room.code,
    playerId: currentPlayer.id
  });
  const canSeeMafia = currentPlayer.role === "mafia" && room.gamePhase === "night";
  const mafiaMembers = room.players.filter(
    (p) => p.role === "mafia" && p.isAlive
  );
  const currentVote = room.currentVotes?.find(
    (v) => v.voterId === currentPlayer.id && v.voteType === (room.gamePhase === "day" ? "day" : "mafia")
  );
  const handleVote = async (voteType) => {
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
        voteType
      });
      toast.success(
        `Vote cast for ${room.players.find((p) => p.id === selectedVoteTarget)?.name}`
      );
      setSelectedVoteTarget("");
    } catch (error) {
      toast.error("Failed to cast vote");
      console.error("Error casting vote:", error);
    } finally {
      setIsVoting(false);
    }
  };
  const handleVoteAbstain = async (voteType) => {
    setIsVoting(true);
    try {
      await castVoteMutation({
        code: room.code,
        voterId: currentPlayer.id,
        targetId: "ABSTAIN",
        voteType
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
  const handleNightAction = async (action) => {
    if (!selectedTarget) {
      toast.error("Please select a target");
      return;
    }
    try {
      await performNightActionMutation({
        code: room.code,
        playerId: currentPlayer.id,
        action,
        targetId: selectedTarget
      });
      toast.success(
        `${action === "investigate" ? "Investigation" : "Protection"} performed`
      );
      setSelectedTarget("");
    } catch (error) {
      toast.error(`Failed to ${action}`);
      console.error(`Error performing ${action}:`, error);
    }
  };
  const handleNightActionAbstain = async (action) => {
    try {
      await performNightActionMutation({
        code: room.code,
        playerId: currentPlayer.id,
        action,
        targetId: "ABSTAIN"
      });
      toast.success(`Chose not to ${action} anyone this night`);
      setSelectedTarget("");
    } catch (error) {
      toast.error(`Failed to abstain from ${action}`);
      console.error(`Error abstaining from ${action}:`, error);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 p-4 rounded-lg", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold mb-2", children: "Your Role" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          GameBadge,
          {
            type: "role",
            value: currentPlayer.role || "citizen",
            className: "px-3 py-2 font-medium"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: getRoleDescription(currentPlayer.role) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: `inline-block px-6 py-3 rounded-xl font-bold text-lg ${room.gamePhase === "day" ? "bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-900 border-2 border-yellow-300" : "bg-gradient-to-r from-blue-200 to-purple-200 text-blue-900 border-2 border-blue-300"}`,
          children: room.gamePhase === "day" ? "☀️ Day Phase" : "🌙 Night Phase"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-2", children: room.gamePhase === "day" ? "Discuss and vote to eliminate a suspected mafia member" : "Special roles take their actions in secret" })
    ] }),
    canSeeMafia && /* @__PURE__ */ jsxs("div", { className: "bg-red-50 p-4 rounded-lg border border-red-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-red-800 mb-2", children: "Your Mafia Team" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2", children: mafiaMembers.map((member) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: member.name }),
        member.id === currentPlayer.id && /* @__PURE__ */ jsx(GameBadge, { type: "special", value: "You" })
      ] }, member.id)) })
    ] }),
    room.gamePhase === "day" && /* @__PURE__ */ jsxs("div", { className: "bg-yellow-50 p-4 rounded-lg border border-yellow-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-yellow-800 mb-3", children: "Day Phase Voting" }),
      currentVote ? /* @__PURE__ */ jsxs("div", { className: "bg-yellow-100 p-3 rounded border border-yellow-300", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
          "You voted to eliminate:",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: room.players.find((p) => p.id === currentVote.targetId)?.name })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-yellow-600 mt-1", children: "You can change your vote by selecting a different player below." })
      ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-yellow-600 mb-3", children: "Vote to eliminate a player you suspect is mafia:" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2 mt-3", children: room.players.filter(
        (p) => p.isAlive && p.id !== currentPlayer.id && p.id !== room.leaderId
      ).map((player) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setSelectedVoteTarget(player.id),
          className: `w-full text-left p-2 rounded border transition-colors ${selectedVoteTarget === player.id ? "bg-yellow-100 border-yellow-300" : "bg-white hover:bg-gray-50"}`,
          children: player.name
        },
        player.id
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-2", children: [
        selectedVoteTarget && /* @__PURE__ */ jsx(
          Button,
          {
            onClick: () => handleVote("day"),
            disabled: isVoting,
            className: "w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white",
            children: isVoting ? "Casting Vote..." : "Vote to Eliminate"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: () => handleVoteAbstain("day"),
            disabled: isVoting,
            variant: "secondary",
            className: "w-full",
            children: isVoting ? "Abstaining..." : "Abstain from Voting"
          }
        )
      ] })
    ] }),
    room.gamePhase === "night" && currentPlayer.role === "mafia" && /* @__PURE__ */ jsxs("div", { className: "bg-red-50 p-4 rounded-lg border border-red-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-red-800 mb-3", children: "Mafia Elimination" }),
      currentVote ? /* @__PURE__ */ jsxs("div", { className: "bg-red-100 p-3 rounded border border-red-300", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
          "You voted to eliminate:",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: room.players.find((p) => p.id === currentVote.targetId)?.name })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-red-600 mt-1", children: "You can change your vote by selecting a different player below." })
      ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600 mb-3", children: "Choose a townsperson to eliminate:" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2 mt-3", children: room.players.filter(
        (p) => p.isAlive && p.role !== "mafia" && p.id !== room.leaderId
      ).map((player) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setSelectedVoteTarget(player.id),
          className: `w-full text-left p-2 rounded border transition-colors ${selectedVoteTarget === player.id ? "bg-red-100 border-red-300" : "bg-white hover:bg-gray-50"}`,
          children: player.name
        },
        player.id
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-2", children: [
        selectedVoteTarget && /* @__PURE__ */ jsx(
          Button,
          {
            onClick: () => handleVote("mafia"),
            disabled: isVoting,
            variant: "destructive",
            className: "w-full",
            children: isVoting ? "Casting Vote..." : "Vote to Eliminate"
          }
        ),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: () => handleVoteAbstain("mafia"),
            disabled: isVoting,
            variant: "secondary",
            className: "w-full",
            children: isVoting ? "Abstaining..." : "Abstain from Voting"
          }
        )
      ] })
    ] }),
    room.gamePhase === "day" && room.lastEliminationResult && /* @__PURE__ */ jsxs("div", { className: "bg-orange-50 p-4 rounded-lg border border-orange-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-orange-800 mb-2", children: "🌅 Morning Report" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-orange-700", children: room.lastEliminationResult })
    ] }),
    currentPlayer.role === "detective" && nightActionResult && /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 p-4 rounded-lg border border-blue-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-blue-800 mb-3", children: "Investigation Result" }),
      /* @__PURE__ */ jsx("div", { className: "bg-blue-100 p-3 rounded border border-blue-300", children: /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
        /* @__PURE__ */ jsx("span", { className: "font-medium", children: nightActionResult.targetName }),
        " ",
        "is a",
        " ",
        /* @__PURE__ */ jsx(
          "span",
          {
            className: `font-bold ${nightActionResult.targetRole === "mafia" ? "text-red-600" : "text-green-600"}`,
            children: nightActionResult.targetRole?.toUpperCase()
          }
        )
      ] }) })
    ] }),
    room.gamePhase === "night" && (currentPlayer.role === "detective" || currentPlayer.role === "doctor") && /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 p-4 rounded-lg border border-blue-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-blue-800 mb-3", children: currentPlayer.role === "detective" ? "Investigation" : "Protection" }),
      (() => {
        const currentAction = room.nightActions?.find(
          (a) => a.playerId === currentPlayer.id
        );
        return currentAction ? /* @__PURE__ */ jsxs(
          "div",
          {
            className: `p-3 rounded border mb-3 ${currentAction.isLocked ? "bg-green-100 border-green-300" : "bg-blue-100 border-blue-300"}`,
            children: [
              /* @__PURE__ */ jsxs("p", { className: "text-sm", children: [
                "You chose to ",
                currentAction.action,
                ":",
                " ",
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: room.players.find(
                  (p) => p.id === currentAction.targetId
                )?.name })
              ] }),
              /* @__PURE__ */ jsx(
                "p",
                {
                  className: `text-xs mt-1 ${currentAction.isLocked ? "text-green-600" : "text-blue-600"}`,
                  children: currentAction.isLocked ? `✓ ${currentAction.action === "investigate" ? "Investigation" : "Protection"} confirmed for this night` : "You can change your action by selecting a different player below."
                }
              )
            ]
          }
        ) : /* @__PURE__ */ jsx("p", { className: "text-sm text-blue-600 mb-3", children: currentPlayer.role === "detective" ? "Choose a player to investigate their role:" : "Choose a player to protect from elimination:" });
      })(),
      (() => {
        const currentAction = room.nightActions?.find(
          (a) => a.playerId === currentPlayer.id
        );
        const isActionLocked = currentAction?.isLocked;
        return !isActionLocked ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: room.players.filter(
            (p) => p.isAlive && p.id !== room.leaderId && (currentPlayer.role === "doctor" || p.id !== currentPlayer.id)
          ).map((player) => /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setSelectedTarget(player.id),
              className: `w-full text-left p-2 rounded border transition-colors ${selectedTarget === player.id ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-gray-50"}`,
              children: [
                player.name,
                player.id === currentPlayer.id && currentPlayer.role === "doctor" && /* @__PURE__ */ jsx("span", { className: "text-xs text-blue-600 ml-2", children: "(yourself)" })
              ]
            },
            player.id
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-2", children: [
            selectedTarget && /* @__PURE__ */ jsxs(
              Button,
              {
                onClick: () => handleNightAction(
                  currentPlayer.role === "detective" ? "investigate" : "protect"
                ),
                className: "w-full",
                children: [
                  currentPlayer.role === "detective" ? "Investigate" : "Protect",
                  " ",
                  "Player"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                onClick: () => handleNightActionAbstain(
                  currentPlayer.role === "detective" ? "investigate" : "protect"
                ),
                variant: "secondary",
                className: "w-full",
                children: currentPlayer.role === "detective" ? "Don't Investigate Anyone" : "Don't Protect Anyone"
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsx("div", { className: "text-center p-4 bg-gray-100 rounded", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600", children: [
          "Your ",
          currentAction.action,
          " has been confirmed for this night phase."
        ] }) });
      })()
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-3", children: "All Players" }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: room.players.filter((player) => player.id !== room.leaderId).map((player) => /* @__PURE__ */ jsx(
        "div",
        {
          className: `p-3 rounded-lg border ${player.isAlive ? "bg-white" : "bg-gray-100 opacity-60"} ${player.id === currentPlayer.id ? "border-blue-300 bg-blue-50" : ""}`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: player.name }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              player.id === currentPlayer.id && /* @__PURE__ */ jsx(GameBadge, { type: "special", value: "You" }),
              /* @__PURE__ */ jsx(
                GameBadge,
                {
                  type: "status",
                  value: player.isAlive ? "Alive" : "Dead"
                }
              )
            ] })
          ] })
        },
        player.id
      )) })
    ] })
  ] });
}
function SpectatorView({ room }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 p-4 rounded-lg text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold mb-2", children: "Spectating Game" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600", children: "You are watching this game as a spectator." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: `inline-block px-6 py-3 rounded-xl font-bold text-lg ${room.gamePhase === "day" ? "bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-900 border-2 border-yellow-300" : "bg-gradient-to-r from-blue-200 to-purple-200 text-blue-900 border-2 border-blue-300"}`,
          children: room.gamePhase === "day" ? "☀️ Day Phase" : "🌙 Night Phase"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 mt-2", children: room.gamePhase === "day" ? "Players are discussing and voting" : "Special roles are taking their actions" })
    ] }),
    room.gamePhase === "day" && room.lastEliminationResult && /* @__PURE__ */ jsxs("div", { className: "bg-orange-50 p-4 rounded-lg border border-orange-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-orange-800 mb-2", children: "🌅 Morning Report" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-orange-700", children: room.lastEliminationResult })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-3", children: "Players" }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: room.players.filter((player) => player.id !== room.leaderId).map((player) => /* @__PURE__ */ jsx(
        "div",
        {
          className: `p-3 rounded-lg border ${player.isAlive ? "bg-white" : "bg-gray-100 opacity-60"}`,
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: player.name }),
            /* @__PURE__ */ jsx(
              GameBadge,
              {
                type: "status",
                value: player.isAlive ? "Alive" : "Dead"
              }
            )
          ] })
        },
        player.id
      )) })
    ] })
  ] });
}
function getRoleDescription(role) {
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
const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogPortal = AlertDialogPrimitive.Portal;
const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Overlay,
  {
    className: cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs(AlertDialogPortal, { children: [
  /* @__PURE__ */ jsx(AlertDialogOverlay, {}),
  /* @__PURE__ */ jsx(
    AlertDialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props
    }
  )
] }));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
const AlertDialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    ),
    ...props
  }
);
AlertDialogHeader.displayName = "AlertDialogHeader";
const AlertDialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
AlertDialogFooter.displayName = "AlertDialogFooter";
const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Title,
  {
    ref,
    className: cn("text-lg font-semibold", className),
    ...props
  }
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Action,
  {
    ref,
    className: cn(buttonVariants(), className),
    ...props
  }
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  AlertDialogPrimitive.Cancel,
  {
    ref,
    className: cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    ),
    ...props
  }
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;
function RoomPage() {
  const {
    code
  } = Route.useParams();
  const [playerName, setPlayerName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [removingPlayerId, setRemovingPlayerId] = useState(null);
  const userId = getUserId();
  const room = useConvexQuery(api.rooms.getRoomByCode, {
    code
  });
  const joinRoomMutation = useConvexMutation(api.rooms.joinRoom);
  const startGameMutation = useConvexMutation(api.rooms.startGame);
  const transferLeadershipMutation = useConvexMutation(api.rooms.transferLeadership);
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
        playerName: playerName.trim()
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
        leaderId: userId
      });
      toast.success("Game started!");
    } catch (error) {
      toast.error("Failed to start game");
      console.error("Error starting game:", error);
    } finally {
      setIsStarting(false);
    }
  };
  const handleTransferLeadership = async (newLeaderId) => {
    setIsTransferring(true);
    try {
      await transferLeadershipMutation({
        code,
        currentLeaderId: userId,
        newLeaderId
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
  const handleRemovePlayer = async (playerIdToRemove, playerName2) => {
    if (!userId || !isLeader) return;
    const confirmed = confirm(`Are you sure you want to remove ${playerName2} from the game?`);
    if (!confirmed) return;
    try {
      setRemovingPlayerId(playerIdToRemove);
      await removePlayerMutation({
        code,
        leaderId: userId,
        playerIdToRemove
      });
    } catch (error) {
      console.error("Failed to remove player:", error);
      alert("Failed to remove player: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setRemovingPlayerId(null);
    }
  };
  if (!room) {
    return /* @__PURE__ */ jsxs("div", { className: "p-8 max-w-md mx-auto text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-red-600 mb-4", children: "Room Not Found" }),
      /* @__PURE__ */ jsxs("p", { children: [
        'The room with code "',
        code,
        '" does not exist.'
      ] })
    ] });
  }
  if (room.status === "active") {
    return /* @__PURE__ */ jsx("div", { className: "p-8 max-w-4xl mx-auto", children: /* @__PURE__ */ jsx(ActiveGame, { room }) });
  }
  if (room.status === "finished") {
    return /* @__PURE__ */ jsx("div", { className: "p-8 max-w-4xl mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "text-center space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-4xl font-bold mb-4 animate-pulse", children: "🏆 Game Over! 🏆" }),
        /* @__PURE__ */ jsx("div", { className: "absolute -top-2 left-1/2 transform -translate-x-1/2 text-2xl animate-bounce", children: "✨" })
      ] }),
      (() => {
        const actualPlayers = room.players.filter((p) => p.id !== room.leaderId);
        const allPlayers = actualPlayers;
        const alivePlayers = actualPlayers.filter((p) => p.isAlive);
        const eliminatedPlayers = actualPlayers.filter((p) => !p.isAlive);
        const aliveMafia = alivePlayers.filter((p) => p.role === "mafia");
        const aliveTownspeople = alivePlayers.filter((p) => p.role !== "mafia");
        const totalMafia = allPlayers.filter((p) => p.role === "mafia");
        const eliminatedMafia = eliminatedPlayers.filter((p) => p.role === "mafia");
        let winner = "";
        let winnerColor = "";
        let winnerBg = "";
        let explanation = "";
        if (aliveMafia.length >= aliveTownspeople.length && aliveMafia.length > 0) {
          winner = "🌙 Mafia Victory! 🌙";
          winnerColor = "text-red-100";
          winnerBg = "bg-gradient-to-r from-red-600 to-red-800";
          explanation = `The Mafia have taken control! With ${aliveMafia.length} Mafia members still alive and only ${aliveTownspeople.length} townspeople remaining, the town has fallen to darkness.`;
        } else if (aliveMafia.length === 0) {
          winner = "🌅 Townspeople Victory! 🌅";
          winnerColor = "text-green-100";
          winnerBg = "bg-gradient-to-r from-green-600 to-green-800";
          explanation = `Justice prevails! The brave townspeople have successfully eliminated all ${totalMafia.length} Mafia member${totalMafia.length > 1 ? "s" : ""} and saved their community.`;
        } else {
          winner = "Game Ended";
          winnerColor = "text-gray-100";
          winnerBg = "bg-gradient-to-r from-gray-600 to-gray-800";
          explanation = "The game has ended.";
        }
        return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: `${winnerBg} rounded-2xl p-6 shadow-2xl border border-opacity-30`, children: [
            /* @__PURE__ */ jsx("div", { className: `text-3xl font-bold ${winnerColor} mb-3`, children: winner }),
            /* @__PURE__ */ jsx("p", { className: `text-lg ${winnerColor.replace("100", "200")} leading-relaxed`, children: explanation })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 rounded-xl p-4 border shadow-sm", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2", children: "📊 Game Statistics" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4 text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-center p-2 bg-white rounded border", children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-gray-800", children: allPlayers.length }),
                /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Total Players" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center p-2 bg-white rounded border", children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-red-600", children: totalMafia.length }),
                /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Mafia Members" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center p-2 bg-white rounded border", children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-orange-600", children: eliminatedPlayers.length }),
                /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Total Eliminated" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center p-2 bg-white rounded border", children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-green-600", children: alivePlayers.length }),
                /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Survivors" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center p-2 bg-white rounded border", children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-red-800", children: eliminatedMafia.length }),
                /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Mafia Eliminated" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center p-2 bg-white rounded border", children: [
                /* @__PURE__ */ jsx("div", { className: "font-semibold text-blue-600", children: allPlayers.filter((p) => p.role === "detective").length > 0 ? "✓" : "✗" }),
                /* @__PURE__ */ jsx("div", { className: "text-gray-600", children: "Detective Present" })
              ] })
            ] })
          ] })
        ] });
      })(),
      /* @__PURE__ */ jsxs(Card, { children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "flex items-center gap-2", children: "🎭 Final Player Results" }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: room.players.filter((player) => player.id !== room.leaderId).sort((a, b) => {
          if (a.isAlive !== b.isAlive) return b.isAlive ? 1 : -1;
          const roleOrder = {
            mafia: 0,
            detective: 1,
            doctor: 2,
            citizen: 3
          };
          return (roleOrder[a.role || ""] || 3) - (roleOrder[b.role || ""] || 3);
        }).map((player) => /* @__PURE__ */ jsx(Card, { className: `transition-all ${player.isAlive ? "bg-gradient-to-r from-green-50 to-green-100 border-green-300" : "bg-gradient-to-r from-red-50 to-red-100 border-red-300"}`, children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: `w-3 h-3 rounded-full ${player.isAlive ? "bg-green-500" : "bg-red-500"}` }),
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-800", children: player.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center", children: [
            /* @__PURE__ */ jsx(GameBadge, { type: "role", value: player.role || "citizen" }),
            /* @__PURE__ */ jsx(GameBadge, { type: "status", value: player.isAlive ? "Survived" : "Eliminated" })
          ] })
        ] }) }) }, player.id)) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          const restartGame = async () => {
            try {
              const response = await fetch("/api/rooms/restart", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  code: room.code,
                  leaderId: room.leaderId
                })
              });
              if (response.ok) {
                window.location.reload();
              }
            } catch (error) {
              console.error("Failed to restart game:", error);
            }
          };
          restartGame();
        }, variant: "default", size: "lg", className: "shadow-lg", children: "🎮 Play Again with Same Players" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => window.location.href = "/", variant: "secondary", size: "lg", className: "shadow-lg", children: "🏠 Create New Game" }),
        /* @__PURE__ */ jsx(Button, { onClick: () => {
          const gameData = {
            winner: room.status === "finished" ? "game completed" : "unknown",
            players: room.players.filter((p) => p.id !== room.leaderId).map((p) => ({
              name: p.name,
              role: p.role,
              survived: p.isAlive
            })),
            code: room.code
          };
          navigator.clipboard.writeText(JSON.stringify(gameData, null, 2));
          alert("Game results copied to clipboard!");
        }, variant: "outline", size: "lg", className: "shadow-lg", children: "📋 Copy Results" })
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxs("div", { className: "p-8 max-w-md mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-6", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold mb-2", children: [
        "Room: ",
        code
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "inline-block bg-gray-100 px-3 py-1 rounded-full text-sm", children: [
        "Status: ",
        /* @__PURE__ */ jsx("span", { className: "capitalize", children: room.status })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold mb-2 text-purple-800", children: "Game Narrator" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: room.players.find((p) => p.id === room.leaderId)?.name || "Room Creator" }),
          /* @__PURE__ */ jsx(GameBadge, { type: "special", value: "Narrator", className: "ml-2" }),
          room.leaderId === userId && /* @__PURE__ */ jsx(GameBadge, { type: "special", value: "You", className: "ml-2" })
        ] }),
        isLeader && room.status === "waiting" && room.players.length > 0 && /* @__PURE__ */ jsx(Button, { onClick: () => setShowTransferModal(true), variant: "outline", size: "sm", children: "Transfer Leadership" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-purple-600 mt-1", children: "The narrator controls the game flow and can see all player information." })
    ] }),
    !hasJoined && room.status === "waiting" && /* @__PURE__ */ jsxs("div", { className: "space-y-4 mb-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "playerName", className: "block text-sm font-medium mb-2", children: "Enter your name:" }),
        /* @__PURE__ */ jsx(Input, { id: "playerName", type: "text", value: playerName, onChange: (e) => setPlayerName(e.target.value), placeholder: "Your name", onKeyDown: (e) => e.key === "Enter" && handleJoinRoom() })
      ] }),
      /* @__PURE__ */ jsx(Button, { onClick: handleJoinRoom, disabled: isJoining || !playerName.trim(), className: "w-full", variant: "default", children: isJoining ? "Joining..." : "Join Room" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-lg font-semibold mb-3", children: [
          "Players (",
          room.players.length,
          ")",
          room.players.length < 3 && /* @__PURE__ */ jsxs("span", { className: "text-sm text-red-600 ml-2", children: [
            "(Need ",
            3 - room.players.length,
            " more)"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: room.players.map((player) => /* @__PURE__ */ jsxs("div", { className: `p-2 rounded flex items-center justify-between ${player.id === room.leaderId ? "bg-yellow-100 border-yellow-300 border" : "bg-gray-100"}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: player.name }),
            player.id === room.leaderId && /* @__PURE__ */ jsx(GameBadge, { type: "special", value: "Leader" }),
            player.id === userId && /* @__PURE__ */ jsx(GameBadge, { type: "special", value: "You" })
          ] }),
          isLeader && player.id !== room.leaderId && player.id !== userId && /* @__PURE__ */ jsx(Button, { onClick: () => handleRemovePlayer(player.id, player.name), disabled: removingPlayerId === player.id, variant: "ghost", size: "sm", className: "text-red-500 hover:text-red-700 hover:bg-red-50", title: `Remove ${player.name} from game`, children: removingPlayerId === player.id ? "..." : "✕" })
        ] }, player.id)) })
      ] }),
      isLeader && room.status === "waiting" && /* @__PURE__ */ jsx(Button, { onClick: handleStartGame, disabled: isStarting || room.players.length < 3, className: "w-full", variant: "default", size: "lg", children: isStarting ? "Starting..." : room.players.length < 3 ? `Need ${3 - room.players.length} more players` : "Start Game" }),
      room.status === "active" && /* @__PURE__ */ jsx(Card, { className: "text-center bg-green-50 border-green-200", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-green-800", children: "Game Active!" }),
        /* @__PURE__ */ jsx("p", { className: "text-green-600", children: "The mafia game is now in progress." })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx(AlertDialog, { open: showTransferModal, onOpenChange: setShowTransferModal, children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Transfer Leadership" }),
        /* @__PURE__ */ jsx(AlertDialogDescription, { children: "Select a player to become the new leader and narrator:" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2 my-4", children: room.players.map((player) => /* @__PURE__ */ jsx(Button, { onClick: () => handleTransferLeadership(player.id), disabled: isTransferring, variant: "outline", className: "w-full justify-start", children: /* @__PURE__ */ jsx("span", { className: "font-medium", children: player.name }) }, player.id)) }),
      /* @__PURE__ */ jsx(AlertDialogFooter, { children: /* @__PURE__ */ jsx(AlertDialogCancel, { disabled: isTransferring, children: "Cancel" }) })
    ] }) })
  ] });
}
export {
  RoomPage as component
};
