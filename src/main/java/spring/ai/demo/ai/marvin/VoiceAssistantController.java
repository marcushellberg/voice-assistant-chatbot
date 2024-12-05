package spring.ai.demo.ai.marvin;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.model.Media;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

@RestController
public class VoiceAssistantController {
    
    private ChatClient chatClient;

    public VoiceAssistantController(ChatClient.Builder chatClientBuilder,
            @Value("${chatbot.prompt:classpath:/marvin.paranoid.android.txt}") Resource systemPrompt) {

        this.chatClient = chatClientBuilder
                .defaultSystem(systemPrompt)
                .defaultAdvisors(new MessageChatMemoryAdvisor(new InMemoryChatMemory()))
                .build();
    }

    public static class AudioResponse {
        private String text;
        private String audioBase64;

        public AudioResponse(String text, byte[] audio) {
            this.text = text;
            this.audioBase64 = Base64.getEncoder().encodeToString(audio);
        }

        public String getText() {
            return text;
        }

        public String getAudioBase64() {
            return audioBase64;
        }
    }

    @PostMapping("/ask")
    public ResponseEntity<AudioResponse> handleAudioUpload(@RequestParam("file") MultipartFile file) throws IOException {
        // Convert MultipartFile to byte array
        byte[] audioBytes = file.getBytes();

        // Send user's input to the AI model and get the response
        AssistantMessage response = chatClient.prompt()
                .messages(new UserMessage("Please answer the questions in the audio input",
                        new Media(MediaType.parseMediaType("audio/wav"),
                                new ByteArrayResource(audioBytes))))
                .call()
                .chatResponse()
                .getResult()
                .getOutput();

        // Get the text response and audio response
        String textResponse = response.getContent();
        byte[] audioResponse = response.getMedia().get(0).getDataAsByteArray();

        // Create response object with both text and audio
        AudioResponse audioResponseObj = new AudioResponse(textResponse, audioResponse);
        
        return ResponseEntity.ok(audioResponseObj);
    }
}
