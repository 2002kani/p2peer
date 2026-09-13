package com.p2peer.FileTransfer.models;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.socket.WebSocketSession;

@Getter
@Setter
public class Peer {
    private final String id;
    private final String name;
    private final String roomId;
    private final WebSocketSession session;

    public Peer(String id, String name, String roomId, WebSocketSession session) {
        this.id = id;
        this.name = name;
        this.roomId = roomId;
        this.session = session;
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof Peer other && id.equals(other.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }
}
