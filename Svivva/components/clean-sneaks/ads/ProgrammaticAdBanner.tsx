"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import {
  adsterraContainerId,
  adsterraInvokeUrl,
  medianetConfig,
  monetagZoneId,
  programmaticNetwork,
} from "@/lib/clean-sneaks/ads/programmatic";
import { recordAdEvent } from "@/lib/clean-sneaks/ads";

type Props = {
  className?: string;
  onReady?: () => void;
};

/** Media.net or Adsterra display unit for the menu banner. */
export function ProgrammaticAdBanner({ className, onReady }: Props) {
  const network = programmaticNetwork();
  const mounted = useRef(false);
  const medianet = medianetConfig();
  const adsterraUrl = adsterraInvokeUrl();
  const containerId = adsterraContainerId();

  useEffect(() => {
    if (mounted.current || !network) return;
    mounted.current = true;
    recordAdEvent({ placement: "menu_banner", kind: "impression", network });
    onReady?.();
  }, [network, onReady]);

  if (network === "monetag") {
    const zone = monetagZoneId();
    if (!zone) return null;
    return (
      <div className={className} data-testid="programmatic-ad-monetag">
        <Script id="monetag-tag" strategy="afterInteractive">
          {`(function(s,u,z,p){s.src=u;s.async=true;s.setAttribute("data-zone",z);p.parentNode.insertBefore(s,p);})(document.createElement("script"),"https://s.monetag.com/tag/tag.js?tag=${zone}","${zone}",document.body);`}
        </Script>
        <div className="min-h-[50px] w-full" data-zone={zone} />
      </div>
    );
  }

  if (network === "medianet" && medianet) {
    return (
      <div className={className} data-testid="programmatic-ad-medianet">
        <Script
          id="medianet-loader"
          strategy="afterInteractive"
          src={`https://contextual.media.net/dmedianet.js?cid=${encodeURIComponent(medianet.cid)}`}
        />
        <div id={medianet.tagId}>
          <Script id="medianet-tag" strategy="afterInteractive">
            {`
              try {
                window._mNHandle = window._mNHandle || {};
                window._mNHandle.queue = window._mNHandle.queue || [];
                window._mNHandle.queue.push(function () {
                  window._mNDetails.loadTag("${medianet.tagId}", "320x50", "${medianet.tagId}");
                });
              } catch (e) {}
            `}
          </Script>
        </div>
      </div>
    );
  }

  if (network === "adsterra" && adsterraUrl) {
    return (
      <div className={className} data-testid="programmatic-ad-adsterra">
        <Script src={adsterraUrl} strategy="afterInteractive" async data-cfasync="false" />
        <div id={containerId} className="min-h-[50px] w-full" />
      </div>
    );
  }

  return null;
}
