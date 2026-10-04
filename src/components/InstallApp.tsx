import { useState } from "react";
import { Download, Share, SquarePlus, Check } from "lucide-react";
import { toast } from "sonner";
import { useInstallApp } from "@/lib/pwa";

export function InstallApp() {
  const { state, install } = useInstallApp();
  const [help, setHelp] = useState(false);

  if (!state) return null;

  async function onClick() {
    if (state === "prompt") {
      const outcome = await install();
      if (outcome === "accepted") toast.success("Versatile is being added to your device.");
      return;
    }
    setHelp((v) => !v);
  }

  return (
    <div className="mt-8 border border-border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="eyebrow">Get the app</p>
        <p className="mt-1 text-sm text-foreground/60">
          {state === "installed"
            ? "Versatile is installed on this device."
            : "Install Versatile on your phone, tablet or computer for faster access, like a regular app."}
        </p>
        {help && state === "ios" && (
          <ol className="mt-3 space-y-1.5 text-sm text-foreground/80">
            <li className="flex items-center gap-2">
              1. Tap <Share className="h-4 w-4" aria-label="Share" /> Share in Safari
            </li>
            <li className="flex items-center gap-2">
              2. Choose <SquarePlus className="h-4 w-4" aria-hidden /> Add to Home Screen
            </li>
            <li>3. Tap Add</li>
          </ol>
        )}
        {help && state === "manual" && (
          <p className="mt-3 text-sm text-foreground/80">
            Open your browser menu (⋮ or the install icon in the address bar) and choose
            “Install app” or “Add to Home screen”.
          </p>
        )}
      </div>
      {state === "installed" ? (
        <span className="inline-flex items-center gap-2 eyebrow text-foreground/60">
          <Check className="h-4 w-4" /> Installed
        </span>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 eyebrow hover:bg-foreground/90"
        >
          <Download className="h-4 w-4" />
          {state === "prompt" ? "Install app" : help ? "Hide steps" : "How to install"}
        </button>
      )}
    </div>
  );
}
