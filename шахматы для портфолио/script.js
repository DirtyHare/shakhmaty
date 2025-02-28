const board = document.getElementById('chessboard');
const helperText = document.getElementById('helper-text');
const diceResult = document.getElementById('dice-result');
const diceButton = document.getElementById('dice-button');
const numbersLeft = document.getElementById('numbers-left');
const numbersRight = document.getElementById('numbers-right');
const lettersTop = document.getElementById('letters-top');
const lettersBottom = document.getElementById('letters-bottom');
let chessBoard = [];
let selectedPiece = null;
let isPlayerTurn = true;
let playerColor = null;
let isGameOver = false;
let isAIMoving = false;

const pieces = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

const initialBoard = [
    'rnbqkbnr',
    'pppppppp',
    '........',
    '........',
    '........',
    '........',
    'PPPPPPPP',
    'RNBQKBNR'
];

// Инициализация доски
function initBoard() {
    chessBoard = initialBoard.map(row => row.split(''));
    board.innerHTML = '';
    for (let i = 0; i < 64; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        const row = Math.floor(i / 8);
        const col = i % 8;
        if ((row + col) % 2 === 0) cell.classList.add('white');
        else cell.classList.add('black');
        const piece = chessBoard[row][col];
        cell.innerHTML = piece !== '.' ? pieces[piece] : '';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.addEventListener('click', handleClick);
        board.appendChild(cell);
    }
    addBoardLabels();
    if (playerColor === 'black') {
        board.classList.add('flipped');
        isPlayerTurn = false;
        isAIMoving = true;
        aiMove();
        updateHelper("ИИ сходил. Твой черёд за чёрных!");
    } else if (playerColor === 'white') {
        board.classList.remove('flipped');
        isPlayerTurn = true;
        updateHelper("Твой ход! Ты играешь за белых.");
    } else {
        board.classList.remove('flipped');
        diceButton.classList.remove('hidden');
        updateHelper("Брось кубик, чтобы выбрать сторону!");
    }
}

// Добавление цифр и букв
function addBoardLabels() {
    numbersLeft.innerHTML = '';
    numbersRight.innerHTML = '';
    lettersTop.innerHTML = '';
    lettersBottom.innerHTML = '';
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const order = playerColor === 'black' ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
    const letterOrder = playerColor === 'black' ? letters.slice().reverse() : letters;

    order.forEach(num => {
        const numLeft = document.createElement('div');
        numLeft.textContent = num;
        numbersLeft.appendChild(numLeft);
        const numRight = document.createElement('div');
        numRight.textContent = num;
        numbersRight.appendChild(numRight);
    });
    letterOrder.forEach(letter => {
        const letterTop = document.createElement('div');
        letterTop.textContent = letter;
        lettersTop.appendChild(letterTop);
        const letterBottom = document.createElement('div');
        letterBottom.textContent = letter;
        lettersBottom.appendChild(letterBottom);
    });
}

// Бросок кубика с анимацией
function rollDice() {
    if (playerColor !== null) {
        updateHelper("Сторона уже выбрана! Нажми 'Новая игра', чтобы начать заново.");
        return;
    }

    diceResult.classList.remove('hidden');
    diceResult.innerHTML = `Ты: <span class="dice-roll">?</span> ИИ: <span class="dice-roll">?</span>`;
    let rolls = 0;
    const interval = setInterval(() => {
        const playerTemp = Math.floor(Math.random() * 6) + 1;
        const aiTemp = Math.floor(Math.random() * 6) + 1;
        diceResult.innerHTML = `Ты: <span class="dice-roll">${playerTemp}</span> ИИ: <span class="dice-roll">${aiTemp}</span>`;
        rolls++;
        if (rolls >= 10) {
            clearInterval(interval);
            const playerRoll = Math.floor(Math.random() * 6) + 1;
            const aiRoll = Math.floor(Math.random() * 6) + 1;
            diceResult.innerHTML = `Ты выбросила: ${playerRoll}. ИИ выбросил: ${aiRoll}.`;
            setTimeout(() => {
                diceResult.classList.add('hidden');
                diceButton.classList.add('hidden');
                if (playerRoll > aiRoll) {
                    playerColor = 'white';
                    updateHelper("Твой ход! Ты играешь за белых.");
                    board.classList.remove('flipped');
                    isPlayerTurn = true;
                } else {
                    playerColor = 'black';
                    updateHelper("ИИ ходит первым. Ты играешь за чёрных!");
                    board.classList.add('flipped');
                    isPlayerTurn = false;
                    isAIMoving = true;
                    aiMove();
                }
                addBoardLabels();
            }, 1000);
        }
    }, 100);
}

