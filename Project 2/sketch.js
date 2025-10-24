let scene = 1;
let salmon = [];
let obstacles = [];
let eggs = [];
let babies = [];
let waterParticles = [];
let selectedFish = [];
let bear;
let successfulFish = 0;
let spawnTimer = 0;
let bearActive = false;
let bearAppearTimer = 0;
let showPrompt = false;
let promptShown = false;
let maxSalmonOnScreen = 5; // 限制屏幕上同时出现的鱼数量

class Salmon {
  constructor(x, y, sceneNum) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.size = 40;
    this.angle = -0.5;
    this.state = 'swimming';
    this.sceneNum = sceneNum;
    this.health = 100;
    this.color = color(random(200, 255), random(100, 150), random(100, 150));
    this.swimCycle = 0;
    this.progress = 0;
    this.blockedByRock = false;
    this.jumpSuccess = false;
  }

  update() {
    if (this.state === 'swimming') {
      if (scene === 1) {
        this.swimCycle += 0.1;
        
        if (!this.blockedByRock) {
          this.progress += 0.002;
        }
        
        let targetX = lerp(width, 0, this.progress);
        let targetY = lerp(height - 80, 120, this.progress);
        
        this.x = targetX + sin(this.swimCycle) * 10;
        this.y = targetY + cos(this.swimCycle) * 5;
        
        this.angle = -0.5;
        
        this.blockedByRock = false;
        for (let obs of obstacles) {
          let d = dist(this.x, this.y, obs.x, obs.y);
          if (d < (this.size + obs.size) / 2 + 20) {
            this.blockedByRock = true;
            break;
          }
        }
      } else if (scene === 2) {
        this.vx += random(-0.1, 0.1);
        this.vy += random(-0.1, 0.1);
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.angle = atan2(this.vy, this.vx);
        this.x += this.vx;
        this.y += this.vy;
      }
    } else if (this.state === 'jumping') {
      this.vx *= 0.98;
      this.vy += 0.4;
      this.x += this.vx;
      this.y += this.vy;
      this.angle = atan2(this.vy, this.vx);
      
      let slopeY = lerp(height - 80, 120, 1 - (this.x / width));
      if (this.y >= slopeY - 10) {
        this.state = 'swimming';
        this.progress = 1 - (this.x / width);
        this.vy = 0;
        this.vx = 0;
      }
    } else if (this.state === 'dying') {
      this.health -= 3;
      this.angle += 0.1;
      this.y += 3;
      this.x += 1;
    }

    if (scene === 2) {
      this.x = constrain(this.x, this.size, width - this.size);
      this.y = constrain(this.y, this.size, height - this.size);
    }
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    
    if (this.state === 'dying') {
      fill(100, 100, 100, this.health * 2);
    } else {
      fill(this.color);
      
      if (this.blockedByRock && this.state === 'swimming' && scene === 1) {
        push();
        rotate(-this.angle);
        fill(255, 200, 0);
        textSize(24);
        textAlign(CENTER, CENTER);
        text('!', 0, -30);
        pop();
      }
    }
    
    noStroke();
    ellipse(0, 0, this.size, this.size * 0.4);
    triangle(-this.size/2, 0, -this.size/2 - 10, -8, -this.size/2 - 10, 8);
    fill(255);
    circle(this.size/4, -3, 6);
    fill(0);
    circle(this.size/4, -3, 3);
    pop();
  }

  jump() {
    if (this.state === 'swimming' && scene === 1 && this.blockedByRock) {
      this.state = 'jumping';
      this.jumpSuccess = random(1) < 0.8;
      this.vx = -8;
      this.vy = -8;
    }
  }

  isClicked(mx, my) {
    return dist(mx, my, this.x, this.y) < this.size;
  }
}

class Rock {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(50, 80);
  }

  display() {
    fill(70, 70, 80);
    noStroke();
    ellipse(this.x, this.y, this.size, this.size * 0.7);
    fill(90, 90, 100);
    ellipse(this.x - 8, this.y - 8, this.size * 0.6, this.size * 0.5);
    fill(60, 80, 50, 150);
    ellipse(this.x + 5, this.y + 5, this.size * 0.3, this.size * 0.25);
  }

  checkCollision(fish) {
    return dist(fish.x, fish.y, this.x, this.y) < (this.size + fish.size) / 2;
  }
}

