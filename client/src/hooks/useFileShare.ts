import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ICE_SERVERS } from "../config";
import { initialRoomState, roomReducer } from "../signaling/roomReducer";
import {
  SignalingClient,
  type ConnectionState,
} from "../signaling/SignalingClient";
import { TransferService } from "../transfer/TransferService";
import { transfersReducer } from "../transfer/transfersReducer";
import { ConnectionManager } from "../webrtc/ConnectionManager";
import type { PeerConnectionState } from "../webrtc/PeerConnection";

export function useFileShare(signalingUrl: string) {
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [room, dispatchRoom] = useReducer(roomReducer, initialRoomState);
  const [peerStates, setPeerStates] = useState<
    Record<string, PeerConnectionState>
  >({});
  const [transfers, dispatchTransfer] = useReducer(transfersReducer, []);
  const transferServiceRef = useRef<TransferService | null>(null);

  useEffect(() => {
    const signaling = new SignalingClient(signalingUrl);
    const connections = new ConnectionManager(signaling, ICE_SERVERS);
    const transferService = new TransferService(connections);
    transferServiceRef.current = transferService;

    const unsubscribe = [
      signaling.events.on("status", (status) => {
        setConnection(status);
        if (status === "connecting") dispatchRoom({ type: "disconnected" });
      }),
      signaling.events.on("message", dispatchRoom),
      connections.events.on("state", ({ peerId, state }) =>
        setPeerStates((previous) => ({ ...previous, [peerId]: state })),
      ),
      transferService.events.on("update", dispatchTransfer),
    ];

    signaling.connect();

    return () => {
      unsubscribe.forEach((fn) => fn());
      transferService.dispose();
      connections.dispose();
      signaling.close();
      transferServiceRef.current = null;
    };
  }, [signalingUrl]);

  const sendFiles = useCallback((peerId: string, files: File[]) => {
    transferServiceRef.current?.sendFiles(peerId, files);
  }, []);

  return {
    connection,
    self: room.self,
    peers: room.peers,
    names: room.names,
    peerStates,
    transfers,
    sendFiles,
  };
}
