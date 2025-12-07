# Design Document

## Overview

This design addresses two critical issues in the video calling system:

1. **Video Layout Issues**: Restructures the CSS positioning model in InlineVideoCall to ensure video content fills available space, controls overlay properly, and the interface presents a clean, professional appearance.

2. **Incoming Call Popup Reliability**: Fixes event listener registration timing and VideoClient initialization to ensure all users reliably receive incoming call notifications. The root cause is that event listeners are sometimes registered before the VideoClient is fully connected, or the VideoClient connection state is not properly maintained.

## Architecture

### Video Layout Architecture

The InlineVideoCall component follows a three-layer structure:

1. **Container Layer**: The root `.inline-video-call` element that defines overall dimensions and boundaries
2. **Content Layer**: The `.inline-video-content` element that holds the video participants using relative positioning
3. **Controls Layer**: The `.inline-video-controls` element that overlays controls using absolute positioning

The key architectural change is ensuring the container uses `position: relative` to establish a positioning context, allowing the controls to be absolutely positioned within it rather than relative to the document body.

### Incoming Call Event Flow Architecture

The incoming call system follows this event flow:

1. **Initialization Phase**: StreamContext initializes VideoClient and waits for full connection
2. **Registration Phase**: StreamChatComponent registers event listeners only after VideoClient is ready
3. **Event Reception Phase**: VideoClient receives call.ring event from Stream servers
4. **Handler Execution Phase**: Event handler extracts caller info and updates React state
5. **UI Rendering Phase**: React renders IncomingCallPopup based on state changes

**Critical Fix**: Event listeners must be registered AFTER VideoClient reports ready state, and the ready state must accurately reflect full connection establishment, not just client instantiation.

## Components and Interfaces

### InlineVideoCall Component Structure

```jsx
<div className="inline-video-call">           // Container with relative positioning
  <div className="inline-video-header">       // Header with call info and actions
    {/* Header content */}
  </div>
  
  <div className="inline-video-content">      // Video content area
    <SpeakerLayout />                         // Stream SDK video layout
  </div>
  
  <div className="inline-video-controls">     // Absolutely positioned controls
    <CallControls onLeave={handleLeaveCall} />
  </div>
</div>
```

### CSS Architecture

The CSS will be organized into these sections:

1. **Container Styles**: Define dimensions, positioning context, and overflow behavior
2. **Header Styles**: Style the top bar with call information
3. **Content Styles**: Configure the video display area
4. **Controls Styles**: Position and style the overlay controls
5. **Stream SDK Overrides**: Customize Stream components to match design
6. **Responsive Styles**: Adapt layout for mobile devices

### StreamContext VideoClient Initialization

The StreamContext must ensure VideoClient is fully connected before setting `isReady`:

```javascript
// Current problematic pattern:
const newVideoClient = new StreamVideoClient({ ... });
setVideoClient(newVideoClient);  // Client set immediately
setIsReady(true);  // Ready set before connection verified

// Fixed pattern:
const newVideoClient = new StreamVideoClient({ ... });
// Wait for connection to be established
await newVideoClient.connectUser(...);  // If needed
// Verify client is ready to receive events
setVideoClient(newVideoClient);
setIsReady(true);  // Only set after verification
```

### StreamChatComponent Event Listener Registration

Event listeners must be registered with proper dependency tracking:

```javascript
useEffect(() => {
  // Only register if videoClient exists AND is ready
  if (!videoClient || !isReady) {
    console.log('Waiting for video client to be ready');
    return;
  }

  console.log('Registering call.ring event listener');
  
  const handleIncomingCall = (event) => {
    // Handler implementation
  };

  videoClient.on('call.ring', handleIncomingCall);

  return () => {
    videoClient.off('call.ring', handleIncomingCall);
  };
}, [videoClient, isReady]);  // Depend on both videoClient AND isReady
```

## Data Models

No data model changes are required. The component continues to receive the same props:

