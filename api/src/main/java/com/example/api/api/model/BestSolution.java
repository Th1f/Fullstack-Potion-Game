package com.example.api.api.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class BestSolution {
    @JsonProperty("leastAmountIncompatibilities")
    private int leastAmountIncompatibilities;
    
    @JsonProperty("bestRoomAssignment")
    private String bestRoomAssignment;
    
    public BestSolution(int leastAmountIncompatibilities, String bestRoomAssignment) {
        this.leastAmountIncompatibilities = leastAmountIncompatibilities;
        this.bestRoomAssignment = bestRoomAssignment;
    }

    public BestSolution() {
    }
    
    public int getLeastAmountIncompatibilities() {
        return leastAmountIncompatibilities;
    }

    public void setLeastAmountIncompatibilities(int leastAmountIncompatibilities) {
        this.leastAmountIncompatibilities = leastAmountIncompatibilities;
    }

    public String getBestRoomAssignment() {
        return bestRoomAssignment;
    }

    public void setBestRoomAssignment(String bestRoomAssignment) {
        this.bestRoomAssignment = bestRoomAssignment;
    }
}
