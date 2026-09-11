import archiver from "archiver";
import { PassThrough } from "stream";
import { finished } from "stream/promises";
import type { MasterProductJourney } from "./cube-faces";
import { DEFAULT_MASTER_PRODUCT_JOURNEY } from "./master-product-walkthrough";
import {
  buildWalkthroughPack,
  walkthroughPackZipFilename,
  type WalkthroughPack,
  type WalkthroughPackOptions,
} from "./walkthrough-pack";

/** Zip the pack for download (API routes and scripts only — not for client bundles). */
export async function buildWalkthroughPackZipBuffer(
  journey: MasterProductJourney = DEFAULT_MASTER_PRODUCT_JOURNEY,
  options: WalkthroughPackOptions = {},
): Promise<{ buffer: Buffer; filename: string; pack: WalkthroughPack }> {
  const pack = buildWalkthroughPack(journey, options);
  const archive = archiver("zip", { zlib: { level: 9 } });
  const passthrough = new PassThrough();
  const chunks: Buffer[] = [];
  passthrough.on("data", (chunk: Buffer) => chunks.push(chunk));
  archive.pipe(passthrough);

  for (const file of pack.files) {
    archive.append(file.content, { name: file.path });
  }

  archive.on("error", (err) => passthrough.destroy(err));
  await archive.finalize();
  await finished(passthrough);

  const buffer = Buffer.concat(chunks);
  if (buffer.length < 22) throw new Error("Walkthrough pack zip is empty");

  return { buffer, filename: walkthroughPackZipFilename(pack), pack };
}
