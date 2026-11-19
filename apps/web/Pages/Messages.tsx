import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../Contexts/Authcontext";
import { useBookings } from "../Hooks/useBooking";
import { io, Socket } from "socket.io-client";
import axios from "axios";

interface Message {
  id?: string;
  from: "me" | "them";
  text: string;
  time: string;
  senderName?: string;
}

interface Guest {
  name: string;
  userId: string;
  initials: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  email?: string;
}

const VITE_CHAT_SERVICE_URL = (import.meta as any).env.VITE_CHAT_SERVICE_URL || "http://localhost:6001";

const ChatPage: React.FC = () => {
  const auth = useAuth();
  const hotelId = auth?.hotelId || null;
  const adminName = auth?.user?.Name || auth?.user?.Username || "Hotel Admin";

  const { bookings } = useBookings(hotelId);
  const [activeUserId, setActiveUserId] = useState("");
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [msgInput, setMsgInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  // Track the active room in a ref so the "connect" handler (registered once)
  // always rejoins whichever room is currently open, even after a reconnect.
  const activeUserIdRef = useRef<string>("");

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  // Group unique guests from bookings & active messages history
  const guests: Guest[] = useMemo(() => {
    const unique: Record<string, { userId: string; guest: string; email?: string; preview?: string; time?: string }> = {};

    // 1. Load from bookings
    bookings.forEach((b) => {
      if (b.userId && b.userId !== "-" && !unique[b.userId]) {
        unique[b.userId] = {
          userId: b.userId,
          guest: b.guest,
          email: b.email,
          preview: "Tap to chat with guest",
          time: "",
        };
      }
    });

    // 2. Load from messages state
    Object.entries(messages).forEach(([guestId, msgs]) => {
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        if (!unique[guestId]) {
          unique[guestId] = {
            userId: guestId,
            guest: lastMsg.from === "them" ? lastMsg.senderName || "Guest" : "Guest",
            email: undefined,
          };
        }
        unique[guestId].preview = lastMsg.text;
        unique[guestId].time = lastMsg.time;
      }
    });

    return Object.values(unique).map((g) => {
      const name = g.guest || "Guest";
      const initials = name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "G";

      return {
        name,
        userId: g.userId,
        initials,
        preview: g.preview || "Tap to chat with guest",
        time: g.time || "",
        unread: 0,
        online: true,
        email: g.email
      };
    });
  }, [bookings, messages]);

  const activeGuest = guests.find((g) => g.userId === activeUserId);
  const roomName = hotelId && activeUserId ? `chat_${hotelId}_${activeUserId}` : null;

  // Load active chat threads on mount
  useEffect(() => {
    if (!hotelId) return;
    const fetchThreads = async () => {
      try {
        const res = await axios.get(`${VITE_CHAT_SERVICE_URL}/api/v1/chat/threads/${hotelId}`);
        if (res.data?.success) {
          const threads = res.data.data;
          setMessages(prev => {
            const updated = { ...prev };
            threads.forEach((t: any) => {
              if (!updated[t.guestId] || updated[t.guestId].length === 0) {
                updated[t.guestId] = [{
                  id: `latest-${t.roomName}`,
                  from: "them",
                  text: t.latestMessage,
                  time: new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  senderName: t.guestName
                }];
              }
            });
            return updated;
          });
        }
      } catch (err) {
        console.error("Failed to load chat threads:", err);
      }
    };
    fetchThreads();
  }, [hotelId]);

  // Socket connection
  useEffect(() => {
    if (!hotelId) return;

    // Allow fallback to long-polling if the websocket upgrade is blocked by a
    // proxy (common on Render/Railway) — without this, the socket can fail to
    // connect at all with no visible error in the UI.
    socketRef.current = io(VITE_CHAT_SERVICE_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    // "connect" fires on the initial connection AND after every reconnect.
    // Rejoining both the hotel broadcast room and the currently open guest
    // room here is what makes delivery survive a dropped connection — the
    // previous version only joined the guest room from openChat(), so a
    // reconnect while a chat was open silently stopped receiving messages.
    socketRef.current.on("connect", () => {
      console.log("Dashboard connected to chat socket:", socketRef.current?.id);
      socketRef.current?.emit("join_room", `hotel_${hotelId}`);

      const currentGuestId = activeUserIdRef.current;
      if (currentGuestId) {
        socketRef.current?.emit("join_room", `chat_${hotelId}_${currentGuestId}`);
      }
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("Chat socket connect_error:", err.message);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.warn("Chat socket disconnected:", reason);
    });

    socketRef.current.on("receive_message", (msg: any) => {
      const parts = msg.room.split("_");
      const guestId = parts[2];
      if (guestId) {
        setMessages((prev) => {
          const userMsgs = prev[guestId] || [];
          if (userMsgs.some((m) => m.id === msg._id)) return prev;

          const newMsg: Message = {
            id: msg._id,
            from: msg.sender === guestId ? "them" : "me",
            text: msg.message,
            time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderName: msg.senderName
          };
          return {
            ...prev,
            [guestId]: [...userMsgs, newMsg]
          };
        });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [hotelId]);

  const openChat = async (guest: Guest) => {
    setActiveUserId(guest.userId);
    const room = `chat_${hotelId}_${guest.userId}`;

    if (socketRef.current) {
      socketRef.current.emit("join_room", room);
    }

    try {
      const res = await axios.get(`${VITE_CHAT_SERVICE_URL}/api/v1/chat/history/${room}`);
      if (res.data?.success) {
        const history = res.data.data.map((msg: any) => ({
          id: msg._id,
          from: msg.sender === guest.userId ? "them" : "me",
          text: msg.message,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          senderName: msg.senderName
        }));
        setMessages(prev => ({
          ...prev,
          [guest.userId]: history
        }));
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const sendMsg = () => {
    if (!msgInput.trim() || !activeUserId || !roomName || !socketRef.current) return;

    const messageData = {
      room: roomName,
      sender: hotelId,
      senderName: adminName,
      message: msgInput.trim(),
      messageType: 'text'
    };

    socketRef.current.emit("send_message", messageData);
    setMsgInput("");
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Guest Messages
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time communication with guests
        </p>
      </div>

      {/* LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 h-[82vh]">
        {/* SIDEBAR */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
          {/* SEARCH */}
          <div className="p-4 border-b border-slate-100">
            <input
              type="text"
              placeholder="Search guest..."
              className="
                w-full px-4 py-2.5 rounded-xl
                border border-slate-200
                text-sm
                outline-none
                focus:ring-2 focus:ring-blue-500/20
                focus:border-blue-500
              "
            />
          </div>

          {/* GUEST LIST */}
          <div className="overflow-y-auto flex-1">
            {guests.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                No guest conversations yet.
              </div>
            ) : (
              guests.map((guest) => (
                <button
                  key={guest.userId}
                  onClick={() => openChat(guest)}
                  className={`
                    w-full px-4 py-4
                    border-b border-slate-100
                    transition
                    flex items-center gap-3
                    text-left
                    hover:bg-slate-50
                    ${activeUserId === guest.userId ? "bg-blue-50" : "bg-white"}
                  `}
                >
                  {/* AVATAR */}
                  <div className="relative shrink-0">
                    <div
                      className="
                        w-11 h-11 rounded-full
                        bg-blue-600 text-white
                        flex items-center justify-center
                        text-sm font-semibold
                      "
                    >
                      {guest.initials}
                    </div>
                    {guest.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800 truncate">
                        {guest.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {guest.time}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-slate-500 truncate">
                        {guest.preview}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
          {/* CHAT HEADER */}
          <div
            className="
              px-6 py-4 border-b border-slate-100
              flex items-center gap-3
            "
          >
            <div
              className="
                w-11 h-11 rounded-full
                bg-blue-600 text-white
                flex items-center justify-center
                text-sm font-semibold
              "
            >
              {activeGuest
                ? activeGuest.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                : "?"}
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                {activeGuest?.name || "No conversation selected"}
              </h2>
              <p className="text-xs text-slate-500">
                {activeGuest ? "● Online" : "Select a guest to start chatting"}
              </p>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            {!activeUserId ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-500 text-center">
                Choose a guest from the list to view or send messages.
              </div>
            ) : (
              (messages[activeUserId] || []).map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`
                    flex
                    ${msg.from === "me" ? "justify-end" : "justify-start"}
                  `}
                >
                  <div
                    className={`
                      max-w-[70%]
                      px-4 py-3 rounded-2xl
                      shadow-sm
                      ${msg.from === "me"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-white border border-slate-200 text-slate-700 rounded-bl-md"
                      }
                    `}
                  >
                    <p className="text-sm leading-relaxed">
                      {msg.text}
                    </p>
                    <div
                      className={`
                        mt-2 text-[10px]
                        ${msg.from === "me" ? "text-blue-100" : "text-slate-400"}
                      `}
                    >
                      {msg.time}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* INPUT */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                disabled={!activeUserId}
                className="
                  flex-1 px-4 py-3 rounded-xl
                  border border-slate-200
                  text-sm
                  outline-none
                  focus:ring-2 focus:ring-blue-500/20
                  focus:border-blue-500
                  disabled:bg-slate-100
                "
              />
              <button
                onClick={sendMsg}
                disabled={!activeUserId}
                className="
                  px-5 py-3 rounded-xl
                  bg-blue-600 text-white
                  text-sm font-medium
                  hover:bg-blue-700
                  transition
                  disabled:bg-slate-300
                "
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;