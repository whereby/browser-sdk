export default function fakeAudioStream() {
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const destination = audioCtx.createMediaStreamDestination();
    oscillator.connect(destination);
    oscillator.frequency.value = 400;
    oscillator.type = "sine";
    setInterval(() => {
        if (oscillator.frequency.value <= 900) {
            oscillator.frequency.value += 10;
        } else {
            oscillator.frequency.value = 200;
        }
    }, 20);
    oscillator.start();
    return destination.stream;
}
