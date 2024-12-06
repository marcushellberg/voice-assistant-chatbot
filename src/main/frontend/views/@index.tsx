import { useState, useRef } from 'react';
import { Button } from '@vaadin/react-components/Button.js';
import { Icon } from '@vaadin/react-components/Icon.js';
import '@vaadin/icons';
import '../styles/main.css';
import { getWaveBlob } from 'webm-to-wav-converter';

interface ChatResponse {
    text: string;
    audioBase64: string;
}

export default function Index() {
    const [isRecording, setIsRecording] = useState(false);
    const [response, setResponse] = useState<ChatResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendAudioToServer(audioBlob);
                setIsRecording(false);

                // Stop all audio tracks
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
            };
        }
    };

    const sendAudioToServer = async (audioBlob: Blob) => {
        setLoading(true);
        try {
            // Convert WebM to WAV
            const wavBlob = await getWaveBlob(audioBlob, false);

            const formData = new FormData();
            formData.append('file', wavBlob, 'recording.wav');

            const response = await fetch('/ask', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Server error');
            }

            const data: ChatResponse = await response.json();
            setResponse(data);

            // Play the response audio
            playResponseAudio(data.audioBase64);
        } catch (error) {
            console.error('Error sending audio:', error);
        } finally {
            setLoading(false);
        }
    };

    const playResponseAudio = (base64Audio: string) => {
        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        audio.play();
    };

    return (
        <div className="box-border h-full p-l flex flex-col items-center gap-m">
            <span style={{ fontSize: '100px' }}>🤖</span>
            <h1 className="text-xl"> Chat with Marvin the Paranoid Android </h1>
            <div className="max-w-screen-sm w-full space-y-4 flex flex-col gap-l">
                <div className="flex justify-center space-x-4">
                    <Button
                        theme={isRecording ? "error" : "primary"}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={loading}
                    >
                        <Icon icon={isRecording ? "vaadin:stop" : "vaadin:microphone"} slot="prefix" />
                        {isRecording ? "Stop Recording" : "Start Recording"}
                    </Button>
                </div>

                {loading && (
                    <div className="flex justify-center">
                        Hold on, Marvin is thinking...
                    </div>
                )}

                {response && (
                    <div>
                        {response.text}
                    </div>
                )}
            </div>
        </div>
    );
}