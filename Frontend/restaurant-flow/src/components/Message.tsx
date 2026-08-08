import type { ChatMessageType } from "@/src/types";

function StatusTicks({ status }: { status: ChatMessageType["status"] }) {
  if (!status) return null;

  return (
    <svg
      viewBox="0 0 16 11"
      className={`h-3 w-4 ${status === "read" ? "text-sky-400" : "text-slate-400"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 5.5 4.5 9 11 1.5" />
      <path d="M5.5 5.5 9 9 15.5 1.5" />
    </svg>
  );
}

export default function Message({ message }: { message: ChatMessageType }) {
  const isBot = message.sender === "bot";

  return (
    <div
      className={`flex animate-fade-in-up flex-col gap-1 ${isBot ? "items-start" : "items-end"}`}
    >
      {isBot && (
        <div className="flex items-center gap-2 pl-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-sm">
            👨‍🍳
          </span>
          <span className="text-xs font-medium text-slate-400">
            RestaurantFlow Bot
          </span>
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isBot
            ? "rounded-tl-sm bg-slate-700/70 text-slate-100"
            : "rounded-tr-sm bg-blue-600 text-white"
        }`}
      >
        {!isBot && (
          <p className="mb-1 text-xs font-medium text-blue-100/80">Tú</p>
        )}
        <p className="whitespace-pre-line">{message.text}</p>
      </div>

      <div
        className={`flex items-center gap-1 px-1 text-[11px] text-slate-500 ${isBot ? "" : "flex-row-reverse"}`}
      >
        <span>{message.time}</span>
        {!isBot && <StatusTicks status={message.status} />}
      </div>
    </div>
  );
}
