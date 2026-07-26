import { Bet, CommentaryMessage, Horse, RaceTrack, SimulatedRunner } from '../../types';
import { calculateRaceOdds } from './utils';

export interface RunnerTelemetryFrame {
  horseId: string;
  positionX: number;
  currentSpeed: number;
  currentEnergy: number;
  strideFrame: number;
  isSurging: boolean;
  rank: number;
  finishTime: number | null;
}

export interface TelemetryFrame {
  frameIndex: number;
  timestampSeconds: number;
  cameraTargetX: number;
  zoomFactor: number;
  leadHorseId: string | null;
  runners: RunnerTelemetryFrame[];
}

export interface RaceEngineResponseJson {
  success?: boolean;
  winner?: {
    id: string;
    name: string;
    timeSeconds: string;
    time: string;
  };
  raceDetails?: {
    trackType: string;
    distance: string;
    weather: string;
  };
  results?: any[];
  replayData?: any;
  raceId: string;
  timestamp: string;
  engineVersion: string;
  track: RaceTrack;
  allHorses?: Horse[];
  entriesCount: number;
  maxGateCapacity: number;
  seed: number;
  finishOrder: {
    rank: number;
    horseId: string;
    horseName: string;
    coatColor: string;
    jockeySilksColor: string;
    finishTimeSeconds: number;
    prizeWon: number;
    isPlayerHorse: boolean;
  }[];
  userHorseEarningsTotal: number;
  betsWonTotal: number;
  totalDurationSeconds: number;
  fps: number;
  totalFrames: number;
  commentaryHistory: CommentaryMessage[];
  telemetryFrames: TelemetryFrame[];
  betsPlaced: Bet[];
}

const BASE_TOP_SPEED_MPS = 17.5;
const LANE_HEIGHT = 28;

/**
 * Deterministically simulates a full horse race tick-by-tick and compiles a complete JSON payload
 * containing finish results, financial calculations, commentary logs, and frame-by-frame telemetry.
 */
