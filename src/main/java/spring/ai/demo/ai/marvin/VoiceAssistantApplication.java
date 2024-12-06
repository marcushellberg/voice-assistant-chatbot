package spring.ai.demo.ai.marvin;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * ChatBot Assistant Application that uses voice input and output to communicate with the
 * user. The application uses the simple {@link Audio} utility to record and playback the
 * audio.
 *
 * @author Christian Tzolov
 */
@SpringBootApplication
public class VoiceAssistantApplication extends SpringBootServletInitializer {

	public static void main(String[] args) {
		SpringApplication.run(VoiceAssistantApplication.class, args);
	}

}
