class ReverseOthello {
    constructor() {
        this.BOARD_SIZE = 8;
        this.EMPTY = 0;
        this.BLACK = 1;
        this.WHITE = 2;
        
        // 8方向の移動ベクトル (上、右上、右、右下、下、左下、左、左上)
        this.DIRECTIONS = [
            [-1, 0], [-1, 1], [0, 1], [1, 1],
            [1, 0], [1, -1], [0, -1], [-1, -1]
        ];
        
        this.board = [];
        this.currentPlayer = this.BLACK;
        this.gameEnded = false;
        this.consecutivePasses = 0;
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.initializeBoard();
        this.createBoardElements();
        this.attachEventListeners();
        this.updateDisplay();
    }
    
    // ボードの初期化
    initializeBoard() {
        this.board = Array(this.BOARD_SIZE).fill(null).map(() => 
            Array(this.BOARD_SIZE).fill(this.EMPTY)
        );
        
        // 初期配置: 中央4マスに駒を配置
        const center = Math.floor(this.BOARD_SIZE / 2);
        this.board[center - 1][center - 1] = this.WHITE;
        this.board[center - 1][center] = this.BLACK;
        this.board[center][center - 1] = this.BLACK;
        this.board[center][center] = this.WHITE;
        
        this.currentPlayer = this.BLACK;
        this.gameEnded = false;
        this.consecutivePasses = 0;
    }
    
