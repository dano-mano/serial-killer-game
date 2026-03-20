# Feature Specification: Supabase Auth & User Profiles

**Feature Branch**: `002-supabase-auth-profiles`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "Integrate Supabase Auth with email/password login and signup. Create the user profile system with database table, RLS policies, Data Access Layer, and Server Action for profile mutations."

## Clarifications

### Session 2026-03-20

- Q: What happens when an already-authenticated player navigates to `/login` or `/signup`? → A: Redirect authenticated players away from auth pages to `/game/select-role`
- Q: After route protection redirects to login, where does the player land post-login? → A: Redirect to the originally requested URL after login (fallback: `/game/select-role`)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New Player Registration (Priority: P1)

A new visitor arrives at the game and wants to create an account so they can play. They navigate to the signup page, enter their email address, choose a password, confirm it, and provide a display name that other players will see. After submitting, they are either directed into the game (if email verification is not required) or shown a notice to check their email for a verification link.

Upon successful registration, the system automatically creates a player profile using the display name they provided. If they did not provide a display name, the system defaults to "Player."

**Why this priority**: Without registration, no one can play the game. This is the entry point for the entire user base and the foundation every other feature depends on.

**Independent Test**: Can be fully tested by completing the signup form and verifying the user can subsequently log in and has a profile with their chosen display name.

**Acceptance Scenarios**:

1. **Given** a visitor on the signup page, **When** they enter a valid email, matching passwords, and a display name "DragonSlayer", **Then** their account is created and a profile exists with display name "DragonSlayer"
2. **Given** a visitor on the signup page, **When** they enter a valid email and matching passwords but no display name, **Then** their account is created and a profile exists with display name "Player"
3. **Given** a visitor on the signup page, **When** they enter an email that is already registered, **Then** they see a user-friendly error message indicating the email is taken
4. **Given** a visitor on the signup page, **When** their passwords do not match, **Then** they see a validation error before the form submits
5. **Given** a visitor on the signup page, **When** they enter a display name with invalid characters (e.g., "Dr@gon!"), **Then** they see a validation error explaining allowed characters
6. **Given** email verification is enabled, **When** a visitor completes signup, **Then** they see a notice to check their email, and they cannot log in until verified
7. **Given** email verification is enabled and a user clicks the verification link, **When** they are redirected back to the app, **Then** they land on the role selection page ready to play

---

### User Story 2 - Returning Player Login (Priority: P1)

A returning player wants to log in to continue playing. They navigate to the login page, enter their email and password, and are taken directly to the role selection page. Their session persists across page refreshes and browser tabs so they don't have to log in repeatedly.

**Why this priority**: Equally critical as registration. Existing players must be able to return to the game. Login and registration together form the complete identity system.

**Independent Test**: Can be fully tested by logging in with valid credentials and verifying the user reaches the game area with their identity intact.

**Acceptance Scenarios**:

1. **Given** a registered player on the login page, **When** they enter correct email and password, **Then** they are redirected to the role selection page
2. **Given** a visitor on the login page, **When** they enter an incorrect password, **Then** they see a user-friendly error (not revealing whether the email exists)
3. **Given** a visitor on the login page, **When** they enter an unregistered email, **Then** they see the same generic "invalid credentials" error (no information leakage)
4. **Given** a logged-in player, **When** they refresh the page or open a new tab, **Then** their session persists and they remain authenticated
5. **Given** a player whose email is not yet verified, **When** they attempt to log in, **Then** they see a friendly message explaining they need to verify their email first, with guidance on how to do so

---

### User Story 3 - Route Protection (Priority: P1)

Unauthenticated visitors must not be able to access game or profile areas. When an unauthenticated visitor tries to navigate to a protected page (game pages, profile pages), they are automatically redirected to the login page. After logging in, authenticated players can freely access all protected areas.

**Why this priority**: Security is non-negotiable. Without route protection, unauthenticated users could access game features, causing data integrity issues and a broken experience.

**Independent Test**: Can be tested by attempting to visit a protected URL while not logged in and verifying the redirect to login.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they navigate to any game page, **Then** they are redirected to the login page with the original URL preserved
2. **Given** an unauthenticated visitor, **When** they navigate to any profile page, **Then** they are redirected to the login page with the original URL preserved
3. **Given** an authenticated player, **When** they navigate to a game page, **Then** they can access it normally
4. **Given** an unauthenticated visitor, **When** they navigate to the landing page, login, or signup pages, **Then** they can access them normally (public routes)
5. **Given** an authenticated player, **When** they navigate to the login or signup page, **Then** they are redirected to `/game/select-role`

---

### User Story 4 - Profile Management (Priority: P2)

