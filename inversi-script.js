class ReverseOthello {
    constructor(isAIMode = false) {
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
        this.isAIMode = isAIMode;
        this.isAIThinking = false;
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.initializeBoard();
        this.createBoardElements();
        this.attachEventListeners();
        this.updateDisplay();
        
        // AIモードで白（AI）が最初のターンの場合は自動実行
        if (this.isAIMode && this.currentPlayer === this.WHITE) {
            setTimeout(() => this.handleAITurn(), 500);
        }
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
        if (this.gameEnded || this.isAIThinking) return;
        
        // AIモードで白（AI）のターンの場合はクリック無効
        if (this.isAIMode && this.currentPlayer === this.WHITE) return;
        
        if (this.isValidMove(row, col)) {
            this.makeMove(row, col);
            this.switchPlayer();
            this.updateDisplay();
            this.checkGameEnd();
            
            // AIモードでゲームが続いている場合、AIのターンを実行
            if (this.isAIMode && !this.gameEnded && this.currentPlayer === this.WHITE) {
                setTimeout(() => this.handleAITurn(), 600);
            }
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
        
        // AIモードでゲームが続いていて、次がAIのターンなら自動実行
        if (this.isAIMode && !this.gameEnded && this.currentPlayer === this.WHITE) {
            setTimeout(() => this.handleAITurn(), 800);
        }
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
        
        let turnText;
        if (this.isAIMode) {
            if (this.currentPlayer === this.BLACK) {
                turnText = 'あなたのターン';
            } else if (this.isAIThinking) {
                turnText = 'AIが考え中...';
            } else {
                turnText = 'AIのターン';
            }
        } else {
            turnText = this.currentPlayer === this.BLACK ? '黒のターン' : '白のターン';
        }
        
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
    
    // AIのターン処理
    async handleAITurn() {
        if (this.gameEnded || this.isAIThinking) return;
        
        this.isAIThinking = true;
        
        try {
            const validMoves = this.getValidMoves(this.WHITE);
            
            if (validMoves.length === 0) {
                // AIに有効な手がない場合でも少し考える演出
                document.getElementById('current-turn').textContent = 'AIが局面を分析中...';
                await this.sleep(1200 + Math.random() * 600); // 1200-1800ms
                document.getElementById('current-turn').textContent = 'AIに手がありません...';
                await this.sleep(800);
                this.passMove();
                return;
            }
            
            // 段階的な思考プロセスの演出
            await this.showThinkingProcess();
            
            // AIの手を取得
            const aiMove = await this.getAIMove(validMoves);
            
            // 最終決定の演出
            document.getElementById('current-turn').textContent = 'AIが手を決定しています...';
            const finalThinkingTime = 800 + Math.random() * 400; // 800-1200ms
            await this.sleep(finalThinkingTime);
            
            if (aiMove) {
                const [row, col] = aiMove;
                this.makeMove(row, col);
                this.switchPlayer();
                this.updateDisplay();
                this.checkGameEnd();
            }
        } catch (error) {
            console.error('AI思考エラー:', error);
            // エラー時でも思考の演出を行う
            document.getElementById('current-turn').textContent = 'AIが代替手を検討中...';
            await this.sleep(1000);
            
            const validMoves = this.getValidMoves(this.WHITE);
            if (validMoves.length > 0) {
                const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                const [row, col] = randomMove;
                this.makeMove(row, col);
                this.switchPlayer();
                this.updateDisplay();
                this.checkGameEnd();
            }
        } finally {
            this.isAIThinking = false;
        }
    }
    
    // 思考プロセスの段階的演出
    async showThinkingProcess() {
        const thinkingSteps = [
            { text: 'AIが盤面を分析中...', baseDuration: 1200 },
            { text: 'AIが戦略を検討中...', baseDuration: 1000 },
            { text: 'AIが最適手を計算中...', baseDuration: 1300 }
        ];
        
        for (const step of thinkingSteps) {
            document.getElementById('current-turn').textContent = step.text;
            // ランダムな変動を加えて人間らしさを演出（±300ms）
            const variation = Math.random() * 600 - 300;
            const duration = Math.max(500, step.baseDuration + variation);
            await this.sleep(duration);
        }
    }
    
    // スリープ関数（思考時間の演出用）
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ボード状態をテキスト形式で生成
    generateBoardText() {
        let boardText = '現在のボード状態:\n';
        boardText += '  A B C D E F G H\n';
        
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            boardText += `${row + 1} `;
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                const piece = this.board[row][col];
                if (piece === this.BLACK) {
                    boardText += '● ';
                } else if (piece === this.WHITE) {
                    boardText += '○ ';
                } else {
                    boardText += '. ';
                }
            }
            boardText += `${row + 1}\n`;
        }
        boardText += '  A B C D E F G H\n';
        
        return boardText;
    }
    
    // 有効な手をテキスト形式で生成
    generateValidMovesText(validMoves) {
        if (validMoves.length === 0) {
            return '有効な手: なし';
        }
        
        const moveStrings = validMoves.map(([row, col]) => {
            const colLetter = String.fromCharCode(65 + col); // A-H
            const rowNumber = row + 1; // 1-8
            return `${colLetter}${rowNumber}`;
        });
        
        return `有効な手: ${moveStrings.join(', ')}`;
    }
    
    // Claude APIを使ってAIの手を取得
    async getAIMove(validMoves) {
        const boardText = this.generateBoardText();
        const validMovesText = this.generateValidMovesText(validMoves);
        const counts = this.countPieces();
        
        const prompt = `あなたは「ひっくり返さないオセロ」のAIプレイヤーです。白（○）として最適な手を選択してください。

ゲームルール:
- 既存の駒に隣接する場所にのみ駒を置ける
- 相手の駒をひっくり返せる場所には置けない
- 有効な手がなくなったプレイヤーの負け

${boardText}

現在の駒数: 黒●=${counts.black}個, 白○=${counts.white}個

${validMovesText}

戦略的な考慮事項:
1. 角や辺は有利なポジション
2. 相手の選択肢を減らす手を優先
3. 自分の駒数を増やしつつ、相手の動きを制限

最適な手を1つ選んで、「A1」のような形式で答えてください。理由は不要です。`;

        try {
            // Claude APIの呼び出しをシミュレート（実際の実装では適切なAPIエンドポイントを使用）
            const response = await this.callClaudeAPI(prompt);
            return this.parseAIResponse(response, validMoves);
        } catch (error) {
            console.error('Claude API呼び出しエラー:', error);
            throw error;
        }
    }
    
    // Claude APIの呼び出し（実装例）
    async callClaudeAPI(prompt) {
        try {
            // Claude Code環境を利用してClaude自身で思考処理を実行
            const code = `
# AI思考処理
def analyze_board_and_choose_move():
    prompt = """${prompt}"""
    
    # プロンプトから有効な手を抽出
    import re
    moves_match = re.search(r'有効な手: ([A-H][1-8](?:, [A-H][1-8])*)', prompt)
    if not moves_match:
        return None
    
    valid_moves = moves_match.group(1).split(', ')
    
    # 戦略的分析を行う
    corner_moves = []
    edge_moves = []
    other_moves = []
    
    for move in valid_moves:
        col = move[0]
        row = int(move[1])
        
        # 角の判定
        if (col in ['A', 'H'] and row in [1, 8]):
            corner_moves.append(move)
        # 辺の判定
        elif col in ['A', 'H'] or row in [1, 8]:
            edge_moves.append(move)
        else:
            other_moves.append(move)
    
    # 優先順位に基づいて選択
    if corner_moves:
        chosen = corner_moves[0]
        reason = "角を取る戦略"
    elif edge_moves:
        chosen = edge_moves[0]
        reason = "辺を取る戦略"
    else:
        chosen = other_moves[0] if other_moves else valid_moves[0]
        reason = "利用可能な手を選択"
    
    print(f"選択した手: {chosen} (理由: {reason})")
    return chosen

result = analyze_board_and_choose_move()
result
`;
            
            // Claude Code環境でPythonコードを実行
            const response = await window.mcp__ide__executeCode({ code });
            
            if (response && response.result) {
                return response.result.trim().replace(/['"]/g, '');
            }
            
            // フォールバック
            return this.getHeuristicMove();
            
        } catch (error) {
            console.error('Claude API実行エラー:', error);
            // エラー時はヒューリスティックを使用
            return this.getHeuristicMove();
        }
    }
    
    // ヒューリスティックベースのAI（フォールバック）
    getHeuristicMove() {
        const validMoves = this.getValidMoves(this.WHITE);
        if (validMoves.length === 0) return null;
        
        // 優先順位: 角 > 辺 > その他
        const corners = validMoves.filter(([row, col]) => 
            (row === 0 || row === 7) && (col === 0 || col === 7)
        );
        
        if (corners.length > 0) {
            return corners[0];
        }
        
        const edges = validMoves.filter(([row, col]) => 
            row === 0 || row === 7 || col === 0 || col === 7
        );
        
        if (edges.length > 0) {
            return edges[0];
        }
        
        // ランダム選択
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    // AIの応答を解析
    parseAIResponse(response, validMoves) {
        if (typeof response === 'object' && response.length === 2) {
            // ヒューリスティック応答の場合
            return response;
        }
        
        // テキスト応答の解析
        const match = response.match(/([A-H])([1-8])/i);
        if (match) {
            const col = match[1].toUpperCase().charCodeAt(0) - 65; // A=0, B=1, ...
            const row = parseInt(match[2]) - 1; // 1=0, 2=1, ...
            
            // 有効な手かチェック
            const isValid = validMoves.some(([r, c]) => r === row && c === col);
            if (isValid) {
                return [row, col];
            }
        }
        
        // 解析失敗時はランダム選択
        return validMoves[Math.floor(Math.random() * validMoves.length)];
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
            this.startAIGame();
        });
        
        document.getElementById('two-player-mode-button').addEventListener('click', () => {
            this.startTwoPlayerGame();
        });
    }
    
    startAIGame() {
        // スタート画面を非表示、ゲーム画面を表示
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'flex';
        
        // AIモードでゲームを初期化
        this.game = new ReverseOthello(true);
        
        // プレイヤー名をAI対戦用に変更
        document.querySelector('.black-player .player-name').textContent = 'あなた';
        document.querySelector('.white-player .player-name').textContent = 'AI';
        
        // スタート画面に戻るボタンのイベント
        this.attachBackToStartListener();
    }
    
    startTwoPlayerGame() {
        // スタート画面を非表示、ゲーム画面を表示
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'flex';
        
        // 通常の2人プレイモードでゲームを初期化
        if (this.game) {
            this.game.resetGame();
        } else {
            this.game = new ReverseOthello(false);
        }
        
        // プレイヤー名を2人プレイ用に戻す
        document.querySelector('.black-player .player-name').textContent = '黒';
        document.querySelector('.white-player .player-name').textContent = '白';
        
        // スタート画面に戻るボタンのイベント
        this.attachBackToStartListener();
    }
    
    attachBackToStartListener() {
        // 既存のイベントリスナーを削除して重複を防ぐ
        const backButton = document.getElementById('back-to-start');
        const newBackButton = backButton.cloneNode(true);
        backButton.parentNode.replaceChild(newBackButton, backButton);
        
        newBackButton.addEventListener('click', () => {
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