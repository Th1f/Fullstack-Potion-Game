package com.example.api.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class BestSolution {
    @JsonProperty("numRooms")
    private int numRooms;
    
    @JsonProperty("numPotions")
    private int numPotions;
    
    @JsonProperty("numIncompatibilities")
    private int numIncompatibilities;
    
    @JsonProperty("incompatibilities")
    private String incompatibilities;
    
    public BestSolution(int numRooms, int numPotions, int numIncompatibilities, String incompatibilities) {
        this.numRooms = numRooms;
        this.numPotions = numPotions;
        this.numIncompatibilities = numIncompatibilities;
        this.incompatibilities = incompatibilities;
    }

    // Default constructor for JSON serialization
    public BestSolution() {
    }
    
    // Getters and setters
    public int getNumRooms() {
        return numRooms;
    }

    public void setNumRooms(int numRooms) {
        this.numRooms = numRooms;
    }

    public int getNumPotions() {
        return numPotions;
    }

    public void setNumPotions(int numPotions) {
        this.numPotions = numPotions;
    }

    public int getNumIncompatibilities() {
        return numIncompatibilities;
    }

    public void setNumIncompatibilities(int numIncompatibilities) {
        this.numIncompatibilities = numIncompatibilities;
    }

    public String getIncompatibilities() {
        return incompatibilities;
    }

    public void setIncompatibilities(String incompatibilities) {
        this.incompatibilities = incompatibilities;
    }
}
