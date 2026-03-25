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
        this1秒无敌
        updateHUD();
        if (lives <= 0) endGame();
        else {
            // 缩小一点点，作为惩罚
            this.level = Math.max(1, this.level - 1);
        }
    }

    takeFatalDamage() {
        lives = 0;
        updateHUD();
        endGame();
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);

        // 无敌闪烁
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // 画鱼身
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, this.mouthOpen * Math.PI, (2 - this.mouthOpen) * Math.PI);
        ctx.lineTo(0, 0);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();

        // 眼睛
        ctx.beginPath();
        ctx.arc(this.radius * 0.5, -this.radius * 0.4, this.radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.radius * 0.55, -this.radius * 0.4, this.radius * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class NPCFish {
    constructor() {
        this.reset();
    }

    reset() {
        // 等级在玩家等级 +/- 3 之间浮动
        this.level = Math.max(1, Math.floor(player.level + (Math.random() * 8 - 4)));
        this.radius = PLAYER_BASE_RADIUS + (this.level - 1) * LEVEL_GROW_FACTOR;
        this.color = COLORS[this.level % COLORS.length];
        this.speed = 1 + Math.random() * 2;
        
        // 从两侧进入
        if (Math.random() > 0.5) {
            this.x = -this.radius - 20;
            this.direction = 0;
        } else {
            this.x = canvas.width + this.radius + 20;
            this.direction = Math.PI;
        }
        this.y = Math.random() * (canvas.height - 40) + 20;
    }

    update() {
        this.x += Math.cos(this.direction) * this.speed;
        // 稍微有点上下波动
        this.y += Math.sin(Date.now() / 500) * 0.5;

        // 出界重置
        if (this.x < -100 || this.x > canvas.width + 100) this.reset();
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.direction === Math.PI) ctx.scale(1, -1); // 掉头时镜像
        ctx.rotate(this.direction);

        // 简易鱼形
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.2, this.radius, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.stroke();

        // 尾巴
        ctx.beginPath();
        ctx.moveTo(-this.radius * 1, 0);
        ctx.lineTo(-this.radius * 1.8, -this.radius * 0.8);
        ctx.lineTo(-this.radius * 1.8, this.radius * 0.8);
        ctx.fill();

        ctx.restore();
    }
}

let player = new Fish();
let npcs = [];

functi