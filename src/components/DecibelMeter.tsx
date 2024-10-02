"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./DecibelMeter.module.css";

interface NoiseLevel {
  color: string;
  label: string;
}

const DecibelMeter: React.FC = () => {
  const [db, setDb] = useState<number | string>("-");
  const [offset, setOffset] = useState<number>(30);
  const [refreshRate, setRefreshRate] = useState<number>(100);
  const [isAudioInitialized, setIsAudioInitialized] = useState<boolean>(false);
  const [noiseLevel, setNoiseLevel] = useState<NoiseLevel>({
    color: "green",
    label: "Quiet",
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const initAudio = async () => {
    try {
      const AudioContext = window.AudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      setIsAudioInitialized(true);
      updateDb();
    } catch (error) {
      console.error("Error initializing audio:", error);
    }
  };

  const updateDb = () => {
    if (!analyserRef.current) return;

    const currentTime = performance.now();
    if (currentTime - lastUpdateTimeRef.current < refreshRate) {
      animationFrameRef.current = requestAnimationFrame(updateDb);
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

    const refLevel = 1;

    const dbValue = 20 * Math.log10(Math.max(average, 1) / refLevel) + offset;
    const roundedDb = Math.max(Math.round(dbValue), 0);

    console.log(
      "Raw frequency data (first 10 values):",
      dataArray.slice(0, 10)
    );
    console.log("Average frequency value:", average);
    console.log("Calculated dB value (with offset):", dbValue);
    console.log("Rounded dB value:", roundedDb);

    setDb(roundedDb);
    setNoiseLevel(getNoiseLevel(roundedDb));

    lastUpdateTimeRef.current = currentTime;
    animationFrameRef.current = requestAnimationFrame(updateDb);
  };

  const getNoiseLevel = (decibels: number): NoiseLevel => {
    if (decibels < 50) {
      return { color: "green", label: "Quiet" };
    } else if (decibels >= 50 && decibels < 70) {
      return { color: "yellow", label: "Moderate" };
    } else if (decibels >= 70 && decibels < 90) {
      return { color: "orange", label: "Loud" };
    } else {
      return { color: "red", label: "Very Loud" };
    }
  };

  useEffect(() => {
    if (isAudioInitialized) {
      updateDb();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAudioInitialized]);

  useEffect(() => {
    if (isAudioInitialized) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      lastUpdateTimeRef.current = 0;
      updateDb();
    }
  }, [offset, refreshRate]);

  return (
    <div className={styles.decibelMeter}>
      <h1>Decibel Meter</h1>
      {!isAudioInitialized ? (
        <button className={styles.startButton} onClick={initAudio}>
          Start Decibel Meter
        </button>
      ) : (
        <div className={styles.mainInputs}>
          <main>
            <h2>
              Current: <span style={{ color: noiseLevel.color }}>{db}</span> dB
            </h2>
            <h3>
              Noise Level:{" "}
              <span style={{ color: noiseLevel.color }}>
                {noiseLevel.label}
              </span>
            </h3>
            <div
              className={styles.visuals}
              style={{
                width: `${
                  typeof db === "number" ? Math.min((db * 2) / 10, 100) : 0
                }%`,
                background: noiseLevel.color,
              }}
            ></div>
          </main>
          <div className={styles.inputs}>
            <div className={styles.input}>
              <label htmlFor="offset">Offset value: {offset} dB</label>
              <br />
              <input
                type="range"
                min="0"
                max="100"
                value={offset}
                onChange={(e) => setOffset(Number(e.target.value))}
                className={styles.slider}
                id="offset"
              />
              <input
                type="number"
                value={offset}
                onChange={(e) => setOffset(Number(e.target.value))}
                className={styles.numberInput}
              />
            </div>
            <div className={styles.input}>
              <label htmlFor="refresh_rate">
                Refresh every: {refreshRate} ms
              </label>
              <br />
              <input
                type="range"
                min="100"
                max="2000"
                value={refreshRate}
                onChange={(e) => setRefreshRate(Number(e.target.value))}
                className={styles.slider}
                id="refresh_rate"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecibelMeter;
