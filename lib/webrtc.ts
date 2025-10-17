// WebRTC peer connection management for P2P messaging
import { ref, onValue, set, remove, type DatabaseReference } from "firebase/database"
import { rtdb } from "./firebase"

export interface SignalData {
  type: "offer" | "answer" | "ice-candidate"
  data: any
  from: string
  to: string
  timestamp: number
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null
  private dataChannel: RTCDataChannel | null = null
  private signalRef: DatabaseReference | null = null
  private onMessageCallback: ((message: string) => void) | null = null
  private onConnectionStateCallback: ((state: string) => void) | null = null

  constructor(
    private userId: string,
    private peerId: string,
  ) {
    if (!rtdb) {
      throw new Error(
        "Firebase Realtime Database is not configured. Please set NEXT_PUBLIC_FIREBASE_DATABASE_URL environment variable.",
      )
    }
  }

  async initConnection(isInitiator: boolean): Promise<void> {
    if (!rtdb) {
      throw new Error("Firebase Realtime Database is not available")
    }

    // Create peer connection with STUN servers
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    })

    // Set up connection state monitoring
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || "disconnected"
      console.log("[v0] WebRTC connection state:", state)
      this.onConnectionStateCallback?.(state)
    }

    // Set up ICE candidate handling
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: "ice-candidate",
          data: event.candidate.toJSON(),
          from: this.userId,
          to: this.peerId,
          timestamp: Date.now(),
        })
      }
    }

    if (isInitiator) {
      // Create data channel for the initiator
      this.dataChannel = this.peerConnection.createDataChannel("chat")
      this.setupDataChannel()

      // Create and send offer
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      this.sendSignal({
        type: "offer",
        data: offer,
        from: this.userId,
        to: this.peerId,
        timestamp: Date.now(),
      })
    } else {
      // Set up data channel for the receiver
      this.peerConnection.ondatachannel = (event) => {
        this.dataChannel = event.channel
        this.setupDataChannel()
      }
    }

    // Listen for incoming signals
    this.listenForSignals()
  }

  private setupDataChannel(): void {
    if (!this.dataChannel) return

    this.dataChannel.onopen = () => {
      console.log("[v0] Data channel opened")
      this.onConnectionStateCallback?.("connected")
    }

    this.dataChannel.onclose = () => {
      console.log("[v0] Data channel closed")
      this.onConnectionStateCallback?.("disconnected")
    }

    this.dataChannel.onmessage = (event) => {
      console.log("[v0] Received message:", event.data)
      this.onMessageCallback?.(event.data)
    }
  }

  private sendSignal(signal: SignalData): void {
    if (!rtdb) {
      console.error("[v0] Cannot send signal: Realtime Database not available")
      return
    }
    const signalPath = `signals/${this.peerId}/${this.userId}/${Date.now()}`
    set(ref(rtdb, signalPath), signal).catch((error) => {
      if (error.code === "PERMISSION_DENIED") {
        console.error(
          "[v0] Permission denied when sending signal. Please update Firebase Realtime Database rules. See console for instructions.",
        )
      } else {
        console.error("[v0] Error sending signal:", error)
      }
    })
  }

  private listenForSignals(): void {
    if (!rtdb) {
      console.error("[v0] Cannot listen for signals: Realtime Database not available")
      return
    }

    this.signalRef = ref(rtdb, `signals/${this.userId}/${this.peerId}`)

    onValue(
      this.signalRef,
      async (snapshot) => {
        const signals = snapshot.val()
        if (!signals) return

        for (const key in signals) {
          const signal: SignalData = signals[key]

          try {
            if (signal.type === "offer" && this.peerConnection) {
              await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data))
              const answer = await this.peerConnection.createAnswer()
              await this.peerConnection.setLocalDescription(answer)

              this.sendSignal({
                type: "answer",
                data: answer,
                from: this.userId,
                to: this.peerId,
                timestamp: Date.now(),
              })
            } else if (signal.type === "answer" && this.peerConnection) {
              await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data))
            } else if (signal.type === "ice-candidate" && this.peerConnection) {
              await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.data))
            }

            // Remove processed signal
            remove(ref(rtdb, `signals/${this.userId}/${this.peerId}/${key}`))
          } catch (error) {
            console.error("[v0] Error processing signal:", error)
          }
        }
      },
      (error) => {
        if (error.code === "PERMISSION_DENIED") {
          console.error(
            "[v0] Permission denied when listening for signals. Please update Firebase Realtime Database rules.",
          )
        } else {
          console.error("[v0] Error listening for signals:", error)
        }
      },
    )
  }

  sendMessage(message: string): void {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      this.dataChannel.send(message)
    } else {
      console.error("[v0] Data channel is not open")
      throw new Error("Connection not established")
    }
  }

  onMessage(callback: (message: string) => void): void {
    this.onMessageCallback = callback
  }

  onConnectionState(callback: (state: string) => void): void {
    this.onConnectionStateCallback = callback
  }

  disconnect(): void {
    if (this.dataChannel) {
      this.dataChannel.close()
      this.dataChannel = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.peerConnection = null
    }

    if (this.signalRef && rtdb) {
      // Clean up signals
      remove(ref(rtdb, `signals/${this.userId}/${this.peerId}`))
      remove(ref(rtdb, `signals/${this.peerId}/${this.userId}`))
    }

    this.onMessageCallback = null
    this.onConnectionStateCallback = null
  }
}
