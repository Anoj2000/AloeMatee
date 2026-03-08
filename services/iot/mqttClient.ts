// MQTT / WebSocket client for real-time IoT sensor data
// Install: expo install @mqttjs/async-mqtt  OR use a WebSocket-based MQTT library

type MessageHandler = (topic: string, payload: string) => void;

class MqttClient {
  private handlers: Map<string, MessageHandler[]> = new Map();
  private connected = false;

  connect(brokerUrl: string): void {
    // TODO: Integrate MQTT library
    // Example: this.client = mqtt.connect(brokerUrl);
    // this.client.on('message', this.handleMessage.bind(this));
    console.log(`[MQTT] Connecting to ${brokerUrl}`);
    this.connected = true;
  }

  subscribe(topic: string, handler: MessageHandler): void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    this.handlers.get(topic)!.push(handler);
    // this.client?.subscribe(topic);
  }

  unsubscribe(topic: string): void {
    this.handlers.delete(topic);
    // this.client?.unsubscribe(topic);
  }

  disconnect(): void {
    this.connected = false;
    this.handlers.clear();
    // this.client?.end();
  }

  private handleMessage(topic: string, payload: Buffer): void {
    const handlers = this.handlers.get(topic) ?? [];
    handlers.forEach((h) => h(topic, payload.toString()));
  }

  get isConnected(): boolean {
    return this.connected;
  }
}

export default new MqttClient();
