var mic, soundFile;
var fft, amplitude;
var smoothing = 0.9;
var binCount = 8192;
var total = 0;
var particles = new Array(0);
let audioStarted = false;
let silenceFlag = true;
let oilEruption = false;
var eruptions = new Array(0);
let landImage, waterImage;
let configs = {
    test: {
        width: (x) => 0,
        height: (x) => random(x),
        speedScale: () => 1,    // change based on volume
        orientation: "x",
        direction: 1
    }
}
mode = "test"

function preload() {
    landImage = loadImage('./media/Land_Seismic_Picture.png')
}

function setup() {
    c = createCanvas(window.innerWidth, window.innerHeight);
    noStroke();

    getAudioContext().suspend();

    mic = new p5.AudioIn();
    console.log(mic.getSources())
    mic.start();
    fft = new p5.FFT(smoothing, binCount);
    fft.setInput(mic);

    image(landImage, 0, 0, width, height, 0, 0, landImage.width, landImage.height, CONTAIN);
    describe("Seismic diagram used to show how seismic waves can be used to find oil");
}

function draw() {
    //energy[0] = bass, energy[1] = lowMid, energy[2] = mid  ... 
    let energy = [fft.getEnergy("bass"), fft.getEnergy("lowMid"), fft.getEnergy("mid"), fft.getEnergy("highMid"), fft.getEnergy("treble")]
    background(energy[0], energy[2], energy[4], 255);
    var spectrum = fft.analyze(binCount);   // amplitude at each frequency bin
    var volume = (energy[0] + energy[1] + energy[2] + energy[3] + energy[4]) / 5;

    image(landImage, 0, 0, width, height);

    // <<----- ORIGINAL LINE DRAWINGS, CAN BE DELETED IF NO MORE TESTING REQUIRED ----->> 

    // noFill();
    // stroke(255,255,255);
    // strokeWeight(3);
    //line(width*0.108, height*0.238, width*0.28, height*0.898);   // far left
    //line(width*0.108, height*0.238, width*0.305, height*0.886);
    //line(width*0.108, height*0.238, width*0.33, height*0.875);
    //line(width*0.108, height*0.238, width*0.355, height*0.864);
    //line(width*0.108, height*0.238, width*0.38, height*0.854);
    //line(width*0.108, height*0.238, width*0.4075, height*0.838);
    //line(width*0.108, height*0.238, width*0.435, height*0.820);
    //line(width*0.108, height*0.238, width*0.462, height*0.803);  // far right

    // stroke(205,205,205);
    // strokeWeight(3)
    // line(width*0.28, height*0.898, width*0.507, height*0.241);
    // line(width*0.305, height*0.886, width*0.545, height*0.241);
    // line(width*0.33, height*0.875, width*0.5835, height*0.241);
    // line(width*0.355, height*0.864, width*0.622, height*0.241);
    // line(width*0.38, height*0.854, width*0.6605, height*0.241);
    // line(width*0.4075, height*0.838, width*0.699, height*0.241);
    // line(width*0.435, height*0.820, width*0.7373, height*0.241);
    // line(width*0.462, height*0.803, width*0.776, height*0.241);

    // noFill();
    // stroke(120,120,120);
    // strokeWeight(15);
    // line(width*0.4, height*0.21, width*0.4, height);
    
    // Create particles (lines) when mic input is received
    if (volume > 10 && silenceFlag === true) {
        for (var i = 0; i < 8; i++) {
            if (total < 8192) {
                var position = createVector(width*0.108, height*0.238, total);
                particles.push(new Particle(position, i));    
                total += 1;
            }
        }
        silenceFlag = false;
    }
    else if (volume > 10) {
        for (var i = 0; i < 8; i++) {       // this loop accounts for lines being actively drawn
            particles[total - 8 + i].updateNew(i, volume);
            particles[total - 8 + i].draw();
        }
        for (var i = 0; i < total - 8; i++) {   // this loop accounts for all others
            particles[i].update(i, volume);
            particles[i].draw();
        }
    }
    else {
        for (var i = 0; i < total; i++) {
            particles[i].update(i, volume);
            particles[i].draw();
        }
        silenceFlag = true;
    }

    // draw oil eruption
    if (oilEruption) {
        for (var i = 0; i < eruptions.length; i++) {
            eruptions[i]
        }
        stroke(0,0,0);
        strokeWeight(8);
        line(width*0.4, height*0.1, width*0.4, height);
    }

    if (!audioStarted) {
        textSize(32);
        fill(255);
        stroke(0,0,200);
        strokeWeight(3);
        text("Tap to begin...", window.innerWidth / 2 - 100, window.innerHeight / 2);
    }
}

// Key pressed function and oil eruption event

var Eruption = function(position) {
    this.position = position;
    this.endPositionY = position.y;
    this.maxHeight = height*0.1;
    this.color = [0,0,0];
}

// document.addEventListener('keydown', function(event) {
//     if (event.key === ' ') {
//         if (oilEruption) {
//             oilEruption = false;
//         }
//         else {
//             oilEruption = true;
//             var position = createVector(width*0.4, height);
//             eruptions.push(new Eruption(position));
//         }
//     }
// });

