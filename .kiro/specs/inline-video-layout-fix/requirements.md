# Requirements Document

## Introduction

This feature addresses two critical issues in the video calling system:
1. Layout and styling issues in the inline video call component that prevent proper video display
2. Incoming call popup reliability issues where some users don't receive call notifications

The current implementation has problems with video container sizing, control positioning, video scaling, and inconsistent incoming call event handling that prevent it from providing a reliable, professional video call experience similar to Discord or Slack.

## Glossary

- **InlineVideoCall**: The React component that renders video calls within the chat message area
- **CallControls**: The Stream SDK component providing buttons for mic, camera, screen share, and end call
- **SpeakerLayout**: The Stream SDK component that displays video participants
- **Chat Body Area**: The main content area of the chat interface where messages and video calls are displayed
- **Video Container**: The wrapper element that holds both the video content and controls
- **IncomingCallPopup**: The React component that displays incoming call notifications with accept/decline options
- **VideoClient**: The Stream Video SDK client instance that manages video call connections and events
- **call.ring Event**: The Stream Video SDK event fired when an incoming call is received

## Requirements

### Requirement 1

**User Story:** As a user, I want the video call to fill the available chat area width, so that I can see participants clearly without wasted space.

#### Acceptance Criteria

1. WHEN a video call is active THEN the InlineVideoCall SHALL expand to fill the full width of the chat body area
2. WHEN the video container is rendered THEN the InlineVideoCall SHALL maintain a fixed height between 420px and 500px
3. WHEN the viewport is resized THEN the InlineVideoCall SHALL maintain its width relative to the chat body area
4. WHEN the video container is displayed THEN the InlineVideoCall SHALL apply rounded corners of 16px radius
5. WHEN multiple messages exist THEN the InlineVideoCall SHALL not overflow or push content outside the chat boundaries

### Requirement 2

**User Story:** As a user, I want the video call controls to overlay on the video, so that the interface matches standard video call patterns and doesn't waste vertical space.

#### Acceptance Criteria

1. WHEN the CallControls are rendered THEN the InlineVideoCall SHALL position them absolutely within the video container
2. WHEN the CallControls are displayed THEN the InlineVideoCall SHALL align them to the bottom-center of the video container
3. WHEN the CallControls are positioned THEN the InlineVideoCall SHALL ensure they overlay the video content without pushing it
4. WHEN the video container is rendered THEN the InlineVideoCall SHALL contain all controls within the same frame as the video
5. WHEN the CallControls are visible THEN the InlineVideoCall SHALL apply appropriate z-index to keep them above video content

### Requirement 3

**User Story:** As a user, I want the video to scale properly to fill the container, so that I don't see large black empty spaces.

#### Acceptance Criteria

1. WHEN video content is rendered THEN the SpeakerLayout SHALL apply object-fit cover to fill available dimensions
2. WHEN the video aspect ratio differs from container THEN the SpeakerLayout SHALL crop excess content rather than letterbox
3. WHEN participant video is displayed THEN the InlineVideoCall SHALL ensure video elements scale to fill their allocated space
4. WHEN the container dimensions change THEN the SpeakerLayout SHALL maintain proper video scaling

### Requirement 4

**User Story:** As a user, I want the video call interface to look clean and professional, so that the experience matches modern chat applications.

#### Acceptance Criteria

1. WHEN the video container is rendered THEN the InlineVideoCall SHALL apply consistent spacing and margins
2. WHEN the CallControls are displayed THEN the InlineVideoCall SHALL style them with semi-transparent background for visibility
3. WHEN the video header is shown THEN the InlineVideoCall SHALL maintain visual hierarchy with proper contrast
4. WHEN the entire video interface is visible THEN the InlineVideoCall SHALL present a cohesive design matching the chat aesthetic
5. WHEN hover states are triggered THEN the InlineVideoCall SHALL provide appropriate visual feedback

### Requirement 5

**User Story:** As a user on mobile devices, I want the video call to adapt to smaller screens, so that I can participate in calls on any device.

#### Acceptance Criteria

1. WHEN the viewport width is below 768px THEN the InlineVideoCall SHALL reduce the container height to 300px
2. WHEN on mobile viewport THEN the InlineVideoCall SHALL maintain full width of the chat area
3. WHEN the CallControls are displayed on mobile THEN the InlineVideoCall SHALL adjust control button sizes for touch targets
4. WHEN the video header is shown on mobile THEN the InlineVideoCall SHALL maintain readability with appropriate font sizes

### Requirement 6

**User Story:** As a user, I want to reliably receive incoming call notifications, so that I don't miss calls from other users.

#### Acceptance Criteria

1. WHEN a call.ring event is received THEN the system SHALL display the IncomingCallPopup within 500ms
2. WHEN the VideoClient is initialized THEN the system SHALL register call.ring event listeners before any calls can be received
3. WHEN the StreamContext component mounts with an authenticated user THEN the system SHALL ensure VideoClient is fully connected before marking as ready
4. WHEN multiple call.ring events are received for the same call THEN the system SHALL display only one IncomingCallPopup instance
5. WHEN the IncomingCallPopup is displayed THEN the system SHALL show the caller's name and avatar from the call metadata

### Requirement 7

**User Story:** As a user, I want the incoming call popup to appear consistently across all scenarios, so that the calling experience is reliable.

#### Acceptance Criteria

1. WHEN the VideoClient connection is established THEN the system SHALL verify event listeners are active by logging registration confirmation
2. WHEN a user is logged in THEN the system SHALL maintain VideoClient connection throughout the session without disconnection
3. WHEN the call.ring event handler executes THEN the system SHALL log all event data for debugging purposes
4. WHEN the IncomingCallPopup state is updated THEN the system SHALL ensure React re-renders the component immediately
5. WHEN the VideoClient is disconnected THEN the system SHALL re-establish connection and re-register event listeners automatically

### Requirement 8

**User Story:** As a user, I want to see screen shares properly displayed in the video call, so that I can view shared content from other participants.

#### Acceptance Criteria

1. WHEN a participant starts screen sharing THEN the InlineVideoCall SHALL display the screen share track alongside or instead of their video track
2. WHEN screen share content is rendered THEN the ParticipantView SHALL use the screenShareTrack type to display the shared screen
3. WHEN multiple participants are in a call with screen sharing THEN the InlineVideoCall SHALL prioritize displaying the screen share prominently
4. WHEN a screen share is active THEN the video layout SHALL adapt to show the screen share in a larger view
5. WHEN a participant stops screen sharing THEN the InlineVideoCall SHALL revert to showing their camera video track
