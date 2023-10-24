package net.schwarzbaer.spring.promptoptimizer.backend.security;

public enum Role {
	ADMIN,
	USER,
	UNKNOWN_ACCOUNT;

	public String getShort() { return         name(); }
	public String getLong () { return "ROLE_"+name(); }
}
