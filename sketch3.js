var mic, soundFile;
var fft, amplitude;
var smoothing = 0.9;
var binCount = 8192;
var total = 0;
var lines = new Array(0);
let audioStarted = false;
let mobileDevice = false;
let silenceFlag = true;
var eruptions = new Array(0);
let landImage, landImage2, waterImage, currImage, qrcode;
let sliderX, sliderY, sliderWidth, minVolume, maxVolume, sliderVolume, isDragging;
let buttonX, buttonY, buttonDiameter;
let fullscreenX1, fullscreenX2, fullscreenY1, fullscreenY2, isFullscreen;
let micSensitivity, sensitivityModifier;
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
    landImage = loadImage('./media/Land_Seismic_Picture.png');
    landImage2 = loadImage('./media/Land_Seismic_Picture_Transparent2.png');
    qrcode = loadImage('./media/qr_code_pariveda.png');
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
    sensitivityModifier = 0.75;  // EDIT FOR VOLUME SENSITIVITY ADJUSTMENTS [~0.1 Less variation | ~1.0 More variation]

    let details = navigator.userAgent;
    let regexp = /android|iphone|kindle|ipad/i;
    // Using test() method to search regexp in details, returns boolean value
    mobileDevice = regexp.test(details);

    currImage = landImage;

    sliderX = width * 0.71;     // Initial slider position
    sliderY = height * 0.97;
    sliderWidth = width * 0.1;  // Width of the slider track
    sliderDiameter = width * height * 0.000012;   // Diameter of the slider handle
    minVolume = 1;              // Minimum value
    maxVolume = 100;            // Maximum value
    sliderVolume = 50;          // Initial slider value
    micSensitivity = (maxVolume - sliderVolume + 1) * sensitivityModifier;
    isDragging = false;         // Not dragging initially
    buttonX = width*0.08;
    buttonY = height*0.85;
    buttonDiameter = width*height*0.00013;
    fullscreenX1 = width*0.82; fullscreenX2 = width*0.845;
    fullscreenY1 = height*0.96; fullscreenY2 = height*0.985;
    isFullscreen = false;
}

function draw() {
    //energy[0] = bass, energy[1] = lowMid, energy[2] = mid  ... 
    let energy = [fft.getEnergy("bass"), fft.getEnergy("lowMid"), fft.getEnergy("mid"), fft.getEnergy("highMid"), fft.getEnergy("treble")]
    background(energy[0], energy[2], energy[4], 255);
    var spectrum = fft.analyze(binCount);   // amplitude at each frequency bin
    var volume = (energy[0] + energy[1] + energy[2] + energy[3] + energy[4]) / 5;

    image(landImage, 0, 0, width, height);
    image(currImage, 0, 0, width, height);
    
    // Create lines when mic input is received
    if (volume > micSensitivity && silenceFlag === true) {
        for (var i = 0; i < 8; i++) {
            var position = createVector(width*0.108, height*0.238, total);
            lines.push(new Line(position, i));
            total += 1;
        }
        silenceFlag = false;
    }
    if (volume > micSensitivity && total >= 8) {
        for (var i = 0; i < 8; i++) {       // this loop accounts for lines being actively drawn
            lines[total - 8 + i].updateNew(i, volume);
            lines[total - 8 + i].draw();
        }
        for (var i = 0; i < total - 8; i++) {   // this loop accounts for all others
            lines[i].update(i, volume);
            lines[i].draw();
        }
    }
    else {
        for (var i = 0; i < total; i++) {
            lines[i].update(i, volume);
            lines[i].draw();
        }
        silenceFlag = true;
    }

    // oil pipe
    drawOilPipe();
    drawOilEruption();
    drawOilDerrick();

    if (!audioStarted) {
        textSize(width*height*0.0001);
        fill(255);
        stroke(0);
        strokeWeight(width*height*0.00001);
        text("Tap to begin...", window.innerWidth / 2, window.innerHeight / 2);
    }

    if (!mobileDevice) {
        image(qrcode, width-width*.15, height-width*.15, width*.15, width*.15);
        drawVolumeSlider();
        drawEruptionButton();
        drawFullscreenButton();
    }
    else {
        drawVolumeSliderMobile();
        drawEruptionButtonMobile();
        drawFullscreenButtonMobile();
    }
}

