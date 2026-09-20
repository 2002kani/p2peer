package com.p2peer.FileTransfer.models;

// TODO: Maybe specify it more detailed in a follow-up ticket
public class DeviceKind {

    private DeviceKind() {}

    public static String fromUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Unknown";
        }
        String ua = userAgent.toLowerCase();

        if (ua.contains("ipad") || (ua.contains("android") && !ua.contains("mobile"))) {
            return "Tablet";
        }
        if (ua.contains("iphone") || ua.contains("android") || ua.contains("mobile")) {
            return "Handy";
        }
        return "Laptop";
    }
}
