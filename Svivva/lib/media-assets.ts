import playArt from "@/media/artworks/play.png";
import seedsArt from "@/media/artworks/seeds.png";
import orbitArt from "@/media/artworks/orbit.png";
import securityArt from "@/media/artworks/security.png";
import apiArt from "@/media/artworks/api.png";
import apiBuilderArt from "@/media/artworks/api-builder.png";
import hardwareArt from "@/media/artworks/hardware.png";
import zzaiLogo from "@/media/zzai-logo.png";
import zcFont from "@/media/fonts/Zc-Regular.ttf";

/** Bundled static URLs — survive CLI deploys even when public/ is omitted from the upload. */
export const MEDIA = {
  logo: zzaiLogo.src,
  fontZc: typeof zcFont === "string" ? zcFont : (zcFont as { src: string }).src,
  artworks: {
    play: playArt.src,
    seeds: seedsArt.src,
    orbit: orbitArt.src,
    security: securityArt.src,
    api: apiArt.src,
    apiBuilder: apiBuilderArt.src,
    hardware: hardwareArt.src,
  },
} as const;