// Oil eruption event

var Eruption = function(position) {
    this.oilEruption = true;
    this.position = position;
    this.endPositionY = position.y;
    this.maxHeight = height*0.062;
    this.particles = new Array(0);
}

Eruption.prototype.draw = function() {
    stroke(0,0,0);
    strokeWeight(width*0.0035);
    if (this.position.y >= this.maxHeight) {
        line(this.position.x, this.position.y, this.position.x, this.endPositionY);
        if (this.endPositionY <= this.maxHeight) {
            this.particles.push(new Particle(this.position.x, this.endPositionY));
        }
    }
    if (this.endPositionY <= this.maxHeight) {
        for (var i = 0; i < this.particles.length; i++) {
            this.particles[i].update();
            this.particles[i].draw();
        }
    }
}

Eruption.prototype.update = function() {
    if (this.endPositionY > this.maxHeight) {
        this.endPositionY -= height * 0.0075;
    }
    else {
        if (this.position.y > this.maxHeight) {
            this.position.y -= height * 0.0075;
        }
        else {
            this.oilEruption = false;
        }
    }
}

// Particle fountain functions

var Particle = function(positionX, positionY) {
    this.active = true;
    this.position = createVector(positionX, positionY);
    this.diameter = random(width*0.005,width*0.01);
    this.velocity = createVector(random(-(width*0.003),width*0.003), random(-(height*0.01) ,-(height*0.005)));
    this.decay = random(width*0.0002,width*0.0003);
}

Particle.prototype.draw = function() {
    if (this.active) {
        fill(0,0,0,255);
        noStroke();
        circle(this.position.x, this.position.y, this.diameter);
    }
}

Particle.prototype.update = function() {
    if (this.diameter > 0) {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.velocity.y += height * 0.0005;
        this.diameter -= this.decay;
    }
    else {
        this.active = false;
        this.diameter = 0;
    }
}

// Line functions

var Line = function(position, i) {
    this.position = position;
    this.i = i;
    this.endPositionX = position.x;
    this.endPositionY = position.y;
    this.reflectPositionX = position.x;
    this.reflectPositionY = position.y;
    this.speedScale = 1; // Will adjust based on how loud the sound is
    this.reflect = false;
    this.maxHeight = height*0.241;
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
            this.minWidth = width*0.28; this.minHeight = height*0.898; this.maxWidth = width*0.507;
    }
}

