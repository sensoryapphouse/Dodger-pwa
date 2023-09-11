"use strict";

var globalSpeed = 1;
var speedChange = 0;
var lives = 3;
var that;
var color = 'rgba(0, 255, 0, .8)';
var sleeping = false;
var splash;
var tmr;
var panel;
var settings;
var mute;
var sldspeed;
var speedChanged = false;
var thiss;
var globalpoints = 0;

var firsttime = true;

var audio;
var audio1;
var panelvisible = false;

function InitAudio() {
    audio = new Audio('sounds/change.mp3');
    audio.volume = .0;
    audio.play();
    audio1 = new Audio('sounds/crash.mp3');
    audio1.volume = .0;
    audio1.play();
    setTimeout(function () {
        audio.pause();
        audio1.pause();
        audio.volume = 1.0;
        audio1.volume = 1.0;
    }, 50);
    firsttime = false;
}

function PlaySound(s) {
    if (mute.checked || firsttime)
        return;
    try {
        if (s == 'change.mp3') {
            audio.pause();
            audio.play();
        } else
            audio1.play();
        console.log('Sound: ' + s);
    } catch (e) {};
}

function slideTo(el, left) {
    var steps = 10;
    var timer = 25;
    var elLeft = parseInt(el.style.left) || 0;
    var diff = left - elLeft;
    var stepSize = diff / steps;

    function step() {
        elLeft += stepSize;
        el.style.left = elLeft + "vw";
        if (--steps) {
            setTimeout(step, timer);
        }
    }
    step();
}

function saveSettings() {
    localStorage.setItem("Dodger.mute", mute.checked);
    localStorage.setItem("Dodger.speed", sldspeed.value);
}

function settingsClicked() {
    if (panelvisible) { // save stored values
        slideTo(panel, 130);
        slideTo(settings, 92);
        saveSettings();
    } else {
        slideTo(panel, 80);
        slideTo(settings, 82);
    }
    panelvisible = !panelvisible;
}


window.onload = () => {
    'use strict';

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js');
    }
    splash = document.querySelector('splash');
    panel = document.querySelector('panel');
    splash.onclick = function (e) {
        if (document.body.requestFullscreen) {
            document.body.requestFullscreen();
        } else if (document.body.msRequestFullscreen) {
            document.body.msRequestFullscreen();
        } else if (document.body.mozRequestFullScreen) {
            document.body.mozRequestFullScreen();
        } else if (document.body.webkitRequestFullscreen) {
            document.body.webkitRequestFullscreen();
        }
        clearTimeout(tmr);

        splash.hidden = true;
    }
    tmr = window.setTimeout(function () {
        if (document.body.requestFullscreen) {
            document.body.requestFullscreen();
        } else if (document.body.msRequestFullscreen) {
            document.body.msRequestFullscreen();
        } else if (document.body.mozRequestFullScreen) {
            document.body.mozRequestFullScreen();
        } else if (document.body.webkitRequestFullscreen) {
            document.body.webkitRequestFullscreen();
        }

        splash.hidden = true;
    }, 3000); // hide Splash screen after 3 seconds
    settings = document.querySelector('settings');
    panel.style.left = "130vw";
    slideTo(panel, 130);
    settings.style.left = "92vw";

    settings.onmousedown = function (e) { // speed, platform size, player size
        e.preventDefault();
        settingsClicked();
    }

    settings.addEventListener("touchstart", e => {
        e.preventDefault();
        settingsClicked();
    }, false);

    mute = document.createElement("INPUT");
    mute.style.position = "absolute";
    mute.style.height = "3vh";
    mute.style.width = "3vw";
    mute.style.left = "12.5vw";
    mute.style.top = "3.9vh";
    mute.checked = false;
    mute.setAttribute("type", "checkbox");
    mute.checked = false;

    sldspeed = document.createElement("INPUT");
    sldspeed.setAttribute("type", "range");
    sldspeed.style.position = "absolute";
    sldspeed.style.height = "2vh";
    sldspeed.style.width = "12vw";
    sldspeed.style.left = "3.8vw";
    sldspeed.style.top = "12.5vh";
    sldspeed.style.color = 'green';
    sldspeed.value = 3;
    sldspeed.min = 1;
    sldspeed.max = 5;
    panel.appendChild(mute);
    panel.appendChild(sldspeed);

    var s = localStorage.getItem("Dodger.mute");
    mute.checked = (s == "true");
    var s1 = parseInt(localStorage.getItem("Dodger.speed"));
    if (s1 < 1 || s1 > 5)
        s1 = 3;
    sldspeed.value = s1;
    setSpeed();
    sldspeed.onchange = function (e) { // speed, platform size, player size
        e.preventDefault();
        thiss.points = 0;
        globalpoints = 0;
        setSpeed();
    }
}

