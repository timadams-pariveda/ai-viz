var mic, soundFile;
var fft, amplitude;
var smoothing = 0.9;
var binCount = 1024;
var particles = new Array(binCount);
var qrcode;
let audioStarted = false;
let mobileDevice = false;
let configs = {
  original : {
    width: (x) => random(x),
    height: (x) => random(x+500),
    speedScale: () => 1,
    orientation: "y",
    direction: -1
  },
  pp24 : {
    width: (x) => 0,
    height: (x) => random(x * 0.3, x),
    speedScale: () => random(1, 3),
    orientation: "x",
    direction: 1
  }
}
mode = "original"

function setup() {
  c = createCanvas(window.innerWidth, window.innerHeight);
  noStroke();

  getAudioContext().suspend();

  soundFile = loadSound('./media/dreams.mp3');
  mic = new p5.AudioIn();
  console.log(mic.getSources());
  mic.start();
  // mic.amp(0.2);
  // soundFile.amp(0.2);
  fft = new p5.FFT(smoothing, binCount);
  fft.setInput(mic);


  for (var i = 0; i < particles.length; i++) {
    var position = createVector(configs[mode].width(width), configs[mode].height(height), i);
    particles[i] = new Particle(position);
  }

  let details = navigator.userAgent;

  /* Creating a regular expression 
  containing some mobile devices keywords 
  to search it in details string*/
  let regexp = /android|iphone|kindle|ipad/i;

  /* Using test() method to search regexp in details
  it returns boolean value*/
  mobileDevice = regexp.test(details);

  qrcode = loadImage('./media/Seeing_Sound_Demo_small.png');
}

function draw() {
  let energy=[fft.getEnergy("bass"), fft.getEnergy("lowMid"), fft.getEnergy("mid"), fft.getEnergy("highMid"), fft.getEnergy("treble")];
  background(energy[0], energy[1], energy[2], 10);
  var spectrum = fft.analyze(binCount);

  for (var i = 0; i < binCount; i++) {
    particles[i].update(i, spectrum[i]);
    particles[i].draw();
  }

  // QR CODE
  if (!mobileDevice) {
    image(qrcode, window.innerWidth-qrcode.width/3, window.innerHeight-qrcode.height/3, qrcode.width/3, qrcode.height/3);
  }
  if (!audioStarted) {
    textSize(32);
    fill(255);
    text("Tap to begin...", window.innerWidth/2-100, window.innerHeight/2);
  }

  // DEBUG
  // fill(255)
  // rect(0, 0, 100, 200)
  // for(let i = 0; i<energy.length; i++){
  //   strokeWeight(10)
  //   stroke(0)
  //   point(i*10+20, 175-energy[i])
  // }
}

var Particle = function(position) {
  this.position = position;
  this.speedScale = configs[mode].speedScale(); // Adjust this range for desired speed variation
  this.scale = random(0, 0.5); // how big or small particles are
  this.yScale = random(0, 0.5); // more or less vertical movement
  this.color = [random(0, 255), random(0, 255), random(0, 255)];
  this.colorScale = random(0,5);
}

Particle.prototype.update = function(frequency, level) {
  var warm = map(frequency, 0, 1024, 255, 0);
  var cool = map(frequency, 0, 1024, 0, 255);
  if(level*scale > 50){
    this.colorScale = -this.colorScale;
  }
  this.color[0] = warm*this.colorScale;
  this.color[1] = level*this.colorScale;
  this.color[2] = cool*this.colorScale;
  if (level * this.scale < 20) {
    this.position.z = 500;
  }

  if (configs[mode].direction === 1 ) {
    this.position[configs[mode].orientation] += this.speedScale;
  } else if (configs[mode].direction === -1 ) {
    this.position[configs[mode].orientation] -= this.speedScale;
  } else {
    this.position[configs[mode].orientation] += this.speedScale;
  }
  
  if (!onScreen(this.position)) {
    this.position.x = random(width);
    this.position.y = random(height);
  }

  // Adjust vertical position slightly based on audio level, but limit upward movement
  let verticalMovement = (level * this.yScale - 128 * this.yScale) * 0.1;
  if (verticalMovement < 0) {
    verticalMovement *= 0.1; // Reduce upward movement
  }
  this.position.y += verticalMovement;

  // Keep particle within vertical bounds, but bias towards bottom
  let minY = height * 0; // Particles can't go above 30% of screen height
  let maxY = height;
  this.position.y = constrain(this.position.y, minY, maxY);

  // Add a small chance for particles to move down
  if (random(1) < 0.05) { // 5% chance each frame
    this.position.y += random(1, 5);
  }

  this.diameter = level * this.scale;
}

Particle.prototype.draw = function() {
  fill(this.color);
  noStroke()
  ellipse(
    this.position.x, this.position.y,
    this.diameter, this.diameter
  );
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
}

function keyPressed() {
  if (key == 'T') {
    toggleInput();
  }
}

function toggleInput() {
  if (soundFile.isPlaying()) {
    soundFile.pause();
    mic.start();
    fft.setInput(mic);
  } else {
    soundFile.play();
    mic.stop();
    fft.setInput(soundFile);
  }
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