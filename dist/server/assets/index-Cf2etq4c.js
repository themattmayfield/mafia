import { jsx, jsxs } from "react/jsx-runtime";
import { useConvexMutation } from "@convex-dev/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import { C as Card, a as CardHeader, b as CardTitle, c as CardContent, B as Button, I as Input } from "./input-DxlSZ6V2.js";
import { a as api, g as getUserId } from "./router-CzQDN71E.js";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
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
function Home() {
  const [roomLink, setRoomLink] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const createRoomMutation = useConvexMutation(api.rooms.createRoom);
  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const userId = getUserId();
      const result = await createRoomMutation({
        leaderId: userId
      });
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
  return /* @__PURE__ */ jsx("div", { className: "p-8 max-w-md mx-auto", children: /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { className: "text-2xl", children: "🎭 Welcome to Mafia Game!" }) }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsx(Button, { onClick: handleCreateRoom, disabled: isCreating, className: "w-full", size: "lg", children: isCreating ? "Creating..." : "🚀 Create New Room" }),
      roomLink && /* @__PURE__ */ jsx(Card, { className: "mt-4", children: /* @__PURE__ */ jsxs(CardContent, { className: "p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mb-2", children: "Share this link:" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(Input, { type: "text", value: roomLink, readOnly: true, className: "flex-1 text-sm" }),
          /* @__PURE__ */ jsx(Button, { onClick: copyToClipboard, variant: "secondary", size: "sm", children: "📋 Copy" })
        ] })
      ] }) })
    ] })
  ] }) });
}
export {
  Home as component
};
