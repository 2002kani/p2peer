package com.p2peer.FileTransfer.signaling;

import org.junit.jupiter.api.Test;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SignalingHandlerTest {
    private final ObjectMapper json = new ObjectMapper();
    private final RoomRegistry registry = new RoomRegistry("subnet");
    private final SignalingHandler handler = new SignalingHandler(registry);

    @Test
    void peerWhoseWelcomeFailsIsNeverAnnounced() throws IOException {
        List<JsonNode> observed = new ArrayList<>();
        WebSocketSession observer = session("observer", observed);
        handler.afterConnectionEstablished(observer);

        // tomcat closes the session inside the failing send, in the same thread
        WebSocketSession dying = mock(WebSocketSession.class);
        AtomicBoolean open = new AtomicBoolean(true);
        when(dying.getId()).thenReturn("dying");
        when(dying.getAttributes()).thenReturn(attributes());
        when(dying.isOpen()).thenAnswer(call -> open.get());
        doAnswer(call -> {
            open.set(false);
            handler.afterConnectionClosed(dying, CloseStatus.SERVER_ERROR);
            throw new IOException("Broken pipe");
        }).when(dying).sendMessage(any());

        handler.afterConnectionEstablished(dying);

        assertThat(types(observed)).containsExactly("welcome", "peer-left");
        assertThat(registry.get("dying")).isNull();
    }

    @Test
    void peerLeftIsRepeatedWhenItOvertookPeerJoined() throws IOException {
        WebSocketSession joining = session("joining", new ArrayList<>());

        // joining closes while its peer-joined is on the way to the observer
        List<JsonNode> observed = new ArrayList<>();
        WebSocketSession observer = session("observer", observed);
        doAnswer(call -> {
            JsonNode message = json.readTree(call.<TextMessage>getArgument(0).getPayload());
            if ("peer-joined".equals(message.path("type").asString())) {
                handler.afterConnectionClosed(joining, CloseStatus.SERVER_ERROR);
            }
            observed.add(message);
            return null;
        }).when(observer).sendMessage(any());
        handler.afterConnectionEstablished(observer);

        handler.afterConnectionEstablished(joining);

        assertThat(types(observed)).containsExactly("welcome", "peer-left", "peer-joined", "peer-left");
    }

    private WebSocketSession session(String id, List<JsonNode> received) throws IOException {
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn(id);
        when(session.getAttributes()).thenReturn(attributes());
        when(session.isOpen()).thenReturn(true);
        doAnswer(call -> {
            received.add(json.readTree(call.<TextMessage>getArgument(0).getPayload()));
            return null;
        }).when(session).sendMessage(any());
        return session;
    }

    private Map<String, Object> attributes() {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("ip", "192.168.0.1");
        attributes.put("kind", "desktop");
        return attributes;
    }

    private List<String> types(List<JsonNode> messages) {
        return messages.stream().map(message -> message.path("type").asString()).toList();
    }
}
