/**
 * Lightweight WebRTC data-channel helper for nearby play.
 * Signaling is exchanged through the Steal Bundle room API.
 */

export type SignalPayload =
  | { type: "offer"; sdp: string }
  | { type: "answer"; sdp: string }
  | { type: "ice"; candidate: string };

export type PeerHandlers = {
  onMessage: (data: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

export async function createHostPeer(handlers: PeerHandlers): Promise<{
  pc: RTCPeerConnection;
  channel: RTCDataChannel;
  createOffer: () => Promise<SignalPayload>;
  acceptAnswer: (answer: SignalPayload) => Promise<void>;
  addIce: (ice: SignalPayload) => Promise<void>;
  close: () => void;
}> {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });
  const channel = pc.createDataChannel("steal-bundle", { ordered: true });
  wireChannel(channel, handlers);

  const createOffer = async (): Promise<SignalPayload> => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitIceGathering(pc);
    return { type: "offer", sdp: pc.localDescription?.sdp || "" };
  };

  const acceptAnswer = async (answer: SignalPayload) => {
    if (answer.type !== "answer") throw new Error("Expected answer");
    await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });
  };

  const addIce = async (ice: SignalPayload) => {
    if (ice.type !== "ice" || !ice.candidate) return;
    try {
      await pc.addIceCandidate(JSON.parse(ice.candidate));
    } catch {
      /* ignore bad candidates */
    }
  };

  return {
    pc,
    channel,
    createOffer,
    acceptAnswer,
    addIce,
    close: () => {
      channel.close();
      pc.close();
    },
  };
}

export async function createGuestPeer(
  offer: SignalPayload,
  handlers: PeerHandlers,
): Promise<{
  pc: RTCPeerConnection;
  createAnswer: () => Promise<SignalPayload>;
  addIce: (ice: SignalPayload) => Promise<void>;
  close: () => void;
}> {
  if (offer.type !== "offer") throw new Error("Expected offer");
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });
  pc.ondatachannel = (ev) => wireChannel(ev.channel, handlers);
  await pc.setRemoteDescription({ type: "offer", sdp: offer.sdp });

  const createAnswer = async (): Promise<SignalPayload> => {
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitIceGathering(pc);
    return { type: "answer", sdp: pc.localDescription?.sdp || "" };
  };

  const addIce = async (ice: SignalPayload) => {
    if (ice.type !== "ice" || !ice.candidate) return;
    try {
      await pc.addIceCandidate(JSON.parse(ice.candidate));
    } catch {
      /* ignore */
    }
  };

  return {
    pc,
    createAnswer,
    addIce,
    close: () => pc.close(),
  };
}

function wireChannel(channel: RTCDataChannel, handlers: PeerHandlers) {
  channel.onopen = () => handlers.onOpen?.();
  channel.onclose = () => handlers.onClose?.();
  channel.onmessage = (ev) => {
    if (typeof ev.data === "string") handlers.onMessage(ev.data);
  };
}

function waitIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const check = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", check);
    window.setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    }, 2500);
  });
}