function setSpeed() {
    var speed = parseInt(sldspeed.value);
    localStorage.setItem("Dodger.speed", sldspeed.value);
    switch (speed) {
        case 1:
            globalSpeed = 3;
            speedChange = 0;
            break;
        case 2:
            globalSpeed = 2;
            speedChange = 0;
            break
        case 3:
            globalSpeed = 1.5;
            speedChange = 0;
            break;
        case 4:
            globalSpeed = 1;
            speedChange = 3;
            break;
        case 5:
            globalSpeed = 1;
            speedChange = 5;
            break;
    }
    speedChanged = true;
    //    var globalSpeed = 1;
    //    var speedChange = 0;
}

window.requestAnimFrame = (function (callback) {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();


function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawLine(ctx, points) {
    for (var p = 0; p < points.length; p++) {
        ctx.lineTo(points[p][0], points[p][1]);
    }
}

function colorStop(gradient, stops) {
    for (var s = 0; s < stops.length; s++) {
        gradient.addColorStop(stops[s][0], stops[s][1]);
    }
}

// background
function Bg(game) {
    this.game = game;
    this.canvas = game.canvas;
    this.ctx = game.ctx;
    this.x = 0;
    this.y = 0;
    this.maxSize = 0;
    this.gridGapWidth = 3;
    this.gridGap = parseInt(this.maxSize / this.gridGapWidth);

    this.setupCircles = function () {
        this.circles = [];
        for (var c = 0; c < this.gridGap + 1; c++) {
            if ((this.gridGapWidth * (c * c)) * 2 < this.maxSize + 100) {
                this.circles.push(this.gridGapWidth * c * c);
            }
        }
    };

    this.setupStars = function () {
        this.stars = [];

        for (var s = 0; s < this.maxSize / 10; s++) {
            this.stars.push({
                x: random(0, this.game.width),
                y: random(0, this.game.height),
                r: random(1, 3),
                o: random(1, 10) / 10
            });
        }
    };

    this.update = function (dt) {
        if (sleeping)
            return;
        this.gridGap = parseInt(this.maxSize / this.gridGapWidth);

        if (this.stars.length === 0) {
            this.setupStars();
        }

        if (this.circles.length === 0) {
            this.setupCircles();
        }
    };

    this.drawGradient = function () {
        this.gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        colorStop(this.gradient, [
      [0, '#441541'],
      [.48, '#441541'],
      [.499, '#f742a3'],
      [.5, '#fa71b9'],
      [.501, '#f742a3'],
      [.52, '#271126'],
      [1, '#271126']
    ]);

        this.ctx.save();
        this.ctx.fillStyle = this.gradient;
        this.ctx.fillRect(this.x, this.y, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    };

    this.drawStars = function () {
        this.ctx.save();
        for (var s in this.stars) {
            this.ctx.beginPath();
            this.ctx.arc(this.stars[s].x, this.stars[s].y, this.stars[s].r / 2, 0, 2 * Math.PI);
            this.ctx.fillStyle = 'rgba(255, 255, 255, ' + this.stars[s].o + ')';
            this.ctx.fill();
        }
        this.ctx.restore();
    };

    this.drawRadials = function () {

        var radialGradient = this.ctx.createRadialGradient(this.game.halfWidth, this.game.halfHeight, 1, this.game.halfWidth, this.game.halfHeight, this.maxSize / 2);
        colorStop(radialGradient, [
      [0, 'rgba(255, 255, 255, 1)'],
      [.01, 'rgba(255, 255, 255, .7)'],
      [.07, 'rgba(247, 66, 163, .5)'],
      [.2, 'rgba(247, 66, 163, .3)'],
      [.5, 'rgba(247, 66, 163, .1)'],
      [1, 'rgba(247, 66, 163, .0)']
    ]);

        this.ctx.save();
        this.ctx.arc(this.game.halfWidth, this.game.halfHeight, this.maxSize / 2, 0, 2 * Math.PI);
        this.ctx.fillStyle = radialGradient;
        this.ctx.fill();
        this.ctx.restore();
    };

    this.drawGrid = function () {
        var x = this.game.halfWidth,
            y = this.game.halfHeight,
            currentCircle = 0;

        this.ctx.save();
        for (var c in this.circles) {
            this.ctx.beginPath()
            this.ctx.arc(x, y, this.circles[c], 0, 2 * Math.PI);
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = 'rgba(195, 135, 255, ' + currentCircle / this.circles.length + ')';
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.circles[c], 0, 2 * Math.PI);
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = 'rgba(78, 176, 237, ' + (currentCircle / this.circles.length) / 5 + ')';
            this.ctx.stroke();
            currentCircle++;
        }
        this.ctx.restore();

        var lineGradient = this.ctx.createRadialGradient(this.game.halfWidth, this.game.halfHeight, 1, this.game.halfWidth, this.game.halfHeight, this.maxSize);
        colorStop(lineGradient, [
      [0, 'rgba(50, 106, 222, 0)'],
      [.2, 'rgba(195, 135, 255, 1)'],
      [1, '#c387ff']
    ]);

        for (var l = 0; l < 12 + 1; l++) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.translate(this.game.halfWidth, this.game.halfHeight);
            this.ctx.moveTo(0, 0);
            this.ctx.rotate(30 * l * Math.PI / 180);
            this.ctx.lineTo(this.maxSize, 0);
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = lineGradient;
            this.ctx.stroke();
            this.ctx.restore();
        }
    };

    this.draw = function (dt) {
        this.drawGradient();
        this.drawStars();
        this.drawRadials();
        this.drawGrid();
    };

    this.resize = function () {
        this.maxSize = Math.max(this.canvas.width, this.canvas.height);
        this.gridGap = parseInt(this.maxSize / this.gridGapWidth);
        this.setupStars();
        this.setupCircles();
    };

    this.update = this.update.bind(this);
    this.draw = this.draw.bind(this);
    return this;
}

// entities

function Obstacle(game) {
    this.game = game;
    that = this;
    this.c = game.ctx;
    this.x = this.startX = this.game.halfWidth;
    this.y = this.startY = this.game.halfHeight;
    this.moving = true;
    this.scale = 1;
    this.lives = true;
    this.speed = 100 / globalSpeed; // PB 100

    this.update = function (dt) {
        if (sleeping)
            return;
        if (this.moving && this.distance) {
            if (this.scale < 35)
                this.scale += dt * 4;
            this.x += this.directionX * this.speed * dt * 2;
            this.y += this.directionY * this.speed * dt * 2;
            if (Math.sqrt(Math.pow(this.x - this.startX, 2) + Math.pow(this.x - this.startY, 2)) >= this.distance) {
                this.lives = false;
            }
            if (this.lives)
                this.currentDistance = Math.sqrt(Math.pow(this.x - this.game.halfWidth, 2) + Math.pow(this.y - this.game.halfHeight, 2));
        }
    };

    this.resize = function () {
        this.x = this.startX = this.game.halfWidth;
        this.y = this.startY = this.game.halfHeight;
        this.randomize();
    };

    this.randomize = function () {
        this.rotate = random(0, 4);
        var side = random(0, 1000) > 499 ? -1 : 1;

        if (random(0, 999) > 499) {
            this.endX = this.game.canvas.width * side * 2;
            this.endY = random(0, this.game.canvas.height);
        } else {
            this.endX = random(0, this.game.canvas.width);
            this.endY = this.game.canvas.height * side * 2;
        }
        this.distance = Math.sqrt(Math.pow(this.endX - this.startX, 2) + Math.pow(this.endY - this.startY, 2));
        this.directionX = (this.endX - this.startX) / this.distance;
        this.directionY = (this.endY - this.startY) / this.distance;
    };

    this.draw = function (dt) {
        if (this.moving) {
            this.c.save();
            var x = (this.rotate === 0 || this.rotate === 2) ? this.x + 12 : this.x + 6;
            var y = (this.rotate === 0 || this.rotate === 2) ? this.y + 6 : this.y + 12;
            this.c.translate(x, y);
            this.c.scale(this.scale, this.scale);
            //this.c.rotate(this.rotate * 90 * Math.PI / 180);
            this.c.rotate(30 + Math.atan(this.directionY / this.directionX) * 180 / Math.PI);

            this.c.beginPath();
            this.c.moveTo(5, 0);
            drawLine(this.c, [
        [8, 3],
        [8, 12],
        [5, 14],
        [2, 13],
        [0, 11],
        [1, 5],
        [3, 2],
        [5, 0]
      ]);
            this.c.fillStyle = 'rgba(240, 97, 163, .5)';
            this.c.fill();

            this.gradient = this.c.createLinearGradient(10, 0, 0, 10);
            colorStop(this.gradient, [
        [0, '#4e60aa'],
        [.5, '#f061a3'],
        [1, '#f97862']
      ]);


            this.c.beginPath();
            this.c.moveTo(5, 0);
            drawLine(this.c, [
        [8, 3],
        [8, 12],
        [5, 14],
        [2, 13],
        [0, 11],
        [1, 5],
        [3, 2],
        [5, 0],
        [5, 14]
      ]);
            this.c.moveTo(3, 2);
            drawLine(this.c, [
        [5, 4],
        [8, 3]
      ]);
            this.c.moveTo(3, 2);
            drawLine(this.c, [
        [3, 6],
        [5, 14]
      ]);
            this.c.moveTo(1, 5);
            drawLine(this.c, [
        [3, 6],
        [2, 13]
      ]);
            this.c.moveTo(5, 4);
            this.c.lineTo(8, 12);
            this.c.lineWidth = 4 / this.scale;
            this.c.strokeStyle = this.gradient;
            this.c.stroke();
            this.c.restore();
        }
    };

    this.randomize();
}

function Player(game) {
    this.game = game;
    this.c = game.ctx;
    this.x = this.game.halfWidth;
    this.y = this.game.halfHeight;
    this.scale = 1;
    this.rotate = 90;
    this.canvas = document.createElement('canvas');
    this.c = this.canvas.getContext('2d');
    this.isMoving = false;
    this.moveLeft = true;
    this.speed = 50 / globalSpeed; // PB 50

    this.update = function (dt) {
        if (sleeping) {
            this.rotate = 0;
            return;
        }

        if (this.isMoving)
            this.rotate += this.moveLeft ? (dt * this.speed) : -(dt * this.speed);
        if (this.rotate > 360)
            this.rotate = 0;

        if (this.rotate < 0)
            this.rotate = 360;
    };

    this.changeDir = function () {
        this.moveLeft = !this.moveLeft;
        this.speed += speedChange; // PB 5 speed change
    };

    this.draw = function (dt) {
        this.game.ctx.save();
        this.game.ctx.translate(this.game.canvas.width / 2, this.game.canvas.height / 2);
        this.game.ctx.rotate(this.rotate * Math.PI / 180);
        this.game.ctx.translate(-(this.game.canvas.width / 2), -(this.game.canvas.height / 2));
        this.game.ctx.drawImage(this.canvas, this.game.halfWidth - (this.canvas.width / 2), this.game.halfHeight - (this.canvas.height / 2));
        this.game.ctx.restore();
    };

    this.render = function () {
        this.canvas.width = this.canvas.height = Math.min(this.game.canvas.width, this.game.canvas.height);
        this.scale = parseInt(this.canvas.width / 80, 10);
        this.distance = (this.canvas.height - (this.scale * 20)) / 2;

        this.c.save();
        this.c.translate((this.canvas.width / 2) - ((this.scale * 20) / 2), this.canvas.height - (this.scale * 12) - 20);
        this.c.scale(this.scale, this.scale);

        this.c.beginPath();
        this.c.moveTo(5, 3);
        drawLine(this.c, [
      [8, 3],
      [8, 4],
      [4, 4],
      [5, 3]
    ]);
        this.c.moveTo(12, 3);
        drawLine(this.c, [
      [15, 3],
      [16, 4],
      [12, 4],
      [12, 3]
    ]);
        this.c.moveTo(4, 10);
        drawLine(this.c, [
      [16, 10],
      [15, 11],
      [5, 11],
      [4, 10]
    ]);
        this.c.rect(0, 6, 1, 2);
        this.c.rect(5, 6, 10, 2);
        this.c.rect(19, 6, 1, 2);
        this.c.rect(1, 11, 3, 1);
        this.c.rect(16, 11, 3, 1);
        this.c.lineWidth = 2 / this.scale;
        this.c.strokeStyle = '#000';
        this.c.stroke();
        this.c.fillStyle = 'rgba(0, 0, 0, .7)';
        this.c.fill();
        this.c.closePath();

        this.c.beginPath();
        this.c.fillStyle = 'rgba(255, 255, 255, .7)';
        this.c.rect(4, 6, 1, 1);
        this.c.rect(15, 6, 1, 1);
        this.c.fill();
        this.c.closePath();

        this.c.beginPath();
        this.c.fillStyle = 'rgba(255, 0, 0, .5)';
        this.c.moveTo(1, 6);
        drawLine(this.c, [
      [4, 6],
      [4, 7],
      [5, 7],
      [5, 8],
      [1, 8],
      [1, 6]
    ]);
        this.c.moveTo(16, 6);
        drawLine(this.c, [
      [19, 6],
      [19, 8],
      [15, 8],
      [15, 7],
      [16, 7],
      [16, 6]
    ]);
        this.c.fill();
        this.c.closePath();

        this.c.beginPath();
        this.c.fillStyle = color; // PB 'rgba(78, 96, 170, .7)';
        this.c.moveTo(5, 0);
        drawLine(this.c, [
      [15, 0],
      [17, 3],
      [19, 4],
      [20, 5],
      [20, 6],
      [0, 6],
      [0, 5],
      [1, 4],
      [3, 3],
      [5, 0],
      [5, 1],
      [5, 3],
      [4, 4],
      [8, 4],
      [8, 3],
      [12, 3],
      [12, 4],
      [16, 4],
      [15, 3],
      [15, 1],
      [5, 1],
      [5, 0]
    ]);
        this.c.moveTo(0, 8);
        drawLine(this.c, [
      [20, 8],
      [20, 9],
      [19, 11],
      [15, 11],
      [16, 10],
      [4, 10],
      [5, 11],
      [1, 11],
      [0, 9],
      [0, 8]
    ]);
        this.c.fill();
        //        this.c.shadowBlur = 4;
        //        this.c.shadowOffsetY = 3;
        //        this.c.shadowColor = "white";
        this.c.closePath();

        this.c.beginPath();
        this.c.moveTo(5, 0);
        drawLine(this.c, [
      [15, 0],
      [17, 3],
      [19, 4],
      [20, 5],
      [20, 9],
      [19, 11],
      [1, 11],
      [0, 9],
      [0, 5],
      [1, 4],
      [3, 3],
      [5, 0]
    ]);
        this.c.moveTo(0, 5);
        this.c.lineTo(20, 5);
        this.c.moveTo(0, 9);
        this.c.lineTo(20, 9);
        this.c.rect(5, 1, 10, 2);
        this.c.rect(8, 3, 4, 1);
        this.c.rect(1, 6, 4, 2);
        this.c.rect(4, 6, 1, 1);
        this.c.rect(15, 6, 4, 2);
        this.c.rect(15, 6, 1, 1);
        this.c.lineWidth = 6 / 14; // PB 2/14
        this.c.strokeStyle = '#000'; //'#4e60aa';
        this.c.stroke();
        this.c.closePath();
        this.c.restore();

        var temp = new Image();

        temp.src = this.canvas.toDataURL();

        this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);

        temp.onload = function () {
            this.c.save();
            this.c.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.c.rotate(-90 * Math.PI / 180);
            this.c.translate(-(this.canvas.width / 2), -(this.canvas.height / 2));
            this.c.drawImage(temp, 0, 0);
            this.c.restore();
        }.bind(this);
    };

    this.resize = function () {
        this.x = this.game.halfWidth;
        this.y = this.game.halfHeight;
        this.render();
    };
}

