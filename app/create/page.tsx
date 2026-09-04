"use client";

import { useRouter } from "next/navigation";

const options = [
  { title: "Create short", desc: "Record a vertical clip with sound and effects", accent: "from-indigo to-violet", href: "/upload?type=short&capture=1" },
  { title: "Upload short", desc: "Post a vertical video from your device", accent: "from-slate to-indigo", href: "/upload?type=short" },
  { title: "Upload long video", desc: "Share a full-length video to your channel", accent: "from-mint to-slate", href: "/upload?type=long" },
  { title: "Record video", desc: "Use your camera right now", accent: "from-violet to-blush", href: "/upload?type=long&capture=1" }
];

export default function CreatePage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-6">
      <h1 className="font-display font-bold text-2xl mb-1">Create</h1>
      <p className="text-sm text-[var(--muted)] mb-6">What do you want to make?</p>

      <div className="grid sm:grid-cols-2 gap-3">
        {options.map((o) => (
          <button
            key={o.title}
            onClick={() => router.push(o.href)}
            className="text-left rounded-xl2 border p-5 hover:border-indigo transition-colors"
          >
            <span className={`inline-grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br ${o.accent} text-white mb-3 font-display`}>
              +
            </span>
            <p className="font-medium mb-1">{o.title}</p>
            <p className="text-sm text-[var(--muted)]">{o.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
