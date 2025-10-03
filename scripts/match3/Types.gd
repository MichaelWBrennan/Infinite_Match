extends Resource
class_name Match3Types

# Types for match-3 pieces and helpers

enum PieceKind { NORMAL, ROCKET_H, ROCKET_V, BOMB, COLOR_BOMB, INGREDIENT }

static func make_normal(color: int) -> Dictionary:
	return {
		"kind": PieceKind.NORMAL,
		"color": color
	}

static func make_rocket_h(color: int) -> Dictionary:
	return {
		"kind": PieceKind.ROCKET_H,
		"color": color
	}

static func make_rocket_v(color: int) -> Dictionary:
	return {
		"kind": PieceKind.ROCKET_V,
		"color": color
	}

static func make_bomb(color: int) -> Dictionary:
	return {
		"kind": PieceKind.BOMB,
		"color": color
	}

static func make_color_bomb() -> Dictionary:
	return {
		"kind": PieceKind.COLOR_BOMB,
		"color": null
	}

static func make_ingredient() -> Dictionary:
    return {
        "kind": PieceKind.INGREDIENT,
        "color": null
    }

static func is_normal(piece: Dictionary) -> bool:
	return piece.get("kind") == PieceKind.NORMAL

static func is_color_bomb(piece: Dictionary) -> bool:
	return piece.get("kind") == PieceKind.COLOR_BOMB

static func is_rocket(piece: Dictionary) -> bool:
	var k = piece.get("kind")
	return k == PieceKind.ROCKET_H or k == PieceKind.ROCKET_V

static func is_bomb(piece: Dictionary) -> bool:
	return piece.get("kind") == PieceKind.BOMB

static func is_ingredient(piece: Dictionary) -> bool:
    return piece.get("kind") == PieceKind.INGREDIENT

static func copy_piece(piece: Dictionary) -> Dictionary:
	return { "kind": piece.get("kind"), "color": piece.get("color") }
