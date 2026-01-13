const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

// 블록 크기 20배 확대 (원래 12x20 그리드 -> 240x400 픽셀)
context.scale(20, 20);

// 테트리스 조각(테트로미노) 정의
function createPiece(type) {
    if (type === 'I') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'L') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'J') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'O') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'Z') {
        return [
            [5, 5, 0],
            [0, 5, 5],
            [0, 0, 0],
        ];
    } else if (type === 'S') {
        return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

// 게임 보드 생성 (w:너비, h:높이)
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// 충돌 감지 함수
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// 화면 그리기
function draw() {
    // 배경 검은색으로 지우기
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // 이미 쌓인 블록 그리기
    drawMatrix(arena, {x: 0, y: 0});
    // 현재 조종 중인 블록 그리기
    drawMatrix(player.matrix, player.pos);
}

// 매트릭스(블록 데이터)를 캔버스에 그리는 함수
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

// 블록이 바닥에 닿았을 때 보드에 합치기
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// 행렬 회전 (테트리스 블록 회전)
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// 플레이어가 블록을 떨어뜨릴 때
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

// 플레이어 이동
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

// 블록 리셋 (새 블록 생성)
function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

    // 새 블록을 만들었는데 바로 충돌하면 게임 오버
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

// 플레이어 회전 (벽 뚫기 방지 포함)
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

// 줄 삭제 (완성된 줄 확인)
function arenaSweep() {
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        player.score += 10;
    }
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

// 게임 루프 타이머 변수
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// 게임 루프 함수
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

// 색상 팔레트
const colors = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // O
    '#0DFF72', // L
    '#F538FF', // J
    '#FF8E0D', // I
    '#FFE138', // S
    '#3877FF', // Z
];

// 게임 상태 객체
const arena = createMatrix(12, 20);
const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
};

// 키보드 입력 처리
document.addEventListener('keydown', event => {
    if (event.keyCode === 37) { // 왼쪽 화살표
        playerMove(-1);
    } else if (event.keyCode === 39) { // 오른쪽 화살표
        playerMove(1);
    } else if (event.keyCode === 40) { // 아래 화살표
        playerDrop();
    } else if (event.keyCode === 38) { // 위 화살표 (회전)
        playerRotate(1);
    }
});

// 게임 시작
playerReset();
updateScore();
update();