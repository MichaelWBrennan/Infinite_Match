extends Resource
class_name LevelGenerator

const Match3Board := preload("res://scripts/match3/Board.gd")

static func generate(board_size: Vector2i, num_colors: int, seed: int = -1) -> Match3Board:
    var board := Match3Board.new(board_size, num_colors, seed)
    # Ensure at least one valid move is available; reshuffle if necessary
    var guard := 0
    while not board.has_valid_move() and guard < 50:
        board.shuffle_random()
        guard += 1
    return board
