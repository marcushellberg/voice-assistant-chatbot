import { useState, useRef } from 'react';
import '../styles/main.css';
import {getWaveBlob} from 'webm-to-wav-converter';

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
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white shadow-xl rounded-lg p-6">
                    <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                        Voice Assistant
                    </h1>

                    <div className="flex flex-col items-center space-y-6">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                                isRecording
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                            disabled={loading}
                        >
                            <div className={`${
                                isRecording ? 'w-6 h-6 bg-white rounded' : 'w-0 h-0 border-8 border-transparent border-l-8 border-l-white ml-1'
                            }`} />
                        </button>
                        
                        <div className="text-sm text-gray-500">
                            {isRecording ? 'Click to stop recording' : 'Click to start recording'}
                        </div>

                        {loading && (
                            <div className="text-gray-600">
                                Processing your question...
                            </div>
                        )}

                        {response && (
                            <div className="w-full space-y-4 mt-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h2 className="text-lg font-semibold text-gray-700 mb-2">
                                        Response
                                    </h2>
                                    <p className="text-gray-600">{response.text}</p>
                                </div>
                                
                                <button
                                    onClick={() => playResponseAudio(response.audioBase64)}
                                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Play Response Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}