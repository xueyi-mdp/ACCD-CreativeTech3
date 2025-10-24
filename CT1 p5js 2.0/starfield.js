let posx = []
let posy = []//array
let numStars = 500
let size=[]

function setup() {
  createCanvas(600, 600);
  colorMode(HSB, 360, 100, 100)

  //frameRate(2)帧率
  for(let i=0; i < numStars;i++){
    posx.push(random(width))//所有语言使用
    posy[i] = random(height)//有些语言不能用
    size.push(random(2,6))
  }
}

function draw() {
  background(0, 0, 0)
  for(let i = 0; i < numStars; i++) {
  fill(0, 0, 100)
  circle(posx[i], posy[i], random(size[i], size[i] + 1));//将原固定在一个随机的位置上
  }
  
}

//实时变化网站（右键单击html open in live server）
//for(i-0 从序号0开始 ； i<=15 结束; i++)
// while(true){}