class Bear {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.catching = false;
    this.catchTimer = 0;
    this.targetFish = null;
    this.appearTimer = 60;
  }

  display() {
    if (!bearActive) return;
    
    fill(101, 67, 33);
    noStroke();
    ellipse(this.x, this.y + 40, 80, 100);
    circle(this.x, this.y, 60);
    circle(this.x - 20, this.y - 20, 25);
    circle(this.x + 20, this.y - 20, 25);
    fill(150, 100, 70);
    ellipse(this.x, this.y + 10, 35, 25);
    fill(0);
    circle(this.x - 12, this.y - 5, 8);
    circle(this.x + 12, this.y - 5, 8);
    
    if (this.catching) {
      fill(90, 60, 33);
      push();
      translate(this.x + 30, this.y + 30);
      rotate(PI / 4);
      ellipse(0, 0, 40, 25);
      pop();
      
      this.catchTimer--;
      if (this.catchTimer <= 0) {
        this.catching = false;
        bearActive = false;
        bearAppearTimer = frameCount + random(180, 360);
      }
    } else if (bearActive) {
      this.appearTimer--;
      if (this.appearTimer <= 0) {
        bearActive = false;
      }
    }
  }

  tryToCatch(fish) {
    if (!bearActive || this.catching) return false;
    
    if (dist(fish.x, fish.y, this.x, this.y + 50) < 80) {
      this.catching = true;
      this.catchTimer = 45;
      return true;
    }
    return false;
  }
}

class Egg {
  constructor(x, y) {
    this.x = x + random(-20, 20);
    this.y = y + random(-10, 10);
    this.size = 8;
    this.hatchTime = random(120, 240); // 减少孵化时间：2-4秒
    this.age = 0;
  }

  update() {
    this.age++;
    this.y += 0.5;
    if (this.y > height - 50) {
      this.y = height - 50;
    }
  }

  display() {
    fill(255, 200, 100, 200);
    noStroke();
    circle(this.x, this.y, this.size);
    
    // 显示孵化进度
    if (this.age > this.hatchTime * 0.7) {
      // 快要孵化时显示裂纹效果
      stroke(150, 100, 50);
      strokeWeight(1);
      line(this.x - 2, this.y - 2, this.x + 2, this.y + 2);
      line(this.x - 2, this.y + 2, this.x + 2, this.y - 2);
    }
  }

  shouldHatch() {
    return this.age > this.hatchTime;
  }
}

class BabyFish {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(1, 2); // 增加游动速度
    this.vy = random(-0.5, 0.5);
    this.size = 15;
    this.angle = 0;
    this.color = color(random(200, 255), random(100, 150), random(100, 150));
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += random(-0.1, 0.1);
    this.vy = constrain(this.vy, -1, 1);
    this.angle = atan2(this.vy, this.vx);
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    fill(this.color);
    noStroke();
    ellipse(0, 0, this.size, this.size * 0.4);
    triangle(-this.size/2, 0, -this.size/2 - 5, -4, -this.size/2 - 5, 4);
    // 眼睛
    fill(0);
    circle(this.size/4, 0, 2);
    pop();
  }
}

function setup() {
  createCanvas(800, 600);
  initScene1();
}

function initScene1(continueMode) {
  scene = 1;
  salmon = [];
  obstacles = [];
  eggs = [];
  babies = [];
  selectedFish = [];
  if (!continueMode) {
    successfulFish = 0;
  }
  spawnTimer = 0;
  bearActive = false;
  bearAppearTimer = 0;
  showPrompt = false;
  if (!continueMode) {
    promptShown = false;
  }
  
  for (let i = 0; i < 6; i++) {
    let t = i / 6;
    let x = lerp(50, width - 50, t);
    let y = lerp(150, height - 150, t);
    obstacles.push(new Rock(x, y));
  }
  
  bear = new Bear(random(100, 700), random(100, 300));
  
  waterParticles = [];
  for (let i = 0; i < 150; i++) {
    waterParticles.push({
      x: random(width),
      y: random(height),
      speed: random(3, 7),
      angle: random(-0.3, 0.3)
    });
  }
}

