const CUSTOM_EPOCH = BigInt(Date.UTC(2024, 0, 1));
const MACHINE_ID_BITS = 5n;
const WORKER_ID_BITS = 5n;
const SEQUENCE_BITS = 12n;

const MAX_MACHINE_ID = Number((1n << MACHINE_ID_BITS) - 1n);
const MAX_WORKER_ID = Number((1n << WORKER_ID_BITS) - 1n);
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n;

const machineId = BigInt(Math.floor(Math.random() * (MAX_MACHINE_ID + 1)));
const workerId = BigInt(process.pid % (MAX_WORKER_ID + 1));

let lastTimestamp = 0n;
let sequence = 0n;

function currentTimestamp(): bigint {
  return BigInt(Date.now());
}

function waitNextMillis(previousTimestamp: bigint): bigint {
  let timestamp = currentTimestamp();
  while (timestamp <= previousTimestamp) {
    timestamp = currentTimestamp();
  }
  return timestamp;
}

export function generateSnowflakeId(): string {
  let timestamp = currentTimestamp();

  if (timestamp < lastTimestamp) {
    timestamp = lastTimestamp;
  }

  if (timestamp === lastTimestamp) {
    sequence = (sequence + 1n) & MAX_SEQUENCE;
    if (sequence === 0n) {
      timestamp = waitNextMillis(lastTimestamp);
    }
  } else {
    sequence = 0n;
  }

  lastTimestamp = timestamp;

  const id =
    ((timestamp - CUSTOM_EPOCH) << (MACHINE_ID_BITS + WORKER_ID_BITS + SEQUENCE_BITS)) |
    (machineId << (WORKER_ID_BITS + SEQUENCE_BITS)) |
    (workerId << SEQUENCE_BITS) |
    sequence;

  return id.toString();
}
