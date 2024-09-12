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
    this.renderMeasures(); // Highlight the active measure
    this.intervalId = setInterval(() => this.scheduler(), this.lookahead);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) clearInterval(this.intervalId);
    this.renderMeasures(); // Remove active measure highlight when stopped
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

    this.renderMeasures(); // Re-render the measures to update the active measure
  }

  renderMeasures() {
    const measuresContainer = document.getElementById('measures');
    measuresContainer.innerHTML = '';
    this.sequence.forEach((measure, index) => {
      const measureDiv = document.createElement('div');
      measureDiv.className = 'measure';
      measureDiv.textContent = `Measure ${index + 1} - Tempo: ${measure.tempo}, Time Signature: ${measure.timeSignature[0]}/${measure.timeSignature[1]}, Tones: ${measure.tones.join(', ')}`;
      
      // Highlight the active measure
      if (this.isPlaying && index === this.currentMeasure) {
        measureDiv.classList.add('active');
      }

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

    document.getElementById('measure-form').style.display = 'block';
    document.getElementById('measure-index').value = index;
    document.getElementById('measure-tempo').value = measure.tempo;
    document.getElementById('measure-time-signature-numerator').value = measure.timeSignature[0];
    document.getElementById('measure-time-signature-denominator').value = measure.timeSignature[1];
    document.getElementById('measure-tones').value = measure.tones.join(',');
    this.updateToneFields(measure.timeSignature[0]);
  }

  saveMeasure() {
    const index = parseInt(document.getElementById('measure-index').value);
    const tempo = parseInt(document.getElementById('measure-tempo').value, 10);
    const beatsPerMeasure = parseInt(document.getElementById('measure-time-signature-numerator').value, 10);
    const noteValue = parseInt(document.getElementById('measure-time-signature-denominator').value, 10);
    const tones = Array.from(document.querySelectorAll('.tone-input')).map(input => parseFloat(input.value));

    if (index === -1) {
      this.addMeasure(tempo, [beatsPerMeasure, noteValue], tones);
    } else {
      this.editMeasure(index, tempo, [beatsPerMeasure, noteValue], tones);
    }
    
    this.renderMeasures();
    this.clearForm();
  }

  clearForm() {
    document.getElementById('measure-index').value = -1;
    document.getElementById('measure-tempo').value = 120; // Default tempo
    document.getElementById('measure-time-signature-numerator').value = 4; // Default time signature numerator
    document.getElementById('measure-time-signature-denominator').value = 4; // Default time signature denominator
    this.updateToneFields(4); // Default to 4 beats with default tones
    document.getElementById('measure-form').style.display = 'none';
  }

  updateToneFields(beatsPerMeasure) {
    const tonesContainer = document.getElementById('tones-container');
    tonesContainer.innerHTML = '';

    for (let i = 0; i < beatsPerMeasure; i++) {
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'tone-input';
      input.value = i === 0 ? 880 : 440; // First beat is an octave higher
      tonesContainer.appendChild(input);
    }
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
  metronome.clearForm();
  document.getElementById('measure-form').style.display = 'block';
});

document.getElementById('save-sequence').addEventListener('click', () => {
  metronome.saveSequence();
});

document.getElementById('load-sequence').addEventListener('click', () => {
  metronome.loadSequence();
});

document.getElementById('save-measure').addEventListener('click', () => {
  metronome.saveMeasure();
});

document.getElementById('cancel-measure').addEventListener('click', () => {
  metronome.clearForm();
});

document.getElementById('measure-time-signature-numerator').addEventListener('input', (e) => {
  const beatsPerMeasure = parseInt(e.target.value, 10);
  metronome.updateToneFields(beatsPerMeasure);
});

