package com.p2peer.FileTransfer.signaling;

import com.p2peer.FileTransfer.models.Peer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.io.IOException;
import java.util.List;

@Component
@Slf4j
public class SignalingHandler extends TextWebSocketHandler {
    private final RoomRegistry registry;
    private final ObjectMapper json = new ObjectMapper();

    public SignalingHandler(RoomRegistry registry) {
        this.registry = registry;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession rawSession) {
        WebSocketSession session =
                new ConcurrentWebSocketSessionDecorator(rawSession, 5_000, 512 * 1024);

        String ip = getAttribute(session, "ip");
        String kind = getAttribute(session, "kind");
        String roomId = registry.getRoomId(ip);

        Peer peer = registry.join(session.getId(), kind, roomId, session);

        ObjectNode welcome = json.createObjectNode();
        welcome.put("type", "welcome");
        welcome.put("id", peer.getId());
        welcome.put("name", peer.getName());
        welcome.put("kind", peer.getKind());

        // new peer needs to know who is already there, otherwise it has nobody to send an offer to
        List<Peer> others = registry.othersInRoom(peer);
        ArrayNode list = welcome.putArray("peers");
        others.forEach(other -> list.add(describe(other)));

        send(peer, welcome);

        ObjectNode joined = json.createObjectNode();
        joined.put("type", "peer-joined");
        joined.set("peer", describe(peer));

        for (Peer other : others) {
            send(other, joined);
        }
    }

    /* relays offer / answer / ice candidates. The server does not need to understand "data" */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        Peer sender = registry.get(session.getId());
        if(sender == null) return;

        JsonNode msg;
        try {
            msg = json.readTree(message.getPayload());
        } catch (JacksonException e) {
            log.warn("invalid json from {}: {}", sender.getName(), e.getOriginalMessage());
            return;
        }

        if (!"signal".equals(msg.path("type").asString())) {
            log.warn("unknown message type from {}: {}", sender.getName(), msg.path("type"));
            return;
        }

        Peer target = registry.get(msg.path("to").asString(null));
        // only relay inside the same room -> knowing an id is not enough to reach a peer
        if (target == null || !target.getRoomId().equals(sender.getRoomId())) {
            log.warn("{} tried to signal unknown peer {}", sender.getName(), msg.path("to"));
            return;
        }

        JsonNode data = msg.path("data");
        if (!data.isObject()) return;

        ObjectNode relay = json.createObjectNode();
        relay.put("type", "signal");
        // "from" is always set by the server, so a client can not pretend to be someone else
        relay.put("from", sender.getId());
        relay.set("data", data);

        send(target, relay);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Peer peer = registry.leave(session.getId());
        if(peer == null) return;

        ObjectNode left = json.createObjectNode();
        left.put("type", "peer-left");
        left.put("id", peer.getId());

        // peer is already removed from the registry -> only the remaining ones get notified
        for (Peer other : registry.othersInRoom(peer)) {
            send(other, left);
        }
    }

    /* in a hard connection error afterConnectionClosed wont get called properly. This method cleans it up */
    @Override
    public void handleTransportError(WebSocketSession session, Throwable error) {
        log.warn("transport error in {}: {}", session.getId(), error.getMessage());
        afterConnectionClosed(session, CloseStatus.SERVER_ERROR);
    }

    private void send(Peer peer, ObjectNode payload) {
        try {
            if (peer.getSession().isOpen()) {
                peer.getSession().sendMessage(
                        new TextMessage(json.writeValueAsString(payload)));
            }
        } catch (IOException e) {
            log.warn("Senden an {} fehlgeschlagen: {}", peer.getName(), e.getMessage());
        }
    }

    private ObjectNode describe(Peer peer) {
        ObjectNode node = json.createObjectNode();
        node.put("id", peer.getId());
        node.put("name", peer.getName());
        node.put("kind", peer.getKind());
        return node;
    }

    private String getAttribute(WebSocketSession session, String key) {
        Object value = session.getAttributes().get(key);
        return value == null ? "" : String.valueOf(value);
    }
}
