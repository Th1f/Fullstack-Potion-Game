package com.example.api.api.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.CrossOrigin;

import com.example.api.api.model.BestSolution;
import com.example.api.api.model.Graph;

@RestController
@CrossOrigin(origins = "*") // Allow requests from anywhere
public class DataController {
    @GetMapping("/api")
    public BestSolution getBestSolution(
        @RequestParam int numRooms, 
        @RequestParam int numPotions, 
        @RequestParam int numIncompatibilities,
        @RequestParam String incompatibilities
    ) {
        List<List<Integer>> incompatibilityGroups = Arrays.stream(incompatibilities.split(";"))
            .map(group -> Arrays.stream(group.split(","))
                .map(Integer::parseInt)
                .collect(Collectors.toList()))
            .collect(Collectors.toList());

        Graph graph = new Graph(numPotions);
        HashMap<Integer, Integer> assignRoom = new HashMap<Integer, Integer>(); 

        for (List<Integer> group : incompatibilityGroups) {
            System.out.println(group);
            graph.addEdge(group);
        }

        graph.roomAssignment(assignRoom, numRooms, numPotions);
        int label = graph.calculateLabel(assignRoom, incompatibilityGroups, numRooms);

        System.out.println();
		System.out.println("The number of required labels and the different room allocations are: ");
		System.out.println(label);
        String bestRoomAssignment = "";
		for (int i = 0; i < numRooms; i++) { 
			System.out.println("Room " + (i+1));
			for (int j = 1; j <= numPotions; j++) {
					if (assignRoom.get(j) == i) {
						System.out.print(j + " ");
                        bestRoomAssignment += j;
					}
			}
			System.out.println("0");
            bestRoomAssignment += "0";
		}
        System.out.println(bestRoomAssignment);
        
        return new BestSolution(numRooms, numPotions, numIncompatibilities, bestRoomAssignment);
    }
}