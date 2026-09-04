"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthProvider";
import { uploadMediaFile, createVideo } from "@/lib/api";
import type { Visibility } from "@/lib/types";

type Step = "select" | "details" | "publishing" | "success" | "error";

function UploadFlow() {
  const router = useRouter();
  const search = useSearchParams();
  const { user } = useAuth();
  const kind = search.get("type") === "long" ? "long" : "short";
  const capture = search.get("capture") === "1";

  const [step, setStep] = useState<Step>("select");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreviewUrl, setThumbPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [error, setError] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelected = (file: File | null) => {
    if (!file) return;
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setStep("details");
  };

  const handleThumbSelected = (file: File | null) => {
    if (!file) return;
    setThumbFile(file);
    setThumbPreviewUrl(URL.createObjectURL(file));
  };

  const publish = async () => {
    if (!user || !videoFile) return;
    setStep("publishing");
    setError("");
    try {
      const videoUrl = await uploadMediaFile(videoFile, user.id, kind === "short" ? "shorts" : "long");
      const thumbUrl = thumbFile ? await uploadMediaFile(thumbFile, user.id, "thumbnails") : undefined;
      const tagText = hashtags
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((t) => (t.startsWith("#") ? t : `#${t}`))
        .join(" ");
      const fullCaption = [caption.trim(), tagText].filter(Boolean).join(" ");

      await createVideo({
        owner_id: user.id,
        kind,
        title: title.trim() || undefined,
        caption: fullCaption || undefined,
        video_url: videoUrl,
        thumbnail_url: thumbUrl,
        visibility
      });
      setStep("success");
    } catch (e: any) {
      setError(e?.message ?? "Upload failed. Please try again.");
      setStep("error");
    }
  };

  if (step === "select") {
    return (
      <div className="max-w-md mx-auto px-4 md:px-6 pt-10 text-center">
        <h1 className="font-display font-bold text-xl mb-2">
          {kind === "short" ? "New short" : "Upload long video"}
        </h1>
        <p className="text-sm text-[var(--muted)] mb-8">
          {capture ? "Record with your camera or choose a file." : "Choose a video from your device."}
        </p>

        <button
          onClick={() => videoInputRef.current?.click()}
          className="w-full rounded-xl2 border-2 border-dashed py-14 mb-4 hover:border-indigo transition-colors"
        >
          <span className="grid place-items-center w-12 h-12 mx-auto rounded-full bg-indigo text-white text-xl mb-3">
            +
          </span>
          <p className="text-sm font-medium">Select video</p>
        </button>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture={capture ? "environment" : undefined}
          className="hidden"
          onChange={(e) => handleVideoSelected(e.target.files?.[0] ?? null)}
        />

        <button onClick={() => router.back()} className="text-sm text-[var(--muted)]">
          Cancel
        </button>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="max-w-md mx-auto px-4 md:px-6 pt-6 pb-16">
        <h1 className="font-display font-bold text-xl mb-4">Details</h1>

        {videoPreviewUrl && (
          <video src={videoPreviewUrl} controls className="w-full rounded-xl2 mb-4 max-h-72 bg-black" />
        )}

        <label className="block text-sm font-medium mb-1.5">Thumbnail (optional)</label>
        <button
          onClick={() => thumbInputRef.current?.click()}
          className="w-full rounded-xl2 border px-3.5 py-2.5 mb-4 text-sm text-left flex items-center gap-3"
        >
          {thumbPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbPreviewUrl} alt="" className="w-10 h-10 rounded-md object-cover" />
          ) : (
            <span className="text-[var(--muted)]">Choose an image</span>
          )}
        </button>
        <input
          ref={thumbInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleThumbSelected(e.target.files?.[0] ?? null)}
        />

        <label className="block text-sm font-medium mb-1.5">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give it a title"
          className="w-full rounded-xl2 border px-3.5 py-2.5 mb-4 text-sm bg-transparent"
        />

        <label className="block text-sm font-medium mb-1.5">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          placeholder="Write a caption"
          className="w-full rounded-xl2 border px-3.5 py-2.5 mb-4 text-sm bg-transparent"
        />

        <label className="block text-sm font-medium mb-1.5">Hashtags</label>
        <input
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="zeni foryou genz"
          className="w-full rounded-xl2 border px-3.5 py-2.5 mb-4 text-sm bg-transparent"
        />

        <label className="block text-sm font-medium mb-1.5">Visibility</label>
        <div className="flex gap-2 mb-6">
          {(["public", "friends", "private"] as Visibility[]).map((v) => (
            <button
              key={v}
              onClick={() => setVisibility(v)}
              className={`flex-1 rounded-pill border text-sm py-2 capitalize ${
                visibility === v ? "bg-indigo text-white border-indigo" : ""
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <button onClick={publish} className="w-full rounded-pill bg-indigo text-white font-medium py-2.5">
          Publish
        </button>
      </div>
    );
  }

  if (step === "publishing") {
    return (
      <div className="max-w-md mx-auto px-4 md:px-6 pt-24 text-center">
        <span className="w-10 h-10 mx-auto mb-4 rounded-full border-2 border-indigo border-t-transparent animate-spin block" />
        <p className="font-medium">Publishing your {kind}…</p>
        <p className="text-sm text-[var(--muted)] mt-1">This can take a moment on slower connections.</p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="max-w-md mx-auto px-4 md:px-6 pt-24 text-center">
        <p className="font-display font-semibold text-lg mb-2">Upload failed</p>
        <p className="text-sm text-[var(--muted)] mb-6">{error}</p>
        <button onClick={() => setStep("details")} className="rounded-pill bg-indigo text-white font-medium px-5 py-2.5">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 md:px-6 pt-24 text-center">
      <p className="font-display font-semibold text-lg mb-2">Published 🎉</p>
      <p className="text-sm text-[var(--muted)] mb-6">Your {kind} is live on Zeni.</p>
      <div className="flex gap-2">
        <button
          onClick={() => router.push(kind === "short" ? "/shorts" : "/")}
          className="flex-1 rounded-pill bg-indigo text-white font-medium py-2.5"
        >
          View it
        </button>
        <button onClick={() => router.push("/profile")} className="flex-1 rounded-pill border font-medium py-2.5">
          Go to profile
        </button>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="pt-10 text-center text-sm text-[var(--muted)]">Loading…</div>}>
      <UploadFlow />
    </Suspense>
  );
}
