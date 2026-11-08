package com.p2peer.FileTransfer.models;

public class DeviceName {
    private static final String[] ADJECTIVES = {
            "Blue", "Red", "Green", "Quiet", "Fast",
            "White", "Little", "Wild", "Golden", "Cold",
            "Silver", "Bright", "Dark", "Quick", "Soft",
            "Warm", "Clear", "Brave", "Pretty", "Big"
    };

    private static final String[] NOUNS = {
            "Mercedes", "Bmw", "Porsche", "Volkswagen", "Jaguar",
            "Pagani", "Mustang", "lamborghini", "Alfa Romeo", "Ferrari",
            "Ford", "Opel", "Audi", "Citroen", "Tesla",
            "Bentley", "Renault", "Fiat", "Bugatti", "Seat"
    };

    private DeviceName() {
    }

    public static String createNameForId(String id) {
        // Shifts bit to a positive hash only to prevent exception
        int hash = id.hashCode() & 0x7fffffff;

        String adjective = ADJECTIVES[hash % ADJECTIVES.length];
        String noun = NOUNS[(hash / ADJECTIVES.length) % NOUNS.length];

        return adjective + " " + noun;
    }
}
