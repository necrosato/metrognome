class Metronome {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.isPlaying = false;
    this.currentNote = 0;
    this.nextNoteTime = 0;
    this.intervalId = null;
    this.scheduleAheadTime = 0.1; // Seconds
    this.lookahead = 25.0; // Milliseconds
    this.sequence = [];
    this.currentMeasure = 0;
  }

  addMeasure(tempo, timeSignature, tones) {
    this.sequence.push({
      tempo: tempo,
      timeSignature: timeSignature,
      tones: tones
    });
  }

  editMeasure(index, tempo, timeSignature, tones) {
    if (this.sequence[index]) {
      this.sequence[index] = {
        tempo: tempo,
        timeSignature: timeSignature,
        tones: tones
      };
    }
  }

  deleteMeasure(index) {
    if (this.sequence[index]) {
      this.sequence.splice(index, 1);
    }
  }

  saveSequence() {
    localStorage.setItem('metronomeSequence', JSON.stringify(this.sequence));
    alert('Sequence saved!');
  }

  loadSequence() {
    const savedSequence = JSON.parse(localStorage.getItem('metronomeSequence'));
    if (savedSequence) {
      this.sequence = savedSequence;
      this.renderMeasures();
      alert('Sequence loaded!');
    } else {
      alert('No sequence found to load.');
    }
  }

  play() {
    if (this.sequence.length === 0) {
      alert('No measures in the sequence!');
      return;
    }
    this.isPlaying = true;
    this.currentMeasure = 0;
    this.currentNote = 0;
    this.nextNoteTime = this.audioContext.currentTime;
    this.intervalId = setInterval(() => this.scheduler(), this.lookahead);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) clearInterval(this.intervalId);
  }

  nextNote() {
    const currentMeasureData = this.sequence[this.currentMeasure];
    const beatsPerMeasure = currentMeasureData.timeSignature[0];
    const secondsPerBeat = 60.0 / currentMeasureData.tempo;

    this.nextNoteTime += secondsPerBeat;
    this.currentNote++;
    if (this.currentNote === beatsPerMeasure) {
      this.currentNote = 0;
      this.currentMeasure = (this.currentMeasure + 1) % this.sequence.length;
    }
  }

  scheduler() {
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.playNote();
      this.nextNote();
    }
  }

  playNote() {
    const currentMeasureData = this.sequence[this.currentMeasure];
    const tone = currentMeasureData.tones[this.currentNote];

    const osc = this.audioContext.createOscillator();
    osc.frequency.value = tone;
    osc.connect(this.audioContext.destination);
    osc.start(this.nextNoteTime);
    osc.stop(this.nextNoteTime + 0.1);
  }

  renderMeasures() {
    const measuresContainer = document.getElementById('measures');
    measuresContainer.innerHTML = '';
    this.sequence.forEach((measure, index) => {
      const measureDiv = document.createElement('div');
      measureDiv.className = 'measure';
      measureDiv.textContent = `Measure ${index + 1} - Tempo: ${measure.tempo}, Time Signature: ${measure.timeSignature[0]}/${measure.timeSignature[1]}, Tones: ${measure.tones.join(', ')}`;
      
      const editButton = document.createElement('button');
      editButton.textContent = 'Edit';
      editButton.onclick = () => this.editMeasurePrompt(index);
      
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = () => {
        this.deleteMeasure(index);
        this.renderMeasures();
      };

      measureDiv.appendChild(editButton);
      measureDiv.appendChild(deleteButton);
      measuresContainer.appendChild(measureDiv);
    });
  }

  editMeasurePrompt(index) {
    const measure = this.sequence[index];
    const tempo = parseInt(prompt('Enter new tempo:', measure.tempo), 10);
    const beatsPerMeasure = parseInt(prompt('Enter new numerator of time signature:', measure.timeSignature[0]), 10);
    const noteValue = parseInt(prompt('Enter new denominator of time signature:', measure.timeSignature[1]), 10);

    const tones = [];
    for (let i = 0; i < beatsPerMeasure; i++) {
      const tone = parseFloat(prompt(`Enter frequency for beat ${i + 1}:`, measure.tones[i]));
      tones.push(tone);
    }

    this.editMeasure(index, tempo, [beatsPerMeasure, noteValue], tones);
    this.renderMeasures();
  }
}

const metronome = new Metronome();

document.getElementById('start').addEventListener('click', () => {
  if (!metronome.isPlaying) metronome.play();
});

document.getElementById('stop').addEventListener('click', () => {
  metronome.stop();
});

document.getElementById('add-measure').addEventListener('click', () => {
  const tempo = parseInt(prompt('Enter tempo for this measure:', '120'), 10);
  const beatsPerMeasure = parseInt(prompt('Enter the numerator of the time signature:', '4'), 10);
  const noteValue = parseInt(prompt('Enter the denominator of the time signature:', '4'), 10);

  const tones = [];
  for (let i = 0; i < beatsPerMeasure; i++) {
    const tone = parseFloat(prompt(`Enter frequency for beat ${i + 1}:`, '440'));
    tones.push(tone);
  }

  metronome.addMeasure(tempo, [beatsPerMeasure, noteValue], tones);
  metronome.renderMeasures();
});

document.getElementById('save-sequence').addEventListener('click', () => {
  metronome.saveSequence();
});

document.getElementById('load-sequence').addEventListener('click', () => {
  metronome.loadSequence();
});

