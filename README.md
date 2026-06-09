# Tic Tac Toe - Next.js Neon Game

A premium neon-style **Tic Tac Toe** game built with **Next.js**, **React**, **TypeScript**, and modern CSS.

## Developer

**Muhammad Ali Nawaz**

## Latest Fixes

- Fixed AI move logic for Easy, Medium, and Hard modes.
- Hard AI uses minimax and cannot make invalid moves.
- Fixed wrong win/loss/draw handling.
- Fixed winning intersection line using an SVG overlay, so rows, columns, and diagonals stay aligned.
- X uses one exact red color everywhere: board, turn, player header, score, winning line, and result.
- O uses one exact blue color everywhere: board, turn, player header, score, winning line, and result.
- Added clean neon effect without over-glowing the whole UI.
- Removed Forfeit button.
- Preserved Start → Single Player AI / 2 Players Human → Level → Match flow.

## Features

- Start Game screen
- Single Player - AI mode
- 2 Players - Human mode
- AI levels: Easy, Medium, Hard
- Best-of-3 match system
- Deciding third round when score becomes 1 - 1
- Replay same round on draw, without showing a draw trophy/result screen
- Final winner screen only when the full match winner is decided
- Final winner screen has no trophy UI for a cleaner layout
- Round completion button text shortened to "Next" to prevent layout breaking
- Responsive 100vh no-scroll game layout
- Main, Mode, and New buttons available during gameplay

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS 4
- Custom CSS

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Build

```bash
npm run build
npm start
```

## License

This project is licensed under the MIT License.