An authenticated player wants to customize their identity by updating their display name or avatar. They can view their own profile and edit their display name (within the allowed format rules) and optionally set an avatar URL. They can also view other players' profiles (for matchmaking and leaderboard contexts), but they cannot edit anyone else's profile.

**Why this priority**: Profile customization adds player identity and personalization. Important for engagement but not blocking core gameplay.

**Independent Test**: Can be tested by updating a display name and verifying the change persists, then attempting to update another player's profile and verifying it is denied.

**Acceptance Scenarios**:

1. **Given** an authenticated player viewing their profile, **When** they change their display name to "NightOwl" and save, **Then** their profile updates and the new name appears
2. **Given** an authenticated player, **When** they try to set a display name shorter than 2 characters, **Then** they see a validation error
3. **Given** an authenticated player, **When** they try to set a display name longer than 32 characters, **Then** they see a validation error
4. **Given** an authenticated player, **When** they set a valid avatar URL, **Then** their profile updates with the new avatar
5. **Given** an authenticated player, **When** they set an invalid avatar URL (not a valid URL format), **Then** they see a validation error
6. **Given** an authenticated player, **When** they attempt to modify another player's profile, **Then** the system denies the request
7. **Given** an authenticated player, **When** they view another player's profile, **Then** they can see the display name and avatar but cannot edit

---

### User Story 5 - Password Recovery (Priority: P2)

A player who has forgotten their password can request a reset. From the login page, they click "Forgot password," enter their email, and receive a password reset email. Following the link allows them to set a new password and regain access to their account.

**Why this priority**: Essential for user retention. Players who can't recover their accounts are permanently lost. Not blocking initial launch but needed before any significant user base exists.

**Independent Test**: Can be tested by requesting a password reset, following the email link, setting a new password, and logging in with the new credentials.

**Acceptance Scenarios**:

1. **Given** a player on the login page, **When** they click "Forgot password" and enter their email, **Then** they see a confirmation message that a reset email was sent (regardless of whether the email exists, to prevent information leakage)
2. **Given** a player who received a reset email, **When** they click the reset link and enter a new password, **Then** their password is updated and they can log in with the new credentials

---

### User Story 6 - Auth Identity in Game World (Priority: P2)

When an authenticated player enters the game, their identity (player ID and display name) is available to the game engine without any additional login step. The game world knows who the player is so it can display their name, track their actions, and associate game events with their account.

**Why this priority**: The game engine needs player identity to function. Without this bridge, game features cannot be attributed to specific players. Needed before any gameplay features are built.

**Independent Test**: Can be tested by logging in, entering the game area, and verifying the game world has access to the player's ID and display name.

**Acceptance Scenarios**:

1. **Given** an authenticated player entering the game area, **When** the game loads, **Then** the game engine has access to the player's unique ID and display name
2. **Given** a player whose display name changes mid-session, **When** the game checks player identity, **Then** it reflects the updated display name
3. **Given** an unauthenticated visitor reaching the game area, **When** the page attempts to load, **Then** they are redirected to login before the game ever initializes

---

### User Story 7 - Sign Out (Priority: P3)

An authenticated player can sign out of their account. After signing out, they are redirected to the landing page and can no longer access protected areas until they log in again.

**Why this priority**: Standard account management. Lower priority because players rarely sign out of games, but required for shared devices and account switching.

**Independent Test**: Can be tested by signing out and verifying protected routes redirect to login.

**Acceptance Scenarios**:

1. **Given** an authenticated player, **When** they sign out, **Then** they are redirected to the landing page
2. **Given** a player who just signed out, **When** they try to access a game page, **Then** they are redirected to the login page

---

### Edge Cases

