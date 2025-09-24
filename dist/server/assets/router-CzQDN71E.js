import { jsxs, jsx } from "react/jsx-runtime";
import { useConvexQuery, useConvexMutation, ConvexQueryClient } from "@convex-dev/react-query";
import { notifyManager, QueryClient, MutationCache } from "@tanstack/react-query";
import { useRouter, useMatch, rootRouteId, ErrorComponent, Link, createRootRouteWithContext, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ConvexProvider } from "convex/react";
import toast, { Toaster } from "react-hot-toast";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { faker } from "@faker-js/faker";
import { useState } from "react";
import { anyApi } from "convex/server";
import { c as createMiddleware } from "./createMiddleware-CRzJRBrm.js";
import { json } from "@tanstack/router-core/ssr/client";
import { g as getRequestHeaders } from "../server.js";
function DefaultCatchBoundary({ error }) {
  const router2 = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId
  });
  console.error("DefaultCatchBoundary Error:", error);
  return /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6", children: [
    /* @__PURE__ */ jsx(ErrorComponent, { error }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center flex-wrap", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
          },
          className: `px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`,
          children: "Try Again"
        }
      ),
      isRoot ? /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: `px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`,
          children: "Home"
        }
      ) : /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: `px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`,
          onClick: (e) => {
            e.preventDefault();
            window.history.back();
          },
          children: "Go Back"
        }
      )
    ] })
  ] });
}
function NotFound({ children }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-2", children: [
    /* @__PURE__ */ jsx("div", { className: "text-gray-600 dark:text-gray-400", children: children || /* @__PURE__ */ jsx("p", { children: "The page you are looking for does not exist." }) }),
    /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => window.history.back(),
          className: "bg-emerald-500 text-white px-2 py-1 rounded uppercase font-black text-sm",
          children: "Go back"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: "bg-cyan-600 text-white px-2 py-1 rounded uppercase font-black text-sm",
          children: "Start Over"
        }
      )
    ] })
  ] });
}
const USER_ID_KEY = "mafia_userId";
function getUserId() {
  if (typeof window === "undefined") {
    return "";
  }
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}
function setUserId(userId) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(USER_ID_KEY, userId);
}
const api = anyApi;
function PlayerSwitcherPlugin() {
  const router2 = useRouter();
  const currentUserId = getUserId();
  const [selectedRoomCode, setSelectedRoomCode] = useState("");
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const currentLocation = router2.state.location;
  const roomCodeFromUrl = currentLocation.pathname.startsWith("/room/") ? currentLocation.pathname.split("/room/")[1] : "";
  const roomCode = roomCodeFromUrl || selectedRoomCode;
  const room = useConvexQuery(
    api.rooms.getRoomByCode,
    roomCode ? { code: roomCode } : "skip"
  );
  const joinRoomMutation = useConvexMutation(api.rooms.joinRoom);
  const handlePlayerSwitch = (playerId, playerName) => {
    setUserId(playerId);
    toast.success(`Switched to player: ${playerName}`);
    window.location.reload();
  };
  const handleAddPlayer = async () => {
    if (!roomCode) {
      toast.error("Please select a room first");
      return;
    }
    if (room?.status !== "waiting") {
      toast.error("Can only add players to waiting rooms");
      return;
    }
    setIsAddingPlayer(true);
    try {
      const newPlayerId = crypto.randomUUID();
      const playerName = faker.person.firstName();
      await joinRoomMutation({
        code: roomCode,
        playerId: newPlayerId,
        playerName
      });
      toast.success(`Added player: ${playerName}`);
    } catch (error) {
      toast.error("Failed to add player");
      console.error("Error adding player:", error);
    } finally {
      setIsAddingPlayer(false);
    }
  };
  const currentPlayer = room?.players.find((p) => p.id === currentUserId);
  return /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-4 text-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "border-b pb-2", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg text-gray-800", children: "Player Switcher" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-xs", children: "Switch between players in the current room" })
    ] }),
    !roomCodeFromUrl && /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "Room Code:" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: selectedRoomCode,
          onChange: (e) => setSelectedRoomCode(e.target.value.toUpperCase()),
          placeholder: "Enter room code...",
          className: "w-full px-2 py-1 border border-gray-300 rounded text-xs"
        }
      )
    ] }),
    roomCode && /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 p-2 rounded", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-600", children: [
        /* @__PURE__ */ jsx("strong", { children: "Room:" }),
        " ",
        roomCode
      ] }),
      room && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-600", children: [
        /* @__PURE__ */ jsx("strong", { children: "Status:" }),
        " ",
        /* @__PURE__ */ jsx("span", { className: "capitalize", children: room.status })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 p-2 rounded", children: [
      /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-600", children: /* @__PURE__ */ jsx("strong", { children: "Current User ID:" }) }),
      /* @__PURE__ */ jsx("div", { className: "font-mono text-xs break-all text-blue-800", children: currentUserId }),
      currentPlayer && /* @__PURE__ */ jsxs("div", { className: "text-xs text-blue-600 mt-1", children: [
        "Playing as: ",
        /* @__PURE__ */ jsx("strong", { children: currentPlayer.name }),
        currentPlayer.role && /* @__PURE__ */ jsxs("span", { className: "ml-1", children: [
          "(",
          currentPlayer.role,
          ")"
        ] })
      ] })
    ] }),
    roomCode && room && room.status === "waiting" && /* @__PURE__ */ jsx("div", { className: "bg-green-50 p-2 rounded border border-green-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-green-700", children: [
        /* @__PURE__ */ jsx("strong", { children: "Quick Add Player" }),
        /* @__PURE__ */ jsx("p", { className: "text-green-600", children: "Generates random name automatically" })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleAddPlayer,
          disabled: isAddingPlayer,
          className: "px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-xs rounded transition-colors",
          children: isAddingPlayer ? "Adding..." : "Add Player"
        }
      )
    ] }) }),
    room && room.players && room.players.length > 0 ? /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsxs("h4", { className: "font-medium text-gray-700", children: [
          "Active Players (",
          room.players.length,
          "):"
        ] }),
        room.status === "waiting" && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleAddPlayer,
            disabled: isAddingPlayer,
            className: "px-2 py-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-xs rounded transition-colors",
            children: isAddingPlayer ? "Adding..." : "+ Add"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-1 max-h-64 overflow-y-auto", children: room.players.map((player) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: `flex items-center justify-between p-2 rounded border ${player.id === currentUserId ? "bg-blue-100 border-blue-300" : "bg-white border-gray-200 hover:bg-gray-50"}`,
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "font-medium text-xs truncate", children: [
                player.name,
                player.id === currentUserId && /* @__PURE__ */ jsx("span", { className: "ml-1 text-blue-600", children: "(current)" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "font-mono text-xs text-gray-500 truncate", children: player.id }),
              player.role && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-600", children: [
                "Role: ",
                player.role
              ] }),
              player.isAlive !== void 0 && /* @__PURE__ */ jsx(
                "div",
                {
                  className: `text-xs ${player.isAlive ? "text-green-600" : "text-red-600"}`,
                  children: player.isAlive ? "Alive" : "Dead"
                }
              )
            ] }),
            player.id !== currentUserId && /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handlePlayerSwitch(player.id, player.name),
                className: "ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors",
                children: "Switch"
              }
            )
          ]
        },
        player.id
      )) })
    ] }) : roomCode && room ? /* @__PURE__ */ jsxs("div", { className: "text-center text-gray-500 py-4", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs mb-2", children: "No players in this room yet" }),
      room.status === "waiting" && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleAddPlayer,
          disabled: isAddingPlayer,
          className: "px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white text-xs rounded transition-colors",
          children: isAddingPlayer ? "Adding..." : "Add First Player"
        }
      )
    ] }) : roomCode ? /* @__PURE__ */ jsx("div", { className: "text-center text-gray-500 py-4", children: /* @__PURE__ */ jsx("p", { className: "text-xs", children: "Room not found or loading..." }) }) : /* @__PURE__ */ jsx("div", { className: "text-center text-gray-500 py-4", children: /* @__PURE__ */ jsx("p", { className: "text-xs", children: "Enter a room code to see players" }) }),
    /* @__PURE__ */ jsxs("div", { className: "border-t pt-2 text-xs text-gray-500", children: [
      /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("strong", { children: "How to use:" }) }),
      /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 mt-1", children: [
        /* @__PURE__ */ jsx("li", { children: "Navigate to a room to automatically load players" }),
        /* @__PURE__ */ jsx("li", { children: "Or enter a room code manually above" }),
        /* @__PURE__ */ jsx("li", { children: 'Click "Add Player" to instantly create a player with random name' }),
        /* @__PURE__ */ jsx("li", { children: 'Click "Switch" to become that player' }),
        /* @__PURE__ */ jsx("li", { children: 'Your user ID is stored in localStorage as "mafia_userId"' })
      ] })
    ] })
  ] });
}
const appCss = "/assets/app-zBAzR1il.css";
const seo = ({
  title,
  description,
  keywords,
  image
}) => {
  const tags = [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:creator", content: "@tannerlinsley" },
    { name: "twitter:site", content: "@tannerlinsley" },
    { name: "og:type", content: "website" },
    { name: "og:title", content: title },
    { name: "og:description", content: description },
    ...image ? [
      { name: "twitter:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "og:image", content: image }
    ] : []
  ];
  return tags;
};
const Route$4 = createRootRouteWithContext()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      ...seo({
        title: "TanStack Start | Type-Safe, Client-First, Full-Stack React Framework",
        description: `TanStack Start is a type-safe, client-first, full-stack React framework. `
      })
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png"
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png"
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png"
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" }
    ]
  }),
  errorComponent: (props) => {
    return /* @__PURE__ */ jsx(RootDocument, { children: /* @__PURE__ */ jsx(DefaultCatchBoundary, { ...props }) });
  },
  notFoundComponent: () => /* @__PURE__ */ jsx(NotFound, {}),
  component: RootComponent
});
function RootComponent() {
  return /* @__PURE__ */ jsx(RootDocument, { children: /* @__PURE__ */ jsx(Outlet, {}) });
}
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx("div", { className: "h-screen flex flex-col min-h-0", children: /* @__PURE__ */ jsxs("div", { className: "flex-grow min-h-0 h-full flex flex-col", children: [
        children,
        /* @__PURE__ */ jsx(Toaster, {})
      ] }) }),
      /* @__PURE__ */ jsx(
        TanStackDevtools,
        {
          config: {
            defaultOpen: false,
            position: "bottom-right"
          },
          plugins: [
            {
              name: "Tanstack Query",
              render: /* @__PURE__ */ jsx(ReactQueryDevtoolsPanel, {})
            },
            {
              name: "Tanstack Router",
              render: /* @__PURE__ */ jsx(TanStackRouterDevtoolsPanel, {})
            },
            {
              name: "Player Switcher",
              render: /* @__PURE__ */ jsx(PlayerSwitcherPlugin, {})
            }
          ]
        }
      ),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$1 = () => import("./index-Cf2etq4c.js");
