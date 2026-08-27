import playArt from "@/media/artworks/play.png";
import seedsArt from "@/media/artworks/seeds.png";
import orbitArt from "@/media/artworks/orbit.png";
import securityArt from "@/media/artworks/security.png";
import apiArt from "@/media/artworks/api.png";
import apiBuilderArt from "@/media/artworks/api-builder.png";
import hardwareArt from "@/media/artworks/hardware.png";
import zzaiLogo from "@/media/zzai-logo.png";
import { ZC_FONT_DATA_URL } from "@/lib/zc-font-data";

/** Bundled static URLs — survive CLI deploys even when public/ is missing from the upload. */
export const MEDIA = {
  logo: zzaiLogo.src,
  fontZc: ZC_FONT_DATA_URL,
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