// states

function Gameplay(game) {
    this.game = game;
    thiss = this;
    this.bg = new Bg(this.game);
    this.player = new Player(this.game);

    console.log('gamplay');
    this.init = function () {
        try {
            for (var o = 0; o < this.backgroundObstacles.length; o++) {
                delete this.backgroundObstacles[o];
            }
        } catch (e) {};
        try {
            for (var o = 0; o < this.foregroundObstacles.length; o++) {
                delete this.foregroundObstacles[o];
            }
        } catch (e) {};
        this.backgroundObstacles = [];
        this.foregroundObstacles = [];
        this.spacePressed = false;
        this.points = 0;
        this.best = 0;
        this.gameover = false;
        document.getElementById('lives').hidden = false;
        this.player.isMoving = false;
        this.moving = false;
        try {
            clearTimeout(this.timer);
            clearInterval(this.pointsTimer);
        } catch (e) {};
        this.timer = undefined;
        this.pointsTimer = undefined;
        this.player.speed = 50 / globalSpeed; // PB 50
        lives = 3;
        speedChanged = true;
    };

    this.keyUp = function (e) {
        e.preventDefault();
        e.stopPropagation();
        this.spacePressed = false;
    };

    this.keyDown = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (firsttime)
            InitAudio();
        if (!splash.hidden) {
            splash.hidden = true;
            return;
        }
        if (e.altKey && e.code === "KeyR") { // reset high points score
            localStorage.setItem("bestScore", 0);
            this.points = 0;
            globalpoints = 0;
        }
        if (e != null)
            try {
                if (e.clientY < window.innerHeight / 4)
                    return;
            } catch (evt) {};
        if (!this.player.isMoving) {
            this.player.isMoving = true;
            if (!this.timer)
                this.timer = setTimeout(function () {
                    this.addObstacle()
                }.bind(this), 1000 * globalSpeed);
            if (!this.pointsTimer)
                this.pointsTimer = setInterval(function () {
                    this.points++;
                }.bind(this), 100);
        }

        if (!this.spacePressed && this.player.isMoving) {
            if (!this.gameover) {
                PlaySound("change.mp3")
                this.spacePressed = true;
                this.player.changeDir();
            } else {
                this.init();
            }
        }
    };


    var gpad;

    function showPressedButton(index) {
        console.log("Press: ", index);
        if (!splash.hidden) {
            splash.hidden = true;
        } else switch (index) {
            case 0: // A
            case 1: // B
            case 2: // X
            case 3: // Y
            case 4: // LT
            case 5: // RT
            case 6:
            case 7:
            case 8:
            case 9:
            case 11:
            case 12: // dpad
            case 13:
            case 14:
            case 15:
            case 16:
                thiss.keyDown(null);
                break;
            case 10: // XBox
                break;
            default:
        }
    }

    function removePressedButton(index) {
        console.log("Releasd: ", index);
        thiss.keyUp(null);
    }

    gamepads.addEventListener('connect', e => {
        console.log('Gamepad connected:');
        console.log(e.gamepad);
        gpad = e.gamepad;
        e.gamepad.addEventListener('buttonpress', e => showPressedButton(e.index));
        e.gamepad.addEventListener('buttonrelease', e => removePressedButton(e.index));
    });

    gamepads.addEventListener('disconnect', e => {
        console.log('Gamepad disconnected:');
        console.log(e.gamepad);
    });

    gamepads.start();


    this.update = function (dt) {
        //       this.player.speed = 50 / globalSpeed; // PB 50
        if (!this.gameover) {
            if (sleeping)
                return;
            this.bg.update(dt);
            for (var o = 0; o < this.backgroundObstacles.length; o++) {
                if (this.backgroundObstacles[o] && this.backgroundObstacles[o].lives) {
                    this.backgroundObstacles[o].update(dt);
                    if (this.backgroundObstacles[o].currentDistance >= this.player.distance * .9) {
                        if (this.collide(this.backgroundObstacles[o])) {
                            PlaySound("crash.mp3");
                            lives--;
                            console.log("Lives", lives);
                            this.player.isMoving = false;
                            this.moveLeft = true;
                            this.spacePressed = false;
                            that.moving = false;
                            clearTimeout(this.timer);
                            clearInterval(this.pointsTimer);
                            this.timer = undefined;
                            this.pointsTimer = undefined;
                            this.player.rotate = 90;
                            switch (lives) {
                                case 0:
                                    color = 'rgba(0, 255, 0, .8)';
                                    document.getElementById('lives').style.backgroundImage = 'url(cars3.png)';
                                    break;
                                case 1:
                                    color = 'rgba(220, 0, 0, .8)';
                                    document.getElementById('lives').style.backgroundImage = 'url(cars1.png)';
                                    break;
                                case 2:
                                    color = 'rgba(255, 165, 0, .8)';
                                    document.getElementById('lives').style.backgroundImage = 'url(cars2.png)';
                                    break;
                            }
                            this.player.render();
                            if (lives == 0) {
                                this.setGameover();
                                lives = 3;
                            } else {
                                this.foregroundObstacles.push(this.backgroundObstacles[o]);
                                delete this.backgroundObstacles[o];
                                sleeping = true;
                                setTimeout(function () {
                                    sleeping = false;
                                }, 500);
                                return;
                            }
                        } else {
                            this.foregroundObstacles.push(this.backgroundObstacles[o]);
                            delete this.backgroundObstacles[o];
                        }
                    }
                }
            }

            this.player.update(dt);

            for (var o = 0; o < this.foregroundObstacles.length; o++) {
                if (this.foregroundObstacles[o] && this.foregroundObstacles[o].lives) {
                    this.foregroundObstacles[o].update(dt);
                } else {
                    delete this.foregroundObstacles[o];
                }
            }
        }
    };

    this.collide = function (obstacle) {
        var angle = (Math.atan2(obstacle.y - this.game.halfHeight, obstacle.x - this.game.halfWidth) * 180 / Math.PI)
        if (angle < 0)
            angle += 360;

        if (this.player.rotate - 30 < angle && this.player.rotate + 30 > angle) {
            return true;
        }

        return false;
    };

    this.setGameover = function () {
        this.best = 0;
        this.gameover = true;
        document.getElementById('lives').hidden = true;
        if (typeof (Storage) !== "undefined") {
            var best = parseInt(localStorage.getItem("bestScore"), 10) || 0;
            if (globalpoints > best) {
                this.best = globalpoints;
                localStorage.setItem("bestScore", globalpoints.toString());
            } else {
                this.best = best;
            }
        }

        clearTimeout(this.timer);
        clearInterval(this.pointsTimer);
        this.timer = undefined;
        this.pointsTimer = undefined;
    };

    this.drawGameover = function (dt) {
        var f = (window.innerHeight / 10);
        var gameoverTxt = 'GAME OVER';
        var bestTxt = '🔼: ' + this.best.toString();
        var scoreTxt = '#️⃣: ' + Math.floor(globalpoints).toString();
        this.game.ctx.save();
        this.game.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.game.ctx.fillRect(0, 0, this.game.width, this.game.height);
        this.game.ctx.fillStyle = '#f061a3';
        this.game.ctx.font = f.toString() + "px Arial"; // 48
        var gotW = this.game.ctx.measureText(gameoverTxt).width;
        this.game.ctx.fillText(gameoverTxt, this.game.halfWidth - (gotW / 2), this.game.halfHeight * .6);
        this.game.ctx.fillStyle = '#fff';
        this.game.ctx.font = (f * .75).toString + "px Arial"; // waas 32
        var bW = this.game.ctx.measureText(bestTxt).width;
        this.game.ctx.fillText(bestTxt, this.game.halfWidth - (bW / 2), this.game.halfHeight);
        var sW = this.game.ctx.measureText(scoreTxt).width;
        this.game.ctx.fillText(scoreTxt, this.game.halfWidth - (sW / 2), this.game.halfHeight * 1.4);
        var txt = ''; //'Tap';
        //        txt += ' To Restart';
        this.game.ctx.save();
        this.game.ctx.font = f.toString() + "px Arial"; // 28
        var len = this.game.ctx.measureText(txt.toUpperCase()).width;
        //        this.game.ctx.fillStyle = 'rgba(240, 97, 163, .9)';
        //        this.game.ctx.fillRect(
        //            (this.game.width / 2) - (len / 2) - 4,
        //            (this.game.height / 2) + 122,
        //            len + 8,
        //            36
        //        );
        this.game.ctx.fillStyle = '#fff';
        this.game.ctx.fillText(txt.toUpperCase(), (this.game.width / 2) - (len / 2), (this.game.height / 2) + 150);
        //this.game.ctx.restore();
        this.game.ctx.restore();
    };

    this.draw = function (dt) {
        this.bg.draw()
        for (var o = 0; o < this.backgroundObstacles.length; o++) {
            if (this.backgroundObstacles[o] && this.backgroundObstacles[o].lives) {
                this.backgroundObstacles[o].draw(dt);
            }
        }

        this.player.draw(dt);

        for (var o = 0; o < this.foregroundObstacles.length; o++) {
            if (this.foregroundObstacles[o] && this.foregroundObstacles[o].lives) {
                this.foregroundObstacles[o].draw(dt);
            }
        }

        this.drawPoints();
        this.drawSpeed();
        if (!this.player.isMoving)
            this.drawStart();

        if (this.gameover)
            this.drawGameover();
    };

    this.resize = function () {
        this.bg.resize();
        this.backgroundObstacles = [];
        this.foregroundObstacles = [];

        this.player.resize();
    };

    this.addObstacle = function () {
        this.backgroundObstacles.push(new Obstacle(this.game));
        clearTimeout(this.timer);
        this.timer = setTimeout(function () {
            this.addObstacle()
        }.bind(this), globalSpeed * random(1000, 3000));
    };

    this.drawPoints = function () {
        try {
            var f = (window.innerHeight / 25);
            var pts = (8 - parseInt(sldspeed.value)) / 6;
            globalpoints = Math.floor(this.points / pts);
            var txt = ('🚘#️⃣: ' + globalpoints.toString()).toUpperCase();
            this.game.ctx.save();
            this.game.ctx.font = (f).toString() + "px Arial"; //20
            this.game.ctx.fillStyle = 'rgba(240, 97, 163, 0)'; // 'rgba(240, 97, 163, .9)';
            this.game.ctx.fillRect(16, 18, this.game.ctx.measureText(txt).width + 8, 28);
            this.game.ctx.fillStyle = '#fff';
            this.game.ctx.fillText(txt, 20, f * 2);
            this.game.ctx.restore();
        } catch (e) {
            ;
        }
    };

    this.drawSpeed = function () {
        if (speedChanged) {
            this.player.speed = 100 / globalSpeed;
            speedChanged = false;
        }
        var s = parseInt(this.player.speed);
        var txt = ('💫 ' + s.toString()).toUpperCase();
        var f = (window.innerHeight / 25);
        this.game.ctx.save();
        this.game.ctx.font = (f).toString() + "px Arial"; //20
        var len = this.game.ctx.measureText(txt).width;
        this.game.ctx.fillStyle = 'rgba(240, 97, 163, 0)'; // 'rgba(240, 97, 163, .9)';
        this.game.ctx.fillRect(this.game.width - len - 24, 18, len + 8, 28);
        this.game.ctx.fillStyle = '#fff';
        this.game.ctx.fillText(txt, 20, f * 4);
        //       this.game.ctx.fillText(txt, this.game.width - len - 20, 40);
        this.game.ctx.restore();
    };

    this.drawStart = function () {
        //  this.game.setState('gameplay');
        //        var txt = 'Tap ';
        //        txt += ' To Start';
        //        this.game.ctx.save();
        //        this.game.ctx.font = "28px Arial";
        //        var len = this.game.ctx.measureText(txt.toUpperCase()).width;
        //        this.game.ctx.fillStyle = 'rgba(240, 97, 163, .9)';
        //        this.game.ctx.fillRect(
        //            (this.game.width / 2) - (len / 2) - 4,
        //            (this.game.height / 2) - 18,
        //            len + 8,
        //            36
        //        );
        //        this.game.ctx.fillStyle = '#fff';
        //        this.game.ctx.fillText(txt.toUpperCase(), (this.game.width / 2) - (len / 2), (this.game.height / 2) + 10);
        //        this.game.ctx.restore();
        var i;
    };

    this.bindKeys = function () {
        document.addEventListener('keyup', this.keyUp);
        document.addEventListener('keydown', this.keyDown);
        document.addEventListener('mouseup', this.keyUp);
        document.addEventListener('mousedown', this.keyDown);
        document.addEventListener('touchstart', this.keyDown);
        document.addEventListener('touchend', this.keyUp);
    };

    this.destroy = function () {
        clearTimeout(this.timer);
        clearInterval(this.pointsTimer);
        document.removeEventListener('keyup', this.keyUp);
        document.removeEventListener('keydown', this.keyDown);
        document.removeEventListener('mouseup', this.keyUp);
        document.removeEventListener('mousedown', this.keyDown);
        document.removeEventListener('touchend', this.keyUp);
        document.removeEventListener('touchstart', this.keyDown);
    };

    this.keyUp = this.keyUp.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.init();
    this.bindKeys();
}