export function simulateFullRaceJson(
  track: RaceTrack,
  allRaceHorses: Horse[],
  playerHorseIds: string[],
  bets: Bet[] = []
): RaceEngineResponseJson {
  const raceId = `race_api_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const timestamp = new Date().toISOString();
  const oddsMap = calculateRaceOdds(allRaceHorses, track);

  // Initialize runners
  let runners: SimulatedRunner[] = allRaceHorses.map((horse, idx) => ({
    horse,
    lane: idx,
    positionX: 0,
    positionY: idx * LANE_HEIGHT,
    targetY: idx * LANE_HEIGHT,
    currentSpeed: 0,
    currentEnergy: 100,
    strideFrame: 0,
    dustParticles: [],
    burstTimer: 0,
    isSurging: false,
    finishTime: null,
    rank: idx + 1,
    odds: oddsMap[horse.id] || 5.0
  }));

  const fps = 20; // 20 telemetry ticks per second
  const dt = 1 / fps;
  let elapsed = 0;
  let isFinished = false;

  const commentaryHistory: CommentaryMessage[] = [
    {
      id: `c_start_${raceId}`,
      timestampSeconds: 0,
      text: `AND THEY'RE OFF! ${allRaceHorses.length} runners burst out of the gates at ${track.name}!`,
      type: 'start'
    }
  ];

  const telemetryFrames: TelemetryFrame[] = [];
  let prevLeadId: string | null = runners[0]?.horse.id || null;

  // Frame 0 at gates (t = 0s)
  telemetryFrames.push({
    frameIndex: 0,
    timestampSeconds: 0,
    cameraTargetX: 0,
    zoomFactor: 1.0,
    leadHorseId: prevLeadId,
    runners: runners.map((r, idx) => ({
      horseId: r.horse.id,
      positionX: 0,
      currentSpeed: 0,
      currentEnergy: 100,
      strideFrame: 0,
      isSurging: false,
      rank: idx + 1,
      finishTime: null
    }))
  });

  // Max cap safeguard: 120 seconds max simulation time
  let frameIndex = 1;
  while (!isFinished && elapsed < 120) {
    const trackDistance = track.distanceMeters;

    // Advance each runner
    runners = runners.map((runner) => {
      if (runner.finishTime !== null) {
        return {
          ...runner,
          positionX: runner.positionX + runner.currentSpeed * dt * 0.25
        };
      }

      const { speed, stamina, temperament } = runner.horse.stats;
      const agility = runner.horse.stats.agility ?? runner.horse.stats.cornering ?? 75;
      const statSpeedFactor = 0.75 + (speed / 100) * 0.45;
      let targetSpeed = BASE_TOP_SPEED_MPS * statSpeedFactor;

      // Energy drain
      const staminaDrainRate = (1.1 - (stamina / 100) * 0.5) * (targetSpeed / BASE_TOP_SPEED_MPS) * dt * 3.5;
      const newEnergy = Math.max(0, runner.currentEnergy - staminaDrainRate);

      if (newEnergy < 20) {
        const fatigueFactor = 0.5 + (newEnergy / 20) * 0.5;
        targetSpeed *= fatigueFactor;
      }

      let isSurging = runner.isSurging;
      let burstTimer = runner.burstTimer - dt;
      const distRemaining = trackDistance - runner.positionX;
      const isFinalStretch = distRemaining <= 300;

      if (burstTimer <= 0) {
        // Simple deterministic pseudo-random roll using runner id & frame
        const pseudoRandom = Math.sin(frameIndex * 997 + runner.lane * 131) * 0.5 + 0.5;
        const surgeChance = (temperament / 100) * (isFinalStretch ? 0.35 : 0.08);
        if (pseudoRandom < surgeChance) {
          isSurging = true;
          burstTimer = 1.5 + pseudoRandom * 2.5;
        } else {
          isSurging = false;
          burstTimer = 2.0 + pseudoRandom * 3.0;
        }
      }

      if (isSurging) {
        targetSpeed *= 1.12 + (temperament / 100) * 0.08;
      }

      // Drafting
      const isDrafting = runners.some(
        (other) =>
          other.horse.id !== runner.horse.id &&
          other.positionX > runner.positionX &&
          other.positionX - runner.positionX < 3.5 &&
          Math.abs(other.lane - runner.lane) <= 1
      );

      if (isDrafting && newEnergy > 10) {
        targetSpeed *= 1.04;
      }

      const accelRate = 4.0 + (agility / 100) * 6.0;
      let currentSpeed = runner.currentSpeed;
      if (currentSpeed < targetSpeed) {
        currentSpeed = Math.min(targetSpeed, currentSpeed + accelRate * dt);
      } else {
        currentSpeed = Math.max(targetSpeed, currentSpeed - accelRate * 0.5 * dt);
      }

      const newPosX = runner.positionX + currentSpeed * dt;
      let finishTime = runner.finishTime;
      if (newPosX >= trackDistance && finishTime === null) {
        finishTime = elapsed;
      }

      const strideStep = (currentSpeed / 8) * dt * 15;
      const strideFrame = (runner.strideFrame + strideStep) % 8;

      return {
        ...runner,
        positionX: newPosX,
        currentSpeed,
        currentEnergy: newEnergy,
        strideFrame,
        burstTimer,
        isSurging,
        finishTime
      };
    });

    // Compute Ranks
    const sortedRunners = [...runners].sort((a, b) => {
      if (a.finishTime !== null && b.finishTime !== null) {
        return a.finishTime - b.finishTime;
      }
      if (a.finishTime !== null) return -1;
      if (b.finishTime !== null) return 1;
      return b.positionX - a.positionX;
    });

    sortedRunners.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    const leader = sortedRunners[0];
    const newLeadId = leader ? leader.horse.id : null;
    allFinishedCheck: isFinished = runners.every((r) => r.finishTime !== null);

    elapsed += dt;

    // Commentary
    if (leader && newLeadId !== prevLeadId && elapsed > 2.0 && !isFinished) {
      commentaryHistory.push({
        id: `c_lead_${elapsed.toFixed(1)}_${frameIndex}`,
        timestampSeconds: elapsed,
        text: `${leader.horse.name} charges ahead into 1st place! (${elapsed.toFixed(1)}s)`,
        type: 'lead_change'
      });
      prevLeadId = newLeadId;
    }

    const distRemaining = trackDistance - (leader ? leader.positionX : 0);
    if (distRemaining <= 250 && distRemaining > 230 && commentaryHistory.every((c) => c.type !== 'stretch')) {
      const secondPlace = sortedRunners[1];
      const gap = secondPlace ? (leader.positionX - secondPlace.positionX).toFixed(1) : '0';
      commentaryHistory.push({
        id: `c_stretch_${elapsed.toFixed(1)}_${frameIndex}`,
        timestampSeconds: elapsed,
        text: `HOMESTRETCH! ${leader.horse.name} leads by ${gap} meters!`,
        type: 'stretch'
      });
    }

    if (isFinished) {
      const winner = sortedRunners[0];
      commentaryHistory.push({
        id: `c_finish_${raceId}`,
        timestampSeconds: elapsed,
        text: `VICTORY! ${winner.horse.name} crosses the finish line FIRST in ${winner.finishTime?.toFixed(2)}s!`,
        type: 'finish'
      });
    }

    // Capture telemetry frame
    telemetryFrames.push({
      frameIndex,
      timestampSeconds: elapsed,
      cameraTargetX: leader ? leader.positionX : 0,
      zoomFactor: distRemaining < 150 ? 1.15 : 1.0,
      leadHorseId: newLeadId,
      runners: runners.map((r) => ({
        horseId: r.horse.id,
        positionX: r.positionX,
        currentSpeed: r.currentSpeed,
        currentEnergy: r.currentEnergy,
        strideFrame: r.strideFrame,
        isSurging: r.isSurging,
        rank: r.rank,
        finishTime: r.finishTime
      }))
    });

    frameIndex++;
  }

  // Calculate final ranking & prize distribution
  const finalSorted = [...runners].sort((a, b) => (a.finishTime || 999) - (b.finishTime || 999));
  const purse = track.purseTotal;

  // Prize split: 1st: 60%, 2nd: 25%, 3rd: 15%
  const prizeDistribution = [0.6, 0.25, 0.15];
  let userHorseEarningsTotal = 0;

  const finishOrder = finalSorted.map((runner, index) => {
    const rank = index + 1;
    const isPlayerHorse = playerHorseIds.includes(runner.horse.id);
    const prizeRatio = prizeDistribution[index] || 0;
    const prizeWon = Math.round(purse * prizeRatio);

    if (isPlayerHorse) {
      userHorseEarningsTotal += prizeWon;
    }

    return {
      rank,
      horseId: runner.horse.id,
      horseName: runner.horse.name,
      coatColor: runner.horse.coatColor,
      jockeySilksColor: runner.horse.jockeySilksColor,
      finishTimeSeconds: runner.finishTime || elapsed,
      prizeWon,
      isPlayerHorse
    };
  });

  // Calculate Betting Payouts
  let betsWonTotal = 0;
  const winner = finishOrder[0];
  const second = finishOrder[1];
  const third = finishOrder[2];

  bets.forEach((b) => {
    let won = false;
    if (b.type === 'Win' && b.horseId === winner?.horseId) won = true;
    if (b.type === 'Place' && (b.horseId === winner?.horseId || b.horseId === second?.horseId)) won = true;
    if (
      b.type === 'Show' &&
      (b.horseId === winner?.horseId || b.horseId === second?.horseId || b.horseId === third?.horseId)
    ) {
      won = true;
    }

    if (won) {
      betsWonTotal += Math.round(b.amount * b.oddsDecimal);
    }
  });

  const winnerHorse = finishOrder[0];
  const winnerTimeSec = winnerHorse ? winnerHorse.finishTimeSeconds : 0;
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = (secs % 60).toFixed(2);
    return `${mins}:${remainder.padStart(5, '0')}`;
  };

  const winnerObj = winnerHorse
    ? {
        id: winnerHorse.horseId,
        name: winnerHorse.horseName,
        timeSeconds: winnerTimeSec.toFixed(2),
        time: formatTime(winnerTimeSec)
      }
    : { id: '', name: 'Unknown', timeSeconds: '0.00', time: '0:00.00' };

  const results = finishOrder.map((f, idx) => {
    const fullHorse = allRaceHorses.find((h) => h.id === f.horseId) || {
      id: f.horseId,
      name: f.horseName,
      runningStyle: 'Presser'
    };
    const margin = idx === 0 ? 'Winner' : `+${(f.finishTimeSeconds - winnerTimeSec).toFixed(2)}s`;
    return {
      place: f.rank,
      horse: fullHorse,
      finalTime: formatTime(f.finishTimeSeconds),
      margin,
      tacticalNotes: [
        `Prizemoney: $${f.prizeWon.toLocaleString()}`,
        f.isPlayerHorse ? 'Player Stable Horse' : 'AI Competitor'
      ]
    };
  });

  const raceDetails = {
    trackType: track.surface || 'Turf',
    distance: `${track.distanceMeters}m`,
    weather: track.condition || 'Clear'
  };

  const replayData = {
    furlongTicks: telemetryFrames,
    horseReplays: telemetryFrames.reduce((acc: any, frame) => {
      frame.runners.forEach((r) => {
        if (!acc[r.horseId]) acc[r.horseId] = [];
        acc[r.horseId].push(r);
      });
      return acc;
    }, {})
  };

  return {
    success: true,
    winner: winnerObj,
    raceDetails,
    results,
    replayData,
    raceId,
    timestamp,
    engineVersion: '1.0.0-multiplayer-api',
    track,
    allHorses: allRaceHorses,
    entriesCount: allRaceHorses.length,
    maxGateCapacity: allRaceHorses.length,
    seed: Math.floor(Math.random() * 1000000),
    finishOrder,
    userHorseEarningsTotal,
    betsWonTotal,
    totalDurationSeconds: Math.round(elapsed * 100) / 100,
    fps,
    totalFrames: telemetryFrames.length,
    commentaryHistory,
    telemetryFrames,
    betsPlaced: bets
  };
}

/**
 * Client helper to request simulation JSON from Express server API with local fallback
 */
export async function requestRaceEngineApi(
  track: RaceTrack,
  allRaceHorses: Horse[],
  playerHorseIds: string[],
  bets: Bet[] = []
): Promise<RaceEngineResponseJson> {
  try {
    let res = await fetch('/api/grandturf/race/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track, allRaceHorses, playerHorseIds, bets })
    });

    if (!res.ok) {
      res = await fetch('/api/race/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track, allRaceHorses, playerHorseIds, bets })
      });
    }

    if (res.ok) {
      const data = await res.json();
      if (data && data.raceId && data.telemetryFrames) {
        return data as RaceEngineResponseJson;
      }
    }
  } catch (err) {
    console.warn('API route call fallback to local engine simulation:', err);
  }

  // Fallback to client-side engine simulation
  return simulateFullRaceJson(track, allRaceHorses, playerHorseIds, bets);
}