    // DOM要素の作成
    createBoardElements() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                
                boardElement.appendChild(cell);
            }
        }
    }
    
    // イベントリスナーの設定
    attachEventListeners() {
        document.getElementById('reset-button').addEventListener('click', () => this.resetGame());
        document.getElementById('pass-button').addEventListener('click', () => this.passMove());
    }
    
    // セルクリックの処理
    handleCellClick(row, col) {
        if (this.gameEnded) return;
        
        if (this.isValidMove(row, col)) {
            this.makeMove(row, col);
            this.switchPlayer();
            this.updateDisplay();
            this.checkGameEnd();
        }
    }
    
    // 指定座標が盤面内かチェック
    isInBounds(row, col) {
        return row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE;
    }
    
    // 隣接チェック: 既存の駒に隣接しているかを確認
    isAdjacentToExistingPiece(row, col) {
        for (const [dr, dc] of this.DIRECTIONS) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (this.isInBounds(newRow, newCol) && this.board[newRow][newCol] !== this.EMPTY) {
                return true;
            }
        }
        return false;
    }
    
    // ひっくり返し判定: 指定方向に相手の駒をひっくり返せるかチェック
    canFlipInDirection(row, col, dr, dc, player) {
        const opponent = player === this.BLACK ? this.WHITE : this.BLACK;
        let r = row + dr;
        let c = col + dc;
        let hasOpponentPieces = false;
        
        // 隣接セルが相手の駒でない場合、この方向ではひっくり返せない
        if (!this.isInBounds(r, c) || this.board[r][c] !== opponent) {
            return false;
        }
        
        // 相手の駒が続く限り進む
        while (this.isInBounds(r, c) && this.board[r][c] === opponent) {
            hasOpponentPieces = true;
            r += dr;
            c += dc;
        }
        
        // 自分の駒で終わり、かつ間に相手の駒がある場合のみひっくり返せる
        return hasOpponentPieces && 
               this.isInBounds(r, c) && 
               this.board[r][c] === player;
    }
    
    // 全方向でひっくり返しが発生するかチェック
    wouldFlipPieces(row, col, player) {
        for (const [dr, dc] of this.DIRECTIONS) {
            if (this.canFlipInDirection(row, col, dr, dc, player)) {
                return true;
            }
        }
        return false;
    }
    
    // 有効な手かどうかの判定
    isValidMove(row, col) {
        // 既に駒が置かれている場合は無効
        if (this.board[row][col] !== this.EMPTY) {
            return false;
        }
        
        // 隣接する駒がない場合は無効
        if (!this.isAdjacentToExistingPiece(row, col)) {
            return false;
        }
        
        // ひっくり返しが発生する場合は無効（逆オセロルール）
        if (this.wouldFlipPieces(row, col, this.currentPlayer)) {
            return false;
        }
        
        return true;
    }
    
    // 全ての有効な手を取得
    getValidMoves(player) {
        const validMoves = [];
        
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === this.EMPTY && 
                    this.isAdjacentToExistingPiece(row, col) && 
                    !this.wouldFlipPieces(row, col, player)) {
                    validMoves.push([row, col]);
                }
            }
        }
        
        return validMoves;
    }
    
    // 駒を配置
    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.consecutivePasses = 0; // 有効な手があったのでパス回数をリセット
    }
    
    // プレイヤーの切り替え
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === this.BLACK ? this.WHITE : this.BLACK;
    }
    
    // パス処理
    passMove() {
        if (this.gameEnded) return;
        
        this.consecutivePasses++;
        this.switchPlayer();
        this.updateDisplay();
        this.checkGameEnd();
    }
    
    // 駒数のカウント
    countPieces() {
        let blackCount = 0;
        let whiteCount = 0;
        
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                if (this.board[row][col] === this.BLACK) {
                    blackCount++;
                } else if (this.board[row][col] === this.WHITE) {
                    whiteCount++;
                }
            }
        }
        
        return { black: blackCount, white: whiteCount };
    }
    
    // ゲーム終了チェック
    checkGameEnd() {
        const validMoves = this.getValidMoves(this.currentPlayer);
        const hasValidMoves = validMoves.length > 0;
        
        if (!hasValidMoves) {
            // 現在のプレイヤーに有効な手がない場合、パス
            this.consecutivePasses++;
            
            if (this.consecutivePasses >= 2) {
                // 両プレイヤーが連続でパスした場合、ゲーム終了
                this.endGame();
                return;
            }
            
            // 相手プレイヤーに切り替え
            this.switchPlayer();
            const opponentValidMoves = this.getValidMoves(this.currentPlayer);
            
            if (opponentValidMoves.length === 0) {
                // 相手プレイヤーにも有効な手がない場合、ゲーム終了
                this.endGame();
                return;
            }
        }
        
        // パスボタンの有効/無効を切り替え
        const passButton = document.getElementById('pass-button');
        passButton.disabled = hasValidMoves;
        
        this.updateDisplay();
    }
    
    // ゲーム終了処理
    endGame() {
        this.gameEnded = true;
        const counts = this.countPieces();
        let message = '';
        
        if (counts.black > counts.white) {
            message = '黒の勝利！';
        } else if (counts.white > counts.black) {
            message = '白の勝利！';
        } else {
            message = '引き分け！';
        }
        
        document.getElementById('game-status').textContent = message;
        document.getElementById('current-turn').textContent = 'ゲーム終了';
        
        // パスボタンを無効化
        document.getElementById('pass-button').disabled = true;
    }
    
    // 画面表示の更新
    updateDisplay() {
        this.updateBoard();
        this.updateScores();
        this.updateTurnIndicator();
        this.highlightValidMoves();
    }
    
    // ボード表示の更新
    updateBoard() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach((cell, index) => {
            const row = Math.floor(index / this.BOARD_SIZE);
            const col = index % this.BOARD_SIZE;
            const cellValue = this.board[row][col];
            
            // 既存の駒を削除
            const existingPiece = cell.querySelector('.piece');
            if (existingPiece) {
                existingPiece.remove();
            }
            
            // 駒がある場合は表示
            if (cellValue !== this.EMPTY) {
                const piece = document.createElement('div');
                piece.className = `piece ${cellValue === this.BLACK ? 'black' : 'white'}`;
                cell.appendChild(piece);
            }
        });
    }
    
    // スコア表示の更新
    updateScores() {
        const counts = this.countPieces();
        document.getElementById('black-score').textContent = counts.black;
        document.getElementById('white-score').textContent = counts.white;
    }
    
    // ターン表示の更新
    updateTurnIndicator() {
        if (this.gameEnded) return;
        
        const turnText = this.currentPlayer === this.BLACK ? '黒のターン' : '白のターン';
        document.getElementById('current-turn').textContent = turnText;
        
        // プレイヤー情報のハイライト
        const blackPlayer = document.querySelector('.black-player');
        const whitePlayer = document.querySelector('.white-player');
        
        if (this.currentPlayer === this.BLACK) {
            blackPlayer.style.backgroundColor = '#e8f5e8';
            whitePlayer.style.backgroundColor = 'transparent';
        } else {
            whitePlayer.style.backgroundColor = '#e8f5e8';
            blackPlayer.style.backgroundColor = 'transparent';
        }
    }
    
    // 有効な手のハイライト
    highlightValidMoves() {
        const cells = document.querySelectorAll('.cell');
        const validMoves = this.getValidMoves(this.currentPlayer);
        
        // 全てのハイライトを削除
        cells.forEach(cell => {
            cell.classList.remove('valid-move');
        });
        
        // 有効な手をハイライト
        if (!this.gameEnded) {
            validMoves.forEach(([row, col]) => {
                const index = row * this.BOARD_SIZE + col;
                cells[index].classList.add('valid-move');
            });
        }
    }
    
    // ゲームリセット
    resetGame() {
        this.initializeBoard();
        this.updateDisplay();
        document.getElementById('game-status').textContent = '';
        document.getElementById('pass-button').disabled = false;
        
        // プレイヤー情報のハイライトをリセット
        document.querySelector('.black-player').style.backgroundColor = '#e8f5e8';
        document.querySelector('.white-player').style.backgroundColor = 'transparent';
    }
}

// 画面遷移管理
class ScreenManager {
    constructor() {
        this.game = null;
        this.attachStartScreenListeners();
    }
    
    attachStartScreenListeners() {
        // スタート画面のボタンイベント
        document.getElementById('ai-mode-button').addEventListener('click', () => {
            console.log('AI対戦モードが選択されました（未実装）');
        });
        
        document.getElementById('two-player-mode-button').addEventListener('click', () => {
            this.startTwoPlayerGame();
        });
    }
    
    startTwoPlayerGame() {
        // スタート画面を非表示、ゲーム画面を表示
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'flex';
        
        // ゲームを初期化
        if (this.game) {
            this.game.resetGame();
        } else {
            this.game = new ReverseOthello();
        }
        
        // スタート画面に戻るボタンのイベント
        document.getElementById('back-to-start').addEventListener('click', () => {
            this.backToStart();
        });
    }
    
    backToStart() {
        // ゲーム画面を非表示、スタート画面を表示
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    new ScreenManager();
});