function initScene2() {
  scene = 2;
  salmon = [];
  for (let i = 0; i < successfulFish; i++) {
    salmon.push(new Salmon(random(200, 600), random(200, 400), 2));
  }
  obstacles = [];
  selectedFish = [];
  
  for (let i = 0; i < 50; i++) {
    waterParticles[i].speed = random(0.5, 1);
  }
}

function initScene3() {
  scene = 3;
  salmon = [];
  selectedFish = [];
  
  for (let i = 0; i < 50; i++) {
    waterParticles[i].speed = random(1, 2);
  }
}

function draw() {
  background(100, 180, 220);
  
  // 如果显示提示框，只绘制当前场景背景和提示框，不更新游戏逻辑
  if (showPrompt) {
    // 绘制场景1的背景（静态）
    if (scene === 1) {
      drawScene1Background();
    }
    // 绘制提示框
    drawPrompt();
    return; // 重要：显示提示框时不执行下面的游戏逻辑
  }
  
  // 正常游戏逻辑
  fill(255, 255, 255, 100);
  noStroke();
  for (let i = waterParticles.length - 1; i >= 0; i--) {
    let wp = waterParticles[i];
    circle(wp.x, wp.y, 3);
    
    if (wp.life !== undefined) {
      wp.life--;
      wp.x += cos(wp.angle) * wp.speed;
      wp.y += sin(wp.angle) * wp.speed + 0.5;
      wp.speed *= 0.95;
      if (wp.life <= 0) {
        waterParticles.splice(i, 1);
      }
    } else {
      if (scene === 1) {
        wp.y += wp.speed;
        wp.x += sin(wp.y * 0.05) * 2 + wp.speed * 0.3;
        if (wp.y > height) {
          wp.y = 0;
          wp.x = random(width);
        }
      } else if (scene === 2) {
        wp.x += wp.speed * 0.3;
        if (wp.x > width) wp.x = 0;
      } else {
        wp.x += wp.speed;
        if (wp.x > width) wp.x = 0;
      }
    }
  }

  if (scene === 1) {
    drawScene1();
  } else if (scene === 2) {
    drawScene2();
  } else if (scene === 3) {
    drawScene3();
  }

  fill(255);
  textSize(16);
  textAlign(LEFT);
  if (scene === 1) {
    text('Scene 1: Click blocked salmon to make them jump!', 10, 25);
    text('Successful climbers: ' + successfulFish + '/6', 10, 50);
    text('Salmon on screen: ' + salmon.length + '/' + maxSalmonOnScreen, 10, 75);
  } else if (scene === 2) {
    text('Scene 2: Click two salmon to spawn eggs', 10, 25);
    text('Selected: ' + selectedFish.length + '/2', 10, 50);
  } else if (scene === 3) {
    text('Scene 3: New life swims to the sea!', 10, 25);
  }
}

function drawScene1Background() {
  // 只绘制背景，不绘制鱼和游戏逻辑
  fill(80, 70, 60);
  noStroke();
  beginShape();
  vertex(width, height);
  vertex(0, height);
  vertex(0, 100);
  vertex(width, height - 100);
  endShape(CLOSE);
  
  fill(60, 50, 40);
  beginShape();
  vertex(width, height);
  vertex(0, height);
  vertex(0, 150);
  vertex(width, height - 50);
  endShape(CLOSE);
  
  for (let i = 0; i < 15; i++) {
    let alpha = map(sin(frameCount * 0.05 + i), -1, 1, 30, 80);
    fill(150, 200, 255, alpha);
    beginShape();
    let startY = 100 + i * 30;
    let endY = height - 100 + i * 30;
    vertex(0, startY);
    vertex(width, endY);
    vertex(width, endY + 20);
    vertex(0, startY + 20);
    endShape(CLOSE);
  }
  
  for (let obs of obstacles) {
    obs.display();
  }
}

