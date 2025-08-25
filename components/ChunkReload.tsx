"use client";

import { useEffect, useRef } from "react";

/**
 * Se monta globalmente y, si aparece un ChunkLoadError (o "Loading chunk ... failed"),
 * fuerza una recarga con cache-busting para recuperar la app tras un despliegue.
 */
export default function ChunkReload() {
  const reloaded = useRef(false);

  useEffect(() => {
    const reload = () => {
      if (reloaded.current) return;
      reloaded.current = true;
      const url = new URL(window.location.href);
      url.searchParams.set("__r", Date.now().toString()); // bust cache
      window.location.replace(url.toString());
    };

    const onError = (e: ErrorEvent) => {
      const msg = String(e?.message || "");
      if (msg.includes("Loading chunk") || msg.includes("ChunkLoadError")) reload();
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason: any = e?.reason;
      const msg = String(reason?.message || "");
      if (msg.includes("Loading chunk") || reason?.name === "ChunkLoadError") reload();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