function MainMenu(game) {
    this.game = game;
    this.c = game.ctx;
    this.bg = new Bg(this.game);

    this.init = function () {

    };

    this.drawTitle = function () {
        var gradient = this.c.createLinearGradient(0, 0, 0, 5);
        colorStop(gradient, [
      [0, '#251031'],
      [.2, '#7244cb'],
      [.4, '#b0b4fb'],
      [.5, '#fcfcfc'],
      [.51, '#040404'],
      [.7, '#720b81'],
      [1, '#c9c0db']
    ]);

        this.c.save();
        this.c.translate(this.game.halfWidth - 176, this.game.halfHeight / 2);
        this.c.scale(16, 16);
        this.c.beginPath();
        this.c.moveTo(0, 0);
        drawLine(this.c, [
      [2, 0],
      [2, 3],
      [4, 3],
      [4, 5],
      [0, 5],
      [0, 0]
    ]);
        this.c.moveTo(5, 5);
        drawLine(this.c, [
      [7, 0],
      [9, 5],
      [5, 5]
    ]);
        this.c.moveTo(10, 0);
        drawLine(this.c, [
      [14, 0],
      [13, 3],
      [14, 3],
      [14, 5],
      [10, 5],
      [11, 2],
      [10, 2],
      [10, 0]
    ]);
        this.c.moveTo(15, 0);
        drawLine(this.c, [
      [18, 0],
      [18, 1.5],
      [17, 1.5],
      [17, 2],
      [18, 2],
      [18, 3.5],
      [17, 3.5],
      [17, 4],
      [18, 4],
      [18, 5],
      [15, 5],
      [15, 0]
    ]);
        this.c.moveTo(19, 0);
        drawLine(this.c, [
      [21, 0]
    ]);
        this.c.bezierCurveTo(22.5, 0, 22.5, 3, 21, 3);
        drawLine(this.c, [
      [22, 5],
      [19, 5],
      [19, 0]
    ]);
        this.c.fillStyle = gradient;
        this.c.fill();
        this.c.strokeStyle = '#000293';
        this.c.lineWidth = .15;
        this.c.stroke();
        this.c.restore();
    };

    this.drawStart = function () {};

    this.update = function (dt) {
        if (sleeping)
            return;
        this.bg.update(dt);
    };

    this.draw = function (dt) {
        this.bg.draw(dt);
        //        this.drawTitle();
        //        this.drawSubtitle();
        //  this.drawStart();
    };

    this.resize = function () {
        this.bg.resize();
    };

    this.keyDown = function (e) {
        if (firsttime) {
            InitAudio();
        }
        if ((e.keyCode === 32 || e.type === 'touchstart')) {
            this.game.setState('gameplay');
        }
    }

    this.bindKeys = function () {
        document.addEventListener('keydown', this.keyDown);
        document.addEventListener('mousedown', this.keyDown);
        document.addEventListener('touchstart', this.keyDown);
    };

    this.destroy = function () {
        document.removeEventListener('keydown', this.keyDown);
        document.addEventListener('mousedown', this.keyDown);
        document.removeEventListener('touchstart', this.keyDown);
    };

    this.draw = this.draw.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.bindKeys();
}