function drawScene1() {
  drawScene1Background();

  bear.display();
  
  if (!bearActive && !bear.catching && frameCount > bearAppearTimer) {
    if (random(1) < 0.4) {
      bearActive = true;
      bear.appearTimer = 90;
      bear.x = random(150, 650);
      bear.y = random(100, 300);
    } else {
      bearAppearTimer = frameCount + random(90, 180);
    }
  }
  
  spawnTimer++;
  // 只有当屏幕上的鱼少于最大数量时才生成新鱼
  // 并且增加生成间隔，避免拥挤
  if (spawnTimer > 120 && salmon.length < maxSalmonOnScreen) {
    salmon.push(new Salmon(width - 50, height - 80, 1));
    spawnTimer = 0;
  }

  for (let i = salmon.length - 1; i >= 0; i--) {
    let fish = salmon[i];
    fish.update();
    fish.display();

    if (fish.x < 50 && fish.y < 150) {
      successfulFish++;
      salmon.splice(i, 1);
      continue;
    }

    // 如果鱼在起点附近停留太久（被卡住），移除它
    if (fish.progress < 0.05 && frameCount % 600 === 0) {
      salmon.splice(i, 1);
      continue;
    }

    if (fish.state === 'swept') {
      salmon.splice(i, 1);
      continue;
    }

    if (fish.state === 'jumping') {
      for (let obs of obstacles) {
        if (obs.checkCollision(fish)) {
          if (!fish.jumpSuccess) {
            fish.state = 'dying';
            for (let j = 0; j < 10; j++) {
              waterParticles.push({
                x: fish.x,
                y: fish.y,
                speed: random(2, 5),
                angle: random(TWO_PI),
                life: 30
              });
            }
          }
        }
      }
      
      if (bearActive && bear.tryToCatch(fish)) {
        salmon.splice(i, 1);
        continue;
      }
    }
    
    if (fish.state === 'dying' && fish.health <= 0) {
      salmon.splice(i, 1);
    }
  }

  // 每累积到新的6条时显示提示（6, 12, 18, 24...）
  if (successfulFish > 0 && successfulFish % 6 === 0 && !showPrompt) {
    showPrompt = true;
  }
}

function drawScene2() {
  fill(139, 90, 43);
  rect(0, height - 50, width, 50);

  for (let fish of selectedFish) {
    noFill();
    stroke(255, 255, 0);
    strokeWeight(3);
    circle(fish.x, fish.y, fish.size + 10);
  }

  for (let i = salmon.length - 1; i >= 0; i--) {
    let fish = salmon[i];
    if (fish.state !== 'dead') {
      fish.update();
      fish.display();
    }

    if (fish.state === 'dying' && fish.health <= 0) {
      fish.state = 'dead';
      salmon.splice(i, 1);
    }
  }

  for (let i = eggs.length - 1; i >= 0; i--) {
    let egg = eggs[i];
    egg.update();
    egg.display();

    if (egg.shouldHatch()) {
      babies.push(new BabyFish(egg.x, egg.y));
      eggs.splice(i, 1);
    }
  }
  
  // 绘制和更新小鱼
  for (let i = babies.length - 1; i >= 0; i--) {
    let baby = babies[i];
    baby.update();
    baby.display();
    
    // 小鱼游出屏幕右侧就移除
    if (baby.x > width + 50) {
      babies.splice(i, 1);
    }
  }

  // 显示统计信息
  fill(255);
  textSize(14);
  text('Eggs: ' + eggs.length, 10, 80);
  text('Baby fish: ' + babies.length, 10, 100);

  if (salmon.length === 0 && eggs.length === 0 && babies.length === 0) {
    initScene3();
  }
}

function drawScene3() {
  for (let i = 0; i < height; i++) {
    let col = lerpColor(color(100, 180, 220), color(20, 50, 120), i / height);
    stroke(col);
    line(0, i, width, i);
  }

  for (let i = babies.length - 1; i >= 0; i--) {
    let baby = babies[i];
    baby.update();
    baby.display();

    if (baby.x > width + 50) {
      babies.splice(i, 1);
    }
  }

  if (babies.length === 0) {
    textSize(24);
    fill(255);
    textAlign(CENTER);
    text('The cycle continues... Click to restart', width/2, height/2);
  }
}