// Обработка клика
function handleClick(e) {
    if (playerColor === null) {
        updateHelper("Сначала брось кубик, чтобы выбрать сторону!");
        return;
    }
    if (!isPlayerTurn || isAIMoving) {
        updateHelper("Сейчас ход ИИ. Подожди своей очереди!");
        return;
    }

    let row = parseInt(e.target.dataset.row);
    let col = parseInt(e.target.dataset.col);
    if (playerColor === 'black') {
        row = 7 - row;
        col = 7 - col;
    }
    const piece = chessBoard[row][col];

    if (selectedPiece) {
        let toRow = row;
        let toCol = col;
        if (playerColor === 'black') {
            toRow = 7 - toRow;
            toCol = 7 - toCol;
        }
        if (isValidMove(selectedPiece, { row: toRow, col: toCol })) {
            movePiece(selectedPiece, { row: toRow, col: toCol });
            clearHighlights();
            selectedPiece = null;
            isPlayerTurn = false;
            isAIMoving = true;
            checkWinCondition();
            if (!isGameOver) {
                updateHelper("Отличный ход! Теперь ход ИИ.");
                aiMove();
            }
        } else {
            clearHighlights();
            selectedPiece = null;
            updateHelper("Этот ход невозможен. Попробуй другой!");
        }
    } else if (piece !== '.' && ((playerColor === 'white' && piece === piece.toUpperCase()) || (playerColor === 'black' && piece === piece.toLowerCase()))) {
        selectedPiece = { row, col };
        highlightSelected(row, col);
        highlightPossibleMoves(row, col);
        updateHelper(getPieceHelp(piece, row, col));
    }
}

// Проверка допустимых ходов
function isValidMove(from, to) {
    const piece = chessBoard[from.row][from.col];
    const target = chessBoard[to.row][to.col];
    const dx = to.col - from.col;
    const dy = to.row - from.row;
    const isWhitePiece = piece === piece.toUpperCase();

    if (target !== '.' && (isWhitePiece === (target === target.toUpperCase()))) return false;

    if (piece === 'P') {
        if (from.col === to.col && target === '.') {
            if (from.row === 6 && dy === -2 && chessBoard[5][to.col] === '.') return true;
            if (dy === -1) return true;
        } else if (Math.abs(dx) === 1 && dy === -1 && target !== '.' && target.toLowerCase() === target) return true;
    } else if (piece === 'p') {
        if (from.col === to.col && target === '.') {
            if (from.row === 1 && dy === 2 && chessBoard[2][to.col] === '.') return true;
            if (dy === 1) return true;
        } else if (Math.abs(dx) === 1 && dy === 1 && target !== '.' && target.toUpperCase() === target) return true;
    } else if (piece === 'R' || piece === 'r') {
        if (dx === 0 || dy === 0) return isPathClear(from, to);
    } else if (piece === 'N' || piece === 'n') {
        if ((Math.abs(dx) === 2 && Math.abs(dy) === 1) || (Math.abs(dx) === 1 && Math.abs(dy) === 2)) return true;
    } else if (piece === 'B' || piece === 'b') {
        if (Math.abs(dx) === Math.abs(dy)) return isPathClear(from, to);
    } else if (piece === 'Q' || piece === 'q') {
        if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) return isPathClear(from, to);
    } else if (piece === 'K' || piece === 'k') {
        if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) return true;
    }

    return false;
}

// Проверка свободного пути
function isPathClear(from, to) {
    const dx = Math.sign(to.col - from.col);
    const dy = Math.sign(to.row - from.row);
    let x = from.col + dx;
    let y = from.row + dy;

    while (x !== to.col || y !== to.row) {
        if (chessBoard[y][x] !== '.') return false;
        x += dx;
        y += dy;
    }
    return true;
}

// Перемещение фигуры
function movePiece(from, to) {
    chessBoard[to.row][to.col] = chessBoard[from.row][from.col];
    chessBoard[from.row][from.col] = '.';
    updateBoard();
}

