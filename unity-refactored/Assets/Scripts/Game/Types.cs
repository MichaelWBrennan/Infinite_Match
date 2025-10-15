using UnityEngine;

namespace Evergreen.Match3
{
    public enum PieceKind { Normal, RocketH, RocketV, Bomb, ColorBomb, Ingredient }

    public struct Piece
    {
        public PieceKind Kind;
        public int Color; // 0..numColors-1; -1 for neutral
    }
}
