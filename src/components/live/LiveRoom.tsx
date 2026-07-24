"use client";

import { useEffect, useRef, useState } from "react";
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

const iceServers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export function LiveRoom({ sessionId, title, hostId, role, userId }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const lastPollRef = useRef<string>(new Date(0).toISOString());
  const [status, setStatus] = useState(role === "host" ? "Starting camera..." : "Connecting...");
  const { setError, error } = useErrorState();
  const [viewerCount, setViewerCount] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  async function postSignal(type: string, toUserId: string | null, payload: Record<string, unknown> = {}) {
    await fetch(`/api/live/${sessionId}/signal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, toUserId, payload }),
    });
  }

  function attachRemoteTrack(stream: MediaStream) {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  }

  async function createPeer(remoteUserId: string, asOfferer: boolean) {
    if (peersRef.current.has(remoteUserId)) {
      return peersRef.current.get(remoteUserId)!;
    }

    const pc = new RTCPeerConnection({ iceServers });
    peersRef.current.set(remoteUserId, pc);

    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) {
        pc.addTrack(track, localStreamRef.current);
      }
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        attachRemoteTrack(stream);
        setStatus("Live connected");
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        void postSignal("ice", remoteUserId, { candidate: event.candidate.toJSON() });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setStatus("Connection interrupted");
      }
    };

    if (asOfferer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await postSignal("offer", remoteUserId, { sdp: offer });
    }

    return pc;
  }

  async function handleSignal(signal: Signal) {
    const payload = JSON.parse(signal.payload) as Record<string, unknown>;

    if (role === "host" && signal.type === "viewer-join") {
      setViewerCount((count) => count + 1);
      await createPeer(signal.fromUserId, true);
      return;
    }

    if (role === "host" && signal.type === "viewer-leave") {
      const pc = peersRef.current.get(signal.fromUserId);
      pc?.close();
      peersRef.current.delete(signal.fromUserId);
      setViewerCount((count) => Math.max(0, count - 1));
      return;
    }

    if (signal.type === "offer" && role === "viewer") {
      const pc = await createPeer(signal.fromUserId, false);
      await pc.setRemoteDescription(payload.sdp as RTCSessionDescriptionInit);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await postSignal("answer", signal.fromUserId, { sdp: answer });
      return;
    }

    if (signal.type === "answer" && role === "host") {
      const pc = peersRef.current.get(signal.fromUserId);
      if (pc && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(payload.sdp as RTCSessionDescriptionInit);
      }
      return;
    }

    if (signal.type === "ice") {
      const pc = peersRef.current.get(signal.fromUserId);
      if (pc && payload.candidate) {
        try {
          await pc.addIceCandidate(payload.candidate as RTCIceCandidateInit);
        } catch {
          // Ignore late ICE candidates.
        }
      }
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        if (role === "host") {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          setStatus("You are live — waiting for viewers");
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
    }, 1200);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      if (role === "viewer") {
        void postSignal("viewer-leave", hostId, { userId });
      }
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, role, hostId, userId]);

  function toggleMute() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }

  function toggleCamera() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOff(!track.enabled);
  }

  async function endLive() {
    const response = await fetch("/api/admin/live", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, action: "end" }),
    });
    if (response.ok) {
      setStatus("Live session ended");
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
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
            <Button type="button" variant="outline" size="sm" onClick={toggleCamera}>
              {cameraOff ? "Camera on" : "Camera off"}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={endLive}>
              End live
            </Button>
          </div>
        )}
      </div>

      {error && <p className="live-room__error">{error}</p>}

      <div className={`live-room__stage ${role === "host" ? "live-room__stage--host" : ""}`}>
        {role === "host" ? (
          <video ref={localVideoRef} autoPlay playsInline muted className="live-room__video" />
        ) : (
          <video ref={remoteVideoRef} autoPlay playsInline className="live-room__video" />
        )}
      </div>
    </div>
  );
}

function useErrorState() {
  const [error, setError] = useState("");
  return { error, setError };
}
