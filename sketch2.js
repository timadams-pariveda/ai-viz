var mic, soundFile;
var fft, amplitude;
var smoothing = 0.9;
var binCount = 8192;
var total = 0;
var particles = new Array(0);
let audioStarted = false;
let silenceFlag = true;
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

function setup() {
    c = createCanvas(window.innerWidth, window.innerHeight);
    noStroke();

    getAudioContext().suspend();

    mic = new p5.AudioIn();
    console.log(mic.getSources())
    mic.start();
    fft = new p5.FFT(smoothing, binCount);
    fft.setInput(mic);


    // for (var i = 0; i < particles.length; i++) {
    //     var position = createVector(configs[mode].width(width), configs[mode].height(height), i);
    //     //console.log("Position vector: " + position)
    //     particles[i] = new Particle(position);
    // }
}

function draw() {
    //energy[0] = bass, energy[1] = lowMid, energy[2] = mid  ... 
    let energy = [fft.getEnergy("bass"), fft.getEnergy("lowMid"), fft.getEnergy("mid"), fft.getEnergy("highMid"), fft.getEnergy("treble")]
    background(energy[0], energy[2], energy[4], 255);
    var spectrum = fft.analyze(binCount);   // amplitude at each frequency bin
    var volume = (energy[0] + energy[1] + energy[2] + energy[3] + energy[4]) / 5;

    if (volume > 20 && silenceFlag === true) {
        for (var i = 0; i < 32; i++) {
            if (total < 8192) {
                var position = createVector(configs[mode].width(width), configs[mode].height(height), total);
                particles.push(new Particle(position));    
                total += 1;
            }
        }
        silenceFlag = false;
    }
    else if (volume > 20) {
        for (var i = 0; i < 32; i++) {
            particles[total - 32 + i].updateNew(i, volume);
            particles[total - 32 + i].draw();
        }
        for (var i = 0; i < total - 32; i++) {
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

    if (!audioStarted) {
        textSize(32)
        fill(255)
        text("Tap to begin...", window.innerWidth / 2 - 100, window.innerHeight / 2)
    }
}

// Particle functions

var Particle = function(position) {
    this.position = position;
    this.endPositionX = position.x;
    this.speedScale = 1; // Will adjust based on how loud the sound is
    //this.scale = 0.05;      // how big or small particles are
    //this.yScale = random(0, 0.5); // more or less vertical movement
    this.color = [random(0, 255), random(0, 255), random(0, 255)];
    //this.colorScale = random(0,5);
    //this.alpha = 255;   // testing alpha variable
}

Particle.prototype.draw = function() {
    noFill();
    stroke(this.color);
    //line(this.position.x, this.position.y, this.endPositionX, this.position.y);
    //circle(this.position.x, this.position.y, 3);
    strokeWeight(3);
    bezier(this.position.x, this.position.y, this.endPositionX - 5, this.position.y + random(-100, 100), this.endPositionX - 10, this.position.y + random(-100, 100), this.endPositionX - 15, this.position.y);
}

Particle.prototype.update = function(frequency, level) {
    this.endPositionX += this.speedScale;
    this.position.x += this.speedScale;
}

Particle.prototype.updateNew = function(frequency, level) {
    if ((level / 7) > this.speedScale) {
        this.speedScale = level / 7;
    }
    if (level > 1) {
        this.endPositionX += this.speedScale;
    }
    else {
        this.endPositionX += this.speedScale;
        this.position.x += this.speedScale;
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