function Game() {
    this.canvas = document.querySelector('#game');
    this.ctx = this.canvas.getContext('2d');
    this.lastTime = (new Date()).getTime();
    this.halfWidth = this.canvas.width / 2;
    this.halfHeight = this.canvas.height / 2;
    this.states = {
        menu: MainMenu,
        gameplay: Gameplay,
    };
    this.currentState = null;

    this.run = function () {
        this.resize();
        window.addEventListener('resize', this.resize.bind(this), true);
        this.loop();
        console.log('run game');
    };

    this.resize = function () {
        this.canvas.width = this.width = window.innerWidth;
        this.canvas.height = this.height = window.innerHeight;
        this.halfWidth = this.canvas.width / 2;
        this.halfHeight = this.canvas.height / 2;
        this.currentState.resize();
    };

    this.setState = function (stateName) {
        if (this.currentState)
            this.currentState.destroy();
        this.currentState = new this.states[stateName](this);
        this.currentState.resize();
    };

    this.update = function (dt) {
        this.currentState.update(dt)
    }

    this.draw = function (dt) {
        this.currentState.draw(dt);
    };

    this.loop = function () {
        window.requestAnimFrame(this.loop);

        var currentTime = (new Date()).getTime();

        var dt = (currentTime - this.lastTime) / 1000;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.update(dt);
        this.draw(dt);

        this.lastTime = currentTime;
    };

    this.loop = this.loop.bind(this);
}

var game = new Game();

game.setState('menu');
game.run();
game.setState('gameplay');
