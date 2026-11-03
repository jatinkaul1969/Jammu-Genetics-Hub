"use client";

import { useEffect } from "react";
import Script from "next/script";
import { attributionRef, captureAttribution, getAttribution } from "@/lib/attribution";
import { trackEvent } from "@/lib/analytics";

// Optional measurement, switched on by settings (no code change): add
// NEXT_PUBLIC_GA_ID (Google Analytics 4, "G-XXXXXXXXXX") and/or
// NEXT_PUBLIC_CLARITY_ID (Microsoft Clarity — free heat-maps and recordings).
// The IDs are checked against their expected shape before being placed in a script.
const GA_ID = /^G-[A-Z0-9]{4,20}$/.test(process.env.NEXT_PUBLIC_GA_ID ?? "") ? process.env.NEXT_PUBLIC_GA_ID : undefined;
const CLARITY_ID = /^[a-z0-9]{6,20}$/i.test(process.env.NEXT_PUBLIC_CLARITY_ID ?? "") ? process.env.NEXT_PUBLIC_CLARITY_ID : undefined;

export function Analytics() {
  useEffect(() => {
    captureAttribution();

    // One listener for the whole site: count taps on call / WhatsApp links, and tag
    // WhatsApp messages with the post they came from so the chat shows its source.
    function onClick(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.("a");
      const href = a?.getAttribute("href") ?? "";
      if (!a || !href) return;
      if (href.startsWith("tel:")) {
        trackEvent("call_click", { page: location.pathname });
      } else if (href.startsWith("https://wa.me/")) {
        const at = getAttribution();
        if (at) {
          try {
            const u = new URL(href);
            const text = u.searchParams.get("text") ?? "";
            if (!text.includes("(ref:")) {
              u.searchParams.set("text", `${text} (ref: ${attributionRef(at)})`.trim());
              a.setAttribute("href", u.toString());
            }
          } catch {
            // leave the link as it was
          }
        }
        trackEvent("whatsapp_click", { page: location.pathname });
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}
      {CLARITY_ID && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}
    </>
  );
}