// Проверка условия победы
function checkWinCondition() {
    const whiteKing = chessBoard.flat().includes('K');
    const blackKing = chessBoard.flat().includes('k');
    if (!whiteKing) {
        updateHelper(playerColor === 'white' ? "ИИ победил! Ты проиграла." : "Победа! Ты захватила белого короля!");
        isGameOver = true;
    } else if (!blackKing) {
        updateHelper(playerColor === 'black' ? "ИИ победил! Ты проиграла." : "Победа! Ты захватила чёрного короля!");
        isGameOver = true;
    }
}

// Ход ИИ
function aiMove() {
    if (isGameOver || playerColor === null) {
        isAIMoving = false;
        isPlayerTurn = true;
        return;
    }

    let piecesToMove = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = chessBoard[row][col];
            if (piece !== '.' && ((playerColor === 'white' && piece === piece.toLowerCase()) || (playerColor === 'black' && piece === piece.toUpperCase()))) {
                piecesToMove.push({ row, col });
            }
        }
    }

    if (piecesToMove.length === 0) {
        updateHelper("У ИИ нет ходов! Ты победила!");
        isGameOver = true;
        isAIMoving = false;
        isPlayerTurn = true;
        return;
    }

    const from = piecesToMove[Math.floor(Math.random() * piecesToMove.length)];
    const possibleMoves = getPossibleMoves(from);
    if (possibleMoves.length > 0) {
        const to = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        movePiece(from, to);
        checkWinCondition();
        if (!isGameOver) updateHelper("ИИ сходил. Твой черёд!");
    } else {
        updateHelper("ИИ не может ходить! Пропускает ход.");
    }

    isAIMoving = false;
    isPlayerTurn = true;
}

// Возможные ходы
function getPossibleMoves({ row, col }) {
    const piece = chessBoard[row][col];
    let moves = [];
    const directions = {
        'p': [[1, 0], [2, 0]], 'P': [[-1, 0], [-2, 0]],
        'r': [[1, 0], [-1, 0], [0, 1], [0, -1]], 'R': [[1, 0], [-1, 0], [0, 1], [0, -1]],
        'n': [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]],
        'N': [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]],
        'b': [[1, 1], [1, -1], [-1, 1], [-1, -1]], 'B': [[1, 1], [1, -1], [-1, 1], [-1, -1]],
        'q': [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
        'Q': [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
        'k': [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
        'K': [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
    };

    if (piece === 'p') {
        if (row < 7 && chessBoard[row + 1][col] === '.') moves.push({ row: row + 1, col });
        if (row === 1 && chessBoard[2][col] === '.' && chessBoard[3][col] === '.') moves.push({ row: 3, col });
        if (row < 7 && col > 0 && chessBoard[row + 1][col - 1] !== '.' && chessBoard[row + 1][col - 1].toUpperCase() === chessBoard[row + 1][col - 1]) 
            moves.push({ row: row + 1, col: col - 1 });
        if (row < 7 && col < 7 && chessBoard[row + 1][col + 1] !== '.' && chessBoard[row + 1][col + 1].toUpperCase() === chessBoard[row + 1][col + 1]) 
            moves.push({ row: row + 1, col: col + 1 });
    } else if (piece === 'P') {
        if (row > 0 && chessBoard[row - 1][col] === '.') moves.push({ row: row - 1, col });
        if (row === 6 && chessBoard[5][col] === '.' && chessBoard[4][col] === '.') moves.push({ row: 4, col });
        if (row > 0 && col > 0 && chessBoard[row - 1][col - 1] !== '.' && chessBoard[row - 1][col - 1].toLowerCase() === chessBoard[row - 1][col - 1]) 
            moves.push({ row: row - 1, col: col - 1 });
        if (row > 0 && col < 7 && chessBoard[row - 1][col + 1] !== '.' && chessBoard[row - 1][col + 1].toLowerCase() === chessBoard[row - 1][col + 1]) 
            moves.push({ row: row - 1, col: col + 1 });
    } else {
        const dirs = directions[piece];
        for (let [dy, dx] of dirs) {
            let newRow = row + dy;
            let newCol = col + dx;
            if (piece === 'r' || piece === 'R' || piece === 'b' || piece === 'B' || piece === 'q' || piece === 'Q') {
                let steps = 1;
                while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const target = chessBoard[newRow][newCol];
                    const isOwnPiece = (piece === piece.toUpperCase() && target === target.toUpperCase()) || (piece === piece.toLowerCase() && target === target.toLowerCase());
                    if (target === '.') moves.push({ row: newRow, col: newCol });
                    else if (!isOwnPiece) {
                        moves.push({ row: newRow, col: newCol });
                        break;
                    } else break;
                    newRow = row + dy * ++steps;
                    newCol = col + dx * steps;
                }
            } else if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const target = chessBoard[newRow][newCol];
                const isOwnPiece = (piece === piece.toUpperCase() && target === target.toUpperCase()) || (piece === piece.toLowerCase() && target === target.toLowerCase());
                if (target === '.' || (!isOwnPiece && target !== '.')) moves.push({ row: newRow, col: newCol });
            }
        }
    }
    return moves;
}

