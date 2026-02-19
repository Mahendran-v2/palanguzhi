import time

def display_board(board, scores):
    """Visualizes the board as two rows of 7 pits."""
    p2_side = board[13:6:-1]  # Pits 13 down to 7 (Top row)
    p1_side = board[0:7]      # Pits 0 to 6 (Bottom row)
    
    print("\n" + "="*30)
    print(f"P2 Score: {scores[1]} | P1 Score: {scores[0]}")
    print("-" * 30)
    print("P2 pits: ", p2_side)
    print("P1 pits: ", p1_side)
    print("="*30 + "\n")

def play_turn(board, player_idx):
    """
    Handles the sowing logic: 
    - Relay: Picking up seeds if landing in a non-empty pit.
    - Capture: Taking seeds if the next pit is empty.
    """
    # Define the range of pits for the current player
    valid_pits = range(0, 7) if player_idx == 0 else range(7, 14)
    
    while True:
        try:
            choice = int(input(f"Player {player_idx + 1}, choose a pit ({list(valid_pits)}): "))
            if choice in valid_pits and board[choice] > 0:
                break
            print("Invalid choice. Pick a pit with seeds on your side.")
        except ValueError:
            print("Please enter a number.")

    hand = board[choice]
    board[choice] = 0
    current_idx = choice

    print(f"Player {player_idx + 1} starts sowing...")

    while True:
        # Sowing seeds one by one
        while hand > 0:
            current_idx = (current_idx + 1) % 14
            board[current_idx] += 1
            hand -= 1
            # Optional: time.sleep(0.2) for a "game" feel
        
        # After sowing last seed, check the NEXT pit
        next_idx = (current_idx + 1) % 14
        
        if board[next_idx] > 0:
            # RELAY: Pick up seeds from next pit and continue
            hand = board[next_idx]
            board[next_idx] = 0
            current_idx = next_idx
            print(f"Hit a full pit at {current_idx}. Picking up {hand} seeds to continue...")
        else:
            # CHECK FOR CAPTURE: Next pit is empty, check the one after that
            capture_idx = (next_idx + 1) % 14
            captured = board[capture_idx]
            board[capture_idx] = 0
            
            if captured > 0:
                print(f"BOOM! Captured {captured} seeds from pit {capture_idx}!")
                return captured
            else:
                print("Landed in an empty pit. Turn ends.")
                return 0

def main():
    # Initial setup: 14 pits with 5 seeds each
    board = [5] * 14
    scores = [0, 0]
    current_player = 0 # 0 for Player 1, 1 for Player 2

    print("Welcome to Python Pallanguzhi!")
    
    while sum(board) > 0:
        display_board(board, scores)
        
        # Check if the current player has any seeds to move
        player_pits = board[0:7] if current_player == 0 else board[7:14]
        if sum(player_pits) == 0:
            print(f"Player {current_player + 1} has no moves! Game Over.")
            break
            
        points = play_turn(board, current_player)
        scores[current_player] += points
        
        # Switch players
        current_player = 1 - current_player

    print("\n--- FINAL SCORES ---")
    print(f"Player 1: {scores[0]}")
    print(f"Player 2: {scores[1]}")
    winner = "Player 1" if scores[0] > scores[1] else "Player 2"
    print(f"Winner: {winner}!")

if __name__ == "__main__":
    main()