```typescript
interface InlineVideoCallProps {
  callType: string;
  callId: string;
  onClose: () => void;
  onMinimize?: () => void;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Container width fills parent
*For any* rendered InlineVideoCall component at any viewport size, the container width should equal 100% of its parent container
**Validates: Requirements 1.1, 1.3**

### Property 2: Container height constraints
*For any* rendered InlineVideoCall component, the container height should be 420px on desktop viewports (≥768px) and 300px on mobile viewports (<768px)
**Validates: Requirements 1.2, 5.1**

### Property 3: Rounded corners with overflow clipping
*For any* InlineVideoCall container, the border-radius should be 16px and overflow should be hidden to clip child content
**Validates: Requirements 1.4**

### Property 4: No layout overflow
*For any* InlineVideoCall rendered with surrounding content, the component should not cause overflow or push content outside the chat boundaries
**Validates: Requirements 1.5**

### Property 5: Controls absolute positioning
*For any* rendered CallControls element, its CSS position should be absolute and its bounding box should be contained within the video container boundaries
**Validates: Requirements 2.1, 2.4**

### Property 6: Controls bottom-center alignment
*For any* rendered CallControls element, it should be positioned at the bottom of the container with horizontal centering (left: 50%, transform: translateX(-50%))
**Validates: Requirements 2.2**

### Property 7: Controls overlay without layout impact
*For any* InlineVideoCall with controls, adding or removing the controls element should not change the height or layout of the video content area
**Validates: Requirements 2.3**

### Property 8: Controls z-index stacking
*For any* rendered video interface, the controls element z-index should be greater than the video content z-index
**Validates: Requirements 2.5**

### Property 9: Video object-fit cover
*For any* video element rendered within SpeakerLayout, the computed object-fit CSS property should be 'cover'
**Validates: Requirements 3.1**

### Property 10: Video element dimensions
*For any* video element within the InlineVideoCall, the computed width and height should be 100% of its parent container
**Validates: Requirements 3.3**

### Property 11: Video scaling maintains on resize
*For any* InlineVideoCall, when the container dimensions change, the video elements should maintain object-fit: cover and 100% dimensions
**Validates: Requirements 3.4**

### Property 12: Consistent spacing
*For any* rendered InlineVideoCall container, the margin-bottom should be 16px and internal padding should match design specifications
**Validates: Requirements 4.1**

### Property 13: Controls semi-transparent background
*For any* rendered CallControls, the background-color should include an alpha channel value less than 1.0 for transparency
**Validates: Requirements 4.2**

### Property 14: Hover state visual feedback
*For any* interactive button within InlineVideoCall, simulating hover should change the computed background-color or color property
**Validates: Requirements 4.5**

### Property 15: Mobile touch target sizing
*For any* control button at mobile viewport (<768px), the computed width and height should be at least 44px for adequate touch targets
**Validates: Requirements 5.3**

### Property 16: Mobile font size readability
*For any* text element in the video header at mobile viewport (<768px), the computed font-size should be at least 14px for readability
**Validates: Requirements 5.4**

### Property 17: Incoming call popup display timing
*For any* call.ring event received by the VideoClient, the IncomingCallPopup should appear in the DOM within 500ms
**Validates: Requirements 6.1**

### Property 18: Event listener registration order
*For any* VideoClient initialization sequence, the call.ring event listeners should be registered before the system is marked as ready to receive calls
**Validates: Requirements 6.2**

### Property 19: VideoClient connection before ready state
*For any* StreamContext initialization with an authenticated user, the isReady flag should only be set to true after VideoClient connection is fully established
**Validates: Requirements 6.3**

### Property 20: Single popup for duplicate events
*For any* sequence of call.ring events with the same callId, only one IncomingCallPopup instance should be rendered in the DOM
**Validates: Requirements 6.4**

### Property 21: Caller information display
*For any* call metadata containing caller name and avatar, the IncomingCallPopup should display both the name and avatar correctly
**Validates: Requirements 6.5**

### Property 22: Automatic reconnection and re-registration
*For any* VideoClient disconnection event, the system should automatically re-establish connection and re-register all event listeners
**Validates: Requirements 7.5**

### Property 23: Screen share track display
*For any* participant with an active screen share, the ParticipantView should render the screenShareTrack instead of or alongside the videoTrack
**Validates: Requirements 8.1, 8.2**

### Property 24: Screen share layout adaptation
*For any* call with an active screen share, the video layout should adapt to display the screen share more prominently than regular video tracks
**Validates: Requirements 8.3, 8.4**

### Property 25: Screen share track switching
*For any* participant who stops screen sharing, the ParticipantView should revert to displaying their videoTrack
**Validates: Requirements 8.5**

## Error Handling

### Video Layout Error Handling

The component already handles errors appropriately:

- **Call join failures**: Display error message with retry option
- **Missing props**: Component returns null or loading state
- **Call leave failures**: Log error and close UI anyway

### Incoming Call Error Handling

Additional error handling for incoming call reliability:

- **VideoClient initialization failure**: Log error, set videoClient to null, allow chat to continue working
- **Event listener registration failure**: Log error with full context, attempt re-registration on next render
- **Missing caller metadata**: Use fallback values ("Unknown" for name, placeholder for avatar)
- **Duplicate call.ring events**: Check if popup is already showing before updating state
- **VideoClient disconnection**: Attempt automatic reconnection with exponential backoff
- **call.ring event with invalid data**: Validate event structure before processing, log and ignore invalid events

## Testing Strategy

### Unit Testing

We will write focused unit tests to verify:

1. **Component rendering**: Verify the component renders with correct class names and structure
2. **Prop handling**: Verify callbacks (onClose, onMinimize) are called correctly
3. **Conditional rendering**: Verify loading and error states display appropriately

### Property-Based Testing

We will use **React Testing Library** with **@fast-check/jest** for property-based testing.

Each property-based test will:
- Run a minimum of 100 iterations
- Generate random but valid input data
- Verify the correctness property holds for all inputs
- Be tagged with a comment referencing the design document property

### CSS Testing Approach

Since CSS properties cannot be directly tested with traditional unit tests, we will:

1. **Visual regression testing**: Use screenshot comparison (optional, manual verification)
2. **Computed style testing**: Use `getComputedStyle()` to verify CSS properties are applied
3. **Layout testing**: Verify element dimensions and positions using `getBoundingClientRect()`

### Integration Testing

Integration tests will verify:
- The component integrates correctly with Stream SDK components
- The layout responds correctly to viewport changes
- Controls remain properly positioned during call state changes
- VideoClient initialization completes before event listeners are registered
- Incoming call events trigger popup display correctly
- Event listeners remain active throughout the session
- Reconnection logic works after VideoClient disconnection

## Implementation Notes

### Key CSS Changes

1. **Container positioning**:
   ```css
   .inline-video-call {
     position: relative;  /* Establish positioning context */
     width: 100%;
     height: 420px;
   }
   ```

2. **Content area**:
   ```css
   .inline-video-content {
     position: absolute;
     top: 53px;  /* Below header */
     left: 0;
     right: 0;
     bottom: 0;
   }
   ```

3. **Controls overlay**:
   ```css
   .inline-video-controls {
     position: absolute;
     bottom: 16px;
     left: 50%;
     transform: translateX(-50%);
     z-index: 10;
   }
   ```

4. **Video scaling**:
   ```css
   .str-video__participant-view video {
     object-fit: cover !important;
     width: 100% !important;
     height: 100% !important;
   }
   ```

### Stream SDK Customization

The Stream SDK components will be customized using CSS overrides with `!important` flags to ensure our styles take precedence over the default SDK styles.

### Browser Compatibility

The solution uses standard CSS properties supported in all modern browsers:
- `position: relative/absolute`
- `object-fit: cover`
- `transform: translateX()`
- `border-radius`

No polyfills or fallbacks are needed.

### Incoming Call Fixes Implementation

**StreamContext Changes**:

1. **Verify VideoClient connection**: After creating VideoClient, ensure it's fully connected before setting state
2. **Add connection state logging**: Log when VideoClient transitions to connected state
3. **Handle initialization errors gracefully**: If VideoClient fails, set it to null but allow chat to work

```javascript
// In StreamContext initialization
const newVideoClient = new StreamVideoClient({ apiKey, user, token });