// Обновление доски
function updateBoard() {
    for (let i = 0; i < 64; i++) {
        const row = Math.floor(i / 8);
        const col = i % 8;
        const cell = board.children[i];
        const piece = chessBoard[row][col];
        cell.innerHTML = piece !== '.' ? pieces[piece] : '';
    }
}

// Выделение клеток
function highlightSelected(row, col) {
    clearHighlights();
    const index = playerColor === 'black' ? (7 - row) * 8 + (7 - col) : row * 8 + col;
    board.children[index].classList.add('selected');
}

function highlightPossibleMoves(row, col) {
    const piece = chessBoard[row][col];
    if (piece === 'P') {
        if (row === 6 && chessBoard[5][col] === '.' && chessBoard[4][col] === '.') board.children[(playerColor === 'black' ? 3 : 4) * 8 + col].classList.add('possible');
        if (row > 0 && chessBoard[row - 1][col] === '.') board.children[(playerColor === 'black' ? (7 - (row - 1)) : (row - 1)) * 8 + (playerColor === 'black' ? (7 - col) : col)].classList.add('possible');
        if (row > 0 && col > 0 && chessBoard[row - 1][col - 1] !== '.' && chessBoard[row - 1][col - 1].toLowerCase() === chessBoard[row - 1][col - 1]) 
            board.children[(playerColor === 'black' ? (7 - (row - 1)) : (row - 1)) * 8 + (playerColor === 'black' ? (7 - (col - 1)) : (col - 1))].classList.add('possible');
        if (row > 0 && col < 7 && chessBoard[row - 1][col + 1] !== '.' && chessBoard[row - 1][col + 1].toLowerCase() === chessBoard[row - 1][col + 1]) 
            board.children[(playerColor === 'black' ? (7 - (row - 1)) : (row - 1)) * 8 + (playerColor === 'black' ? (7 - (col + 1)) : (col + 1))].classList.add('possible');
    } else if (piece === 'p') {
        if (row === 1 && chessBoard[2][col] === '.' && chessBoard[3][col] === '.') board.children[(playerColor === 'black' ? 4 : 3) * 8 + col].classList.add('possible');
        if (row < 7 && chessBoard[row + 1][col] === '.') board.children[(playerColor === 'black' ? (7 - (row + 1)) : (row + 1)) * 8 + (playerColor === 'black' ? (7 - col) : col)].classList.add('possible');
        if (row < 7 && col > 0 && chessBoard[row + 1][col - 1] !== '.' && chessBoard[row + 1][col - 1].toUpperCase() === chessBoard[row + 1][col - 1]) 
            board.children[(playerColor === 'black' ? (7 - (row + 1)) : (row + 1)) * 8 + (playerColor === 'black' ? (7 - (col - 1)) : (col - 1))].classList.add('possible');
        if (row < 7 && col < 7 && chessBoard[row + 1][col + 1] !== '.' && chessBoard[row + 1][col + 1].toUpperCase() === chessBoard[row + 1][col + 1]) 
            board.children[(playerColor === 'black' ? (7 - (row + 1)) : (row + 1)) * 8 + (playerColor === 'black' ? (7 - (col + 1)) : (col + 1))].classList.add('possible');
    } else if (piece === 'R' || piece === 'r') {
        for (let i = 1; i < 8; i++) {
            if (row - i >= 0 && checkAndHighlight(row - i, col, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (row + i < 8 && checkAndHighlight(row + i, col, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (col - i >= 0 && checkAndHighlight(row, col - i, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (col + i < 8 && checkAndHighlight(row, col + i, piece)) break;
        }
    } else if (piece === 'N' || piece === 'n') {
        const knightMoves = [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2]];
        knightMoves.forEach(([dy, dx]) => {
            const newRow = row + dy;
            const newCol = col + dx;
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) checkAndHighlight(newRow, newCol, piece);
        });
    } else if (piece === 'B' || piece === 'b') {
        for (let i = 1; i < 8; i++) {
            if (row - i >= 0 && col - i >= 0 && checkAndHighlight(row - i, col - i, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (row - i >= 0 && col + i < 8 && checkAndHighlight(row - i, col + i, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (row + i < 8 && col - i >= 0 && checkAndHighlight(row + i, col - i, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (row + i < 8 && col + i < 8 && checkAndHighlight(row + i, col + i, piece)) break;
        }
    } else if (piece === 'Q' || piece === 'q') {
        for (let i = 1; i < 8; i++) {
            if (row - i >= 0 && checkAndHighlight(row - i, col, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (row + i < 8 && checkAndHighlight(row + i, col, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (col - i >= 0 && checkAndHighlight(row, col - i, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (col + i < 8 && checkAndHighlight(row, col + i, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (row - i >= 0 && col - i >= 0 && checkAndHighlight(row - i, col - i, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (row - i >= 0 && col + i < 8 && checkAndHighlight(row - i, col + i, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (row + i < 8 && col - i >= 0 && checkAndHighlight(row + i, col - i, piece)) break;
        }
        for (let i = 1; i < 8; i++) {
            if (row + i < 8 && col + i < 8 && checkAndHighlight(row + i, col + i, piece)) break;
        }
    } else if (piece === 'K' || piece === 'k') {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dy === 0 && dx === 0) continue;
                const newRow = row + dy;
                const newCol = col + dx;
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) checkAndHighlight(newRow, newCol, piece);
            }
        }
    }
}

function checkAndHighlight(row, col, piece) {
    const target = chessBoard[row][col];
    const isOwnPiece = (piece === piece.toUpperCase() && target === target.toUpperCase()) || (piece === piece.toLowerCase() && target === target.toLowerCase());
    const index = playerColor === 'black' ? (7 - row) * 8 + (7 - col) : row * 8 + col;
    if (target === '.') {
        board.children[index].classList.add('possible');
        return false;
    } else if (!isOwnPiece && target !== '.') {
        board.children[index].classList.add('possible');
        return true;
    }
    return true;
}

function clearHighlights() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('selected', 'possible');
    });
}

// Обновление текста помощника
function updateHelper(message) {
    helperText.textContent = message;
    console.log(message); // Отладка
}

// Таймер бездействия
function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (isPlayerTurn && !isGameOver && playerColor !== null && !isAIMoving) {
        inactivityTimer = setTimeout(suggestMove, 15000);
    }
}

function suggestMove() {
    if (!isPlayerTurn || isGameOver || playerColor === null || isAIMoving) return;
    const piecesToMove = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = chessBoard[row][col];
            if (piece !== '.' && ((playerColor === 'white' && piece === piece.toUpperCase()) || (playerColor === 'black' && piece === piece.toLowerCase()))) {
                piecesToMove.push({ row, col });
            }
        }
    }
    const from = piecesToMove[Math.floor(Math.random() * piecesToMove.length)];
    const piece = chessBoard[from.row][from.col];
    const moves = getPossibleMoves(from);
    if (moves.length > 0) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const pieceName = piece === 'P' || piece === 'p' ? 'Пешка' :
                         piece === 'R' || piece === 'r' ? 'Ладья' :
                         piece === 'N' || piece === 'n' ? 'Конь' :
                         piece === 'B' || piece === 'b' ? 'Слон' :
                         piece === 'Q' || piece === 'q' ? 'Ферзь' : 'Король';
        updateHelper(`Попробуй ход: ${pieceName} на ${letters[playerColor === 'black' ? 7 - move.col : move.col]}${playerColor === 'black' ? (8 - move.row) : (8 - move.row)}!`);
    }
}

// Сброс игры
function resetGame() {
    initBoard();
    selectedPiece = null;
    clearHighlights();
    isPlayerTurn = true;
    isGameOver = false;
    playerColor = null;
    isAIMoving = false;
    diceResult.classList.remove('hidden');
    diceButton.classList.remove('hidden');
    updateHelper("Брось кубик, чтобы выбрать сторону!");
}

// Старт игры
initBoard();