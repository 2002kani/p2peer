package com.p2peer.FileTransfer.models;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RoomRegistry {
    private final String strategy;
    // Room containing of IP Adress as key, SessionIds of peers as Value
    private final Map<String, Set<String>> rooms = new ConcurrentHashMap<>();
    // Peers containing the SessionId as key
    private final Map<String, Peer> peers = new ConcurrentHashMap<>();

    public RoomRegistry(@Value("${room.strategy}") String strategy) {
        this.strategy = strategy;
    }

    public String getRoomId(String ip){
        if(strategy.equals("extract")){
            return ip;
        }
        int lastDot = ip.lastIndexOf('.');
        return lastDot > 0 ? ip.substring(0, lastDot) + ".*" : ip;
    }

    public synchronized Peer join(String peerId, String kind, String roomId,  WebSocketSession session){
        // computeIfAbsent -> if there is already a room w. sessionIds one receives their set, if not one creates a new one
        Set<String> members = rooms.computeIfAbsent(roomId, key -> ConcurrentHashMap.newKeySet());

        // implementation so that there are no two same names in one room
        String name = uniqueName(DeviceName.createNameForId(peerId), members);

        Peer peer = new Peer(peerId, name, kind, roomId, session);
        peers.put(peerId, peer);
        members.add(peerId);

        return peer;
    }

    public synchronized void leave(String peerId){
        // TODO: implement that
    }

    private String uniqueName(String base, Set<String> memberIds) {
        List<String> taken = memberIds.stream()
                .map(peers::get)
                .filter(Objects::nonNull)
                .map(Peer::getName)
                .toList();

        if (!taken.contains(base)) {
            return base;
        }
        for (int suffix = 2; suffix < 100; suffix++) {
            String candidate = base + " " + suffix;
            if (!taken.contains(candidate)) {
                return candidate;
            }
        }
        return base;
    }
}
