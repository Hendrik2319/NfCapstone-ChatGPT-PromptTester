package net.schwarzbaer.spring.promptoptimizer.backend.security.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.schwarzbaer.spring.promptoptimizer.backend.security.models.Role;
import net.schwarzbaer.spring.promptoptimizer.backend.security.models.StoredUserInfo;
import net.schwarzbaer.spring.promptoptimizer.backend.security.models.UserInfos;
import net.schwarzbaer.spring.promptoptimizer.backend.security.models.UserIsNotAllowedException;
import net.schwarzbaer.spring.promptoptimizer.backend.security.repositories.StoredUserInfoRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class StoredUserInfoService {

	private final StoredUserInfoRepository storedUserInfoRepository;
	private final UserService userService;

// ####################################################################################
//               Called by SecurityConfig
// ####################################################################################

	public Optional<StoredUserInfo> getUserById(String userDbId) {
		return storedUserInfoRepository.findById(userDbId);
	}

	public void addUser(Role role, String registrationId, Map<String, Object> newAttributes) {
		storedUserInfoRepository.save(new StoredUserInfo(
				Objects.toString(newAttributes.get(UserService.ATTR_USER_DB_ID ), null),
				role,
				registrationId,
				Objects.toString(newAttributes.get(UserService.ATTR_ORIGINAL_ID), null),
				Objects.toString(newAttributes.get(UserService.ATTR_LOGIN      ), null),
				Objects.toString(newAttributes.get(UserService.ATTR_NAME       ), null),
				Objects.toString(newAttributes.get(UserService.ATTR_LOCATION   ), null),
				Objects.toString(newAttributes.get(UserService.ATTR_URL        ), null),
				Objects.toString(newAttributes.get(UserService.ATTR_AVATAR_URL ), null),
				null
		));
	}

	public void updateUserIfNeeded(StoredUserInfo storedUserInfo, Map<String, Object> newAttributes) {
		StoredUserInfo updatedUserInfo = new StoredUserInfo(
				storedUserInfo.id(),
				storedUserInfo.role(),
				storedUserInfo.registrationId(),
				Objects.toString(newAttributes.get(UserService.ATTR_ORIGINAL_ID), storedUserInfo.originalId()),
				Objects.toString(newAttributes.get(UserService.ATTR_LOGIN      ), storedUserInfo.login     ()),
				Objects.toString(newAttributes.get(UserService.ATTR_NAME       ), storedUserInfo.name      ()),
				Objects.toString(newAttributes.get(UserService.ATTR_LOCATION   ), storedUserInfo.location  ()),
				Objects.toString(newAttributes.get(UserService.ATTR_URL        ), storedUserInfo.url       ()),
				Objects.toString(newAttributes.get(UserService.ATTR_AVATAR_URL ), storedUserInfo.avatar_url()),
				storedUserInfo.denialReason()
		);
		if (!updatedUserInfo.equals(storedUserInfo))
			storedUserInfoRepository.save(updatedUserInfo);
	}

// ####################################################################################
//               Called by and allowed for Admin
// ####################################################################################

	public List<StoredUserInfo> getAllStoredUsers()
			throws UserIsNotAllowedException
	{
		UserInfos currentUser = userService.getCurrentUser();
		if (!currentUser.isAdmin())
			 throw new UserIsNotAllowedException("Current user is not allowed to get all stored users.");

		return storedUserInfoRepository.findAll();
	}

	public Optional<StoredUserInfo> updateStoredUser(@NonNull String id, @NonNull StoredUserInfo storedUserInfo)
			throws UserIsNotAllowedException
	{
		if ( storedUserInfo.id()==null     ) throw new IllegalArgumentException("StoredUserInfo have no [id]");
		if (!storedUserInfo.id().equals(id)) throw new IllegalArgumentException("StoredUserInfo have an [id] different to path variable");

		UserInfos currentUser = userService.getCurrentUser();
		if (!currentUser.isAdmin())
			throw new UserIsNotAllowedException("Current user is not allowed to update a stored user.");

		Optional<StoredUserInfo> stored = storedUserInfoRepository.findById(id);
		if (stored.isEmpty())
			return Optional.empty();

		return Optional.of(storedUserInfoRepository.save(storedUserInfo));
	}

	public void deleteStoredUser(@NonNull String id)
			throws UserIsNotAllowedException
	{
		UserInfos currentUser = userService.getCurrentUser();
		if (!currentUser.isAdmin())
			throw new UserIsNotAllowedException("Current user is not allowed to delete a stored user.");

		Optional<StoredUserInfo> stored = storedUserInfoRepository.findById(id);
		if (stored.isEmpty())
			throw new NoSuchElementException("Can't delete, StoredUserInfo with ID \"%s\" found.".formatted(id));

		storedUserInfoRepository.deleteById(id);
	}

// ####################################################################################
//               Called by and allowed for authorized users
// ####################################################################################

	public String getDenialReasonForCurrentUser()
			throws UserIsNotAllowedException
	{
		UserInfos currentUser = userService.getCurrentUser();
		if (!currentUser.isAuthenticated())
			throw new UserIsNotAllowedException("Current user is not allowed to do this operation.");

		Optional<StoredUserInfo> storedUserInfo = storedUserInfoRepository.findById(currentUser.userDbId());

		return storedUserInfo
				.map(StoredUserInfo::denialReason) // message or null (-> no message -> not denied, "please wait")
				.orElse(null); // no message -> not denied, "please wait"
	}
}
