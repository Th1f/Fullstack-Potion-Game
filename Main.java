import java.util.*;
import java.io.*;
import java.util.*;
import org.json.simple.*;
import org.json.simple.parser.*;
public class Main {
	public static void main(String[] args) {

		int g =-1, // number of groups of incompatible chemicals
				n = -1, // number of chemicals
				r = -1, // number of storage rooms
				p = 0; // number of necessaryrequired labels to print

		Scanner keyboard = new Scanner(System.in);

		System.out.println("Enter the number of chemicals to manage:  ");
		try {
			n = keyboard.nextInt();
		} catch (Exception e) {
			System.out.println("Invalid input");
			System.exit(0);
		}
		
		if (n < 1) {
			System.out.println("Too few chemicals");
			System.exit(0);
		}

		Graph chemGraph = new Graph(n);

		System.out.println("Enter the number of storage rooms: ");
		try {
			r = keyboard.nextInt();
		} catch (Exception e) {
			System.out.println("Invalid input");
			System.exit(0);
		}

		if (r < 1) {
			System.out.println("Too few rooms");
			System.exit(0);
		}

		System.out.println("Enter the number of groups of incompatible chemicals you must separate: ");
		try {
			g = keyboard.nextInt();
		} catch (Exception e) {
			System.out.println("Invalid input");
			System.exit(0);
		}


		if (g < 1) {
			System.out.println("Too few group");
			System.exit(0);
		}

		HashMap<Integer, Integer> assignRoom = new HashMap<Integer, Integer>(); 
		List<List<Integer>> incomaptibleGroup = new ArrayList<List<Integer>>();
		System.out.println(
				"Enter the list of incompatible chemicals of each group (one group per line, each terminated by 0): ");

		for (int i = 0; i < g; i++) { //Best Case O(n),Average case O(n),Worst case O(n^2) Space complexity O(n)
			List<Integer> w = new ArrayList<Integer>();
			int chemId = keyboard.nextInt();
			w.add(chemId - 1);
			while (chemId != 0) {
				chemId = keyboard.nextInt();
				if (chemId != 0) {
					w.add(chemId - 1);
				}
			}
			incomaptibleGroup.add(w);
			chemGraph.addEdge(w);
		}
		chemGraph.roomAssignment(assignRoom, r, p); 

		p = chemGraph.calculateLabel(assignRoom, incomaptibleGroup, r); //Best Case O(n^3), Worst case O(n^3)

		System.out.println();
		System.out.println("The number of required labels and the different room allocations are: ");
		System.out.println(p);
		for (int i = 0; i < r; i++) { //Best Case O(n^2), Worst case O(n^2)
			System.out.println("Room " + (i+1));
			for (int j = 1; j <= n; j++) {
					if (assignRoom.get(j) == i) { //Complexity of HashMap.get O(1)
						System.out.print(j + " ");
					}
			}
			System.out.println("0");
		}
		keyboard.close();
		//Total of worst case time complexity of the program is: O(n^3)
		//Total of average case time complexity of the program is: O(n^3)
		//Total of best case timne complexity of the program is: O(n^3)

	}
}

class Graph {
	private int V; 
	private HashSet<Integer>[] adj; 

	@SuppressWarnings({ "unchecked", "rawtypes" })
	Graph(int v) { //Space complexity O(n)
		V = v;
		adj = new HashSet[v];
		for (int i = 0; i < v; ++i) //Best Case O(n),Average case O(n),Worst case O(n)
			adj[i] = new HashSet();
	}

	void addEdge(List<Integer> w) { //Best Case O(n),Average case O(n),Worst case O(n),Space complexity O(1)
		int first = w.get(0);
		for(int i =1; i < w.size(); i++) {
			if(!adj[first].contains(w.get(i))) { //Complexity of Collection HashSet.contains O(1)
				adj[first].add(w.get(i)); //Complexity of Collection HashSet.add O(1)
			}
			if(!adj[w.get(i)].contains(first)) {
				adj[w.get(i)].add(first);
			}
			first = i;
		}
	}

	int findLargestDegree(boolean[] available) { //Best Case O(n), Average case O(n),Worst case O(n),Spaace complexity O(1)
		int max = 0;
		int maxIndex = 0;
		for (int i = 0; i < V; i++) { //Best Case O(n), Worst case O(n)
			if ((adj[i].size() > max) && available[i]) { //Complexity of Collection HashSet.size O(1)
				maxIndex = i;
				max = adj[i].size();
			}
		}
		return maxIndex;
	}

	void roomAssignment(HashMap<Integer, Integer> assignRoom, int r, int p) { //Best Case O(n^2), Worst case O(n^3) Space complexity O(n^2)
		int[] color = new int[V];
		Arrays.fill(color, -1); //Complexity of Arrays.fill O(n)
		boolean[] available = new boolean[V];
		Arrays.fill(available, true);
		for (int i = 0; i < r; i++) {  //Best Case O(n), Average case O(n^3), Worst case O(n^3), Space complexity O(n^2)
			colourAssignment(adj, findLargestDegree(available), color, i, available, V); //Best Case O(n), Worst case O(n^2) 
			if(!isAllAssigned(available) && i == r-1 ){
				i = -1;
			}else if(isAllAssigned(available)) {
				break;
			}
		}
		for (int i = 0; i < V; i++) { //Best Case O(n), Average case O(n), Worst case O(n),Space complexity O(1)
			if (!available[i]) {
				assignRoom.put(i + 1, color[i]); //Complexity of HashMap.put O(1)
			}
		}
	}

	boolean isAllAssigned(boolean[] available) { //Best Case O(n), Average case O(n),Worst case O(n), Space complexity O(1)
		for(int i = 0; i < V; i++) {
			if(available[i]) {
				return false;
			}
		}
		return true;
	}

	static void colourAssignment(HashSet<Integer>[] adj, int s, int[] color, int colorNum, 
			boolean[] available, int size) {//Best Case O(n), Average case O(n^2),Worst case O(n^2), Space complexity O(1)
		HashSet<Integer> room = new HashSet<>();
		boolean test = true;
		for (int i = 0; i < size; i++) {
			if(room.size() == 0) {
				test = false;
			}
			if (!adj[s].contains(i)) { //Complexity of HashSet.contains O(1)
				for(int j : room){
					if(!adj[j].contains(i)){ 
						test = false;
					}else{
						test = true;
						break;
					}
				}
				if (available[i] && !test) {
					available[i] = false;
					color[i] = colorNum;
					room.add(i);
					test = true;
				}

			}
		}

	}

	int calculateLabel(HashMap<Integer, Integer> assignRoom,List<List<Integer>> incomaptibleGroup, int roomNum) { //Best Case O(n^3),Average case O(n^3), Worst case O(n^3), Space complexity O(1)
		int total = 0;
		for(int i  = 0; i < roomNum; i++){
			for(List<Integer> w : incomaptibleGroup) {
				int num = 0;
				for(int j : w){
					if(assignRoom.get(j+1) == i && assignRoom.containsKey(j+1)){ //Complexity of HashMap.containsKey O(1)
						num++;
					}
				}
				if(num == w.size()){
					total += w.size();
				}
			}
		}
		return total;
	}

}
