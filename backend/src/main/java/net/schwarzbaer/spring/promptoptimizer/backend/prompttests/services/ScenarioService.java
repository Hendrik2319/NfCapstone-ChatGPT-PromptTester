package net.schwarzbaer.spring.promptoptimizer.backend.prompttests.services;

import lombok.RequiredArgsConstructor;
import net.schwarzbaer.spring.promptoptimizer.backend.prompttests.models.NewScenario;
import net.schwarzbaer.spring.promptoptimizer.backend.prompttests.models.Scenario;
import net.schwarzbaer.spring.promptoptimizer.backend.prompttests.repositories.ScenarioRepository;
import net.schwarzbaer.spring.promptoptimizer.backend.security.UserInfos;
import net.schwarzbaer.spring.promptoptimizer.backend.security.UserService;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ScenarioService {

	private final ScenarioRepository scenarioRepository;
	private final UserService userService;

	public List<Scenario> getAllScenarios() {
		return scenarioRepository.findAll();
	}

	public List<Scenario> getAllScenariosOfUser() {
		UserInfos currentUser = userService.getCurrentUser();
		if (currentUser.userDbId()==null) return List.of();
		return scenarioRepository.findByAuthorID(currentUser.userDbId());
	}

	public Optional<Scenario> addScenarios(@NonNull NewScenario newScenario) {
		UserInfos currentUser = userService.getCurrentUser();
		if (currentUser.userDbId()==null) return Optional.empty();
		return Optional.of(scenarioRepository.save(new Scenario( currentUser.userDbId(), newScenario )));
	}

}