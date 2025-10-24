
function setup(){
   createCanvas(400,400);
   colorMode(HSB,TWO_PI, 1, 1)
}

function draw(){

    background(TWO_PI*0.75, 0.2, 0.9)
    //rotate(QUARTER_PI)一圈的角度是2pi
    
    push()
    rotate(QUARTER_PI*0.2)//
    drawGrid(20);
    pop()

    push()
    translate(width*0.5, height*0.5)
    rotate(QUARTER_PI)//
    drawGrid(20);
    rect(0, 0,100,100)
    pop()
}5

function drawGrid(numlines){

    for(let y = 0; y <= numlines; y++){

        line(0, y*height/numlines,width,y*height/numlines)//line(x1,y1,x2,y2)
    }
    for(let x = 0; x <= numlines; x++){

        line( x*width/numlines, 0, x*width/numlines, height)
    }
}

//arc方法