function drawPrompt() {
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, 0, width, height);
  
  fill(255, 250, 240);
  stroke(50, 100, 150);
  strokeWeight(4);
  rectMode(CENTER);
  rect(width/2, height/2, 500, 280, 15);
  
  fill(50, 150, 100);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(28);
  textStyle(BOLD);
  text('Success!', width/2, height/2 - 85);
  
  fill(60, 60, 60);
  textStyle(NORMAL);
  textSize(18);
  text(successfulFish + ' salmon reached the spawning ground!', width/2, height/2 - 35);
  textSize(16);
  text('Do you want to proceed to the spawning scene?', width/2, height/2);
  
  let yesX = width/2 - 90;
  let noX = width/2 + 90;
  let buttonY = height/2 + 70;
  
  fill(80, 180, 100);
  stroke(50, 120, 70);
  strokeWeight(3);
  rectMode(CENTER);
  rect(yesX, buttonY, 140, 55, 8);
  fill(255);
  noStroke();
  textSize(22);
  textStyle(BOLD);
  text('YES', yesX, buttonY);
  
  fill(200, 80, 80);
  stroke(150, 50, 50);
  strokeWeight(3);
  rectMode(CENTER);
  rect(noX, buttonY, 140, 55, 8);
  fill(255);
  noStroke();
  textSize(22);
  textStyle(BOLD);
  text('NO', noX, buttonY);
  
  fill(100, 100, 100);
  textSize(13);
  textStyle(NORMAL);
  text('(Continue collecting more fish)', noX, buttonY + 40);
  
  rectMode(CORNER);
}

function handlePromptClick(mx, my) {
  let yesX = width/2 - 90;
  let noX = width/2 + 90;
  let buttonY = height/2 + 70;
  let buttonWidth = 140;
  let buttonHeight = 55;
  
  // YES按钮 - 进入繁衍场景
  if (mx > yesX - buttonWidth/2 && mx < yesX + buttonWidth/2 &&
      my > buttonY - buttonHeight/2 && my < buttonY + buttonHeight/2) {
    console.log('YES button clicked!');
    showPrompt = false;
    initScene2();
    return;
  }
  
  // NO按钮 - 继续第一场景，保持鱼数量累积
  if (mx > noX - buttonWidth/2 && mx < noX + buttonWidth/2 &&
      my > buttonY - buttonHeight/2 && my < buttonY + buttonHeight/2) {
    console.log('NO button clicked! Current fish count:', successfulFish);
    showPrompt = false;
    console.log('showPrompt set to false');
    console.log('Calling initScene1(true)...');
    // 传入true表示继续模式，保持successfulFish计数
    initScene1(true);
    console.log('After initScene1, scene =', scene, 'showPrompt =', showPrompt);
    return;
  }
  
  console.log('Click outside buttons');
}

function mousePressed() {
  // 优先处理提示框点击
  if (showPrompt) {
    handlePromptClick(mouseX, mouseY);
    return; // 重要：处理提示框后立即返回，不执行其他逻辑
  }
  
  if (scene === 1) {
    for (let fish of salmon) {
      if (fish.isClicked(mouseX, mouseY)) {
        fish.jump();
        break;
      }
    }
  } else if (scene === 2) {
    for (let fish of salmon) {
      if (fish.isClicked(mouseX, mouseY) && fish.state === 'swimming') {
        if (!selectedFish.includes(fish)) {
          selectedFish.push(fish);
          
          if (selectedFish.length === 2) {
            let x = (selectedFish[0].x + selectedFish[1].x) / 2;
            let y = (selectedFish[0].y + selectedFish[1].y) / 2;
            
            for (let i = 0; i < 20; i++) {
              eggs.push(new Egg(x, y));
            }
            
            selectedFish[0].state = 'dying';
            selectedFish[1].state = 'dying';
            selectedFish = [];
          }
        }
        break;
      }
    }
  } else if (scene === 3 && babies.length === 0) {
    initScene1();
  }
}