Line.prototype.draw = function() {
    if (this.endPositionY >= this.minHeight && !this.reflect) {
        this.reflect = true;
        this.endPositionX = this.minWidth;
        this.endPositionY = this.minHeight;
        this.reflectPositionX = this.endPositionX;
        this.reflectPositionY = this.endPositionY;
        currImage = landImage2;
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
    if (this.reflect && this.position.y <= this.minHeight && this.endPositionY >= this.maxHeight) {
        currImage = landImage2;
    }
    else if (!(this.position.y < this.minHeight) && !(this.endPositionY >= this.maxHeight)) {
        currImage = landImage;
    }
}

Line.prototype.update = function(frequency, level) {
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

Line.prototype.updateNew = function(frequency, level) {
    if ((level / (micSensitivity * 0.25 + 5) > this.speedScale)) {
        this.speedScale = level / (micSensitivity * 0.25 + 5);
        console.log("Speed: " + this.speedScale);
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

    resizeObjects();
}

function resizeObjects() {
    // resize slider
    sliderX = width * 0.71;
    sliderY = height * 0.97;
    sliderWidth = width * 0.1;
    sliderDiameter = width * height * 0.000012;
    // resize button
    buttonX = width*0.08;
    buttonY = height*0.85;
    buttonDiameter = width*height*0.00013;
    // resize fullscreen button
    fullscreenX1 = width*0.82; fullscreenX2 = width*0.845;
    fullscreenY1 = height*0.96; fullscreenY2 = height*0.985;
    // remove lines / eruptions
    lines = Array(0);
    eruptions = Array(0);
    total = 0;
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
    // if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    //     let fs = fullscreen();
    //     fullscreen(!fs);
    // }
    let handleX = map(sliderVolume, minVolume, maxVolume, sliderX, sliderX + sliderWidth);
    let handleY = sliderY;
    if (mouseX >= handleX - sliderDiameter && mouseX <= handleX + sliderDiameter && mouseY >= handleY - sliderDiameter && mouseY <= handleY + sliderDiameter) {
        isDragging = true;
    }
    if (mouseX >= buttonX - buttonDiameter/2 && mouseX <= buttonX + buttonDiameter/2 && mouseY >= buttonY - buttonDiameter/2 && mouseY <= buttonY + buttonDiameter/2) {
        var position = createVector(width*0.4, height);
        eruptions.push(new Eruption(position));
    }
    if (mouseX >= fullscreenX1 && mouseX <= fullscreenX2 && mouseY >= fullscreenY1 && mouseY <= fullscreenY2) {
        let fs = fullscreen();
        fullscreen(!fs);
        if (isFullscreen) {
            isFullscreen = false;
        }
        else {
            isFullscreen = true;
        }
    }
}

function mouseDragged() {
    if (isDragging) {
        let clampedX = constrain(mouseX, sliderX, sliderX + sliderWidth);
        sliderVolume = map(clampedX, sliderX, sliderX + sliderWidth, minVolume, maxVolume);
        micSensitivity = (maxVolume - sliderVolume + 1) * sensitivityModifier;
    }
}

function mouseReleased() {
    isDragging = false;
}

document.addEventListener('keydown', function(event) {
    if (event.key === ' ') {
        var position = createVector(width*0.4, height);
        eruptions.push(new Eruption(position));
    }
});

// draw helper functions

function drawOilPipe() {
    noFill();
    stroke(120,120,120);
    strokeWeight(width*0.006);
    line(width*0.4, height*0.075, width*0.4, height);
}

function drawOilEruption() {
    for (var i = 0; i < eruptions.length; i++) {
        if (eruptions[i].oilEruption) {
            eruptions[i].update();
            eruptions[i].draw();
        }
        else if (eruptions[i].particles.some(particle => particle.active === true)) {
            eruptions[i].draw();    // ensures particle fountain doesn't just stop when the oil line stops
        }
    }
}

function drawOilDerrick() {
    stroke(60,60,60);
    strokeWeight(width*0.005);
    line(width*0.39, height*0.07, width*0.38, height*0.205);    // left beam
    line(width*0.41, height*0.07, width*0.42, height*0.205);    // right beam
    strokeWeight(height*0.01);
    line(width*0.3875, height*0.07, width*0.4125, height*0.07); // top beam
    strokeWeight(height*0.01);
    line(width*0.3825, height*0.115, width*0.4175, height*0.115)    // mid beam
    strokeWeight(height*0.012);
    line(width*0.375, height*0.205, width*0.425, height*0.205);     // platform
    strokeWeight(width*height*0.000003);
    line(width*0.3875, height*0.115, width*0.41, height*0.07);  // top cross beams
    line(width*0.39, height*0.07, width*0.4125, height*0.115);
    line(width*0.3875, height*0.115, width*0.415, height*0.15); // middle cross beams
    line(width*0.385, height*0.15, width*0.4125, height*0.115);
    line(width*0.38, height*0.201, width*0.415, height*0.15);   // bottom cross beams
    line(width*0.385, height*0.15, width*0.42, height*0.201);
    fill(60,60,60,255);
    circle(width*0.4, height*0.062, width*height*0.000002);     // top spout
    rect(width*0.3975, height*0.058, width*0.005, height*0.001);
}

function drawVolumeSlider() {
    // Slider track
    stroke(0);
    strokeWeight(width*height*0.0000024);
    line(sliderX, sliderY, sliderX + sliderWidth, sliderY);

    // Slider handle
    let handleX = map(sliderVolume, minVolume, maxVolume, sliderX, sliderX + sliderWidth);
    fill(255);
    stroke(0);
    strokeWeight(width*height*0.0000012);
    circle(handleX, sliderY, sliderDiameter);

    // Display current value
    fill(255);
    stroke(0);
    strokeWeight(width*height*0.0000012);
    textSize(width*height*0.000012);
    textAlign(CENTER, CENTER);
    text(`Microphone Sensitivity: ${sliderVolume.toFixed(0)}`, sliderX + sliderWidth / 2, sliderY * 0.97);
}

function drawVolumeSliderMobile() {
    stroke(0);
    strokeWeight(width*height*0.0000024);
    line(sliderX, sliderY, sliderX + sliderWidth, sliderY);

    let handleX = map(sliderVolume, minVolume, maxVolume, sliderX, sliderX + sliderWidth);
    fill(255);
    stroke(0);
    strokeWeight(width*height*0.000009);
    circle(handleX, sliderY, sliderDiameter*4);

    fill(255);
    stroke(0);
    strokeWeight(width*height*0.000009);
    textSize(width*height*0.00009);
    textAlign(CENTER, CENTER);
    text(`Microphone Sensitivity: ${sliderVolume.toFixed(0)}`, sliderX + sliderWidth / 2, sliderY * 0.95);
}

function drawEruptionButton() {
    fill(255,0,0,255);
    stroke(0,0,0,255);
    strokeWeight(width*height*0.0000025);
    circle(buttonX, buttonY, buttonDiameter);
    fill(255,255,255,255);
    textSize(width*height*0.000025)
    text("Click me", buttonX, buttonY);
}

function drawEruptionButtonMobile() {
    fill(255,0,0,255);
    stroke(0,0,0,255);
    strokeWeight(width*height*0.0000075);
    circle(buttonX, buttonY, buttonDiameter*3);
    fill(255,255,255,255);
    textSize(width*height*0.000075)
    text("Click me", buttonX, buttonY);
}

function drawFullscreenButton() {
    stroke(255);
    if (!isFullscreen) {    // go fullscreen
        strokeWeight(width*height*0.000002);
        line(fullscreenX1, fullscreenY1, fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY1);   // top left
        line(fullscreenX1, fullscreenY1, fullscreenX1, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX2, fullscreenY1, fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY1);   // top right
        line(fullscreenX2, fullscreenY1, fullscreenX2, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX1, fullscreenY2, fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY2);   // bottom left
        line(fullscreenX1, fullscreenY2, fullscreenX1, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX2, fullscreenY2, fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY2);   // bottom right
        line(fullscreenX2, fullscreenY2, fullscreenX2, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3);
    }
    else {  // exit fullscreen
        strokeWeight(width*height*0.0000015)
        line(fullscreenX1, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3, fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3);   // top left
        line(fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY1, fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX2, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3, fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3);   // top right
        line(fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY1, fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX1, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3, fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3);   // bottom left
        line(fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY2, fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX2, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3, fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3);   // bottom right
        line(fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY2, fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3);
    }
}

function drawFullscreenButtonMobile() {
    stroke(255);
    if (!isFullscreen) {
        strokeWeight(width*height*0.000006);
        line(fullscreenX1, fullscreenY1, fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY1);
        line(fullscreenX1, fullscreenY1, fullscreenX1, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX2, fullscreenY1, fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY1);
        line(fullscreenX2, fullscreenY1, fullscreenX2, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX1, fullscreenY2, fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY2);
        line(fullscreenX1, fullscreenY2, fullscreenX1, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX2, fullscreenY2, fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY2);
        line(fullscreenX2, fullscreenY2, fullscreenX2, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3);
    }
    else {
        strokeWeight(width*height*0.0000045)
        line(fullscreenX1, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3, fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY1, fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX2, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3, fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY1, fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY1 - (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX1, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3, fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY2, fullscreenX1 - (fullscreenX1 - fullscreenX2) / 3, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX2, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3, fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3);
        line(fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY2, fullscreenX2 + (fullscreenX1 - fullscreenX2) / 3, fullscreenY2 + (fullscreenY1 - fullscreenY2) / 3);
    }
}