import React, { useEffect, useRef } from 'react';

export default function SalmonRun() {
  const sketchRef = useRef();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      new window.p5((p) => {
        let scene = 1;
        let salmon = [];
        let obstacles = [];
        let eggs = [];
        let babies = [];
        let waterParticles = [];
        let selectedFish = [];
        let bear;

        class Salmon {
          constructor(x, y, scene) {
            this.x = x;
            this.y = y;
            this.vx = 0;
            this.vy = 0;
            this.size = 40;
            this.angle = -0.5; // Angle for swimming up the slope
            this.state = 'swimming';
            this.scene = scene;
            this.health = 100;
            this.color = p.color(p.random(200, 255), p.random(100, 150), p.random(100, 150));
            this.swimCycle = 0;
            this.progress = 0; // Progress along the slope (0 to 1)
            this.blockedByRock = false;
            this.jumpSuccess = false; // Whether this jump will succeed
          }

          update() {
            if (this.state === 'swimming') {
              if (scene === 1) {
                // Swim slowly up the slope
                this.swimCycle += 0.1;
                
                // Only move if not blocked by rock
                if (!this.blockedByRock) {
                  this.progress += 0.002; // Slow progress
                }
                
                // Calculate position along slope
                let targetX = p.lerp(p.width, 0, this.progress);
                let targetY = p.lerp(p.height - 80, 120, this.progress);
                
                this.x = targetX + p.sin(this.swimCycle) * 10;
                this.y = targetY + p.cos(this.swimCycle) * 5;
                
                // Set angle to face up the slope
                this.angle = -0.5;
                
                // Check if blocked by any rock
                this.blockedByRock = false;
                for (let obs of obstacles) {
                  let dist = p.dist(this.x, this.y, obs.x, obs.y);
                  if (dist < (this.size + obs.size) / 2 + 20) {
                    this.blockedByRock = true;
                    break;
                  }
                }
              } else if (scene === 2) {
                this.vx += p.random(-0.1, 0.1);
                this.vy += p.random(-0.1, 0.1);
                this.vx *= 0.95;
                this.vy *= 0.95;
                this.angle = p.atan2(this.vy, this.vx);
                this.x += this.vx;
                this.y += this.vy;
              }
            } else if (this.state === 'jumping') {
              // Jump in arc
              this.vx *= 0.98;
              this.vy += 0.4; // Gravity
              this.x += this.vx;
              this.y += this.vy;
              this.angle = p.atan2(this.vy, this.vx);
              
              // Land back on slope and continue swimming
              let slopeY = p.lerp(p.height - 80, 120, 1 - (this.x / p.width));
              if (this.y >= slopeY - 10) {
                this.state = 'swimming';
                this.progress = 1 - (this.x / p.width);
                this.vy = 0;
                this.vx = 0;
              }
            } else if (this.state === 'dying') {
              this.health -= 3;
              this.angle += 0.1;
              this.y += 3;
              this.x += 1;
            }

            // Keep in bounds
            if (scene === 2) {
              this.x = p.constrain(this.x, this.size, p.width - this.size);
              this.y = p.constrain(this.y, this.size, p.height - this.size);
            }
          }

          display() {
            p.push();
            p.translate(this.x, this.y);
            p.rotate(this.angle);
            
            if (this.state === 'dying') {
              p.fill(100, 100, 100, this.health * 2);
            } else {
              p.fill(this.color);
              
              // Show exclamation mark when blocked
              if (this.blockedByRock && this.state === 'swimming' && scene === 1) {
                p.push();
                p.rotate(-this.angle);
                p.fill(255, 200, 0);
                p.textSize(24);
                p.textAlign(p.CENTER, p.CENTER);
                p.text('!', 0, -30);
                p.pop();
              }
            }
            
            p.noStroke();
            // Body
            p.ellipse(0, 0, this.size, this.size * 0.4);
            // Tail
            p.triangle(-this.size/2, 0, -this.size/2 - 10, -8, -this.size/2 - 10, 8);
            // Eye
            p.fill(255);
            p.circle(this.size/4, -3, 6);
            p.fill(0);
            p.circle(this.size/4, -3, 3);
            p.pop();
          }

          jump() {
            if (this.state === 'swimming' && scene === 1 && this.blockedByRock) {
              this.state = 'jumping';
              // Determine if jump will succeed (80% chance)
              this.jumpSuccess = p.random(1) < 0.8;
              // Jump up and forward along the slope
              this.vx = -8; // Jump left (up the slope)
              this.vy = -8; // Jump up
            }
          }

          isClicked(mx, my) {
            return p.dist(mx, my, this.x, this.y) < this.size;
          }
        }

        class Rock {
          constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = p.random(50, 80);
          }

          display() {
            p.fill(70, 70, 80);
            p.noStroke();
            p.ellipse(this.x, this.y, this.size, this.size * 0.7);
            p.fill(90, 90, 100);
            p.ellipse(this.x - 8, this.y - 8, this.size * 0.6, this.size * 0.5);
            // Add some moss/texture
            p.fill(60, 80, 50, 150);
            p.ellipse(this.x + 5, this.y + 5, this.size * 0.3, this.size * 0.25);
          }

          checkCollision(fish) {
            return p.dist(fish.x, fish.y, this.x, this.y) < (this.size + fish.size) / 2;
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
            
            p.fill(101, 67, 33);
            p.noStroke();
            // Body
            p.ellipse(this.x, this.y + 40, 80, 100);
            // Head
            p.circle(this.x, this.y, 60);
            // Ears
            p.circle(this.x - 20, this.y - 20, 25);
            p.circle(this.x + 20, this.y - 20, 25);
            // Snout
            p.fill(150, 100, 70);
            p.ellipse(this.x, this.y + 10, 35, 25);
            // Eyes
            p.fill(0);
            p.circle(this.x - 12, this.y - 5, 8);
            p.circle(this.x + 12, this.y - 5, 8);
            
            if (this.catching) {
              // Paw swipe animation
              p.fill(101, 67, 33);
              p.push();
              p.translate(this.x + 30, this.y + 30);
              p.rotate(p.PI / 4);
              p.ellipse(0, 0, 40, 25);
              p.pop();
              
              this.catchTimer--;
              if (this.catchTimer <= 0) {
                this.catching = false;
                bearActive = false;
                bearAppearTimer = p.frameCount + p.random(180, 360); // Reappear in 3-6 seconds
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
            
            if (p.dist(fish.x, fish.y, this.x, this.y + 50) < 80) {
              this.catching = true;
              this.catchTimer = 45;
              return true;
            }
            return false;
          }
        }

        class Egg {
          constructor(x, y) {
            this.x = x + p.random(-20, 20);
            this.y = y + p.random(-10, 10);
            this.size = 8;
            this.hatchTime = p.random(180, 300);
            this.age = 0;
          }

          update() {
            this.age++;
            this.y += 0.5;
            if (this.y > p.height - 50) {
              this.y = p.height - 50;
            }
          }

          display() {
            p.fill(255, 200, 100, 200);
            p.noStroke();
            p.circle(this.x, this.y, this.size);
          }

          shouldHatch() {
            return this.age > this.hatchTime;
          }
        }

        class BabyFish {
          constructor(x, y) {
            this.x = x;
            this.y = y;
            this.vx = p.random(0.5, 1.5);
            this.vy = p.random(-0.5, 0.5);
            this.size = 15;
            this.angle = 0;
          }

          update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += p.random(-0.1, 0.1);
            this.vy = p.constrain(this.vy, -1, 1);
            this.angle = p.atan2(this.vy, this.vx);
          }

          display() {
            p.push();
            p.translate(this.x, this.y);
            p.rotate(this.angle);
            p.fill(200, 220, 255);
            p.noStroke();
            p.ellipse(0, 0, this.size, this.size * 0.4);
            p.triangle(-this.size/2, 0, -this.size/2 - 5, -4, -this.size/2 - 5, 4);
            p.pop();
          }
        }

        let successfulFish = 0;
        let spawnTimer = 0;
        let bearActive = false;
        let bearAppearTimer = 0;

        p.setup = function() {
          p.createCanvas(800, 600);
          initScene1();
        };

        function initScene1() {
          scene = 1;
          salmon = [];
          obstacles = [];
          eggs = [];
          babies = [];
          selectedFish = [];
          successfulFish = 0;
          spawnTimer = 0;
          bearActive = false;
          bearAppearTimer = 0;
          
          // Create waterfall/cascade rocks on the slope
          for (let i = 0; i < 6; i++) {
            let t = i / 6;
            let x = p.lerp(50, p.width - 50, t);
            let y = p.lerp(150, p.height - 150, t);
            obstacles.push(new Rock(x, y));
          }
          
          bear = new Bear(p.random(100, 700), p.random(100, 300));
          
          for (let i = 0; i < 150; i++) {
            waterParticles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              speed: p.random(3, 7),
              angle: p.random(-0.3, 0.3)
            });
          }
        }

        function initScene2() {
          scene = 2;
          // Transfer successful fish to scene 2
          salmon = [];
          for (let i = 0; i < successfulFish; i++) {
            salmon.push(new Salmon(p.random(200, 600), p.random(200, 400), 2));
          }
          obstacles = [];
          selectedFish = [];
          
          for (let i = 0; i < 50; i++) {
            waterParticles[i].speed = p.random(0.5, 1);
          }
        }

        function initScene3() {
          scene = 3;
          salmon = [];
          selectedFish = [];
          
          for (let i = 0; i < 50; i++) {
            waterParticles[i].speed = p.random(1, 2);
          }
        }

        p.draw = function() {
          // Background
          p.background(100, 180, 220);
          
          // Water particles
          p.fill(255, 255, 255, 100);
          p.noStroke();
          for (let i = waterParticles.length - 1; i >= 0; i--) {
            let wp = waterParticles[i];
            p.circle(wp.x, wp.y, 3);
            
            // Handle splash particles with life timer
            if (wp.life !== undefined) {
              wp.life--;
              wp.x += p.cos(wp.angle) * wp.speed;
              wp.y += p.sin(wp.angle) * wp.speed + 0.5; // Gravity
              wp.speed *= 0.95;
              if (wp.life <= 0) {
                waterParticles.splice(i, 1);
              }
            } else {
              // Regular water flow particles
              if (scene === 1) {
                // Water cascading down the mountain
                wp.y += wp.speed;
                wp.x += p.sin(wp.y * 0.05) * 2 + wp.speed * 0.3;
                if (wp.y > p.height) {
                  wp.y = 0;
                  wp.x = p.random(p.width);
                }
              } else if (scene === 2) {
                wp.x += wp.speed * 0.3;
                if (wp.x > p.width) wp.x = 0;
              } else {
                wp.x += wp.speed;
                if (wp.x > p.width) wp.x = 0;
              }
            }
          }

          // Scene-specific rendering
          if (scene === 1) {
            drawScene1();
          } else if (scene === 2) {
            drawScene2();
          } else if (scene === 3) {
            drawScene3();
          }

          // Instructions
          p.fill(255);
          p.textSize(16);
          p.textAlign(p.LEFT);
          if (scene === 1) {
            p.text('Scene 1: Click blocked salmon to make them jump!', 10, 25);
            p.text(`Successful climbers: ${successfulFish}/6`, 10, 50);
            p.text('Success rate: 80% | Failure: 20% (death)', 10, 75);
          } else if (scene === 2) {
            p.text('Scene 2: Click two salmon to spawn eggs', 10, 25);
            p.text(`Selected: ${selectedFish.length}/2`, 10, 50);
          } else if (scene === 3) {
            p.text('Scene 3: New life swims to the sea!', 10, 25);
            p.text(`Baby fish: ${babies.length}`, 10, 50);
          }
        };

        function drawScene1() {
          // Draw the slope background
          p.fill(80, 70, 60);
          p.noStroke();
          p.beginShape();
          p.vertex(p.width, p.height);
          p.vertex(0, p.height);
          p.vertex(0, 100);
          p.vertex(p.width, p.height - 100);
          p.endShape(p.CLOSE);
          
          // Draw darker slope texture
          p.fill(60, 50, 40);
          p.beginShape();
          p.vertex(p.width, p.height);
          p.vertex(0, p.height);
          p.vertex(0, 150);
          p.vertex(p.width, p.height - 50);
          p.endShape(p.CLOSE);
          
          // Draw water flow on the slope with transparency
          for (let i = 0; i < 15; i++) {
            let alpha = p.map(p.sin(p.frameCount * 0.05 + i), -1, 1, 30, 80);
            p.fill(150, 200, 255, alpha);
            p.beginShape();
            let startY = 100 + i * 30;
            let endY = p.height - 100 + i * 30;
            p.vertex(0, startY);
            p.vertex(p.width, endY);
            p.vertex(p.width, endY + 20);
            p.vertex(0, startY + 20);
            p.endShape(p.CLOSE);
          }
          
          // Add flowing water particles along the slope
          p.fill(255, 255, 255, 150);
          for (let i = 0; i < 50; i++) {
            let t = (p.frameCount * 0.02 + i * 0.1) % 1;
            let x = p.lerp(0, p.width, t);
            let y = p.lerp(120, p.height - 80, t);
            p.circle(x + p.sin(t * p.PI * 4) * 10, y, 4);
          }
          
          // Draw rocks on the slope
          for (let obs of obstacles) {
            obs.display();
          }

          // Draw bear if active
          bear.display();
          
          // Check if bear should appear
          if (!bearActive && !bear.catching && p.frameCount > bearAppearTimer) {
            if (p.random(1) < 0.4) { // 40% chance
              bearActive = true;
              bear.appearTimer = 90; // Stay for 1.5 seconds
              bear.x = p.random(150, 650);
              bear.y = p.random(100, 300);
            } else {
              bearAppearTimer = p.frameCount + p.random(90, 180);
            }
          }
          
          // Spawn new fish continuously from bottom right
          spawnTimer++;
          if (spawnTimer > 90) { // Every 1.5 seconds
            salmon.push(new Salmon(p.width - 50, p.height - 80, 1));
            spawnTimer = 0;
          }

          // Update and draw salmon
          for (let i = salmon.length - 1; i >= 0; i--) {
            let fish = salmon[i];
            fish.update();
            fish.display();

            // Check if reached the top (success!)
            if (fish.x < 50 && fish.y < 150) {
              successfulFish++;
              salmon.splice(i, 1);
              continue;
            }

            // Check if swept away
            if (fish.state === 'swept') {
              salmon.splice(i, 1);
              continue;
            }

            // Check rock collision during jump
            if (fish.state === 'jumping') {
              for (let obs of obstacles) {
                if (obs.checkCollision(fish)) {
                  // Check if jump was successful
                  if (!fish.jumpSuccess) {
                    // 20% chance - fish hits rock and dies
                    fish.state = 'dying';
                    // Add death splash effect
                    for (let j = 0; j < 10; j++) {
                      waterParticles.push({
                        x: fish.x,
                        y: fish.y,
                        speed: p.random(2, 5),
                        angle: p.random(p.TWO_PI),
                        life: 30
                      });
                    }
                  }
                  // If successful (80%), fish continues jump without collision
                }
              }
              
              // Check bear catch
              if (bearActive && bear.tryToCatch(fish)) {
                salmon.splice(i, 1);
                continue;
              }
            }
            
            // Remove dead fish
            if (fish.state === 'dying' && fish.health <= 0) {
              salmon.splice(i, 1);
            }
          }

          // Progress to scene 2 when enough fish succeed
          if (successfulFish >= 6) {
            setTimeout(() => initScene2(), 1000);
          }
        }

        function drawScene2() {
          // Draw riverbed
          p.fill(139, 90, 43);
          p.rect(0, p.height - 50, p.width, 50);

          // Highlight selected fish
          for (let fish of selectedFish) {
            p.noFill();
            p.stroke(255, 255, 0);
            p.strokeWeight(3);
            p.circle(fish.x, fish.y, fish.size + 10);
          }

          // Update and draw salmon
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

          // Update and draw eggs
          for (let i = eggs.length - 1; i >= 0; i--) {
            let egg = eggs[i];
            egg.update();
            egg.display();

            if (egg.shouldHatch()) {
              babies.push(new BabyFish(egg.x, egg.y));
              eggs.splice(i, 1);
            }
          }

          // Check if all eggs hatched
          if (salmon.length === 0 && eggs.length === 0 && babies.length === 0) {
            initScene3();
          } else if (salmon.length === 0 && eggs.length > 0) {
            // Wait for eggs to hatch
          }
        }

        function drawScene3() {
          // Draw sea gradient
          for (let i = 0; i < p.height; i++) {
            let col = p.lerpColor(p.color(100, 180, 220), p.color(20, 50, 120), i / p.height);
            p.stroke(col);
            p.line(0, i, p.width, i);
          }

          // Update and draw baby fish
          for (let i = babies.length - 1; i >= 0; i--) {
            let baby = babies[i];
            baby.update();
            baby.display();

            if (baby.x > p.width + 50) {
              babies.splice(i, 1);
            }
          }

          // Restart when all babies reach sea
          if (babies.length === 0) {
            p.textSize(24);
            p.fill(255);
            p.textAlign(p.CENTER);
            p.text('The cycle continues... Click to restart', p.width/2, p.height/2);
          }
        }

        p.mousePressed = function() {
          if (scene === 1) {
            for (let fish of salmon) {
              if (fish.isClicked(p.mouseX, p.mouseY)) {
                fish.jump();
                break;
              }
            }
          } else if (scene === 2) {
            for (let fish of salmon) {
              if (fish.isClicked(p.mouseX, p.mouseY) && fish.state === 'swimming') {
                if (!selectedFish.includes(fish)) {
                  selectedFish.push(fish);
                  
                  if (selectedFish.length === 2) {
                    // Spawn eggs
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
        };
      }, sketchRef.current);
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-900">
      <div ref={sketchRef} />
    </div>
  );
}