// The StreamVideoClient constructor already establishes connection
// We just need to verify it's ready before setting state
console.log('VideoClient created and connecting...');

setVideoClient(newVideoClient);
videoClientRef.current = newVideoClient;
console.log('VideoClient ready for event listeners');
```

**StreamChatComponent Changes**:

1. **Update useEffect dependencies**: Include `isReady` in the dependency array for event listener registration
2. **Add guard clause**: Only register listeners when both `videoClient` exists AND `isReady` is true
3. **Add duplicate event protection**: Check if popup is already showing before updating state
4. **Enhance logging**: Log all event data and state changes for debugging

```javascript
useEffect(() => {
  if (!videoClient || !isReady) {
    console.log('VideoClient not ready, skipping event listener registration');
    return;
  }

  console.log('Registering call.ring event listener');

  const handleIncomingCall = (event) => {
    console.log('call.ring event received:', event);
    
    // Prevent duplicate popups
    if (showIncomingCall) {
      console.log('Popup already showing, ignoring duplicate event');
      return;
    }

    // Extract caller info and show popup
    // ... rest of handler
  };

  videoClient.on('call.ring', handleIncomingCall);

  return () => {
    videoClient.off('call.ring', handleIncomingCall);
  };
}, [videoClient, isReady, showIncomingCall]);  // Add isReady and showIncomingCall
```

**Root Cause Analysis**:

The incoming call popup issue occurs because:
1. Event listeners are registered before VideoClient is fully ready to receive events
2. The `isReady` flag is set based on chat client readiness, not video client readiness
3. Missing dependency in useEffect causes stale closures over state variables
4. No protection against duplicate event firing

The fix ensures proper initialization order and state management.

### Screen Share Display Implementation

**Current Issue**: The InlineVideoCall component only renders `videoTrack` for participants, which means screen shares are not displayed even when a participant starts sharing their screen.

**Solution**: Modify the ParticipantView rendering to detect and display screen share tracks:

```javascript
// Check if participant has screen share active
const hasScreenShare = participant.publishedTracks.includes('screenShareTrack');

// Render both video and screen share if available
{hasScreenShare && (
  <ParticipantView
    participant={participant}
    trackType="screenShareTrack"
  />
)}
<ParticipantView
  participant={participant}
  trackType="videoTrack"
/>
```

**Layout Adaptation**: When screen share is active, the layout should prioritize the screen share:
- Screen share should be displayed in a larger tile
- Regular video feeds should be smaller or hidden
- Use CSS grid to adapt the layout dynamically based on screen share presence