// Particle functions

var Particle = function(position, i) {
    this.position = position;
    this.endPositionX = position.x;
    this.endPositionY = position.y;
    this.reflectPositionX = position.x;
    this.reflectPositionY = position.y;
    this.speedScale = 1; // Will adjust based on how loud the sound is
    this.reflect = false;
    this.maxHeight = height*0.241;
    this.maxWidth = width/2;
    this.color = [i*40,0,0];
    switch(i) {
        case 0:
            this.slope = 3.84 * (height / width); this.reflectSlope = -2.895 * (height / width);
            this.minWidth = width*0.28; this.minHeight = height*0.898; this.maxWidth = width*0.507; break;
        case 1:
            this.slope = 3.29 * (height / width); this.reflectSlope = -2.69 * (height / width);
            this.minWidth = width*0.305; this.minHeight = height*0.886; this.maxWidth = width*0.545; break;
        case 2:
            this.slope = 2.87 * (height / width); this.reflectSlope = -2.5 * (height / width);
            this.minWidth = width*0.33; this.minHeight = height*0.875; this.maxWidth = width*0.5835; break;
        case 3:
            this.slope = 2.535 * (height / width); this.reflectSlope = -2.334 * (height / width);
            this.minWidth = width*0.355; this.minHeight = height*0.864; this.maxWidth = width*0.622; break;
        case 4: 
            this.slope = 2.265 * (height / width); this.reflectSlope = -2.186 * (height / width);
            this.minWidth = width*0.38; this.minHeight = height*0.854; this.maxWidth = width*0.6605; break;
        case 5:
            this.slope = 2.003 * (height / width); this.reflectSlope = -2.05 * (height / width);
            this.minWidth = width*0.4075; this.minHeight = height*0.838; this.maxWidth = width*0.699; break;
        case 6:
            this.slope = 1.778 * (height / width); this.reflectSlope = -1.92 * (height / width);
            this.minWidth = width*0.435; this.minHeight = height*0.820; this.maxWidth = width*0.7373; break;
        case 7:
            this.slope = 1.595 * (height / width); this.reflectSlope = -1.79 * (height / width);
            this.minWidth = width*0.462; this.minHeight = height*0.803; this.maxWidth = width*0.776; break;
        default:
            this.slope = 3.84 * (height / width); this.reflectSlope = -2.895 * (height / width);
            this.minWidth = width*0.28; this.minHeight = height*0.898;
    }
}

Particle.prototype.draw = function() {
    if (this.endPositionY >= this.minHeight && !this.reflect) {
        this.reflect = true;
        this.endPositionX = this.minWidth;
        this.endPositionY = this.minHeight;
        this.reflectPositionX = this.endPositionX;
        this.reflectPositionY = this.endPositionY;
    }
    if (this.position.y <= this.minHeight) {
        stroke(this.color);
        strokeWeight(3);
        line(this.position.x, this.position.y, this.endPositionX, this.endPositionY);
    }
    if (this.reflect && this.endPositionY >= this.maxHeight) {
        if (this.reflectPositionY <= this.maxHeight) {
            this.reflectPositionX = this.maxWidth;
            this.reflectPositionY = this.maxHeight;
        }
        stroke(this.color);
        strokeWeight(3);
        line(this.endPositionX, this.endPositionY, this.reflectPositionX, this.reflectPositionY);
    }
}

Particle.prototype.update = function(frequency, level) {
    if (!this.reflect) {
        this.endPositionX += this.speedScale;
        this.endPositionY += this.speedScale * this.slope;
    }
    this.position.x += this.speedScale;
    this.position.y += this.speedScale * this.slope;
    if (this.reflectPositionY >= this.maxHeight) {
        this.reflectPositionX += this.speedScale;
        this.reflectPositionY += this.speedScale * this.reflectSlope;
    }
    if (this.position.y >= this.minHeight) {    // ensures the back of reflected lines moves with the front
        this.endPositionX += this.speedScale;
        this.endPositionY += this.speedScale * this.reflectSlope;
    }
}

Particle.prototype.updateNew = function(frequency, level) {
    if ((level / 7) > this.speedScale) {
        this.speedScale = level / 7;
    }
    if (level > 1) {
        if (!this.reflect) {
            this.endPositionX += this.speedScale;
            this.endPositionY += this.speedScale * this.slope;
        }
        if (this.position.y >= this.minHeight) {
            this.endPositionX += this.speedScale;
            this.endPositionY += this.speedScale * this.slope;
        }
        this.reflectPositionX += this.speedScale;       // this doesn't need to be in an if statement because reflectPosition gets reset when this.reflect is set to true
        this.reflectPositionY += this.speedScale * this.reflectSlope;
    }
}
 
// window/input functions

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    background(0);
}

function onScreen(v) {
    return v.x >= 0 && v.x <= width && v.y >= 0 && v.y <= height;
}

function mousePressed() {
    // Start audio on user gesture
    if (!audioStarted) {
        userStartAudio();
        audioStarted = true;
    }
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        let fs = fullscreen();
        fullscreen(!fs);
    }
}