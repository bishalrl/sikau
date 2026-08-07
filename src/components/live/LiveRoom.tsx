"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  sessionId: string;
  title: string;
  hostId: string;
  role: "host" | "viewer";
  userId: string;
};

type Signal = {
  id: string;
  type: string;
  fromUserId: string;
  toUserId: string | null;
  payload: string;
  createdAt: string;
};

type StrokePoint = { x: number; y: number };
type Stroke = { id: string; color: string; width: number; points: StrokePoint[] };

type AnnotateMessage =
  | { kind: "stroke-start"; id: string; color: string; width: number; x: number; y: number }
  | { kind: "stroke-move"; id: string; x: number; y: number }
  | { kind: "stroke-end"; id: string }
  | { kind: "clear" };

const iceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

const PEN_COLORS = ["#f8fafc", "#ef4444", "#fbbf24", "#22c55e", "#38bdf8"];

export function LiveRoom({ sessionId, title, hostId, role, userId }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const displayStreamRef = useRef<MediaStream | null>(null);
  /** Tracks currently published to peers (camera or screen). */
  const outboundStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const pendingJoinsRef = useRef<string[]>([]);
  const hostReadyRef = useRef(false);
  const lastPollRef = useRef<string>(new Date(0).toISOString());
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const activeStrokeIdRef = useRef<string | null>(null);
  const drawEnabledRef = useRef(false);

  const [status, setStatus] = useState(role === "host" ? "Starting camera..." : "Connecting...");
  const [error, setError] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [drawEnabled, setDrawEnabled] = useState(false);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [needsGesture, setNeedsGesture] = useState(false);

  drawEnabledRef.current = drawEnabled;

  async function postSignal(type: string, toUserId: string | null, payload: Record<string, unknown> = {}) {
    await fetch(`/api/live/${sessionId}/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, toUserId, payload }),
    });
  }

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokesRef.current) {
      if (stroke.points.length === 0) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      stroke.points.forEach((point, index) => {
        const x = point.x * canvas.width;
        const y = point.y * canvas.height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    const rect = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    redrawCanvas();
  }, [redrawCanvas]);

  async function playRemote(stream: MediaStream) {
    const el = remoteVideoRef.current;
    if (!el) return;
    el.srcObject = stream;
    try {
      el.muted = false;
      await el.play();
      setNeedsGesture(false);
      setStatus("Live connected");
    } catch {
      // Autoplay with sound is often blocked — mute briefly then ask for a tap.
      try {
        el.muted = true;
        await el.play();
        setNeedsGesture(true);
        setStatus("Tap to enable sound");
      } catch {
        setNeedsGesture(true);
        setStatus("Tap to play stream");
      }
    }
  }

  function attachRemoteTrack(stream: MediaStream) {
    void playRemote(stream);
  }

  function broadcastAnnotate(message: AnnotateMessage) {
    const raw = JSON.stringify(message);
    let sent = 0;
    dataChannelsRef.current.forEach((channel) => {
      if (channel.readyState === "open") {
        channel.send(raw);
        sent += 1;
      }
    });
    // HTTP fallback only when no peer data channel is ready yet.
    if (sent === 0) {
      void postSignal("annotate", null, message as unknown as Record<string, unknown>);
    }
  }

  function applyAnnotate(message: AnnotateMessage) {
    if (message.kind === "clear") {
      strokesRef.current = [];
      redrawCanvas();
      return;
    }

    if (message.kind === "stroke-start") {
      if (strokesRef.current.some((item) => item.id === message.id)) return;
      strokesRef.current.push({
        id: message.id,
        color: message.color,
        width: message.width,
        points: [{ x: message.x, y: message.y }],
      });
      redrawCanvas();
      return;
    }

    if (message.kind === "stroke-move" || message.kind === "stroke-end") {
      const stroke = strokesRef.current.find((item) => item.id === message.id);
      if (!stroke) return;
      if (message.kind === "stroke-move") {
        const last = stroke.points[stroke.points.length - 1];
        if (last && last.x === message.x && last.y === message.y) return;
        stroke.points.push({ x: message.x, y: message.y });
      }
      redrawCanvas();
    }
  }

  function wireDataChannel(remoteUserId: string, channel: RTCDataChannel) {
    dataChannelsRef.current.set(remoteUserId, channel);
    channel.onmessage = (event) => {
      try {
        applyAnnotate(JSON.parse(String(event.data)) as AnnotateMessage);
      } catch {
        // Ignore malformed annotation payloads.
      }
    };
  }

  async function flushIce(remoteUserId: string, pc: RTCPeerConnection) {
    const queued = pendingIceRef.current.get(remoteUserId) ?? [];
    pendingIceRef.current.delete(remoteUserId);
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // Ignore stale ICE.
      }
    }
  }

  async function queueOrAddIce(remoteUserId: string, candidate: RTCIceCandidateInit) {
    const pc = peersRef.current.get(remoteUserId);
    if (!pc || !pc.remoteDescription) {
      const list = pendingIceRef.current.get(remoteUserId) ?? [];
      list.push(candidate);
      pendingIceRef.current.set(remoteUserId, list);
      return;
    }
    try {
      await pc.addIceCandidate(candidate);
    } catch {
      // Ignore late ICE candidates.
    }
  }

  async function createPeer(remoteUserId: string, asOfferer: boolean) {
    const existing = peersRef.current.get(remoteUserId);
    if (existing) {
      return existing;
    }

    const pc = new RTCPeerConnection({ iceServers });
    peersRef.current.set(remoteUserId, pc);

    const outbound = outboundStreamRef.current;
    if (outbound) {
      for (const track of outbound.getTracks()) {
        pc.addTrack(track, outbound);
      }
    }

    if (asOfferer) {
      const channel = pc.createDataChannel("annotate");
      wireDataChannel(remoteUserId, channel);
    } else {
      pc.ondatachannel = (event) => {
        wireDataChannel(remoteUserId, event.channel);
      };
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        attachRemoteTrack(stream);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        void postSignal("ice", remoteUserId, { candidate: event.candidate.toJSON() });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected" && role === "viewer") {
        setStatus("Live connected");
      }
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setStatus("Connection interrupted — refreshing…");
      }
    };

    if (asOfferer) {
      const offer = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
      await pc.setLocalDescription(offer);
      await postSignal("offer", remoteUserId, { sdp: offer });
    }

    return pc;
  }

  async function renegotiatePeer(remoteUserId: string, pc: RTCPeerConnection) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await postSignal("offer", remoteUserId, { sdp: offer });
  }

  async function replaceOutboundVideo(track: MediaStreamTrack | null) {
    const replacements: Promise<void>[] = [];
    peersRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((item) => item.track?.kind === "video" || item.track === null);
      const videoSender = pc.getSenders().find((item) => item.track?.kind === "video") ?? sender;
      if (videoSender) {
        replacements.push(videoSender.replaceTrack(track));
      }
    });
    await Promise.all(replacements);
  }

  async function handleViewerJoin(fromUserId: string) {
    if (role !== "host") return;
    if (!hostReadyRef.current || !outboundStreamRef.current) {
      if (!pendingJoinsRef.current.includes(fromUserId)) {
        pendingJoinsRef.current.push(fromUserId);
      }
      return;
    }
    setViewerCount((count) => count + 1);
    await createPeer(fromUserId, true);
  }

  async function handleSignal(signal: Signal) {
    const payload = JSON.parse(signal.payload) as Record<string, unknown>;

    if (role === "host" && signal.type === "viewer-join") {
      await handleViewerJoin(signal.fromUserId);
      return;
    }

    if (role === "host" && signal.type === "viewer-leave") {
      const pc = peersRef.current.get(signal.fromUserId);
      pc?.close();
      peersRef.current.delete(signal.fromUserId);
      dataChannelsRef.current.delete(signal.fromUserId);
      pendingIceRef.current.delete(signal.fromUserId);
      setViewerCount((count) => Math.max(0, count - 1));
      return;
    }

    if (signal.type === "offer" && role === "viewer") {
      let pc = peersRef.current.get(signal.fromUserId);
      if (pc) {
        // Renegotiation (e.g. host started presenting).
        await pc.setRemoteDescription(payload.sdp as RTCSessionDescriptionInit);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await postSignal("answer", signal.fromUserId, { sdp: answer });
        await flushIce(signal.fromUserId, pc);
        return;
      }
      pc = await createPeer(signal.fromUserId, false);
      await pc.setRemoteDescription(payload.sdp as RTCSessionDescriptionInit);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await postSignal("answer", signal.fromUserId, { sdp: answer });
      await flushIce(signal.fromUserId, pc);
      return;
    }

    if (signal.type === "answer" && role === "host") {
      const pc = peersRef.current.get(signal.fromUserId);
      if (pc) {
        await pc.setRemoteDescription(payload.sdp as RTCSessionDescriptionInit);
        await flushIce(signal.fromUserId, pc);
      }
      return;
    }

    if (signal.type === "ice") {
      if (payload.candidate) {
        await queueOrAddIce(signal.fromUserId, payload.candidate as RTCIceCandidateInit);
      }
      return;
    }

    if (signal.type === "annotate" && role === "viewer") {
      applyAnnotate(payload as unknown as AnnotateMessage);
      return;
    }

    if (signal.type === "annotate-clear") {
      applyAnnotate({ kind: "clear" });
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        if (role === "host") {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: { echoCancellation: true, noiseSuppression: true },
          });
          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          cameraStreamRef.current = stream;
          outboundStreamRef.current = stream;
          hostReadyRef.current = true;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            void localVideoRef.current.play().catch(() => undefined);
          }
          setStatus("You are live — waiting for viewers");

          const pending = [...pendingJoinsRef.current];
          pendingJoinsRef.current = [];
          for (const viewerId of pending) {
            await handleViewerJoin(viewerId);
          }
        } else {
          await postSignal("viewer-join", hostId, { userId });
          setStatus("Waiting for host stream...");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to access camera/microphone.");
        setStatus("Media error");
      }
    }

    void boot();
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const poll = window.setInterval(async () => {
      try {
        const response = await fetch(
          `/api/live/${sessionId}/signal?after=${encodeURIComponent(lastPollRef.current)}`,
        );
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Signal error");
          return;
        }

        for (const signal of data.signals as Signal[]) {
          lastPollRef.current = signal.createdAt;
          await handleSignal(signal);
        }

        if (data.session?.status === "ENDED") {
          setStatus("Live session ended");
        }
      } catch {
        // Keep polling.
      }
    }, 900);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.removeEventListener("resize", resizeCanvas);
      if (role === "viewer") {
        void postSignal("viewer-leave", hostId, { userId });
      }
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      displayStreamRef.current?.getTracks().forEach((track) => track.stop());
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      dataChannelsRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, role, hostId, userId]);

  function toggleMute() {
    const track = cameraStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }

  function toggleCamera() {
    if (presenting) return;
    const track = cameraStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOff(!track.enabled);
  }

  async function startPresent() {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
      displayStreamRef.current = display;
      const screenTrack = display.getVideoTracks()[0];
      if (!screenTrack) return;

      outboundStreamRef.current = new MediaStream([
        screenTrack,
        ...(cameraStreamRef.current?.getAudioTracks() ?? []),
        ...display.getAudioTracks(),
      ]);

      await replaceOutboundVideo(screenTrack);

      // Some browsers need an explicit renegotiation after track replace.
      for (const [remoteUserId, pc] of peersRef.current) {
        if (pc.signalingState === "stable") {
          await renegotiatePeer(remoteUserId, pc);
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = display;
        void localVideoRef.current.play().catch(() => undefined);
      }
      if (pipVideoRef.current && cameraStreamRef.current) {
        pipVideoRef.current.srcObject = cameraStreamRef.current;
        void pipVideoRef.current.play().catch(() => undefined);
      }

      screenTrack.onended = () => {
        void stopPresent();
      };

      setPresenting(true);
      setCameraOff(false);
      setStatus("Presenting screen");
      resizeCanvas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to share screen.");
    }
  }

  async function stopPresent() {
    const camera = cameraStreamRef.current;
    displayStreamRef.current?.getTracks().forEach((track) => track.stop());
    displayStreamRef.current = null;

    if (camera) {
      outboundStreamRef.current = camera;
      const camTrack = camera.getVideoTracks()[0] ?? null;
      await replaceOutboundVideo(camTrack);
      for (const [remoteUserId, pc] of peersRef.current) {
        if (pc.signalingState === "stable") {
          await renegotiatePeer(remoteUserId, pc);
        }
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = camera;
        void localVideoRef.current.play().catch(() => undefined);
      }
    }

    setPresenting(false);
    setStatus("You are live — waiting for viewers");
    resizeCanvas();
  }

  function clearAnnotations() {
    strokesRef.current = [];
    redrawCanvas();
    broadcastAnnotate({ kind: "clear" });
    void postSignal("annotate-clear", null, {});
  }

  function pointerToNorm(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  }

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (role !== "host" || !drawEnabledRef.current) return;
    const point = pointerToNorm(event);
    if (!point) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeStrokeIdRef.current = id;
    const message: AnnotateMessage = {
      kind: "stroke-start",
      id,
      color: penColor,
      width: presenting ? 4 : 3,
      x: point.x,
      y: point.y,
    };
    applyAnnotate(message);
    broadcastAnnotate(message);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || !activeStrokeIdRef.current) return;
    const point = pointerToNorm(event);
    if (!point) return;
    const message: AnnotateMessage = {
      kind: "stroke-move",
      id: activeStrokeIdRef.current,
      x: point.x,
      y: point.y,
    };
    applyAnnotate(message);
    broadcastAnnotate(message);
  }

  function onPointerUp() {
    if (!drawingRef.current || !activeStrokeIdRef.current) return;
    const message: AnnotateMessage = { kind: "stroke-end", id: activeStrokeIdRef.current };
    applyAnnotate(message);
    broadcastAnnotate(message);
    drawingRef.current = false;
    activeStrokeIdRef.current = null;
  }

  async function enablePlayback() {
    const el = remoteVideoRef.current;
    if (!el) return;
    el.muted = false;
    try {
      await el.play();
      setNeedsGesture(false);
      setStatus("Live connected");
    } catch {
      setError("Browser blocked playback. Check site permissions for sound.");
    }
  }

  async function endLive() {
    const response = await fetch("/api/admin/live", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, action: "end" }),
    });
    if (response.ok) {
      setStatus("Live session ended");
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
      displayStreamRef.current?.getTracks().forEach((track) => track.stop());
    }
  }

  return (
    <div className="live-room">
      <div className="live-room__header">
        <div>
          <p className="live-room__eyebrow">{role === "host" ? "Hosting" : "Watching"}</p>
          <h1 className="live-room__title">{title}</h1>
          <p className="live-room__status">{status}</p>
        </div>
        {role === "host" && (
          <div className="live-room__actions">
            <span className="live-room__viewers">{viewerCount} watching</span>
            <Button type="button" variant="outline" size="sm" onClick={toggleMute}>
              {muted ? "Unmute" : "Mute"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={toggleCamera} disabled={presenting}>
              {cameraOff ? "Camera on" : "Camera off"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => (presenting ? void stopPresent() : void startPresent())}
            >
              {presenting ? "Stop present" : "Present"}
            </Button>
            <Button
              type="button"
              variant={drawEnabled ? "primary" : "outline"}
              size="sm"
              onClick={() => setDrawEnabled((value) => !value)}
            >
              {drawEnabled ? "Drawing on" : "Draw"}
            </Button>
            {drawEnabled && (
              <>
                <div className="live-room__pens" role="group" aria-label="Pen color">
                  {PEN_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`live-room__pen ${penColor === color ? "is-active" : ""}`}
                      style={{ background: color }}
                      onClick={() => setPenColor(color)}
                      aria-label={`Pen ${color}`}
                    />
                  ))}
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={clearAnnotations}>
                  Clear board
                </Button>
              </>
            )}
            <Button type="button" variant="secondary" size="sm" onClick={endLive}>
              End live
            </Button>
          </div>
        )}
      </div>

      {error && <p className="live-room__error">{error}</p>}

      <div
        ref={stageRef}
        className={`live-room__stage ${role === "host" ? "live-room__stage--host" : ""} ${presenting ? "is-presenting" : ""}`}
      >
        {role === "host" ? (
          <>
            <video ref={localVideoRef} autoPlay playsInline muted className="live-room__video" />
            {presenting && (
              <video ref={pipVideoRef} autoPlay playsInline muted className="live-room__pip" />
            )}
          </>
        ) : (
          <video ref={remoteVideoRef} autoPlay playsInline className="live-room__video" />
        )}

        <canvas
          ref={canvasRef}
          className={`live-room__board ${role === "host" && drawEnabled ? "is-drawing" : ""}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />

        {role === "viewer" && needsGesture && (
          <button type="button" className="live-room__play-gate" onClick={() => void enablePlayback()}>
            Tap to play video & sound
          </button>
        )}
      </div>

      {role === "host" && (
        <p className="live-room__hint">
          Use <strong>Present</strong> to share slides or notes, then <strong>Draw</strong> to annotate over the
          stream for viewers — like Google Meet.
        </p>
      )}
    </div>
  );
}
