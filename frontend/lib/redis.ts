import { createClient } from "redis";

// In-memory queue as fallback
class InMemoryQueue {
  private queue: any[] = [];
  private subscribers: Set<(data: any) => void> = new Set();

  async lPush(key: string, value: string) {
    this.queue.unshift(JSON.parse(value));
    this.notifySubscribers();
  }

  async brPop(key: string, timeout: number) {
    if (this.queue.length === 0) {
      return null;
    }
    const value = this.queue.pop();
    return { element: JSON.stringify(value) };
  }

  async publish(channel: string, message: string) {
    this.notifySubscribers();
  }

  subscribe(channel: string, callback: (message: string) => void) {
    this.subscribers.add(callback);
    return Promise.resolve();
  }

  unsubscribe(channel: string) {
    this.subscribers.clear();
    return Promise.resolve();
  }

  private notifySubscribers() {
    const message = JSON.stringify(this.queue[0]);
    this.subscribers.forEach((callback) => callback(message));
  }

  isOpen() {
    return true;
  }

  duplicate() {
    return this;
  }

  async connect() {
    return Promise.resolve();
  }

  async disconnect() {
    return Promise.resolve();
  }
}

// Create Redis client with fallback
let redisClient: ReturnType<typeof createClient> | InMemoryQueue;

try {
  redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          console.warn(
            "Redis connection failed, falling back to in-memory queue"
          );
          redisClient = new InMemoryQueue();
          return new Error("Max reconnection attempts reached");
        }
        return Math.min(retries * 1000, 3000);
      },
    },
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
    redisClient = new InMemoryQueue();
  });

  redisClient.on("connect", () => {
    console.log("Redis Client Connected");
  });

  redisClient.on("ready", () => {
    console.log("Redis Client Ready");
  });

  redisClient.on("end", () => {
    console.log("Redis Client Connection Ended");
    redisClient = new InMemoryQueue();
  });

  // Connect to Redis
  redisClient.connect().catch((error) => {
    console.warn("Failed to connect to Redis, using in-memory queue:", error);
    redisClient = new InMemoryQueue();
  });
} catch (error) {
  console.warn("Failed to initialize Redis, using in-memory queue:", error);
  redisClient = new InMemoryQueue();
}

export { redisClient as redis };
