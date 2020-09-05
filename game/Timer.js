class Timer {
  /**
   * @param {number} initialTime the initial time set in seconds
   * @param {function onTick(currentTime)} onTick function that will be called everytime the timer ticks.
   */
  constructor(initialTime, onTick = null) {
    this.initialTime = initialTime;
    this.currentTime = initialTime;
    this.isFinished = false;
    this.onTick = onTick;
  }

  start() {
    this.timerId = setInterval(() => {
      if (this.currentTime <= 0) {
        this.isFinished = true;
        this.stop();
        return;
      }

      this.currentTime -= 1;
      if (this.onTick) this.onTick(this.currentTime);
    }, 1000);
  }

  setOnTick(onTick) {
    this.onTick = onTick;
  }

  stop() {
    clearTimeout(this.timerId);
  }

  isFinished() {
    return this.isFinished;
  }
}

module.exports = Timer;
