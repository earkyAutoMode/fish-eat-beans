const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreBoard = document.getElementById('score-board');
const livesBoard = document.getElementById('lives-board');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScore = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

canvas.width = 800;
canvas.height = 600;

// 游戏状态
let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let lives = 3;
let animationId;

// 玩家（小鱼）
class Fish {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = 20;
        this.color = '#778da9';
        this.speed = 3; // 基础前进速度
        this.direction = 0; // 弧度
        this.mouthOpen = 0.2;
        this.mouthSpeed = 0.05;
        this.targetX = this.x;
        this.targetY = this.y;
        this.isMouseControl = false;
    }

    update() {
        // 如果是鼠标控制，根据鼠标位置更新方向
        if (this.isMouseControl) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                this.direction = Math.atan2(dy, dx);
            }
        }

        // 无论是否有输入，小鱼始终沿当前方向前进
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        // 嘴部动画
        this.mouthOpen += this.mouthSpeed;
        if (this.mouthOpen > 0.4 || this.mouthOpen < 0.1) {
            this.mouthSpeed *= -1;
        }

        // 边界检测
        this.checkBoundaries();
    }

    checkBoundaries() {
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width ||
            this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            
            // 撞到边界，扣除生命并复位
            this.takeDamage();
        }
    }

    takeDamage() {
        lives--;
        updateHUD();
        this.resetPosition();
        if (lives <= 0) {
            endGame();
        }
    }

    resetPosition() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.targetX = this.x;
        this.targetY = this.y;
        // 复位时不改变方向，让它继续按最后的方向（或默认方向）走
        this.isMouseControl = false; 
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);

        // 画鱼身
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, this.mouthOpen * Math.PI, (2 - this.mouthOpen) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // 画眼睛
        ctx.beginPath();
        ctx.arc(this.radius/2, -this.radius/2, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();

        ctx.restore();
    }
}

// 豆豆
class Bean {
    constructor() {
        this.radius = 8;
        this.reset();
    }

    reset() {
        this.x = Math.random() * (canvas.width - this.radius * 4) + this.radius * 2;
        this.y = Math.random() * (canvas.height - this.radius * 4) + this.radius * 2;
        this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.closePath();
        ctx.shadowBlur = 0;
    }
}

// 障碍物（炸弹）
class Obstacle {
    constructor() {
        this.radius = 15;
        this.reset();
    }

    reset() {
        this.x = Math.random() * (canvas.width - this.radius * 4) + this.radius * 2;
        this.y = Math.random() * (canvas.height - this.radius * 4) + this.radius * 2;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4d6d';
        ctx.fill();
        ctx.strokeStyle = '#c9184a';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.closePath();
    }
}

let player = new Fish();
let beans = [new Bean(), new Bean(), new Bean(), new Bean(), new Bean()];
let obstacles = [new Obstacle(), new Obstacle()];

// 控制器
window.addEventListener('mousemove', (e) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvas.getBoundingClientRect();
    player.targetX = e.clientX - rect.left;
    player.targetY = e.clientY - rect.top;
    player.isMouseControl = true;
});

window.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;
    player.isMouseControl = false;
    switch(e.key) {
        case 'ArrowUp': player.direction = -Math.PI / 2; break;
        case 'ArrowDown': player.direction = Math.PI / 2; break;
        case 'ArrowLeft': player.direction = Math.PI; break;
        case 'ArrowRight': player.direction = 0; break;
    }
});

function updateHUD() {
    scoreBoard.innerText = `得分: ${score}`;
    livesBoard.innerText = `生命: ${lives}`;
}

function startGame() {
    gameState = 'PLAYING';
    score = 0;
    lives = 3;
    player = new Fish(); // 重新创建玩家以重置所有属性
    beans.forEach(b => b.reset());
    obstacles.forEach(o => o.reset());
    updateHUD();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameLoop();
}

function endGame() {
    gameState = 'GAMEOVER';
    cancelAnimationFrame(animationId);
    finalScree.innerText = score;
    gameOverScreen.classList.remove('hidden');
}

function checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < obj1.radius + obj2.radius;
}

function gameLoop() {
    if (gameState !== 'PLAYING') return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制背景（每一帧都要画，否则清除后是透明的）
    ctx.fillStyle = '#1b263b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 更新和绘制玩家
    player.update();
    player.draw();

    // 处理豆豆
    beans.forEach(bean => {
        bean.draw();
        if (checkCollision(player, bean)) {
            score += 10;
            updateHUD();
            bean.reset();
        }
    });

    // 处理障碍物
    obstacles.forEach(obstacle => {
        obstacle.draw();
        if (checkCollision(player, obstacle)) {
            player.takeDamage();
            obstacle.reset();
        }
    });

    animationId = requestAnimationFrame(gameLoop);
}

startBtn.onclick = startGame;
restartBtn.onclick = startGame;

// 初始绘制背景
ctx.fillStyle = '#1b263b';
ctx.fillRect(0, 0, canvas.width, canvas.height);
