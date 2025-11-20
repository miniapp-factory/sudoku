"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SIZE = 9;
const EMPTY = 0;

function isValid(board: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < SIZE; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function solve(board: number[][], row = 0, col = 0): boolean {
  if (row === SIZE) return true;
  if (col === SIZE) return solve(board, row + 1, 0);
  if (board[row][col] !== EMPTY) return solve(board, row, col + 1);

  const nums = [...Array(SIZE).keys()].map(n => n + 1);
  for (const n of nums) {
    if (isValid(board, row, col, n)) {
      board[row][col] = n;
      if (solve(board, row, col + 1)) return true;
      board[row][col] = EMPTY;
    }
  }
  return false;
}

function countSolutions(board: number[][], limit = 2): number {
  let count = 0;
  function dfs(b: number[][], r = 0, c = 0): boolean {
    if (r === SIZE) {
      count++;
      return count >= limit;
    }
    if (c === SIZE) return dfs(b, r + 1, 0);
    if (b[r][c] !== EMPTY) return dfs(b, r, c + 1);

    const nums = [...Array(SIZE).keys()].map(n => n + 1);
    for (const n of nums) {
      if (isValid(b, r, c, n)) {
        b[r][c] = n;
        if (dfs(b, r, c + 1)) return true;
        b[r][c] = EMPTY;
      }
    }
    return false;
  }
  dfs(board);
  return count;
}

function generatePuzzle(difficulty: "easy" | "medium" | "hard" = "easy"): number[][] {
  const board: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  solve(board);
  const cellsToRemove = {
    easy: 36,
    medium: 47,
    hard: 54,
  }[difficulty];
  const positions: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) positions.push([r, c]);
  shuffle(positions);
  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= cellsToRemove) break;
    const backup = board[r][c];
    board[r][c] = EMPTY;
    const copy = board.map(row => [...row]);
    if (countSolutions(copy) !== 1) {
      board[r][c] = backup;
    } else {
      removed++;
    }
  }
  return board;
}

function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function Sudoku() {
  const [puzzle, setPuzzle] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [original, setOriginal] = useState<number[][]>([]);
  const [errorCells, setErrorCells] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const newPuzzle = generatePuzzle("medium");
    const sol = newPuzzle.map(row => [...row]);
    setPuzzle(newPuzzle);
    setSolution(sol);
    setOriginal(newPuzzle.map(row => [...row]));
  }, []);

  const handleChange = (row: number, col: number, value: string) => {
    if (original[row][col] !== EMPTY) return; // fixed clue
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 9) return;
    const newPuzzle = puzzle.map(r => [...r]);
    newPuzzle[row][col] = num;
    setPuzzle(newPuzzle);
    setErrorCells(prev => {
      const newSet = new Set(prev);
      newSet.delete(`${row}-${col}`);
      return newSet;
    });
  };

  const checkSolution = () => {
    const newErrors = new Set<string>();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (puzzle[r][c] !== solution[r][c]) {
          newErrors.add(`${r}-${c}`);
        }
      }
    }
    if (newErrors.size > 0) {
      setErrorCells(newErrors);
      setMessage("Try again!");
    } else {
      setErrorCells(new Set());
      setMessage("You are genius!");
    }
  };

  const getCellClass = (row: number, col: number, value: number) => {
    const base = cn(
      "w-10 h-10 text-center border-0 appearance-none",
      row % 3 === 0 && "border-t-4",
      col % 3 === 0 && "border-l-4",
      row === SIZE - 1 && "border-b-4",
      col === SIZE - 1 && "border-r-4",
      value !== EMPTY && "font-bold",
      original[row][col] !== EMPTY && "bg-gray-200",
      original[row][col] === EMPTY && "bg-white",
      errorCells.has(`${row}-${col}`) && "text-red-600"
    );
    return base;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-9 gap-0">
        {puzzle.map((row, r) =>
          row.map((cell, c) => (
            <Input
              key={`${r}-${c}`}
              type="number"
              min={1}
              max={9}
              value={cell === EMPTY ? "" : cell}
              onChange={e => handleChange(r, c, e.target.value)}
              className={getCellClass(r, c, cell)}
            />
          ))
        )}
      </div>
      <Button onClick={checkSolution}>Check</Button>
      {message && <p className="mt-2">{message}</p>}
    </div>
  );
}
