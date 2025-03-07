package com.example.api.api.model;

import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;

public class Graph {
    private int V; 
    private HashSet<Integer>[] adj; 

    @SuppressWarnings({ "unchecked", "rawtypes" })
    public Graph(int v) {
        V = v;
        adj = new HashSet[v];
        for (int i = 0; i < v; ++i)
            adj[i] = new HashSet();
    }

    public void addEdge(List<Integer> w) {
        // Connect all pairs in the incompatibility group
        for (int i = 0; i < w.size(); i++) {
            for (int j = i + 1; j < w.size(); j++) {
                int v1 = w.get(i) - 1; // Convert to 0-based index
                int v2 = w.get(j) - 1;
                adj[v1].add(v2);
                adj[v2].add(v1);
            }
        }
    }

    public int findLargestDegree(boolean[] available) {
        int max = -1;
        int maxIndex = -1;
        for (int i = 0; i < V; i++) {
            if (available[i] && (maxIndex == -1 || adj[i].size() > max)) {
                maxIndex = i;
                max = adj[i].size();
            }
        }
        return maxIndex;
    }

    public void roomAssignment(HashMap<Integer, Integer> assignRoom, int r, int p) {
        int[] color = new int[V];
        Arrays.fill(color, -1);
        
        
        for (int i = 0; i < V; i++) {
            if (color[i] == -1) {
                colorVertex(i, color, r);
            }
        }

        for (int i = 0; i < V; i++) {
            if (color[i] != -1) {
                assignRoom.put(i + 1, color[i]);
            }
        }
    }

    private void colorVertex(int v, int[] color, int numColors) {
        boolean[] used = new boolean[numColors];
        
        for (int adj_v : adj[v]) {
            if (color[adj_v] != -1) {
                used[color[adj_v]] = true;
            }
        }
        
        for (int c = 0; c < numColors; c++) {
            if (!used[c]) {
                color[v] = c;
                break;
            }
        }
        
        if (color[v] == -1) {
            color[v] = 0;
        }
    }

    public int calculateLabel(HashMap<Integer, Integer> assignRoom, List<List<Integer>> incompatibleGroup, int roomNum) {
        int violations = 0;
        for (List<Integer> group : incompatibleGroup) {
            for (int i = 0; i < group.size(); i++) {
                for (int j = i + 1; j < group.size(); j++) {
                    int room1 = assignRoom.get(group.get(i));
                    int room2 = assignRoom.get(group.get(j));
                    if (room1 == room2) {
                        violations++;
                    }
                }
            }
        }
        return violations;
    }
}