const Route$3 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./room._code-CUNudzJj.js");
const Route$2 = createFileRoute("/room/$code")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const userLoggerMiddleware = createMiddleware().server(async ({
  next,
  request
}) => {
  console.info("In: /users");
  console.info("Request Headers:", getRequestHeaders());
  const result = await next();
  result.response.headers.set("x-users", "true");
  console.info("Out: /users");
  return result;
});
const testParentMiddleware = createMiddleware().server(async ({
  next,
  request
}) => {
  console.info("In: testParentMiddleware");
  const result = await next();
  result.response.headers.set("x-test-parent", "true");
  console.info("Out: testParentMiddleware");
  return result;
});
const testMiddleware = createMiddleware().middleware([testParentMiddleware]).server(async ({
  next,
  request
}) => {
  console.info("In: testMiddleware");
  const result = await next();
  result.response.headers.set("x-test", "true");
  console.info("Out: testMiddleware");
  return result;
});
const Route$1 = createFileRoute("/api/users")({
  server: {
    middleware: [testMiddleware, userLoggerMiddleware],
    handlers: {
      GET: async ({
        request
      }) => {
        console.info("GET /api/users @", request.url);
        console.info("Fetching users... @", request.url);
        const res = await fetch("https://jsonplaceholder.typicode.com/users");
        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await res.json();
        const list = data.slice(0, 10);
        return json(list.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email
        })));
      }
    }
  }
});
const Route = createFileRoute("/api/users/$userId")({
  server: {
    handlers: {
      GET: async ({
        params,
        request
      }) => {
        console.info(`Fetching users by id=${params.userId}... @`, request.url);
        try {
          const res = await fetch("https://jsonplaceholder.typicode.com/users/" + params.userId);
          if (!res.ok) {
            throw new Error("Failed to fetch user");
          }
          const user = await res.json();
          return json({
            id: user.id,
            name: user.name,
            email: user.email
          });
        } catch (e) {
          console.error(e);
          return json({
            error: "User not found"
          }, {
            status: 404
          });
        }
      }
    }
  }
});
const IndexRoute = Route$3.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$4
});
const RoomCodeRoute = Route$2.update({
  id: "/room/$code",
  path: "/room/$code",
  getParentRoute: () => Route$4
});
const ApiUsersRoute = Route$1.update({
  id: "/api/users",
  path: "/api/users",
  getParentRoute: () => Route$4
});
const ApiUsersUserIdRoute = Route.update({
  id: "/$userId",
  path: "/$userId",
  getParentRoute: () => ApiUsersRoute
});
const ApiUsersRouteChildren = {
  ApiUsersUserIdRoute
};
const ApiUsersRouteWithChildren = ApiUsersRoute._addFileChildren(
  ApiUsersRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  ApiUsersRoute: ApiUsersRouteWithChildren,
  RoomCodeRoute
};
const routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
  if (typeof document !== "undefined") {
    notifyManager.setScheduler(window.requestAnimationFrame);
  }
  const CONVEX_URL = "https://notable-seal-344.convex.cloud";
  const convexQueryClient = new ConvexQueryClient(CONVEX_URL);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn()
      }
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        toast(error.message, { className: "bg-red-500 text-white" });
      }
    })
  });
  convexQueryClient.connect(queryClient);
  const router2 = createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => /* @__PURE__ */ jsx(NotFound, {}),
    context: { queryClient },
    Wrap: ({ children }) => /* @__PURE__ */ jsx(ConvexProvider, { client: convexQueryClient.convexClient, children }),
    scrollRestoration: true
  });
  setupRouterSsrQueryIntegration({
    router: router2,
    queryClient
  });
  return router2;
}
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$2 as R,
  api as a,
  getUserId as g,
  router as r
};
