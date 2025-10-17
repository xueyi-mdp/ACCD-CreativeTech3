let posX
let posY

let velX
let velY

let radius = 20

//setup 
function setup() {
  createCanvas(600, 600);

  colorMode(HSB, width, 100, 100)
  posX = width * 0.5;
  posY = height * 0.5;

  velX = random(-4, 4)
  velY = random(-3, 3)
}
//draw 

function draw() {
  posX += velX
  posY += velY

  if (posY + radius >= height || posY -radius <= 0){
    velY = velY * -1
  }
  if (posX + radius >= height || posX -radius <= 0){
    velX = velX * -1
  }

  background(0, 0, 85)

  noStroke()

  fill(posX, 100, 100)
  circle(posX, posY, radius * 2);

  // stroke(225, 0, 0)
  // strokeWeight(4)

  fill(width*0.75, 100, 255)
  rect(width * 0.5 - 50, height * 0.5 - 50, 100, 100)


 }