- **Profile creation failure**: If the automatic profile creation fails during signup, the system must handle the missing profile gracefully (return a clear "profile not found" error) rather than crashing. The player should still be able to log in, and the system should recover on the next appropriate opportunity.
- **Session expiry during gameplay**: For long play sessions, the session must refresh automatically in the background. Players should never be abruptly logged out mid-game without warning.
- **Email verification edge case**: If the system requires email verification, players who have not verified must receive clear, actionable guidance — not a generic error. The message should explain what to do and offer to resend the verification email.
- **Display name not unique**: Multiple players may have the same display name. Players are always identified internally by their unique ID, never by display name. The system must not enforce display name uniqueness.
- **Avatar URL without file upload**: In this version, avatar URLs are external links only. There is no file upload capability. If a player provides a URL that later becomes unavailable, the system should display a default avatar or placeholder gracefully.
- **Concurrent sessions**: A player may be logged in on multiple devices or tabs simultaneously. All sessions should function correctly without conflict.
- **Auth callback errors**: If the email verification or password reset callback encounters an error (expired link, invalid token), the player should be redirected to the login page with a clear error message explaining what went wrong.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow visitors to create accounts with email, password, and optional display name
- **FR-002**: System MUST validate passwords match during signup before submission
- **FR-003**: System MUST validate display names are 2-32 characters containing only letters, numbers, spaces, hyphens, and underscores
- **FR-004**: System MUST automatically create a player profile upon successful registration with the provided display name (defaulting to "Player" if none provided)
- **FR-005**: System MUST allow registered players to log in with email and password
- **FR-006**: System MUST maintain persistent sessions across page refreshes and browser tabs
- **FR-007**: System MUST redirect unauthenticated visitors away from protected areas (game pages, profile pages) to the login page, preserving the originally requested URL so the player can be returned there after login (fallback: `/game/select-role`)
- **FR-008**: System MUST allow public access to landing, login, signup, and auth callback pages without authentication
- **FR-009**: System MUST redirect authenticated players away from login and signup pages to `/game/select-role`
- **FR-010**: System MUST allow any authenticated player to view any other player's profile (display name and avatar)
- **FR-011**: System MUST restrict profile editing so players can only modify their own profile
- **FR-012**: System MUST allow authenticated players to update their display name (subject to format validation)
- **FR-013**: System MUST allow authenticated players to set or clear an optional avatar URL (validated as a proper URL if provided)
- **FR-014**: System MUST provide a "Forgot password" flow that sends a password reset email
- **FR-015**: System MUST NOT reveal whether an email address is registered when login fails or password reset is requested (prevent information leakage)
- **FR-016**: System MUST handle email verification requirements gracefully, showing clear guidance when a player's email is not yet verified
- **FR-017**: System MUST handle the auth callback route for email verification and password reset links, redirecting on success or showing errors on failure
- **FR-018**: System MUST make the authenticated player's ID and display name available to the game engine without requiring the game engine to depend on the authentication system directly
- **FR-019**: System MUST provide a sign-out function that clears the session and redirects to the landing page
- **FR-020**: System MUST refresh sessions automatically to prevent expiry during long play sessions
- **FR-021**: System MUST cascade profile deletion when a user account is deleted
- **FR-022**: System MUST return a clear "not found" error if a player's profile is missing (rather than crashing), to handle edge cases where automatic profile creation may have failed
- **FR-023**: System MUST keep the player's display name in sync between the profile database and the authentication metadata so the game engine always has the current display name

### Key Entities

- **User Account**: Represents an authenticated identity. Created during signup. Has email, hashed password (managed by the auth system), and unique identifier. One-to-one relationship with User Profile.
- **User Profile**: Represents a player's public-facing identity within the game. Fields: unique identifier (linked to User Account, cascades on deletion), display name (2-32 chars, not unique), avatar URL (optional, nullable), creation timestamp, last-updated timestamp. Created automatically on signup.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New players can complete the signup flow (form submission to reaching the game or verification notice) in under 60 seconds
- **SC-002**: Returning players can log in and reach the game area in under 15 seconds
- **SC-003**: 100% of attempts to access protected routes while unauthenticated result in redirect to login (zero unauthorized access)
- **SC-004**: Profile auto-creation succeeds on at least 99.9% of signups, with graceful error handling for the remaining cases
- **SC-005**: Players can update their display name and see the change reflected immediately upon save
- **SC-006**: Sessions persist for at least 7 days of inactivity before requiring re-login (configurable at the auth provider level)
- **SC-007**: Error messages during login, signup, and profile management are user-friendly and actionable — no raw error codes or stack traces are ever shown to players
- **SC-008**: The game engine can read the authenticated player's identity within 1 second of the game area loading, without importing authentication code directly

## Assumptions

- Email verification behavior is configurable at the Supabase project level. The application handles both states (verification required and not required) without code changes.
- Password strength requirements are enforced by the auth provider (Supabase default: minimum 6 characters). The application does not add custom password strength rules beyond what the provider enforces.
- The auth callback route handles both email verification and password reset redirects. Social login (OAuth) is not in scope for this feature but the callback route is structured to support it in the future.
- Avatar images are external URLs only. File upload to cloud storage is a future enhancement.
- There is no admin interface for managing user accounts or profiles in this feature. Admin tools are a separate future concern.
- The "Forgot password" link on the login page navigates to an inline form or modal on the same page (not a separate page). The exact UI treatment is deferred to design implementation.
- Rate limiting for auth endpoints (login attempts, password reset requests) is handled by the existing rate limiting infrastructure in the application.
