const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// 静的ファイルの提供
app.use(express.static(__dirname));

// ルートにアクセスした時にinversi.htmlを返す
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'inversi.html'));
});

// ヘルスチェック
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`Inversi game server running on port ${port}`);
});